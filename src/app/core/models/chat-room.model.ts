export type TipoSala = 'camping' | 'grupo';

export interface SalaChat {
  id: number;
  nome: string;
  tipo: TipoSala;
  campingId?: number;
  fotoCapa?: string;
  codigoConvite?: string;
  dataCriacao: string;
  ultimaMensagem?: UltimaMensagem;
  totalNaoLidas: number;
  podeEnviar: boolean;
}

export interface UltimaMensagem {
  texto: string;
  nomeUsuario: string;
  dataEnvio: string;
}

export interface MembroSala {
  usuarioId: string;
  nomeUsuario: string;
  fotoUsuario?: string;
}

export interface CriarGrupoRequest {
  nome: string;
}

export interface CriarGrupoResponse {
  sala: SalaChat;
  codigoConvite: string;
}

export interface NaoLidasResponse {
  total: number;
  porSala: Record<number, number>;
}

export interface PodeEnviarResponse {
  podeEnviar: boolean;
  checkinExpiraEm?: string;
}

export interface MensagemSalaChat {
  id?: number;
  salaId: number;
  usuarioId: string;
  nomeUsuario: string;
  fotoUsuario?: string;
  texto: string;
  dataEnvio: string;
}
