export type TipoNotificacao = 'nova_curtida' | 'novo_comentario' | 'novo_seguidor' | 'mencao';

export interface Notificacao {
  id: number;
  tipo: TipoNotificacao;
  lida: boolean;
  criadoEm: string;
  remetenteId: string;
  remetenteNome: string;
  remetenteFoto?: string;
  postId?: number;
  postTexto?: string;
  comentarioTexto?: string;
}
