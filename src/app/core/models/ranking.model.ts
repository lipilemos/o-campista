export interface RankingItem {
  posicao: number;
  usuarioId: string;
  nome: string;
  fotoPerfil?: string;
  nivel: number;
  xp: number;
  totalCheckins: number;
  estouSeguindo: boolean;
}

export interface CampingRanking {
  posicao: number;
  campingId: number;
  nome: string;
  cidade?: string;
  estado?: string;
  fotoPrincipal?: string;
  avaliacaoMedia: number;
  totalCheckins: number;
}
