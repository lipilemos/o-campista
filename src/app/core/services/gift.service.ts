import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Presente } from '../models/presente.model';

@Injectable({
    providedIn: 'root'
})
export class GiftService {
    private http = inject(HttpClient);

    private apiUrl = `${environment.apiUrl}/presentes`;

    //criar presentes
    createGift(data: FormData) {
        return this.http.post(this.apiUrl, data);
    }
    // Busca presentes próximos usando latitude/longitude como query params
    getNearby(latitude: number, longitude: number) {
        return this.http.get<Presente[]>(this.apiUrl, {
            params: {
                latitude: String(latitude),
                longitude: String(longitude)
            }
        });
    }
    //resgatar um presente
    resgatar(presenteId: number, usuarioId: string) {
        return this.http.post(`${this.apiUrl}/resgatar`,
            {
                presenteId,
                usuarioId
            });
    }

}
