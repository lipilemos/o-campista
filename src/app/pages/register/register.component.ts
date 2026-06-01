import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

type RegisterFormValue = {
    nome: string;
    usuario: string;
    email: string;
    senha: string;
    confirmarSenha: string;
};

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);

    loading = false;
    sucesso = '';
    erro = '';

    form = this.fb.group({
        nome: ['', Validators.required],
        usuario: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        senha: ['', [Validators.required, Validators.minLength(6)]],
        confirmarSenha: ['', Validators.required]
    }, {
        validators: this.passwordsMatchValidator()
    });

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

        this.authService.register({ nome, usuario, email, senha })
            .subscribe({
                next: () => {
                    this.sucesso = 'Cadastro realizado com sucesso! Faça login para continuar.';
                    this.loading = false;
                    setTimeout(() => this.router.navigate(['/']), 1200);
                },
                error: () => {
                    this.erro = 'Não foi possível criar a conta. Tente novamente.';
                    this.loading = false;
                }
            });
    }

    voltarParaLogin() {
        this.router.navigate(['/']);
    }
}
