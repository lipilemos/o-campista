import { WeatherForecast } from "./weather-forecast.model";
import { Weather } from "./weather.model";

export interface DadosClima {
    clima: Weather;
    previsao: WeatherForecast[];
}
