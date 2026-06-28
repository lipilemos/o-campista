import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { MensagemChat } from '../models/chat.model';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private http = inject(HttpClient);
  private connection: signalR.HubConnection | null = null;
  private campingIdAtual: number | null = null;

  private readonly _mensagens = signal<MensagemChat[]>([]);
  readonly mensagens = this._mensagens.asReadonly();

  private readonly _conectado = signal(false);
  readonly conectado = this._conectado.asReadonly();

  private readonly _carregandoHistorico = signal(false);
  readonly carregandoHistorico = this._carregandoHistorico.asReadonly();

  conectar(campingId: number): void {
    if (this.connection && this.campingIdAtual === campingId) return;

    this.desconectar();
    this.campingIdAtual = campingId;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}/chatHub?campingId=${campingId}`, {
        accessTokenFactory: () => localStorage.getItem('token') ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();

    this.connection.on('ReceberMensagem', (mensagem: MensagemChat) => {
      this._mensagens.update((msgs) => [...msgs, mensagem]);
    });

    this.connection.onreconnecting(() => this._conectado.set(false));
    this.connection.onreconnected(() => this._conectado.set(true));
    this.connection.onclose(() => this._conectado.set(false));

    this.connection
      .start()
      .then(() => this._conectado.set(true))
      .catch(() => this._conectado.set(false));

    this.carregarHistorico(campingId);
  }

  enviarMensagem(texto: string): void {
    if (!this.connection || !texto.trim()) return;
    this.connection.invoke('EnviarMensagem', texto.trim());
  }

  desconectar(): void {
    if (this.connection) {
      this.connection.stop();
      this.connection = null;
    }
    this.campingIdAtual = null;
    this._mensagens.set([]);
    this._conectado.set(false);
  }

  private carregarHistorico(campingId: number): void {
    this._carregandoHistorico.set(true);
    this.http.get<MensagemChat[]>(`${environment.apiUrl}/chat/${campingId}/mensagens`).subscribe({
      next: (mensagens) => {
        this._mensagens.set(mensagens);
        this._carregandoHistorico.set(false);
      },
      error: () => this._carregandoHistorico.set(false),
    });
  }
}
