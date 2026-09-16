# Parceiros — cadastro de campings por donos

**Data:** 2026-09-15
**Repositórios afetados:** `o-campista.api` (backend), `o-campista` (app Angular), `o-campista.landing` (site estático)

## Objetivo

Permitir que donos de campings (e pesqueiros) se cadastrem no O Campista para alimentar a base de campings, com:

1. Uma página pública na landing (`parceiros.html`) que apresenta os benefícios e leva ao cadastro.
2. Um fluxo de cadastro dentro do app, autenticado, que cria um camping pendente de aprovação ou reivindica um camping já existente.
3. Um painel "Meu camping" mostrando os dados de visitação que o app já coleta.

**Fora de escopo nesta rodada:** cupons/descontos (aparecem na landing como "Em breve"), edição/exclusão de camping pelo dono, upload de fotos do camping, tela de admin para aprovação (aprovação é manual via SQL no Supabase).

## Decisões

| Decisão | Escolha |
|---|---|
| Onde o dono cria conta | No app, como qualquer usuário (login/Google). A landing só direciona. |
| Moderação | Camping novo nasce com `ativo = false`; aprovação manual por SQL. |
| Camping já existente | Dono pode **reivindicar** um camping sem dono num raio de 2 km da posição marcada. |
| Tipos elegíveis | `camping` e `pesca`. Cachoeira e mirante não têm dono. |
| Relação dono ↔ camping | Um usuário pode ter N campings; cada camping tem no máximo um dono. |

## 1. Banco de dados

Script novo `o-campista.scripts/sql/add_camping_dono.sql`:

```sql
ALTER TABLE tb_camping
  ADD COLUMN IF NOT EXISTS dono_usuario_id uuid NULL REFERENCES tb_usuario(id),
  ADD COLUMN IF NOT EXISTS dono_status varchar(20) NULL
    CHECK (dono_status IN ('pendente', 'aprovado'));
```

Atualizar `o-campista.scripts/ScriptsDB/tables.sql` para que a tabela já nasça com as duas colunas. O script hoje declara `tb_campings` (plural) enquanto a entidade EF mapeia `tb_camping`; corrigir o nome no script ao editá-lo.

Sem migrations (regra do projeto). Sem estado "reprovado": para negar, voltar `dono_usuario_id`/`dono_status` para `NULL` (reivindicação) ou apagar o camping (cadastro novo).

### Estados

| Caso | `ativo` | `dono_usuario_id` | `dono_status` |
|---|---|---|---|
| Seed atual (sem dono) | true | NULL | NULL |
| Cadastro novo pelo dono | false | dono | `pendente` |
| Reivindicação de camping existente | true (não muda) | dono | `pendente` |
| Aprovado (SQL manual) | true | dono | `aprovado` |

Aprovação de cadastro novo: `UPDATE tb_camping SET ativo = true, dono_status = 'aprovado' WHERE id = ?`.
Aprovação de reivindicação: `UPDATE tb_camping SET dono_status = 'aprovado' WHERE id = ?`.

## 2. Backend (`o-campista.api`)

### Entidade

`Camping` ganha `DonoUsuarioId (Guid?)` → coluna `dono_usuario_id` e `DonoStatus (string?)` → `dono_status`.

### Correção existente

`CampingRepository.ObterCampingsMapaAsync` passa a filtrar `Where(c => c.Ativo)` — hoje não filtra e campings pendentes vazariam no mapa.

### Endpoints

Novo `CampingParceiroController`, rota base `api/campings/parceiros`, todos `[Authorize]`; o dono é sempre o usuário do token.

| Método | Rota | Comportamento |
|---|---|---|
| `POST` | `/campings/parceiros` | Cria camping com `Ativo=false`, `DonoUsuarioId=eu`, `DonoStatus="pendente"` e vínculos em `tb_camping_recurso`. Retorna `201` + `CampingParceiroResponse`. |
| `POST` | `/campings/parceiros/{campingId}/reivindicar` | Camping deve existir, estar `Ativo`, ser tipo `camping`/`pesca` e ter `DonoUsuarioId == null`. Grava `DonoUsuarioId=eu`, `DonoStatus="pendente"`. `404` se não existe/inativo, `409` se já tem dono. Retorna `CampingParceiroResponse`. |
| `GET` | `/campings/parceiros/meus` | Lista `CampingParceiroResponse[]` dos campings com `DonoUsuarioId == eu`. |
| `GET` | `/campings/parceiros/{campingId}/painel` | `403` se não sou o dono. Retorna `CampingPainelResponse`. Funciona com `DonoStatus` pendente ou aprovado. |
| `GET` | `/campings/parceiros/proximos?lat&lng` | Campings `Ativo`, tipo `camping`/`pesca`, `DonoUsuarioId == null`, num raio de 2.000 m. Retorna `CampingProximoResponse[]`. |

Novo `RecursoController`, rota `api/recursos`, `[Authorize]`: `GET /recursos` → `RecursoResponse[]` (`id`, `nome`) a partir de `tb_recurso`.

### DTOs (`o-campista.shared/Models`)

- `Requests/CampingParceiroRequest`: `Nome` (obrigatório, ≤200), `Tipo` (obrigatório, `camping`|`pesca`), `Descricao?`, `Endereco?` (≤500), `Cidade` (obrigatório, ≤100), `Estado` (obrigatório, 2 chars), `Telefone?` (≤30), `Latitude`, `Longitude` (obrigatórios), `RecursosIds: long[]`.
- `Responses/CampingParceiroResponse`: `Id`, `Nome`, `Tipo`, `Cidade`, `Estado`, `Latitude`, `Longitude`, `Ativo`, `DonoStatus`, `CriadoEm`.
- `Responses/CampingPainelResponse`: `CampingId`, `Checkins30Dias`, `CheckinsTotal`, `VisitantesUnicos`, `AvaliacaoMedia`, `TotalAvaliacoes`, `TotalFavoritos`, `StatusOcupacao?` (reusa `StatusOcupacaoResponse`), `CheckinsPorDia: { Data, Quantidade }[]` (30 entradas, dias sem check-in com 0).
- `Responses/CampingProximoResponse`: `Id`, `Nome`, `Tipo`, `Cidade`, `Estado`, `DistanciaMetros`.
- `Responses/RecursoResponse`: `Id`, `Nome`.

### Camadas

- `ICampingParceiroService` / `CampingParceiroService` (Scoped) — regras acima. Validação do `Tipo` e das regras de reivindicação ficam no serviço.
- `ICampingRepository`: `CriarAsync(Camping)`, `ObterPorDonoAsync(Guid)`, `ObterSemDonoNoRaioAsync(lat, lng, raioMetros)`, `ContarFavoritosAsync(campingId)`, `ContarAvaliacoesAsync(campingId)`.
- `ICheckinRepository`: `ContarCheckinsPeriodoAsync(campingId, desde)`, `ContarVisitantesUnicosAsync(campingId)`, `ObterCheckinsPorDiaAsync(campingId, dias)`.
- `IRecursoRepository` / `RecursoRepository`: `ObterTodosAsync()`.
- Registrar os novos serviços/repositórios em `Program.cs`.

### Erros

Validação de request → `400` com `ModelState`. Regras de negócio (tipo inválido, já tem dono) → exceções mapeadas para `400`/`409` seguindo o padrão dos controllers existentes. Painel de camping que não é meu → `403`.

## 3. App Angular (`o-campista`)

### Rotas (filhas do layout autenticado, `authGuard`, lazy)

| Rota | Componente |
|---|---|
| `/parceiros` | `MeuCampingComponent` |
| `/parceiros/cadastrar` | `CadastrarCampingComponent` |

`authGuard` hoje não preserva a URL de destino. Incluir `returnUrl` como query param no redirecionamento para login e, após login/registro, navegar para ele (fallback `/home`). Isso faz o link da landing cair no formulário depois do login.

### Modelos (`core/models/camping-parceiro.model.ts`)

`CampingParceiro`, `CampingPainel`, `CampingParceiroRequest`, `CampingProximo`, `Recurso`, `DonoStatus = 'pendente' | 'aprovado'` — espelhando os DTOs.

### Serviço

`CampingParceiroService` (`providedIn: 'root'`), métodos: `criar()`, `reivindicar(id)`, `listarMeus()`, `obterPainel(id)`, `buscarProximos(lat, lng)`, `listarRecursos()`.

### `MeuCampingComponent`

- Carrega `listarMeus()`. Vazio → estado vazio com CTA "Cadastrar meu camping".
- Um ou mais campings → chips para trocar (só quando houver mais de um); badge de status `Em análise`/`Aprovado`; aviso quando pendente explicando que o camping ainda não aparece no mapa.
- Painel: cards de KPI (check-ins 30 dias, total, visitantes únicos, avaliação média + total, favoritos, ocupação atual) e gráfico de barras dos últimos 30 dias em SVG inline (sem biblioteca). Estados de loading/erro por padrão do design system.
- Botão "Cadastrar outro camping".

### `CadastrarCampingComponent`

Formulário reativo em dois passos, sem persistência de rascunho.

**Passo 1 — Posição.** Mapa Google com marker arrastável centrado na posição do `LocationService` (fallback São Carlos); botão "Usar minha posição". A cada mudança de posição (debounce), chama `buscarProximos`. Se retornar itens, mostra lista "Algum destes já é o seu?" com distância e botão **Reivindicar** por item; ao reivindicar, toast de sucesso e navega para `/parceiros`. Botão "Continuar" leva ao passo 2 com lat/lng preenchidos.

**Passo 2 — Dados.** Campos: nome*, tipo* (camping/pesca), cidade*, estado* (select UF), descrição, endereço, telefone, recursos (checkboxes de `listarRecursos()`). Erros inline com `aria-describedby`. Salvar → `criar()` → toast + navega para `/parceiros`. Erro `409`/`400` → toast de erro com mensagem traduzida.

### Navegação

Item "Meu camping" no menu lateral/conta, junto de checklist e presentes.

### i18n

Chaves `parceiro.meu-camping.*` e `parceiro.cadastro.*` em `public/i18n/pt-BR.json` e `en-US.json`. Todos os textos e `aria-label` via `TranslatePipe`/`I18nService`.

### Testes (Vitest)

- `CampingParceiroService`: URLs e query params de cada método.
- `CadastrarCampingComponent`: validação do passo 2, transição 1→2 exige posição, reivindicar chama o endpoint e navega, criar chama o endpoint com `recursosIds`.
- `MeuCampingComponent`: estado vazio vs. lista, seleção de camping recarrega o painel.
- `authGuard`: redireciona com `returnUrl`.

## 4. Landing (`o-campista.landing/parceiros.html`)

Página nova ao lado de `index.html`, reaproveitando `assets/styles.css` e `assets/main.js` (tema, menu, scroll reveal, toast). CSS específico entra numa seção `/* Parceiros */` do mesmo `styles.css`. Nova constante `APP_URL` em `main.js` (URL pública do app); o CTA aponta para `APP_URL + '/parceiros/cadastrar'`.

Header dos dois arquivos ganha link cruzado: em `index.html`, "Para donos de camping" → `parceiros.html`; em `parceiros.html`, "Para campistas" → `index.html`.

Seções:

1. **Hero** — "Coloque seu camping no mapa de quem acampa." CTA principal "Cadastrar meu camping"; secundário "Ver benefícios" (âncora `#beneficios`).
2. **Faixa de destaques** — "Cadastro gratuito" · "Aparece no mapa após aprovação" · "Painel com visitas reais". Sem números inventados.
3. **Benefícios** (`#beneficios`, 6 cards) — visibilidade no mapa; painel de visitação; status de ocupação em tempo real; presentes como chamariz; chat e achados & perdidos do camping; cupons e descontos com selo "Em breve" e texto no futuro, sem data.
4. **Mockup do painel** — um `.phone-frame` reproduzindo "Meu camping" (KPIs + gráfico), textos iguais às chaves i18n do app.
5. **Como funciona** — 3 passos: criar conta no app → marcar posição e preencher dados (ou reivindicar o camping que já está lá) → aprovação e publicação no mapa.
6. **CTA final** — repete o botão de cadastro.
7. **FAQ** — custa algo?; meu camping já está no mapa, e agora?; quanto tempo leva a aprovação?; posso editar depois? (por enquanto, pelo contato); o que é o status de ocupação?
8. **Footer** — igual ao de `index.html`.

Sem formulário nesta página. OG tags/canonical próprios apontando para `parceiros.html`.

**Verificação:** `npx prettier --check .` no repo da landing; abrir em light e dark nas larguras 1440/768/375; conferir contraste do selo "Em breve" e navegação por teclado no menu.

## Ordem de implementação sugerida

1. Banco + entidade + filtro `Ativo` no mapa (backend).
2. Endpoints de parceiros e recursos, com o painel por último.
3. `returnUrl` no `authGuard`.
4. Serviço + modelos + `CadastrarCampingComponent` (criar e reivindicar).
5. `MeuCampingComponent` e item de menu.
6. `parceiros.html` na landing.
