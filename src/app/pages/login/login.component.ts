import { CommonModule } from '@angular/common';
import { afterNextRender, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../core/services/auth.service';
import { GoogleAuthService } from '../../core/services/google-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private authService = inject(AuthService);
  private googleAuthService = inject(GoogleAuthService);
  private router = inject(Router);

  private googleButtonRef = viewChild<ElementRef>('googleButton');

  email = '';
  senha = '';

  loading = false;
  erro = '';
  googleLoading = signal(false);

  constructor() {
    afterNextRender(() => {
      const el = this.googleButtonRef()?.nativeElement;
      if (el) {
        this.googleAuthService.initialize();
        this.googleAuthService.renderButton(el);
      }
    });

    this.googleAuthService.credential$.pipe(takeUntilDestroyed()).subscribe((token) => {
      this.googleLoading.set(true);
      this.erro = '';
      this.authService.loginWithGoogle(token).subscribe({
        next: () => this.router.navigate(['/home']),
        error: () => {
          this.erro = 'Erro ao entrar com Google. Tente novamente.';
          this.googleLoading.set(false);
        },
      });
    });
  }

  entrar() {
    this.loading = true;

    this.authService.login(this.email, this.senha).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: () => {
        this.erro = 'Usuário inválido';
        this.loading = false;
      },
    });
  }

  recuperarSenha() {
    this.router.navigate(['/forgot-password']);
  }

  criarConta() {
    this.router.navigate(['/register']);
  }
}
