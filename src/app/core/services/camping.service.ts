import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { Camping } from '../models/camping.model';

@Injectable({
    providedIn: 'root'
})
export class CampingService {

    private http = inject(HttpClient);

    private apiUrl = `${environment.apiUrl}/mapa/campings`;

    listar(): Observable<Camping[]> {
        return this.http.get<Camping[]>(this.apiUrl);
    }

    checkin(campingId: number) {

        return this.http.post(
            `${this.apiUrl}/${campingId}/checkin`,
            {}
        );
    }
}
