# Features Pré-Lançamento — O Campista

> Prazo alvo: 2–4 semanas. Atualizado em 2026-07-04.

---

## ✅ Já Implementado

| Feature | Observações |
|---|---|
| Autenticação (login, registro, Google, forgot/reset) | ✅ |
| Mapa interativo com markers e filtros avançados | ✅ |
| Check-in por geolocalização com XP | ✅ |
| Status de ocupação do camping (tranquilo/movimentado/lotado) | ✅ |
| Clima atual + previsão 5 dias (Open-Meteo) | ✅ |
| Presentes (criar, buscar por raio, resgatar) | ✅ |
| Chat de camping (sala automática por check-in) | ✅ |
| Chat de grupo (convite por código alfanumérico) | ✅ |
| Chat direto DM (apenas seguimento mútuo) | ✅ |
| Checklist de preparação para camping | ✅ |
| Trilhas (mapa, check-in, avaliação com foto) | ✅ |
| Conquistas e gamificação (XP, níveis, badges) | ✅ |
| Feed de atividades sociais | ✅ |
| Ranking global e de seguidos | ✅ |
| Perfil público com seguidores/seguindo | ✅ |
| Notificações in-app | ✅ |
| Campings favoritos | ✅ |
| Posts de viagem e comentários | ✅ |
| Offline cache e status de rede | ✅ |

---

## 🔴 Prioridade Alta — Bloqueadores de Lançamento

### 1. Política de Privacidade + Termos de Uso (LGPD)

**Por que bloqueia:** sem esses documentos o app não pode ser publicado em lojas (Play Store, App Store) e viola a LGPD.

Escopo:
- Rota `/privacidade` — página estática com conteúdo em HTML/markdown
- Rota `/termos` — página estática com conteúdo em HTML/markdown
- Link no rodapé das telas de login e registro ("Ao criar conta você aceita nossos Termos")
- Conteúdo gerado com template padrão + revisão; zero backend necessário
- Páginas acessíveis sem autenticação (fora do `authGuard`)

### 2. PWA — Instalação no Celular

**Por que bloqueia:** campistas estão no campo sem internet; ícone na tela inicial é parte da proposta de valor central do app.

Escopo:
- `manifest.json` com nome, `display: standalone`, `theme_color`, `background_color`
- Ícones gerados: 192×192, 512×512 (maskable)
- Angular Service Worker (`@angular/pwa` + `ngsw-config.json`) com cache de shell + assets estáticos
- Banner de instalação customizado via evento `beforeinstallprompt`
- Teste: app deve abrir sem conexão após primeira visita

### 3. Onboarding Interativo (Primeiro Acesso)

**Por que bloqueia:** sem tutorial, usuário novo abandona antes de entender o valor; sem onboarding a taxa de ativação cai drasticamente. Com tantos recursos no app (mapa, gamificação, social, chat, trilhas), o usuário precisa de um mapa mental rápido de "o que dá pra fazer aqui" — cobrindo apenas 4 dos ~19 recursos deixa a maior parte do valor do app invisível no primeiro acesso.

Escopo:
- Overlay em carrossel exibido uma única vez, controlado por `localStorage('ocampista-onboarded')`
- Passos agrupados por pilar (evita tour de 19 telas — features correlatas dividem um passo), cobrindo todos os recursos já implementados (`✅ Já Implementado` + Localização em Tempo Real de Seguidores):
  1. **Boas-vindas** — nome do app, proposta de valor em 1 frase
  2. **Mapa** — "Descubra campings perto de você": markers, filtros avançados, clima atual + previsão 5 dias, status de ocupação (tranquilo/movimentado/lotado)
  3. **Check-in** — "Chegue e faça check-in": geolocalização, XP ganho, reportar ocupação do camping
  4. **Trilhas** — "Explore trilhas": mapa de trilhas, check-in em trilha, avaliação com foto
  5. **Presentes** — "Caça ao tesouro real": deixar/encontrar presentes escondidos, raio de 10km
  6. **Amigos no mapa** — "Veja onde seus amigos estão": localização em tempo real de seguidores mútuos que ativaram a opção (linkar para toggle em Privacidade)
  7. **Chat** — "Converse com quem está no camping": chat de camping (check-in 24h), grupos (convite por código), DM (seguimento mútuo)
  8. **Checklist** — "Nunca esqueça nada": checklist de preparação por categoria
  9. **Comunidade** — "Compartilhe sua jornada": feed de atividades, posts de viagem com fotos e comentários, seguir outros campistas
  10. **Gamificação e Perfil** — "Suba de nível": XP, conquistas/badges, ranking global e de seguidos, perfil público, campings favoritos, notificações
- Indicador de progresso (dots ou "3/10") em todos os passos
- Botão "Pular" disponível em todos os passos — pula direto para `/home`
- Botão "Voltar" a partir do 2º passo
- Cada passo com ilustração/emoji + título + descrição curta (1 frase), reaproveitando `.glass-card` e animações globais (`slideIn`/`fadeIn`)
- Exibido na primeira visita à `/home` como overlay com `.overlay-backdrop`
- Textos via `TranslatePipe` (chaves `onboarding.step-N.title` / `onboarding.step-N.description` em `pt-BR.json` e `en-US.json`)
- Acessibilidade: foco preso no overlay (focus trap), navegação por teclado (setas/Enter/Esc), `aria-live` no indicador de progresso
- Opção "Rever tutorial" no `AccountComponent` (limpa a flag do localStorage e reabre o overlay) para quem quiser repassar depois

---

## 🟡 Prioridade Média — Retenção e Crescimento

### 4. Localização em Tempo Real de Seguidores no Mapa

**Motivo:** cria sensação de presença e comunidade — ver amigos no mapa em campo é um diferencial social forte.

Escopo:
- Nova opção em Privacidade: "Visível no mapa" (toggle com sublabel explicativo)
- Quando ativo, localização GPS é transmitida via SignalR (`/locationHub`) a cada 30s
- Seguidores mútuos que também ativaram a opção aparecem no mapa como avatares circulares (foto ou iniciais)
- Indicador verde no avatar = usuário online; marcador some em até 5 min se o usuário fechar o app
- Clicar no avatar → abre `/perfil/{id}`
- Zero banco de dados — localização armazenada em `IMemoryCache` com sliding expiration de 5 min

### 5. Compartilhamento Social (Pós Check-in / Trilha)

**Motivo:** principal motor de crescimento viral — cada usuário vira canal de aquisição.

Escopo:
- Modal "Compartilhar conquista" após check-in bem-sucedido e conclusão de trilha
- Canvas API gera card com: foto/emoji do camping, nome, XP ganho, username e logo do app
- Botões: "Compartilhar" (Web Share API), "Baixar imagem" (link download), "Copiar link"
- Meta tags Open Graph dinâmicas no perfil público (`/perfil/:id`) para preview ao colar link

### 5. Modo SOS / Emergência

**Motivo:** diferencial de marketing de alto impacto com implementação simples; reutiliza `LocationService` existente.

Escopo:
- FAB (Floating Action Button) vermelho fixo no canto inferior esquerdo da tela do mapa
- Abre modal bottom-sheet com:
  - Coordenadas atuais copiáveis (lat, lng com botão copiar)
  - Botão "Abrir no GPS" → link `geo:lat,lng`
  - Botão "Enviar via WhatsApp" → `https://wa.me/?text=Preciso de ajuda. Estou em: {lat}, {lng}`
  - Números de emergência: 193 (Bombeiros), 192 (SAMU), 190 (Polícia)
- Zero backend — 100% client-side usando `LocationService` já injetado no `MapComponent`

### 6. Estatísticas Avançadas no Perfil

**Motivo:** torna o perfil algo que o usuário quer mostrar a amigos; aumenta engajamento social.

Escopo (dados já disponíveis no backend):
- Total de km percorridos (soma das trilhas concluídas do usuário)
- Camping mais visitado (moda dos check-ins)
- Total de presentes deixados e resgatados
- Exibir em `AccountComponent` (próprio perfil) e `PerfilPublicoComponent` (perfil alheio)

---

## 🟢 Prioridade Baixa — Diferenciação Pós-Launch

### 7. QR Code por Camping

Botão na ficha do camping gera QR apontando para deep link `ocampista.com/mapa?camping={id}`.
- Donos de campings viram promotores do app no ponto físico
- Biblioteca `qrcode` (client-side, ~15kb gzip)
- Opção de baixar PNG para imprimir

### 8. Alertas de Clima para Viagens Planejadas

Web Push Notification com previsão Open-Meteo se chuva > 60% na semana de uma visita planejada.
- Requer backend: tabela de alertas planejados, cron job, registro de push tokens
- Alto esforço — pós-launch

---

## Ordem de Implementação (2–4 semanas)

| # | Feature | Prioridade | Esforço estimado | Status |
|---|---|---|---|---|
| 1 | Política de Privacidade + Termos (LGPD) | 🔴 Bloqueador | Baixo (1–2 dias) | ✅ Concluído |
| 2 | PWA (manifest + ngsw + banner) | 🔴 Bloqueador | Médio (2–3 dias) | ⬜ Pendente |
| 3 | Onboarding Interativo | 🔴 Bloqueador | Médio (3–4 dias) | ✅ Concluído |
| 4 | Localização em Tempo Real de Seguidores | 🟡 Médio | Médio (3–4 dias) | ✅ Concluído |
| 5 | Compartilhamento Social | 🟡 Médio | Médio (3–4 dias) | ⬜ Pendente |
| 6 | Modo SOS | 🟡 Médio | Baixo (1 dia) | ⬜ Pendente |
| 7 | Estatísticas Avançadas no Perfil | 🟡 Médio | Baixo (1–2 dias) | ⬜ Pendente |
| 8 | QR Code por Camping | 🟢 Baixo | Baixo (1 dia) | ⬜ Pendente |
| 9 | Alertas de Clima | 🟢 Baixo | Alto (5+ dias) | ⬜ Pendente |
