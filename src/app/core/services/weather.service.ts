import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
    Observable,
    catchError,
    forkJoin,
    from,
    map,
    of,
    switchMap,
    tap
} from 'rxjs';

import { WeatherForecast } from '../models/weather-forecast.model';
import { Weather } from '../models/weather.model';
import { OfflineStorageService } from './offline-storage.service';

@Injectable({
    providedIn: 'root'
})
export class WeatherService {

    private http =
        inject(HttpClient);
    private offlineStorage = inject(OfflineStorageService);

    private obterCidade(
        latitude: number,
        longitude: number
    ): Observable<string> {

        return this.http.get<any>(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
        )
            .pipe(

                map(response => {

                    const address =
                        response.address;

                    const cidade =
                        address?.city ||
                        address?.town ||
                        address?.village ||
                        'São Carlos';

                    const estado =
                        address?.state ||
                        'SP';

                    return `${cidade}/${estado}`;
                }),

                catchError(() =>
                    of('São Carlos/SP')
                )
            );
    }

    private obterLocalizacao(): Promise<{
        latitude: number;
        longitude: number;
    }> {

        return new Promise(resolve => {
            if (!navigator.geolocation) {

                resolve({
                    latitude: -22.0174,
                    longitude: -47.8903
                });

                return;
            }
            navigator.geolocation.getCurrentPosition(

                position => {

                    console.log(
                        'Localização obtida:',
                        position.coords.latitude,
                        position.coords.longitude
                    );

                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },

                error => {

                    switch (error.code) {

                        case error.PERMISSION_DENIED:
                            console.warn(
                                'Usuário negou acesso à localização.'
                            );
                            break;

                        case error.POSITION_UNAVAILABLE:
                            console.warn(
                                'Localização indisponível.'
                            );
                            break;

                        case error.TIMEOUT:
                            console.warn(
                                'Tempo limite excedido.'
                            );
                            break;

                        default:
                            console.warn(
                                'Erro desconhecido.'
                            );
                    }

                    resolve({
                        latitude: -22.0174,
                        longitude: -47.8903
                    });
                },

                {
                    enableHighAccuracy: false,
                    timeout: 2000,
                    maximumAge: 300000
                }
            );
        });
    }

    private obterStatusCamping(
        temperatura: number,
        chuva: number,
        vento: number
    ): string {

        if (chuva > 60)
            return 'Ruim';

        if (vento > 35)
            return 'Atenção';

        if (temperatura < 16)
            return 'Atenção';

        return 'Excelente';
    }

    private obterIcone(
        weatherCode: number
    ): string {

        if (weatherCode === 0)
            return '☀️';

        if (weatherCode <= 3)
            return '🌤️';

        if (weatherCode <= 67)
            return '🌧️';

        return '☁️';
    }

    private obterDescricao(
        weatherCode: number
    ): string {

        switch (weatherCode) {

            case 0:
                return 'Céu limpo';

            case 1:
            case 2:
            case 3:
                return 'Parcialmente nublado';

            case 45:
            case 48:
                return 'Neblina';

            case 61:
            case 63:
            case 65:
                return 'Chuva';

            default:
                return 'Tempo variável';
        }
    }

    private obterNomeDia(
        data: string
    ): string {

        const dias = [
            'Dom',
            'Seg',
            'Ter',
            'Qua',
            'Qui',
            'Sex',
            'Sáb'
        ];

        return dias[
            new Date(data).getDay()
        ];
    }
    carregarDadosClima(): Observable<{
        clima: Weather;
        previsao: WeatherForecast[];
    }> {

        return from(
            this.obterLocalizacao()
        ).pipe(

            switchMap(position => {

                const lat = position.latitude;
                const lng = position.longitude;

                return forkJoin({

                    clima: this.obterClimaAtualPorCoordenada(
                        lat,
                        lng
                    ),

                    previsao: this.obterPrevisaoPorCoordenada(
                        lat,
                        lng
                    )
                });
            }),

            tap(dados => this.offlineStorage.saveWeather(dados.clima, dados.previsao)),

            catchError(() =>
                from(this.offlineStorage.getWeather()).pipe(
                    map(cache => {
                        if (cache) {
                            return { clima: cache.clima, previsao: cache.previsao };
                        }
                        throw new Error('Sem dados de clima em cache');
                    })
                )
            )
        );
    }
    private obterClimaAtualPorCoordenada(
        lat: number,
        lng: number
    ): Observable<Weather> {

        return this.http.get<any>(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&hourly=precipitation_probability&forecast_hours=1`
        )
            .pipe(

                switchMap(clima =>

                    this.obterCidade(
                        lat,
                        lng
                    ).pipe(

                        map(cidade => {

                            const current =
                                clima.current;
                            const chanceChuva = clima.hourly.precipitation_probability[0];
                            return {

                                cidade,

                                temperatura:
                                    current.temperature_2m ?? 0,

                                descricao:
                                    this.obterDescricao(
                                        current.weather_code
                                    ),

                                umidade:
                                    current.relative_humidity_2m ?? 0,

                                vento:
                                    current.wind_speed_10m ?? 0,

                                chuva:
                                    chanceChuva ?? 0,

                                statusCamping:
                                    this.obterStatusCamping(
                                        current.temperature_2m ?? 0,
                                        chanceChuva ?? 0,
                                        current.wind_speed_10m ?? 0
                                    ),

                                icone:
                                    this.obterIcone(
                                        current.weather_code
                                    )

                            } as Weather;
                        })
                    )
                )
            );
    }
    private obterPrevisaoPorCoordenada(
        lat: number,
        lng: number
    ): Observable<WeatherForecast[]> {

        return this.http.get<any>(
            `https://api.open-meteo.com/v1/forecast
        ?latitude=${lat}
        &longitude=${lng}
        &daily=weather_code,temperature_2m_max,temperature_2m_min
        &forecast_days=5
        &timezone=auto`
                .replace(/\s/g, '')
        )
            .pipe(

                map(response => {

                    const previsoes:
                        WeatherForecast[] = [];

                    for (let i = 2; i < 5; i++) {

                        previsoes.push({

                            dia:
                                this.obterNomeDia(
                                    response.daily.time[i]
                                ),

                            temperaturaMaxima:
                                Math.round(
                                    response.daily.temperature_2m_max[i]
                                ),

                            temperaturaMinima:
                                Math.round(
                                    response.daily.temperature_2m_min[i]
                                ),

                            descricao:
                                this.obterDescricao(
                                    response.daily.weather_code[i]
                                ),

                            icone:
                                this.obterIcone(
                                    response.daily.weather_code[i]
                                )
                        });
                    }

                    return previsoes;
                })
            );
    }
}
