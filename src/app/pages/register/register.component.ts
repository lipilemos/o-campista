import { CommonModule } from '@angular/common';
import { afterNextRender, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { GoogleAuthService } from '../../core/services/google-auth.service';

type RegisterFormValue = {
  nome: string;
  usuario: string;
  email: string;
  senha: string;
  confirmarSenha: string;
};

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private googleAuthService = inject(GoogleAuthService);
  private router = inject(Router);

  private googleButtonRef = viewChild<ElementRef>('googleButton');

  loading = false;
  sucesso = '';
  erro = '';
  googleLoading = signal(false);

  form = this.fb.group(
    {
      nome: ['', Validators.required],
      usuario: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', Validators.required],
    },
    {
      validators: this.passwordsMatchValidator(),
    },
  );

  constructor() {
    afterNextRender(() => {
      const el = this.googleButtonRef()?.nativeElement;
      if (el) {
        this.googleAuthService.initialize();
        this.googleAuthService.renderButton(el, 'signup_with');
      }
    });

    this.googleAuthService.credential$.pipe(takeUntilDestroyed()).subscribe((token) => {
      this.googleLoading.set(true);
      this.erro = '';
      this.authService.loginWithGoogle(token).subscribe({
        next: () => this.router.navigate(['/home']),
        error: () => {
          this.erro = 'Erro ao criar conta com Google. Tente novamente.';
          this.googleLoading.set(false);
        },
      });
    });
  }

  private passwordsMatchValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const senha = control.get('senha')?.value;
      const confirmarSenha = control.get('confirmarSenha')?.value;
      return senha && confirmarSenha && senha === confirmarSenha ? null : { senhaDiferente: true };
    };
  }

  register() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.erro = '';

    const { nome, usuario, email, senha } = this.form.value as RegisterFormValue;

    this.authService.register({ nome, usuario, email, senha }).subscribe({
      next: () => {
        this.sucesso = 'Cadastro realizado com sucesso! Faça login para continuar.';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/']), 1200);
      },
      error: () => {
        this.erro = 'Não foi possível criar a conta. Tente novamente.';
        this.loading = false;
      },
    });
  }

  voltarParaLogin() {
    this.router.navigate(['/']);
  }
}
