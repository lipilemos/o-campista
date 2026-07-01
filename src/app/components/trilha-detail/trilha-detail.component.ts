import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Trilha } from '../../core/models/trilha.model';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TrilhaService } from '../../core/services/trilha.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { Util } from '../../core/Utils.ts/Util';

@Component({
  selector: 'app-trilha-detail',
  templateUrl: './trilha-detail.component.html',
  styleUrl: './trilha-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrilhaDetailComponent {
  private trilhaService = inject(TrilhaService);
  private authService = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private toast = inject(ToastService);

  trilha = input.required<Trilha>();
  minhaPosicao = input<google.maps.LatLngLiteral>();
  fechar = output<void>();
  concluida = output<void>();

  concluindo = signal(false);

  podeConclur = computed(() => {
    const pos = this.minhaPosicao();
    const t = this.trilha();
    if (!pos || t.pontos.length === 0) return false;

    const primeiro = t.pontos[0];
    const ultimo = t.pontos[t.pontos.length - 1];

    const distPrimeiro = Util.calcularDistanciaMetros(
      pos.lat,
      pos.lng,
      Number(primeiro.latitude),
      Number(primeiro.longitude),
    );
    const distUltimo = Util.calcularDistanciaMetros(
      pos.lat,
      pos.lng,
      Number(ultimo.latitude),
      Number(ultimo.longitude),
    );

    return Math.min(distPrimeiro, distUltimo) <= 500;
  });

  concluirTrilha(): void {
    const usuario = this.authService.getUser();
    if (!usuario) return;

    this.concluindo.set(true);
    this.trilhaService.concluir(this.trilha().id, usuario.id).subscribe({
      next: (res) => {
        this.concluindo.set(false);
        this.toast.success(res.mensagem ?? 'Trilha concluída! +200 XP 🥾');
        this.usuarioService.verificarNovasConquistas();
        this.concluida.emit();
      },
      error: (err) => {
        this.concluindo.set(false);
        this.toast.error(err?.error?.mensagem ?? 'Erro ao concluir trilha.');
      },
    });
  }
}
