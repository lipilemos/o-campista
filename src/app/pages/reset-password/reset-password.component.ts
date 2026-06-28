import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  loading = false;
  sucesso = false;
  erro = '';
  private token = '';

  form = this.fb.group(
    {
      novaSenha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', [Validators.required]],
    },
    { validators: this.senhasIguaisValidator },
  );

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.erro = 'Link de recuperação inválido. Solicite um novo.';
    }
  }

  private senhasIguaisValidator(control: AbstractControl): ValidationErrors | null {
    const senha = control.get('novaSenha');
    const confirmar = control.get('confirmarSenha');
    if (senha && confirmar && senha.value !== confirmar.value) {
      return { senhasDiferentes: true };
    }
    return null;
  }

  redefinirSenha() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.erro = '';

    this.authService.resetPassword(this.token, this.form.value.novaSenha!).subscribe({
      next: () => {
        this.loading = false;
        this.sucesso = true;
      },
      error: (err) => {
        this.loading = false;
        this.erro = err.error?.mensagem ?? 'Erro ao redefinir senha. Tente novamente.';
      },
    });
  }

  irParaLogin() {
    this.router.navigate(['/']);
  }
}
