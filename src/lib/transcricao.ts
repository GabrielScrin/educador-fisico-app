import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

// No navegador o `expo-file-system` não tem implementação de `File` (o stub web só tem o
// construtor), então o áudio gravado (uri blob:) é lido direto como Blob e convertido em base64.
async function lerAudioBase64(uri: string): Promise<string> {
  if (Platform.OS !== 'web') return new File(uri).base64();
  const blob = await (await fetch(uri)).blob();
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onloadend = () => resolve(String(leitor.result).split(',')[1] ?? '');
    leitor.onerror = () => reject(leitor.error ?? new Error('Falha ao ler o áudio'));
    leitor.readAsDataURL(blob);
  });
}

// Manda o áudio gravado (uri local do arquivo) pra Edge Function `transcrever-audio`, que chama a
// API do Gemini no servidor — a chave GEMINI_API_KEY nunca entra no bundle do app.
//
// Envia como base64 num corpo JSON, não `FormData` com `{ uri, name, type }` — essa segunda forma
// (a convenção clássica de upload de arquivo local em RN) falhava em device físico real com
// "Failed to send a request to the Edge Function" antes mesmo de sair uma requisição de rede
// (confirmado testando a function direto via curl, que respondia normal — o problema era só do
// lado do cliente). Base64 num JSON comum é o caminho testado e recomendado pelo supabase-js.
export async function transcreverAudio(uri: string): Promise<string> {
  const base64 = await lerAudioBase64(uri);

  const { data, error } = await supabase.functions.invoke<{ texto?: string; erro?: string }>(
    'transcrever-audio',
    { body: { audioBase64: base64 } },
  );
  if (error) throw new Error(error.message);
  if (data?.erro) throw new Error(data.erro);
  return data?.texto?.trim() ?? '';
}
