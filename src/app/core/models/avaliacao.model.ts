export interface Avaliacao {
  id?: number;
  checkinId?: number;
  usuarioId: string;
  campingId: number;
  nota: number;
  comentario: string;
  xpGanho?: number;
  dataCriacao?: string;
  dataAtualizacao?: string;
}

export interface AvaliacaoComUsuario extends Avaliacao {
  usuarioNome: string;
  usuarioFoto: string;
}
