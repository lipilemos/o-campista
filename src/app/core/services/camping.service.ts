import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, from, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Avaliacao, AvaliacaoComUsuario } from '../models/avaliacao.model';
import { Camping } from '../models/camping.model';
import { OfflineStorageService } from './offline-storage.service';

@Injectable({
  providedIn: 'root',
})
export class CampingService {
  private http = inject(HttpClient);
  private offlineStorage = inject(OfflineStorageService);
  private apiUrl = `${environment.apiUrl}/mapa`;

  listar(): Observable<Camping[]> {
    return this.http.get<Camping[]>(`${this.apiUrl}/campings`).pipe(
      tap((campings) => this.offlineStorage.saveCampings(campings)),
      catchError(() => from(this.offlineStorage.getCampings())),
    );
  }

  obterAvaliacoesCamping(campingId: number): Observable<AvaliacaoComUsuario[]> {
    return this.http.get<AvaliacaoComUsuario[]>(
      `${this.apiUrl}/camping/${campingId}/avaliacoes`,
    );
  }

  criarAvaliacao(avaliacao: Avaliacao): Observable<Avaliacao> {
    return this.http.post<Avaliacao>(`${environment.apiUrl}/avaliacao`, avaliacao);
  }

  atualizarAvaliacao(avaliacaoId: number, avaliacao: Avaliacao): Observable<Avaliacao> {
    return this.http.put<Avaliacao>(
      `${this.apiUrl}/camping/avaliacoes/${avaliacaoId}`,
      avaliacao,
    );
  }

  obterAvaliacaoUsuario(
    campingId: number,
    usuarioId: string,
    checkinId?: number,
  ): Observable<Avaliacao[] | []> {
    let url = `${this.apiUrl}/camping/${campingId}/avaliacoes/${usuarioId}`;
    if (checkinId) {
      url += `?checkinId=${checkinId}`;
    }
    return this.http.get<Avaliacao[] | []>(url);
  }
}
