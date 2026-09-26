// Edge Function que recebe um áudio gravado no app e devolve a transcrição em texto, usando a
// API do Gemini (Google AI Studio, tier gratuito) — o modelo aceita áudio como input direto, sem
// precisar de um serviço de speech-to-text separado. A chave GEMINI_API_KEY nunca vai pro bundle
// do app (não tem prefixo EXPO_PUBLIC_) — só existe aqui, como secret do projeto Supabase.
// Configurar com:
//   supabase secrets set GEMINI_API_KEY=...
//
// A verificação de JWT do Supabase (verify_jwt, ligada por padrão) já garante que só um educador
// logado consegue chamar esta função — não há checagem de auth manual aqui de propósito.
// Alias estável (em vez de fixar uma versão pontual como "gemini-2.0-flash", que a Google
// descontinua com o tempo) — resolve sempre pro Flash mais recente disponível na conta.
const MODELO_GEMINI = 'gemini-flash-latest';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) {
    return Response.json(
      { erro: 'GEMINI_API_KEY não configurada neste projeto Supabase.' },
      { status: 500 },
    );
  }

  // Recebe JSON com o áudio já em base64 (não multipart/form-data) — o cliente RN falhava ao
  // montar um FormData com `{ uri, name, type }` num device físico real ("Failed to send a
  // request to the Edge Function", nunca chegava a sair uma requisição de rede). Gemini já recebe
  // áudio inline como base64 de qualquer forma, então isso elimina uma conversão sem substituir
  // nenhuma outra — ver src/lib/transcricao.ts.
  let corpo: { audioBase64?: unknown };
  try {
    corpo = await req.json();
  } catch {
    return Response.json(
      { erro: 'Corpo inválido — esperado JSON com o campo "audioBase64".' },
      { status: 400 },
    );
  }

  const base64 = corpo.audioBase64;
  if (typeof base64 !== 'string' || base64.length === 0) {
    return Response.json({ erro: 'Campo "audioBase64" ausente ou inválido.' }, { status: 400 });
  }

  async function chamarGemini() {
    return fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODELO_GEMINI}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiApiKey },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Transcreva o áudio a seguir em português do Brasil. Responda apenas com o texto transcrito, sem comentários, sem aspas e sem formatação adicional.',
                },
                { inline_data: { mime_type: 'audio/mp4', data: base64 } },
              ],
            },
          ],
        }),
      },
    );
  }

  // O tier gratuito do Gemini responde 503 "high demand" com alguma frequência (visto repetidas
  // vezes testando em device físico) — uma tentativa extra depois de uma pausa curta resolve a
  // maioria dos casos sem custo perceptível pro educador, que já esperou a gravação processar.
  let respostaGemini = await chamarGemini();
  if (respostaGemini.status === 503) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    respostaGemini = await chamarGemini();
  }

  if (!respostaGemini.ok) {
    const detalhe = await respostaGemini.text();
    return Response.json({ erro: `Falha na transcrição: ${detalhe}` }, { status: 502 });
  }

  const dados = await respostaGemini.json();
  const texto = dados?.candidates?.[0]?.content?.parts?.[0]?.text;
  return Response.json({ texto: typeof texto === 'string' ? texto.trim() : '' });
});
