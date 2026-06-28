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
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
import { MensagemChat } from '../../core/models/chat.model';

@Component({
  selector: 'app-chat-camping',
  imports: [DatePipe],
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

  ehMinhaMensagem(msg: MensagemChat): boolean {
    return msg.usuarioId === this.authService.getUser()?.id;
  }
}
