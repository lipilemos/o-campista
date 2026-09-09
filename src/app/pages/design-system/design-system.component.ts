import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';

interface TokenGroup {
  titulo: string;
  descricao: string;
  tokens: string[];
}

@Component({
  selector: 'app-design-system',
  imports: [RouterLink],
  templateUrl: './design-system.component.html',
  styleUrl: './design-system.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesignSystemComponent {
  private readonly themeService = inject(ThemeService);

  readonly tema = this.themeService.theme;
  readonly temaEscuro = computed(() => this.tema() === 'dark');

  /** Incrementado para reexecutar as animações da seção de motion. */
  readonly animacaoKey = signal(0);
  readonly modalAberto = signal(false);
  readonly toastVisivel = signal(false);

  readonly gruposDeCor: TokenGroup[] = [
    {
      titulo: 'Marca',
      descricao: 'Vermelho institucional. Sidebar, headers e títulos de destaque.',
      tokens: ['--color-primary', '--color-primary-light', '--color-primary-dark'],
    },
    {
      titulo: 'Ação',
      descricao: 'Laranja. CTAs primários, barras de progresso e foco.',
      tokens: [
        '--color-accent',
        '--color-accent-light',
        '--color-accent-dark',
        '--color-accent-hover',
      ],
    },
    {
      titulo: 'Superfície',
      descricao: 'Fundo de página, cards, hover de item e badge neutro.',
      tokens: ['--color-bg', '--color-surface', '--color-surface-hover', '--color-surface-alt'],
    },
    {
      titulo: 'Texto',
      descricao: 'Principal, secundário (labels), desabilitado e sobre fundo escuro.',
      tokens: [
        '--color-text',
        '--color-text-secondary',
        '--color-text-muted',
        '--color-text-inverse',
      ],
    },
    {
      titulo: 'Borda',
      descricao: 'Bordas de card/input e divisores sutis.',
      tokens: ['--color-border', '--color-border-light', '--color-divider'],
    },
    {
      titulo: 'Semântico',
      descricao: 'Sempre usados em par cor + bg (texto colorido sobre fundo da mesma família).',
      tokens: [
        '--color-success',
        '--color-success-bg',
        '--color-error',
        '--color-error-bg',
        '--color-warning',
        '--color-warning-bg',
        '--color-forest',
      ],
    },
  ];

  readonly raios = [
    '--radius-sm',
    '--radius-md',
    '--radius-lg',
    '--radius-xl',
    '--radius-2xl',
    '--radius-full',
  ];

  readonly sombras = ['--shadow-xs', '--shadow-sm', '--shadow-md', '--shadow-lg', '--shadow-xl'];

  readonly espacos = [
    '--space-1',
    '--space-2',
    '--space-3',
    '--space-4',
    '--space-5',
    '--space-6',
    '--space-8',
    '--space-10',
    '--space-12',
  ];

  readonly tamanhosDeTexto = [
    '--text-xs',
    '--text-sm',
    '--text-base',
    '--text-lg',
    '--text-xl',
    '--text-2xl',
    '--text-3xl',
    '--text-4xl',
  ];

  readonly transicoes = ['--transition-fast', '--transition-base', '--transition-slow'];

  readonly animacoes = ['fadeIn', 'cardAppear', 'slideUp', 'slideIn'];

  readonly utilitarias = [
    {
      classe: '.btn-close-round',
      uso: 'Botão circular de fechar (X) sobre imagens e overlays. Variantes --light e --inverse.',
    },
    { classe: '.overlay-backdrop', uso: 'Fundo escurecido com blur atrás de modal/diálogo.' },
    { classe: '.glass-card', uso: 'Card glassmorphism das telas de auth e do onboarding.' },
    { classe: '.auth-bg', uso: 'Fundo full-screen com imagem + gradiente das telas de auth.' },
    { classe: '.card-elevated', uso: 'Card padrão: superfície + sombra + borda sutil.' },
    { classe: '.custom-scrollbar', uso: 'Scrollbar fina em listas e painéis com overflow.' },
    { classe: '.sr-only', uso: 'Conteúdo exclusivo para leitor de tela.' },
  ];

  readonly secoes = [
    { id: 'principios', label: 'Princípios' },
    { id: 'cores', label: 'Cores' },
    { id: 'tipografia', label: 'Tipografia' },
    { id: 'espacamento', label: 'Espaçamento' },
    { id: 'raios', label: 'Raios' },
    { id: 'sombras', label: 'Sombras' },
    { id: 'movimento', label: 'Movimento' },
    { id: 'botoes', label: 'Botões' },
    { id: 'cards', label: 'Cards' },
    { id: 'badges', label: 'Badges' },
    { id: 'formularios', label: 'Formulários' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'utilitarias', label: 'Utilitárias' },
    { id: 'responsivo', label: 'Responsivo' },
    { id: 'checklist', label: 'Checklist' },
  ];

  /** Lê o valor computado do token no tema ativo (re-avaliado quando o tema muda). */
  valorDoToken(token: string): string {
    this.tema();
    if (typeof window === 'undefined') return '';
    return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  }

  alternarTema() {
    this.themeService.toggle();
  }

  reexecutarAnimacoes() {
    this.animacaoKey.update((v) => v + 1);
  }

  abrirModal() {
    this.modalAberto.set(true);
  }

  fecharModal() {
    this.modalAberto.set(false);
  }

  mostrarToast() {
    this.toastVisivel.set(true);
    setTimeout(() => this.toastVisivel.set(false), 3000);
  }
}
