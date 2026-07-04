import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { LocalizacaoUsuario } from '../models/perfil-publico.model';

@Injectable({
  providedIn: 'root',
})
export class LocationSharingService {
  private connection: signalR.HubConnection | null = null;

  private readonly _seguidoresVisiveis = signal<LocalizacaoUsuario[]>([]);
  readonly seguidoresVisiveis = this._seguidoresVisiveis.asReadonly();

  private readonly _conectado = signal(false);
  readonly conectado = this._conectado.asReadonly();

  iniciar(): Promise<void> {
    if (this.connection) return Promise.resolve();

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}/locationHub`, {
        accessTokenFactory: () => localStorage.getItem('token') ?? '',
      })
      .withAutomaticReconnect([0, 5000, 15000, 30000])
      .build();

    this.connection.on('ReceberLocalizacao', (loc: LocalizacaoUsuario) => {
      this._seguidoresVisiveis.update((atual) => {
        const sem = atual.filter((u) => u.usuarioId !== loc.usuarioId);
        return [...sem, loc];
      });
    });

    this.connection.on('RemoverLocalizacao', (usuarioId: string) => {
      this._seguidoresVisiveis.update((atual) =>
        atual.filter((u) => u.usuarioId !== usuarioId),
      );
    });

    this.connection.onreconnecting(() => this._conectado.set(false));
    this.connection.onreconnected(() => this._conectado.set(true));
    this.connection.onclose(() => this._conectado.set(false));

    return this.connection
      .start()
      .then(() => this._conectado.set(true))
      .catch(() => this._conectado.set(false));
  }

  atualizarPosicao(lat: number, lng: number): void {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) return;
    this.connection.invoke('AtualizarLocalizacao', lat, lng).catch(() => {});
  }

  desativar(): void {
    if (!this.connection) return;
    if (this.connection.state === signalR.HubConnectionState.Connected) {
      this.connection.invoke('DesativarLocalizacao').catch(() => {});
    }
    this.parar();
  }

  parar(): void {
    this.connection?.stop();
    this.connection = null;
    this._seguidoresVisiveis.set([]);
    this._conectado.set(false);
  }
}
