// Schema do banco local (SQLite via expo-sqlite). Sem backend: cada celular do educador
// guarda os próprios dados. Sincronização/nuvem fica pra quando o produto validar demanda.

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
];
