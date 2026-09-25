# Passagem de plantão — 2026-09-25 (merge da branch de nuvem + troca Whisper→Gemini + deploy real)

Nota rápida pra mim mesmo (Claude) na próxima sessão. `ARQUITETURA.md` é a fonte permanente de
verdade (estrutura de código, estado por feature, armadilhas técnicas) e `PRODUTO.md` é a visão
de produto ponta a ponta — este arquivo aqui é só o resumo de trabalho da sessão + as decisões
que valem ser lembradas antes de mexer de novo. Sempre confira os outros dois pro detalhe real.

## O que foi feito hoje

Sessão no terminal (mesmo dia da sessão de nuvem anterior, `claude/tender-bell-0d9q88`), pra
fechar o que ficou pendente lá e realmente ativar o que só tinha ficado como código.

**1. Merge da branch de nuvem pra `main`.** A sessão remota (sem device conectado) tinha commitado
FC via Bluetooth, transcrição de voz e aviso de conflito de sync numa branch separada, sem abrir
PR. Merge direto (`git merge`, sem conflitos — nenhum arquivo tocado nos dois lados), `npm install`
pras dependências novas (`expo-audio`, `react-native-ble-plx`).

**2. Transcrição de voz trocada de Whisper (OpenAI) pra Gemini.** Decisão do usuário no meio da
sessão — Gemini tem tier gratuito e aceita áudio como input direto. Reescrevi
`supabase/functions/transcrever-audio/index.ts`: converte o áudio pra base64 e chama
`generateContent` do modelo `gemini-flash-latest` (alias estável — testei em produção e
`gemini-2.0-flash`, que a branch original usava como equivalente da OpenAI, **já tinha sido
descontinuado pela Google**; a API já devolve a recomendação do substituto no erro 404). Mesmo
contrato de resposta (`{ texto }` / `{ erro }`), então `src/lib/transcricao.ts` não mudou de
lógica, só o comentário.

**3. Configuração real no Supabase — feita, não só documentada.** O usuário mandou a API key do
Gemini (`aistudio.google.com/apikey`) no chat. Testei a chave direto contra a API do Gemini antes
de configurar qualquer coisa (`gemini-flash-latest` respondeu 200). Depois:
   - `supabase secrets set GEMINI_API_KEY=...` no projeto certo (`apyfxpegxjfgznmfvqzq`,
     "arcoalianca's Project") — **armadilha nova**: o ambiente tinha uma env var
     `SUPABASE_ACCESS_TOKEN` de sandbox apontando pra uma conta Supabase diferente (sem o projeto
     do app); o CLI usa essa env var por padrão em vez da sessão de `supabase login` já salva
     nesta máquina. Precisei rodar com `env -u SUPABASE_ACCESS_TOKEN` na frente de todo comando
     `supabase` pra usar a sessão certa. Ver `ARQUITETURA.md` → "Armadilhas conhecidas".
   - `supabase functions deploy transcrever-audio --project-ref apyfxpegxjfgznmfvqzq` — deployada
     de verdade (não só existia no repo).
   - Também descobri que a sessão de `supabase login` local consegue `projects list` e
     `secrets set`/`functions deploy` com `--project-ref`, mas **não** consegue `supabase link`
     nesse projeto (403 "não tem privilégios") — usar sempre `--project-ref` direto nos comandos,
     não depender de link.

**4. Confirmei o deploy web na Vercel de verdade** (não só "projeto existe"): `GET
https://educador-fisico-app.vercel.app/` → `200`. Link pra mandar pro time:
**https://educador-fisico-app.vercel.app**

**5. Segurança**: commitei separado um `.gitignore` que já estava pendente de sessão anterior
(`.vercel`, `.env*`) — não tinha sido commitado ainda.

Validação: `tsc --noEmit` e `expo lint` limpos depois do merge + reescrita da function.

## O que NÃO foi feito / ficou pendente

- **Nenhuma feature nova testada em device físico ainda** (FC Bluetooth, transcrição de voz,
  aviso de conflito de sync) — precisa de build EAS nova (BLE e áudio são módulos nativos, o dev
  client atual não tem eles compilados). Mesmo aviso de sempre: "código integrado e deployado" não
  é "funciona de verdade" até rodar num aparelho real.
- **Chamada real da Edge Function não testada ponta a ponta** — validei a chave do Gemini direto
  contra a API do Gemini (fora do Supabase) e confirmei que a function foi deployada, mas não
  cheguei a invocar `transcrever-audio` já deployada com um JWT de usuário real + áudio de
  verdade (isso só é possível de fato pelo app rodando em device, com o educador logado).
- **Editar/excluir cliente/sessão/leitura em device físico** — continua pendente de sessões
  anteriores, não tocado hoje.
- **Merge de campo a campo no sync multi-dispositivo** — decisão explícita de não fazer (usuário
  escolheu "LWW com aviso visível" numa sessão anterior).

## Decisões e o porquê

- **Gemini em vez de Whisper/OpenAI** — pedido explícito do usuário no meio da sessão, pela
  gratuidade do tier. Ver comentário em `supabase/functions/transcrever-audio/index.ts`.
- **`gemini-flash-latest` (alias) em vez de fixar `gemini-3.8-flash`** — pra não repetir o mesmo
  problema que já aconteceu com `gemini-2.0-flash` (descontinuado) na primeira tentativa desta
  mesma sessão.
- **Testar a chave de API direto antes de configurar como secret** — evita descobrir só depois,
  em device físico, que a chave está errada ou o modelo mudou de novo.

## O que falta (ordem que o usuário pediu, dos gaps do MVP)

1. ~~Sincronização~~ — testado ponta a ponta, funcionando. Aviso de conflito adicionado
   (código, deployado, não testado com 2 aparelhos reais).
2. ~~Login~~ — testado ponta a ponta, funcionando.
3. **FC via Bluetooth** — código integrado e mergeado, **falta testar em device físico** (build
   EAS nova + monitor BLE real).
4. **Editar/excluir cliente, sessão ou leitura** — código integrado numa sessão anterior
   (2026-09-15), ainda não testado especificamente em device físico.
5. **Transcrição de voz na nota** — código integrado, Gemini configurado e function deployada de
   verdade nesta sessão. **Falta**: testar em device físico (build EAS nova).
6. **Multi-dispositivo** — sync roda e avisa de conflito; falta testar com 2 aparelhos físicos de
   verdade.

Fora da lista de gaps do MVP: **deploy web na Vercel** — confirmado ativo e acessível
(https://educador-fisico-app.vercel.app).

## Ver também

`ARQUITETURA.md` (técnico — seção "Transcrição de voz na nota" atualizada pra Gemini, mais a
armadilha nova do `SUPABASE_ACCESS_TOKEN` de sandbox), `PRODUTO.md` (produto/fluxo completo,
tabela de gaps atualizada).
