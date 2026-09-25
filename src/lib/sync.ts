import type { SQLiteDatabase } from 'expo-sqlite';

import { supabase } from '@/lib/supabase';

export type ResultadoSincronizacao = {
  enviados: number;
  recebidos: number;
  conflitos: number;
};

type LinhaPendente = { uuid: string; atualizado_em: string; sincronizado_em: string | null };

// Sincronização simples, em uma direção por vez: empurra o que mudou localmente desde o
// último sync (por uuid, upsert), depois traz o que existe na nuvem e ainda não existe neste
// aparelho. SQLite local continua sendo a fonte primária — isto é backup/multi-dispositivo, não
// substitui o offline-first do app (ver PRODUTO.md).
//
// Continua sendo last-write-wins (o último push sempre sobrescreve) — decisão deliberada, não um
// merge de campo a campo. O que mudou: antes de sobrescrever, cada push agora confere se a linha
// remota foi alterada por outro aparelho depois do último sync deste aparelho (comparando
// atualizado_em remoto contra sincronizado_em local). Se sim, é um conflito real — a escrita local
// vai apagar uma versão que este aparelho nunca chegou a ver. O push segue acontecendo (LWW), mas
// o conflito é contado e mostrado na aba Ajustes, nunca silencioso.
export async function sincronizarTudo(db: SQLiteDatabase): Promise<ResultadoSincronizacao> {
  let enviados = 0;
  let recebidos = 0;
  let conflitos = 0;

  const clientes = await enviarClientes(db);
  const sessoes = await enviarSessoes(db);
  const leituras = await enviarLeituras(db);
  enviados = clientes.enviados + sessoes.enviados + leituras.enviados;
  conflitos = clientes.conflitos + sessoes.conflitos + leituras.conflitos;

  recebidos += await receberClientes(db);
  recebidos += await receberSessoes(db);
  recebidos += await receberLeituras(db);

  return { enviados, recebidos, conflitos };
}

// Compara, para cada linha pendente de envio, a última vez que ESTE aparelho sincronizou essa
// linha (sincronizado_em) contra o atualizado_em que está na nuvem agora. Se a nuvem tem uma
// versão mais nova que este aparelho nunca viu — e essa versão não é a que este próprio aparelho
// vai enviar agora —, outro aparelho editou a mesma linha nesse intervalo: é um conflito.
async function contarConflitos(
  tabela: 'clientes' | 'sessoes' | 'leituras',
  pendentes: LinhaPendente[],
): Promise<number> {
  if (pendentes.length === 0) return 0;
  const { data, error } = await supabase
    .from(tabela)
    .select('id, atualizado_em')
    .in(
      'id',
      pendentes.map((p) => p.uuid),
    );
  if (error) throw new Error(`Falha ao verificar conflitos em ${tabela}: ${error.message}`);
  const atualizadoEmRemoto = new Map((data ?? []).map((r) => [r.id as string, r.atualizado_em as string]));
  let conflitos = 0;
  for (const linha of pendentes) {
    const remoto = atualizadoEmRemoto.get(linha.uuid);
    if (remoto && linha.sincronizado_em && remoto > linha.sincronizado_em && remoto !== linha.atualizado_em) {
      conflitos++;
    }
  }
  return conflitos;
}

async function enviarClientes(db: SQLiteDatabase): Promise<{ enviados: number; conflitos: number }> {
  const pendentes = await db.getAllAsync<{
    uuid: string;
    nome: string;
    contato: string | null;
    criado_em: string;
    atualizado_em: string;
    sincronizado_em: string | null;
  }>(
    `SELECT uuid, nome, contato, criado_em, atualizado_em, sincronizado_em FROM clientes
     WHERE sincronizado_em IS NULL OR sincronizado_em < atualizado_em`,
  );
  const conflitos = await contarConflitos('clientes', pendentes);
  for (const linha of pendentes) {
    const { error } = await supabase.from('clientes').upsert(
      {
        id: linha.uuid,
        nome: linha.nome,
        contato: linha.contato,
        criado_em: linha.criado_em,
        atualizado_em: linha.atualizado_em,
      },
      { onConflict: 'id' },
    );
    if (error) throw new Error(`Falha ao enviar cliente: ${error.message}`);
    await db.runAsync(`UPDATE clientes SET sincronizado_em = ? WHERE uuid = ?`, [
      linha.atualizado_em,
      linha.uuid,
    ]);
  }
  return { enviados: pendentes.length, conflitos };
}

async function enviarSessoes(db: SQLiteDatabase): Promise<{ enviados: number; conflitos: number }> {
  const pendentes = await db.getAllAsync<{
    uuid: string;
    cliente_uuid: string;
    iniciada_em: string;
    finalizada_em: string | null;
    nota: string | null;
    atualizado_em: string;
    sincronizado_em: string | null;
  }>(
    `SELECT s.uuid, c.uuid AS cliente_uuid, s.iniciada_em, s.finalizada_em, s.nota, s.atualizado_em, s.sincronizado_em
     FROM sessoes s
     JOIN clientes c ON c.id = s.cliente_id
     WHERE s.sincronizado_em IS NULL OR s.sincronizado_em < s.atualizado_em`,
  );
  const conflitos = await contarConflitos('sessoes', pendentes);
  for (const linha of pendentes) {
    const { error } = await supabase.from('sessoes').upsert(
      {
        id: linha.uuid,
        cliente_id: linha.cliente_uuid,
        iniciada_em: linha.iniciada_em,
        finalizada_em: linha.finalizada_em,
        nota: linha.nota,
        atualizado_em: linha.atualizado_em,
      },
      { onConflict: 'id' },
    );
    if (error) throw new Error(`Falha ao enviar sessão: ${error.message}`);
    await db.runAsync(`UPDATE sessoes SET sincronizado_em = ? WHERE uuid = ?`, [
      linha.atualizado_em,
      linha.uuid,
    ]);
  }
  return { enviados: pendentes.length, conflitos };
}

async function enviarLeituras(db: SQLiteDatabase): Promise<{ enviados: number; conflitos: number }> {
  const pendentes = await db.getAllAsync<{
    uuid: string;
    sessao_uuid: string;
    tipo: string;
    valor: number;
    registrada_em: string;
    atualizado_em: string;
    sincronizado_em: string | null;
  }>(
    `SELECT l.uuid, s.uuid AS sessao_uuid, l.tipo, l.valor, l.registrada_em, l.atualizado_em, l.sincronizado_em
     FROM leituras l
     JOIN sessoes s ON s.id = l.sessao_id
     WHERE l.sincronizado_em IS NULL OR l.sincronizado_em < l.atualizado_em`,
  );
  const conflitos = await contarConflitos('leituras', pendentes);
  for (const linha of pendentes) {
    const { error } = await supabase.from('leituras').upsert(
      {
        id: linha.uuid,
        sessao_id: linha.sessao_uuid,
        tipo: linha.tipo,
        valor: linha.valor,
        registrada_em: linha.registrada_em,
        atualizado_em: linha.atualizado_em,
      },
      { onConflict: 'id' },
    );
    if (error) throw new Error(`Falha ao enviar leitura: ${error.message}`);
    await db.runAsync(`UPDATE leituras SET sincronizado_em = ? WHERE uuid = ?`, [
      linha.atualizado_em,
      linha.uuid,
    ]);
  }
  return { enviados: pendentes.length, conflitos };
}

async function receberClientes(db: SQLiteDatabase): Promise<number> {
  const { data, error } = await supabase.from('clientes').select('*');
  if (error) throw new Error(`Falha ao buscar clientes: ${error.message}`);
  let recebidos = 0;
  for (const remoto of data ?? []) {
    const local = await db.getFirstAsync<{ id: number }>(`SELECT id FROM clientes WHERE uuid = ?`, [
      remoto.id,
    ]);
    if (local) continue;
    await db.runAsync(
      `INSERT INTO clientes (nome, contato, criado_em, uuid, atualizado_em, sincronizado_em)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [remoto.nome, remoto.contato, remoto.criado_em, remoto.id, remoto.atualizado_em, remoto.atualizado_em],
    );
    recebidos++;
  }
  return recebidos;
}

async function receberSessoes(db: SQLiteDatabase): Promise<number> {
  const { data, error } = await supabase.from('sessoes').select('*');
  if (error) throw new Error(`Falha ao buscar sessões: ${error.message}`);
  let recebidos = 0;
  for (const remoto of data ?? []) {
    const local = await db.getFirstAsync<{ id: number }>(`SELECT id FROM sessoes WHERE uuid = ?`, [
      remoto.id,
    ]);
    if (local) continue;
    const cliente = await db.getFirstAsync<{ id: number }>(`SELECT id FROM clientes WHERE uuid = ?`, [
      remoto.cliente_id,
    ]);
    if (!cliente) continue; // cliente ainda não chegou neste device — pega no próximo sync
    await db.runAsync(
      `INSERT INTO sessoes (cliente_id, iniciada_em, finalizada_em, nota, uuid, atualizado_em, sincronizado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        cliente.id,
        remoto.iniciada_em,
        remoto.finalizada_em,
        remoto.nota,
        remoto.id,
        remoto.atualizado_em,
        remoto.atualizado_em,
      ],
    );
    recebidos++;
  }
  return recebidos;
}

async function receberLeituras(db: SQLiteDatabase): Promise<number> {
  const { data, error } = await supabase.from('leituras').select('*');
  if (error) throw new Error(`Falha ao buscar leituras: ${error.message}`);
  let recebidos = 0;
  for (const remoto of data ?? []) {
    const local = await db.getFirstAsync<{ id: number }>(`SELECT id FROM leituras WHERE uuid = ?`, [
      remoto.id,
    ]);
    if (local) continue;
    const sessao = await db.getFirstAsync<{ id: number }>(`SELECT id FROM sessoes WHERE uuid = ?`, [
      remoto.sessao_id,
    ]);
    if (!sessao) continue;
    await db.runAsync(
      `INSERT INTO leituras (sessao_id, tipo, valor, registrada_em, uuid, atualizado_em, sincronizado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sessao.id, remoto.tipo, remoto.valor, remoto.registrada_em, remoto.id, remoto.atualizado_em, remoto.atualizado_em],
    );
    recebidos++;
  }
  return recebidos;
}
