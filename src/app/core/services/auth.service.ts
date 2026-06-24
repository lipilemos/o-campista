import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UsuarioLogado } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private router = inject(Router);
    private http = inject(HttpClient);

    private apiUrl = `${environment.apiUrl}/auth`;

    login(email: string, senha: string): Observable<UsuarioLogado> {

        return this.http.post<UsuarioLogado>(`${this.apiUrl}/login`, {
            email,
            senha
        }).pipe(
            tap(user => {
                localStorage.setItem('token', user.token);
                localStorage.setItem('user', JSON.stringify(user));
            })
        );
    }

    register(registro: { nome: string; usuario: string; email: string; senha: string }): Observable<UsuarioLogado> {
        return this.http.post<UsuarioLogado>(`${this.apiUrl}/register`, registro).pipe(
            tap(user => {
                localStorage.setItem('token', user.token);
                localStorage.setItem('user', JSON.stringify(user));
            })
        );
    }

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.clear();
        this.router.navigate(['/']);
    }

    getUser(): UsuarioLogado | null {
        const user = localStorage.getItem('user');
        if (!user) return null;
        return JSON.parse(user);
    }

    isAuthenticated(): boolean {
        return !!localStorage.getItem('token');
    }

    obterUsuarioLogado() {
        const usuario = localStorage.getItem('user');
        if (!usuario) return null;
        return JSON.parse(usuario);
    }
}
