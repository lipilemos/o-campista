import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SalaChat } from '../../../core/models/chat-room.model';
import { ChatNotificationService } from '../../../core/services/chat-notification.service';
import { ChatRoomService } from '../../../core/services/chat-room.service';

@Component({
  selector: 'app-chat-list',
  imports: [DatePipe],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatListComponent {
  private router = inject(Router);
  private chatRoomService = inject(ChatRoomService);
  private chatNotification = inject(ChatNotificationService);

  filtro = signal('');

  salas = computed(() => this.chatRoomService.salas());
  carregando = computed(() => this.chatRoomService.carregandoSalas());
  naoLidasPorSala = computed(() => this.chatNotification.naoLidasPorSala());

  salasFiltradas = computed(() => {
    const termo = this.filtro().toLowerCase();
    if (!termo) return this.salas();
    return this.salas().filter((s) => s.nome.toLowerCase().includes(termo));
  });

  constructor() {
    this.chatRoomService.carregarSalas();
  }

  abrirSala(sala: SalaChat): void {
    this.router.navigate(['/chat', sala.id]);
  }

  criarGrupo(): void {
    this.router.navigate(['/chat', 'criar-grupo']);
  }

  entrarGrupo(): void {
    this.router.navigate(['/chat', 'entrar-grupo']);
  }

  naoLidas(sala: SalaChat): number {
    const doServidor = sala.totalNaoLidas ?? 0;
    const doRealtime = this.naoLidasPorSala()[sala.id] ?? 0;
    return Math.max(doServidor, doRealtime);
  }
}
