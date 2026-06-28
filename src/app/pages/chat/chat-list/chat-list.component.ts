import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SalaChat } from '../../../core/models/chat-room.model';
import { ChatNotificationService } from '../../../core/services/chat-notification.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { ImgFallbackDirective } from '../../../core/directives/img-fallback.directive';
import { ChatRoomService } from '../../../core/services/chat-room.service';

@Component({
  selector: 'app-chat-list',
  imports: [DatePipe, ImgFallbackDirective],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatListComponent {
  private router = inject(Router);
  private chatRoomService = inject(ChatRoomService);
  private chatNotification = inject(ChatNotificationService);
  private confirmDialog = inject(ConfirmDialogService);
  private toast = inject(ToastService);

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

  sairDoGrupo(event: Event, sala: SalaChat): void {
    event.stopPropagation();
    this.confirmDialog
      .confirmar({
        titulo: 'Sair do grupo',
        mensagem: `Tem certeza que deseja sair do grupo "${sala.nome}"?`,
        textoBotaoConfirmar: 'Sair',
      })
      .subscribe((confirmado) => {
        if (!confirmado) return;
        this.chatRoomService.sairDoGrupo(sala.id).subscribe({
          next: () => {
            this.toast.success('Você saiu do grupo.');
            this.chatRoomService.carregarSalas();
          },
          error: () => {
            this.toast.error('Não foi possível sair do grupo.');
          },
        });
      });
  }
}
