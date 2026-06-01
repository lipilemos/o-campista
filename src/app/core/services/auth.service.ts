import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private http = inject(HttpClient);

    private apiUrl = 'https://localhost:44316/api/auth';

    login(usuario: string, senha: string): Observable<User> {

        return this.http.post<User>(`${this.apiUrl}/login`, {
            usuario,
            senha
        }).pipe(
            tap(user => {
                localStorage.setItem('token', user.token);
                localStorage.setItem('user', JSON.stringify(user));
            })
        );
    }

    register(registro: { nome: string; usuario: string; email: string; senha: string }): Observable<User> {
        return this.http.post<User>(`${this.apiUrl}/register`, registro).pipe(
            tap(user => {
                localStorage.setItem('token', user.token);
                localStorage.setItem('user', JSON.stringify(user));
            })
        );
    }

    logout() {
        localStorage.clear();
    }

    getUser(): User | null {

        const user = localStorage.getItem('user');

        if (!user) return null;

        return JSON.parse(user);
    }

    isAuthenticated(): boolean {
        return !!localStorage.getItem('token');
    }
}
