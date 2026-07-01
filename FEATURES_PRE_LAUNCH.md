# Features Pré-Lançamento — O Campista

> Gerado em 2026-07-01. Baseado na análise do codebase + documento de marketing.
> Features já implementadas: auth, mapa, check-in GPS, clima, presentes, chat, checklist, trilhas, conquistas, offline cache.

---

## Prioridade Alta — Críticas para lançamento

### 1. Landing Page Pública (`/welcome`)
Hoje o app começa direto no login. Precisa de uma página pública antes do auth com:
- Proposta de valor clara ("Descubra campings, faça check-in, conecte-se")
- Screenshots ou animação das features principais
- CTA "Criar conta grátis" e "Entrar"
- SEO básico (meta tags Open Graph)
- **Motivo:** ponto de entrada de toda campanha de marketing

### 2. Onboarding Interativo
Walkthrough de 4 passos exibido apenas no primeiro acesso:
1. Mapa → "Descubra campings perto de você"
2. Check-in → "Chegou no camping? Faça check-in e ganhe XP"
3. Presentes → "Deixe ou encontre presentes escondidos"
4. Chat → "Converse com quem está no mesmo camping que você"
- Salvo em localStorage para não reexibir
- **Motivo:** sem tutorial, usuário novo abandona antes de entender o valor

### 3. PWA / Instalação no Celular
- `manifest.json` com ícones, nome, splash screen, `display: standalone`
- Service worker com cache de shell (Angular Workbox/ngsw)
- Banner de instalação customizado ("Instale O Campista na tela inicial")
- **Motivo:** campistas usam no campo, às vezes sem internet — ícone na tela inicial é essencial

### 4. Compartilhamento Social
Após check-in ou conclusão de trilha, gerar card compartilhável:
- Canvas/imagem com: nome do camping, foto, XP ganho, username
- Botões: "Compartilhar no WhatsApp", "Baixar imagem", "Copiar link"
- Meta tags Open Graph para preview bonito ao colar link
- **Motivo:** principal motor de crescimento viral

---

## Prioridade Média — Retenção e Engajamento

### 5. Favoritos de Campings
- Ícone de coração no card e na página do camping
- Lista "Quero visitar" no perfil do usuário
- Endpoint backend: `POST/DELETE /usuarios/{id}/favoritos/{campingId}`
- **Motivo:** feature básica de qualquer app de descoberta — ausência gera frustração

### 6. Status de Ocupação do Camping
No momento do check-in, o usuário reporta a lotação atual:
- Opções: "Tranquilo 😌", "Movimentado 🙂", "Lotado 😬"
- Exibido no card do camping com timestamp ("Lotado · há 2h")
- Expira após 6 horas (sem check-ins recentes = sem status)
- Agregado: se 3+ check-ins na última hora, mostra a moda dos reports
- Endpoint: `POST /checkin` já existe, adicionar campo `ocupacao` no payload
- Exibição: badge colorido no mapa e na ficha do camping
- **Motivo:** informação que nenhum app de camping tem, alta utilidade prática

### 7. Ranking / Leaderboard
- Top 10 campistas por XP (mensal + all-time)
- Top 10 campings mais visitados do mês
- Top trilhas mais completadas
- Página `/ranking` acessível pela sidebar
- **Motivo:** amplifica a gamificação existente, incentiva retenção semanal

### 8. Estatísticas Avançadas do Perfil
No perfil, além de XP e nível, exibir:
- Total de campings únicos visitados
- Total de km percorridos em trilhas
- Presentes dados e recebidos
- Streak de check-ins (dias consecutivos ou meses com check-in)
- Camping favorito (mais visitado)
- **Motivo:** torna o perfil algo que o usuário quer mostrar para amigos

### 9. Feed de Atividades
Timeline acessível pela sidebar com:
- Check-ins recentes de outros campistas (campings próximos)
- Trilhas publicadas na região
- Presentes deixados perto de você
- Filtro: "Perto de mim" / "Todos"
- **Motivo:** cria sensação de comunidade ativa, reduz churn

---

## Prioridade Baixa — Diferenciação

### 10. Modo SOS / Emergência
- Botão fixo e visível na tela do mapa (canto inferior, vermelho)
- Abre modal com: coordenadas atuais copiáveis, link `geo:lat,lng` para abrir GPS nativo, texto formatado para enviar por WhatsApp ("Preciso de ajuda. Estou em: lat, lng")
- Sem backend necessário — client-side puro
- **Motivo:** diferencial brutal de marketing ("pode salvar vidas"), implementação simples

### 11. Alertas de Clima para Viagens Planejadas
- Ao favoritar um camping (feature 5), usuário pode definir data de visita
- Web Push Notification se previsão Open-Meteo indicar chuva > 60% na semana da visita
- **Motivo:** traz o usuário de volta ao app mesmo entre viagens

### 12. QR Code por Camping
- Na ficha de cada camping, botão "Gerar QR Code"
- QR aponta para deep link `ocampista.com/mapa?camping={id}`
- Opção de baixar PNG para imprimir
- **Motivo:** donos de campings viram promotores — canal de aquisição no ponto físico

---

## Ordem de Implementação Recomendada

1. PWA (bloqueia nada, alto impacto imediato)
2. Landing Page Pública (necessária antes de qualquer campanha)
3. Onboarding Interativo (retém usuários novos que chegarem pela landing)
4. Compartilhamento Social (ativa o loop viral)
5. Favoritos de Campings
6. Status de Ocupação
7. Estatísticas Avançadas do Perfil
8. Ranking / Leaderboard
9. Feed de Atividades
10. Modo SOS
11. Alertas de Clima
12. QR Code por Camping
