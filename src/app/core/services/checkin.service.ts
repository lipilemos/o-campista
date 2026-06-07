import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environment';
import { CheckinRequestModel, CheckinResponseModel } from '../models/checkin.model';

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
}
