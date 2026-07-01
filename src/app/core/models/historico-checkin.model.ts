import { Camping } from './camping.model';

export interface HistoricoCheckin {
  id?: number;
  usuarioId: string;
  campingId: number;
  trilhaId?: number;
  trilhaNome?: string;
  camping: Camping | null;
  dataCriacao: string;
  latitude: number;
  longitude: number;
}
