import { Component, inject, OnInit } from '@angular/core';
import { WeatherForecastCardComponent } from '../../components/weather-card-forecast/weather-card-forecast.component';
import { WeatherCardComponent } from '../../components/weather-card/weather-card.component';
import { WeatherForecast } from '../../core/models/weather-forecast.model';
import { Weather } from '../../core/models/weather.model';
import { MapStateService } from '../../core/services/map-state.service';
import { WeatherService } from '../../core/services/weather.service';
import { MapComponent } from '../map/map.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MapComponent, WeatherCardComponent, WeatherForecastCardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent implements OnInit {
  ngOnInit() {
    this.weatherService
      .obterClimaAtual()
      .subscribe(weather => {
        this.weather = weather;
      });

    this.weatherService
      .obterPrevisao3Dias()
      .subscribe(previsao => {

        this.previsao3Dias =
          previsao;
      });
  }

  private weatherService =
    inject(WeatherService);

  previsao3Dias: WeatherForecast[] = [];
  weather?: Weather;

  menuOpen = false;
  telaAtual = 'home';

  protected mapState =
    inject(MapStateService);

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  abrirMapa() {
    this.telaAtual = 'mapa';
    this.menuOpen = false;
  }

  abrirHome() {
    this.telaAtual = 'home';
    this.menuOpen = false;
  }

  abrirChecklist() {
    this.telaAtual = 'checklist';
    this.menuOpen = false;
  }

}
