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
import { CriarTrilhaRequest, Trilha } from '../../core/models/trilha.model';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { ToastService } from '../../core/services/toast.service';
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

  finalizando = signal(false);
  salvando = signal(false);
  distanciaTotal = signal(0);

  private waypoints: { ordem: number; latitude: number; longitude: number }[] = [];
  private watchId?: number;
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
    this.iniciar();
  }

  ngOnDestroy(): void {
    this.pararGravacao();
  }

  iniciar(): void {
    this.waypoints = [];
    this.ultimoPonto = undefined;
    this.distanciaTotal.set(0);

    if (!navigator.geolocation) {
      this.toast.error('Geolocalização não disponível neste dispositivo.');
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.adicionarWaypoint(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        console.error('Erro GPS:', err);
        this.toast.error('Erro ao obter localização GPS.');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
  }

  finalizar(): void {
    if (this.waypoints.length < 2) {
      this.toast.warning('Grave pelo menos 2 pontos GPS antes de finalizar.');
      return;
    }
    this.pararGravacao();
    this.finalizando.set(true);
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
    this.iniciar();
  }

  private pararGravacao(): void {
    if (this.watchId !== undefined) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = undefined;
    }
  }

  private adicionarWaypoint(lat: number, lng: number): void {
    if (this.ultimoPonto) {
      const dist = Util.calcularDistanciaMetros(this.ultimoPonto.lat, this.ultimoPonto.lng, lat, lng);
      if (dist < this.MIN_DIST_METROS) return;
      this.distanciaTotal.update((d) => d + dist);
    }

    this.waypoints.push({ ordem: this.waypoints.length, latitude: lat, longitude: lng });
    this.ultimoPonto = { lat, lng };

    // Estende a polyline ao vivo no mapa
    this.polylineAoVivo()?.getPath().push(new google.maps.LatLng(lat, lng));

    this.cdr.markForCheck();
  }
}
