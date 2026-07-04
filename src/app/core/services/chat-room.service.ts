import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CriarGrupoRequest,
  CriarGrupoResponse,
  MensagemSalaChat,
  NaoLidasResponse,
  PodeEnviarResponse,
  SalaChat,
  MembroSala,
} from '../models/chat-room.model';

@Injectable({
  providedIn: 'root',
})
export class ChatRoomService {
  private http = inject(HttpClient);
  private connection: signalR.HubConnection | null = null;
  private salaIdAtual: number | null = null;

  private readonly _salas = signal<SalaChat[]>([]);
  readonly salas = this._salas.asReadonly();

  private readonly _carregandoSalas = signal(false);
  readonly carregandoSalas = this._carregandoSalas.asReadonly();

  private readonly _mensagens = signal<MensagemSalaChat[]>([]);
  readonly mensagens = this._mensagens.asReadonly();

  private readonly _carregandoMensagens = signal(false);
  readonly carregandoMensagens = this._carregandoMensagens.asReadonly();

  private readonly _conectado = signal(false);
  readonly conectado = this._conectado.asReadonly();

  private readonly _podeEnviar = signal(true);
  readonly podeEnviar = this._podeEnviar.asReadonly();

  private readonly _digitando = signal('');
  readonly digitando = this._digitando.asReadonly();
  private digitandoTimeout: ReturnType<typeof setTimeout> | null = null;

  carregarSalas(): void {
    this._carregandoSalas.set(true);
    this.http.get<SalaChat[]>(`${environment.apiUrl}/chat/salas`).subscribe({
      next: (salas) => {
        this._salas.set(salas);
        this._carregandoSalas.set(false);
      },
      error: () => this._carregandoSalas.set(false),
    });
  }

  conectarSala(salaId: number): void {
    if (this.connection && this.salaIdAtual === salaId) return;

    this.desconectarSala();
    this.salaIdAtual = salaId;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}/chatHub?salaId=${salaId}`, {
        accessTokenFactory: () => localStorage.getItem('token') ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();

    this.connection.on('ReceberMensagem', (mensagem: MensagemSalaChat) => {
      this._mensagens.update((msgs) => [...msgs, mensagem]);
      this._digitando.set('');
    });

    this.connection.on('UsuarioDigitando', (nomeUsuario: string) => {
      this._digitando.set(nomeUsuario);
      if (this.digitandoTimeout) clearTimeout(this.digitandoTimeout);
      this.digitandoTimeout = setTimeout(() => this._digitando.set(''), 3000);
    });

    this.connection.onreconnecting(() => this._conectado.set(false));
    this.connection.onreconnected(() => this._conectado.set(true));
    this.connection.onclose(() => this._conectado.set(false));

    this.connection
      .start()
      .then(() => this._conectado.set(true))
      .catch(() => this._conectado.set(false));

    this.carregarMensagens(salaId);
    this.verificarPodeEnviar(salaId);
    this.marcarComoLida(salaId);
  }

  desconectarSala(): void {
    if (this.connection) {
      this.connection.stop();
      this.connection = null;
    }
    this.salaIdAtual = null;
    this._mensagens.set([]);
    this._conectado.set(false);
    this._podeEnviar.set(true);
    this._digitando.set('');
  }

  enviarMensagem(texto: string): void {
    if (!this.connection || !texto.trim()) return;
    this.connection.invoke('EnviarMensagem', texto.trim());
  }

  notificarDigitando(): void {
    if (!this.connection) return;
    this.connection.invoke('Digitando');
  }

  criarGrupo(request: CriarGrupoRequest): Observable<CriarGrupoResponse> {
    return this.http.post<CriarGrupoResponse>(`${environment.apiUrl}/chat/grupos`, request);
  }

  entrarGrupo(codigoConvite: string): Observable<SalaChat> {
    return this.http.post<SalaChat>(`${environment.apiUrl}/chat/grupos/entrar`, { codigoConvite });
  }

  obterConvite(salaId: number): Observable<{ codigoConvite: string }> {
    return this.http.get<{ codigoConvite: string }>(
      `${environment.apiUrl}/chat/grupos/${salaId}/convite`,
    );
  }

  obterMembros(salaId: number): Observable<MembroSala[]> {
    return this.http.get<MembroSala[]>(`${environment.apiUrl}/chat/grupos/${salaId}/membros`);
  }

  sairDoGrupo(salaId: number): Observable<{ mensagem: string }> {
    return this.http.delete<{ mensagem: string }>(
      `${environment.apiUrl}/chat/grupos/${salaId}/sair`,
    );
  }

  abrirDm(usuarioId: string): Observable<SalaChat> {
    return this.http.post<SalaChat>(`${environment.apiUrl}/chat/diretas/${usuarioId}`, {});
  }

  private carregarMensagens(salaId: number): void {
    this._carregandoMensagens.set(true);
    this.http
      .get<MensagemSalaChat[]>(`${environment.apiUrl}/chat/salas/${salaId}/mensagens`)
      .subscribe({
        next: (mensagens) => {
          this._mensagens.set(mensagens);
          this._carregandoMensagens.set(false);
        },
        error: () => this._carregandoMensagens.set(false),
      });
  }

  private verificarPodeEnviar(salaId: number): void {
    this.http
      .get<PodeEnviarResponse>(`${environment.apiUrl}/chat/salas/${salaId}/pode-enviar`)
      .subscribe({
        next: (res) => this._podeEnviar.set(res.podeEnviar),
        error: () => this._podeEnviar.set(false),
      });
  }

  private marcarComoLida(salaId: number): void {
    this.http.post(`${environment.apiUrl}/chat/salas/${salaId}/lida`, {}).subscribe();
  }
}
