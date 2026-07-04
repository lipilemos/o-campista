import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FeedItem } from '../../core/models/feed-item.model';
import { SocialService } from '../../core/services/social.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { FeedItemComponent } from '../../components/feed-item/feed-item.component';
import { PostCreateComponent } from '../../components/post-create/post-create.component';
import { SugestoesUsuariosComponent } from '../../components/sugestoes-usuarios/sugestoes-usuarios.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

type Aba = 'seguindo' | 'descobrir';

@Component({
  selector: 'app-feed',
  imports: [FeedItemComponent, PostCreateComponent, SugestoesUsuariosComponent, TranslatePipe],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedComponent {
  private socialService = inject(SocialService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  abaAtiva = signal<Aba>('seguindo');
  items = signal<FeedItem[]>([]);
  carregando = signal(false);
  erro = signal(false);
  mostrarCriarPost = signal(false);
  semMais = signal(false);

  private pagina = 1;
  private readonly LIMITE = 20;

  meuId = (this.authService.obterUsuarioLogado()?.id as string) ?? '';

  constructor() {
    this.carregarFeed();
  }

  trocarAba(aba: Aba): void {
    if (this.abaAtiva() === aba) return;
    this.abaAtiva.set(aba);
    this.pagina = 1;
    this.items.set([]);
    this.semMais.set(false);
    this.carregarFeed();
  }

  carregarFeed(): void {
    if (this.carregando()) return;
    this.carregando.set(true);
    this.erro.set(false);

    const obs =
      this.abaAtiva() === 'seguindo'
        ? this.socialService.getFeed(this.pagina, this.LIMITE)
        : this.socialService.getDescobrir(this.pagina, this.LIMITE);

    obs.subscribe({
      next: (novos) => {
        const lista = Array.isArray(novos) ? novos : [];
        this.items.update((prev) => (this.pagina === 1 ? lista : [...prev, ...lista]));
        this.semMais.set(lista.length < this.LIMITE);
        this.pagina++;
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set(true);
        this.carregando.set(false);
      },
    });
  }

  carregarMais(): void {
    this.carregarFeed();
  }

  onPostPublicado(post: FeedItem): void {
    this.mostrarCriarPost.set(false);
    this.items.update((prev) => [post, ...prev]);
    this.toast.success('post.created');
  }

  onDeletarPost(postId: number): void {
    this.confirmDialog
      .confirmar({
        titulo: 'Deletar post',
        mensagem: 'Tem certeza que deseja deletar este post?',
        textoBotaoConfirmar: 'Deletar',
        textoBotaoCancelar: 'Cancelar',
      })
      .subscribe((confirmado) => {
        if (!confirmado) return;
        this.socialService.deletarPost(postId).subscribe({
          next: () => {
            this.items.update((prev) => prev.filter((i) => i.postId !== postId));
            this.toast.success('post.deleted');
          },
          error: () => this.toast.error('feed.error'),
        });
      });
  }
}
