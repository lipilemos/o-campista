import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UsuarioLogado } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { ChatNotificationService } from '../../core/services/chat-notification.service';
import { MapStateService } from '../../core/services/map-state.service';
import { ThemeService } from '../../core/services/theme.service';
import { I18nService } from '../../core/services/i18n.service';
import { ImgFallbackDirective } from '../../core/directives/img-fallback.directive';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { APP_VERSION } from '../../core/version';

@Component({
  selector: 'app-menu',
  imports: [RouterOutlet, ImgFallbackDirective, TranslatePipe],
  templateUrl: './app-menu.component.html',
  styleUrls: ['./app-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppMenuComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  protected mapState = inject(MapStateService);
  protected chatNotification = inject(ChatNotificationService);
  protected themeService = inject(ThemeService);
  protected i18n = inject(I18nService);

  protected appVersion = APP_VERSION;
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
    if (user) {
      this.usuario.set(user);
      this.chatNotification.iniciar();
    }
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

  async toggleLanguage() {
    const next = this.i18n.locale() === 'pt-BR' ? 'en-US' : 'pt-BR';
    await this.i18n.setLocale(next);
  }

  logout() {
    this.authService.logout();
  }
}
