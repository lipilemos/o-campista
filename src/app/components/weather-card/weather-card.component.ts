import {
  Component,
  Input
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { Weather } from '../../core/models/weather.model';

@Component({
  selector: 'app-weather-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather-card.component.html',
  styleUrls: ['./weather-card.component.scss']
})
export class WeatherCardComponent {

  @Input()
  weather!: Weather;


  protected obterEmojiStatus(
    status: string
  ): string {

    switch (status) {

      case 'Excelente':
        return '🟢';

      case 'Atenção':
        return '🟡';

      case 'Ruim':
        return '🔴';

      default:
        return '🔵';
    }
  }
}

