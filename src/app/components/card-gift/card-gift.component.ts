import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { Presente } from '../../core/models/presente.model';
import { AuthService } from '../../core/services/auth.service';
import { GiftService } from '../../core/services/gift.service';
import { MapStateService } from '../../core/services/map-state.service';
import { ToastService } from '../../core/services/toast.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { Util } from '../../core/Utils.ts/Util';

@Component({
  selector: 'app-card-gift',
  imports: [DatePipe],
  templateUrl: './card-gift.component.html',
  styleUrl: './card-gift.component.scss',
})
export class CardGiftComponent {
  private authService = inject(AuthService);
  private giftService = inject(GiftService);
  private mapState = inject(MapStateService);
  private toast = inject(ToastService);
  private usuarioService = inject(UsuarioService);

  presenteSelecionado = input.required<Presente>();
  minhaPosicao = input<google.maps.LatLngLiteral>();
  fechar = output<void>();

  distanciaPresente = computed(() => {
    const pos = this.minhaPosicao();
    const presente = this.presenteSelecionado();
    if (!pos) return null;
    return Math.round(
      Util.calcularDistanciaMetros(pos.lat, pos.lng, presente.latitude, presente.longitude),
    );
  });

  podeResgatar = computed(() => {
    const dist = this.distanciaPresente();
    return dist !== null && dist <= 150;
  });

  mensagemDistancia = computed(() => {
    const dist = this.distanciaPresente();
    if (dist === null) return '';
    if (dist <= 150) return 'Você encontrou o presente! 🎁';
    if (dist <= 500) return 'Está perto, continue caminhando 🚶';
    return 'Você está longe do presente 📍';
  });

  classeDistancia = computed(() => {
    const dist = this.distanciaPresente();
    if (dist === null) return '';
    if (dist <= 150) return 'perto';
    if (dist <= 500) return 'medio';
    return 'longe';
  });

  fecharInfo() {
    this.mapState.campingAberto.set(false);
    this.mapState.presenteAberto.set(false);
    this.fechar.emit();
  }

  ehMeuPresente(): boolean {
    const usuario = this.authService.getUser();
    return usuario?.id === this.presenteSelecionado().usuarioCriadorId;
  }

  copiarCodigo() {
    navigator.clipboard.writeText(this.presenteSelecionado().codigoResgate);
    this.toast.success('Código copiado!');
  }

  resgatarPresente() {
    const usuario = this.authService.getUser();
    const presente = this.presenteSelecionado();

    if (!usuario) return;

    this.giftService.resgatar(presente.id, usuario.id.toString()).subscribe({
      next: () => {
        this.toast.success('🎉 Você encontrou um presente! +XP');
        presente.estaDisponivel = false;
        this.usuarioService.verificarNovasConquistas();
      },

      error: (erro: { error?: { mensagem?: string } }) => {
        this.toast.error(erro.error?.mensagem ?? 'Erro ao resgatar presente');
      },
    });
  }
}
