export type TipoAtividade = 'checkin' | 'conquista' | 'avaliacao' | 'post' | 'trilha_concluida';

export interface FeedItem {
  id: number;
  tipo: TipoAtividade;
  usuarioId: string;
  usuarioNome: string;
  usuarioFoto: string;
  criadoEm: string;

  // checkin
  campingNome?: string;
  campingFoto?: string;
  campingId?: number;
  ocupacaoReportada?: 'tranquilo' | 'movimentado' | 'lotado';

  // conquista
  conquistaNome?: string;
  conquistaDescricao?: string;
  conquistaIcone?: string;

  // avaliacao
  nota?: number;
  comentario?: string;
  avaliacaoFotoUrl?: string;
  localNome?: string;

  // post
  postId?: number;
  postTexto?: string;
  postFotoUrl?: string;
  totalCurtidas?: number;
  totalComentarios?: number;
  curtiu?: boolean;

  // trilha_concluida
  trilhaNome?: string;
  distanciaKm?: number;
  dificuldade?: string;
}

export interface Comentario {
  id: number;
  postId: number;
  usuarioId: string;
  usuarioNome: string;
  usuarioFoto?: string;
  texto: string;
  criadoEm: string;
}
