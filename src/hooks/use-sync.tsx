import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/hooks/use-auth';
import { sincronizarTudo } from '@/lib/sync';

type EstadoSync = 'ocioso' | 'sincronizando' | 'erro';

type SyncState = {
  estado: EstadoSync;
  ultimaSincronizacao: Date | null;
  erro: string | null;
  sincronizarAgora: () => void;
};

const SyncContext = createContext<SyncState>({
  estado: 'ocioso',
  ultimaSincronizacao: null,
  erro: null,
  sincronizarAgora: () => {},
});

// Dispara sincronização automaticamente ao logar e sempre que o app volta pro primeiro plano —
// além de expor sincronizarAgora() pro botão manual em Ajustes. Nunca mostra "sincronizado" sem
// ter sincronizado de verdade: estado reflete a última chamada real, sucesso ou erro.
export function SyncProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const db = useSQLiteContext();
  const [estado, setEstado] = useState<EstadoSync>('ocioso');
  const [ultimaSincronizacao, setUltimaSincronizacao] = useState<Date | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const emAndamento = useRef(false);

  const sincronizarAgora = useCallback(() => {
    if (!session || emAndamento.current) return;
    emAndamento.current = true;
    setEstado('sincronizando');
    setErro(null);
    sincronizarTudo(db)
      .then(() => {
        setUltimaSincronizacao(new Date());
        setEstado('ocioso');
      })
      .catch((e: Error) => {
        setErro(e.message);
        setEstado('erro');
      })
      .finally(() => {
        emAndamento.current = false;
      });
  }, [session, db]);

  useEffect(() => {
    if (session) sincronizarAgora();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    const assinatura = AppState.addEventListener('change', (proximoEstado) => {
      if (proximoEstado === 'active' && session) sincronizarAgora();
    });
    return () => assinatura.remove();
  }, [session, sincronizarAgora]);

  return (
    <SyncContext.Provider value={{ estado, ultimaSincronizacao, erro, sincronizarAgora }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  return useContext(SyncContext);
}
