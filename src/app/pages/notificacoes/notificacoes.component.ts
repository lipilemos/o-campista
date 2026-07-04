import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Notificacao, TipoNotificacao } from '../../core/models/notificacao.model';
import { NotificacaoService } from '../../core/services/notificacao.service';
import { ToastService } from '../../core/services/toast.service';
import { ImgFallbackDirective } from '../../core/directives/img-fallback.directive';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-notificacoes',
  imports: [RouterLink, DatePipe, ImgFallbackDirective, TranslatePipe],
  templateUrl: './notificacoes.component.html',
  styleUrl: './notificacoes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificacoesComponent {
  private notificacaoService = inject(NotificacaoService);
  private toast = inject(ToastService);

  notificacoes = signal<Notificacao[]>([]);
  carregando = signal(false);
  erro = signal(false);
  semMais = signal(false);
  marcandoLidas = signal(false);

  private pagina = 1;
  private readonly LIMITE = 20;

  constructor() {
    this.carregar();
  }

  carregar(): void {
    if (this.carregando()) return;
    this.carregando.set(true);
    this.erro.set(false);

    this.notificacaoService.getNotificacoes(this.pagina, this.LIMITE).subscribe({
      next: (itens) => {
        this.notificacoes.update((prev) => (this.pagina === 1 ? itens : [...prev, ...itens]));
        this.semMais.set(itens.length < this.LIMITE);
        this.pagina++;
        this.carregando.set(false);

        if (this.pagina === 2) {
          this.marcarComoLidas();
        }
      },
      error: () => {
        this.erro.set(true);
        this.carregando.set(false);
      },
    });
  }

  carregarMais(): void {
    this.carregar();
  }

  marcarComoLidas(): void {
    if (this.marcandoLidas()) return;
    this.marcandoLidas.set(true);

    this.notificacaoService.marcarTodasComoLidas().subscribe({
      next: () => {
        this.notificacaoService.zerarContagem();
        this.notificacoes.update((prev) => prev.map((n) => ({ ...n, lida: true })));
        this.marcandoLidas.set(false);
      },
      error: () => this.marcandoLidas.set(false),
    });
  }

  iconePorTipo(tipo: TipoNotificacao): string {
    const icones: Record<TipoNotificacao, string> = {
      nova_curtida: '❤️',
      novo_comentario: '💬',
      novo_seguidor: '👤',
      mencao: '📢',
    };
    return icones[tipo];
  }

  chaveTraducaoPorTipo(tipo: TipoNotificacao): string {
    return `notifications.${tipo}`;
  }
}
