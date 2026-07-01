import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UsuarioLogado } from '../models/user.model';
import { AchievementNotificationService } from './achievement-notification.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private achievementNotification = inject(AchievementNotificationService);

  private apiUrl = `${environment.apiUrl}/usuarios`;

  obterPerfil(usuarioId: string): Observable<UsuarioLogado> {
    return this.http.get<UsuarioLogado>(`${this.apiUrl}/me/${usuarioId}`);
  }

  uploadFotoPerfil(usuarioId: string, foto: FormData): Observable<UsuarioLogado> {
    return this.http.post<UsuarioLogado>(`${this.apiUrl}/${usuarioId}/foto-perfil`, foto);
  }

  deletarConta(usuarioId: string): Observable<{ mensagem: string }> {
    return this.http.delete<{ mensagem: string }>(`${this.apiUrl}/${usuarioId}`);
  }

  verificarNovasConquistas(): void {
    const usuario = this.authService.getUser();
    if (!usuario) return;

    const conquistasAntigas = usuario.conquistas ?? [];

    this.obterPerfil(usuario.id).subscribe({
      next: (perfil) => {
        const novas = (perfil.conquistas ?? []).filter(
          (c) => !conquistasAntigas.some((a) => a.id === c.id),
        );

        if (novas.length > 0) {
          this.achievementNotification.showMultiple(novas);
        }

        this.authService.atualizarUsuarioLocal({
          ...usuario,
          ...perfil,
          token: usuario.token,
        });
      },
    });
  }
}
