import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { WeatherForecast } from '../../core/models/weather-forecast.model';

@Component({
  selector: 'app-weather-card-forecast',
  imports: [CommonModule],
  templateUrl: './weather-card-forecast.component.html',
  styleUrls: ['./weather-card-forecast.component.scss'],
})
export class WeatherForecastCardComponent {
  @Input()
  previsoes: WeatherForecast[] = [];
}
