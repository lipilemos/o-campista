import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Conquista } from '../../core/models/conquista.model';
import { UsuarioLogado } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-home-xp-card',
  imports: [TranslatePipe],
  templateUrl: './home-xp-card.component.html',
  styleUrl: './home-xp-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeXpCardComponent {
  private authService = inject(AuthService);

  usuario: UsuarioLogado | null = this.authService.obterUsuarioLogado();

  conquistasRecentes: Conquista[] = [...(this.usuario?.conquistas ?? [])]
    .sort((a, b) => new Date(b.dataConquista).getTime() - new Date(a.dataConquista).getTime())
    .slice(0, 3);

  get percentualXp(): number {
    if (!this.usuario || !this.usuario.xpProximoNivel) return 0;
    return (this.usuario.xp / this.usuario.xpProximoNivel) * 100;
  }
}
