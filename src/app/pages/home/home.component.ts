import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { WeatherForecastCardComponent } from '../../components/weather-card-forecast/weather-card-forecast.component';
import { WeatherCardComponent } from '../../components/weather-card/weather-card.component';
import { UsuarioLogado } from '../../core/models/user.model';
import { WeatherForecast } from '../../core/models/weather-forecast.model';
import { Weather } from '../../core/models/weather.model';
import { AuthService } from '../../core/services/auth.service';
import { MapStateService } from '../../core/services/map-state.service';
import { WeatherService } from '../../core/services/weather.service';
import { AccountComponent } from '../account/account.component';
import { ChecklistComponent } from '../checklist/checklist.component';
import { MapComponent } from '../map/map.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MapComponent,
    WeatherCardComponent,
    WeatherForecastCardComponent,
    ChecklistComponent,
    AccountComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent implements OnInit {
  constructor(
    private authService: AuthService
  ) { }

  ngOnInit() {
    const usuario = this.authService.obterUsuarioLogado();

    if (usuario) {
      this.usuario = usuario;
    }
    this.weatherService
      .carregarDadosClima()
      .subscribe(dados => {

        this.weather =
          dados.clima;

        this.previsao3Dias =
          dados.previsao;
      });
  }

  private weatherService =
    inject(WeatherService);

  previsao3Dias: WeatherForecast[] = [];
  weather?: Weather;
  usuario!: UsuarioLogado;
  menuOpen = false;
  telaAtual = 'home';

  protected mapState =
    inject(MapStateService);

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  abrirHome() {
    this.telaAtual = 'home';
    this.menuOpen = false;
  }
  abrirMapa() {
    this.telaAtual = 'mapa';
    this.menuOpen = false;
  }
  abrirChecklist() {
    this.telaAtual = 'checklist';
    this.menuOpen = false;
  }
  abrirMinhaConta() {
    this.telaAtual = 'account';
    this.menuOpen = false;
  }
  logout(): void {

    this.authService.logout();
  }
}
