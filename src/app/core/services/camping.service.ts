import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, from, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Avaliacao, AvaliacaoComUsuario } from '../models/avaliacao.model';
import { CampingFoto } from '../models/camping-foto.model';
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

  private readonly _favoritos = signal<Set<number>>(new Set());
  readonly favoritos = this._favoritos.asReadonly();
  private favoritosCarregados = false;

  carregarFavoritos(usuarioId: string): void {
    if (this.favoritosCarregados) return;
    this.http
      .get<Camping[]>(`${environment.apiUrl}/usuarios/${usuarioId}/favoritos`)
      .subscribe({
        next: (lista) => {
          this._favoritos.set(new Set(lista.map((c) => c.id)));
          this.favoritosCarregados = true;
        },
        error: () => {},
      });
  }

  getFavoritos(usuarioId: string): Observable<Camping[]> {
    return this.http.get<Camping[]>(`${environment.apiUrl}/usuarios/${usuarioId}/favoritos`);
  }

  favoritar(usuarioId: string, campingId: number): Observable<void> {
    this._favoritos.update((s) => new Set([...s, campingId]));
    return this.http.post<void>(
      `${environment.apiUrl}/usuarios/${usuarioId}/favoritos/${campingId}`,
      {},
    );
  }

  desfavoritar(usuarioId: string, campingId: number): Observable<void> {
    this._favoritos.update((s) => {
      const next = new Set(s);
      next.delete(campingId);
      return next;
    });
    return this.http.delete<void>(
      `${environment.apiUrl}/usuarios/${usuarioId}/favoritos/${campingId}`,
    );
  }

  ehFavorito(campingId: number): boolean {
    return this._favoritos().has(campingId);
  }

  reverterFavorito(campingId: number, eraFavorito: boolean): void {
    this._favoritos.update((s) => {
      const next = new Set(s);
      if (eraFavorito) next.add(campingId);
      else next.delete(campingId);
      return next;
    });
  }

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

  obterFotos(campingId: number): Observable<CampingFoto[]> {
    return this.http.get<CampingFoto[]>(`${this.apiUrl}/camping/${campingId}/fotos`);
  }

  obterAvaliacoesCamping(campingId: number): Observable<AvaliacaoComUsuario[]> {
    return this.http.get<AvaliacaoComUsuario[]>(`${this.apiUrl}/camping/${campingId}/avaliacoes`);
  }

  criarAvaliacao(avaliacao: Avaliacao, foto?: File): Observable<Avaliacao> {
    const formData = new FormData();
    formData.append('usuarioId', avaliacao.usuarioId);
    formData.append('campingId', (avaliacao.campingId ?? 0).toString());
    formData.append('checkinId', (avaliacao.checkinId ?? 0).toString());
    formData.append('nota', avaliacao.nota.toString());
    formData.append('comentario', avaliacao.comentario);
    formData.append('xpGanho', (avaliacao.xpGanho ?? 0).toString());
    if (foto) formData.append('foto', foto);
    return this.http.post<Avaliacao>(`${environment.apiUrl}/avaliacao`, formData);
  }

  atualizarAvaliacao(avaliacaoId: number, avaliacao: Avaliacao): Observable<Avaliacao> {
    return this.http.put<Avaliacao>(`${this.apiUrl}/camping/avaliacoes/${avaliacaoId}`, avaliacao);
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
