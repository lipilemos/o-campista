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
  segueMutuo: boolean;
}

export interface ConfiguracaoPrivacidade {
  perfilPublico: boolean;
  checkinsPublicos: boolean;
  conquistasPublicas: boolean;
  nivelPublico: boolean;
  visivelNoMapa: boolean;
}

export interface LocalizacaoUsuario {
  usuarioId: string;
  nome: string;
  fotoUrl?: string;
  lat: number;
  lng: number;
}

export interface UsuarioBusca {
  id: string;
  nome: string;
  fotoPerfil: string;
  nivel: number;
}
