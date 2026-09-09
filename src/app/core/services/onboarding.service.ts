import { Injectable, computed, signal } from '@angular/core';

export interface OnboardingStep {
  icone: string;
  tituloKey: string;
  descricaoKey: string;
  /** Seletor CSS do elemento real a ser destacado. `null` = passo introdutório centralizado. */
  targetSelector: string | null;
  /** Indica que o alvo vive na sidebar — precisa forçá-la aberta no mobile antes de medir a posição. */
  sidebarTarget?: boolean;
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
      targetSelector: null,
    },
    {
      icone: '🏆',
      tituloKey: 'onboarding.step-home-xp.title',
      descricaoKey: 'onboarding.step-home-xp.description',
      targetSelector: '[data-onboarding="home-xp"]',
    },
    {
      icone: '📊',
      tituloKey: 'onboarding.step-home-ranking.title',
      descricaoKey: 'onboarding.step-home-ranking.description',
      targetSelector: '[data-onboarding="home-ranking"]',
    },
    {
      icone: '📸',
      tituloKey: 'onboarding.step-home-feed.title',
      descricaoKey: 'onboarding.step-home-feed.description',
      targetSelector: '[data-onboarding="home-feed"]',
    },
    {
      icone: '🎁',
      tituloKey: 'onboarding.step-home-nearby.title',
      descricaoKey: 'onboarding.step-home-nearby.description',
      targetSelector: '[data-onboarding="home-nearby"]',
    },
    {
      icone: '🗺️',
      tituloKey: 'onboarding.step-nav-mapa.title',
      descricaoKey: 'onboarding.step-nav-mapa.description',
      targetSelector: '[data-onboarding="nav-mapa"]',
      sidebarTarget: true,
    },
    {
      icone: '💬',
      tituloKey: 'onboarding.step-nav-chat.title',
      descricaoKey: 'onboarding.step-nav-chat.description',
      targetSelector: '[data-onboarding="nav-chat"]',
      sidebarTarget: true,
    },
    {
      icone: '✅',
      tituloKey: 'onboarding.step-nav-checklist.title',
      descricaoKey: 'onboarding.step-nav-checklist.description',
      targetSelector: '[data-onboarding="nav-checklist"]',
      sidebarTarget: true,
    },
    {
      icone: '👤',
      tituloKey: 'onboarding.step-nav-account.title',
      descricaoKey: 'onboarding.step-nav-account.description',
      targetSelector: '[data-onboarding="nav-account"]',
      sidebarTarget: true,
    },
    {
      icone: '🔔',
      tituloKey: 'onboarding.step-nav-notificacoes.title',
      descricaoKey: 'onboarding.step-nav-notificacoes.description',
      targetSelector: '[data-onboarding="nav-notificacoes"]',
      sidebarTarget: true,
    },
  ];

  readonly totalPassos = this.passos.length;

  readonly passoAtualDados = computed(() => this.passos[this.passoAtual()]);
  readonly ehUltimoPasso = computed(() => this.passoAtual() === this.totalPassos - 1);
  readonly precisaSidebarAberta = computed(
    () => this.visivel() && !!this.passoAtualDados().sidebarTarget,
  );

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
