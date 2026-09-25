// Edge Function que recebe um áudio gravado no app e devolve a transcrição em texto, usando a
// API Whisper da OpenAI. A chave OPENAI_API_KEY nunca vai pro bundle do app (não tem prefixo
// EXPO_PUBLIC_) — só existe aqui, como secret do projeto Supabase. Configurar com:
//   supabase secrets set OPENAI_API_KEY=sk-...
//
// A verificação de JWT do Supabase (verify_jwt, ligada por padrão) já garante que só um educador
// logado consegue chamar esta função — não há checagem de auth manual aqui de propósito.
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    return Response.json(
      { erro: 'OPENAI_API_KEY não configurada neste projeto Supabase.' },
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

  const corpoWhisper = new FormData();
  corpoWhisper.append('file', arquivo, arquivo.name || 'nota.m4a');
  corpoWhisper.append('model', 'whisper-1');
  corpoWhisper.append('language', 'pt');

  const respostaWhisper = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiApiKey}` },
    body: corpoWhisper,
  });

  if (!respostaWhisper.ok) {
    const detalhe = await respostaWhisper.text();
    return Response.json({ erro: `Falha na transcrição: ${detalhe}` }, { status: 502 });
  }

  const dados = await respostaWhisper.json();
  return Response.json({ texto: typeof dados.text === 'string' ? dados.text : '' });
});
