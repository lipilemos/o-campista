import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Camping } from '../models/camping.model';

@Injectable({
    providedIn: 'root'
})
export class CampingService {

    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/mapa`;

    listar(): Observable<Camping[]> {
        return this.http.get<Camping[]>(`${this.apiUrl}/campings`);
    }
}
