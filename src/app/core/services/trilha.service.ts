import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AvaliacaoComUsuario, Avaliacao } from '../models/avaliacao.model';
import { CriarTrilhaRequest, Trilha } from '../models/trilha.model';

@Injectable({ providedIn: 'root' })
export class TrilhaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/trilhas`;

  listarPorCamping(campingId: number, usuarioId?: string): Observable<Trilha[]> {
    const params: Record<string, string> = { campingId: campingId.toString() };
    if (usuarioId) params['usuarioId'] = usuarioId;
    return this.http.get<Trilha[]>(this.apiUrl, { params });
  }

  listarMapa(): Observable<Trilha[]> {
    return this.http.get<Trilha[]>(`${this.apiUrl}/mapa`);
  }

  obterDetalhes(trilhaId: number, usuarioId?: string): Observable<Trilha> {
    const params: Record<string, string> = {};
    if (usuarioId) params['usuarioId'] = usuarioId;
    return this.http.get<Trilha>(`${this.apiUrl}/${trilhaId}`, { params });
  }

  concluir(trilhaId: number, usuarioId: string): Observable<{ mensagem: string }> {
    return this.http.post<{ mensagem: string }>(
      `${this.apiUrl}/${trilhaId}/concluir?usuarioId=${usuarioId}`,
      {},
    );
  }

  criar(request: CriarTrilhaRequest): Observable<Trilha> {
    return this.http.post<Trilha>(this.apiUrl, request);
  }

  checkin(
    trilhaId: number,
    usuarioId: string,
    latitude: number,
    longitude: number,
  ): Observable<{ mensagem: string }> {
    return this.http.post<{ mensagem: string }>(`${this.apiUrl}/${trilhaId}/checkin`, {
      usuarioId,
      latitude,
      longitude,
    });
  }

  contarCheckinsRecentes(trilhaId: number): Observable<{ quantidade: number }> {
    return this.http.get<{ quantidade: number }>(`${this.apiUrl}/${trilhaId}/checkins/recentes`);
  }

  contarTotalVisitas(trilhaId: number): Observable<{ total: number }> {
    return this.http.get<{ total: number }>(`${this.apiUrl}/${trilhaId}/checkins/total`);
  }

  obterAvaliacoes(trilhaId: number): Observable<AvaliacaoComUsuario[]> {
    return this.http.get<AvaliacaoComUsuario[]>(`${this.apiUrl}/${trilhaId}/avaliacoes`);
  }

  criarAvaliacao(trilhaId: number, avaliacao: Avaliacao, foto?: File): Observable<Avaliacao> {
    const formData = new FormData();
    formData.append('usuarioId', avaliacao.usuarioId);
    formData.append('trilhaId', trilhaId.toString());
    formData.append('checkinId', (avaliacao.checkinId ?? 0).toString());
    formData.append('nota', avaliacao.nota.toString());
    formData.append('comentario', avaliacao.comentario);
    formData.append('xpGanho', (avaliacao.xpGanho ?? 0).toString());
    if (foto) formData.append('foto', foto);
    return this.http.post<Avaliacao>(`${this.apiUrl}/${trilhaId}/avaliacoes`, formData);
  }
}
