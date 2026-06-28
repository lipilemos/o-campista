import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { WeatherForecastCardComponent } from '../../components/weather-card-forecast/weather-card-forecast.component';
import { WeatherCardComponent } from '../../components/weather-card/weather-card.component';
import { UsuarioLogado } from '../../core/models/user.model';
import { WeatherForecast } from '../../core/models/weather-forecast.model';
import { Weather } from '../../core/models/weather.model';
import { AuthService } from '../../core/services/auth.service';
import { WeatherService } from '../../core/services/weather.service';

@Component({
  selector: 'app-home',
  imports: [WeatherCardComponent, WeatherForecastCardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  private weatherService = inject(WeatherService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  previsao3Dias: WeatherForecast[] = [];
  weather?: Weather;
  usuario!: UsuarioLogado;

  ngOnInit() {
    const usuario = this.authService.obterUsuarioLogado();
    if (usuario) {
      this.usuario = usuario;
    }

    this.weatherService.carregarDadosClima().subscribe((dados) => {
      this.weather = dados.clima;
      this.previsao3Dias = dados.previsao;
      this.cdr.markForCheck();
    });
  }
}
