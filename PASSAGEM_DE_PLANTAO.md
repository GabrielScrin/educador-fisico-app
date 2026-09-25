# Passagem de plantão — 2026-09-25 (deploy Vercel destravado + FC Bluetooth, voz e conflito de sync)

Nota rápida pra mim mesmo (Claude) na próxima sessão. `ARQUITETURA.md` é a fonte permanente de
verdade (estrutura de código, estado por feature, armadilhas técnicas) e `PRODUTO.md` é a visão
de produto ponta a ponta — este arquivo aqui é só o resumo de trabalho da sessão + as decisões
que valem ser lembradas antes de mexer de novo. Sempre confira os outros dois pro detalhe real.

## O que foi feito hoje

Sessão sem device físico conectado (ambiente remoto/nuvem) — três frentes de código integradas,
mais o deploy web que já tinha ficado pendente da sessão anterior.

**1. Deploy na Vercel — já tinha rolado, faltava só destravar o acesso.** O projeto
`educador-fisico-app` (conta `gabrielscrins-projects`) já tinha 3 deployments de produção
`READY` quando checamos via MCP — o usuário aparentemente disparou o deploy pelo dashboard depois
da sessão anterior. O que faltava: **SSO Protection** ligado por padrão bloqueava qualquer pessoa
sem login na conta Vercel de abrir os domínios `.vercel.app`. Tentei desativar via MCP
(`update_project`) e recebi 403 (sem permissão) — o usuário desativou manualmente no dashboard
(Settings → Deployment Protection). Deploy confirmado acessível.

**2. FC via Bluetooth, transcrição de voz e aviso de conflito de sync — código integrado, NADA
testado em device físico.** Detalhe técnico completo em `ARQUITETURA.md` (seções com data
2026-09-25). Resumo:
- **FC Bluetooth**: `react-native-ble-plx`, perfil BLE padrão "Heart Rate" (0x180D/0x2A37) —
  funciona com qualquer monitor que anuncie esse serviço. UI integrada no modal de FC existente
  em `sessao/[id].tsx`. Escondido de propósito na versão web (lib é só nativa).
- **Transcrição de voz**: `expo-audio` grava, uma Edge Function nova no Supabase
  (`transcrever-audio`) chama a API Whisper da OpenAI com a chave só no servidor. Botão de
  microfone integrado no modal de Nota.
- **Conflito de sync**: `sincronizarTudo()` agora detecta (comparando `atualizado_em` remoto
  contra `sincronizado_em` local) quando um push está sobrescrevendo uma linha que foi editada em
  outro aparelho entre dois syncs — continua sendo last-write-wins, mas agora avisa na aba
  Ajustes em vez de sobrescrever em silêncio.

Validação feita nesta sessão (sem device): `tsc --noEmit`, `expo lint` (inclui regras do React
Compiler), e `expo export --platform android` **e** `--platform web` (bundle completo, sem
instalar em nada). Tudo passou limpo. Isso **não substitui teste real** — é só a garantia mínima
de que compila e não quebra regra conhecida (mesma régua do resto do projeto).

## O que NÃO foi feito / ficou pendente

- **Nenhuma das 3 features novas foi testada em device físico.** BLE e áudio são módulos
  nativos — o dev client atual não tem eles compilados, precisa gerar uma build EAS nova antes de
  conseguir testar (mesmo motivo que já apareceu nas sessões de login/sync). Sem isso, "código
  integrado" não é "funciona de verdade" — não afirmar que está pronto até rodar num aparelho
  real.
- **`OPENAI_API_KEY` nunca foi criada nem configurada — e não dá pra fazer isso por esta
  sessão.** A Edge Function `transcrever-audio` existe no repo mas **não foi deployada**
  (`supabase functions deploy transcrever-audio`) nem tem a secret configurada (`supabase secrets
  set OPENAI_API_KEY=sk-...`). Sem os dois passos, a transcrição sempre vai falhar com erro 500.
  Duas descobertas desta sessão, importantes pra próxima:
  1. O usuário colou uma chave real da OpenAI direto no chat. **Não usei essa chave em nenhum
     comando/arquivo** (nunca foi escrita no repo, nunca chamei nada com ela) — só orientei o
     usuário a revogá-la no dashboard da OpenAI e gerar outra, porque uma chave que passa por
     texto de chat não deve seguir pra produção. Se aparecer outra chave colada em texto puro
     numa sessão futura, mesma régua: não gravar em arquivo, não ecoar de volta, recomendar
     rotação.
  2. O conector MCP do Supabase disponível nesta sessão **não é o projeto do app**
     (`apyfxpegxjfgznmfvqzq`) — é uma organização/conta diferente (projetos vistos via MCP:
     `cr8`, `CR8 - New`, `WeCRM`, `Sheets 8 Engage`). E o MCP do Supabase, de qualquer forma, não
     tem nenhuma tool pra configurar secret de Edge Function (só migração/deploy/queries). A CLI
     também não está instalada neste ambiente remoto (`supabase: command not found`). Ou seja:
     **configurar a secret e deployar a function só é possível na máquina do usuário**, onde o
     projeto já está linkado (sessão de setup anterior) — não tem caminho por aqui.
- **Editar/excluir cliente/sessão/leitura em device físico** — continua pendente de sessões
  anteriores, não tocado hoje.
- **Merge de campo a campo no sync multi-dispositivo** — decisão explícita de não fazer agora
  (o usuário escolheu "LWW com aviso visível" em vez de merge completo, ver pergunta feita no
  início da sessão). Só reconsiderar se o usuário pedir de novo.
- **`docs.expo.dev` estava bloqueado pela política de rede deste ambiente** (sessão na nuvem).
  Consegui confirmar as APIs reais de `expo-audio` e do plugin do `react-native-ble-plx` mesmo
  assim, via `raw.githubusercontent.com/expo/expo` (mesmo `.mdx` que gera a doc oficial) e via
  tarball do npm (`registry.npmjs.org`) — técnica documentada em `ARQUITETURA.md` →
  "Armadilhas conhecidas" → "`docs.expo.dev` pode estar bloqueado...". Não preciso mais pedir pro
  usuário liberar rede se isso acontecer de novo.

## Decisões e o porquê

- **FC Bluetooth não grava cada notificação BLE sozinha no banco** — o educador continua
  decidindo quando registrar (toque explícito em "usar bpm ao vivo"), igual às outras escalas.
  Consistente com o resto do produto (nenhuma leitura é automática/contínua).
- **Transcrição de voz via Edge Function, não direto do app pra OpenAI** — a chave da API nunca
  pode entrar no bundle (qualquer `EXPO_PUBLIC_*` é pública). A Edge Function do Supabase já
  existe como conceito no projeto (auth/sync), reusar a mesma infra em vez de introduzir um
  backend novo.
- **Whisper (`whisper-1`), não `gpt-4o-transcribe`** — o usuário pediu especificamente "OpenAI
  Whisper API" na pergunta feita no início da sessão; `whisper-1` ainda é um modelo válido da API
  (confirmado no OpenAPI spec oficial da OpenAI). Trocar pra `gpt-4o-transcribe` é uma troca de
  uma linha na Edge Function, se quiser qualidade maior depois.
- **Sync: aviso de conflito, não merge de campo a campo** — escolha do usuário, ver pergunta no
  início da sessão. Mantém a lógica simples e testável.

## O que falta (ordem que o usuário pediu, dos gaps do MVP)

1. ~~Sincronização~~ — testado ponta a ponta, funcionando. Aviso de conflito adicionado hoje
   (código, não testado com 2 aparelhos reais).
2. ~~Login~~ — testado ponta a ponta, funcionando.
3. **FC via Bluetooth** — código integrado hoje, **falta testar em device físico** (build EAS
   nova + monitor BLE real).
4. **Editar/excluir cliente, sessão ou leitura** — código integrado numa sessão anterior
   (2026-09-15), ainda não testado especificamente em device físico.
5. **Transcrição de voz na nota** — código integrado hoje, **falta**: configurar
   `OPENAI_API_KEY`, deployar a Edge Function, testar em device físico (build EAS nova).
6. **Multi-dispositivo** — sync roda e agora avisa de conflito; falta testar com 2 aparelhos
   físicos de verdade.

Fora da lista de gaps do MVP: **deploy web na Vercel** — resolvido hoje (deploy ativo, SSO
Protection desativado pelo usuário).

## Ver também

`ARQUITETURA.md` (técnico — seções "FC via Bluetooth", "Transcrição de voz na nota",
"Multi-dispositivo — aviso de conflito de sync", mais as 2 armadilhas novas desta sessão),
`PRODUTO.md` (produto/fluxo completo, tabela de gaps atualizada).
