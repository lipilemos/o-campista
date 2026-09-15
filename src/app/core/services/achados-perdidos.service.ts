import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, retry, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AcessoAchados, AchadoPerdido, TipoAchado } from '../models/achado-perdido.model';
import { SalaChat } from '../models/chat-room.model';

export interface NovoAchadoPerdido {
  tipo: TipoAchado;
  titulo: string;
  descricao?: string;
  localGuarda?: string;
  foto?: File | null;
}

@Injectable({
  providedIn: 'root',
})
export class AchadosPerdidosService {
  private http = inject(HttpClient);

  private apiUrl = environment.apiUrl;

  acesso(campingId: number): Observable<AcessoAchados> {
    return this.http.get<AcessoAchados>(
      `${this.apiUrl}/campings/${campingId}/achados-perdidos/acesso`,
    );
  }

  listar(
    campingId: number,
    tipo: TipoAchado | null,
    incluirResolvidos: boolean,
    pagina: number,
    limite: number,
  ): Observable<AchadoPerdido[]> {
    const params: Record<string, string> = {
      incluirResolvidos: String(incluirResolvidos),
      pagina: String(pagina),
      limite: String(limite),
    };
    if (tipo) params['tipo'] = tipo;

    return this.http.get<AchadoPerdido[]>(`${this.apiUrl}/campings/${campingId}/achados-perdidos`, {
      params,
    });
  }

  criar(campingId: number, item: NovoAchadoPerdido): Observable<AchadoPerdido> {
    const formData = new FormData();
    formData.append('tipo', item.tipo);
    formData.append('titulo', item.titulo);
    if (item.descricao) formData.append('descricao', item.descricao);
    if (item.localGuarda) formData.append('localGuarda', item.localGuarda);
    if (item.foto) formData.append('foto', item.foto, item.foto.name);

    return this.http
      .post<AchadoPerdido>(`${this.apiUrl}/campings/${campingId}/achados-perdidos`, formData)
      .pipe(retry({ count: 2, delay: (_, retryCount) => timer(retryCount * 1000) }));
  }

  resolver(id: number): Observable<void> {
    return this.http
      .patch<void>(`${this.apiUrl}/achados-perdidos/${id}/resolver`, {})
      .pipe(retry({ count: 2, delay: (_, retryCount) => timer(retryCount * 1000) }));
  }

  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/achados-perdidos/${id}`);
  }

  /** Abre (ou reaproveita) a conversa direta com quem publicou o item. */
  reivindicar(id: number): Observable<SalaChat> {
    return this.http.post<SalaChat>(`${this.apiUrl}/achados-perdidos/${id}/reivindicar`, {});
  }
}
