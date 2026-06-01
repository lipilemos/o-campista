import { Component, inject } from '@angular/core';
import { MapStateService } from '../../core/services/map-state.service';
import { MapComponent } from '../map/map.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MapComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent {

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
