# Parceiros (cadastro de campings por donos) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donos de campings/pesqueiros cadastram (ou reivindicam) seu camping pelo app, ficam pendentes de aprovação manual e acompanham um painel de visitação; uma página nova na landing vende esses benefícios e aponta para o cadastro.

**Architecture:** Duas colunas novas em `tb_camping` (`dono_usuario_id`, `dono_status`) + `CampingParceiroController` e `RecursoController` na API ASP.NET seguindo o trio controller → service → repository já usado. No Angular, duas rotas lazy sob o layout autenticado (`/parceiros`, `/parceiros/cadastrar`), um `CampingParceiroService` e `returnUrl` no `authGuard`. Na landing estática, `parceiros.html` reaproveita `styles.css`/`main.js`.

**Tech Stack:** ASP.NET Core + EF Core (PostgreSQL/Supabase, sem migrations) · Angular 21 standalone + signals + Vitest (`ng test`) · HTML/CSS/JS puro na landing.

**Spec:** `docs/superpowers/specs/2026-09-15-parceiros-camping-design.md`

## Global Constraints

- **Três repositórios:** `C:\Users\liped\source\repos\o-campista.api` (Tasks 1–5), `C:\Users\liped\source\repos\o-campista` (Tasks 6–10), `C:\Users\liped\source\repos\o-campista.landing` (Task 11). Cada task diz em qual repo roda.
- **Nunca** usar `dotnet ef migrations`. Schema muda por script SQL em `o-campista.scripts/sql/` + atualização de `o-campista.scripts/ScriptsDB/tables.sql`; o script novo é executado manualmente no Supabase.
- A API não tem projeto de testes. Verificação de backend = `dotnet build o-campista.api.slnx` sem erros + chamadas HTTP (curl) contra `https://localhost:44316` com token obtido em `POST /api/auth/login`. Obter o token uma vez: `TOKEN=$(curl -sk -X POST https://localhost:44316/api/auth/login -H "Content-Type: application/json" -d '{"email":"<email>","senha":"<senha>"}' | jq -r .token)`.
- Angular: standalone, `inject()`, `input()/output()`, signals, `OnPush`, `@if/@for`, formulários reativos, `TranslatePipe` em todo texto visível, chaves i18n em **ambos** `public/i18n/pt-BR.json` e `public/i18n/en-US.json`. Nunca `any`.
- Prettier: `printWidth: 100`, `singleQuote: true`. Rodar `npx prettier --write <arquivos>` antes de cada commit nos repos Angular e landing.
- Tipos elegíveis para dono: `camping` e `pesca`. Raio de "campings próximos": 2.000 m. Janela do painel: 30 dias.
- `ToastService.success/error` recebem **chave i18n**, não texto.
- Commits: o usuário pediu para **não commitar por enquanto**. Os passos de commit ficam no plano para quando ele liberar; até lá, pular esses passos e manter tudo no working tree.

---

## File Structure

**Backend (`o-campista.api`)**

| Arquivo | Responsabilidade |
|---|---|
| `o-campista.scripts/sql/add_camping_dono.sql` (novo) | ALTER TABLE com as duas colunas |
| `o-campista.scripts/ScriptsDB/tables.sql` (modificar) | tabela nasce com as colunas; corrige `tb_campings` → `tb_camping` |
| `o-campista.entities/Entities/Camping.cs` (modificar) | `DonoUsuarioId`, `DonoStatus` |
| `o-campista.repository.imp/Repositories/CampingRepository.cs` (modificar) | filtro `Ativo`; `CriarAsync`, `ObterPorDonoAsync`, `ObterSemDonoNoRaioAsync`, `ContarFavoritosAsync`, `ContarAvaliacoesAsync` |
| `o-campista.repository/IRepositories/ICampingRepository.cs` (modificar) | assinaturas acima |
| `o-campista.repository/IRepositories/ICheckinRepository.cs` + `.imp/Repositories/CheckinRepository.cs` (modificar) | `ContarCheckinsPeriodoAsync`, `ContarVisitantesUnicosAsync`, `ObterCheckinsPorDiaAsync` |
| `o-campista.repository/IRepositories/IRecursoRepository.cs` + `.imp/Repositories/RecursoRepository.cs` (novos) | `ObterTodosAsync` |
| `o-campista.shared/Models/Requests/CampingParceiroRequest.cs` (novo) | payload de criação |
| `o-campista.shared/Models/Responses/{CampingParceiroResponse,CampingPainelResponse,CampingProximoResponse,RecursoResponse}.cs` (novos) | respostas |
| `o-campista.business/IServices/ICampingParceiroService.cs` + `.imp/Services/CampingParceiroService.cs` (novos) | regras de criação/reivindicação/painel |
| `o-campista.api/Controllers/CampingParceiroController.cs`, `RecursoController.cs` (novos) | rotas |
| `o-campista.api/Program.cs` (modificar) | DI |

**App Angular (`o-campista`)**

| Arquivo | Responsabilidade |
|---|---|
| `src/app/core/guards/auth.guard.ts` (+ `.spec.ts`) | redireciona com `returnUrl` |
| `src/app/pages/login/login.component.ts`, `src/app/pages/register/register.component.ts` | navegam para `returnUrl` após autenticar |
| `src/app/core/models/camping-parceiro.model.ts` (novo) | tipos |
| `src/app/core/services/camping-parceiro.service.ts` (+ `.spec.ts`) (novos) | HTTP |
| `src/app/pages/parceiros/cadastrar-camping/cadastrar-camping.component.{ts,html,scss,spec.ts}` (novos) | wizard de 2 passos |
| `src/app/pages/parceiros/meu-camping/meu-camping.component.{ts,html,scss,spec.ts}` (novos) | painel |
| `src/app/app.routes.ts`, `src/app/components/app-menu/app-menu.component.html` | rotas e menu |
| `public/i18n/pt-BR.json`, `public/i18n/en-US.json` | chaves `parceiro.*` |
| `CLAUDE.md` | documentação |

**Landing (`o-campista.landing`)**

| Arquivo | Responsabilidade |
|---|---|
| `parceiros.html` (novo) | página de benefícios |
| `assets/styles.css` (modificar) | seção `/* Parceiros */` |
| `assets/main.js` (modificar) | `APP_URL`; guards para elementos ausentes |
| `index.html`, `README.md` (modificar) | link cruzado; documentação de `APP_URL` |

---

### Task 1: Schema + entidade + filtro `Ativo` no mapa (backend)

**Repo:** `o-campista.api`

**Files:**
- Create: `o-campista.scripts/sql/add_camping_dono.sql`
- Modify: `o-campista.scripts/ScriptsDB/tables.sql:6-20`
- Modify: `o-campista.entities/Entities/Camping.cs`
- Modify: `o-campista.repository.imp/Repositories/CampingRepository.cs` (`ObterCampingsMapaAsync`)

**Interfaces:**
- Produces: `Camping.DonoUsuarioId (Guid?)`, `Camping.DonoStatus (string?)`; constantes de status em `Camping`: `public const string DonoStatusPendente = "pendente"; public const string DonoStatusAprovado = "aprovado";`

- [ ] **Step 1: Criar o script incremental**

`o-campista.scripts/sql/add_camping_dono.sql`:

```sql
-- Vincula um usuário dono ao camping (cadastro/reivindicação por parceiros).
-- dono_status: 'pendente' (aguardando aprovação manual) | 'aprovado'
ALTER TABLE tb_camping
  ADD COLUMN IF NOT EXISTS dono_usuario_id uuid NULL REFERENCES tb_usuario(id),
  ADD COLUMN IF NOT EXISTS dono_status varchar(20) NULL
    CHECK (dono_status IN ('pendente', 'aprovado'));

CREATE INDEX IF NOT EXISTS ix_camping_dono_usuario_id ON tb_camping (dono_usuario_id);
```

- [ ] **Step 2: Atualizar o script de criação**

Em `o-campista.scripts/ScriptsDB/tables.sql`, trocar `create table tb_campings (` por `create table tb_camping (` e, logo após a linha `atualizado_em timestamp`, adicionar (antes do `);`):

```sql
    ,
    dono_usuario_id uuid null references tb_usuario(id),
    dono_status varchar(20) null check (dono_status in ('pendente', 'aprovado'))
```

(Ajustar a vírgula da linha anterior para que o SQL continue válido: `atualizado_em timestamp,`.) Se `tb_usuario` for criada depois de `tb_camping` no arquivo, mover a definição de `tb_usuario` para antes de `tb_camping`.

- [ ] **Step 3: Adicionar as propriedades na entidade**

Em `o-campista.entities/Entities/Camping.cs`, após `AtualizadoEm`:

```csharp
        [Column("dono_usuario_id")]
        public Guid? DonoUsuarioId { get; set; }

        [Column("dono_status")]
        [MaxLength(20)]
        public string? DonoStatus { get; set; }

        public const string DonoStatusPendente = "pendente";
        public const string DonoStatusAprovado = "aprovado";
        public static readonly string[] TiposComDono = ["camping", "pesca"];
```

- [ ] **Step 4: Filtrar campings inativos no mapa**

Em `CampingRepository.ObterCampingsMapaAsync`, logo após `.AsQueryable();`, inserir:

```csharp
            query = query.Where(c => c.Ativo);
```

- [ ] **Step 5: Build**

Run: `dotnet build o-campista.api.slnx`
Expected: `Build succeeded`, 0 errors.

- [ ] **Step 6: Executar o script no Supabase**

Rodar o conteúdo de `add_camping_dono.sql` no SQL Editor do Supabase. Confirmar com `select column_name from information_schema.columns where table_name = 'tb_camping' and column_name like 'dono%';` → 2 linhas.

- [ ] **Step 7: Verificar o mapa**

Run: `curl -sk https://localhost:44316/api/mapa/campings -H "Authorization: Bearer $TOKEN" | jq length`
Expected: mesmo número de campings ativos de antes (nenhum com `ativo = false` na lista).

- [ ] **Step 8: Commit** (quando liberado)

```bash
git add o-campista.scripts o-campista.entities/Entities/Camping.cs o-campista.repository.imp/Repositories/CampingRepository.cs
git commit -m "feat(camping): colunas de dono e filtro de ativos no mapa"
```

---

### Task 2: DTOs, recursos e `RecursoController`

**Repo:** `o-campista.api`

**Files:**
- Create: `o-campista.shared/Models/Requests/CampingParceiroRequest.cs`
- Create: `o-campista.shared/Models/Responses/CampingParceiroResponse.cs`, `CampingPainelResponse.cs`, `CampingProximoResponse.cs`, `RecursoResponse.cs`
- Create: `o-campista.repository/IRepositories/IRecursoRepository.cs`, `o-campista.repository.imp/Repositories/RecursoRepository.cs`
- Create: `o-campista.api/Controllers/RecursoController.cs`
- Modify: `o-campista.api/Program.cs` (registrar `IRecursoRepository`)

**Interfaces:**
- Produces: todos os DTOs abaixo; `IRecursoRepository.ObterTodosAsync(): Task<List<Recurso>>`.

- [ ] **Step 1: Request**

`o-campista.shared/Models/Requests/CampingParceiroRequest.cs`:

```csharp
using System.ComponentModel.DataAnnotations;

namespace o_campista.shared.Models.Requests;

public class CampingParceiroRequest
{
    [Required, MaxLength(200)]
    public string Nome { get; set; } = string.Empty;

    /// <summary>"camping" ou "pesca".</summary>
    [Required, MaxLength(50)]
    public string Tipo { get; set; } = string.Empty;

    public string? Descricao { get; set; }

    [MaxLength(500)]
    public string? Endereco { get; set; }

    [Required, MaxLength(100)]
    public string Cidade { get; set; } = string.Empty;

    [Required, StringLength(2, MinimumLength = 2)]
    public string Estado { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? Telefone { get; set; }

    [Required, Range(-90, 90)]
    public decimal Latitude { get; set; }

    [Required, Range(-180, 180)]
    public decimal Longitude { get; set; }

    public List<long> RecursosIds { get; set; } = [];
}
```

- [ ] **Step 2: Responses**

`CampingParceiroResponse.cs`:

```csharp
namespace o_campista.shared.Models.Responses;

public class CampingParceiroResponse
{
    public long Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public string Cidade { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public bool Ativo { get; set; }
    public string DonoStatus { get; set; } = string.Empty;
    public DateTime CriadoEm { get; set; }
}
```

`CampingPainelResponse.cs`:

```csharp
namespace o_campista.shared.Models.Responses;

public class CampingPainelResponse
{
    public long CampingId { get; set; }
    public int Checkins30Dias { get; set; }
    public int CheckinsTotal { get; set; }
    public int VisitantesUnicos { get; set; }
    public decimal AvaliacaoMedia { get; set; }
    public int TotalAvaliacoes { get; set; }
    public int TotalFavoritos { get; set; }
    public StatusOcupacaoResponse? StatusOcupacao { get; set; }
    public List<CheckinsDiaResponse> CheckinsPorDia { get; set; } = [];
}

public class CheckinsDiaResponse
{
    public DateOnly Data { get; set; }
    public int Quantidade { get; set; }
}
```

`CampingProximoResponse.cs`:

```csharp
namespace o_campista.shared.Models.Responses;

public class CampingProximoResponse
{
    public long Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public string Cidade { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public double DistanciaMetros { get; set; }
}
```

`RecursoResponse.cs`:

```csharp
namespace o_campista.shared.Models.Responses;

public class RecursoResponse
{
    public long Id { get; set; }
    public string Nome { get; set; } = string.Empty;
}
```

- [ ] **Step 3: Repositório de recursos**

`o-campista.repository/IRepositories/IRecursoRepository.cs`:

```csharp
using o_campista.entities.Entities;

namespace o_campista.repository.IRepositories;

public interface IRecursoRepository
{
    Task<List<Recurso>> ObterTodosAsync();
}
```

`o-campista.repository.imp/Repositories/RecursoRepository.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using o_campista.api.Context;
using o_campista.entities.Entities;
using o_campista.repository.IRepositories;

namespace o_campista.repository.imp.Repositories;

public class RecursoRepository : IRecursoRepository
{
    private readonly CampistaDbContext _context;

    public RecursoRepository(CampistaDbContext context)
    {
        _context = context;
    }

    public Task<List<Recurso>> ObterTodosAsync()
    {
        return _context.Recursos.AsNoTracking().OrderBy(r => r.Nome).ToListAsync();
    }
}
```

- [ ] **Step 4: Controller**

`o-campista.api/Controllers/RecursoController.cs`:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using o_campista.repository.IRepositories;
using o_campista.shared.Models.Responses;

namespace o_campista.api.Controllers;

[ApiController]
[Route("api/recursos")]
[Authorize]
public class RecursoController : ControllerBase
{
    private readonly IRecursoRepository _recursoRepository;

    public RecursoController(IRecursoRepository recursoRepository)
    {
        _recursoRepository = recursoRepository;
    }

    // GET api/recursos
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar()
    {
        var recursos = await _recursoRepository.ObterTodosAsync();
        return Ok(recursos.Select(r => new RecursoResponse { Id = r.Id, Nome = r.Nome }));
    }
}
```

- [ ] **Step 5: DI**

Em `Program.cs`, junto dos outros repositórios (após a linha `IFavoritoCampingRepository`):

```csharp
builder.Services.AddScoped<IRecursoRepository, RecursoRepository>();
```

- [ ] **Step 6: Build e chamada**

Run: `dotnet build o-campista.api.slnx` → 0 erros.
Run: `curl -sk https://localhost:44316/api/recursos -H "Authorization: Bearer $TOKEN" | jq '.[0]'`
Expected: `{ "id": 1, "nome": "..." }`.

- [ ] **Step 7: Commit** (quando liberado)

```bash
git add o-campista.shared o-campista.repository o-campista.repository.imp o-campista.api/Controllers/RecursoController.cs o-campista.api/Program.cs
git commit -m "feat(parceiros): DTOs e endpoint de recursos"
```

---

### Task 3: Métodos novos nos repositórios de camping e check-in

**Repo:** `o-campista.api`

**Files:**
- Modify: `o-campista.repository/IRepositories/ICampingRepository.cs`
- Modify: `o-campista.repository.imp/Repositories/CampingRepository.cs`
- Modify: `o-campista.repository/IRepositories/ICheckinRepository.cs`
- Modify: `o-campista.repository.imp/Repositories/CheckinRepository.cs`

**Interfaces:**
- Produces (ICampingRepository): `Task<Camping> CriarAsync(Camping camping)`, `Task<List<Camping>> ObterPorDonoAsync(Guid usuarioId)`, `Task<List<(Camping Camping, double DistanciaMetros)>> ObterSemDonoNoRaioAsync(decimal lat, decimal lng, double raioMetros)`, `Task<int> ContarFavoritosAsync(long campingId)`, `Task<int> ContarAvaliacoesAsync(long campingId)`
- Produces (ICheckinRepository): `Task<int> ContarCheckinsPeriodoAsync(long campingId, DateTime desde)`, `Task<int> ContarVisitantesUnicosAsync(long campingId)`, `Task<Dictionary<DateOnly, int>> ObterCheckinsPorDiaAsync(long campingId, DateTime desde)`

- [ ] **Step 1: Interface de camping**

Adicionar em `ICampingRepository`:

```csharp
        Task<Camping> CriarAsync(Camping camping);
        Task<List<Camping>> ObterPorDonoAsync(Guid usuarioId);
        Task<List<(Camping Camping, double DistanciaMetros)>> ObterSemDonoNoRaioAsync(decimal latitude, decimal longitude, double raioMetros);
        Task<int> ContarFavoritosAsync(long campingId);
        Task<int> ContarAvaliacoesAsync(long campingId);
```

- [ ] **Step 2: Implementação de camping**

Adicionar em `CampingRepository` (dentro da classe):

```csharp
        public async Task<Camping> CriarAsync(Camping camping)
        {
            camping.CriadoEm = DateTime.UtcNow;
            await _context.Campings.AddAsync(camping);
            await _context.SaveChangesAsync();
            return camping;
        }

        public Task<List<Camping>> ObterPorDonoAsync(Guid usuarioId)
        {
            return _context.Campings
                .AsNoTracking()
                .Where(c => c.DonoUsuarioId == usuarioId)
                .OrderByDescending(c => c.CriadoEm)
                .ToListAsync();
        }

        public async Task<List<(Camping Camping, double DistanciaMetros)>> ObterSemDonoNoRaioAsync(
            decimal latitude, decimal longitude, double raioMetros)
        {
            // Pré-filtro por bounding box (1 grau ≈ 111 km) para não trazer a tabela inteira;
            // a distância exata é calculada em memória com Haversine.
            var delta = (decimal)(raioMetros / 111_000d);
            var candidatos = await _context.Campings
                .AsNoTracking()
                .Where(c => c.Ativo
                    && c.DonoUsuarioId == null
                    && Camping.TiposComDono.Contains(c.Tipo)
                    && c.Latitude >= latitude - delta && c.Latitude <= latitude + delta
                    && c.Longitude >= longitude - delta && c.Longitude <= longitude + delta)
                .ToListAsync();

            return candidatos
                .Select(c => (Camping: c, DistanciaMetros: DistanciaMetros(
                    (double)latitude, (double)longitude, (double)c.Latitude, (double)c.Longitude)))
                .Where(x => x.DistanciaMetros <= raioMetros)
                .OrderBy(x => x.DistanciaMetros)
                .ToList();
        }

        public Task<int> ContarFavoritosAsync(long campingId)
        {
            return _context.UsuarioCampingFavoritos.CountAsync(f => f.CampingId == campingId);
        }

        public Task<int> ContarAvaliacoesAsync(long campingId)
        {
            return _context.CampingAvaliacoes.CountAsync(a => a.CampingId == campingId);
        }

        private static double DistanciaMetros(double lat1, double lng1, double lat2, double lng2)
        {
            const double raioTerra = 6_371_000d;
            var dLat = (lat2 - lat1) * Math.PI / 180d;
            var dLng = (lng2 - lng1) * Math.PI / 180d;
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                    + Math.Cos(lat1 * Math.PI / 180d) * Math.Cos(lat2 * Math.PI / 180d)
                    * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
            return raioTerra * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        }
```

- [ ] **Step 3: Interface de check-in**

Adicionar em `ICheckinRepository`:

```csharp
        Task<int> ContarCheckinsPeriodoAsync(long campingId, DateTime desde);
        Task<int> ContarVisitantesUnicosAsync(long campingId);
        Task<Dictionary<DateOnly, int>> ObterCheckinsPorDiaAsync(long campingId, DateTime desde);
```

- [ ] **Step 4: Implementação de check-in**

Adicionar em `CheckinRepository`:

```csharp
    public Task<int> ContarCheckinsPeriodoAsync(long campingId, DateTime desde)
    {
        return _context.Checkins.CountAsync(c => c.CampingId == campingId && c.CriadoEm >= desde);
    }

    public Task<int> ContarVisitantesUnicosAsync(long campingId)
    {
        return _context.Checkins
            .Where(c => c.CampingId == campingId)
            .Select(c => c.UsuarioId)
            .Distinct()
            .CountAsync();
    }

    public async Task<Dictionary<DateOnly, int>> ObterCheckinsPorDiaAsync(long campingId, DateTime desde)
    {
        var porDia = await _context.Checkins
            .Where(c => c.CampingId == campingId && c.CriadoEm >= desde)
            .GroupBy(c => c.CriadoEm.Date)
            .Select(g => new { Dia = g.Key, Quantidade = g.Count() })
            .ToListAsync();

        return porDia.ToDictionary(x => DateOnly.FromDateTime(x.Dia), x => x.Quantidade);
    }
```

- [ ] **Step 5: Build**

Run: `dotnet build o-campista.api.slnx` → 0 erros.

- [ ] **Step 6: Commit** (quando liberado)

```bash
git add o-campista.repository o-campista.repository.imp
git commit -m "feat(parceiros): consultas de dono, proximidade e métricas de camping"
```

---

### Task 4: `CampingParceiroService` + controller (criar, reivindicar, meus, próximos)

**Repo:** `o-campista.api`

**Files:**
- Create: `o-campista.business/IServices/ICampingParceiroService.cs`
- Create: `o-campista.business.imp/Services/CampingParceiroService.cs`
- Create: `o-campista.api/Controllers/CampingParceiroController.cs`
- Modify: `o-campista.api/Program.cs`

**Interfaces:**
- Consumes: Task 2 DTOs, Task 3 métodos de repositório, `IUsuarioRepository.ObterPorEmailAsync(string)` (já existe).
- Produces: `ICampingParceiroService` completo (o método `ObterPainelAsync` é implementado na Task 5 — declarar já aqui, com `throw new NotImplementedException()` até lá **não é permitido**; implementar o painel na Task 5 e deixar a interface sem esse método até lá).
- Erros: `ArgumentException` → 400, `KeyNotFoundException` → 404, `InvalidOperationException` → 409, `UnauthorizedAccessException` → 403.

- [ ] **Step 1: Interface do serviço**

`o-campista.business/IServices/ICampingParceiroService.cs`:

```csharp
using o_campista.shared.Models.Requests;
using o_campista.shared.Models.Responses;

namespace o_campista.business.IServices;

public interface ICampingParceiroService
{
    Task<CampingParceiroResponse> CriarAsync(Guid usuarioId, CampingParceiroRequest request);
    Task<CampingParceiroResponse> ReivindicarAsync(Guid usuarioId, long campingId);
    Task<List<CampingParceiroResponse>> ObterMeusAsync(Guid usuarioId);
    Task<List<CampingProximoResponse>> ObterProximosSemDonoAsync(decimal latitude, decimal longitude);
}
```

- [ ] **Step 2: Implementação**

`o-campista.business.imp/Services/CampingParceiroService.cs`:

```csharp
using o_campista.business.IServices;
using o_campista.entities.Entities;
using o_campista.repository.IRepositories;
using o_campista.shared.Models.Requests;
using o_campista.shared.Models.Responses;

namespace o_campista.business.imp.Services;

public class CampingParceiroService : ICampingParceiroService
{
    private const double RaioProximosMetros = 2_000d;

    private readonly ICampingRepository _campingRepository;
    private readonly ICheckinRepository _checkinRepository;

    public CampingParceiroService(ICampingRepository campingRepository, ICheckinRepository checkinRepository)
    {
        _campingRepository = campingRepository;
        _checkinRepository = checkinRepository;
    }

    public async Task<CampingParceiroResponse> CriarAsync(Guid usuarioId, CampingParceiroRequest request)
    {
        var tipo = request.Tipo.Trim().ToLowerInvariant();
        if (!Camping.TiposComDono.Contains(tipo))
            throw new ArgumentException("Tipo inválido. Use 'camping' ou 'pesca'.");

        var camping = new Camping
        {
            Nome = request.Nome.Trim(),
            Tipo = tipo,
            Descricao = string.IsNullOrWhiteSpace(request.Descricao) ? null : request.Descricao.Trim(),
            Endereco = string.IsNullOrWhiteSpace(request.Endereco) ? null : request.Endereco.Trim(),
            Cidade = request.Cidade.Trim(),
            Estado = request.Estado.Trim().ToUpperInvariant(),
            Telefone = string.IsNullOrWhiteSpace(request.Telefone) ? null : request.Telefone.Trim(),
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Ativo = false,
            DonoUsuarioId = usuarioId,
            DonoStatus = Camping.DonoStatusPendente,
            Recursos = request.RecursosIds
                .Distinct()
                .Select(id => new CampingRecurso { RecursoId = id, Disponivel = true })
                .ToList(),
        };

        var criado = await _campingRepository.CriarAsync(camping);
        return Mapear(criado);
    }

    public async Task<CampingParceiroResponse> ReivindicarAsync(Guid usuarioId, long campingId)
    {
        var camping = await _campingRepository.ObterPorIdAsync(campingId);
        if (camping is null || !camping.Ativo || !Camping.TiposComDono.Contains(camping.Tipo))
            throw new KeyNotFoundException("Camping não encontrado.");

        if (camping.DonoUsuarioId is not null)
            throw new InvalidOperationException("Este camping já possui um dono vinculado.");

        camping.DonoUsuarioId = usuarioId;
        camping.DonoStatus = Camping.DonoStatusPendente;
        await _campingRepository.AtualizarAsync(camping);
        return Mapear(camping);
    }

    public async Task<List<CampingParceiroResponse>> ObterMeusAsync(Guid usuarioId)
    {
        var campings = await _campingRepository.ObterPorDonoAsync(usuarioId);
        return campings.Select(Mapear).ToList();
    }

    public async Task<List<CampingProximoResponse>> ObterProximosSemDonoAsync(decimal latitude, decimal longitude)
    {
        var proximos = await _campingRepository.ObterSemDonoNoRaioAsync(latitude, longitude, RaioProximosMetros);
        return proximos.Select(p => new CampingProximoResponse
        {
            Id = p.Camping.Id,
            Nome = p.Camping.Nome,
            Tipo = p.Camping.Tipo,
            Cidade = p.Camping.Cidade ?? string.Empty,
            Estado = p.Camping.Estado ?? string.Empty,
            DistanciaMetros = Math.Round(p.DistanciaMetros),
        }).ToList();
    }

    private static CampingParceiroResponse Mapear(Camping c) => new()
    {
        Id = c.Id,
        Nome = c.Nome,
        Tipo = c.Tipo,
        Cidade = c.Cidade ?? string.Empty,
        Estado = c.Estado ?? string.Empty,
        Latitude = c.Latitude,
        Longitude = c.Longitude,
        Ativo = c.Ativo,
        DonoStatus = c.DonoStatus ?? string.Empty,
        CriadoEm = c.CriadoEm,
    };
}
```

Observação: `ObterPorIdAsync` faz `Include(Fotos/Recursos)` e o contexto está rastreando; `AtualizarAsync` chama `_context.Update(camping)` — funciona porque a entidade já é rastreada (o método existente já é usado assim por avaliações).

- [ ] **Step 3: Controller**

`o-campista.api/Controllers/CampingParceiroController.cs`:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using o_campista.business.IServices;
using o_campista.repository.IRepositories;
using o_campista.shared.Models.Requests;
using System.Security.Claims;

namespace o_campista.api.Controllers;

[ApiController]
[Route("api/campings/parceiros")]
[Authorize]
public class CampingParceiroController : ControllerBase
{
    private readonly ICampingParceiroService _service;
    private readonly IUsuarioRepository _usuarioRepository;

    public CampingParceiroController(ICampingParceiroService service, IUsuarioRepository usuarioRepository)
    {
        _service = service;
        _usuarioRepository = usuarioRepository;
    }

    // POST api/campings/parceiros
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Criar([FromBody] CampingParceiroRequest request)
    {
        var usuarioId = await ObterUsuarioIdAsync();
        if (usuarioId is null) return Unauthorized();

        try
        {
            var criado = await _service.CriarAsync(usuarioId.Value, request);
            return StatusCode(StatusCodes.Status201Created, criado);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { mensagem = ex.Message });
        }
    }

    // POST api/campings/parceiros/{campingId}/reivindicar
    [HttpPost("{campingId:long}/reivindicar")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Reivindicar(long campingId)
    {
        var usuarioId = await ObterUsuarioIdAsync();
        if (usuarioId is null) return Unauthorized();

        try
        {
            return Ok(await _service.ReivindicarAsync(usuarioId.Value, campingId));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { mensagem = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensagem = ex.Message });
        }
    }

    // GET api/campings/parceiros/meus
    [HttpGet("meus")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Meus()
    {
        var usuarioId = await ObterUsuarioIdAsync();
        if (usuarioId is null) return Unauthorized();

        return Ok(await _service.ObterMeusAsync(usuarioId.Value));
    }

    // GET api/campings/parceiros/proximos?lat=&lng=
    [HttpGet("proximos")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Proximos([FromQuery] decimal lat, [FromQuery] decimal lng)
    {
        return Ok(await _service.ObterProximosSemDonoAsync(lat, lng));
    }

    private async Task<Guid?> ObterUsuarioIdAsync()
    {
        var email = User.Identity?.Name ?? User.FindFirst(ClaimTypes.Name)?.Value;
        if (string.IsNullOrEmpty(email)) return null;
        var usuario = await _usuarioRepository.ObterPorEmailAsync(email);
        return usuario?.Id;
    }
}
```

- [ ] **Step 4: DI**

Em `Program.cs`, após `IFavoritoCampingService`:

```csharp
builder.Services.AddScoped<ICampingParceiroService, CampingParceiroService>();
```

- [ ] **Step 5: Build + verificação HTTP**

Run: `dotnet build o-campista.api.slnx` → 0 erros. Subir a API e:

```bash
# criar
curl -sk -X POST https://localhost:44316/api/campings/parceiros -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"nome":"Camping Teste Dono","tipo":"camping","cidade":"São Carlos","estado":"sp","latitude":-22.0174,"longitude":-47.8903,"recursosIds":[1]}'
# Expected: 201, body com "ativo": false, "donoStatus": "pendente", "estado": "SP"

# tipo inválido
curl -sk -o /dev/null -w "%{http_code}\n" -X POST https://localhost:44316/api/campings/parceiros -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"nome":"X","tipo":"cachoeira","cidade":"A","estado":"SP","latitude":0,"longitude":0}'
# Expected: 400

# meus
curl -sk https://localhost:44316/api/campings/parceiros/meus -H "Authorization: Bearer $TOKEN" | jq length
# Expected: 1

# próximos (usar lat/lng de um camping seed ativo sem dono)
curl -sk "https://localhost:44316/api/campings/parceiros/proximos?lat=-22.0174&lng=-47.8903" -H "Authorization: Bearer $TOKEN" | jq '.[0]'
# Expected: objeto com distanciaMetros <= 2000 (ou [] se não houver seed no raio)

# reivindicar duas vezes o mesmo id → 200 e depois 409
curl -sk -o /dev/null -w "%{http_code}\n" -X POST https://localhost:44316/api/campings/parceiros/<ID_SEED>/reivindicar -H "Authorization: Bearer $TOKEN"
curl -sk -o /dev/null -w "%{http_code}\n" -X POST https://localhost:44316/api/campings/parceiros/<ID_SEED>/reivindicar -H "Authorization: Bearer $TOKEN"

# mapa não mostra o camping pendente
curl -sk https://localhost:44316/api/mapa/campings -H "Authorization: Bearer $TOKEN" | jq '[.[] | select(.nome=="Camping Teste Dono")] | length'
# Expected: 0
```

Depois de testar, desfazer a reivindicação de teste: `update tb_camping set dono_usuario_id = null, dono_status = null where id = <ID_SEED>;`.

- [ ] **Step 6: Commit** (quando liberado)

```bash
git add o-campista.business o-campista.business.imp o-campista.api/Controllers/CampingParceiroController.cs o-campista.api/Program.cs
git commit -m "feat(parceiros): cadastro, reivindicação e listagem de campings do dono"
```

---

### Task 5: Painel do camping (`GET /campings/parceiros/{id}/painel`)

**Repo:** `o-campista.api`

**Files:**
- Modify: `o-campista.business/IServices/ICampingParceiroService.cs`
- Modify: `o-campista.business.imp/Services/CampingParceiroService.cs`
- Modify: `o-campista.api/Controllers/CampingParceiroController.cs`

**Interfaces:**
- Consumes: `ICheckinRepository.ContarCheckinsPeriodoAsync/ContarVisitantesUnicosAsync/ObterCheckinsPorDiaAsync/ContarTotalCheckinsCampingAsync/ObterStatusOcupacaoTodosAsync`, `ICampingRepository.ContarFavoritosAsync/ContarAvaliacoesAsync/ObterPorIdAsync`.
- Produces: `Task<CampingPainelResponse> ObterPainelAsync(Guid usuarioId, long campingId)`; lança `KeyNotFoundException` (404) e `UnauthorizedAccessException` (403).

- [ ] **Step 1: Interface**

Adicionar em `ICampingParceiroService`:

```csharp
    Task<CampingPainelResponse> ObterPainelAsync(Guid usuarioId, long campingId);
```

- [ ] **Step 2: Implementação**

Adicionar em `CampingParceiroService`:

```csharp
    private const int DiasPainel = 30;

    public async Task<CampingPainelResponse> ObterPainelAsync(Guid usuarioId, long campingId)
    {
        var camping = await _campingRepository.ObterPorIdAsync(campingId)
            ?? throw new KeyNotFoundException("Camping não encontrado.");

        if (camping.DonoUsuarioId != usuarioId)
            throw new UnauthorizedAccessException("Você não é o dono deste camping.");

        var hoje = DateOnly.FromDateTime(DateTime.UtcNow);
        var desde = DateTime.UtcNow.Date.AddDays(-(DiasPainel - 1));

        var porDia = await _checkinRepository.ObterCheckinsPorDiaAsync(campingId, desde);
        var ocupacoes = await _checkinRepository.ObterStatusOcupacaoTodosAsync();

        return new CampingPainelResponse
        {
            CampingId = campingId,
            Checkins30Dias = await _checkinRepository.ContarCheckinsPeriodoAsync(campingId, desde),
            CheckinsTotal = await _checkinRepository.ContarTotalCheckinsCampingAsync(campingId),
            VisitantesUnicos = await _checkinRepository.ContarVisitantesUnicosAsync(campingId),
            AvaliacaoMedia = camping.AvaliacaoMedia,
            TotalAvaliacoes = await _campingRepository.ContarAvaliacoesAsync(campingId),
            TotalFavoritos = await _campingRepository.ContarFavoritosAsync(campingId),
            StatusOcupacao = ocupacoes.GetValueOrDefault(campingId),
            CheckinsPorDia = Enumerable.Range(0, DiasPainel)
                .Select(i => hoje.AddDays(-(DiasPainel - 1 - i)))
                .Select(dia => new CheckinsDiaResponse
                {
                    Data = dia,
                    Quantidade = porDia.GetValueOrDefault(dia),
                })
                .ToList(),
        };
    }
```

- [ ] **Step 3: Endpoint**

Adicionar em `CampingParceiroController`:

```csharp
    // GET api/campings/parceiros/{campingId}/painel
    [HttpGet("{campingId:long}/painel")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Painel(long campingId)
    {
        var usuarioId = await ObterUsuarioIdAsync();
        if (usuarioId is null) return Unauthorized();

        try
        {
            return Ok(await _service.ObterPainelAsync(usuarioId.Value, campingId));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { mensagem = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }
```

- [ ] **Step 4: Build + verificação**

Run: `dotnet build o-campista.api.slnx` → 0 erros.

```bash
ID=$(curl -sk https://localhost:44316/api/campings/parceiros/meus -H "Authorization: Bearer $TOKEN" | jq '.[0].id')
curl -sk https://localhost:44316/api/campings/parceiros/$ID/painel -H "Authorization: Bearer $TOKEN" | jq '{checkins30Dias, visitantesUnicos, dias: (.checkinsPorDia | length)}'
# Expected: dias == 30
curl -sk -o /dev/null -w "%{http_code}\n" https://localhost:44316/api/campings/parceiros/1/painel -H "Authorization: Bearer $TOKEN"
# Expected: 403 (camping seed sem dono)
```

- [ ] **Step 5: Commit** (quando liberado)

```bash
git add o-campista.business o-campista.business.imp o-campista.api/Controllers/CampingParceiroController.cs
git commit -m "feat(parceiros): painel de visitação do camping"
```

---

### Task 6: `returnUrl` no `authGuard` e no login/registro

**Repo:** `o-campista`

**Files:**
- Modify: `src/app/core/guards/auth.guard.ts`
- Create: `src/app/core/guards/auth.guard.spec.ts`
- Modify: `src/app/pages/login/login.component.ts` (linhas ~46 e ~60)
- Modify: `src/app/pages/register/register.component.ts` (linha ~68)

**Interfaces:**
- Produces: guard redireciona para `/?returnUrl=<url>`; `LoginComponent`/`RegisterComponent` navegam para `returnUrl` (se começar com `/`) ou `/home`.

- [ ] **Step 1: Teste do guard**

`src/app/core/guards/auth.guard.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  function setup(authenticated: boolean) {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { isAuthenticated: () => authenticated } }],
    });
    const router = TestBed.inject(Router);
    return { router };
  }

  it('libera quando autenticado', () => {
    setup(true);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/parceiros/cadastrar' } as never),
    );
    expect(result).toBe(true);
  });

  it('redireciona para login com returnUrl quando não autenticado', () => {
    const { router } = setup(false);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/parceiros/cadastrar' } as never),
    ) as UrlTree;
    expect(router.serializeUrl(result)).toBe('/?returnUrl=%2Fparceiros%2Fcadastrar');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx ng test --include src/app/core/guards/auth.guard.spec.ts`
Expected: FAIL — o guard atual retorna `/` sem `returnUrl`.

- [ ] **Step 3: Implementar o guard**

`src/app/core/guards/auth.guard.ts`:

```ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/'], { queryParams: { returnUrl: state.url } });
};
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx ng test --include src/app/core/guards/auth.guard.spec.ts`
Expected: PASS (2 testes).

- [ ] **Step 5: Login e registro respeitam `returnUrl`**

Em `login.component.ts`, injetar `ActivatedRoute` (`private route = inject(ActivatedRoute);`, import de `@angular/router`) e adicionar o método:

```ts
  private irParaDestino(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.router.navigateByUrl(returnUrl?.startsWith('/') ? returnUrl : '/home');
  }
```

Trocar as duas ocorrências de `this.router.navigate(['/home'])` (login Google e `entrar()`) por `this.irParaDestino()`. Na navegação para `/register` (`this.router.navigate(['/register'])`), passar o parâmetro adiante: `this.router.navigate(['/register'], { queryParams: this.route.snapshot.queryParams })`.

Em `register.component.ts`, mesma coisa: injetar `ActivatedRoute`, adicionar `irParaDestino()` idêntico e trocar `this.router.navigate(['/home'])` por `this.irParaDestino()`.

- [ ] **Step 6: Verificar manualmente**

`npm start`, abrir `http://localhost:4200/checklist` deslogado → URL vira `/?returnUrl=%2Fchecklist`; após login, cai em `/checklist`.

- [ ] **Step 7: Prettier + commit** (quando liberado)

```bash
npx prettier --write src/app/core/guards src/app/pages/login src/app/pages/register
git add src/app/core/guards src/app/pages/login src/app/pages/register
git commit -m "feat(auth): preserva returnUrl ao redirecionar para login"
```

---

### Task 7: Modelos + `CampingParceiroService` (Angular)

**Repo:** `o-campista`

**Files:**
- Create: `src/app/core/models/camping-parceiro.model.ts`
- Create: `src/app/core/services/camping-parceiro.service.ts`
- Create: `src/app/core/services/camping-parceiro.service.spec.ts`

**Interfaces:**
- Produces: tipos e métodos abaixo, usados pelas Tasks 8 e 9.

- [ ] **Step 1: Modelos**

`src/app/core/models/camping-parceiro.model.ts`:

```ts
import { StatusOcupacao } from './camping.model';

export type TipoCampingComDono = 'camping' | 'pesca';
export type DonoStatus = 'pendente' | 'aprovado';

export interface CampingParceiro {
  id: number;
  nome: string;
  tipo: string;
  cidade: string;
  estado: string;
  latitude: number;
  longitude: number;
  ativo: boolean;
  donoStatus: DonoStatus;
  criadoEm: string;
}

export interface CampingParceiroRequest {
  nome: string;
  tipo: TipoCampingComDono;
  descricao?: string;
  endereco?: string;
  cidade: string;
  estado: string;
  telefone?: string;
  latitude: number;
  longitude: number;
  recursosIds: number[];
}

export interface CampingProximo {
  id: number;
  nome: string;
  tipo: string;
  cidade: string;
  estado: string;
  distanciaMetros: number;
}

export interface CheckinsDia {
  data: string;
  quantidade: number;
}

export interface CampingPainel {
  campingId: number;
  checkins30Dias: number;
  checkinsTotal: number;
  visitantesUnicos: number;
  avaliacaoMedia: number;
  totalAvaliacoes: number;
  totalFavoritos: number;
  statusOcupacao: StatusOcupacao | null;
  checkinsPorDia: CheckinsDia[];
}

export interface Recurso {
  id: number;
  nome: string;
}
```

Confirmar que `StatusOcupacao` é exportado de `src/app/core/models/camping.model.ts` (o CLAUDE.md diz que sim); se o nome for diferente, ajustar o import.

- [ ] **Step 2: Teste do serviço**

`src/app/core/services/camping-parceiro.service.spec.ts`:

```ts
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { CampingParceiroService } from './camping-parceiro.service';

describe('CampingParceiroService', () => {
  let service: CampingParceiroService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/campings/parceiros`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CampingParceiroService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('criar faz POST com o payload', () => {
    const payload = {
      nome: 'Camping X',
      tipo: 'camping' as const,
      cidade: 'São Carlos',
      estado: 'SP',
      latitude: -22,
      longitude: -47,
      recursosIds: [1, 2],
    };
    service.criar(payload).subscribe();
    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('reivindicar faz POST no id', () => {
    service.reivindicar(7).subscribe();
    const req = http.expectOne(`${base}/7/reivindicar`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('listarMeus faz GET em /meus', () => {
    service.listarMeus().subscribe();
    http.expectOne(`${base}/meus`).flush([]);
  });

  it('obterPainel faz GET em /{id}/painel', () => {
    service.obterPainel(3).subscribe();
    http.expectOne(`${base}/3/painel`).flush({});
  });

  it('buscarProximos envia lat e lng como query', () => {
    service.buscarProximos(-22.5, -47.25).subscribe();
    const req = http.expectOne((r) => r.url === `${base}/proximos`);
    expect(req.request.params.get('lat')).toBe('-22.5');
    expect(req.request.params.get('lng')).toBe('-47.25');
    req.flush([]);
  });

  it('listarRecursos faz GET em /recursos', () => {
    service.listarRecursos().subscribe();
    http.expectOne(`${environment.apiUrl}/recursos`).flush([]);
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx ng test --include src/app/core/services/camping-parceiro.service.spec.ts`
Expected: FAIL — módulo `camping-parceiro.service` não existe.

- [ ] **Step 4: Serviço**

`src/app/core/services/camping-parceiro.service.ts`:

```ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CampingPainel,
  CampingParceiro,
  CampingParceiroRequest,
  CampingProximo,
  Recurso,
} from '../models/camping-parceiro.model';

@Injectable({
  providedIn: 'root',
})
export class CampingParceiroService {
  private http = inject(HttpClient);

  private apiUrl = environment.apiUrl;
  private baseUrl = `${this.apiUrl}/campings/parceiros`;

  criar(request: CampingParceiroRequest): Observable<CampingParceiro> {
    return this.http.post<CampingParceiro>(this.baseUrl, request);
  }

  reivindicar(campingId: number): Observable<CampingParceiro> {
    return this.http.post<CampingParceiro>(`${this.baseUrl}/${campingId}/reivindicar`, {});
  }

  listarMeus(): Observable<CampingParceiro[]> {
    return this.http.get<CampingParceiro[]>(`${this.baseUrl}/meus`);
  }

  obterPainel(campingId: number): Observable<CampingPainel> {
    return this.http.get<CampingPainel>(`${this.baseUrl}/${campingId}/painel`);
  }

  buscarProximos(lat: number, lng: number): Observable<CampingProximo[]> {
    return this.http.get<CampingProximo[]>(`${this.baseUrl}/proximos`, {
      params: { lat: String(lat), lng: String(lng) },
    });
  }

  listarRecursos(): Observable<Recurso[]> {
    return this.http.get<Recurso[]>(`${this.apiUrl}/recursos`);
  }
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx ng test --include src/app/core/services/camping-parceiro.service.spec.ts`
Expected: PASS (6 testes).

- [ ] **Step 6: Prettier + commit** (quando liberado)

```bash
npx prettier --write src/app/core/models/camping-parceiro.model.ts src/app/core/services/camping-parceiro.service*.ts
git add src/app/core/models/camping-parceiro.model.ts src/app/core/services/camping-parceiro.service*.ts
git commit -m "feat(parceiros): modelos e serviço HTTP de campings parceiros"
```

---

### Task 8: `CadastrarCampingComponent` (wizard posição → dados) + rota + i18n

**Repo:** `o-campista`

**Files:**
- Create: `src/app/pages/parceiros/cadastrar-camping/cadastrar-camping.component.ts`, `.html`, `.scss`, `.spec.ts`
- Modify: `src/app/app.routes.ts` (dentro de `children` do layout autenticado)
- Modify: `public/i18n/pt-BR.json`, `public/i18n/en-US.json`

**Interfaces:**
- Consumes: `CampingParceiroService` (Task 7), `LocationService.getCurrentPosition(): Observable<{latitude, longitude}>`, `ToastService.success/error(chave)`, `environment.idMaps`, script do Google Maps já carregado em `main.ts` (`libraries=marker`).
- Produces: rota `/parceiros/cadastrar`; chaves i18n `parceiro.cadastro.*`.

- [ ] **Step 1: Chaves i18n**

Adicionar em `public/i18n/pt-BR.json`:

```json
  "parceiro.cadastro.title": "Cadastrar meu camping",
  "parceiro.cadastro.back": "Voltar",
  "parceiro.cadastro.step-position": "Passo 1 de 2 — Onde fica?",
  "parceiro.cadastro.step-data": "Passo 2 de 2 — Dados do camping",
  "parceiro.cadastro.position-hint": "Arraste o marcador até a entrada do camping.",
  "parceiro.cadastro.use-my-position": "Usar minha posição",
  "parceiro.cadastro.map-label": "Mapa para marcar a posição do camping",
  "parceiro.cadastro.nearby-title": "Algum destes já é o seu?",
  "parceiro.cadastro.nearby-hint": "Encontramos campings sem dono perto daqui. Reivindique em vez de criar um duplicado.",
  "parceiro.cadastro.nearby-distance": "m de distância",
  "parceiro.cadastro.claim": "Este é o meu",
  "parceiro.cadastro.claimed": "Reivindicação enviada! Vamos analisar e avisar você.",
  "parceiro.cadastro.claim-conflict": "Este camping já tem um dono vinculado.",
  "parceiro.cadastro.continue": "Continuar",
  "parceiro.cadastro.name": "Nome do camping",
  "parceiro.cadastro.type": "Tipo",
  "parceiro.cadastro.type-camping": "Camping",
  "parceiro.cadastro.type-pesca": "Pesqueiro",
  "parceiro.cadastro.city": "Cidade",
  "parceiro.cadastro.state": "Estado",
  "parceiro.cadastro.state-placeholder": "UF",
  "parceiro.cadastro.description": "Descrição",
  "parceiro.cadastro.address": "Endereço",
  "parceiro.cadastro.phone": "Telefone / WhatsApp",
  "parceiro.cadastro.resources": "Recursos disponíveis",
  "parceiro.cadastro.required": "Campo obrigatório",
  "parceiro.cadastro.submit": "Enviar para análise",
  "parceiro.cadastro.created": "Camping enviado! Ele aparece no mapa depois da aprovação.",
  "parceiro.cadastro.error": "Não foi possível enviar. Tente novamente.",
```

E em `public/i18n/en-US.json`:

```json
  "parceiro.cadastro.title": "Register my campsite",
  "parceiro.cadastro.back": "Back",
  "parceiro.cadastro.step-position": "Step 1 of 2 — Where is it?",
  "parceiro.cadastro.step-data": "Step 2 of 2 — Campsite details",
  "parceiro.cadastro.position-hint": "Drag the marker to the campsite entrance.",
  "parceiro.cadastro.use-my-position": "Use my position",
  "parceiro.cadastro.map-label": "Map to mark the campsite position",
  "parceiro.cadastro.nearby-title": "Is one of these yours?",
  "parceiro.cadastro.nearby-hint": "We found unclaimed campsites nearby. Claim one instead of creating a duplicate.",
  "parceiro.cadastro.nearby-distance": "m away",
  "parceiro.cadastro.claim": "This is mine",
  "parceiro.cadastro.claimed": "Claim sent! We'll review it and let you know.",
  "parceiro.cadastro.claim-conflict": "This campsite already has an owner.",
  "parceiro.cadastro.continue": "Continue",
  "parceiro.cadastro.name": "Campsite name",
  "parceiro.cadastro.type": "Type",
  "parceiro.cadastro.type-camping": "Campsite",
  "parceiro.cadastro.type-pesca": "Fishing spot",
  "parceiro.cadastro.city": "City",
  "parceiro.cadastro.state": "State",
  "parceiro.cadastro.state-placeholder": "State",
  "parceiro.cadastro.description": "Description",
  "parceiro.cadastro.address": "Address",
  "parceiro.cadastro.phone": "Phone / WhatsApp",
  "parceiro.cadastro.resources": "Available resources",
  "parceiro.cadastro.required": "Required field",
  "parceiro.cadastro.submit": "Send for review",
  "parceiro.cadastro.created": "Campsite sent! It shows on the map after approval.",
  "parceiro.cadastro.error": "Could not send. Please try again.",
```

- [ ] **Step 2: Teste do componente**

`src/app/pages/parceiros/cadastrar-camping/cadastrar-camping.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CampingParceiroService } from '../../../core/services/camping-parceiro.service';
import { LocationService } from '../../../core/services/location.service';
import { ToastService } from '../../../core/services/toast.service';
import { CadastrarCampingComponent } from './cadastrar-camping.component';

describe('CadastrarCampingComponent', () => {
  let fixture: ComponentFixture<CadastrarCampingComponent>;
  let component: CadastrarCampingComponent;
  const service = {
    criar: vi.fn(),
    reivindicar: vi.fn(),
    buscarProximos: vi.fn(() => of([])),
    listarRecursos: vi.fn(() => of([{ id: 1, nome: 'Banheiro' }])),
  };
  const toast = { success: vi.fn(), error: vi.fn() };
  const router = { navigate: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [CadastrarCampingComponent],
      providers: [
        { provide: CampingParceiroService, useValue: service },
        { provide: ToastService, useValue: toast },
        { provide: Router, useValue: router },
        {
          provide: LocationService,
          useValue: { getCurrentPosition: () => of({ latitude: -22.0174, longitude: -47.8903 }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CadastrarCampingComponent);
    component = fixture.componentInstance;
    // O mapa Google não existe no jsdom: o componente só o cria quando `google` está definido.
  });

  it('começa no passo de posição', () => {
    expect(component.passo()).toBe('posicao');
  });

  it('não avança sem posição marcada', () => {
    component.posicao.set(null);
    component.continuar();
    expect(component.passo()).toBe('posicao');
  });

  it('avança para dados com posição marcada', () => {
    component.posicao.set({ lat: -22, lng: -47 });
    component.continuar();
    expect(component.passo()).toBe('dados');
  });

  it('reivindicar chama o serviço e navega para /parceiros', () => {
    service.reivindicar.mockReturnValue(of({ id: 5 }));
    component.reivindicar(5);
    expect(service.reivindicar).toHaveBeenCalledWith(5);
    expect(toast.success).toHaveBeenCalledWith('parceiro.cadastro.claimed');
    expect(router.navigate).toHaveBeenCalledWith(['/parceiros']);
  });

  it('reivindicar com 409 mostra erro de conflito', () => {
    service.reivindicar.mockReturnValue(throwError(() => ({ status: 409 })));
    component.reivindicar(5);
    expect(toast.error).toHaveBeenCalledWith('parceiro.cadastro.claim-conflict');
  });

  it('não envia formulário inválido', () => {
    component.posicao.set({ lat: -22, lng: -47 });
    component.continuar();
    component.enviar();
    expect(service.criar).not.toHaveBeenCalled();
  });

  it('envia com posição e recursos selecionados', () => {
    service.criar.mockReturnValue(of({ id: 9 }));
    component.posicao.set({ lat: -22, lng: -47 });
    component.continuar();
    component.form.patchValue({ nome: 'Camping X', tipo: 'pesca', cidade: 'Rio Claro', estado: 'SP' });
    component.alternarRecurso(1);
    component.enviar();
    expect(service.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: 'Camping X',
        tipo: 'pesca',
        latitude: -22,
        longitude: -47,
        recursosIds: [1],
      }),
    );
    expect(toast.success).toHaveBeenCalledWith('parceiro.cadastro.created');
    expect(router.navigate).toHaveBeenCalledWith(['/parceiros']);
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx ng test --include src/app/pages/parceiros/cadastrar-camping/cadastrar-camping.component.spec.ts`
Expected: FAIL — componente não existe.

- [ ] **Step 4: Componente (TS)**

`cadastrar-camping.component.ts`:

```ts
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CampingProximo,
  Recurso,
  TipoCampingComDono,
} from '../../../core/models/camping-parceiro.model';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { CampingParceiroService } from '../../../core/services/camping-parceiro.service';
import { LocationService } from '../../../core/services/location.service';
import { ToastService } from '../../../core/services/toast.service';

type Passo = 'posicao' | 'dados';

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

@Component({
  selector: 'app-cadastrar-camping',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './cadastrar-camping.component.html',
  styleUrl: './cadastrar-camping.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CadastrarCampingComponent implements AfterViewInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private service = inject(CampingParceiroService);
  private location = inject(LocationService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  private mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');
  private map?: google.maps.Map;
  private marker?: google.maps.marker.AdvancedMarkerElement;
  private posicaoAlterada$ = new Subject<google.maps.LatLngLiteral>();

  readonly ufs = UFS;
  readonly tipos: TipoCampingComDono[] = ['camping', 'pesca'];

  passo = signal<Passo>('posicao');
  posicao = signal<google.maps.LatLngLiteral | null>(null);
  proximos = signal<CampingProximo[]>([]);
  recursos = signal<Recurso[]>([]);
  recursosSelecionados = signal<Set<number>>(new Set());
  enviando = signal(false);

  podeContinuar = computed(() => this.posicao() !== null);

  form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(200)]],
    tipo: ['camping' as TipoCampingComDono, [Validators.required]],
    cidade: ['', [Validators.required, Validators.maxLength(100)]],
    estado: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}$/)]],
    descricao: ['', [Validators.maxLength(2000)]],
    endereco: ['', [Validators.maxLength(500)]],
    telefone: ['', [Validators.maxLength(30)]],
  });

  constructor() {
    this.posicaoAlterada$
      .pipe(
        debounceTime(400),
        switchMap((p) => this.service.buscarProximos(p.lat, p.lng)),
        takeUntilDestroyed(),
      )
      .subscribe({ next: (lista) => this.proximos.set(lista), error: () => this.proximos.set([]) });

    this.service
      .listarRecursos()
      .pipe(takeUntilDestroyed())
      .subscribe({ next: (lista) => this.recursos.set(lista) });
  }

  ngAfterViewInit(): void {
    this.location
      .getCurrentPosition()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((pos) => this.definirPosicao({ lat: pos.latitude, lng: pos.longitude }, true));
  }

  usarMinhaPosicao(): void {
    this.location
      .getCurrentPosition()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((pos) => this.definirPosicao({ lat: pos.latitude, lng: pos.longitude }, true));
  }

  continuar(): void {
    if (!this.podeContinuar()) return;
    this.passo.set('dados');
  }

  voltarPasso(): void {
    this.passo.set('posicao');
  }

  voltar(): void {
    this.router.navigate(['/parceiros']);
  }

  reivindicar(campingId: number): void {
    this.service.reivindicar(campingId).subscribe({
      next: () => {
        this.toast.success('parceiro.cadastro.claimed');
        this.router.navigate(['/parceiros']);
      },
      error: (err: { status?: number }) =>
        this.toast.error(
          err.status === 409 ? 'parceiro.cadastro.claim-conflict' : 'parceiro.cadastro.error',
        ),
    });
  }

  alternarRecurso(id: number): void {
    this.recursosSelecionados.update((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  recursoSelecionado(id: number): boolean {
    return this.recursosSelecionados().has(id);
  }

  enviar(): void {
    const posicao = this.posicao();
    if (this.form.invalid || !posicao) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.enviando()) return;
    this.enviando.set(true);

    const v = this.form.getRawValue();
    this.service
      .criar({
        nome: v.nome.trim(),
        tipo: v.tipo,
        cidade: v.cidade.trim(),
        estado: v.estado,
        descricao: v.descricao.trim() || undefined,
        endereco: v.endereco.trim() || undefined,
        telefone: v.telefone.trim() || undefined,
        latitude: posicao.lat,
        longitude: posicao.lng,
        recursosIds: [...this.recursosSelecionados()],
      })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.toast.success('parceiro.cadastro.created');
          this.router.navigate(['/parceiros']);
        },
        error: () => {
          this.enviando.set(false);
          this.toast.error('parceiro.cadastro.error');
        },
      });
  }

  campoInvalido(nome: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[nome];
    return c.invalid && c.touched;
  }

  /** Centraliza o mapa e o marcador; cria o mapa na primeira chamada (só fora de testes/jsdom). */
  private definirPosicao(p: google.maps.LatLngLiteral, centralizar: boolean): void {
    this.posicao.set(p);
    this.posicaoAlterada$.next(p);

    const container = this.mapContainer()?.nativeElement;
    if (!container || typeof google === 'undefined') return;

    if (!this.map) {
      this.map = new google.maps.Map(container, { center: p, zoom: 15, mapId: environment.idMaps });
      this.marker = new google.maps.marker.AdvancedMarkerElement({
        map: this.map,
        position: p,
        gmpDraggable: true,
      });
      this.marker.addListener('dragend', () => {
        const pos = this.marker?.position as google.maps.LatLngLiteral | undefined;
        if (pos) this.definirPosicao({ lat: Number(pos.lat), lng: Number(pos.lng) }, false);
      });
      this.map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) this.definirPosicao(e.latLng.toJSON(), false);
      });
      return;
    }

    if (this.marker) this.marker.position = p;
    if (centralizar) this.map.panTo(p);
  }
}
```

- [ ] **Step 5: Template**

`cadastrar-camping.component.html`:

```html
<div class="cadastro-page">
  <header class="cadastro-header">
    <button
      type="button"
      class="btn-close-round btn-close-round--light"
      (click)="passo() === 'dados' ? voltarPasso() : voltar()"
      [attr.aria-label]="'parceiro.cadastro.back' | translate"
    >
      ←
    </button>
    <h1 class="cadastro-title">{{ 'parceiro.cadastro.title' | translate }}</h1>
  </header>

  <p class="cadastro-step" aria-live="polite">
    {{
      (passo() === 'posicao' ? 'parceiro.cadastro.step-position' : 'parceiro.cadastro.step-data')
        | translate
    }}
  </p>

  <section class="passo-posicao" [hidden]="passo() !== 'posicao'">
    <p class="hint">{{ 'parceiro.cadastro.position-hint' | translate }}</p>
    <div
      #mapContainer
      class="mapa-picker"
      role="application"
      [attr.aria-label]="'parceiro.cadastro.map-label' | translate"
    ></div>

    <div class="posicao-acoes">
      <button type="button" class="btn-secundario" (click)="usarMinhaPosicao()">
        📍 {{ 'parceiro.cadastro.use-my-position' | translate }}
      </button>
      <button type="button" class="btn-primario" [disabled]="!podeContinuar()" (click)="continuar()">
        {{ 'parceiro.cadastro.continue' | translate }} →
      </button>
    </div>

    @if (proximos().length > 0) {
      <div class="proximos card-elevated">
        <h2 class="proximos-title">{{ 'parceiro.cadastro.nearby-title' | translate }}</h2>
        <p class="hint">{{ 'parceiro.cadastro.nearby-hint' | translate }}</p>
        <ul class="proximos-lista">
          @for (c of proximos(); track c.id) {
            <li class="proximo-item">
              <div>
                <strong>{{ c.nome }}</strong>
                <small>
                  {{ c.cidade }}/{{ c.estado }} · {{ c.distanciaMetros }}
                  {{ 'parceiro.cadastro.nearby-distance' | translate }}
                </small>
              </div>
              <button type="button" class="btn-secundario btn-sm" (click)="reivindicar(c.id)">
                {{ 'parceiro.cadastro.claim' | translate }}
              </button>
            </li>
          }
        </ul>
      </div>
    }
  </section>

  @if (passo() === 'dados') {
    <form class="passo-dados" [formGroup]="form" (ngSubmit)="enviar()">
      <label class="campo">
        <span class="campo-label">{{ 'parceiro.cadastro.name' | translate }} *</span>
        <input type="text" formControlName="nome" maxlength="200" aria-describedby="erro-nome" />
        @if (campoInvalido('nome')) {
          <span class="field-error" id="erro-nome">{{ 'parceiro.cadastro.required' | translate }}</span>
        }
      </label>

      <fieldset class="campo">
        <legend class="campo-label">{{ 'parceiro.cadastro.type' | translate }} *</legend>
        <div class="tipo-opcoes">
          @for (t of tipos; track t) {
            <label class="tipo-opcao" [class.ativo]="form.controls.tipo.value === t">
              <input type="radio" formControlName="tipo" [value]="t" />
              {{ t === 'camping' ? '🏕️' : '🎣' }}
              {{ 'parceiro.cadastro.type-' + t | translate }}
            </label>
          }
        </div>
      </fieldset>

      <div class="campo-linha">
        <label class="campo campo--cresce">
          <span class="campo-label">{{ 'parceiro.cadastro.city' | translate }} *</span>
          <input type="text" formControlName="cidade" maxlength="100" aria-describedby="erro-cidade" />
          @if (campoInvalido('cidade')) {
            <span class="field-error" id="erro-cidade">{{ 'parceiro.cadastro.required' | translate }}</span>
          }
        </label>
        <label class="campo campo--uf">
          <span class="campo-label">{{ 'parceiro.cadastro.state' | translate }} *</span>
          <select formControlName="estado" aria-describedby="erro-estado">
            <option value="" disabled>{{ 'parceiro.cadastro.state-placeholder' | translate }}</option>
            @for (uf of ufs; track uf) {
              <option [value]="uf">{{ uf }}</option>
            }
          </select>
          @if (campoInvalido('estado')) {
            <span class="field-error" id="erro-estado">{{ 'parceiro.cadastro.required' | translate }}</span>
          }
        </label>
      </div>

      <label class="campo">
        <span class="campo-label">{{ 'parceiro.cadastro.description' | translate }}</span>
        <textarea formControlName="descricao" rows="4" maxlength="2000"></textarea>
      </label>

      <label class="campo">
        <span class="campo-label">{{ 'parceiro.cadastro.address' | translate }}</span>
        <input type="text" formControlName="endereco" maxlength="500" />
      </label>

      <label class="campo">
        <span class="campo-label">{{ 'parceiro.cadastro.phone' | translate }}</span>
        <input type="tel" formControlName="telefone" maxlength="30" />
      </label>

      @if (recursos().length > 0) {
        <fieldset class="campo">
          <legend class="campo-label">{{ 'parceiro.cadastro.resources' | translate }}</legend>
          <div class="recursos-grid">
            @for (r of recursos(); track r.id) {
              <label class="recurso-chip" [class.ativo]="recursoSelecionado(r.id)">
                <input type="checkbox" [checked]="recursoSelecionado(r.id)" (change)="alternarRecurso(r.id)" />
                {{ r.nome }}
              </label>
            }
          </div>
        </fieldset>
      }

      <button type="submit" class="btn-primario btn-enviar" [disabled]="enviando()">
        {{ 'parceiro.cadastro.submit' | translate }}
      </button>
    </form>
  }
</div>
```

- [ ] **Step 6: Estilos**

`cadastrar-camping.component.scss` — seguir o skill `design-system` (tokens de `src/styles.scss`). Mínimo necessário:

```scss
.cadastro-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cadastro-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cadastro-title {
  font-size: 1.4rem;
  margin: 0;
}

.cadastro-step {
  margin: 0;
  color: var(--text-muted);
  font-weight: 600;
}

.hint {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.mapa-picker {
  width: 100%;
  height: 320px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--surface);
}

.posicao-acoes,
.campo-linha {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.campo--cresce {
  flex: 1 1 200px;
}

.campo--uf {
  flex: 0 0 110px;
}

.passo-dados,
.passo-posicao {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 0;
  padding: 0;
  margin: 0;

  input,
  select,
  textarea {
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--text);
    font: inherit;
  }
}

.campo-label {
  font-weight: 700;
}

.field-error {
  color: var(--danger);
  font-size: 0.85rem;
}

.tipo-opcoes,
.recursos-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tipo-opcao,
.recurso-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  cursor: pointer;

  input {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
  }

  &.ativo {
    border-color: var(--primary);
    background: var(--primary-soft);
    font-weight: 700;
  }

  &:focus-within {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
}

.proximos {
  padding: 16px;
}

.proximos-title {
  margin: 0 0 4px;
  font-size: 1.1rem;
}

.proximos-lista {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.proximo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  small {
    display: block;
    color: var(--text-muted);
  }
}

.btn-primario,
.btn-secundario {
  padding: 12px 18px;
  border-radius: var(--radius-md);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-primario {
  background: var(--primary);
  color: #fff;
}

.btn-secundario {
  background: var(--surface);
  border-color: var(--border);
  color: var(--text);
}

.btn-sm {
  padding: 8px 12px;
}

.btn-enviar {
  align-self: flex-end;
}
```

Se algum token acima (`--text-muted`, `--primary-soft`, `--danger`, `--radius-md`, `--radius-lg`, `--surface`, `--border`, `--primary`) não existir em `src/styles.scss`, usar o nome equivalente que existir lá — não inventar cor hardcoded.

- [ ] **Step 7: Rota**

Em `src/app/app.routes.ts`, dentro de `children` do layout autenticado (após a rota `gift`):

```ts
      {
        path: 'parceiros/cadastrar',
        loadComponent: () =>
          import('./pages/parceiros/cadastrar-camping/cadastrar-camping.component').then(
            (m) => m.CadastrarCampingComponent,
          ),
      },
```

- [ ] **Step 8: Rodar testes**

Run: `npx ng test --include src/app/pages/parceiros/cadastrar-camping/cadastrar-camping.component.spec.ts`
Expected: PASS (7 testes).

- [ ] **Step 9: Verificar no navegador**

`npm start`, abrir `/parceiros/cadastrar`: mapa aparece centrado na posição; arrastar o marcador atualiza `proximos` (se houver seed sem dono no raio, a lista aparece); "Continuar" desabilitado até haver posição; passo 2 valida obrigatórios; envio mostra toast e navega. Testar também com a API desligada → toast de erro. Dark mode e largura 375px.

- [ ] **Step 10: Prettier + commit** (quando liberado)

```bash
npx prettier --write src/app/pages/parceiros src/app/app.routes.ts public/i18n
git add src/app/pages/parceiros src/app/app.routes.ts public/i18n
git commit -m "feat(parceiros): formulário de cadastro/reivindicação de camping"
```

---

### Task 9: `MeuCampingComponent` (painel) + menu + i18n

**Repo:** `o-campista`

**Files:**
- Create: `src/app/pages/parceiros/meu-camping/meu-camping.component.ts`, `.html`, `.scss`, `.spec.ts`
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/components/app-menu/app-menu.component.html` (após o item `checklist`)
- Modify: `public/i18n/pt-BR.json`, `public/i18n/en-US.json`

**Interfaces:**
- Consumes: `CampingParceiroService.listarMeus/obterPainel`, tipos `CampingParceiro`, `CampingPainel`.
- Produces: rota `/parceiros`; item de menu `nav.partner`.

- [ ] **Step 1: Chaves i18n**

`pt-BR.json`:

```json
  "nav.partner": "Meu camping",
  "parceiro.meu-camping.title": "Meu camping",
  "parceiro.meu-camping.empty-title": "Você ainda não cadastrou um camping",
  "parceiro.meu-camping.empty-text": "Cadastre seu camping ou pesqueiro e acompanhe as visitas pelo app.",
  "parceiro.meu-camping.register": "Cadastrar meu camping",
  "parceiro.meu-camping.register-another": "Cadastrar outro camping",
  "parceiro.meu-camping.status-pendente": "Em análise",
  "parceiro.meu-camping.status-aprovado": "Aprovado",
  "parceiro.meu-camping.pending-notice": "Seu camping está em análise e ainda não aparece no mapa. Avisamos quando for aprovado.",
  "parceiro.meu-camping.select-label": "Escolher camping",
  "parceiro.meu-camping.kpi-checkins-30": "Check-ins (30 dias)",
  "parceiro.meu-camping.kpi-checkins-total": "Check-ins no total",
  "parceiro.meu-camping.kpi-visitors": "Visitantes únicos",
  "parceiro.meu-camping.kpi-rating": "Avaliação média",
  "parceiro.meu-camping.kpi-ratings-count": "avaliações",
  "parceiro.meu-camping.kpi-favorites": "Favoritado por",
  "parceiro.meu-camping.kpi-occupancy": "Ocupação agora",
  "parceiro.meu-camping.occupancy-none": "Sem relatos nas últimas 6h",
  "parceiro.meu-camping.occupancy-tranquilo": "Tranquilo",
  "parceiro.meu-camping.occupancy-movimentado": "Movimentado",
  "parceiro.meu-camping.occupancy-lotado": "Lotado",
  "parceiro.meu-camping.chart-title": "Check-ins por dia (últimos 30 dias)",
  "parceiro.meu-camping.error": "Não foi possível carregar o painel.",
  "parceiro.meu-camping.retry": "Tentar novamente",
```

`en-US.json`:

```json
  "nav.partner": "My campsite",
  "parceiro.meu-camping.title": "My campsite",
  "parceiro.meu-camping.empty-title": "You haven't registered a campsite yet",
  "parceiro.meu-camping.empty-text": "Register your campsite or fishing spot and follow visits through the app.",
  "parceiro.meu-camping.register": "Register my campsite",
  "parceiro.meu-camping.register-another": "Register another campsite",
  "parceiro.meu-camping.status-pendente": "Under review",
  "parceiro.meu-camping.status-aprovado": "Approved",
  "parceiro.meu-camping.pending-notice": "Your campsite is under review and not on the map yet. We'll let you know once it's approved.",
  "parceiro.meu-camping.select-label": "Choose campsite",
  "parceiro.meu-camping.kpi-checkins-30": "Check-ins (30 days)",
  "parceiro.meu-camping.kpi-checkins-total": "Total check-ins",
  "parceiro.meu-camping.kpi-visitors": "Unique visitors",
  "parceiro.meu-camping.kpi-rating": "Average rating",
  "parceiro.meu-camping.kpi-ratings-count": "ratings",
  "parceiro.meu-camping.kpi-favorites": "Favorited by",
  "parceiro.meu-camping.kpi-occupancy": "Occupancy now",
  "parceiro.meu-camping.occupancy-none": "No reports in the last 6h",
  "parceiro.meu-camping.occupancy-tranquilo": "Quiet",
  "parceiro.meu-camping.occupancy-movimentado": "Busy",
  "parceiro.meu-camping.occupancy-lotado": "Full",
  "parceiro.meu-camping.chart-title": "Check-ins per day (last 30 days)",
  "parceiro.meu-camping.error": "Could not load the dashboard.",
  "parceiro.meu-camping.retry": "Try again",
```

- [ ] **Step 2: Teste**

`meu-camping.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CampingParceiro } from '../../../core/models/camping-parceiro.model';
import { CampingParceiroService } from '../../../core/services/camping-parceiro.service';
import { MeuCampingComponent } from './meu-camping.component';

const camping = (id: number, donoStatus: 'pendente' | 'aprovado'): CampingParceiro => ({
  id,
  nome: `Camping ${id}`,
  tipo: 'camping',
  cidade: 'X',
  estado: 'SP',
  latitude: 0,
  longitude: 0,
  ativo: donoStatus === 'aprovado',
  donoStatus,
  criadoEm: '2026-09-01T00:00:00Z',
});

const painel = (campingId: number) => ({
  campingId,
  checkins30Dias: 4,
  checkinsTotal: 10,
  visitantesUnicos: 7,
  avaliacaoMedia: 4.5,
  totalAvaliacoes: 3,
  totalFavoritos: 2,
  statusOcupacao: null,
  checkinsPorDia: Array.from({ length: 30 }, (_, i) => ({ data: `2026-08-${i + 1}`, quantidade: i % 3 })),
});

describe('MeuCampingComponent', () => {
  let fixture: ComponentFixture<MeuCampingComponent>;
  let component: MeuCampingComponent;
  const service = { listarMeus: vi.fn(), obterPainel: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [MeuCampingComponent],
      providers: [{ provide: CampingParceiroService, useValue: service }],
    }).compileComponents();
  });

  function criar() {
    fixture = TestBed.createComponent(MeuCampingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('mostra estado vazio sem campings', () => {
    service.listarMeus.mockReturnValue(of([]));
    criar();
    expect(component.campings()).toEqual([]);
    expect(component.painel()).toBeNull();
    expect(service.obterPainel).not.toHaveBeenCalled();
  });

  it('seleciona o primeiro camping e carrega o painel', () => {
    service.listarMeus.mockReturnValue(of([camping(1, 'pendente'), camping(2, 'aprovado')]));
    service.obterPainel.mockImplementation((id: number) => of(painel(id)));
    criar();
    expect(component.selecionado()?.id).toBe(1);
    expect(service.obterPainel).toHaveBeenCalledWith(1);
    expect(component.painel()?.checkins30Dias).toBe(4);
  });

  it('trocar de camping recarrega o painel', () => {
    service.listarMeus.mockReturnValue(of([camping(1, 'pendente'), camping(2, 'aprovado')]));
    service.obterPainel.mockImplementation((id: number) => of(painel(id)));
    criar();
    component.selecionar(2);
    expect(service.obterPainel).toHaveBeenLastCalledWith(2);
    expect(component.painel()?.campingId).toBe(2);
  });

  it('marca erro quando o painel falha', () => {
    service.listarMeus.mockReturnValue(of([camping(1, 'aprovado')]));
    service.obterPainel.mockReturnValue(throwError(() => new Error('x')));
    criar();
    expect(component.erro()).toBe(true);
  });

  it('calcula a altura das barras proporcional ao máximo', () => {
    service.listarMeus.mockReturnValue(of([camping(1, 'aprovado')]));
    service.obterPainel.mockReturnValue(of(painel(1)));
    criar();
    const barras = component.barras();
    expect(barras.length).toBe(30);
    expect(Math.max(...barras.map((b) => b.altura))).toBe(100);
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx ng test --include src/app/pages/parceiros/meu-camping/meu-camping.component.spec.ts`
Expected: FAIL — componente não existe.

- [ ] **Step 4: Componente (TS)**

`meu-camping.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CampingPainel, CampingParceiro } from '../../../core/models/camping-parceiro.model';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { CampingParceiroService } from '../../../core/services/camping-parceiro.service';

interface Barra {
  data: string;
  quantidade: number;
  /** 0–100, relativo ao maior dia do período. */
  altura: number;
}

@Component({
  selector: 'app-meu-camping',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './meu-camping.component.html',
  styleUrl: './meu-camping.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeuCampingComponent {
  private service = inject(CampingParceiroService);

  campings = signal<CampingParceiro[]>([]);
  selecionado = signal<CampingParceiro | null>(null);
  painel = signal<CampingPainel | null>(null);
  carregando = signal(true);
  erro = signal(false);

  barras = computed<Barra[]>(() => {
    const dias = this.painel()?.checkinsPorDia ?? [];
    const maximo = Math.max(1, ...dias.map((d) => d.quantidade));
    return dias.map((d) => ({
      data: d.data,
      quantidade: d.quantidade,
      altura: Math.round((d.quantidade / maximo) * 100),
    }));
  });

  constructor() {
    this.service
      .listarMeus()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (lista) => {
          this.campings.set(lista);
          this.carregando.set(false);
          if (lista.length > 0) this.selecionar(lista[0].id);
        },
        error: () => {
          this.carregando.set(false);
          this.erro.set(true);
        },
      });
  }

  selecionar(id: number): void {
    const camping = this.campings().find((c) => c.id === id) ?? null;
    this.selecionado.set(camping);
    this.painel.set(null);
    this.erro.set(false);
    if (!camping) return;

    this.service.obterPainel(id).subscribe({
      next: (p) => this.painel.set(p),
      error: () => this.erro.set(true),
    });
  }

  recarregar(): void {
    const atual = this.selecionado();
    if (atual) this.selecionar(atual.id);
  }

  diaCurto(data: string): string {
    return data.slice(8, 10);
  }
}
```

- [ ] **Step 5: Template**

`meu-camping.component.html`:

```html
<div class="meu-camping-page">
  <header class="page-header">
    <h1>{{ 'parceiro.meu-camping.title' | translate }}</h1>
    @if (campings().length > 0) {
      <a class="btn-secundario" routerLink="/parceiros/cadastrar">
        + {{ 'parceiro.meu-camping.register-another' | translate }}
      </a>
    }
  </header>

  @if (carregando()) {
    <p class="hint" aria-live="polite">…</p>
  } @else if (campings().length === 0) {
    <section class="empty card-elevated">
      <p class="empty-emoji" aria-hidden="true">🏕️</p>
      <h2>{{ 'parceiro.meu-camping.empty-title' | translate }}</h2>
      <p>{{ 'parceiro.meu-camping.empty-text' | translate }}</p>
      <a class="btn-primario" routerLink="/parceiros/cadastrar">
        {{ 'parceiro.meu-camping.register' | translate }}
      </a>
    </section>
  } @else {
    @if (campings().length > 1) {
      <div class="chips" role="tablist" [attr.aria-label]="'parceiro.meu-camping.select-label' | translate">
        @for (c of campings(); track c.id) {
          <button
            type="button"
            role="tab"
            class="chip"
            [class.ativo]="selecionado()?.id === c.id"
            [attr.aria-selected]="selecionado()?.id === c.id"
            (click)="selecionar(c.id)"
          >
            {{ c.nome }}
          </button>
        }
      </div>
    }

    @if (selecionado(); as camping) {
      <section class="camping-head card-elevated">
        <div>
          <h2>{{ camping.nome }}</h2>
          <small>{{ camping.cidade }}/{{ camping.estado }}</small>
        </div>
        <span class="badge" [class.badge--pendente]="camping.donoStatus === 'pendente'" [class.badge--aprovado]="camping.donoStatus === 'aprovado'">
          {{ 'parceiro.meu-camping.status-' + camping.donoStatus | translate }}
        </span>
      </section>

      @if (camping.donoStatus === 'pendente') {
        <p class="aviso" role="status">{{ 'parceiro.meu-camping.pending-notice' | translate }}</p>
      }
    }

    @if (erro()) {
      <section class="erro card-elevated" role="alert">
        <p>{{ 'parceiro.meu-camping.error' | translate }}</p>
        <button type="button" class="btn-secundario" (click)="recarregar()">
          {{ 'parceiro.meu-camping.retry' | translate }}
        </button>
      </section>
    } @else if (painel(); as p) {
      <section class="kpis">
        <article class="kpi card-elevated">
          <span class="kpi-valor">{{ p.checkins30Dias }}</span>
          <span class="kpi-label">{{ 'parceiro.meu-camping.kpi-checkins-30' | translate }}</span>
        </article>
        <article class="kpi card-elevated">
          <span class="kpi-valor">{{ p.checkinsTotal }}</span>
          <span class="kpi-label">{{ 'parceiro.meu-camping.kpi-checkins-total' | translate }}</span>
        </article>
        <article class="kpi card-elevated">
          <span class="kpi-valor">{{ p.visitantesUnicos }}</span>
          <span class="kpi-label">{{ 'parceiro.meu-camping.kpi-visitors' | translate }}</span>
        </article>
        <article class="kpi card-elevated">
          <span class="kpi-valor">⭐ {{ p.avaliacaoMedia | number: '1.1-1' }}</span>
          <span class="kpi-label">
            {{ 'parceiro.meu-camping.kpi-rating' | translate }} · {{ p.totalAvaliacoes }}
            {{ 'parceiro.meu-camping.kpi-ratings-count' | translate }}
          </span>
        </article>
        <article class="kpi card-elevated">
          <span class="kpi-valor">❤️ {{ p.totalFavoritos }}</span>
          <span class="kpi-label">{{ 'parceiro.meu-camping.kpi-favorites' | translate }}</span>
        </article>
        <article class="kpi card-elevated">
          @if (p.statusOcupacao; as oc) {
            <span class="kpi-valor ocupacao" [class]="'ocupacao--' + oc.nivel">
              {{ 'parceiro.meu-camping.occupancy-' + oc.nivel | translate }}
            </span>
          } @else {
            <span class="kpi-valor kpi-valor--muted">—</span>
            <span class="kpi-sub">{{ 'parceiro.meu-camping.occupancy-none' | translate }}</span>
          }
          <span class="kpi-label">{{ 'parceiro.meu-camping.kpi-occupancy' | translate }}</span>
        </article>
      </section>

      <section class="grafico card-elevated">
        <h3>{{ 'parceiro.meu-camping.chart-title' | translate }}</h3>
        <svg viewBox="0 0 300 120" class="grafico-svg" role="img" [attr.aria-label]="'parceiro.meu-camping.chart-title' | translate">
          @for (b of barras(); track b.data; let i = $index) {
            <rect
              [attr.x]="i * 10 + 1"
              [attr.y]="100 - b.altura"
              width="8"
              [attr.height]="b.altura"
              rx="1"
              class="barra"
            >
              <title>{{ b.data }}: {{ b.quantidade }}</title>
            </rect>
            @if (i % 5 === 0) {
              <text [attr.x]="i * 10 + 5" y="114" text-anchor="middle" class="eixo">{{ diaCurto(b.data) }}</text>
            }
          }
        </svg>
      </section>
    }
  }
</div>
```

Adicionar `DecimalPipe` (de `@angular/common`) ao array `imports` do componente por causa do `| number`.

- [ ] **Step 6: Estilos**

`meu-camping.component.scss` (tokens do design system; ajustar nomes se necessário):

```scss
.meu-camping-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  h1 {
    margin: 0;
    font-size: 1.5rem;
  }
}

.hint {
  color: var(--text-muted);
}

.empty {
  text-align: center;
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  .empty-emoji {
    font-size: 3rem;
    margin: 0;
  }
}

.chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  cursor: pointer;

  &.ativo {
    border-color: var(--primary);
    background: var(--primary-soft);
    font-weight: 700;
  }
}

.camping-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;

  h2 {
    margin: 0;
    font-size: 1.2rem;
  }

  small {
    color: var(--text-muted);
  }
}

.badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;

  &--pendente {
    background: var(--warning-soft);
    color: var(--warning-text);
  }

  &--aprovado {
    background: var(--success-soft);
    color: var(--success-text);
  }
}

.aviso {
  margin: 0;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background: var(--warning-soft);
  color: var(--warning-text);
}

.erro {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.kpi {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kpi-valor {
  font-size: 1.6rem;
  font-weight: 800;

  &--muted {
    color: var(--text-muted);
  }
}

.kpi-sub {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.kpi-label {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.ocupacao--tranquilo {
  color: var(--success-text);
}

.ocupacao--movimentado {
  color: var(--warning-text);
}

.ocupacao--lotado {
  color: var(--danger);
}

.grafico {
  padding: 16px;

  h3 {
    margin: 0 0 12px;
    font-size: 1rem;
  }
}

.grafico-svg {
  width: 100%;
  height: auto;
}

.barra {
  fill: var(--primary);
}

.eixo {
  font-size: 8px;
  fill: var(--text-muted);
}

.btn-primario,
.btn-secundario {
  display: inline-block;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font: inherit;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-primario {
  background: var(--primary);
  color: #fff;
}

.btn-secundario {
  background: var(--surface);
  border-color: var(--border);
  color: var(--text);
}
```

Cores de badge/ocupação: se `src/styles.scss` não tiver `--warning-soft/--warning-text/--success-soft/--success-text`, usar os tokens que o `CardCampingComponent` já usa para o badge de ocupação (verde/laranja/vermelho) — procurar em `src/app/components/card-camping/card-camping.component.scss`.

- [ ] **Step 7: Rota e menu**

`app.routes.ts`, antes de `parceiros/cadastrar`:

```ts
      {
        path: 'parceiros',
        loadComponent: () =>
          import('./pages/parceiros/meu-camping/meu-camping.component').then(
            (m) => m.MeuCampingComponent,
          ),
      },
```

`app-menu.component.html`, logo após o botão `nav-checklist`:

```html
        <button
          class="menu-item"
          data-onboarding="nav-partner"
          [class.active]="isActive('parceiros')"
          (click)="navigateTo('parceiros')"
        >
          {{ 'nav.partner' | translate }}
        </button>
```

- [ ] **Step 8: Rodar testes**

Run: `npx ng test`
Expected: todos passam (guard, serviço, cadastrar, meu-camping).

- [ ] **Step 9: Verificar no navegador**

`/parceiros` sem campings → estado vazio com CTA. Após cadastrar (Task 8) → badge "Em análise", aviso, KPIs e gráfico com 30 barras. Aprovar por SQL (`update tb_camping set ativo = true, dono_status = 'aprovado' where id = ?`) e recarregar → badge "Aprovado", sem aviso. Dark mode e 375px. `npm run build` sem estourar o budget (initial < 500kB).

- [ ] **Step 10: Prettier + commit** (quando liberado)

```bash
npx prettier --write src/app/pages/parceiros src/app/app.routes.ts src/app/components/app-menu public/i18n
git add src/app/pages/parceiros src/app/app.routes.ts src/app/components/app-menu public/i18n
git commit -m "feat(parceiros): painel Meu camping e item de menu"
```

---

### Task 10: Documentação no `CLAUDE.md`

**Repo:** `o-campista`

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Atualizar o CLAUDE.md**

1. Tabela de **Controllers**: adicionar `| CampingParceiroController | api/campings/parceiros | Cadastro, reivindicação, listagem e painel de campings do dono |` e `| RecursoController | api/recursos | Lista recursos de camping |`.
2. Tabela de **Entidades**: na linha de `Camping`, acrescentar "`dono_usuario_id`/`dono_status` (`pendente`|`aprovado`) — vínculo com o dono".
3. **Scripts incrementais**: adicionar `- add_camping_dono.sql — colunas de dono em tb_camping`.
4. **Repositórios**: adicionar `RecursoRepository`. **Serviços**: adicionar `CampingParceiroService`.
5. **DTOs**: Requests `CampingParceiroRequest`; Responses `CampingParceiroResponse`, `CampingPainelResponse`, `CampingProximoResponse`, `RecursoResponse`.
6. **Estrutura de Pastas**: `├── parceiros/       # Cadastro de camping pelo dono + painel "Meu camping"`.
7. **Rotas**: `| /parceiros | MeuCampingComponent | Sim (authGuard) |` e `| /parceiros/cadastrar | CadastrarCampingComponent | Sim (authGuard) |`.
8. **Serviços e Endpoints**: linha `| **CampingParceiroService** | Cadastro/reivindicação de camping pelo dono, campings próximos sem dono, painel de visitação, recursos | POST /campings/parceiros, POST /campings/parceiros/{id}/reivindicar, GET /campings/parceiros/meus, GET /campings/parceiros/{id}/painel, GET /campings/parceiros/proximos?lat&lng, GET /recursos |`.
9. **Modelos Principais**: `- **CampingParceiro/CampingPainel/CampingProximo/Recurso** — camping do dono (donoStatus pendente|aprovado), métricas de 30 dias, campings sem dono no raio de 2 km`.
10. **Regras de Negócio**: adicionar
   - `- **Parceiros (dono de camping):** dono cadastra camping (tipo camping|pesca) que nasce com ativo=false e dono_status='pendente'; ou reivindica camping existente sem dono num raio de 2 km. Aprovação é manual via SQL no Supabase. GET /mapa/campings filtra ativo=true. Painel mostra check-ins (30 dias/total), visitantes únicos, avaliação, favoritos e ocupação`
   - `- **returnUrl:** authGuard redireciona para /?returnUrl=<destino>; login e registro navegam para lá após autenticar`
11. **Gerenciamento de Estado**: nada a acrescentar.

- [ ] **Step 2: Commit** (quando liberado)

```bash
git add CLAUDE.md
git commit -m "docs: documenta fluxo de parceiros no CLAUDE.md"
```

---

### Task 11: Landing `parceiros.html`

**Repo:** `o-campista.landing`

**Files:**
- Create: `parceiros.html`
- Modify: `assets/main.js` (constante `APP_URL`; guards nos handlers de `waitlist-form` e `copy-link`)
- Modify: `assets/styles.css` (seção `/* Parceiros */`)
- Modify: `index.html` (link "Para donos de camping" no `<nav>`)
- Modify: `README.md` (linha da tabela para `APP_URL`; menção à `parceiros.html`)

**Interfaces:**
- Consumes: classes existentes de `styles.css`: `site-header`, `container`, `brand`, `site-nav`, `header-actions`, `icon-btn`, `nav-toggle`, `btn btn--primary btn--sm`, `hero`, `section`, `section-head`, `eyebrow`, `promise-strip`, `features-grid`, `feature-card card-elevated reveal`, `phone-frame`, `phone-screen`, `mk-status`, `faq-list`, `site-footer`, `toast`, `reveal`.

- [ ] **Step 1: `main.js` — `APP_URL` e guards**

No topo de `assets/main.js`, após `FALLBACK_EMAIL`:

```js
/** URL pública do app (usada pelos CTAs da página de parceiros). */
const APP_URL = 'http://localhost:4200';
```

Após o bloco de tema, adicionar:

```js
/* --------------------------------------------------------- Links do app */

document.querySelectorAll('[data-app-path]').forEach((link) => {
  link.setAttribute('href', APP_URL.replace(/\/$/, '') + link.dataset.appPath);
});
```

Envolver o bloco do formulário (`const form = document.getElementById('waitlist-form'); ...` até o fim dos handlers do form) em `if (form) { ... }`, e o handler de `copy-link` em `const copyLink = document.getElementById('copy-link'); if (copyLink) { copyLink.addEventListener(...) }`. Sem isso, `parceiros.html` quebra com `Cannot read properties of null`.

- [ ] **Step 2: Link cruzado no `index.html`**

Em `index.html`, no `<ul>` de `#site-nav`, adicionar como último item:

```html
            <li><a href="parceiros.html">Para donos de camping</a></li>
```

- [ ] **Step 3: `parceiros.html`**

Criar `parceiros.html`. `<head>`: copiar o de `index.html` e trocar `<title>` por `O Campista para donos de camping — coloque seu camping no mapa`, `description` por `Cadastre seu camping ou pesqueiro no O Campista: apareça no mapa de quem acampa, acompanhe as visitas no painel e receba presentes, avaliações e ocupação em tempo real. Grátis.`, `canonical`/`og:url` por `https://lipilemos.github.io/o-campista-landing/parceiros.html`, e `og:title` por `Coloque seu camping no mapa de quem acampa`. Header: copiar o de `index.html`, trocando o `<ul>` por:

```html
          <ul>
            <li><a href="#beneficios">Benefícios</a></li>
            <li><a href="#painel">Painel</a></li>
            <li><a href="#como-funciona">Como funciona</a></li>
            <li><a href="#faq">Dúvidas</a></li>
            <li><a href="index.html">Para campistas</a></li>
          </ul>
```

e o botão do header por `<a class="btn btn--primary btn--sm" data-app-path="/parceiros/cadastrar" href="#">Cadastrar meu camping</a>`.

`<main id="conteudo">`:

```html
      <section class="hero hero--parceiros" id="topo">
        <div class="container hero-grid">
          <div class="hero-copy reveal">
            <p class="eyebrow">Para donos de campings e pesqueiros</p>
            <h1>Coloque seu camping no mapa de quem acampa.</h1>
            <p class="lead">
              O Campista é o app onde campistas descobrem lugares, fazem check-in por GPS e
              contam para a comunidade como foi. Cadastre o seu e apareça para quem está
              procurando o próximo destino — de graça.
            </p>
            <div class="hero-actions">
              <a class="btn btn--primary" data-app-path="/parceiros/cadastrar" href="#">Cadastrar meu camping</a>
              <a class="btn btn--ghost" href="#beneficios">Ver benefícios</a>
            </div>
          </div>
        </div>
      </section>

      <section class="promise-strip" aria-label="Destaques para parceiros">
        <div class="container promise-grid">
          <p><strong>Cadastro gratuito</strong><span>Sem mensalidade, sem cartão.</span></p>
          <p><strong>Aparece no mapa após aprovação</strong><span>Revisamos cada cadastro para manter o mapa confiável.</span></p>
          <p><strong>Painel com visitas reais</strong><span>Check-ins por GPS, não cliques.</span></p>
        </div>
      </section>

      <section class="section" id="beneficios">
        <div class="container">
          <div class="section-head reveal">
            <p class="eyebrow">Por que cadastrar</p>
            <h2>O que seu camping ganha dentro do app</h2>
          </div>
          <div class="features-grid">
            <article class="feature-card card-elevated reveal">
              <p class="emoji" aria-hidden="true">🗺️</p>
              <h3>Visibilidade no mapa</h3>
              <p>Seu camping aparece para todo campista que abrir o mapa na sua região, com endereço, telefone, recursos e rota até a portaria.</p>
            </article>
            <article class="feature-card card-elevated reveal">
              <p class="emoji" aria-hidden="true">📊</p>
              <h3>Painel de visitação</h3>
              <p>Quantos check-ins seu camping recebeu nos últimos 30 dias, visitantes únicos, avaliações e quem favoritou — tudo num só lugar.</p>
            </article>
            <article class="feature-card card-elevated reveal">
              <p class="emoji" aria-hidden="true">🔥</p>
              <h3>Ocupação em tempo real</h3>
              <p>Quem faz check-in informa se está tranquilo, movimentado ou lotado. Você acompanha o movimento sem sair da recepção.</p>
            </article>
            <article class="feature-card card-elevated reveal">
              <p class="emoji" aria-hidden="true">🎁</p>
              <h3>Presentes como chamariz</h3>
              <p>Campistas escondem presentes nos lugares que amam. Cada presente deixado no seu camping vira motivo para outro campista ir até lá.</p>
            </article>
            <article class="feature-card card-elevated reveal">
              <p class="emoji" aria-hidden="true">💬</p>
              <h3>Chat e achados &amp; perdidos</h3>
              <p>Cada camping tem sua sala de chat e um mural de achados e perdidos. A comunidade se ajuda e o seu camping vira ponto de encontro.</p>
            </article>
            <article class="feature-card card-elevated reveal feature-card--soon">
              <span class="soon-badge">Em breve</span>
              <p class="emoji" aria-hidden="true">🏷️</p>
              <h3>Cupons e descontos</h3>
              <p>Você vai poder criar cupons dentro do app para atrair campistas que ainda não conhecem o seu camping.</p>
            </article>
          </div>
        </div>
      </section>

      <section class="section screens" id="painel">
        <div class="container">
          <div class="section-head reveal">
            <p class="eyebrow">Por dentro do painel</p>
            <h2>Meu camping, na palma da mão</h2>
          </div>
          <div class="painel-mock reveal">
            <figure class="screen-item">
              <div class="phone-frame">
                <div class="phone-screen" aria-hidden="true">
                  <div class="mk-status"><span>9:41</span><span>▮▮▮ 📶</span></div>
                  <div class="mk-painel">
                    <p class="mk-title">Meu camping</p>
                    <div class="mk-head"><strong>Recanto das Araras</strong><span class="mk-badge">Aprovado</span></div>
                    <div class="mk-kpis">
                      <div><b>42</b><small>Check-ins (30 dias)</small></div>
                      <div><b>31</b><small>Visitantes únicos</small></div>
                      <div><b>⭐ 4,7</b><small>Avaliação média</small></div>
                      <div><b class="mk-ok">Tranquilo</b><small>Ocupação agora</small></div>
                    </div>
                    <div class="mk-bars">
                      <i style="height: 30%"></i><i style="height: 55%"></i><i style="height: 20%"></i><i style="height: 80%"></i><i style="height: 100%"></i><i style="height: 45%"></i><i style="height: 60%"></i><i style="height: 35%"></i><i style="height: 70%"></i><i style="height: 50%"></i>
                    </div>
                  </div>
                </div>
              </div>
              <figcaption>Check-ins por dia, visitantes, avaliação e ocupação — dados reais dos campistas.</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section class="section" id="como-funciona">
        <div class="container">
          <div class="section-head reveal">
            <p class="eyebrow">Como funciona</p>
            <h2>Três passos e pronto</h2>
          </div>
          <ol class="steps">
            <li class="card-elevated reveal"><span class="step-num">1</span><h3>Crie sua conta no app</h3><p>A mesma conta de campista. Leva um minuto, com e-mail ou Google.</p></li>
            <li class="card-elevated reveal"><span class="step-num">2</span><h3>Marque a posição e preencha os dados</h3><p>Arraste o marcador até a portaria, informe nome, cidade e recursos. Se o seu camping já estiver no mapa, é só reivindicar.</p></li>
            <li class="card-elevated reveal"><span class="step-num">3</span><h3>Aprovamos e publicamos</h3><p>Revisamos o cadastro e o camping entra no mapa. Enquanto isso, o painel já fica disponível.</p></li>
          </ol>
        </div>
      </section>

      <section class="section cta-final" id="cadastrar">
        <div class="container reveal">
          <h2>Pronto para receber mais campistas?</h2>
          <a class="btn btn--primary" data-app-path="/parceiros/cadastrar" href="#">Cadastrar meu camping</a>
        </div>
      </section>

      <section class="section" id="faq">
        <div class="container">
          <div class="section-head reveal">
            <p class="eyebrow">Dúvidas frequentes</p>
            <h2>Antes de cadastrar</h2>
          </div>
          <div class="faq-list">
            <details><summary>Custa alguma coisa?</summary><p>Não. Cadastro, painel e presença no mapa são gratuitos.</p></details>
            <details><summary>Meu camping já está no mapa. E agora?</summary><p>Ao marcar a posição no cadastro, o app mostra campings próximos sem dono. Escolha o seu e clique em "Este é o meu" — é a reivindicação, que também passa pela nossa aprovação.</p></details>
            <details><summary>Quanto tempo leva a aprovação?</summary><p>Revisamos manualmente cada cadastro. Você vê o status "Em análise" no painel e o camping aparece no mapa assim que aprovado.</p></details>
            <details><summary>Posso editar os dados depois?</summary><p>Por enquanto, fale com a gente pelo e-mail no rodapé e ajustamos para você. Edição direta no app está no roteiro.</p></details>
            <details><summary>O que é o status de ocupação?</summary><p>Quem faz check-in informa se o camping está tranquilo, movimentado ou lotado. O app mostra o relato mais comum das últimas 6 horas.</p></details>
          </div>
        </div>
      </section>
    </main>
```

Footer: copiar o `<footer class="site-footer">…</footer>` inteiro de `index.html`, mais `<div class="toast" id="toast" role="status" aria-live="polite" hidden></div>` e `<script src="assets/main.js"></script>` (mesma tag usada em `index.html`).

Se `index.html` não tiver as classes `hero-grid`, `hero-copy`, `lead`, `hero-actions`, `btn--ghost`, `promise-grid`, `steps` com esses nomes exatos, usar os nomes que o `index.html` usa nos blocos equivalentes (hero e promise-strip) — o objetivo é reaproveitar, não duplicar.

- [ ] **Step 4: CSS**

Ao final de `assets/styles.css`:

```css
/* ==========================================================================
   Parceiros (parceiros.html)
   ========================================================================== */

.feature-card--soon {
  position: relative;
  opacity: 0.92;
}

.soon-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--primary);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.painel-mock {
  display: flex;
  justify-content: center;
}

.painel-mock figcaption {
  margin-top: 12px;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.mk-painel {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mk-title {
  margin: 0;
  font-weight: 800;
}

.mk-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.mk-badge {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--success-soft);
  color: var(--success-text);
  font-size: 0.7rem;
  font-weight: 700;
}

.mk-kpis {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.mk-kpis div {
  padding: 8px;
  border-radius: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}

.mk-kpis b {
  font-size: 1.1rem;
}

.mk-kpis small {
  font-size: 0.65rem;
  color: var(--text-muted);
}

.mk-ok {
  color: var(--success-text);
}

.mk-bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 60px;
  padding: 8px;
  border-radius: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
}

.mk-bars i {
  flex: 1;
  background: var(--primary);
  border-radius: 2px 2px 0 0;
}

.steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.steps li {
  padding: 24px;
}

.steps h3 {
  margin: 8px 0 4px;
}

.step-num {
  display: inline-grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  font-weight: 800;
}

.cta-final .container {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
```

Se `styles.css` não definir `--success-soft`/`--success-text`/`--text-muted`, usar os tokens de mesma função já presentes no arquivo (procurar por "success" e "muted").

- [ ] **Step 5: README**

Na tabela de constantes do `README.md`, adicionar `| APP_URL | URL pública do app Angular — alvo dos botões "Cadastrar meu camping" em parceiros.html |`. Na árvore do topo, adicionar `├── parceiros.html   # página para donos de camping (benefícios + CTA para o cadastro no app)`.

- [ ] **Step 6: Verificar**

Run: `npx prettier --check .` (no repo da landing) → sem diferenças (rodar `--write` se precisar).
Abrir `parceiros.html` no navegador (ou `npx serve .`): light/dark; 1440/768/375px sem scroll horizontal; menu mobile abre/fecha; links `data-app-path` apontam para `http://localhost:4200/parceiros/cadastrar`; nenhum erro no console (os guards do `main.js`); `index.html` continua funcionando (form da lista de espera, copiar link). Verificar contraste do `.soon-badge` (branco sobre `--primary`) com a extensão axe.

- [ ] **Step 7: Commit** (quando liberado)

```bash
npx prettier --write .
git add parceiros.html assets index.html README.md
git commit -m "feat: página de parceiros para donos de camping"
```

---

## Self-review

**Spec coverage:** schema/entidade (T1), filtro `Ativo` (T1), DTOs (T2), `/recursos` (T2), métodos de repositório (T3), criar/reivindicar/meus/próximos (T4), painel (T5), `returnUrl` (T6), modelos/serviço (T7), `CadastrarCampingComponent` com reivindicação e recursos (T8), `MeuCampingComponent` com chips/badge/aviso/KPIs/gráfico SVG (T9), item de menu (T9), i18n em ambos os idiomas (T8, T9), testes Vitest listados no spec (T6–T9), CLAUDE.md (T10), landing com as 8 seções, link cruzado, `APP_URL`, OG tags e verificação (T11).

**Tipos:** `ObterSemDonoNoRaioAsync` retorna `List<(Camping, double)>` em T3 e é consumido assim em T4; `ObterCheckinsPorDiaAsync` retorna `Dictionary<DateOnly,int>` em T3 e é lido com `GetValueOrDefault(DateOnly)` em T5; `CheckinsDia.data` é string no front (JSON de `DateOnly` serializa como `"2026-09-15"`), e `diaCurto` usa `slice(8, 10)`; `TipoCampingComDono` usado no form e no request; `DonoStatus` usado no badge com chave `status-<valor>`.

**Ambiguidades resolvidas:** o painel funciona para camping pendente (spec); reivindicação só para `camping`/`pesca` ativos sem dono; `Estado` normalizado para maiúsculas no backend e validado `^[A-Z]{2}$` no front; `APP_URL` default `http://localhost:4200` documentado no README.
