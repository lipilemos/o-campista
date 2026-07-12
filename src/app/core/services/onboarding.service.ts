import { Injectable, computed, signal } from '@angular/core';

export interface OnboardingStep {
  icone: string;
  tituloKey: string;
  descricaoKey: string;
}

const STORAGE_KEY = 'ocampista-onboarded';

@Injectable({
  providedIn: 'root',
})
export class OnboardingService {
  readonly visivel = signal(false);
  readonly passoAtual = signal(0);

  readonly passos: OnboardingStep[] = [
    {
      icone: '🏕️',
      tituloKey: 'onboarding.step-welcome.title',
      descricaoKey: 'onboarding.step-welcome.description',
    },
    {
      icone: '🗺️',
      tituloKey: 'onboarding.step-map.title',
      descricaoKey: 'onboarding.step-map.description',
    },
    {
      icone: '📍',
      tituloKey: 'onboarding.step-checkin.title',
      descricaoKey: 'onboarding.step-checkin.description',
    },
    {
      icone: '🥾',
      tituloKey: 'onboarding.step-trails.title',
      descricaoKey: 'onboarding.step-trails.description',
    },
    {
      icone: '🎁',
      tituloKey: 'onboarding.step-gifts.title',
      descricaoKey: 'onboarding.step-gifts.description',
    },
    {
      icone: '👥',
      tituloKey: 'onboarding.step-friends-map.title',
      descricaoKey: 'onboarding.step-friends-map.description',
    },
    {
      icone: '💬',
      tituloKey: 'onboarding.step-chat.title',
      descricaoKey: 'onboarding.step-chat.description',
    },
    {
      icone: '✅',
      tituloKey: 'onboarding.step-checklist.title',
      descricaoKey: 'onboarding.step-checklist.description',
    },
    {
      icone: '📸',
      tituloKey: 'onboarding.step-community.title',
      descricaoKey: 'onboarding.step-community.description',
    },
    {
      icone: '🏆',
      tituloKey: 'onboarding.step-gamification.title',
      descricaoKey: 'onboarding.step-gamification.description',
    },
  ];

  readonly totalPassos = this.passos.length;

  readonly passoAtualDados = computed(() => this.passos[this.passoAtual()]);
  readonly ehUltimoPasso = computed(() => this.passoAtual() === this.totalPassos - 1);

  iniciarSePrimeiraVez(): void {
    if (localStorage.getItem(STORAGE_KEY)) return;
    this.passoAtual.set(0);
    this.visivel.set(true);
  }

  reabrir(): void {
    this.passoAtual.set(0);
    this.visivel.set(true);
  }

  proximo(): void {
    if (this.ehUltimoPasso()) {
      this.concluir();
      return;
    }
    this.passoAtual.update((p) => p + 1);
  }

  anterior(): void {
    this.passoAtual.update((p) => Math.max(0, p - 1));
  }

  pular(): void {
    this.concluir();
  }

  private concluir(): void {
    localStorage.setItem(STORAGE_KEY, '1');
    this.visivel.set(false);
  }
}
