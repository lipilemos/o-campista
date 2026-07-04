import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CampingRanking, RankingItem } from '../models/ranking.model';

@Injectable({ providedIn: 'root' })
export class RankingService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ranking`;

  getGlobal(pagina = 1, limite = 50): Observable<RankingItem[]> {
    return this.http.get<RankingItem[]>(`${this.apiUrl}/global`, {
      params: { pagina, limite },
    });
  }

  getSeguidos(): Observable<RankingItem[]> {
    return this.http.get<RankingItem[]>(`${this.apiUrl}/seguidos`);
  }

  getCampings(pagina = 1, limite = 20): Observable<CampingRanking[]> {
    return this.http.get<CampingRanking[]>(`${this.apiUrl}/campings`, {
      params: { pagina, limite },
    });
  }
}
