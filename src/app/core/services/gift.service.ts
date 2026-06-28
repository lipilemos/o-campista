import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { retry, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Presente } from '../models/presente.model';

@Injectable({
  providedIn: 'root',
})
export class GiftService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/presentes`;

  createGift(data: FormData) {
    return this.http.post(this.apiUrl, data).pipe(
      retry({ count: 2, delay: (_, retryCount) => timer(retryCount * 1000) }),
    );
  }

  getNearby(latitude: number, longitude: number) {
    return this.http.get<Presente[]>(this.apiUrl, {
      params: {
        latitude: String(latitude),
        longitude: String(longitude),
      },
    });
  }

  resgatar(presenteId: number, usuarioId: string) {
    return this.http
      .post(`${this.apiUrl}/resgatar`, {
        presenteId,
        usuarioId,
      })
      .pipe(retry({ count: 2, delay: (_, retryCount) => timer(retryCount * 1000) }));
  }

  deletar(presenteId: number) {
    return this.http.delete<{ mensagem: string }>(`${this.apiUrl}/${presenteId}`);
  }
}
