import { Camping } from './camping.model';

export interface HistoricoCheckin {
  id?: number;
  usuarioId: string;
  campingId: number;
  camping: Camping;
  dataCriacao: string;
  latitude: number;
  longitude: number;
}
