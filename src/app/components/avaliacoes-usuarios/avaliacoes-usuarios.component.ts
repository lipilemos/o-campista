import { DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { AvaliacaoComUsuario } from '../../core/models/avaliacao.model';
import { CampingService } from '../../core/services/camping.service';

@Component({
  selector: 'app-avaliacoes-usuarios',
  imports: [DatePipe],
  templateUrl: './avaliacoes-usuarios.component.html',
  styleUrl: './avaliacoes-usuarios.component.scss',
})
export class AvaliacoesUsuariosComponent {
  campingId = input.required<number>();

  avaliacoesCamping = signal<AvaliacaoComUsuario[]>([]);
  carregando = signal(false);

  private campingService = inject(CampingService);

  constructor() {
    effect(() => {
      const id = this.campingId();
      if (id) {
        this.carregarAvaliacoes(id);
      }
    });
  }

  private carregarAvaliacoes(campingId: number) {
    this.carregando.set(true);

    this.campingService.obterAvaliacoesCamping(campingId).subscribe({
      next: (avaliacoes) => {
        this.avaliacoesCamping.set(avaliacoes);
        this.carregando.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar avaliações:', error);
        this.carregando.set(false);
      },
    });
  }
}
