import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  private authService = inject(AuthService);
  private router = inject(Router);

  usuario = '';
  senha = '';

  loading = false;
  erro = '';

  entrar() {

    this.loading = true;

    this.authService.login(this.usuario, this.senha)
      .subscribe({
        next: () => {
          this.router.navigate(['/home']);
        },
        error: () => {
          this.erro = 'Usuário inválido';
          this.loading = false;
        }
      });
  }

  recuperarSenha() {
    this.router.navigate(['/forgot-password']);
  }

  criarConta() {
    this.router.navigate(['/register']);
  }
}
