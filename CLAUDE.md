# O Campista

Plataforma web para entusiastas de camping. Permite descobrir campings no mapa, fazer check-ins por geolocalização, deixar/resgatar presentes, avaliar campings, acompanhar clima e gerenciar checklists de preparação.

## Stack

- **Framework:** Angular 21 (standalone components)
- **Linguagem:** TypeScript 5.9 (strict mode)
- **Estilização:** SCSS (sem framework UI — CSS puro)
- **Testes:** Vitest + jsdom
- **Formatação:** Prettier
- **Mapas:** Google Maps (Advanced Markers API)
- **APIs externas:** Open-Meteo (clima), Nominatim/OpenStreetMap (geocoding reverso), Google Identity Services (login Google)
- **Backend:** REST API via ngrok (dev) — ver `src/environments/`

## Comandos

```bash
npm start          # Dev server em http://localhost:4200
npm run build      # Build de produção
npm run watch      # Build em modo watch
npm test           # Testes com Vitest
npx prettier --write .  # Formatar código
```

## Estrutura de Pastas

```
src/app/
├── components/          # Componentes compartilhados (weather-card, loading, avaliacoes-usuarios)
├── core/
│   ├── guards/          # auth.guard.ts — proteção de rotas autenticadas
│   ├── interceptors/    # loading.interceptor.ts — loading global em requests HTTP
│   ├── models/          # Interfaces/tipos de dados
│   ├── services/        # Serviços de negócio e HTTP
│   └── Utils.ts         # Util.calcularDistanciaMetros() — fórmula de Haversine
├── pages/               # Páginas/features (uma pasta por rota)
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   ├── home/            # Shell principal — sidebar, navegação, weather cards
│   ├── account/         # Perfil, conquistas, presentes, histórico check-ins
│   │   └── checkin-history/
│   ├── map/             # Mapa interativo com markers, check-in, presentes
│   ├── checklist/       # Checklist de preparação para camping
│   └── gift/            # Criação de presentes com upload de foto
├── app.routes.ts        # Definição de rotas (todas lazy-loaded)
├── app.config.ts        # Providers (router, httpClient, interceptors)
└── app.ts               # Componente raiz
```

## Rotas

| Rota | Componente | Protegida |
|------|-----------|-----------|
| `/` | LoginComponent | Não |
| `/register` | RegisterComponent | Não |
| `/forgot-password` | ForgotPasswordComponent | Não |
| `/home` | HomeComponent | Sim (authGuard) |
| `/account` | AccountComponent | Sim (authGuard) |
| `/account/checkin-history` | CheckinHistoryComponent | Sim (authGuard) |
| `/mapa` | MapComponent | Sim (authGuard) |
| `/checklist` | ChecklistComponent | Sim (authGuard) |
| `/gift` | GiftComponent | Sim (authGuard) |
| `**` | Redireciona para `/` | — |

## Convenções de Código

### TypeScript
- Strict type checking ativado — nunca usar `any`, preferir `unknown`
- Preferir inferência de tipo quando óbvio

### Angular
- Sempre standalone components (não usar NgModules). Não setar `standalone: true` — é o padrão no Angular 21+
- `inject()` ao invés de injeção por construtor
- `input()` e `output()` ao invés de decorators `@Input`/`@Output`
- Signals para estado local, `computed()` para estado derivado
- `update()` ou `set()` em signals — nunca `mutate()`
- `ChangeDetectionStrategy.OnPush` em todos os componentes
- Control flow nativo: `@if`, `@for`, `@switch` (não usar `*ngIf`, `*ngFor`)
- Formulários reativos (`FormBuilder`/`FormGroup`) — evitar template-driven
- `class` bindings ao invés de `ngClass`, `style` bindings ao invés de `ngStyle`
- Host bindings via `host` no decorator — não usar `@HostBinding`/`@HostListener`
- `NgOptimizedImage` para imagens estáticas (não funciona com base64 inline)
- Lazy loading via `loadComponent()` em todas as rotas
- Serviços com `providedIn: 'root'`
- Async pipe para observables nos templates

### Acessibilidade
- WCAG AA mínimo obrigatório
- Deve passar todos os checks AXE
- Gerenciamento de foco, contraste de cor e atributos ARIA

### Formatação (Prettier)
- `printWidth: 100`
- `singleQuote: true`
- Parser `angular` para arquivos `.html`

## Serviços e Endpoints da API

Base URL configurada em `src/environments/environment.ts` (`environment.apiUrl`).

| Serviço | Responsabilidade | Endpoints |
|---------|-----------------|-----------|
| **AuthService** | Login, registro, login Google, logout, token/user no localStorage | `POST /auth/login`, `POST /auth/register`, `POST /auth/google` |
| **GoogleAuthService** | Inicialização do Google Identity Services e renderização do botão Google Sign-In | Sem endpoint — usa GIS client-side |
| **UsuarioService** | Perfil do usuário | `GET /usuarios/me/{id}` |
| **CampingService** | Listar campings, avaliações (CRUD) | `GET /mapa/campings`, `GET/POST/PUT /mapa/camping/{id}/avaliacoes`, `POST /avaliacao` |
| **CheckinService** | Check-in e histórico | `POST /checkin`, `GET /checkin/historico/{usuarioId}` |
| **GiftService** | Criar, buscar e resgatar presentes | `POST /presentes`, `GET /presentes?lat&lng`, `POST /presentes/resgatar` |
| **WeatherService** | Clima atual e previsão 5 dias | Open-Meteo API (externo), Nominatim (geocoding) |
| **ChecklistService** | CRUD local de checklists | localStorage (`ocampista-checklists`) — sem backend |
| **LocationService** | Geolocalização em tempo real | Browser Geolocation API |
| **LoadingService** | Estado de loading global (Signal) | Sem endpoint — gerenciado pelo interceptor |
| **MapStateService** | Estado do mapa (modais abertos) | Sem endpoint — Signals locais |

## Modelos Principais

Definidos em `src/app/core/models/`:

- **UsuarioLogado** — id, nome, email, token, nivel, xp, conquistas[], presentes[]
- **Camping** — id, nome, descricao, lat/lng, cidade, estado, tipo, avaliacao, recursos[]
- **Presente** — id, nome, descricao, codigoResgate, fotoUrl, lat/lng, estaDisponivel
- **Checkin/HistoricoCheckin** — usuarioId, campingId, lat/lng, dataCriacao, camping (nested)
- **Avaliacao/AvaliacaoComUsuario** — nota, comentario, usuarioNome, usuarioFoto
- **Weather/WeatherForecast/DadosClima** — temperatura, umidade, vento, chuva, statusCamping
- **Checklist/ChecklistCategoria/ChecklistItem** — progresso, categorias com itens
- **Conquista** — id, nome, descricao, icone, dataConquista

## Regras de Negócio

- **Check-in em camping:** usuário deve estar a no máximo **250 metros** do camping
- **Resgate de presente:** usuário deve estar a no máximo **150 metros** do presente
- **Presentes próprios:** criador não pode resgatar seu próprio presente
- **Raio de busca de presentes:** **10km** ao redor da posição do usuário
- **Geolocalização padrão (fallback):** São Carlos/SP (`-22.0174, -47.8903`)
- **Timeout geolocalização:** 10s (LocationService), 2s (WeatherService)
- **Cache de posição:** 5 minutos (maxAge: 300000ms)
- **Status camping (clima):** chuva > 60% = "Ruim", vento > 35km/h = "Atenção", temp < 16°C = "Atenção", senão = "Excelente"
- **Gamificação:** XP por check-ins, níveis progressivos, conquistas desbloqueáveis

## Gerenciamento de Estado

- **Autenticação:** localStorage (`token`, `user`) — gerenciado pelo AuthService
- **Checklists:** localStorage (`ocampista-checklists`) — gerenciado pelo ChecklistService
- **Loading global:** Signal no LoadingService, controlado pelo loading.interceptor
- **Estado do mapa:** Signals no MapStateService (modais de camping/presente)
- **Dados do backend:** Observables HTTP (sem NgRx/Redux)

## Estilização

- SCSS com escopo por componente (ViewEncapsulation padrão)
- Sem framework CSS (sem Material, Bootstrap, etc.) — CSS puro
- Layout via Flexbox
- Glassmorphism nas telas de auth (`backdrop-filter: blur`)
- Emojis como ícones (markers do mapa, categorias do checklist)
- Paleta terrosa: verdes para camping, vermelho sidebar (`#6e1217`)
- Responsivo via media queries nos estilos de cada componente

### Classes Utilitárias Globais (`src/styles.scss`)

Estilos compartilhados entre componentes — usar nos templates para evitar duplicação:

| Classe | Uso |
|--------|-----|
| `.btn-close-round` | Botão fechar redondo (40×40, fundo escuro, para overlays/imagens) |
| `.btn-close-round--light` | Variante clara (fundo surface, borda, para painéis) |
| `.btn-close-round--inverse` | Variante inversa (fundo branco translúcido, para headers escuros) |
| `.overlay-backdrop` | Backdrop escuro com blur para modais/overlays |
| `.glass-card` | Card com glassmorphism (blur, borda translúcida, animação cardAppear) |
| `.auth-bg` | Fundo de tela cheia com gradient + imagem de background |
| `.custom-scrollbar` | Scrollbar estilizada fina (6px, cor de borda) |
| `.card-elevated` | Card branco elevado com sombra e borda sutil |

Animações globais disponíveis: `fadeIn`, `cardAppear`, `slideUp`, `slideIn`

## Ambientes

Configurados em `src/environments/`:
- **environment.ts** — desenvolvimento (apiUrl via ngrok)
- **environment.prod.ts** — produção (apiUrl a configurar)

Nunca commitar API keys ou tokens diretamente — usar os arquivos de environment.

## Verificação de Mudanças

1. `npm start` — verificar que a aplicação inicia sem erros
2. Testar o fluxo alterado no navegador (golden path + edge cases)
3. `npm test` — rodar testes existentes
4. `npx prettier --check .` — verificar formatação
5. Verificar budgets de bundle: initial < 500kB warning / 1MB error
