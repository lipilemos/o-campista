import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UsuarioLogado } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { MapStateService } from '../../core/services/map-state.service';

@Component({
  selector: 'app-menu',
  imports: [RouterOutlet],
  templateUrl: './app-menu.component.html',
  styleUrls: ['./app-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppMenuComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  protected mapState = inject(MapStateService);

  menuOpen = signal(false);
  usuario = signal<UsuarioLogado | null>(null);
  private currentUrl = signal(this.router.url);

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => this.currentUrl.set(e.urlAfterRedirects));

    const user = this.authService.obterUsuarioLogado();
    if (user) this.usuario.set(user);
  }

  toggleMenu() {
    this.menuOpen.update((v) => !v);
  }

  navigateTo(path: string) {
    this.router.navigate(['/' + path]);
    this.menuOpen.set(false);
  }

  isActive(path: string) {
    return this.currentUrl().startsWith('/' + path);
  }

  logout() {
    this.authService.logout();
  }
}
