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
├── components/          # Componentes compartilhados (weather-card, loading, toast, confirm-dialog)
├── core/
│   ├── directives/      # img-fallback.directive.ts — fallback para imagens quebradas
│   ├── guards/          # auth.guard.ts — proteção de rotas autenticadas
│   ├── interceptors/    # auth.interceptor (token + refresh), loading.interceptor
│   ├── models/          # Interfaces/tipos de dados
│   ├── pipes/           # translate.pipe.ts — pipe de tradução i18n
│   ├── services/        # Serviços de negócio e HTTP
│   └── Utils.ts         # Util.calcularDistanciaMetros() — fórmula de Haversine
├── pages/               # Páginas/features (uma pasta por rota)
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   ├── reset-password/  # Redefinição de senha via token
│   ├── home/            # Shell principal — sidebar, navegação, weather cards
│   ├── account/         # Perfil, conquistas, presentes, histórico check-ins
│   │   └── checkin-history/
│   ├── map/             # Mapa interativo com markers, check-in, presentes
│   ├── chat/            # Chat de salas (camping + grupo)
│   │   ├── chat-list/           # Lista de conversas
│   │   ├── chat-conversation/   # Conversa individual
│   │   ├── chat-create-group/   # Criar grupo
│   │   └── chat-join-group/     # Entrar em grupo via convite
│   ├── checklist/       # Checklist de preparação para camping
│   ├── gift/            # Criação de presentes com upload de foto
│   └── not-found/       # Página 404 — rota não encontrada
├── app.routes.ts        # Definição de rotas (todas lazy-loaded)
├── app.config.ts        # Providers (router, httpClient, interceptors, GlobalErrorHandler)
└── app.ts               # Componente raiz (loading, toast, confirm-dialog)
```

## Rotas

| Rota                         | Componente                | Protegida       |
| ---------------------------- | ------------------------- | --------------- |
| `/`                          | LoginComponent            | Não             |
| `/register`                  | RegisterComponent         | Não             |
| `/forgot-password`           | ForgotPasswordComponent   | Não             |
| `/reset-password`            | ResetPasswordComponent    | Não             |
| `/home`                      | HomeComponent             | Sim (authGuard) |
| `/account`                   | AccountComponent          | Sim (authGuard) |
| `/account/checkin-history`   | CheckinHistoryComponent   | Sim (authGuard) |
| `/mapa`                      | MapComponent              | Sim (authGuard) |
| `/chat`                      | ChatComponent (container) | Sim (authGuard) |
| `/chat` (child `''`)         | ChatListComponent         | Sim (authGuard) |
| `/chat/criar-grupo`          | ChatCreateGroupComponent  | Sim (authGuard) |
| `/chat/entrar-grupo`         | ChatJoinGroupComponent    | Sim (authGuard) |
| `/chat/entrar-grupo/:codigo` | ChatJoinGroupComponent    | Sim (authGuard) |
| `/chat/:salaId`              | ChatConversationComponent | Sim (authGuard) |
| `/checklist`                 | ChecklistComponent        | Sim (authGuard) |
| `/gift`                      | GiftComponent             | Sim (authGuard) |
| `**`                         | NotFoundComponent (404)   | —               |

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

| Serviço                     | Responsabilidade                                                                 | Endpoints                                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **AuthService**             | Login, registro, login Google, logout, forgot/reset password, token refresh      | `POST /auth/login`, `POST /auth/register`, `POST /auth/google`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `POST /auth/refresh` |
| **GoogleAuthService**       | Inicialização do Google Identity Services e renderização do botão Google Sign-In | Sem endpoint — usa GIS client-side                                                                                                              |
| **UsuarioService**          | Perfil do usuário, deleção de conta (LGPD)                                       | `GET /usuarios/me/{id}`, `POST /usuarios/{id}/foto-perfil`, `DELETE /usuarios/{id}`                                                             |
| **CampingService**          | Listar campings, avaliações (CRUD)                                               | `GET /mapa/campings`, `GET/POST/PUT /mapa/camping/{id}/avaliacoes`, `POST /avaliacao`                                                           |
| **CheckinService**          | Check-in e histórico                                                             | `POST /checkin`, `GET /checkin/historico/{usuarioId}`                                                                                           |
| **GiftService**             | Criar, buscar, resgatar e deletar presentes                                      | `POST /presentes`, `GET /presentes?lat&lng`, `POST /presentes/resgatar`, `DELETE /presentes/{id}`                                               |
| **WeatherService**          | Clima atual e previsão 5 dias                                                    | Open-Meteo API (externo), Nominatim (geocoding)                                                                                                 |
| **ChecklistService**        | CRUD local de checklists                                                         | localStorage (`ocampista-checklists`) — sem backend                                                                                             |
| **LocationService**         | Geolocalização em tempo real                                                     | Browser Geolocation API                                                                                                                         |
| **LoadingService**          | Estado de loading global (Signal)                                                | Sem endpoint — gerenciado pelo interceptor                                                                                                      |
| **MapStateService**         | Estado do mapa (modais abertos)                                                  | Sem endpoint — Signals locais                                                                                                                   |
| **ChatRoomService**         | Salas de chat (camping + grupo), mensagens, digitando, SignalR                   | `GET /chat/salas`, `GET /chat/salas/{id}/mensagens`, `POST /chat/grupos`, `POST /chat/grupos/entrar`, `DELETE /chat/grupos/{salaId}/sair`       |
| **ChatNotificationService** | Contadores de mensagens não-lidas (badge sidebar)                                | `GET /chat/nao-lidas` + SignalR `/notificationHub`                                                                                              |
| **ToastService**            | Notificações toast globais (success, error, warning, info)                       | Sem endpoint — Signals locais                                                                                                                   |
| **ConfirmDialogService**    | Diálogo de confirmação reutilizável para ações destrutivas                       | Sem endpoint — Signals locais                                                                                                                   |
| **ThemeService**            | Alternância entre tema claro/escuro                                              | Sem endpoint — localStorage (`ocampista-theme`)                                                                                                 |
| **I18nService**             | Internacionalização com arquivos JSON                                            | Sem endpoint — `public/i18n/{locale}.json`                                                                                                      |
| **ImageCompressorService**  | Compressão de imagens antes de upload (canvas resize)                            | Sem endpoint — client-side                                                                                                                      |
| **GlobalErrorHandler**      | Captura global de erros não tratados                                             | Sem endpoint — ErrorHandler do Angular                                                                                                          |

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
- **SalaChat** — id, nome, tipo ('camping'|'grupo'), campingId?, totalNaoLidas, podeEnviar, ultimaMensagem?
- **MensagemSalaChat** — id, salaId, usuarioId, nomeUsuario, fotoUsuario, texto, dataEnvio

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
- **Chat de camping:** envio de mensagens só com check-in nas últimas **24 horas** (leitura sempre disponível)
- **Chat de grupo:** independente de campings, sem restrição de 24h, convite por código alfanumérico de 8 chars
- **Salas automáticas:** ao fazer check-in, sala de chat do camping é criada automaticamente e o usuário é adicionado como membro
- **Rate limit chat:** máximo 10 mensagens por minuto por usuário (via MemoryCache no backend)

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

| Classe                      | Uso                                                                   |
| --------------------------- | --------------------------------------------------------------------- |
| `.btn-close-round`          | Botão fechar redondo (40×40, fundo escuro, para overlays/imagens)     |
| `.btn-close-round--light`   | Variante clara (fundo surface, borda, para painéis)                   |
| `.btn-close-round--inverse` | Variante inversa (fundo branco translúcido, para headers escuros)     |
| `.overlay-backdrop`         | Backdrop escuro com blur para modais/overlays                         |
| `.glass-card`               | Card com glassmorphism (blur, borda translúcida, animação cardAppear) |
| `.auth-bg`                  | Fundo de tela cheia com gradient + imagem de background               |
| `.custom-scrollbar`         | Scrollbar estilizada fina (6px, cor de borda)                         |
| `.card-elevated`            | Card branco elevado com sombra e borda sutil                          |

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
