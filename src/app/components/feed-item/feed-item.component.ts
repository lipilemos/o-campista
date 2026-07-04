import { DatePipe } from '@angular/common';
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
import { RouterLink } from '@angular/router';
import { Comentario, FeedItem } from '../../core/models/feed-item.model';
import { ImgFallbackDirective } from '../../core/directives/img-fallback.directive';
import { SocialService } from '../../core/services/social.service';
import { ToastService } from '../../core/services/toast.service';
import { I18nService } from '../../core/services/i18n.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-feed-item',
  imports: [DatePipe, RouterLink, ImgFallbackDirective, TranslatePipe],
  templateUrl: './feed-item.component.html',
  styleUrl: './feed-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedItemComponent {
  item = input.required<FeedItem>();
  meuId = input.required<string>();

  deletar = output<number>();

  private socialService = inject(SocialService);
  private toast = inject(ToastService);
  private i18n = inject(I18nService);

  curtiu = signal(false);
  totalCurtidas = signal(0);
  curtindo = signal(false);

  comentariosAbertos = signal(false);
  comentarios = signal<Comentario[]>([]);
  loadingComentarios = signal(false);
  totalComentarios = signal(0);
  novoComentario = signal('');
  enviando = signal(false);
  comentariosCarregados = signal(false);

  ehPost = computed(() => this.item().tipo === 'post');
  ehMeu = computed(() => this.item().usuarioId === this.meuId());

  constructor() {
    effect(() => {
      const it = this.item();
      this.curtiu.set(it.curtiu ?? false);
      this.totalCurtidas.set(it.totalCurtidas ?? 0);
      this.totalComentarios.set(it.totalComentarios ?? 0);
    });
  }

  toggleCurtir(): void {
    if (this.curtindo()) return;
    const postId = this.item().postId;
    if (!postId) return;

    const estavaCurtindo = this.curtiu();
    this.curtiu.set(!estavaCurtindo);
    this.totalCurtidas.update((n) => (estavaCurtindo ? n - 1 : n + 1));
    this.curtindo.set(true);

    const obs = estavaCurtindo
      ? this.socialService.descurtir(postId)
      : this.socialService.curtir(postId);

    obs.subscribe({
      next: () => this.curtindo.set(false),
      error: () => {
        this.curtiu.set(estavaCurtindo);
        this.totalCurtidas.update((n) => (estavaCurtindo ? n + 1 : n - 1));
        this.curtindo.set(false);
        this.toast.error('Não foi possível registrar a curtida.');
      },
    });
  }

  toggleComentarios(): void {
    const abrir = !this.comentariosAbertos();
    this.comentariosAbertos.set(abrir);
    if (abrir && !this.comentariosCarregados()) {
      this.carregarComentarios();
    }
  }

  carregarComentarios(): void {
    const postId = this.item().postId;
    if (!postId) return;
    this.loadingComentarios.set(true);
    this.socialService.getComentarios(postId).subscribe({
      next: (lista) => {
        this.comentarios.set(lista);
        this.totalComentarios.set(lista.length);
        this.comentariosCarregados.set(true);
        this.loadingComentarios.set(false);
      },
      error: () => {
        this.loadingComentarios.set(false);
        this.toast.error(this.i18n.t('feed.comentarios.erro-carregar'));
      },
    });
  }

  enviarComentario(): void {
    const texto = this.novoComentario().trim();
    if (!texto || texto.length > 500 || this.enviando()) return;
    const postId = this.item().postId;
    if (!postId) return;

    this.enviando.set(true);
    this.socialService.criarComentario(postId, texto).subscribe({
      next: (comentario) => {
        this.comentarios.update((lista) => [comentario, ...lista]);
        this.totalComentarios.update((n) => n + 1);
        this.novoComentario.set('');
        this.enviando.set(false);
      },
      error: () => {
        this.enviando.set(false);
        this.toast.error(this.i18n.t('feed.comentarios.erro-enviar'));
      },
    });
  }

  deletarComentario(comentarioId: number): void {
    this.socialService.deletarComentario(comentarioId).subscribe({
      next: () => {
        this.comentarios.update((lista) => lista.filter((c) => c.id !== comentarioId));
        this.totalComentarios.update((n) => Math.max(0, n - 1));
      },
      error: () => {
        this.toast.error('Não foi possível deletar o comentário.');
      },
    });
  }

  confirmarDeletar(): void {
    const postId = this.item().postId;
    if (!postId) return;
    this.deletar.emit(postId);
  }

  onNovoComentarioInput(event: Event): void {
    this.novoComentario.set((event.target as HTMLTextAreaElement).value);
  }

  onComentarioKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarComentario();
    }
  }
}
