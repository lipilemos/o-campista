import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { OnboardingService } from '../../core/services/onboarding.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

const SIDEBAR_TRANSITION_DELAY_MS = 340;
const SPOTLIGHT_PADDING = 6;

@Component({
  selector: 'app-onboarding',
  imports: [TranslatePipe],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown.escape)': 'onEscape()',
    '(keydown.arrowright)': 'onArrowRight()',
    '(keydown.arrowleft)': 'onArrowLeft()',
  },
})
export class OnboardingComponent {
  protected service = inject(OnboardingService);

  protected targetRect = signal<DOMRect | null>(null);

  // O card com o texto fica sempre centralizado na tela (garante leitura/toque em
  // qualquer tamanho de viewport); este destaque só desenha o realce ao redor do
  // elemento real, atrás do card.
  protected spotlightStyle = computed(() => {
    const rect = this.targetRect();
    if (!rect) return null;
    return {
      top: `${rect.top - SPOTLIGHT_PADDING}px`,
      left: `${rect.left - SPOTLIGHT_PADDING}px`,
      width: `${rect.width + SPOTLIGHT_PADDING * 2}px`,
      height: `${rect.height + SPOTLIGHT_PADDING * 2}px`,
    };
  });

  private medirTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const visivel = this.service.visivel();
      const passo = this.service.passoAtualDados();

      this.limparTimeout();
      this.targetRect.set(null);

      if (!visivel || !passo.targetSelector) return;

      const delay = passo.sidebarTarget ? SIDEBAR_TRANSITION_DELAY_MS : 0;
      const selector = passo.targetSelector;
      this.medirTimeoutId = setTimeout(() => this.medirAlvo(selector), delay);
    });

    window.addEventListener('resize', this.onResize);
    inject(DestroyRef).onDestroy(() => {
      this.limparTimeout();
      window.removeEventListener('resize', this.onResize);
    });
  }

  protected onEscape(): void {
    if (this.service.visivel()) this.service.pular();
  }

  protected onArrowRight(): void {
    if (this.service.visivel()) this.service.proximo();
  }

  protected onArrowLeft(): void {
    if (this.service.visivel()) this.service.anterior();
  }

  private onResize = (): void => {
    const passo = this.service.passoAtualDados();
    if (this.service.visivel() && passo.targetSelector) {
      this.medirAlvo(passo.targetSelector);
    }
  };

  private medirAlvo(selector: string): void {
    const el = document.querySelector(selector);
    if (!el) {
      this.targetRect.set(null);
      return;
    }

    el.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' });
    requestAnimationFrame(() => this.targetRect.set(el.getBoundingClientRect()));
  }

  private limparTimeout(): void {
    if (this.medirTimeoutId !== null) {
      clearTimeout(this.medirTimeoutId);
      this.medirTimeoutId = null;
    }
  }
}