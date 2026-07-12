import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CriarTrilhaRequest, Trilha, TrilhaRascunho } from '../../core/models/trilha.model';
import { AuthService } from '../../core/services/auth.service';
import { BackgroundGeolocationService } from '../../core/services/background-geolocation.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { I18nService } from '../../core/services/i18n.service';
import { ToastService } from '../../core/services/toast.service';
import { TrilhaDraftService } from '../../core/services/trilha-draft.service';
import { TrilhaService } from '../../core/services/trilha.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { Util } from '../../core/Utils.ts/Util';

@Component({
  selector: 'app-criar-trilha',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './criar-trilha.component.html',
  styleUrl: './criar-trilha.component.scss',
})
export class CriarTrilhaComponent implements OnInit, OnDestroy {
  fechar = output<void>();
  trilhaCriada = output<Trilha>();

  // Polyline viva passada pelo MapComponent via input
  polylineAoVivo = input<google.maps.Polyline | undefined>(undefined);

  private trilhaService = inject(TrilhaService);
  private authService = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private confirmDialog = inject(ConfirmDialogService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private bgGeo = inject(BackgroundGeolocationService);
  private trilhaDraftService = inject(TrilhaDraftService);
  private i18n = inject(I18nService);

  finalizando = signal(false);
  salvando = signal(false);
  distanciaTotal = signal(0);

  private waypoints: { ordem: number; latitude: number; longitude: number }[] = [];
  private geoSub?: Subscription;
  private formSub?: Subscription;
  private ultimoPonto?: { lat: number; lng: number };
  private readonly MIN_DIST_METROS = 15;

  form = new FormGroup({
    nome: new FormControl('', [Validators.required, Validators.maxLength(200)]),
    dificuldade: new FormControl('', Validators.required),
    descricao: new FormControl(''),
  });

  get waypointCount(): number {
    return this.waypoints.length;
  }

  get distanciaKm(): number {
    return this.distanciaTotal() / 1000;
  }

  ngOnInit(): void {
    this.formSub = this.form.valueChanges.subscribe(() => {
      this.persistirRascunho(this.finalizando());
    });

    const rascunho = this.trilhaDraftService.obter();
    if (rascunho) {
      this.restaurarRascunho(rascunho);
      return;
    }

    this.iniciar();
  }

  ngOnDestroy(): void {
    this.pararGravacao();
    this.formSub?.unsubscribe();
  }

  iniciar(): void {
    this.waypoints = [];
    this.ultimoPonto = undefined;
    this.distanciaTotal.set(0);

    this.geoSub = this.bgGeo.watch().subscribe({
      next: (pos) => this.adicionarWaypoint(pos.coords.latitude, pos.coords.longitude),
      error: () => this.toast.error('Erro ao obter localização GPS.'),
    });
  }

  private restaurarRascunho(rascunho: TrilhaRascunho): void {
    this.waypoints = rascunho.waypoints;
    this.distanciaTotal.set(rascunho.distanciaTotal);

    const ultimo = this.waypoints[this.waypoints.length - 1];
    this.ultimoPonto = ultimo ? { lat: ultimo.latitude, lng: ultimo.longitude } : undefined;

    this.waypoints.forEach((ponto) => {
      this.polylineAoVivo()
        ?.getPath()
        .push(new google.maps.LatLng(ponto.latitude, ponto.longitude));
    });

    this.form.patchValue(
      {
        nome: rascunho.nome,
        dificuldade: rascunho.dificuldade,
        descricao: rascunho.descricao,
      },
      { emitEvent: false },
    );

    this.toast.info(this.i18n.t('trail.create.draft-restored', 'Rascunho de trilha restaurado.'));

    if (rascunho.finalizando) {
      this.finalizando.set(true);
      return;
    }

    this.geoSub = this.bgGeo.watch().subscribe({
      next: (pos) => this.adicionarWaypoint(pos.coords.latitude, pos.coords.longitude),
      error: () => this.toast.error('Erro ao obter localização GPS.'),
    });
  }

  finalizar(): void {
    if (this.waypoints.length < 2) {
      this.toast.warning('Grave pelo menos 2 pontos GPS antes de finalizar.');
      return;
    }
    this.pararGravacao();
    this.finalizando.set(true);
    this.persistirRascunho(true);
  }

  cancelar(): void {
    this.confirmDialog
      .confirmar({
        titulo: 'Cancelar gravação',
        mensagem: 'O percurso registrado será descartado. Deseja continuar?',
        textoBotaoConfirmar: 'Descartar',
        textoBotaoCancelar: 'Continuar gravando',
      })
      .subscribe((confirmado) => {
        if (confirmado) {
          this.pararGravacao();
          this.trilhaDraftService.limpar();
          this.fechar.emit();
        }
      });
  }

  salvar(): void {
    if (this.form.invalid) return;
    if (this.waypoints.length < 2) {
      this.toast.warning('Pontos insuficientes para salvar a trilha.');
      return;
    }

    const usuario = this.authService.getUser();
    if (!usuario) return;

    const request: CriarTrilhaRequest = {
      nome: this.form.value.nome!,
      descricao: this.form.value.descricao ?? undefined,
      dificuldade: this.form.value.dificuldade!,
      criadorId: usuario.id,
      criadorNome: usuario.nome,
      pontos: this.waypoints,
    };

    this.salvando.set(true);
    this.trilhaService.criar(request).subscribe({
      next: (trilha) => {
        this.salvando.set(false);
        this.trilhaDraftService.limpar();
        this.toast.success('Trilha criada! +500 XP 🥾');
        this.usuarioService.verificarNovasConquistas();
        this.trilhaCriada.emit(trilha);
      },
      error: (err) => {
        this.salvando.set(false);
        const msg = err?.error?.mensagem ?? 'Erro ao salvar a trilha.';
        this.toast.error(msg);
      },
    });
  }

  voltarParaForm(): void {
    this.finalizando.set(false);
    this.trilhaDraftService.limpar();
    this.iniciar();
  }

  private pararGravacao(): void {
    this.geoSub?.unsubscribe();
    this.geoSub = undefined;
  }

  private persistirRascunho(finalizando: boolean): void {
    this.trilhaDraftService.salvar({
      waypoints: this.waypoints,
      distanciaTotal: this.distanciaTotal(),
      finalizando,
      nome: this.form.value.nome ?? '',
      dificuldade: this.form.value.dificuldade ?? '',
      descricao: this.form.value.descricao ?? '',
    });
  }

  private adicionarWaypoint(lat: number, lng: number): void {
    if (this.ultimoPonto) {
      const dist = Util.calcularDistanciaMetros(
        this.ultimoPonto.lat,
        this.ultimoPonto.lng,
        lat,
        lng,
      );
      if (dist < this.MIN_DIST_METROS) return;
      this.distanciaTotal.update((d) => d + dist);
    }

    this.waypoints.push({ ordem: this.waypoints.length, latitude: lat, longitude: lng });
    this.ultimoPonto = { lat, lng };

    // Estende a polyline ao vivo no mapa
    this.polylineAoVivo()?.getPath().push(new google.maps.LatLng(lat, lng));

    this.persistirRascunho(false);
    this.cdr.markForCheck();
  }
}
