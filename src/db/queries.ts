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
  media_omni: number | null;
  media_dor: number | null;
  media_fc: number | null;
  total_leituras: number;
};

export type ClienteComResumo = Cliente & {
  ultima_sessao_em: string | null;
  ultima_sessao_fim: string | null;
  ultima_media_borg: number | null;
  ultima_media_omni: number | null;
  ultima_media_dor: number | null;
};

export type ResumoGeralCliente = {
  media_omni: number | null;
  pico_dor: number | null;
  tempo_medio_min: number | null;
  total_sessoes: number;
};

export type SessaoEmAndamento = Sessao & {
  cliente_nome: string;
  cliente_contato: string | null;
  ultimo_tipo: TipoLeitura | null;
  ultimo_valor: number | null;
  total_leituras: number;
};

export type ResumoGeralApp = {
  sessoes_semana: number;
  clientes_ativos_mes: number;
  total_clientes: number;
  alertas_dor: number;
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

// Lista de clientes com a telemetria da última sessão embutida — alimenta os cartões da tela
// inicial (Borg/OMNI/Dor mais recentes, sem precisar de uma query por cliente).
export async function listarClientesComResumo(
  db: SQLiteDatabase,
  busca?: string,
): Promise<ClienteComResumo[]> {
  const filtro = busca && busca.trim().length > 0 ? `%${busca.trim()}%` : null;
  return db.getAllAsync<ClienteComResumo>(
    `
    SELECT
      c.*,
      s.iniciada_em AS ultima_sessao_em,
      s.finalizada_em AS ultima_sessao_fim,
      (SELECT AVG(valor) FROM leituras WHERE sessao_id = s.id AND tipo = 'borg') AS ultima_media_borg,
      (SELECT AVG(valor) FROM leituras WHERE sessao_id = s.id AND tipo = 'omni') AS ultima_media_omni,
      (SELECT AVG(valor) FROM leituras WHERE sessao_id = s.id AND tipo = 'dor') AS ultima_media_dor
    FROM clientes c
    LEFT JOIN sessoes s ON s.id = (
      SELECT id FROM sessoes WHERE cliente_id = c.id ORDER BY iniciada_em DESC LIMIT 1
    )
    WHERE (? IS NULL OR c.nome LIKE ?)
    ORDER BY c.nome ASC
    `,
    [filtro, filtro],
  );
}

// Telemetria agregada de todas as sessões do cliente — alimenta os cartões de resumo do
// prontuário (carga média OMNI, pico de dor histórico, duração média de sessão).
export async function buscarResumoGeralCliente(
  db: SQLiteDatabase,
  clienteId: number,
): Promise<ResumoGeralCliente> {
  const linha = await db.getFirstAsync<{
    media_omni: number | null;
    pico_dor: number | null;
    tempo_medio_min: number | null;
    total_sessoes: number;
  }>(
    `
    SELECT
      (SELECT AVG(l.valor) FROM leituras l JOIN sessoes s ON s.id = l.sessao_id
        WHERE s.cliente_id = ? AND l.tipo = 'omni') AS media_omni,
      (SELECT MAX(l.valor) FROM leituras l JOIN sessoes s ON s.id = l.sessao_id
        WHERE s.cliente_id = ? AND l.tipo = 'dor') AS pico_dor,
      (SELECT AVG((julianday(finalizada_em) - julianday(iniciada_em)) * 24 * 60)
        FROM sessoes WHERE cliente_id = ? AND finalizada_em IS NOT NULL) AS tempo_medio_min,
      (SELECT COUNT(*) FROM sessoes WHERE cliente_id = ?) AS total_sessoes
    `,
    [clienteId, clienteId, clienteId, clienteId],
  );
  return linha ?? { media_omni: null, pico_dor: null, tempo_medio_min: null, total_sessoes: 0 };
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
      (SELECT AVG(valor) FROM leituras WHERE sessao_id = s.id AND tipo = 'omni') AS media_omni,
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

// Sessões abertas (ainda não finalizadas) de qualquer cliente — alimenta a aba "Treino Ativo",
// pra retomar rápido uma sessão que ficou em andamento.
export async function listarSessoesEmAndamento(db: SQLiteDatabase): Promise<SessaoEmAndamento[]> {
  return db.getAllAsync<SessaoEmAndamento>(
    `
    SELECT
      s.*,
      c.nome AS cliente_nome,
      c.contato AS cliente_contato,
      (SELECT tipo FROM leituras WHERE sessao_id = s.id ORDER BY registrada_em DESC LIMIT 1) AS ultimo_tipo,
      (SELECT valor FROM leituras WHERE sessao_id = s.id ORDER BY registrada_em DESC LIMIT 1) AS ultimo_valor,
      (SELECT COUNT(*) FROM leituras WHERE sessao_id = s.id) AS total_leituras
    FROM sessoes s
    JOIN clientes c ON c.id = s.cliente_id
    WHERE s.finalizada_em IS NULL
    ORDER BY s.iniciada_em DESC
    `,
  );
}

// Telemetria agregada de todo o consultório — alimenta a aba "Evolução" (sessões da semana,
// clientes ativos no mês, alertas de dor abertos).
export async function buscarResumoGeralApp(
  db: SQLiteDatabase,
  desdeSemanaIso: string,
  desdeMesIso: string,
): Promise<ResumoGeralApp> {
  const linha = await db.getFirstAsync<{
    sessoes_semana: number;
    clientes_ativos_mes: number;
    total_clientes: number;
  }>(
    `
    SELECT
      (SELECT COUNT(*) FROM sessoes WHERE iniciada_em >= ?) AS sessoes_semana,
      (SELECT COUNT(DISTINCT cliente_id) FROM sessoes WHERE iniciada_em >= ?) AS clientes_ativos_mes,
      (SELECT COUNT(*) FROM clientes) AS total_clientes
    `,
    [desdeSemanaIso, desdeMesIso],
  );
  const clientes = await listarClientesComResumo(db);
  const alertasDor = clientes.filter((c) => (c.ultima_media_dor ?? 0) >= 4).length;
  return {
    sessoes_semana: linha?.sessoes_semana ?? 0,
    clientes_ativos_mes: linha?.clientes_ativos_mes ?? 0,
    total_clientes: linha?.total_clientes ?? 0,
    alertas_dor: alertasDor,
  };
}

// Salva a nota como rascunho assim que o educador digita, sem esperar o fim da sessão — evita
// perder a anotação clínica se o app fechar antes de "Finalizar".
export async function atualizarNotaSessao(
  db: SQLiteDatabase,
  sessaoId: number,
  nota: string | null,
): Promise<void> {
  await db.runAsync(`UPDATE sessoes SET nota = ? WHERE id = ?`, [nota?.trim() || null, sessaoId]);
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
