import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Trilha } from '../../core/models/trilha.model';
import { TrilhaService } from '../../core/services/trilha.service';

@Component({
  selector: 'app-trilha-list',
  templateUrl: './trilha-list.component.html',
  styleUrl: './trilha-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrilhaListComponent {
  private trilhaService = inject(TrilhaService);
  private authService = inject(AuthService);

  campingId = input.required<number>();
  trilhaSelecionada = output<Trilha>();

  trilhas = signal<Trilha[]>([]);
  carregando = signal(false);

  constructor() {
    effect(() => {
      const id = this.campingId();
      if (id) this.carregar(id);
    });
  }

  private carregar(campingId: number): void {
    this.carregando.set(true);
    const usuarioId = this.authService.getUser()?.id;
    this.trilhaService.listarPorCamping(campingId, usuarioId).subscribe({
      next: (list) => {
        this.trilhas.set(list);
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false),
    });
  }

  classeDificuldade(dificuldade?: string): string {
    switch (dificuldade?.toLowerCase()) {
      case 'fácil':
      case 'facil':
        return 'dif-facil';
      case 'moderada':
        return 'dif-moderada';
      case 'difícil':
      case 'dificil':
        return 'dif-dificil';
      case 'extrema':
        return 'dif-extrema';
      default:
        return '';
    }
  }

  selecionar(trilha: Trilha): void {
    this.trilhaSelecionada.emit(trilha);
  }
}
