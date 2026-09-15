import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { AchadoPerdido } from '../../../core/models/achado-perdido.model';
import { I18nService } from '../../../core/services/i18n.service';
import { ImgFallbackDirective } from '../../../core/directives/img-fallback.directive';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-achado-perdido-card',
  imports: [ImgFallbackDirective, TranslatePipe],
  templateUrl: './achado-perdido-card.component.html',
  styleUrl: './achado-perdido-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchadoPerdidoCardComponent {
  item = input.required<AchadoPerdido>();
  reivindicando = input(false);

  reivindicar = output<AchadoPerdido>();
  resolver = output<AchadoPerdido>();
  deletar = output<AchadoPerdido>();

  private i18n = inject(I18nService);

  ehAchado = computed(() => this.item().tipo === 'achado');

  /** Rótulo relativo da publicação — "há 2 h" em pt-BR, "2 h ago" em en-US. */
  tempoRelativo = computed(() => {
    const minutos = Math.floor((Date.now() - new Date(this.item().criadoEm).getTime()) / 60000);

    if (minutos < 1) return this.i18n.t('lost.card.now');

    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    let quantidade: string;
    if (minutos < 60) quantidade = `${minutos} min`;
    else if (horas < 24) quantidade = `${horas} h`;
    else quantidade = `${dias} ${this.i18n.t('lost.card.days')}`;

    // Português prefixa ("há 2 h"), inglês sufixa ("2 h ago") — cada locale preenche o seu lado.
    return [this.i18n.t('lost.card.ago-prefix'), quantidade, this.i18n.t('lost.card.ago-suffix')]
      .filter((parte) => parte.length > 0)
      .join(' ');
  });
}
