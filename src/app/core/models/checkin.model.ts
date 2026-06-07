export interface CheckinRequestModel {
    usuarioId: number;
    campingId: number;
    latitude: number;
    longitude: number;
}
export interface CheckinResponseModel {
    mensagem: string;
}
export interface Checkin {
    usuarioId: number;
    campingId: number;
    latitude: number;
    longitude: number;
}
