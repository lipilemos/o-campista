import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AvaliacaoComUsuario } from '../../core/models/avaliacao.model';
import { CampingService } from '../../core/services/camping.service';

@Component({
  selector: 'app-avaliacoes-usuarios',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './avaliacoes-usuarios.component.html',
  styleUrl: './avaliacoes-usuarios.component.scss',
})
export class AvaliacoesUsuariosComponent implements OnChanges {

  @Input() campingId!: number;

  avaliacoesCamping: AvaliacaoComUsuario[] = [];
  carregando = false;

  private campingService = inject(CampingService);

  ngOnChanges(changes: SimpleChanges): void {

    if (changes['campingId'] && this.campingId) {
      this.carregarAvaliacoes();
    }
  }

  private carregarAvaliacoes() {
    this.carregando = true;

    this.campingService.obterAvaliacoesCamping(this.campingId).subscribe(
      avaliacoes => {
        this.avaliacoesCamping = avaliacoes;
        this.carregando = false;
      },
      error => {
        console.error('Erro ao carregar avaliações:', error);
        this.carregando = false;
      }
    );
  }
}
