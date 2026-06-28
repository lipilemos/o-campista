import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CardCampingComponent } from '../../components/card-camping/card-camping.component';
import { CardGiftComponent } from '../../components/card-gift/card-gift.component';
import { Camping } from '../../core/models/camping.model';
import { Presente } from '../../core/models/presente.model';
import { CampingService } from '../../core/services/camping.service';
import { GiftService } from '../../core/services/gift.service';
import { LocationService } from '../../core/services/location.service';
import { MapStateService } from '../../core/services/map-state.service';
import { NetworkStatusService } from '../../core/services/network-status.service';


@Component({
  selector: 'app-map',
  imports: [
    GoogleMapsModule,
    FormsModule,
    CommonModule,
    CardCampingComponent,
    CardGiftComponent
  ],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit, OnDestroy {
  ngOnDestroy(): void {

    this.locationSubscription?.unsubscribe();

    if (this.watchId) {

      navigator.geolocation.clearWatch(
        this.watchId
      );
    }
  }

  private mapState = inject(MapStateService);
  private giftService = inject(GiftService);
  private campingService = inject(CampingService);
  protected networkStatus = inject(NetworkStatusService);
  private locationSubscription?: Subscription;

  constructor(
    private locationService: LocationService
  ) { }

  @ViewChild('mapContainer', { static: false })
  mapContainer?: ElementRef;

  map!: google.maps.Map;

  campingSelecionado?: Camping;
  presenteSelecionado?: Presente;
  busca = '';
  categoriaSelecionada = '';

  campings: Camping[] = [];

  markers: google.maps.marker.AdvancedMarkerElement[] = [];
  userMarker?: google.maps.marker.AdvancedMarkerElement;
  raioUsuario?: google.maps.Circle;
  watchId?: number;
  minhaPosicao?: google.maps.LatLngLiteral;
  private jacentralizouNoPrimeiroGps = false;

  ngAfterViewInit(): void {
    this.criarMapa();
    this.carregarCampings();
    this.definirLocalizacaoInicial();
  }

  private carregarCampings() {

    this.campingService
      .listar()
      .subscribe(campings => {

        this.campings = campings;

        this.aplicarFiltros();
      });
  }
  private carregaPresentes() {
    const pos = this.minhaPosicao ?? this.posicaoPadrao;

    this.giftService.getNearby(pos.lat, pos.lng)
      .subscribe(presentes => {
        // desenha apenas os marcadores de presentes sem sobrescrever a lista principal
        this.limparMarkers();

        const presentesMark: Presente[] = presentes.map(p => ({
          id: p.id,
          nome: p.nome,
          descricao: p.descricao,
          latitude: p.latitude,
          longitude: p.longitude,
          codigoResgate: p.codigoResgate,
          utilizado: p.utilizado,
          usuarioCriadorId: p.usuarioCriadorId,
          estaDisponivel: p.estaDisponivel,
          criadoEm: new Date(p.criadoEm),
          tipo: 'presente',
          fotoUrl: p.fotoUrl || '',
        }));

        presentesMark.forEach(presente => {
          this.criarMarkerPresente(presente);
        });
      });
  }
  private criarMarkerPresente(presente: Presente) {

    const element = document.createElement('div');

    element.className = `camping-marker marker-presente`;

    element.innerHTML = this.obterEmoji('presente');

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
          lat: presente.latitude,
          lng: presente.longitude
        },
        title: presente.nome,
        content: element,
        gmpClickable: true
      });

    marker.addEventListener('gmp-click', () => {
      this.mapState.campingAberto.set(false);
      this.campingSelecionado = undefined;

      this.mapState.presenteAberto.set(true);
      this.presenteSelecionado = presente;
    });

    this.markers.push(marker);
  }

  private definirLocalizacaoInicial() {

    // começa SEM depender de GPS
    this.minhaPosicao = this.posicaoPadrao;

    this.atualizarMapaInicial();

    this.iniciarLocalizacao();
  }
  private atualizarMapaInicial() {

    if (!this.map) return;

    this.map.setCenter(this.minhaPosicao!);
    this.map.setZoom(12);

    this.atualizarMarcadorUsuario();
  }

  aplicarFiltros() {

    this.limparMarkers();

    const campingsFiltrados =
      this.campings.filter(camping => {

        const atendeBusca =
          !this.busca ||
          camping.nome
            .toLowerCase()
            .includes(this.busca.toLowerCase()) ||
          camping.cidade
            .toLowerCase()
            .includes(this.busca.toLowerCase()) ||
          camping.estado
            .toLowerCase()
            .includes(this.busca.toLowerCase());

        const atendeCategoria =
          !this.categoriaSelecionada ||
          camping.tipo === this.categoriaSelecionada;



        return atendeBusca && atendeCategoria;
      });
    if (this.categoriaSelecionada === 'presente') {
      // solicita presentes próximos ao backend e desenha marcadores
      this.carregaPresentes();
      this.atualizarRaioUsuario();
      return;
    }

    campingsFiltrados.forEach(camping => {
      this.criarMarkerCampings(camping);
    });
    this.limparRaioUsuario();
  }

  private limparMarkers() {

    this.markers.forEach(marker => {
      marker.map = null;
    });

    this.markers = [];
  }

  protected fecharCampingInfo() {
    this.mapState.campingAberto.set(false);
    this.campingSelecionado = undefined;
    this.mapState.presenteAberto.set(false);
    this.presenteSelecionado = undefined;
  }

  private criarMapa() {
    if (!this.mapContainer) return;

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
  private iniciarLocalizacao() {

    if (!navigator.geolocation) {
      console.warn('Geolocalização não suportada');
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(

      position => {

        this.minhaPosicao = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        this.atualizarMarcadorUsuario();

        if (!this.jacentralizouNoPrimeiroGps) {
          this.jacentralizouNoPrimeiroGps = true;
          this.map.panTo(this.minhaPosicao);
        }
      },

      error => {
        console.warn('GPS indisponível (mantendo posição padrão)', error);
        // NÃO sobrescreve o mapa aqui
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000
      }
    );
  }
  private usarPosicaoPadrao() {

    this.minhaPosicao = this.posicaoPadrao;

    this.atualizarMarcadorUsuario();
  }
  private readonly posicaoPadrao: google.maps.LatLngLiteral = {
    lat: -22.0174,
    lng: -47.8903 // sua região atual (já está usando isso)
  };
  private atualizarRaioUsuario() {

    if (!this.minhaPosicao) {
      return;
    }

    if (!this.raioUsuario) {

      this.raioUsuario = new google.maps.Circle({
        map: this.map,
        center: this.minhaPosicao,
        radius: 10000, // 10 km

        strokeColor: '#4CAF50',
        strokeOpacity: 0.8,
        strokeWeight: 2,

        fillColor: '#4CAF50',
        fillOpacity: 0.15
      });

      return;
    }

    this.raioUsuario.setCenter(
      this.minhaPosicao
    );
  }

  private limparRaioUsuario() {

    if (!this.raioUsuario) {
      return;
    }

    this.raioUsuario.setMap(null);
    this.raioUsuario = undefined;
  }

  private atualizarMarcadorUsuario() {

    if (!this.minhaPosicao) return;

    const el = document.createElement('div');

    el.style.width = '18px';
    el.style.height = '18px';
    el.style.borderRadius = '50%';
    el.style.background = '#4285F4';
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 0 6px rgba(0,0,0,0.3)';

    if (!this.userMarker) {

      this.userMarker = new google.maps.marker.AdvancedMarkerElement({
        map: this.map,
        position: this.minhaPosicao,
        title: 'Você está aqui',
        content: el
      });

      this.map.setCenter(this.minhaPosicao);
      this.map.setZoom(13);

      return;
    }

    this.userMarker.position = this.minhaPosicao;
  }

  centralizarNoUsuario() {

    if (!this.minhaPosicao) {
      return;
    }

    this.map.panTo(
      this.minhaPosicao
    );

    this.map.setZoom(16);
  }
  protected obterEmoji(tipo: string): string {

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

      case 'presente':
        return '🎁';

      default:
        return '📍';
    }
  }

  private criarMarkerCampings(camping: Camping) {

    const element = document.createElement('div');

    element.className =
      `camping-marker marker-${camping.tipo}`;

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
        gmpClickable: true
      });

    marker.addEventListener('gmp-click', () => {
      this.mapState.presenteAberto.set(false);
      this.presenteSelecionado = undefined;

      this.mapState.campingAberto.set(true);
      this.campingSelecionado = camping;
    });

    this.markers.push(marker);
  }

}

