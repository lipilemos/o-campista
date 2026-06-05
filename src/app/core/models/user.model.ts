import { Conquista } from "./conquista.model";
import { Presente } from "./presente.model";

export interface UsuarioLogado {
  id: number;
  nome: string;
  email: string;
  token: string;
  nivel: number;
  xpAtual: number;
  xpProximoNivel: number;
  totalCheckins: number;
  totalCampingsVisitados: number;
  totalTrilhasConcluidas: number;
  conquistas: Conquista[];
  presentes: Presente[];
}
