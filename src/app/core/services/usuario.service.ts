import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UsuarioLogado } from '../models/user.model';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

@Injectable({
    providedIn: 'root'
})
export class UsuarioService {

    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private toast = inject(ToastService);

    private apiUrl =
        `${environment.apiUrl}/usuarios`;


    obterPerfil(
        usuarioId: string
    ): Observable<UsuarioLogado> {

        return this.http
            .get<UsuarioLogado>(
                `${this.apiUrl}/me/${usuarioId}`
            );
    }

    uploadFotoPerfil(
        usuarioId: string,
        foto: FormData
    ): Observable<UsuarioLogado> {

        return this.http
            .post<UsuarioLogado>(
                `${this.apiUrl}/${usuarioId}/foto-perfil`,
                foto
            );
    }

    deletarConta(
        usuarioId: string
    ): Observable<{ mensagem: string }> {

        return this.http
            .delete<{ mensagem: string }>(
                `${this.apiUrl}/${usuarioId}`
            );
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

                for (const conquista of novas) {
                    this.toast.success(`🏆 Nova conquista: ${conquista.nome}!`);
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
