import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { WeatherForecast } from '../../core/models/weather-forecast.model';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-weather-card-forecast',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './weather-card-forecast.component.html',
  styleUrls: ['./weather-card-forecast.component.scss'],
})
export class WeatherForecastCardComponent {
  @Input()
  previsoes: WeatherForecast[] = [];
}
