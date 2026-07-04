import {
  ChangeDetectorRef,
  Component,
  inject,
  input,
  OnChanges,
  output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Avaliacao } from '../../core/models/avaliacao.model';
import { Camping } from '../../core/models/camping.model';
import { Trilha } from '../../core/models/trilha.model';
import { AuthService } from '../../core/services/auth.service';
import { CampingService } from '../../core/services/camping.service';
import { TrilhaService } from '../../core/services/trilha.service';
import { ImageCompressorService } from '../../core/services/image-compressor.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { ImgFallbackDirective } from '../../core/directives/img-fallback.directive';
import { AvaliacoesUsuariosComponent } from '../avaliacoes-usuarios/avaliacoes-usuarios.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

const XP_ESTRELAS = 100;
const XP_COMENTARIO_CURTO = 100;
const XP_COMENTARIO_LONGO = 300;
const XP_FOTO = 300;
const COMENTARIO_LONGO_MIN_CHARS = 20;

@Component({
  selector: 'app-formulario-avaliacao',
  imports: [FormsModule, AvaliacoesUsuariosComponent, ImgFallbackDirective, TranslatePipe],
  templateUrl: './formulario-avaliacao.component.html',
  styleUrl: './formulario-avaliacao.component.scss',
})
export class FormularioAvaliacaoComponent implements OnChanges {
  camping = input<Camping>();
  trilha = input<Trilha>();
  checkinId = input<number>();
  jaAvaliado = input(false);

  fechar = output<void>();
  avaliacaoSalva = output<Avaliacao>();

  nota = 0;
  comentario = '';
  carregando = false;
  minhaAvaliacao: Avaliacao | null = null;
  fotoSelecionada: File | null = null;
  fotoPreview: string | null = null;

  private campingService = inject(CampingService);
  private trilhaService = inject(TrilhaService);
  private authService = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private imageCompressor = inject(ImageCompressorService);
  private cdr = inject(ChangeDetectorRef);

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

  get xpFoto(): number {
    return this.fotoSelecionada ? XP_FOTO : 0;
  }

  get xpTotal(): number {
    return this.xpEstrelas + this.xpComentario + this.xpFoto;
  }

  get isNovaAvaliacao(): boolean {
    return !this.minhaAvaliacao?.id;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['camping'] || changes['trilha'] || changes['checkinId']) {
      this.resetar();
      if (this.jaAvaliado()) {
        if (this.camping()) {
          this.carregarMinhaAvaliacao();
        } else if (this.trilha()) {
          this.carregarMinhaAvaliacaoTrilha();
        }
      }
    }
  }

  salvar(): void {
    if (this.nota < 1 || this.nota > 5) return;
    if (!this.comentario.trim()) return;

    const usuarioId = this.authService.getUser()?.id;
    if (!usuarioId) return;

    const trilha = this.trilha();
    const camping = this.camping();

    if (trilha) {
      this.salvarAvaliacacaoTrilha(trilha.id, usuarioId);
    } else if (camping) {
      this.salvarAvaliacaoCamping(camping.id, usuarioId);
    }
  }

  private salvarAvaliacaoCamping(campingId: number, usuarioId: string): void {
    const avaliacao: Avaliacao = {
      usuarioId,
      campingId,
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
        error: () => (this.carregando = false),
      });
    } else {
      const avaliacaoComXp: Avaliacao = { ...avaliacao, xpGanho: this.xpTotal };
      this.campingService
        .criarAvaliacao(avaliacaoComXp, this.fotoSelecionada ?? undefined)
        .subscribe({
          next: (resultado) => {
            this.carregando = false;
            this.minhaAvaliacao = resultado;
            this.avaliacaoSalva.emit(resultado);
            this.usuarioService.verificarNovasConquistas();
          },
          error: () => (this.carregando = false),
        });
    }
  }

  private salvarAvaliacacaoTrilha(trilhaId: number, usuarioId: string): void {
    const avaliacao: Avaliacao = {
      usuarioId,
      trilhaId,
      nota: this.nota,
      checkinId: this.checkinId(),
      comentario: this.comentario.trim(),
      xpGanho: this.xpTotal,
    };

    this.carregando = true;
    this.trilhaService
      .criarAvaliacao(trilhaId, avaliacao, this.fotoSelecionada ?? undefined)
      .subscribe({
        next: (resultado) => {
          this.carregando = false;
          this.minhaAvaliacao = resultado;
          this.avaliacaoSalva.emit(resultado);
          this.usuarioService.verificarNovasConquistas();
        },
        error: () => (this.carregando = false),
      });
  }

  async onFotoSelecionada(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.fotoSelecionada = await this.imageCompressor.compress(file);
    const reader = new FileReader();
    reader.onload = () => {
      this.fotoPreview = reader.result as string;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(this.fotoSelecionada);
  }

  removerFoto(): void {
    this.fotoSelecionada = null;
    this.fotoPreview = null;
  }

  resetar(): void {
    this.nota = 0;
    this.comentario = '';
    this.minhaAvaliacao = null;
    this.fotoSelecionada = null;
    this.fotoPreview = null;
  }

  private carregarMinhaAvaliacao(): void {
    const usuarioId = this.authService.getUser()?.id;
    const camping = this.camping();
    if (!usuarioId || !camping) return;

    this.campingService.obterAvaliacaoUsuario(camping.id, usuarioId, this.checkinId()).subscribe({
      next: (avaliacao) => {
        if (avaliacao?.length) {
          this.minhaAvaliacao = avaliacao[0];
          this.nota = avaliacao[0].nota;
          this.comentario = avaliacao[0].comentario;
          if (avaliacao[0].fotoUrl) this.fotoPreview = avaliacao[0].fotoUrl;
          this.cdr.markForCheck();
        }
      },
      error: () => {},
    });
  }

  private carregarMinhaAvaliacaoTrilha(): void {
    const usuarioId = this.authService.getUser()?.id;
    const trilha = this.trilha();
    if (!usuarioId || !trilha) return;

    this.trilhaService.obterAvaliacoes(trilha.id).subscribe({
      next: (avaliacoes) => {
        const minha = avaliacoes.find(
          (av) => av.usuarioId === usuarioId && av.checkinId === this.checkinId(),
        );
        if (minha) {
          this.minhaAvaliacao = minha;
          this.nota = minha.nota;
          this.comentario = minha.comentario;
          if (minha.fotoUrl) this.fotoPreview = minha.fotoUrl;
          this.cdr.markForCheck();
        }
      },
      error: () => {},
    });
  }
}
