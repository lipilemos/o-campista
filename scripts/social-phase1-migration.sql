-- =============================================================================
-- Fase 1 Social: Perfis Públicos + Follow/Followers + Privacidade
-- Banco: PostgreSQL (Supabase)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tabela de seguidores
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Seguidores" (
  "SeguidorId"  UUID        NOT NULL,
  "SeguidoId"   UUID        NOT NULL,
  "CriadoEm"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "PK_Seguidores" PRIMARY KEY ("SeguidorId", "SeguidoId"),
  CONSTRAINT "FK_Seguidores_Seguidor" FOREIGN KEY ("SeguidorId")
    REFERENCES "Usuarios" ("Id") ON DELETE CASCADE,
  CONSTRAINT "FK_Seguidores_Seguido" FOREIGN KEY ("SeguidoId")
    REFERENCES "Usuarios" ("Id") ON DELETE CASCADE,
  CONSTRAINT "CHK_Seguidores_AutoFollow" CHECK ("SeguidorId" <> "SeguidoId")
);
CREATE INDEX IF NOT EXISTS "IX_Seguidores_SeguidoId"
  ON "Seguidores" ("SeguidoId");

-- -----------------------------------------------------------------------------
-- 2. Tabela de configuração de privacidade
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "ConfiguracaoPrivacidade" (
  "UsuarioId"          UUID    NOT NULL,
  "PerfilPublico"      BOOLEAN NOT NULL DEFAULT TRUE,
  "CheckinsPublicos"   BOOLEAN NOT NULL DEFAULT TRUE,
  "ConquistasPublicas" BOOLEAN NOT NULL DEFAULT TRUE,
  "NivelPublico"       BOOLEAN NOT NULL DEFAULT TRUE,

  CONSTRAINT "PK_ConfiguracaoPrivacidade" PRIMARY KEY ("UsuarioId"),
  CONSTRAINT "FK_ConfiguracaoPrivacidade_Usuario" FOREIGN KEY ("UsuarioId")
    REFERENCES "Usuarios" ("Id") ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 3. Inserir config padrão para usuários existentes
--    (execute uma vez; novos usuários devem receber via trigger ou no registro)
-- -----------------------------------------------------------------------------
INSERT INTO "ConfiguracaoPrivacidade" ("UsuarioId")
SELECT "Id" FROM "Usuarios"
WHERE "Id" NOT IN (SELECT "UsuarioId" FROM "ConfiguracaoPrivacidade")
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. Trigger: criar config de privacidade automaticamente ao registrar usuário
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_criar_configuracao_privacidade()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "ConfiguracaoPrivacidade" ("UsuarioId")
  VALUES (NEW."Id")
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_criar_privacidade_usuario ON "Usuarios";

CREATE TRIGGER trg_criar_privacidade_usuario
  AFTER INSERT ON "Usuarios"
  FOR EACH ROW
  EXECUTE FUNCTION fn_criar_configuracao_privacidade();

-- -----------------------------------------------------------------------------
-- 5. View auxiliar: contagens sociais por usuário
--    Usada pelos endpoints GET /usuarios/{id}/perfil
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW "vw_ContsSociais" AS
SELECT
  u."Id"                                                      AS "UsuarioId",
  COUNT(DISTINCT s_seg."SeguidorId")                          AS "TotalSeguidores",
  COUNT(DISTINCT s_snd."SeguidoId")                           AS "TotalSeguindo"
FROM "Usuarios" u
LEFT JOIN "Seguidores" s_seg ON s_seg."SeguidoId"  = u."Id"
LEFT JOIN "Seguidores" s_snd ON s_snd."SeguidorId" = u."Id"
GROUP BY u."Id";

-- -----------------------------------------------------------------------------
-- Endpoints REST esperados no backend (ASP.NET Core)
-- -----------------------------------------------------------------------------
-- GET    /api/usuarios/{id}/perfil          → PerfilPublicoDto
-- GET    /api/usuarios/buscar?nome={nome}   → List<UsuarioBuscaDto>
-- POST   /api/usuarios/{id}/seguir          → 204 / 409
-- DELETE /api/usuarios/{id}/seguir          → 204
-- GET    /api/usuarios/{id}/seguidores      → List<UsuarioBuscaDto>
-- GET    /api/usuarios/{id}/seguindo        → List<UsuarioBuscaDto>
-- GET    /api/usuarios/{id}/privacidade     → ConfiguracaoPrivacidadeDto
-- PUT    /api/usuarios/{id}/privacidade     → 204

-- -----------------------------------------------------------------------------
-- DTOs esperados (C# — apenas para referência)
-- -----------------------------------------------------------------------------
-- record PerfilPublicoDto(
--   string Id, string Nome, string FotoPerfil,
--   int? Nivel, int? Xp,
--   int? TotalCheckins, int? TotalCampingsVisitados, int? TotalTrilhasConcluidas,
--   IList<ConquistaDto>? Conquistas,
--   IList<HistoricoCheckinDto>? UltimosCheckins,
--   int TotalSeguidores, int TotalSeguindo, bool EstouSeguindo
-- );
--
-- record UsuarioBuscaDto(string Id, string Nome, string FotoPerfil, int Nivel);
--
-- record ConfiguracaoPrivacidadeDto(
--   bool PerfilPublico, bool CheckinsPublicos,
--   bool ConquistasPublicas, bool NivelPublico
-- );
