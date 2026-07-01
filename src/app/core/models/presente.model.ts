export interface Presente {
  id: number;
  nome: string;
  descricao: string;
  codigoResgate: string;
  utilizado: boolean;
  fotoUrl: string;
  latitude: number;
  longitude: number;
  usuarioCriadorId: string;
  estaDisponivel: boolean;
  criadoEm: Date;
}
