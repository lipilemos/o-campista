import { Component, inject, input, OnChanges, output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Avaliacao } from '../../core/models/avaliacao.model';
import { Camping } from '../../core/models/camping.model';
import { AuthService } from '../../core/services/auth.service';
import { CampingService } from '../../core/services/camping.service';
import { AvaliacoesUsuariosComponent } from '../avaliacoes-usuarios/avaliacoes-usuarios.component';

@Component({
  selector: 'app-formulario-avaliacao',
  imports: [FormsModule, AvaliacoesUsuariosComponent],
  templateUrl: './formulario-avaliacao.component.html',
  styleUrl: './formulario-avaliacao.component.scss',
})
export class FormularioAvaliacaoComponent implements OnChanges {
  camping = input.required<Camping>();
  checkinId = input<number>();
  jaAvaliado = input(false);

  fechar = output<void>();
  avaliacaoSalva = output<Avaliacao>();

  nota = 0;
  comentario = '';
  carregando = false;
  minhaAvaliacao: Avaliacao | null = null;

  private campingService = inject(CampingService);
  private authService = inject(AuthService);

  readonly estrelas = [1, 2, 3, 4, 5];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['camping']) {
      this.resetar();
      if (this.jaAvaliado()) {
        this.carregarMinhaAvaliacao();
      }
    }
  }

  salvar(): void {
    if (this.nota < 1 || this.nota > 5) {
      alert('Por favor, selecione uma nota entre 1 e 5 estrelas');
      return;
    }

    if (!this.comentario.trim()) {
      alert('Por favor, adicione um comentário');
      return;
    }

    const usuarioId = this.authService.getUser()?.id;
    if (!usuarioId) return;

    const avaliacao: Avaliacao = {
      usuarioId,
      campingId: this.camping().id,
      nota: this.nota,
      checkinId: this.checkinId(),
      comentario: this.comentario.trim(),
    };

    this.carregando = true;

    if (this.minhaAvaliacao?.id) {
      this.campingService.atualizarAvaliacao(this.minhaAvaliacao.id, avaliacao).subscribe({
        next: (resultado) => {
          this.carregando = false;
          alert('Avaliação atualizada com sucesso!');
          this.avaliacaoSalva.emit(resultado);
        },
        error: (error) => {
          this.carregando = false;
          console.error('Erro ao atualizar avaliação:', error);
        },
      });
    } else {
      this.campingService.criarAvaliacao(avaliacao).subscribe({
        next: (resultado) => {
          this.carregando = false;
          this.minhaAvaliacao = resultado;
          alert('Avaliação enviada com sucesso!');
          this.avaliacaoSalva.emit(resultado);
        },
        error: (error) => {
          this.carregando = false;
          console.error('Erro ao criar avaliação:', error);
        },
      });
    }
  }

  resetar(): void {
    this.nota = 0;
    this.comentario = '';
    this.minhaAvaliacao = null;
  }

  private carregarMinhaAvaliacao(): void {
    const usuarioId = this.authService.getUser()?.id;
    if (!usuarioId) return;

    this.campingService.obterAvaliacaoUsuario(this.camping().id, usuarioId, this.checkinId()).subscribe({
      next: (avaliacao) => {
        if (avaliacao) {
          this.minhaAvaliacao = avaliacao[0];
          this.nota = avaliacao[0].nota;
          this.comentario = avaliacao[0].comentario;
        }
      },
      error: (error) => console.error('Erro ao carregar avaliação do usuário:', error),
    });
  }
}
