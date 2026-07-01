import { Conquista } from './conquista.model';
import { Presente } from './presente.model';

export interface UsuarioLogado {
  id: string;
  nome: string;
  email: string;
  fotoPerfil: string;
  token: string;
  nivel: number;
  xp: number;
  xpProximoNivel: number;
  totalCheckins: number;
  totalCampingsVisitados: number;
  totalTrilhasConcluidas: number;
  conquistas: Conquista[];
  presentes: Presente[];
}
