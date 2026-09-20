import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { MIGRATIONS } from './schema';

const TABELAS_COM_UUID = ['clientes', 'sessoes', 'leituras'] as const;

// Roda só os passos de MIGRATIONS ainda não aplicados neste banco (controlado por
// PRAGMA user_version), depois garante que toda linha tem um uuid — necessário pra
// sincronizar com o Supabase (ver src/lib/sync.ts).
export async function applyMigrations(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const linha = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const versaoAtual = linha?.user_version ?? 0;

  for (let i = versaoAtual; i < MIGRATIONS.length; i++) {
    await db.execAsync(MIGRATIONS[i]);
  }
  if (versaoAtual < MIGRATIONS.length) {
    await db.execAsync(`PRAGMA user_version = ${MIGRATIONS.length}`);
  }

  await backfillUuids(db);
}

// Linhas criadas antes de a coluna uuid existir (ou antes da sincronização) não têm uuid —
// precisa gerar em JS porque SQLite não tem função de UUID embutida.
async function backfillUuids(db: SQLiteDatabase) {
  for (const tabela of TABELAS_COM_UUID) {
    const semUuid = await db.getAllAsync<{ id: number }>(
      `SELECT id FROM ${tabela} WHERE uuid IS NULL`,
    );
    for (const { id } of semUuid) {
      await db.runAsync(`UPDATE ${tabela} SET uuid = ? WHERE id = ?`, [Crypto.randomUUID(), id]);
    }
  }
}
