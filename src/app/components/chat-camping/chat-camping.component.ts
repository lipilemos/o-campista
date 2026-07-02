import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { MensagemChat } from '../../core/models/chat.model';
import { AuthService } from '../../core/services/auth.service';
import { ImgFallbackDirective } from '../../core/directives/img-fallback.directive';
import { ChatService } from '../../core/services/chat.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-chat-camping',
  imports: [DatePipe, ImgFallbackDirective, TranslatePipe],
  templateUrl: './chat-camping.component.html',
  styleUrl: './chat-camping.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatCampingComponent {
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  chatService = inject(ChatService);
  campingId = input.required<number>();

  chatAberto = signal(false);
  textoMensagem = signal('');

  mensagens = computed(() => this.chatService.mensagens());
  conectado = computed(() => this.chatService.conectado());

  private mensagensContainer = viewChild<ElementRef>('mensagensContainer');

  constructor() {
    effect(() => {
      this.mensagens();
      const container = this.mensagensContainer()?.nativeElement;
      if (container) {
        setTimeout(() => (container.scrollTop = container.scrollHeight));
      }
    });

    this.destroyRef.onDestroy(() => this.chatService.desconectar());
  }

  abrirChat(): void {
    this.chatAberto.set(true);
    this.chatService.conectar(this.campingId());
  }

  fecharChat(): void {
    this.chatAberto.set(false);
    this.chatService.desconectar();
  }

  enviar(): void {
    const texto = this.textoMensagem().trim();
    if (!texto) return;
    this.chatService.enviarMensagem(texto);
    this.textoMensagem.set('');
  }

  private usuarioIdAtual = String(this.authService.getUser()?.id ?? '').toLowerCase();

  ehMinhaMensagem(msg: MensagemChat): boolean {
    return String(msg.usuarioId).toLowerCase() === this.usuarioIdAtual;
  }
}
