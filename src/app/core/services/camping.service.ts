import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, from, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Avaliacao, AvaliacaoComUsuario } from '../models/avaliacao.model';
import { Camping } from '../models/camping.model';
import { OfflineStorageService } from './offline-storage.service';

export interface CampingFiltro {
  busca?: string;
  tipo?: string;
  recursos?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class CampingService {
  private http = inject(HttpClient);
  private offlineStorage = inject(OfflineStorageService);
  private apiUrl = `${environment.apiUrl}/mapa`;

  listar(filtro?: CampingFiltro): Observable<Camping[]> {
    let params = new HttpParams();
    if (filtro?.busca) {
      params = params.set('busca', filtro.busca);
    }
    if (filtro?.tipo) {
      params = params.set('tipo', filtro.tipo);
    }
    if (filtro?.recursos?.length) {
      filtro.recursos.forEach((r) => {
        params = params.append('recursos', r);
      });
    }
    return this.http.get<Camping[]>(`${this.apiUrl}/campings`, { params }).pipe(
      tap((campings) => {
        if (!filtro?.busca && !filtro?.tipo && !filtro?.recursos?.length) {
          this.offlineStorage.saveCampings(campings);
        }
      }),
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
