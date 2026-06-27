import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UsuarioLogado } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UsuarioService {

    private apiUrl =
        `${environment.apiUrl}/usuarios`;


    constructor(
        private http: HttpClient
    ) { }


    obterPerfil(
        usuarioId: string
    ): Observable<UsuarioLogado> {

        return this.http
            .get<UsuarioLogado>(
                `${this.apiUrl}/me/${usuarioId}`
            );
    }

    uploadFotoPerfil(
        usuarioId: number,
        foto: FormData
    ): Observable<UsuarioLogado> {

        return this.http
            .post<UsuarioLogado>(
                `${this.apiUrl}/${usuarioId}/foto-perfil`,
                foto
            );
    }
}
