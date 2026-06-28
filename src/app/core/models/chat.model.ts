export interface MensagemChat {
  id?: number;
  campingId: number;
  salaId?: number;
  usuarioId: string;
  nomeUsuario: string;
  fotoUsuario: string;
  texto: string;
  dataEnvio: string;
}
