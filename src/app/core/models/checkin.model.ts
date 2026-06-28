export interface CheckinRequestModel {
    usuarioId: string;
    campingId: number;
    latitude: number;
    longitude: number;
}
export interface CheckinResponseModel {
    mensagem: string;
}
export interface Checkin {
    usuarioId: string;
    campingId: number;
    latitude: number;
    longitude: number;
}
