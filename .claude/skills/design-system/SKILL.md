---
name: design-system
description: Use ao construir ou alterar qualquer UI do O Campista — nova tela, novo componente, novo estado visual (loading/erro/vazio), modal, card, badge, formulário. Define os design tokens (`src/styles.scss`), os padrões visuais já estabelecidos (cards, botões, badges, modais, bottom sheet mobile, glassmorphism de auth) e as regras obrigatórias de acessibilidade/i18n/dark mode. Não recriar um padrão do zero sem antes checar aqui.
---

# Design System — O Campista

## Página viva: `/design-system`

O app tem um styleguide navegável em [src/app/pages/design-system/](../../../src/app/pages/design-system/) (rota pública `/design-system`, `npm start` → `http://localhost:4200/design-system`). Ele renderiza os tokens reais lidos em runtime e demonstra cada padrão descrito abaixo, com toggle de tema para conferir light/dark.

**Ao criar um token novo em `styles.scss` ou um padrão visual novo, atualize os três lugares: `styles.scss`, os arrays de `design-system.component.ts` e este arquivo.**

## Princípio

O Campista **não usa framework de UI** (sem Material, Bootstrap, Tailwind). Todo componente é CSS puro sobre um conjunto de **design tokens** definidos em [src/styles.scss](../../../src/styles.scss). Antes de estilizar algo novo:

1. Verifique se um token existente já cobre a cor/espaçamento/raio que você precisa — **nunca hardcode hex, px de espaçamento ou box-shadow cru** quando existe uma variável equivalente.
2. Verifique se um padrão visual (card, badge, botão, modal) já existe em outro componente — reaproveite a mesma estrutura de classes em vez de inventar uma nova. Os exemplos abaixo (`card-camping`, `toast`, `confirm-dialog`, `onboarding`, `home-xp-card`) são as referências canônicas.
3. Só crie uma nova classe utilitária global em `styles.scss` se o padrão se repetir em 3+ componentes — caso contrário, escopo local no `.component.scss`.

## Design tokens (`src/styles.scss`)

Todos definidos em `:root`, com overrides em `[data-theme='dark']`. **Sempre usar `var(--token)`**, nunca o valor literal.

| Categoria | Tokens | Uso |
|---|---|---|
| Cor de marca | `--color-primary`, `--color-primary-light`, `--color-primary-dark` | vermelho institucional (`#6e1217`) — headers, títulos de destaque, sidebar |
| Cor de ação | `--color-accent`, `--color-accent-light`, `--color-accent-dark`, `--color-accent-hover` | laranja (`#f99920`) — CTAs primários, botões de ação, progress bars |
| Superfície | `--color-bg`, `--color-surface`, `--color-surface-hover`, `--color-surface-alt` | fundo de página, cards, hover de item, fundo de badge neutro |
| Texto | `--color-text`, `--color-text-secondary`, `--color-text-muted`, `--color-text-inverse` | texto principal, secundário (labels/descrições), desabilitado, sobre fundo escuro |
| Borda | `--color-border`, `--color-border-light`, `--color-divider` | bordas de card/input, divisores sutis |
| Semântico | `--color-success`/`-bg`, `--color-error`/`-bg`, `--color-warning`/`-bg` | estados de sucesso/erro/aviso — sempre par cor+bg (texto colorido sobre fundo claro da mesma cor) |
| Raio | `--radius-sm` (8) `-md` (12) `-lg` (16) `-xl` (20) `-2xl` (24) `-full` (pill) | `sm/md` inputs e badges pequenos, `lg/xl` cards e modais, `full` pills/avatares |
| Sombra | `--shadow-xs/sm/md/lg/xl` | `sm` cards em repouso, `md` hover/dropdown, `lg/xl` modais e painéis flutuantes |
| Transição | `--transition-fast` (150ms) `-base` (200ms) `-slow` (300ms) | `fast` hover de botão/ícone, `base` a maioria das interações, `slow` barras de progresso |
| Tipografia | `--font-family` (Nunito), `--text-xs` a `--text-4xl` | nunca usar `px`/`rem` cru para `font-size` |
| Espaçamento | `--space-1` (4) até `--space-12` (48), em incrementos de 4/8 | todo `margin`/`padding`/`gap` usa um `--space-*` |

`h1`–`h5` e `p` já têm estilo global (peso, cor, `padding`) — não reestilizar título/parágrafo ad hoc dentro de um componente; se precisar de variação, sobrescreva só a propriedade necessária.

### Modo escuro

`[data-theme='dark']` redefine os tokens de superfície/texto/borda/sombra. **Nunca** escrever uma regra `[data-theme='dark'] .minha-classe { ... }` num componente — se o componente usa só `var(--token)`, o dark mode já funciona automaticamente. Só crie override local se a cor não vier de token (ex: gradientes/rgba customizados).

### Exceção: fundos coloridos/glass

Em telas sobre fundo escuro ou `glass-card` (auth, onboarding), texto e bordas usam `rgba(255, 255, 255, X)` diretamente em vez de `--color-text*`, porque os tokens de texto são calibrados para fundo claro/superfície. Ver [onboarding.component.scss](../../../src/app/components/onboarding/onboarding.component.scss) e [login.component.scss](../../../src/app/pages/login/login.component.scss) como referência.

## Classes utilitárias globais

Já existem em `styles.scss` — usar em vez de recriar:

| Classe | Quando usar |
|---|---|
| `.btn-close-round` (+ `--light`, `--inverse`) | botão circular de fechar (X) em overlays/modais/imagens |
| `.overlay-backdrop` | fundo escurecido com blur atrás de modal/dialog |
| `.glass-card` | card com glassmorphism (fundo translúcido + blur) — telas de auth, onboarding |
| `.auth-bg` | fundo full-screen com imagem+gradiente das telas de login/registro |
| `.card-elevated` | card branco elevado padrão (superfície + sombra + borda sutil) |
| `.custom-scrollbar` | scrollbar fina customizada em listas/painéis com overflow |
| `.sr-only` | conteúdo só para leitor de tela |

Animações globais (`@keyframes` em `styles.scss`): `fadeIn`, `cardAppear`, `slideUp`, `slideIn`. Use-as via `animation: fadeIn 0.2s ease` etc. em vez de duplicar o keyframe no componente. Keyframes muito específicos de um componente (ex.: `heartbeat` em `card-camping`, `slideInRight`) ficam locais mesmo.

## Padrões de componente

### Botão

- Altura fixa (`40px`–`48px` conforme contexto), `border-radius: var(--radius-md)`, `font-weight: 700`, `transition: var(--transition-base)`.
- **Primário**: `background: var(--color-accent)`; hover escurece para `--color-accent-hover` + leve `translateY(-1px)` + sombra colorida (`box-shadow: 0 4px 16px rgba(249, 153, 32, 0.35)`); `:active` remove o translate; `:disabled` → `opacity: 0.6-0.65; cursor: not-allowed`.
- **Secundário/outline**: borda `1-2px solid var(--color-primary)` (ou cor semântica), fundo transparente, inverte cor no hover (ex.: `.btn-navegar` em `card-camping.component.scss`).
- **Destrutivo**: `background: var(--color-error)`, hover inverte para `--color-error-bg` + texto `--color-error` (ver `.confirm-dialog__btn--confirm`).
- **Texto/link**: sem fundo, `color: var(--color-text-secondary)`, hover sublinha ou escurece.

### Card

- `background: var(--color-surface)`, `border-radius: var(--radius-xl)` (ou `-lg` para cards menores), `box-shadow: var(--shadow-sm)` a `var(--shadow-xl)` conforme elevação, `border: 1px solid var(--color-border-light)` quando não flutuante.
- Conteúdo interno com `padding: var(--space-5)` ou `var(--space-4)`.
- Entrada anima com `cardAppear`.

### Badge / pill

- `border-radius: var(--radius-full)`, padding pequeno (`var(--space-1) var(--space-3)` ou similar), `font-weight: 700`, `font-size: var(--text-xs)`.
- Estado semântico sempre como par `background: var(--color-X-bg); color: var(--color-X)` (ou `rgba(cor, 0.12)` + `border: 1px solid rgba(cor, 0.3)` quando precisa de mais contraste sobre fundo colorido — ver `.badge-ocupacao` em `card-camping.component.scss`, que já implementa os 3 estados de ocupação `tranquilo/movimentado/lotado`, reuse esse padrão para qualquer novo indicador de status).

### Modal / diálogo

- Estrutura: `.overlay-backdrop` (ou equivalente local) envolvendo um `.card-elevated`/`.glass-card`, animação `cardAppear`.
- Ações em `display: flex; gap: var(--space-3); justify-content: flex-end` (ver `confirm-dialog`).
- Confirmações destrutivas usam sempre `ConfirmDialogService` — nunca `window.confirm`/`alert` (ver [[feedback_use_toast]]).

### Toast / feedback transiente

- Usar `ToastService` (success/error/warning/info), nunca `alert()`. Ícone é emoji (✅❌⚠️ℹ️), borda esquerda de 4px na cor semântica, fundo `-bg` correspondente.

### Bottom sheet mobile

Painéis que em desktop são um card lateral/flutuante e em mobile viram uma folha que sobe do fundo (ver `.camping-info` em `card-camping.component.scss`): abaixo de `768px`, trocar `position: absolute` → `fixed; bottom: 0; left: 0; right: 0`, `border-radius` só no topo, animação `slideUp`, e opcionalmente um "drag handle" (`::before` de 40×4px centralizado) para arrastar/fechar.

### Formulário

- Inputs com altura fixa (`44-48px`), `border-radius: var(--radius-md)`, `:focus` troca a borda para `--color-accent` + anel `box-shadow: 0 0 0 3px rgba(249, 153, 32, 0.25)`.
- Sempre Reactive Forms (`FormBuilder`/`FormGroup` tipado) — nunca `ngModel`.
- Mensagem de erro: bloco com `background` semântico `-bg`, `color` semântico, `border-radius: var(--radius-sm)`, `padding: var(--space-3)`.

## Ícones

Sem biblioteca de ícones — **emojis** fazem esse papel em todo o app (markers do mapa, categorias de checklist, ícones de toast, badges de ocupação, ícones de onboarding). Ao adicionar um novo indicador visual, prefira um emoji semanticamente claro em vez de importar um icon set novo.

## Responsivo

Dois breakpoints usados consistentemente em todo o app — não inventar um terceiro sem necessidade real:

- `@media (max-width: 768px)` — tablet/mobile: geralmente vira layout empilhado, esconde painel lateral, ou (para painéis flutuantes) vira bottom sheet.
- `@media (max-width: 480px)` — celular pequeno: reduz padding, logo, larguras fixas viram `100%`/`90vw`.

Mobile-first não é a convenção aqui — os componentes existentes escrevem o layout desktop primeiro e sobrescrevem com `max-width` queries depois; siga o mesmo padrão para consistência.

## Acessibilidade (obrigatório, WCAG AA)

- `:focus-visible` já tem outline global (`--color-accent`) — não remover `outline` sem substituir por algo equivalente.
- Todo texto visível usa `TranslatePipe`; atributos ARIA (`aria-label`, etc.) usam `[attr.aria-label]="'chave' | translate"` — nunca string estática, nem em inglês/português hardcoded.
- Ícones emoji que carregam significado (não decorativos) precisam de um `aria-label` textual no elemento pai — o emoji sozinho não é lido de forma confiável por leitores de tela.
- Deve passar checks AXE.

## i18n

Toda feature nova de UI precisa de chaves em **ambos** `public/i18n/pt-BR.json` e `public/i18n/en-US.json`, seguindo `<domínio>.<componente>.<elemento>` (ex.: `onboarding.step1.title`). Nunca deixar string hardcoded em template ou em método TS que retorna label para o template.

## Angular

- `ChangeDetectionStrategy.OnPush`, `standalone` implícito, `inject()`, `input()`/`output()`, signals para estado local, `computed()` para derivado.
- Control flow nativo (`@if`/`@for`/`@switch`), `class`/`style` bindings em vez de `ngClass`/`ngStyle`.
- SCSS com escopo por componente — só sobe para `styles.scss` o que é genuinamente compartilhado (ver seção de classes utilitárias acima).

## Checklist ao implementar uma tela/feature nova

1. Existe um componente parecido (card, badge, modal, formulário)? Copie a estrutura de classes dele antes de criar do zero.
2. Todo valor de cor/espaçamento/raio/sombra/fonte vem de `var(--token)`?
3. Testado em `768px` e `480px`?
4. Testado com `[data-theme='dark']` (toggle de tema)?
5. Chaves i18n adicionadas em `pt-BR.json` **e** `en-US.json`?
6. `aria-label`/foco/contraste revisados (AXE)?
7. Estados de loading/erro/vazio tratados visualmente (não é só a UI feliz)?
8. `npx prettier --check .` e teste manual no navegador (`npm start`) conforme seção "Verificação de Mudanças" do `CLAUDE.md`.
