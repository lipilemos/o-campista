import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeedItemComponent } from '../feed-item/feed-item.component';
import { FeedItem } from '../../core/models/feed-item.model';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';
import { SocialService } from '../../core/services/social.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

const LIMITE = 3;

@Component({
  selector: 'app-home-feed-widget',
  imports: [FeedItemComponent, RouterLink, TranslatePipe],
  templateUrl: './home-feed-widget.component.html',
  styleUrl: './home-feed-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeFeedWidgetComponent {
  private socialService = inject(SocialService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private i18n = inject(I18nService);

  meuId = (this.authService.obterUsuarioLogado()?.id as string) ?? '';

  itens = signal<FeedItem[]>([]);
  carregando = signal(true);
  erro = signal(false);

  constructor() {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(false);
    this.socialService.getFeed(1, LIMITE).subscribe({
      next: (lista) => {
        this.itens.set(lista);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set(true);
        this.carregando.set(false);
        this.toast.error(this.i18n.t('home.feed.error'));
      },
    });
  }

  onDeletar(postId: number): void {
    this.socialService.deletarPost(postId).subscribe({
      next: () => this.itens.update((prev) => prev.filter((i) => i.postId !== postId)),
      error: () => this.toast.error(this.i18n.t('home.feed.error')),
    });
  }
}
