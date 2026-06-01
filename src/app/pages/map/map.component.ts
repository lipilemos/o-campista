import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  ViewChild
} from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { environment } from '../../../environment';
import { Camping } from '../../core/models/camping.model';
import { CampingService } from '../../core/services/camping.service';
import { MapStateService } from '../../core/services/map-state.service';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [GoogleMapsModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})

export class MapComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    this.criarMapa();
    this.carregarCampings();
  }
  campingSelecionado?: Camping;
  private mapState =
    inject(MapStateService);


  private campingService = inject(CampingService);

  @ViewChild('mapContainer', { static: true })
  mapContainer!: ElementRef;

  map!: google.maps.Map;

  private carregarCampings() {

    this.campingService
      .listar()
      .subscribe(campings => {

        campings.forEach(camping => {

          this.criarMarker(camping);

        });

      });
  }
  protected fecharCampingInfo() {

    this.mapState.campingAberto.set(false);
    this.campingSelecionado = undefined;
  }

  private criarMapa() {
    this.map = new google.maps.Map(
      this.mapContainer.nativeElement,
      {
        center: {
          lat: -22.0174,
          lng: -47.8903
        },
        zoom: 10,
        mapId: environment.idMaps
      }
    );
  }

  private obterEmoji(tipo: string): string {

    switch (tipo) {

      case 'camping':
        return '🏕️';

      case 'cachoeira':
        return '💧';

      case 'trilha':
        return '🥾';

      case 'mirante':
        return '🌄';

      case 'pesca':
        return '🎣';

      default:
        return '📍';
    }
  }
  private criarMarker(camping: Camping) {

    const element = document.createElement('div');

    element.className = `camping-marker marker-${camping.tipo}`;

    element.innerHTML =
      this.obterEmoji(camping.tipo);

    element.style.width = '30px';
    element.style.height = '30px';

    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.justifyContent = 'center';

    element.style.fontSize = '50px';

    const marker =
      new google.maps.marker.AdvancedMarkerElement({
        map: this.map,
        position: {
          lat: camping.latitude,
          lng: camping.longitude
        },
        title: camping.nome,
        content: element,
        gmpClickable: true,
      });

    marker.addEventListener('gmp-click', () => {
      this.mapState.campingAberto.set(true);
      this.campingSelecionado = camping;
    });
  }

}

