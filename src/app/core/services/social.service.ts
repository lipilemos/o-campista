import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Comentario, FeedItem } from '../models/feed-item.model';

interface PostViagemResponse {
  id: number;
  usuarioId: string;
  usuarioNome: string;
  usuarioFoto?: string;
  texto: string;
  fotoUrl?: string;
  campingId?: number;
  campingNome?: string;
  criadoEm: string;
  totalCurtidas: number;
  curtiu: boolean;
}
import {
  ConfiguracaoPrivacidade,
  PerfilPublico,
  UsuarioBusca,
} from '../models/perfil-publico.model';

@Injectable({ providedIn: 'root' })
export class SocialService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/usuarios`;

  getPerfil(id: string): Observable<PerfilPublico> {
    return this.http.get<PerfilPublico>(`${this.apiUrl}/${id}/perfil`);
  }

  buscarUsuarios(nome: string): Observable<UsuarioBusca[]> {
    return this.http.get<UsuarioBusca[]>(`${this.apiUrl}/buscar`, { params: { nome } });
  }

  seguir(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/seguir`, {});
  }

  desseguir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/seguir`);
  }

  getSeguidores(id: string): Observable<UsuarioBusca[]> {
    return this.http.get<UsuarioBusca[]>(`${this.apiUrl}/${id}/seguidores`);
  }

  getSeguindo(id: string): Observable<UsuarioBusca[]> {
    return this.http.get<UsuarioBusca[]>(`${this.apiUrl}/${id}/seguindo`);
  }

  getPrivacidade(id: string): Observable<ConfiguracaoPrivacidade> {
    return this.http.get<ConfiguracaoPrivacidade>(`${this.apiUrl}/${id}/privacidade`);
  }

  salvarPrivacidade(id: string, config: ConfiguracaoPrivacidade): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/privacidade`, config);
  }

  getFeed(pagina = 1, limite = 20): Observable<FeedItem[]> {
    return this.http.get<FeedItem[]>(`${environment.apiUrl}/feed`, {
      params: { pagina, limite },
    });
  }

  getDescobrir(pagina = 1, limite = 20): Observable<FeedItem[]> {
    return this.http.get<FeedItem[]>(`${environment.apiUrl}/feed/descobrir`, {
      params: { pagina, limite },
    });
  }

  criarPost(dados: FormData): Observable<FeedItem> {
    return this.http.post<PostViagemResponse>(`${environment.apiUrl}/posts`, dados).pipe(
      map((r) => ({
        id: r.id,
        tipo: 'post' as const,
        usuarioId: r.usuarioId,
        usuarioNome: r.usuarioNome,
        usuarioFoto: r.usuarioFoto ?? '',
        criadoEm: r.criadoEm,
        postId: r.id,
        postTexto: r.texto,
        postFotoUrl: r.fotoUrl,
        campingNome: r.campingNome,
        totalCurtidas: r.totalCurtidas,
        curtiu: r.curtiu,
      })),
    );
  }

  deletarPost(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/posts/${id}`);
  }

  curtir(postId: number): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/posts/${postId}/curtir`, {});
  }

  descurtir(postId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/posts/${postId}/curtir`);
  }

  getComentarios(postId: number, pagina = 1): Observable<Comentario[]> {
    return this.http.get<Comentario[]>(`${environment.apiUrl}/posts/${postId}/comentarios`, {
      params: { pagina },
    });
  }

  criarComentario(postId: number, texto: string): Observable<Comentario> {
    return this.http.post<Comentario>(`${environment.apiUrl}/posts/${postId}/comentarios`, {
      texto,
    });
  }

  deletarComentario(comentarioId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/comentarios/${comentarioId}`);
  }

  getSugestoes(): Observable<UsuarioBusca[]> {
    return this.http.get<UsuarioBusca[]>(`${this.apiUrl}/sugestoes`);
  }
}
