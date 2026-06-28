import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  loading = false;
  enviado = false;
  erro = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  enviarRecuperacao() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.erro = '';

    this.authService.forgotPassword(this.form.value.email!).subscribe({
      next: () => {
        this.loading = false;
        this.enviado = true;
      },
      error: () => {
        this.loading = false;
        this.enviado = true;
      },
    });
  }

  voltarParaLogin() {
    this.router.navigate(['/']);
  }
}
