export interface Trilha {
  id: number;
  campingId?: number;
  criadorNome?: string;
  nome: string;
  descricao?: string;
  distanciaKm: number;
  dificuldade?: string;
  avaliacaoMedia?: number;
  checkinsRecentes?: number;
  latitude?: number;
  longitude?: number;
  criadoEm: string;
  pontos: TrilhaPonto[];
  concluidaPeloUsuario: boolean;
}

export interface TrilhaPonto {
  id: number;
  ordem: number;
  latitude: number;
  longitude: number;
}

export interface CriarTrilhaRequest {
  nome: string;
  descricao?: string;
  dificuldade: string;
  criadorId: string;
  criadorNome: string;
  pontos: { ordem: number; latitude: number; longitude: number }[];
}

export interface TrilhaRascunho {
  waypoints: { ordem: number; latitude: number; longitude: number }[];
  distanciaTotal: number;
  finalizando: boolean;
  nome: string;
  dificuldade: string;
  descricao: string;
}
