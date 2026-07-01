import { Component, effect, inject, input, output, signal } from '@angular/core';
import { CampingFoto } from '../../core/models/camping-foto.model';
import { Camping } from '../../core/models/camping.model';
import { CheckinRequestModel, CheckinResponseModel } from '../../core/models/checkin.model';
import { Trilha } from '../../core/models/trilha.model';
import { AuthService } from '../../core/services/auth.service';
import { CampingService } from '../../core/services/camping.service';
import { CheckinService } from '../../core/services/checkin.service';
import { MapStateService } from '../../core/services/map-state.service';
import { ToastService } from '../../core/services/toast.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { Util } from '../../core/Utils.ts/Util';
import { ImgFallbackDirective } from '../../core/directives/img-fallback.directive';
import { AvaliacoesUsuariosComponent } from '../avaliacoes-usuarios/avaliacoes-usuarios.component';
import { ChatCampingComponent } from '../chat-camping/chat-camping.component';
import { PhotoGalleryComponent } from '../photo-gallery/photo-gallery.component';
import { TrilhaListComponent } from '../trilha-list/trilha-list.component';

@Component({
  selector: 'app-card-camping',
  imports: [
    AvaliacoesUsuariosComponent,
    ChatCampingComponent,
    ImgFallbackDirective,
    TrilhaListComponent,
    PhotoGalleryComponent,
  ],
  templateUrl: './card-camping.component.html',
  styleUrl: './card-camping.component.scss',
})
export class CardCampingComponent {
  private authService = inject(AuthService);
  private checkinService = inject(CheckinService);
  private campingService = inject(CampingService);
  private mapState = inject(MapStateService);
  private toast = inject(ToastService);
  private usuarioService = inject(UsuarioService);

  campingSelecionado = input.required<Camping>();
  minhaPosicao = input<google.maps.LatLngLiteral>();
  fechar = output<void>();
  trilhaSelecionada = output<Trilha>();

  mensagemCheckin = signal('');
  tipoMensagem = signal<'sucesso' | 'erro' | ''>('');
  checkinRealizado = signal(false);
  verificandoCheckin = signal(false);
  pessoasRecentes = signal(0);
  fotos = signal<CampingFoto[]>([]);

  // --- drag (bottom sheet mobile) ---
  alturaCard = signal<string | null>(null);
  isDragging = signal(false);

  private readonly SNAPS = [30, 58, 88]; // vh: colapsado, padrão, expandido
  private startY = 0;
  private startVh = 58;

  constructor() {
    effect(() => {
      const camping = this.campingSelecionado();
      if (camping?.tipo === 'camping') {
        this.verificarCheckinHoje(camping.id);
      }
      this.carregarCheckinsRecentes(camping.id);
      this.campingService.obterFotos(camping.id).subscribe({
        next: (f) => this.fotos.set(f),
        error: () => this.fotos.set([]),
      });
    });

    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      this.alturaCard.set('58vh');
    }
  }

  private verificarCheckinHoje(campingId: number) {
    const usuario = this.authService.getUser();
    if (!usuario) return;

    this.verificandoCheckin.set(true);
    this.checkinRealizado.set(false);
    this.mensagemCheckin.set('');
    this.tipoMensagem.set('');

    const hoje = new Date().toISOString().split('T')[0];

    this.checkinService.obterHistorico(usuario.id).subscribe({
      next: (historico) => {
        const checkinHoje = historico.some(
          (h) => h.campingId === campingId && h.dataCriacao?.split('T')[0] === hoje,
        );
        if (checkinHoje) {
          this.checkinRealizado.set(true);
          this.tipoMensagem.set('sucesso');
          this.mensagemCheckin.set('Você já realizou check-in neste camping hoje.');
        }
        this.verificandoCheckin.set(false);
      },
      error: () => {
        this.verificandoCheckin.set(false);
      },
    });
  }

  private carregarCheckinsRecentes(campingId: number) {
    this.pessoasRecentes.set(0);
    this.checkinService.contarCheckinsRecentes(campingId).subscribe({
      next: (res) => this.pessoasRecentes.set(res.quantidade),
    });
  }

  obterEmojiTipo(): string {
    switch (this.campingSelecionado().tipo) {
      case 'camping':
        return '🏕️';
      case 'cachoeira':
        return '💧';
      case 'trilha':
        return '🥾';
      case 'mirante':
        return '🌄';
      case 'pesca':
        return '🎣';
      default:
        return '📍';
    }
  }

  fecharCampingInfo() {
    this.mapState.campingAberto.set(false);
    this.mapState.presenteAberto.set(false);
    this.fechar.emit();
  }

  podeFazerCheckin(): boolean {
    const pos = this.minhaPosicao();
    const camping = this.campingSelecionado();

    if (!pos || !camping) return false;
    if (camping.tipo !== 'camping') return false;

    const distancia = Util.calcularDistanciaMetros(
      pos.lat,
      pos.lng,
      camping.latitude,
      camping.longitude,
    );

    return distancia <= 250;
  }

  fazerCheckin() {
    this.mensagemCheckin.set('');
    this.tipoMensagem.set('');

    const usuario = this.authService.getUser();
    const pos = this.minhaPosicao();
    const camping = this.campingSelecionado();

    if (!usuario || !pos || !camping) return;

    const request: CheckinRequestModel = {
      usuarioId: usuario.id,
      campingId: camping.id,
      latitude: pos.lat,
      longitude: pos.lng,
    };

    this.checkinService.checkin(request).subscribe({
      next: (response: CheckinResponseModel) => {
        this.checkinRealizado.set(true);
        this.tipoMensagem.set('sucesso');
        this.mensagemCheckin.set(response?.mensagem ?? 'Check-in realizado com sucesso! +100 XP');
        this.toast.success(response?.mensagem ?? 'Check-in realizado com sucesso! +100 XP');
        this.usuarioService.verificarNovasConquistas();
      },

      error: (err: { error?: { mensagem?: string; erro?: string }; message?: string }) => {
        this.tipoMensagem.set('erro');
        if (err?.error?.mensagem === 'Você já realizou check-in neste camping hoje.') {
          this.checkinRealizado.set(true);
        }
        const msg =
          err?.error?.mensagem ?? err?.error?.erro ?? err?.message ?? 'Erro ao realizar check-in.';
        this.mensagemCheckin.set(msg);
        this.toast.error(msg);
      },
    });
  }

  // --- drag handlers (bottom sheet mobile) ---

  onDragStart(event: TouchEvent): void {
    this.isDragging.set(true);
    this.startY = event.touches[0].clientY;
    this.startVh = parseFloat(this.alturaCard() ?? '58');
  }

  onDragMove(event: TouchEvent): void {
    if (!this.isDragging()) return;
    const deltaVh = (this.startY - event.touches[0].clientY) / (window.innerHeight / 100);
    const next = Math.min(Math.max(this.startVh + deltaVh, 15), 92);
    this.alturaCard.set(`${next}vh`);
  }

  onDragEnd(): void {
    if (!this.isDragging()) return;
    this.isDragging.set(false);

    const current = parseFloat(this.alturaCard() ?? '58');

    if (current < 25) {
      this.fecharCampingInfo();
      return;
    }

    const nearest = this.SNAPS.reduce((prev, snap) =>
      Math.abs(snap - current) < Math.abs(prev - current) ? snap : prev,
    );
    this.alturaCard.set(`${nearest}vh`);
  }
}
