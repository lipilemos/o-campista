import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { MensagemSalaChat, SalaChat } from '../../../core/models/chat-room.model';
import { ImgFallbackDirective } from '../../../core/directives/img-fallback.directive';
import { AuthService } from '../../../core/services/auth.service';
import { ChatNotificationService } from '../../../core/services/chat-notification.service';
import { ChatRoomService } from '../../../core/services/chat-room.service';

@Component({
  selector: 'app-chat-conversation',
  imports: [DatePipe, ImgFallbackDirective],
  templateUrl: './chat-conversation.component.html',
  styleUrl: './chat-conversation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatConversationComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private chatNotification = inject(ChatNotificationService);
  private http = inject(HttpClient);
  chatRoomService = inject(ChatRoomService);

  private meuId = this.authService.getUser()?.id;

  salaId = signal(0);
  salaNome = signal('');
  salaTipo = signal('');
  textoMensagem = signal('');
  private digitandoTimeout: ReturnType<typeof setTimeout> | null = null;

  mensagens = computed(() => this.chatRoomService.mensagens());
  conectado = computed(() => this.chatRoomService.conectado());
  podeEnviar = computed(() => this.chatRoomService.podeEnviar());
  digitando = computed(() => this.chatRoomService.digitando());

  private mensagensContainer = viewChild<ElementRef>('mensagensContainer');

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('salaId'));
      if (id) {
        this.salaId.set(id);
        this.chatRoomService.conectarSala(id);
        this.chatNotification.marcarComoLida(id);

        const salas = this.chatRoomService.salas();
        const sala = salas.find((s) => s.id === id);
        if (sala) {
          this.salaNome.set(sala.nome);
          this.salaTipo.set(sala.tipo);
        } else {
          this.carregarInfoSala(id);
        }
      }
    });

    effect(() => {
      this.mensagens();
      const container = this.mensagensContainer()?.nativeElement;
      if (container) {
        setTimeout(() => (container.scrollTop = container.scrollHeight));
      }
    });

    this.destroyRef.onDestroy(() => this.chatRoomService.desconectarSala());
  }

  voltar(): void {
    this.router.navigate(['/chat']);
  }

  enviar(): void {
    const texto = this.textoMensagem().trim();
    if (!texto) return;
    this.chatRoomService.enviarMensagem(texto);
    this.textoMensagem.set('');
  }

  onDigitando(): void {
    if (this.digitandoTimeout) return;
    this.chatRoomService.notificarDigitando();
    this.digitandoTimeout = setTimeout(() => {
      this.digitandoTimeout = null;
    }, 2000);
  }

  ehMinhaMensagem(msg: MensagemSalaChat): boolean {
    const msgId = String(msg.usuarioId).toLowerCase();
    const meuIdStr = String(this.meuId ?? '').toLowerCase();
    return msgId === meuIdStr;
  }

  private carregarInfoSala(salaId: number): void {
    this.http.get<SalaChat[]>(`${environment.apiUrl}/chat/salas`).subscribe({
      next: (salas) => {
        const sala = salas.find((s) => s.id === salaId);
        if (sala) {
          this.salaNome.set(sala.nome);
          this.salaTipo.set(sala.tipo);
        }
      },
    });
  }
}
