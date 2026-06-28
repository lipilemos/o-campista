import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { NaoLidasResponse, SalaChat } from '../models/chat-room.model';

@Injectable({
  providedIn: 'root',
})
export class ChatNotificationService {
  private http = inject(HttpClient);
  private connection: signalR.HubConnection | null = null;

  private readonly _totalNaoLidas = signal(0);
  readonly totalNaoLidas = this._totalNaoLidas.asReadonly();

  private readonly _naoLidasPorSala = signal<Record<number, number>>({});
  readonly naoLidasPorSala = this._naoLidasPorSala.asReadonly();

  iniciar(): void {
    if (this.connection) return;

    this.carregarContadores();
    this.carregarContadoresDasSalas();

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}/notificationHub`, {
        accessTokenFactory: () => localStorage.getItem('token') ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();

    this.connection.on('NovaMensagem', (salaId: number) => {
      this._naoLidasPorSala.update((porSala) => ({
        ...porSala,
        [salaId]: (porSala[salaId] ?? 0) + 1,
      }));
      this._totalNaoLidas.update((t) => t + 1);
    });

    this.connection.onreconnected(() => {
      this.carregarContadores();
      this.carregarContadoresDasSalas();
    });

    this.connection.start().catch((err) => {
      console.warn('[ChatNotification] Hub falhou, usando fallback REST:', err);
    });
  }

  parar(): void {
    if (this.connection) {
      this.connection.stop();
      this.connection = null;
    }
  }

  marcarComoLida(salaId: number): void {
    const contagem = this._naoLidasPorSala()[salaId] ?? 0;
    if (contagem > 0) {
      this._naoLidasPorSala.update((porSala) => {
        const atualizado = { ...porSala };
        delete atualizado[salaId];
        return atualizado;
      });
      this._totalNaoLidas.update((t) => Math.max(0, t - contagem));
    }
  }

  private carregarContadores(): void {
    this.http.get<NaoLidasResponse>(`${environment.apiUrl}/chat/nao-lidas`).subscribe({
      next: (res) => {
        this._totalNaoLidas.set(res.total);
        this._naoLidasPorSala.set(res.porSala);
      },
      error: () => {},
    });
  }

  private carregarContadoresDasSalas(): void {
    this.http.get<SalaChat[]>(`${environment.apiUrl}/chat/salas`).subscribe({
      next: (salas) => {
        const porSala: Record<number, number> = {};
        let total = 0;
        for (const sala of salas) {
          if (sala.totalNaoLidas > 0) {
            porSala[sala.id] = sala.totalNaoLidas;
            total += sala.totalNaoLidas;
          }
        }
        if (total > 0 && this._totalNaoLidas() === 0) {
          this._totalNaoLidas.set(total);
          this._naoLidasPorSala.set(porSala);
        }
      },
      error: () => {},
    });
  }
}
