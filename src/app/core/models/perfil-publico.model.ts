import { Conquista } from './conquista.model';
import { HistoricoCheckin } from './historico-checkin.model';

export interface PerfilPublico {
  id: string;
  nome: string;
  fotoPerfil: string;
  nivel?: number;
  xp?: number;
  totalCheckins?: number;
  totalCampingsVisitados?: number;
  totalTrilhasConcluidas?: number;
  conquistas?: Conquista[];
  ultimosCheckins?: HistoricoCheckin[];
  totalSeguidores: number;
  totalSeguindo: number;
  estouSeguindo: boolean;
}

export interface ConfiguracaoPrivacidade {
  perfilPublico: boolean;
  checkinsPublicos: boolean;
  conquistasPublicas: boolean;
  nivelPublico: boolean;
}

export interface UsuarioBusca {
  id: string;
  nome: string;
  fotoPerfil: string;
  nivel: number;
}
