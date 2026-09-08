import type { SQLiteDatabase } from 'expo-sqlite';

export type Cliente = {
  id: number;
  nome: string;
  contato: string | null;
  criado_em: string;
};

export type Sessao = {
  id: number;
  cliente_id: number;
  iniciada_em: string;
  finalizada_em: string | null;
  nota: string | null;
};

export type TipoLeitura = 'borg' | 'omni' | 'dor' | 'fc';

export type Leitura = {
  id: number;
  sessao_id: number;
  tipo: TipoLeitura;
  valor: number;
  registrada_em: string;
};

export type ResumoSessao = Sessao & {
  media_borg: number | null;
  media_dor: number | null;
  media_fc: number | null;
  total_leituras: number;
};

export async function listarClientes(db: SQLiteDatabase, busca?: string): Promise<Cliente[]> {
  if (busca && busca.trim().length > 0) {
    return db.getAllAsync<Cliente>(
      `SELECT * FROM clientes WHERE nome LIKE ? ORDER BY nome ASC`,
      [`%${busca.trim()}%`],
    );
  }
  return db.getAllAsync<Cliente>(`SELECT * FROM clientes ORDER BY nome ASC`);
}

export async function buscarCliente(db: SQLiteDatabase, id: number): Promise<Cliente | null> {
  return db.getFirstAsync<Cliente>(`SELECT * FROM clientes WHERE id = ?`, [id]);
}

export async function criarCliente(
  db: SQLiteDatabase,
  nome: string,
  contato: string | null,
): Promise<number> {
  const resultado = await db.runAsync(
    `INSERT INTO clientes (nome, contato, criado_em) VALUES (?, ?, ?)`,
    [nome.trim(), contato?.trim() || null, new Date().toISOString()],
  );
  return resultado.lastInsertRowId;
}

export async function listarSessoesPorCliente(
  db: SQLiteDatabase,
  clienteId: number,
): Promise<ResumoSessao[]> {
  return db.getAllAsync<ResumoSessao>(
    `
    SELECT
      s.*,
      (SELECT AVG(valor) FROM leituras WHERE sessao_id = s.id AND tipo = 'borg') AS media_borg,
      (SELECT AVG(valor) FROM leituras WHERE sessao_id = s.id AND tipo = 'dor') AS media_dor,
      (SELECT AVG(valor) FROM leituras WHERE sessao_id = s.id AND tipo = 'fc') AS media_fc,
      (SELECT COUNT(*) FROM leituras WHERE sessao_id = s.id) AS total_leituras
    FROM sessoes s
    WHERE s.cliente_id = ?
    ORDER BY s.iniciada_em DESC
    `,
    [clienteId],
  );
}

export async function criarSessao(db: SQLiteDatabase, clienteId: number): Promise<number> {
  const resultado = await db.runAsync(
    `INSERT INTO sessoes (cliente_id, iniciada_em) VALUES (?, ?)`,
    [clienteId, new Date().toISOString()],
  );
  return resultado.lastInsertRowId;
}

export async function buscarSessao(db: SQLiteDatabase, id: number): Promise<Sessao | null> {
  return db.getFirstAsync<Sessao>(`SELECT * FROM sessoes WHERE id = ?`, [id]);
}

export async function finalizarSessao(
  db: SQLiteDatabase,
  sessaoId: number,
  nota: string | null,
): Promise<void> {
  await db.runAsync(`UPDATE sessoes SET finalizada_em = ?, nota = ? WHERE id = ?`, [
    new Date().toISOString(),
    nota?.trim() || null,
    sessaoId,
  ]);
}

export async function registrarLeitura(
  db: SQLiteDatabase,
  sessaoId: number,
  tipo: TipoLeitura,
  valor: number,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO leituras (sessao_id, tipo, valor, registrada_em) VALUES (?, ?, ?, ?)`,
    [sessaoId, tipo, valor, new Date().toISOString()],
  );
}

export async function listarLeituras(db: SQLiteDatabase, sessaoId: number): Promise<Leitura[]> {
  return db.getAllAsync<Leitura>(
    `SELECT * FROM leituras WHERE sessao_id = ? ORDER BY registrada_em ASC`,
    [sessaoId],
  );
}
