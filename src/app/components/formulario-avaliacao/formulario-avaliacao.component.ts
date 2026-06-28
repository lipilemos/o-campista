import { Component, inject, input, OnChanges, output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Avaliacao } from '../../core/models/avaliacao.model';
import { Camping } from '../../core/models/camping.model';
import { AuthService } from '../../core/services/auth.service';
import { CampingService } from '../../core/services/camping.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { ImgFallbackDirective } from '../../core/directives/img-fallback.directive';
import { AvaliacoesUsuariosComponent } from '../avaliacoes-usuarios/avaliacoes-usuarios.component';

const XP_ESTRELAS = 100;
const XP_COMENTARIO_CURTO = 100;
const XP_COMENTARIO_LONGO = 300;
const COMENTARIO_LONGO_MIN_CHARS = 20;

@Component({
  selector: 'app-formulario-avaliacao',
  imports: [FormsModule, AvaliacoesUsuariosComponent, ImgFallbackDirective],
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
  private usuarioService = inject(UsuarioService);

  readonly estrelas = [1, 2, 3, 4, 5];

  get xpEstrelas(): number {
    return this.nota > 0 ? XP_ESTRELAS : 0;
  }

  get xpComentario(): number {
    const textoLimpo = this.comentario.trim();
    if (!textoLimpo) return 0;
    return textoLimpo.length > COMENTARIO_LONGO_MIN_CHARS
      ? XP_COMENTARIO_LONGO
      : XP_COMENTARIO_CURTO;
  }

  get xpTotal(): number {
    return this.xpEstrelas + this.xpComentario;
  }

  get isNovaAvaliacao(): boolean {
    return !this.minhaAvaliacao?.id;
  }

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
      return;
    }

    if (!this.comentario.trim()) {
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
          this.avaliacaoSalva.emit(resultado);
        },
        error: (error) => {
          this.carregando = false;
          console.error('Erro ao atualizar avaliação:', error);
        },
      });
    } else {
      const avaliacaoComXp: Avaliacao = { ...avaliacao, xpGanho: this.xpTotal };
      this.campingService.criarAvaliacao(avaliacaoComXp).subscribe({
        next: (resultado) => {
          this.carregando = false;
          this.minhaAvaliacao = resultado;
          this.avaliacaoSalva.emit(resultado);
          this.usuarioService.verificarNovasConquistas();
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

    this.campingService
      .obterAvaliacaoUsuario(this.camping().id, usuarioId, this.checkinId())
      .subscribe({
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
