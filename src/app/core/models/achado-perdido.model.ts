export type TipoAchado = 'achado' | 'perdido';

export interface AchadoPerdido {
  id: number;
  campingId: number;
  tipo: TipoAchado;
  titulo: string;
  descricao?: string;
  fotoUrl?: string;
  localGuarda?: string;
  resolvido: boolean;
  criadoEm: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioFoto?: string;
  souAutor: boolean;
}

export interface AcessoAchados {
  /** Já fez check-in neste camping alguma vez. */
  podeVer: boolean;
  /** Fez check-in neste camping nas últimas 24h. */
  podePublicar: boolean;
}
