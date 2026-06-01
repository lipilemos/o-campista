import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Camping } from '../models/camping.model';

@Injectable({
    providedIn: 'root'
})
export class CampingService {

    private http = inject(HttpClient);

    private apiUrl = 'https://localhost:44316/api/mapa/campings';

    listar(): Observable<Camping[]> {
        return this.http.get<Camping[]>(this.apiUrl);
    }
}
