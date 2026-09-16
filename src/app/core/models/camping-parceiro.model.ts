import { StatusOcupacao } from './camping.model';

export type TipoCampingComDono = 'camping' | 'pesca';
export type DonoStatus = 'pendente' | 'aprovado';

export interface CampingParceiro {
  id: number;
  nome: string;
  tipo: string;
  cidade: string;
  estado: string;
  latitude: number;
  longitude: number;
  ativo: boolean;
  donoStatus: DonoStatus;
  criadoEm: string;
}

export interface CampingParceiroRequest {
  nome: string;
  tipo: TipoCampingComDono;
  descricao?: string;
  endereco?: string;
  cidade: string;
  estado: string;
  telefone?: string;
  latitude: number;
  longitude: number;
  recursosIds: number[];
}

export interface CampingProximo {
  id: number;
  nome: string;
  tipo: string;
  cidade: string;
  estado: string;
  distanciaMetros: number;
}

export interface CheckinsDia {
  data: string;
  quantidade: number;
}

export interface CampingPainel {
  campingId: number;
  checkins30Dias: number;
  checkinsTotal: number;
  visitantesUnicos: number;
  avaliacaoMedia: number;
  totalAvaliacoes: number;
  totalFavoritos: number;
  statusOcupacao: StatusOcupacao | null;
  checkinsPorDia: CheckinsDia[];
}

export interface Recurso {
  id: number;
  nome: string;
}
