import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Camping, StatusOcupacao } from '../../core/models/camping.model';
import { Presente } from '../../core/models/presente.model';
import { Util } from '../../core/Utils.ts/Util';
import { AuthService } from '../../core/services/auth.service';
import { CampingService } from '../../core/services/camping.service';
import { GiftService } from '../../core/services/gift.service';
import { I18nService } from '../../core/services/i18n.service';
import { LocationService } from '../../core/services/location.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

interface PresenteComDistancia extends Presente {
  distanciaMetros: number;
}

@Component({
  selector: 'app-home-nearby-widget',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './home-nearby-widget.component.html',
  styleUrl: './home-nearby-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeNearbyWidgetComponent {
  private locationService = inject(LocationService);
  private giftService = inject(GiftService);
  private campingService = inject(CampingService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private i18n = inject(I18nService);

  presentes = signal<PresenteComDistancia[]>([]);
  carregandoPresentes = signal(true);
  erroPresentes = signal(false);

  campingsFavoritos = signal<Camping[]>([]);
  carregandoCampings = signal(true);
  erroCampings = signal(false);

  constructor() {
    this.locationService.getCurrentPosition().subscribe((posicao) => {
      this.carregarPresentes(posicao.latitude, posicao.longitude);
    });

    const usuarioId = this.authService.obterUsuarioLogado()?.id as string | undefined;
    if (usuarioId) {
      this.carregarCampingsFavoritos(usuarioId);
    } else {
      this.carregandoCampings.set(false);
    }
  }

  private carregarPresentes(latitude: number, longitude: number): void {
    this.giftService.getNearby(latitude, longitude).subscribe({
      next: (lista) => {
        const comDistancia = lista
          .map((p) => ({
            ...p,
            distanciaMetros: Util.calcularDistanciaMetros(
              latitude,
              longitude,
              p.latitude,
              p.longitude,
            ),
          }))
          .sort((a, b) => a.distanciaMetros - b.distanciaMetros)
          .slice(0, 3);
        this.presentes.set(comDistancia);
        this.carregandoPresentes.set(false);
      },
      error: () => {
        this.erroPresentes.set(true);
        this.carregandoPresentes.set(false);
        this.toast.error(this.i18n.t('home.nearby.error'));
      },
    });
  }

  private carregarCampingsFavoritos(usuarioId: string): void {
    this.campingService.getFavoritos(usuarioId).subscribe({
      next: (lista) => {
        this.campingsFavoritos.set(lista.slice(0, 3));
        this.carregandoCampings.set(false);
      },
      error: () => {
        this.erroCampings.set(true);
        this.carregandoCampings.set(false);
        this.toast.error(this.i18n.t('home.nearby.error'));
      },
    });
  }

  formatarDistancia(metros: number): string {
    if (metros < 1000) return `${Math.round(metros)}m`;
    return `${(metros / 1000).toFixed(1)}km`;
  }

  statusOcupacao(
    camping: Camping,
  ): { nivel: StatusOcupacao['nivel']; emoji: string; label: string } | null {
    const nivel = camping.statusOcupacao?.nivel;
    if (!nivel) return null;
    const map: Record<StatusOcupacao['nivel'], { emoji: string; label: string }> = {
      tranquilo: { emoji: '😌', label: this.i18n.t('card.camping.tranquilo') },
      movimentado: { emoji: '🙂', label: this.i18n.t('card.camping.movimentado') },
      lotado: { emoji: '😬', label: this.i18n.t('card.camping.lotado') },
    };
    return { nivel, ...map[nivel] };
  }
}
