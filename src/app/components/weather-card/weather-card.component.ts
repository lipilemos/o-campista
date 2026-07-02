import { Component, Input } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Weather } from '../../core/models/weather.model';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-weather-card',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './weather-card.component.html',
  styleUrls: ['./weather-card.component.scss'],
})
export class WeatherCardComponent {
  @Input()
  weather!: Weather;

  protected obterEmojiStatus(status: string): string {
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

  protected obterChaveStatus(status: string): string {
    switch (status) {
      case 'Excelente':
        return 'weather.status.excelente';
      case 'Atenção':
        return 'weather.status.atencao';
      case 'Ruim':
        return 'weather.status.ruim';
      default:
        return status;
    }
  }
}
