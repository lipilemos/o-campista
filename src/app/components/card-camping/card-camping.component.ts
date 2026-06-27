import { Component, inject, input, output, signal } from '@angular/core';
import { Camping } from '../../core/models/camping.model';
import { CheckinRequestModel, CheckinResponseModel } from '../../core/models/checkin.model';
import { AuthService } from '../../core/services/auth.service';
import { CheckinService } from '../../core/services/checkin.service';
import { MapStateService } from '../../core/services/map-state.service';
import { Util } from '../../core/Utils.ts/Util';
import { AvaliacoesUsuariosComponent } from '../avaliacoes-usuarios/avaliacoes-usuarios.component';

@Component({
  selector: 'app-card-camping',
  imports: [AvaliacoesUsuariosComponent],
  templateUrl: './card-camping.component.html',
  styleUrl: './card-camping.component.scss',

})
export class CardCampingComponent {
  private authService = inject(AuthService);
  private checkinService = inject(CheckinService);
  private mapState = inject(MapStateService);

  campingSelecionado = input.required<Camping>();
  minhaPosicao = input<google.maps.LatLngLiteral>();
  fechar = output<void>();

  mensagemCheckin = signal('');
  tipoMensagem = signal<'sucesso' | 'erro' | ''>('');
  checkinRealizado = signal(false);

  fecharCampingInfo() {
    this.mapState.campingAberto.set(false);
    this.mapState.presenteAberto.set(false);
    this.fechar.emit();
  }

  podeFazerCheckin(): boolean {
    const pos = this.minhaPosicao();
    const camping = this.campingSelecionado();

    if (!pos || !camping) return false;
    if (camping.tipo !== 'camping') return false;

    const distancia = Util.calcularDistanciaMetros(
      pos.lat,
      pos.lng,
      camping.latitude,
      camping.longitude,
    );

    return distancia <= 250;
  }

  fazerCheckin() {
    this.mensagemCheckin.set('');
    this.tipoMensagem.set('');

    const usuario = this.authService.getUser();
    const pos = this.minhaPosicao();
    const camping = this.campingSelecionado();

    if (!usuario || !pos || !camping) return;

    const request: CheckinRequestModel = {
      usuarioId: usuario.id,
      campingId: camping.id,
      latitude: pos.lat,
      longitude: pos.lng,
    };

    this.checkinService.checkin(request).subscribe({
      next: (response: CheckinResponseModel) => {
        this.checkinRealizado.set(true);
        this.tipoMensagem.set('sucesso');
        this.mensagemCheckin.set(
          response?.mensagem ?? 'Check-in realizado com sucesso! +100 XP',
        );
      },

      error: (err: { error?: { mensagem?: string; erro?: string }; message?: string }) => {
        this.tipoMensagem.set('erro');
        this.mensagemCheckin.set(
          err?.error?.mensagem ?? err?.error?.erro ?? err?.message ?? 'Erro ao realizar check-in.',
        );
      },
    });
  }
}
