import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';

type AuthState = {
  session: Session | null;
  carregando: boolean;
};

const AuthContext = createContext<AuthState>({ session: null, carregando: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Sem .catch() aqui, uma rejeição (ex.: leitura do AsyncStorage falhar) deixava
    // `carregando` travado em true pra sempre — tela em branco sem erro nenhum, achado
    // testando no device físico (ver PASSAGEM_DE_PLANTAO.md).
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch((erro) => console.error('Falha ao carregar sessão salva:', erro))
      .finally(() => setCarregando(false));

    const { data: assinatura } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSession(novaSessao);
    });

    return () => assinatura.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ session, carregando }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
