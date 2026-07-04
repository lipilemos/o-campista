import { DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AvaliacaoComUsuario } from '../../core/models/avaliacao.model';
import { ImgFallbackDirective } from '../../core/directives/img-fallback.directive';
import { CampingService } from '../../core/services/camping.service';
import { TrilhaService } from '../../core/services/trilha.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-avaliacoes-usuarios',
  imports: [DatePipe, ImgFallbackDirective, TranslatePipe, RouterLink],
  templateUrl: './avaliacoes-usuarios.component.html',
  styleUrl: './avaliacoes-usuarios.component.scss',
})
export class AvaliacoesUsuariosComponent {
  campingId = input<number>();
  trilhaId = input<number>();

  avaliacoesCamping = signal<AvaliacaoComUsuario[]>([]);
  carregando = signal(false);

  private campingService = inject(CampingService);
  private trilhaService = inject(TrilhaService);

  constructor() {
    effect(() => {
      const tId = this.trilhaId();
      const cId = this.campingId();
      if (tId) {
        this.carregarAvaliacoesTrilha(tId);
      } else if (cId) {
        this.carregarAvaliacoes(cId);
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
      error: () => this.carregando.set(false),
    });
  }

  private carregarAvaliacoesTrilha(trilhaId: number) {
    this.carregando.set(true);
    this.trilhaService.obterAvaliacoes(trilhaId).subscribe({
      next: (avaliacoes) => {
        this.avaliacoesCamping.set(avaliacoes);
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false),
    });
  }
}
