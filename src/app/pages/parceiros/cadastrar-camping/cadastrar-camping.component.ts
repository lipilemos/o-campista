import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CampingProximo,
  Recurso,
  TipoCampingComDono,
} from '../../../core/models/camping-parceiro.model';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { CampingParceiroService } from '../../../core/services/camping-parceiro.service';
import { I18nService } from '../../../core/services/i18n.service';
import { LocationService } from '../../../core/services/location.service';
import { ToastService } from '../../../core/services/toast.service';

type Passo = 'posicao' | 'dados';

export const UFS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
];

@Component({
  selector: 'app-cadastrar-camping',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './cadastrar-camping.component.html',
  styleUrl: './cadastrar-camping.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CadastrarCampingComponent implements AfterViewInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private service = inject(CampingParceiroService);
  private location = inject(LocationService);
  private toast = inject(ToastService);
  private i18n = inject(I18nService);
  private destroyRef = inject(DestroyRef);

  private mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');
  private map?: google.maps.Map;
  private marker?: google.maps.marker.AdvancedMarkerElement;
  private posicaoAlterada$ = new Subject<google.maps.LatLngLiteral>();

  readonly ufs = UFS;
  readonly tipos: TipoCampingComDono[] = ['camping', 'pesca'];

  passo = signal<Passo>('posicao');
  posicao = signal<google.maps.LatLngLiteral | null>(null);
  proximos = signal<CampingProximo[]>([]);
  recursos = signal<Recurso[]>([]);
  recursosSelecionados = signal<Set<number>>(new Set());
  enviando = signal(false);

  podeContinuar = computed(() => this.posicao() !== null);

  form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(200)]],
    tipo: ['camping' as TipoCampingComDono, [Validators.required]],
    cidade: ['', [Validators.required, Validators.maxLength(100)]],
    estado: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}$/)]],
    descricao: ['', [Validators.maxLength(2000)]],
    endereco: ['', [Validators.maxLength(500)]],
    telefone: ['', [Validators.maxLength(30)]],
  });

  constructor() {
    this.posicaoAlterada$
      .pipe(
        debounceTime(400),
        switchMap((p) => this.service.buscarProximos(p.lat, p.lng)),
        takeUntilDestroyed(),
      )
      .subscribe({ next: (lista) => this.proximos.set(lista), error: () => this.proximos.set([]) });

    this.service
      .listarRecursos()
      .pipe(takeUntilDestroyed())
      .subscribe({ next: (lista) => this.recursos.set(lista) });
  }

  ngAfterViewInit(): void {
    this.usarMinhaPosicao();
  }

  usarMinhaPosicao(): void {
    this.location
      .getCurrentPosition()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((pos) => this.definirPosicao({ lat: pos.latitude, lng: pos.longitude }, true));
  }

  continuar(): void {
    if (!this.podeContinuar()) return;
    this.passo.set('dados');
  }

  voltarPasso(): void {
    this.passo.set('posicao');
  }

  voltar(): void {
    this.router.navigate(['/parceiros']);
  }

  reivindicar(campingId: number): void {
    this.service.reivindicar(campingId).subscribe({
      next: () => {
        this.toast.success(this.i18n.t('parceiro.cadastro.claimed'));
        this.router.navigate(['/parceiros']);
      },
      error: (err: { status?: number }) =>
        this.toast.error(
          this.i18n.t(
            err.status === 409 ? 'parceiro.cadastro.claim-conflict' : 'parceiro.cadastro.error',
          ),
        ),
    });
  }

  alternarRecurso(id: number): void {
    this.recursosSelecionados.update((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  recursoSelecionado(id: number): boolean {
    return this.recursosSelecionados().has(id);
  }

  enviar(): void {
    const posicao = this.posicao();
    if (this.form.invalid || !posicao) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.enviando()) return;
    this.enviando.set(true);

    const v = this.form.getRawValue();
    this.service
      .criar({
        nome: v.nome.trim(),
        tipo: v.tipo,
        cidade: v.cidade.trim(),
        estado: v.estado,
        descricao: v.descricao.trim() || undefined,
        endereco: v.endereco.trim() || undefined,
        telefone: v.telefone.trim() || undefined,
        latitude: posicao.lat,
        longitude: posicao.lng,
        recursosIds: [...this.recursosSelecionados()],
      })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.toast.success(this.i18n.t('parceiro.cadastro.created'));
          this.router.navigate(['/parceiros']);
        },
        error: () => {
          this.enviando.set(false);
          this.toast.error(this.i18n.t('parceiro.cadastro.error'));
        },
      });
  }

  campoInvalido(nome: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[nome];
    return c.invalid && c.touched;
  }

  /** Centraliza o mapa e o marcador; cria o mapa na primeira chamada (só fora de testes/jsdom). */
  private definirPosicao(p: google.maps.LatLngLiteral, centralizar: boolean): void {
    this.posicao.set(p);
    this.posicaoAlterada$.next(p);

    const container = this.mapContainer()?.nativeElement;
    if (!container || typeof google === 'undefined') return;

    if (!this.map) {
      this.map = new google.maps.Map(container, { center: p, zoom: 15, mapId: environment.idMaps });
      this.marker = new google.maps.marker.AdvancedMarkerElement({
        map: this.map,
        position: p,
        gmpDraggable: true,
      });
      this.marker.addListener('dragend', () => {
        const pos = this.marker?.position as google.maps.LatLngLiteral | undefined;
        if (pos) this.definirPosicao({ lat: Number(pos.lat), lng: Number(pos.lng) }, false);
      });
      this.map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) this.definirPosicao(e.latLng.toJSON(), false);
      });
      return;
    }

    if (this.marker) this.marker.position = p;
    if (centralizar) this.map.panTo(p);
  }
}
