import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notificacao } from '../models/notificacao.model';

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private http = inject(HttpClient);

  private readonly _totalNaoLidas = signal(0);
  readonly totalNaoLidas = this._totalNaoLidas.asReadonly();

  iniciar(): void {
    this.carregarContagem();
  }

  getNotificacoes(pagina = 1, limite = 20): Observable<Notificacao[]> {
    return this.http.get<Notificacao[]>(`${environment.apiUrl}/notificacoes`, {
      params: { pagina, limite },
    });
  }

  marcarTodasComoLidas(): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/notificacoes/lidas`, {});
  }

  zerarContagem(): void {
    this._totalNaoLidas.set(0);
  }

  private carregarContagem(): void {
    this.http
      .get<{ totalNaoLidas: number }>(`${environment.apiUrl}/notificacoes/contagem`)
      .subscribe({
        next: (res) => this._totalNaoLidas.set(res.totalNaoLidas),
        error: () => {},
      });
  }
}
