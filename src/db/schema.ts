// Schema do banco local (SQLite via expo-sqlite). Continua sendo a fonte primária de dados —
// a sincronização com Supabase (ver src/lib/sync.ts) é backup/multi-dispositivo, não substitui
// o SQLite local (o app funciona 100% offline mesmo com login).
//
// MIGRATIONS é uma lista ordenada de passos; cada um roda exatamente uma vez, controlado por
// `PRAGMA user_version` (ver applyMigrations em src/db/migrate.ts). Nunca editar um passo já
// publicado — só adicionar um novo no fim da lista.

export const MIGRATIONS = [
  `
  CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    contato TEXT,
    criado_em TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    iniciada_em TEXT NOT NULL,
    finalizada_em TEXT,
    nota TEXT
  );

  CREATE TABLE IF NOT EXISTS leituras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sessao_id INTEGER NOT NULL REFERENCES sessoes(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('borg', 'omni', 'dor', 'fc')),
    valor REAL NOT NULL,
    registrada_em TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sessoes_cliente ON sessoes(cliente_id);
  CREATE INDEX IF NOT EXISTS idx_leituras_sessao ON leituras(sessao_id);
  `,
  // Sincronização com Supabase: cada linha ganha um uuid próprio (gerado no aparelho, é o que
  // vira o id remoto — o id local INTEGER continua só pra uso interno do SQLite) e um carimbo
  // de "alterado em" pra saber o que ainda não foi enviado (sincronizado_em nulo ou anterior a
  // atualizado_em = pendente de push).
  `
  ALTER TABLE clientes ADD COLUMN uuid TEXT;
  ALTER TABLE clientes ADD COLUMN atualizado_em TEXT;
  ALTER TABLE clientes ADD COLUMN sincronizado_em TEXT;

  ALTER TABLE sessoes ADD COLUMN uuid TEXT;
  ALTER TABLE sessoes ADD COLUMN atualizado_em TEXT;
  ALTER TABLE sessoes ADD COLUMN sincronizado_em TEXT;

  ALTER TABLE leituras ADD COLUMN uuid TEXT;
  ALTER TABLE leituras ADD COLUMN atualizado_em TEXT;
  ALTER TABLE leituras ADD COLUMN sincronizado_em TEXT;

  CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_uuid ON clientes(uuid);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_sessoes_uuid ON sessoes(uuid);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_leituras_uuid ON leituras(uuid);
  `,
  // Linhas criadas antes do passo anterior ficaram com atualizado_em NULL (a coluna nova entra
  // sempre nula) — a tabela remota exige NOT NULL nessa coluna, então o push falhava com "null
  // value in column atualizado_em" pra qualquer dado criado antes desta sessão. Backfill usando
  // o carimbo de criação de cada linha como aproximação razoável de "última alteração".
  `
  UPDATE clientes SET atualizado_em = criado_em WHERE atualizado_em IS NULL;
  UPDATE sessoes SET atualizado_em = iniciada_em WHERE atualizado_em IS NULL;
  UPDATE leituras SET atualizado_em = registrada_em WHERE atualizado_em IS NULL;
  `,
];
