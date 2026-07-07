import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription, debounceTime } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CardCampingComponent } from '../../components/card-camping/card-camping.component';
import { CardGiftComponent } from '../../components/card-gift/card-gift.component';
import { CardTrilhaComponent } from '../../components/card-trilha/card-trilha.component';
import { CriarTrilhaComponent } from '../../components/criar-trilha/criar-trilha.component';
import { TrilhaDetailComponent } from '../../components/trilha-detail/trilha-detail.component';
import { Camping } from '../../core/models/camping.model';
import { LocalizacaoUsuario } from '../../core/models/perfil-publico.model';
import { Presente } from '../../core/models/presente.model';
import { Trilha } from '../../core/models/trilha.model';
import { AuthService } from '../../core/services/auth.service';
import { CampingService } from '../../core/services/camping.service';
import { GiftService } from '../../core/services/gift.service';
import { LocationService } from '../../core/services/location.service';
import { LocationSharingService } from '../../core/services/location-sharing.service';
import { MapStateService } from '../../core/services/map-state.service';
import { NetworkStatusService } from '../../core/services/network-status.service';
import { SocialService } from '../../core/services/social.service';
import { TrilhaDraftService } from '../../core/services/trilha-draft.service';
import { TrilhaService } from '../../core/services/trilha.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-map',
  imports: [
    GoogleMapsModule,
    FormsModule,
    CommonModule,
    CardCampingComponent,
    CardGiftComponent,
    TrilhaDetailComponent,
    CriarTrilhaComponent,
    CardTrilhaComponent,
    TranslatePipe,
  ],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private buscaSubject = new Subject<void>();

  ngOnDestroy(): void {
    this.buscaSubject.complete();
    this.locationSubscription?.unsubscribe();

    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
    }

    this.trilhaIndependenteMarkers.forEach((m) => (m.map = null));
    this.trilhaIndependenteMarkers.clear();
    this.polylineGravacao?.setMap(null);

    clearInterval(this.locationInterval);
    this.compartilhamentoAtivo = false;
    this.locationSharingService.parar();
    this.seguidorMarkers.forEach((m) => (m.map = null));
    this.seguidorMarkers.clear();
  }

  protected mapState = inject(MapStateService);
  private giftService = inject(GiftService);
  private campingService = inject(CampingService);
  private trilhaService = inject(TrilhaService);
  private trilhaDraftService = inject(TrilhaDraftService);
  private authService = inject(AuthService);
  private socialService = inject(SocialService);
  private locationSharingService = inject(LocationSharingService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private presenteIdParaAbrir?: number;
  protected networkStatus = inject(NetworkStatusService);
  private locationSubscription?: Subscription;
  private locationInterval?: ReturnType<typeof setInterval>;
  private compartilhamentoAtivo = false;
  private readonly seguidorMarkers = new Map<string, google.maps.marker.AdvancedMarkerElement>();

  constructor(private locationService: LocationService) {
    effect(() => {
      const seguidores = this.locationSharingService.seguidoresVisiveis();
      if (!this.map) return;
      this.atualizarMarcadoresSeguidores(seguidores);
    });
  }

  @ViewChild('mapContainer', { static: false })
  mapContainer?: ElementRef;

  map!: google.maps.Map;

  campingSelecionado?: Camping;
  presenteSelecionado?: Presente;
  trilhaSelecionada?: Trilha;

  // Trilhas independentes (criadas por usuários)
  trilhaIndependenteSelecionada = signal<Trilha | undefined>(undefined);
  gravandoTrilha = false;
  private readonly trilhaIndependenteMarkers = new Map<
    number,
    google.maps.marker.AdvancedMarkerElement
  >();
  protected polylineGravacao?: google.maps.Polyline;

  // trilha_id → polilinha desenhada no mapa
  private readonly trailPolylines = new Map<number, google.maps.Polyline>();
  trilhasDoMapa: Trilha[] = [];
  filtrosAbertos = false;
  busca = '';
  categoriaSelecionada = '';

  get filtrosAtivos(): number {
    return (
      (this.busca ? 1 : 0) + (this.categoriaSelecionada ? 1 : 0) + this.recursosSelecionados.size
    );
  }

  campings: Camping[] = [];
  recursosDisponiveis: string[] = [];
  private recursosCarregados = false;
  recursosSelecionados: Set<string> = new Set();
  recursoSelectValue = '';

  markers: google.maps.marker.AdvancedMarkerElement[] = [];
  userMarker?: google.maps.marker.AdvancedMarkerElement;
  raioUsuario?: google.maps.Circle;
  watchId?: number;
  minhaPosicao?: google.maps.LatLngLiteral;
  private jacentralizouNoPrimeiroGps = false;

  ngAfterViewInit(): void {
    this.criarMapa();
    this.definirLocalizacaoInicial();

    const presenteId = this.route.snapshot.queryParamMap.get('presenteId');
    if (presenteId) {
      this.presenteIdParaAbrir = Number(presenteId);
      this.categoriaSelecionada = 'presente';
    }

    if (this.trilhaDraftService.temRascunho()) {
      this.iniciarGravacaoTrilha();
    }

    this.buscaSubject.pipe(debounceTime(400)).subscribe(() => {
      this.carregarCampings();
    });

    this.carregarCampings();
    this.carregarTrilhasIndependentes();
    this.iniciarCompartilhamentoLocalizacao();
  }

  private carregarCampings() {
    this.atualizarVisibilidadeTrilhasIndependentes();

    if (this.categoriaSelecionada === 'presente') {
      this.limparMarkers();
      this.carregaPresentes();
      this.atualizarRaioUsuario();
      return;
    }

    const filtro = {
      busca: this.busca || undefined,
      tipo: this.categoriaSelecionada || undefined,
      recursos: this.recursosSelecionados.size > 0 ? [...this.recursosSelecionados] : undefined,
    };

    this.campingService.listar(filtro).subscribe((campings) => {
      this.campings = campings;
      if (!this.recursosCarregados) {
        this.extrairRecursosDisponiveis();
        this.recursosCarregados = true;
      }
      this.desenharMarkers();
    });
  }

  // Trilhas independentes (criadas por usuários) são desenhadas fora do fluxo de
  // filtro de campings/presentes — sem isso, permaneciam visíveis mesmo com um
  // filtro de categoria (ex: presentes) ativo. Ficam visíveis quando nenhum filtro
  // está ativo ou quando o filtro de categoria "Trilha" está selecionado.
  private trilhaIndependenteVisivel(): boolean {
    return this.categoriaSelecionada === '' || this.categoriaSelecionada === 'trilha';
  }

  private atualizarVisibilidadeTrilhasIndependentes(): void {
    const visivel = this.trilhaIndependenteVisivel();
    this.trilhaIndependenteMarkers.forEach((marker) => {
      marker.map = visivel ? this.map : null;
    });
  }

  private carregaPresentes() {
    const pos = this.minhaPosicao ?? this.posicaoPadrao;

    this.giftService.getNearby(pos.lat, pos.lng).subscribe((presentes) => {
      // desenha apenas os marcadores de presentes sem sobrescrever a lista principal
      this.limparMarkers();

      const presentesMark: Presente[] = presentes.map((p) => ({
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

      presentesMark.forEach((presente) => {
        this.criarMarkerPresente(presente);
      });

      if (this.presenteIdParaAbrir) {
        const alvo = presentesMark.find((p) => p.id === this.presenteIdParaAbrir);
        if (alvo) {
          this.selecionarPresente(alvo);
          this.map.panTo({ lat: alvo.latitude, lng: alvo.longitude });
          this.map.setZoom(16);
        }
        this.presenteIdParaAbrir = undefined;
      }
    });
  }

  private selecionarPresente(presente: Presente): void {
    this.ngZone.run(() => {
      this.mapState.campingAberto.set(false);
      this.campingSelecionado = undefined;

      this.mapState.presenteAberto.set(true);
      this.presenteSelecionado = presente;
      this.cdr.detectChanges();
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

    const marker = new google.maps.marker.AdvancedMarkerElement({
      map: this.map,
      position: {
        lat: presente.latitude,
        lng: presente.longitude,
      },
      title: presente.nome,
      content: element,
      gmpClickable: true,
    });

    marker.addEventListener('gmp-click', () => {
      this.selecionarPresente(presente);
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

  private extrairRecursosDisponiveis() {
    const recursos = new Set<string>();
    this.campings.forEach((camping) => {
      camping.recursos.filter((r) => r.disponivel).forEach((r) => recursos.add(r.nome));
    });
    this.recursosDisponiveis = [...recursos].sort();
  }

  onRecursoSelect(recurso: string) {
    if (!recurso) return;
    if (this.recursosSelecionados.has(recurso)) {
      this.recursosSelecionados.delete(recurso);
    } else {
      this.recursosSelecionados.add(recurso);
    }
    this.recursoSelectValue = '';
    this.carregarCampings();
  }

  removerRecurso(recurso: string) {
    this.recursosSelecionados.delete(recurso);
    this.carregarCampings();
  }

  aplicarFiltros() {
    this.buscaSubject.next();
  }

  aplicarFiltrosImediato() {
    this.carregarCampings();
  }

  private desenharMarkers() {
    this.limparMarkers();
    this.limparRaioUsuario();
    this.campings.forEach((camping) => {
      this.criarMarkerCampings(camping);
    });
  }

  private limparMarkers() {
    this.markers.forEach((marker) => {
      marker.map = null;
    });

    this.markers = [];
  }

  protected fecharCampingInfo() {
    this.mapState.campingAberto.set(false);
    this.campingSelecionado = undefined;
    this.mapState.presenteAberto.set(false);
    this.presenteSelecionado = undefined;
    this.trilhaSelecionada = undefined;
    this.limparPolylines();
  }

  // Chamado quando o usuário clica em uma trilha na lista do card ou numa polilinha.
  // Destaca a polilinha selecionada e exibe o painel de detalhe.
  protected onTrilhaSelecionada(trilha: Trilha): void {
    this.trilhaSelecionada = trilha;
    this.destacarTrilha(trilha.id);

    // Centraliza o mapa na trilha selecionada
    const polyline = this.trailPolylines.get(trilha.id);
    if (polyline) {
      const bounds = new google.maps.LatLngBounds();
      (polyline.getPath().getArray() as google.maps.LatLng[]).forEach((p) => bounds.extend(p));
      this.map.fitBounds(bounds);
    }
  }

  protected fecharTrilhaDetail(): void {
    this.trilhaSelecionada = undefined;
    this.limparDestaques(); // restaura cor normal, polilinhas permanecem
  }

  // Carrega as trilhas de um camping e desenha todas no mapa ao selecionar o camping.
  private carregarTrilhasNomapa(campingId: number): void {
    this.limparPolylines();
    this.trilhasDoMapa = [];

    const usuarioId = this.authService.getUser()?.id;
    this.trilhaService.listarPorCamping(campingId, usuarioId).subscribe({
      next: (trilhas) => {
        this.trilhasDoMapa = trilhas;
        trilhas.forEach((trilha) => this.desenharPolyline(trilha));
      },
    });
  }

  private desenharPolyline(trilha: Trilha): void {
    if (trilha.pontos.length < 2) return;

    const path = trilha.pontos
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .map((p) => ({ lat: Number(p.latitude), lng: Number(p.longitude) }));

    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#4CAF50',
      strokeOpacity: 0.75,
      strokeWeight: 3,
      map: this.map,
    });

    polyline.addListener('click', () => this.onTrilhaSelecionada(trilha));

    this.trailPolylines.set(trilha.id, polyline);
  }

  private destacarTrilha(trilhaId: number): void {
    this.trailPolylines.forEach((polyline, id) => {
      if (id === trilhaId) {
        polyline.setOptions({ strokeColor: '#FF9800', strokeWeight: 5, strokeOpacity: 0.95 });
      } else {
        polyline.setOptions({ strokeColor: '#4CAF50', strokeWeight: 3, strokeOpacity: 0.4 });
      }
    });
  }

  private limparDestaques(): void {
    this.trailPolylines.forEach((polyline) => {
      polyline.setOptions({ strokeColor: '#4CAF50', strokeWeight: 3, strokeOpacity: 0.75 });
    });
  }

  private limparPolylines(): void {
    this.trailPolylines.forEach((polyline) => polyline.setMap(null));
    this.trailPolylines.clear();
    this.trilhasDoMapa = [];
  }

  private criarMapa() {
    if (!this.mapContainer) return;

    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      center: {
        lat: -22.0174,
        lng: -47.8903,
      },
      zoom: 10,
      mapId: environment.idMaps,
    });
  }
  private iniciarLocalizacao() {
    if (!navigator.geolocation) {
      console.warn('Geolocalização não suportada');
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.minhaPosicao = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        this.atualizarMarcadorUsuario();

        if (this.compartilhamentoAtivo) {
          this.locationSharingService.atualizarPosicao(
            this.minhaPosicao.lat,
            this.minhaPosicao.lng,
          );
        }

        if (!this.jacentralizouNoPrimeiroGps) {
          this.jacentralizouNoPrimeiroGps = true;
          this.map.panTo(this.minhaPosicao);
        }
      },

      (error) => {
        console.warn('GPS indisponível (mantendo posição padrão)', error);
        // NÃO sobrescreve o mapa aqui
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  }
  private usarPosicaoPadrao() {
    this.minhaPosicao = this.posicaoPadrao;

    this.atualizarMarcadorUsuario();
  }
  private readonly posicaoPadrao: google.maps.LatLngLiteral = {
    lat: -22.0174,
    lng: -47.8903, // sua região atual (já está usando isso)
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
        fillOpacity: 0.15,
      });

      return;
    }

    this.raioUsuario.setCenter(this.minhaPosicao);
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
        content: el,
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

    this.map.panTo(this.minhaPosicao);

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

  // ── Trilhas Independentes ───────────────────────────────────────────────

  private carregarTrilhasIndependentes(): void {
    this.trilhaService.listarMapa().subscribe({
      next: (trilhas) => trilhas.forEach((t) => this.criarMarkerTrilhaIndependente(t)),
    });
  }

  private criarMarkerTrilhaIndependente(trilha: Trilha): void {
    if (!trilha.latitude || !trilha.longitude) return;
    if (this.trilhaIndependenteMarkers.has(trilha.id)) return;

    const element = document.createElement('div');
    element.className = 'camping-marker marker-trilha-independente';
    element.innerHTML = '🥾';
    element.style.width = '30px';
    element.style.height = '30px';
    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.justifyContent = 'center';
    element.style.fontSize = '50px';

    const marker = new google.maps.marker.AdvancedMarkerElement({
      map: this.trilhaIndependenteVisivel() ? this.map : null,
      position: { lat: Number(trilha.latitude), lng: Number(trilha.longitude) },
      title: trilha.nome,
      content: element,
      gmpClickable: true,
    });

    marker.addEventListener('gmp-click', () => {
      this.ngZone.run(() => {
        this.mapState.campingAberto.set(false);
        this.campingSelecionado = undefined;
        this.mapState.presenteAberto.set(false);
        this.presenteSelecionado = undefined;
        this.trilhaSelecionada = undefined;
        this.trilhaIndependenteSelecionada.set(trilha);
        this.mapState.trilhaIndependenteAberta.set(true);

        if (!this.trailPolylines.has(trilha.id) && trilha.pontos?.length >= 2) {
          this.desenharPolyline(trilha);
        }
        const polyline = this.trailPolylines.get(trilha.id);
        if (polyline) {
          this.destacarTrilha(trilha.id);
          const bounds = new google.maps.LatLngBounds();
          (polyline.getPath().getArray() as google.maps.LatLng[]).forEach((p) => bounds.extend(p));
          this.map.fitBounds(bounds);
        }
      });
    });

    this.trilhaIndependenteMarkers.set(trilha.id, marker);
  }

  iniciarGravacaoTrilha(): void {
    this.polylineGravacao = new google.maps.Polyline({
      path: [],
      geodesic: true,
      strokeColor: '#FF5722',
      strokeWeight: 4,
      map: this.map,
    });
    this.gravandoTrilha = true;
    this.mapState.gravandoTrilha.set(true);
  }

  fecharGravacao(): void {
    this.gravandoTrilha = false;
    this.mapState.gravandoTrilha.set(false);
    this.polylineGravacao?.setMap(null);
    this.polylineGravacao = undefined;
  }

  onTrilhaCriada(trilha: Trilha): void {
    this.fecharGravacao();
    this.criarMarkerTrilhaIndependente(trilha);
    if (trilha.pontos?.length >= 2) {
      this.desenharPolyline(trilha);
    }
  }

  fecharCardTrilha(): void {
    this.trilhaIndependenteSelecionada.set(undefined);
    this.mapState.trilhaIndependenteAberta.set(false);
    this.limparPolylines();
  }

  // ────────────────────────────────────────────────────────────────────────

  private criarMarkerCampings(camping: Camping) {
    const element = document.createElement('div');

    element.className = `camping-marker marker-${camping.tipo}`;

    element.innerHTML = this.obterEmoji(camping.tipo);

    element.style.width = '30px';
    element.style.height = '30px';

    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.justifyContent = 'center';

    element.style.fontSize = '50px';

    const marker = new google.maps.marker.AdvancedMarkerElement({
      map: this.map,
      position: {
        lat: camping.latitude,
        lng: camping.longitude,
      },
      title: camping.nome,
      content: element,
      gmpClickable: true,
    });

    marker.addEventListener('gmp-click', () => {
      this.mapState.presenteAberto.set(false);
      this.presenteSelecionado = undefined;

      this.mapState.campingAberto.set(true);
      this.campingSelecionado = camping;

      this.carregarTrilhasNomapa(camping.id);
    });

    this.markers.push(marker);
  }

  private iniciarCompartilhamentoLocalizacao(): void {
    const userId = this.authService.getUser()?.id;
    if (!userId) return;

    this.socialService.getPrivacidade(userId).subscribe({
      next: (privacidade) => {
        if (!privacidade.visivelNoMapa) return;

        const enviar = () => {
          if (this.minhaPosicao) {
            this.locationSharingService.atualizarPosicao(
              this.minhaPosicao.lat,
              this.minhaPosicao.lng,
            );
          }
        };

        // Só inicia o interval depois que a conexão SignalR estiver estabelecida
        this.locationSharingService.iniciar().then(() => {
          this.compartilhamentoAtivo = true;
          enviar();
          this.locationInterval = setInterval(enviar, 30_000);
        });
      },
    });
  }

  private atualizarMarcadoresSeguidores(seguidores: LocalizacaoUsuario[]): void {
    const idsAtivos = new Set(seguidores.map((u) => u.usuarioId));

    // Remover marcadores de usuários que saíram
    this.seguidorMarkers.forEach((marker, id) => {
      if (!idsAtivos.has(id)) {
        marker.map = null;
        this.seguidorMarkers.delete(id);
      }
    });

    // Criar ou atualizar marcadores
    for (const usuario of seguidores) {
      const pos = { lat: usuario.lat, lng: usuario.lng };
      const existing = this.seguidorMarkers.get(usuario.usuarioId);

      if (existing) {
        existing.position = pos;
      } else {
        const marker = new google.maps.marker.AdvancedMarkerElement({
          map: this.map,
          position: pos,
          title: usuario.nome,
          content: this.criarConteudoMarcadorUsuario(usuario),
          gmpClickable: true,
        });

        marker.addEventListener('gmp-click', () => {
          this.ngZone.run(() => this.router.navigate(['/perfil', usuario.usuarioId]));
        });

        this.seguidorMarkers.set(usuario.usuarioId, marker);
      }
    }
  }

  private criarConteudoMarcadorUsuario(usuario: LocalizacaoUsuario): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:relative;width:44px;height:44px;cursor:pointer;';

    const avatar = document.createElement('div');
    avatar.style.cssText =
      'width:40px;height:40px;border-radius:50%;border:2px solid #fff;' +
      'box-shadow:0 2px 8px rgba(0,0,0,0.3);overflow:hidden;background:#6e1217;' +
      'display:flex;align-items:center;justify-content:center;';

    if (usuario.fotoUrl) {
      const img = document.createElement('img');
      img.src = usuario.fotoUrl;
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
      img.onerror = () => {
        img.style.display = 'none';
        avatar.appendChild(this.criarIniciais(usuario.nome));
      };
      avatar.appendChild(img);
    } else {
      avatar.appendChild(this.criarIniciais(usuario.nome));
    }

    const dot = document.createElement('div');
    dot.style.cssText =
      'position:absolute;bottom:2px;right:2px;width:10px;height:10px;' +
      'border-radius:50%;background:#22c55e;border:2px solid #fff;';

    wrapper.appendChild(avatar);
    wrapper.appendChild(dot);
    return wrapper;
  }

  private criarIniciais(nome: string): HTMLElement {
    const span = document.createElement('span');
    span.style.cssText = 'color:#fff;font-size:14px;font-weight:700;';
    span.textContent = nome
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();
    return span;
  }
}
