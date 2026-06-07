import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UsuarioLogado } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-account',
  standalone: true,
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {

  usuario!: UsuarioLogado;
  private router =
    inject(Router);
  constructor(
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const usuario =
      this.authService.getUser();

    if (usuario) {
      this.usuario = usuario;
    }
  }

  get percentualXp(): number {

    if (!this.usuario) {
      return 0;
    }

    return (
      this.usuario.xpAtual /
      this.usuario.xpProximoNivel
    ) * 100;
  }
  openGiftForm() {
    this.router.navigate(['/gift']);

  }
}
