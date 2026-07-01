export type OcupacaoStatus = 'tranquilo' | 'movimentado' | 'lotado';

export interface CheckinRequestModel {
  usuarioId: string;
  campingId?: number;
  trilhaId?: number;
  latitude: number;
  longitude: number;
  ocupacao?: OcupacaoStatus;
}
export interface CheckinResponseModel {
  mensagem: string;
}
export interface Checkin {
  usuarioId: string;
  campingId?: number;
  trilhaId?: number;
  latitude: number;
  longitude: number;
}
