import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UsuarioLogado } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioService } from '../../core/services/usuario.service';

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
    private authService: AuthService,
    private usuarioService: UsuarioService
  ) { }

  ngOnInit(): void {
    this.usuarioService.obterPerfil(this.authService.getUser()?.id.toString()!)
      .subscribe(usuario => {
        this.usuario = usuario;
      });
  }

  get percentualXp(): number {

    if (!this.usuario) {
      return 0;
    }

    return (
      this.usuario.xp /
      this.usuario.xpProximoNivel
    ) * 100;
  }
  openGiftForm() {
    this.router.navigate(['/gift']);

  }
}
