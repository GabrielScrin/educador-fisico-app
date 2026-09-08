import { createClient } from '@supabase/supabase-js';

// Cliente Supabase do app (usa só a chave publishable — segura pra embutir no bundle).
// Ainda não conectado a nenhuma tela: o MVP roda 100% local (SQLite, ver src/db).
// Isso fica pronto pra quando entrar sincronização/backup em nuvem ou login.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    'Faltam EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env',
  );
}

export const supabase = createClient(url, publishableKey);
