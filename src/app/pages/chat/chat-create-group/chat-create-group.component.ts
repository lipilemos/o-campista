import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ChatRoomService } from '../../../core/services/chat-room.service';

@Component({
  selector: 'app-chat-create-group',
  templateUrl: './chat-create-group.component.html',
  styleUrl: './chat-create-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatCreateGroupComponent {
  private router = inject(Router);
  private chatRoomService = inject(ChatRoomService);

  nomeGrupo = signal('');
  criando = signal(false);
  codigoCriado = signal('');
  erro = signal('');

  voltar(): void {
    this.router.navigate(['/chat']);
  }

  criar(): void {
    const nome = this.nomeGrupo().trim();
    if (!nome) return;

    this.criando.set(true);
    this.erro.set('');

    this.chatRoomService.criarGrupo({ nome }).subscribe({
      next: (res) => {
        this.criando.set(false);
        this.codigoCriado.set(res.codigoConvite);
      },
      error: (err) => {
        this.criando.set(false);
        this.erro.set(err.error?.mensagem ?? 'Erro ao criar grupo.');
      },
    });
  }

  copiarCodigo(): void {
    navigator.clipboard.writeText(this.codigoCriado());
  }

  irParaGrupo(): void {
    this.chatRoomService.carregarSalas();
    this.router.navigate(['/chat']);
  }
}
