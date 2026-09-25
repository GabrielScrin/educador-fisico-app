import { supabase } from '@/lib/supabase';

// Manda o áudio gravado (uri local do arquivo) pra Edge Function `transcrever-audio`, que chama a
// API do Gemini no servidor — a chave GEMINI_API_KEY nunca entra no bundle do app.
export async function transcreverAudio(uri: string): Promise<string> {
  const nomeArquivo = uri.split('/').pop() ?? 'nota.m4a';
  const formData = new FormData();
  // No React Native, FormData aceita um objeto { uri, name, type } no lugar de um Blob real —
  // é assim que fetch/FormData sobem um arquivo local em RN (não existe File/Blob de disco aqui,
  // é uma convenção da própria API de rede do RN, não do Expo).
  formData.append('audio', {
    uri,
    name: nomeArquivo,
    type: 'audio/m4a',
  } as unknown as Blob);

  const { data, error } = await supabase.functions.invoke<{ texto?: string; erro?: string }>(
    'transcrever-audio',
    { body: formData },
  );
  if (error) throw new Error(error.message);
  if (data?.erro) throw new Error(data.erro);
  return data?.texto?.trim() ?? '';
}
