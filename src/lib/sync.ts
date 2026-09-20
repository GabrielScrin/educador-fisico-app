import type { SQLiteDatabase } from 'expo-sqlite';

import { supabase } from '@/lib/supabase';

export type ResultadoSincronizacao = {
  enviados: number;
  recebidos: number;
};

// Sincronização simples, em uma direção por vez: empurra o que mudou localmente desde o
// último sync (por uuid, upsert), depois traz o que existe na nuvem e ainda não existe neste
// aparelho. SQLite local continua sendo a fonte primária — isto é backup/multi-dispositivo, não
// substitui o offline-first do app (ver PRODUTO.md).
//
// Limitação conhecida: não faz merge de conflito (last-write-wins) para uma linha editada em
// dois aparelhos ao mesmo tempo — cenário raro hoje (uso single-device), fica documentado pra
// quando o gap "multi-dispositivo" do PRODUTO.md for endereçado de verdade.
export async function sincronizarTudo(db: SQLiteDatabase): Promise<ResultadoSincronizacao> {
  let enviados = 0;
  let recebidos = 0;

  enviados += await enviarClientes(db);
  enviados += await enviarSessoes(db);
  enviados += await enviarLeituras(db);

  recebidos += await receberClientes(db);
  recebidos += await receberSessoes(db);
  recebidos += await receberLeituras(db);

  return { enviados, recebidos };
}

async function enviarClientes(db: SQLiteDatabase): Promise<number> {
  const pendentes = await db.getAllAsync<{
    uuid: string;
    nome: string;
    contato: string | null;
    criado_em: string;
    atualizado_em: string;
  }>(
    `SELECT uuid, nome, contato, criado_em, atualizado_em FROM clientes
     WHERE sincronizado_em IS NULL OR sincronizado_em < atualizado_em`,
  );
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
  return pendentes.length;
}

async function enviarSessoes(db: SQLiteDatabase): Promise<number> {
  const pendentes = await db.getAllAsync<{
    uuid: string;
    cliente_uuid: string;
    iniciada_em: string;
    finalizada_em: string | null;
    nota: string | null;
    atualizado_em: string;
  }>(
    `SELECT s.uuid, c.uuid AS cliente_uuid, s.iniciada_em, s.finalizada_em, s.nota, s.atualizado_em
     FROM sessoes s
     JOIN clientes c ON c.id = s.cliente_id
     WHERE s.sincronizado_em IS NULL OR s.sincronizado_em < s.atualizado_em`,
  );
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
  return pendentes.length;
}

async function enviarLeituras(db: SQLiteDatabase): Promise<number> {
  const pendentes = await db.getAllAsync<{
    uuid: string;
    sessao_uuid: string;
    tipo: string;
    valor: number;
    registrada_em: string;
    atualizado_em: string;
  }>(
    `SELECT l.uuid, s.uuid AS sessao_uuid, l.tipo, l.valor, l.registrada_em, l.atualizado_em
     FROM leituras l
     JOIN sessoes s ON s.id = l.sessao_id
     WHERE l.sincronizado_em IS NULL OR l.sincronizado_em < l.atualizado_em`,
  );
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
  return pendentes.length;
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
