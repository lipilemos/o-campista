import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatRoomService } from '../../../core/services/chat-room.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-chat-join-group',
  imports: [TranslatePipe],
  templateUrl: './chat-join-group.component.html',
  styleUrl: './chat-join-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatJoinGroupComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private chatRoomService = inject(ChatRoomService);

  codigoConvite = signal('');
  entrando = signal(false);
  erro = signal('');

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const codigo = params.get('codigo');
      if (codigo) {
        this.codigoConvite.set(codigo);
        this.entrar();
      }
    });
  }

  voltar(): void {
    this.router.navigate(['/chat']);
  }

  entrar(): void {
    const codigo = this.codigoConvite().trim();
    if (!codigo) return;

    this.entrando.set(true);
    this.erro.set('');

    this.chatRoomService.entrarGrupo(codigo).subscribe({
      next: (sala) => {
        this.entrando.set(false);
        this.chatRoomService.carregarSalas();
        this.router.navigate(['/chat', sala.id]);
      },
      error: (err) => {
        this.entrando.set(false);
        this.erro.set(err.error?.mensagem ?? 'Código de convite inválido.');
      },
    });
  }
}
