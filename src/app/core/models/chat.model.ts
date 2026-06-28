export interface MensagemChat {
  id?: number;
  campingId: number;
  usuarioId: number;
  nomeUsuario: string;
  fotoUsuario: string;
  texto: string;
  dataEnvio: string;
}
