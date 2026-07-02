import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Trilha } from '../../core/models/trilha.model';
import { AuthService } from '../../core/services/auth.service';
import { MapStateService } from '../../core/services/map-state.service';
import { ToastService } from '../../core/services/toast.service';
import { TrilhaService } from '../../core/services/trilha.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { Util } from '../../core/Utils.ts/Util';
import { AvaliacoesUsuariosComponent } from '../avaliacoes-usuarios/avaliacoes-usuarios.component';
import { FormularioAvaliacaoComponent } from '../formulario-avaliacao/formulario-avaliacao.component';

@Component({
  selector: 'app-card-trilha',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvaliacoesUsuariosComponent, FormularioAvaliacaoComponent, DecimalPipe],
  templateUrl: './card-trilha.component.html',
  styleUrl: './card-trilha.component.scss',
})
export class CardTrilhaComponent {
  trilha = input.required<Trilha>();
  minhaPosicao = input<google.maps.LatLngLiteral>();
  fechar = output<void>();

  private trilhaService = inject(TrilhaService);
  private authService = inject(AuthService);
  private mapState = inject(MapStateService);
  private toast = inject(ToastService);
  private usuarioService = inject(UsuarioService);

  mensagemCheckin = signal('');
  tipoMensagem = signal<'sucesso' | 'erro' | ''>('');
  checkinRealizado = signal(false);
  verificandoCheckin = signal(false);
  pessoasRecentes = signal(0);
  totalVisitas = signal(0);
  mostrarFormAvaliacao = signal(false);
  checkinId = signal<number | undefined>(undefined);

  alturaCard = signal<string | null>(null);
  isDragging = signal(false);

  private readonly SNAPS = [30, 58, 88];
  private startY = 0;
  private startVh = 58;

  podeFazerCheckin = computed(() => {
    const pos = this.minhaPosicao();
    const t = this.trilha();
    if (!pos || !t.latitude || !t.longitude) return false;
    return Util.calcularDistanciaMetros(pos.lat, pos.lng, t.latitude, t.longitude) <= 250;
  });

  constructor() {
    effect(() => {
      const trilha = this.trilha();
      this.carregarCheckinsRecentes(trilha.id);
      this.verificarCheckinHoje(trilha.id);
    });

    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      this.alturaCard.set('58vh');
    }
  }

  private verificarCheckinHoje(trilhaId: number) {
    this.verificandoCheckin.set(false);
    this.checkinRealizado.set(false);
    this.mensagemCheckin.set('');
    this.tipoMensagem.set('');
  }

  private carregarCheckinsRecentes(trilhaId: number) {
    this.pessoasRecentes.set(0);
    this.totalVisitas.set(0);
    this.trilhaService.contarCheckinsRecentes(trilhaId).subscribe({
      next: (res) => this.pessoasRecentes.set(res.quantidade),
    });
    this.trilhaService.contarTotalVisitas(trilhaId).subscribe({
      next: (res) => this.totalVisitas.set(res.total),
    });
  }

  fazerCheckin() {
    const usuario = this.authService.getUser();
    const pos = this.minhaPosicao();
    const trilha = this.trilha();
    if (!usuario || !pos) return;

    this.mensagemCheckin.set('');
    this.tipoMensagem.set('');

    this.trilhaService.checkin(trilha.id, usuario.id, pos.lat, pos.lng).subscribe({
      next: (res) => {
        this.checkinRealizado.set(true);
        this.tipoMensagem.set('sucesso');
        const msg = res?.mensagem ?? 'Check-in na trilha realizado! +100 XP 🥾';
        this.mensagemCheckin.set(msg);
        this.toast.success(msg);
        this.usuarioService.verificarNovasConquistas();
        this.carregarCheckinsRecentes(trilha.id);
      },
      error: (err) => {
        this.tipoMensagem.set('erro');
        const msg = err?.error?.mensagem ?? 'Erro ao realizar check-in.';
        this.mensagemCheckin.set(msg);
        this.toast.error(msg);
      },
    });
  }

  fecharCard() {
    this.mapState.trilhaIndependenteAberta.set(false);
    this.fechar.emit();
  }

  estrelaDisplay(nota?: number): string {
    if (!nota || nota === 0) return 'Sem avaliações';
    return `${nota.toFixed(1)} ⭐`;
  }

  classeDificuldade(dificuldade?: string): string {
    if (!dificuldade) return '';
    const d = dificuldade.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (d === 'facil') return 'dif-facil';
    if (d === 'moderada') return 'dif-moderada';
    if (d === 'dificil') return 'dif-dificil';
    if (d === 'extrema') return 'dif-extrema';
    return '';
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
      this.fecharCard();
      return;
    }

    const nearest = this.SNAPS.reduce((prev, snap) =>
      Math.abs(snap - current) < Math.abs(prev - current) ? snap : prev,
    );
    this.alturaCard.set(`${nearest}vh`);
  }
}
