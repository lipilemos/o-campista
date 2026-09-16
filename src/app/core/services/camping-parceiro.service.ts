import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CampingPainel,
  CampingParceiro,
  CampingParceiroRequest,
  CampingProximo,
  Recurso,
} from '../models/camping-parceiro.model';

@Injectable({
  providedIn: 'root',
})
export class CampingParceiroService {
  private http = inject(HttpClient);

  private apiUrl = environment.apiUrl;
  private baseUrl = `${this.apiUrl}/campings/parceiros`;

  criar(request: CampingParceiroRequest): Observable<CampingParceiro> {
    return this.http.post<CampingParceiro>(this.baseUrl, request);
  }

  reivindicar(campingId: number): Observable<CampingParceiro> {
    return this.http.post<CampingParceiro>(`${this.baseUrl}/${campingId}/reivindicar`, {});
  }

  listarMeus(): Observable<CampingParceiro[]> {
    return this.http.get<CampingParceiro[]>(`${this.baseUrl}/meus`);
  }

  obterPainel(campingId: number): Observable<CampingPainel> {
    return this.http.get<CampingPainel>(`${this.baseUrl}/${campingId}/painel`);
  }

  buscarProximos(lat: number, lng: number): Observable<CampingProximo[]> {
    return this.http.get<CampingProximo[]>(`${this.baseUrl}/proximos`, {
      params: { lat: String(lat), lng: String(lng) },
    });
  }

  listarRecursos(): Observable<Recurso[]> {
    return this.http.get<Recurso[]>(`${this.apiUrl}/recursos`);
  }
}
