import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CampingRanking, RankingItem } from '../../core/models/ranking.model';
import { RankingService } from '../../core/services/ranking.service';
import { SocialService } from '../../core/services/social.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ImgFallbackDirective } from '../../core/directives/img-fallback.directive';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

type Aba = 'global' | 'seguidos' | 'campings';

@Component({
  selector: 'app-ranking',
  imports: [RouterLink, DecimalPipe, ImgFallbackDirective, TranslatePipe],
  templateUrl: './ranking.component.html',
  styleUrl: './ranking.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RankingComponent {
  private rankingService = inject(RankingService);
  private socialService = inject(SocialService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  abaAtiva = signal<Aba>('global');
  usuarios = signal<RankingItem[]>([]);
  campings = signal<CampingRanking[]>([]);
  carregando = signal(false);
  erro = signal(false);
  semMais = signal(false);
  salvandoFollow = signal<string | null>(null);

  private pagina = 1;
  protected readonly LIMITE_USUARIOS = 50;
  private readonly LIMITE_CAMPINGS = 20;

  meuId = (this.authService.obterUsuarioLogado()?.id as string) ?? '';

  minhaLinhaGlobal = computed(
    () => this.usuarios().find((u) => u.usuarioId === this.meuId) ?? null,
  );

  constructor() {
    this.carregar();
  }

  trocarAba(aba: Aba): void {
    if (this.abaAtiva() === aba) return;
    this.abaAtiva.set(aba);
    this.pagina = 1;
    this.usuarios.set([]);
    this.campings.set([]);
    this.semMais.set(false);
    this.carregar();
  }

  carregar(): void {
    if (this.carregando()) return;
    this.carregando.set(true);
    this.erro.set(false);

    const aba = this.abaAtiva();

    if (aba === 'global') {
      this.rankingService.getGlobal(this.pagina, this.LIMITE_USUARIOS).subscribe({
        next: (itens) => this.onUsuariosCarregados(itens),
        error: () => this.onErro(),
      });
    } else if (aba === 'seguidos') {
      this.rankingService.getSeguidos().subscribe({
        next: (itens) => {
          this.usuarios.set(itens);
          this.semMais.set(true);
          this.carregando.set(false);
        },
        error: () => this.onErro(),
      });
    } else {
      this.rankingService.getCampings(this.pagina, this.LIMITE_CAMPINGS).subscribe({
        next: (itens) => {
          this.campings.update((prev) => (this.pagina === 1 ? itens : [...prev, ...itens]));
          this.semMais.set(itens.length < this.LIMITE_CAMPINGS);
          this.pagina++;
          this.carregando.set(false);
        },
        error: () => this.onErro(),
      });
    }
  }

  carregarMais(): void {
    this.carregar();
  }

  toggleFollow(item: RankingItem): void {
    if (this.salvandoFollow()) return;
    this.salvandoFollow.set(item.usuarioId);

    const obs = item.estouSeguindo
      ? this.socialService.desseguir(item.usuarioId)
      : this.socialService.seguir(item.usuarioId);

    obs.subscribe({
      next: () => {
        this.usuarios.update((prev) =>
          prev.map((u) =>
            u.usuarioId === item.usuarioId ? { ...u, estouSeguindo: !u.estouSeguindo } : u,
          ),
        );
        this.salvandoFollow.set(null);
      },
      error: () => {
        this.toast.error('ranking.follow-error');
        this.salvandoFollow.set(null);
      },
    });
  }

  medalha(posicao: number): string {
    if (posicao === 1) return '🥇';
    if (posicao === 2) return '🥈';
    if (posicao === 3) return '🥉';
    return `${posicao}º`;
  }

  private onUsuariosCarregados(itens: RankingItem[]): void {
    this.usuarios.update((prev) => (this.pagina === 1 ? itens : [...prev, ...itens]));
    this.semMais.set(itens.length < this.LIMITE_USUARIOS);
    this.pagina++;
    this.carregando.set(false);
  }

  private onErro(): void {
    this.erro.set(true);
    this.carregando.set(false);
  }
}
