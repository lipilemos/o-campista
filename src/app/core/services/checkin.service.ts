import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CheckinRequestModel, CheckinResponseModel } from '../models/checkin.model';
import { HistoricoCheckin } from '../models/historico-checkin.model';

@Injectable({
    providedIn: 'root'
})
export class CheckinService {

    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/checkin`;

    checkin(request: CheckinRequestModel): Observable<CheckinResponseModel> {
        return this.http.post<CheckinResponseModel>(`${this.apiUrl}`, request).pipe(
            tap(response => {
                console.log('Check-in realizado com sucesso:', response);
            })
        );
    }

    obterHistorico(usuarioId: number): Observable<HistoricoCheckin[]> {
        return this.http.get<HistoricoCheckin[]>(`${this.apiUrl}/historico/${usuarioId}`);
    }
}
