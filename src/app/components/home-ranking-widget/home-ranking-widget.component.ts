import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ImgFallbackDirective } from '../../core/directives/img-fallback.directive';
import { RankingItem } from '../../core/models/ranking.model';
import { UsuarioLogado } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';
import { RankingService } from '../../core/services/ranking.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

const LIMITE = 5;

@Component({
  selector: 'app-home-ranking-widget',
  imports: [RouterLink, ImgFallbackDirective, TranslatePipe],
  templateUrl: './home-ranking-widget.component.html',
  styleUrl: './home-ranking-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeRankingWidgetComponent {
  private rankingService = inject(RankingService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private i18n = inject(I18nService);

  usuario: UsuarioLogado | null = this.authService.obterUsuarioLogado();
  meuId = this.usuario?.id ?? '';

  ranking = signal<RankingItem[]>([]);
  carregando = signal(true);
  erro = signal(false);

  constructor() {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(false);
    this.rankingService.getGlobal(1, LIMITE).subscribe({
      next: (lista) => {
        this.ranking.set(lista);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set(true);
        this.carregando.set(false);
        this.toast.error(this.i18n.t('home.ranking.error'));
      },
    });
  }

  medalha(posicao: number): string {
    if (posicao === 1) return '🥇';
    if (posicao === 2) return '🥈';
    if (posicao === 3) return '🥉';
    return `${posicao}º`;
  }
}
