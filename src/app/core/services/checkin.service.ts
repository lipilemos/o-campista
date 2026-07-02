import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, retry, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CheckinRequestModel, CheckinResponseModel } from '../models/checkin.model';
import { HistoricoCheckin } from '../models/historico-checkin.model';

@Injectable({
  providedIn: 'root',
})
export class CheckinService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/checkin`;

  checkin(request: CheckinRequestModel): Observable<CheckinResponseModel> {
    return this.http
      .post<CheckinResponseModel>(`${this.apiUrl}`, request)
      .pipe(retry({ count: 2, delay: (_, retryCount) => timer(retryCount * 1000) }));
  }

  obterHistorico(usuarioId: string): Observable<HistoricoCheckin[]> {
    return this.http.get<HistoricoCheckin[]>(`${this.apiUrl}/historico/${usuarioId}`);
  }

  contarCheckinsRecentes(campingId: number): Observable<{ quantidade: number }> {
    return this.http.get<{ quantidade: number }>(`${this.apiUrl}/camping/${campingId}/recentes`);
  }

  contarTotalVisitas(campingId: number): Observable<{ total: number }> {
    return this.http.get<{ total: number }>(`${this.apiUrl}/camping/${campingId}/total`);
  }
}
