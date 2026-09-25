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

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json(
      { erro: 'Corpo inválido — esperado multipart/form-data com o campo "audio".' },
      { status: 400 },
    );
  }

  const arquivo = form.get('audio');
  if (!(arquivo instanceof File)) {
    return Response.json({ erro: 'Campo "audio" ausente ou inválido.' }, { status: 400 });
  }

  // Gemini recebe áudio inline como base64 dentro do corpo JSON (sem upload separado) — suficiente
  // pra uma nota de voz curta, que é o único caso de uso aqui.
  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  let binario = '';
  for (let i = 0; i < bytes.length; i++) binario += String.fromCharCode(bytes[i]);
  const base64 = btoa(binario);

  const respostaGemini = await fetch(
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

  if (!respostaGemini.ok) {
    const detalhe = await respostaGemini.text();
    return Response.json({ erro: `Falha na transcrição: ${detalhe}` }, { status: 502 });
  }

  const dados = await respostaGemini.json();
  const texto = dados?.candidates?.[0]?.content?.parts?.[0]?.text;
  return Response.json({ texto: typeof texto === 'string' ? texto.trim() : '' });
});
