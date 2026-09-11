import { useEffect, useState } from 'react';

// Cronômetro derivado de um timestamp real (ISO) — usado no "tempo total" da sessão, que
// precisa continuar certo mesmo se o app foi pro background e voltou (não é um contador que
// zera sozinho, é sempre `agora - iniciada_em`).
export function useElapsedSeconds(desdeIso: string | null) {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    if (!desdeIso) return;
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [desdeIso]);

  if (!desdeIso) return 0;
  return Math.max(0, Math.floor((agora - new Date(desdeIso).getTime()) / 1000));
}

// Cronômetro local de contagem crescente, zerável — usado no timer de intervalo/descanso
// entre séries (não é persistido, é só um apoio visual pro educador durante o treino).
export function useCountUpTimer() {
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return { segundos, zerar: () => setSegundos(0) };
}

export function formatarDuracao(totalSegundos: number) {
  const h = Math.floor(totalSegundos / 3600);
  const m = Math.floor((totalSegundos % 3600) / 60);
  const s = Math.floor(totalSegundos % 60);
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
