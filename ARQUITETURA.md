# Educador Físico — arquitetura e estado do projeto

App mobile Expo/React Native + TypeScript pra educadores físicos registrarem, em tempo real
durante o treino, as escalas de Borg CR10, OMNI-RES e dor (NPRS) por cliente. A visão de produto
completa (pra quem é, fluxo ponta a ponta, o que falta) está em `PRODUTO.md` — este arquivo aqui
é o complemento técnico: onde as coisas estão, por que estão organizadas assim, e as armadilhas
já resolvidas. Os dois se referenciam. Pra histórico de sessão a sessão (o que foi feito, o que
falta, decisões recentes), ver `PASSAGEM_DE_PLANTAO.md`.

## Onde as coisas estão

- Repositório único: `G:\dev\educador-fisico-app` (Windows). Sem monorepo, sem pacotes
  separados.
- Backend: projeto Supabase `apyfxpegxjfgznmfvqzq` (ver `SETUP.md`) — login (e-mail/senha) e
  sincronização de clientes/sessões/leituras foram implementados em código em 2026-09-20; a
  migração remota (tabelas + RLS) foi aplicada e validada em 2026-09-21. SQLite local continua
  sendo a fonte primária de dados em qualquer cenário.
- Conteúdo clínico das escalas (`src/constants/scales.ts`) vem de material de referência do
  educador físico Rafael de Souza Iyama (CREF 010255) — fonte externa ao código, citada no
  comentário do próprio arquivo. Se um valor for revisado, é o Rafael quem revisa, não uma
  decisão de engenharia.
- Design visual: origem no projeto Stitch "Design de App Premium" (telas de referência
  "Sessão Ativa V3 Plus", "Clientes & Início Rápido", "Prontuário & Evolução", "Seletor em
  Tela Cheia", "Resumo & Fechamento de Treino", "Escalas de Referência"). O design foi portado
  pro código com funcionalidade real por trás — ver seção de decisões abaixo.
- Build web (PWA) desde 2026-09-21, pra dar link de preview pro time — ver seção "Web/PWA"
  abaixo. Deploy pensado pra Vercel (`vercel.json` já no repo); conectar o projeto ao GitHub no
  dashboard da Vercel ainda é passo manual do usuário.

## Estrutura de código

```
src/
  app/                       # rotas (expo-router, file-based)
    (auth)/                  # grupo de login — só alcançável sem sessão (Stack.Protected)
      _layout.tsx             # Stack simples (login + cadastro)
      login.tsx                # e-mail/senha via Supabase Auth
      cadastro.tsx              # signUp + aviso de confirmação de e-mail se necessário
    (tabs)/                  # grupo de abas — barra de navegação inferior
      _layout.tsx            # define as 4 abas + ícones + estilo da tab bar
      index.tsx               # aba "Clientes" (lista, busca, filtros)
      treino-ativo.tsx        # aba "Treino ativo" (sessões com finalizada_em NULL)
      evolucao.tsx             # aba "Evolução" (telemetria agregada do consultório)
      ajustes.tsx              # aba "Ajustes" (conta/logout, status real de sync, atribuição clínica)
    cliente/
      novo.tsx                # modal de cadastro — fora do grupo de abas de propósito
      [id].tsx                 # prontuário do cliente — tela cheia, sem tab bar
    sessao/
      [id].tsx                 # sessão ao vivo — tela cheia, gestureEnabled:false
      [id]/resumo.tsx           # fechamento/consolidação da sessão
    escalas.tsx                # consulta de referência das 3 escalas (sem registro)
    _layout.tsx                # Stack raiz: fontes, migrations, AuthProvider/SyncProvider, guard de sessão
  components/                # componentes de UI compartilhados (ver tabela abaixo)
  constants/
    theme.ts                  # tokens de cor/espaçamento/raio — fonte única do design system
    scales.ts                  # conteúdo clínico das 3 escalas (Borg/OMNI/Dor)
  hooks/
    use-theme.ts               # sempre retorna o tema escuro (app é dark-only, ver abaixo)
    use-elapsed-timer.ts        # timers "ao vivo" — único jeito seguro de usar Date.now() aqui
    use-auth.tsx                # contexto da sessão Supabase (session, carregando)
    use-sync.tsx                 # dispara/expõe estado da sincronização (ver seção abaixo)
  db/
    schema.ts                   # migrations SQLite versionadas (clientes/sessoes/leituras + uuid/sync)
    migrate.ts                   # roda MIGRATIONS por PRAGMA user_version + backfill de uuid
    queries.ts                   # toda a camada de acesso a dados — nenhuma tela faz SQL direto
  lib/
    supabase.ts                  # client Supabase, sessão persistida via AsyncStorage
    sync.ts                       # push/pull de clientes/sessoes/leituras (ver seção abaixo)
```

Por que `cliente/[id]`, `sessao/[id]` e `escalas` ficam **fora** do grupo `(tabs)`: são telas de
drill-down/tela-cheia (o educador está no meio de um treino ou olhando o prontuário de um
cliente específico) — mostrar a tab bar ali tiraria espaço vertical exatamente na hora que mais
importa números grandes e alvos de toque generosos. O Stack raiz (`_layout.tsx`) empilha essas
telas por cima do grupo de abas, escondendo a tab bar automaticamente.

## Estado por feature/módulo

| Feature | Status | Nota |
|---|---|---|
| Cadastro/lista de clientes | ✅ | Busca + filtros (Hoje/Todos/Alerta de dor) |
| Sessão ao vivo (Borg/OMNI/Dor/FC) | ✅ | Timer de sessão + timer de intervalo, telemetria e curva de esforço reais |
| Fechamento de sessão | ✅ | Tela de resumo própria (`sessao/[id]/resumo.tsx`), com compartilhamento via WhatsApp |
| Nota da sessão | ✅ | Salva como rascunho ao digitar (`atualizarNotaSessao`), não só no fim |
| Prontuário do cliente | ✅ | Histórico expansível + gráfico de evolução (OMNI) + resumo agregado |
| Aba Treino ativo | ✅ | Sessões em andamento de qualquer cliente, pra retomar |
| Aba Evolução | ✅ | Agregado do consultório (sessões na semana, ativos no mês, alertas de dor) |
| Aba Ajustes | ✅ | Conta (e-mail logado, sair), status real de sincronização, atribuição clínica |
| Escalas de referência (consulta livre) | ✅ | `/escalas`, fora do fluxo de registro |
| Login / identificação do educador | ✅ | E-mail/senha via Supabase Auth, testado ponta a ponta em device físico (cadastro + login + guard de rota) em 2026-09-21 |
| Sync com Supabase | ✅ | Push+pull por uuid, migração remota aplicada e testada ponta a ponta em device físico em 2026-09-21 (dados confirmados nas 3 tabelas remotas) |
| Build web / PWA | ✅ | Renderiza e builda certo, instalável (manifest + service worker), **em deploy ativo na Vercel** (`educador-fisico-app.vercel.app`, deploy automático a cada push) |
| FC via Bluetooth | 🟡 | Código integrado (`react-native-ble-plx`, perfil BLE padrão "Heart Rate" 0x180D) — **não testado em device físico**, exige build EAS nova (módulo nativo) |
| Editar/excluir cliente, sessão ou leitura | ✅ | Cliente: editar/excluir; sessão: editar nota/excluir; leitura: editar durante sessão e excluir |
| Transcrição de voz na nota | 🟡 | Código integrado (`expo-audio` + Gemini via Edge Function no Supabase) — **não testado em device físico**, exige `GEMINI_API_KEY` configurada como secret do projeto e build EAS nova (módulo nativo) |
| Multi-dispositivo (2º aparelho do mesmo educador) | 🟡 | Sync continua last-write-wins (sem merge de campo), mas agora detecta e avisa (aba Ajustes) quando um push sobrescreveu uma linha editada em outro aparelho entre dois syncs |

_Atualizado na sessão de 2026-09-25 (deploy Vercel destravado, FC via Bluetooth, transcrição de voz e aviso de conflito de sync — código integrado, device físico pendente; ver seções abaixo)._ Sessões anteriores: 2026-09-21 (login+sync testados ponta a ponta em device físico, 3 bugs reais corrigidos, build web/PWA nova), 2026-09-20 (login+sync, código), 2026-09-15 (CRUD), 2026-09-10 (reskin "Clinical High-Contrast Dark" + navegação em abas).

## Autenticação e sincronização (testado ponta a ponta em device físico, 2026-09-21)

Implementado na sessão de 2026-09-20, escolha do usuário: login por e-mail/senha (Supabase Auth),
sincronização como *backup* — SQLite local continua sendo a fonte primária, a nuvem existe pra
não perder dados se o aparelho quebrar/for trocado, e serve de base pro gap "multi-dispositivo"
do `PRODUTO.md` mais adiante.

**Autenticação**
- `src/lib/supabase.ts` — client configurado com `persistSession: true` + `storage: AsyncStorage`
  (RN não tem `localStorage`, é preciso apontar explicitamente ou a sessão não sobrevive a um
  restart do app).
- `src/hooks/use-auth.tsx` — `AuthProvider`/`useAuth()`, lê `supabase.auth.getSession()` uma vez
  e escuta `onAuthStateChange` daí em diante.
- `src/app/_layout.tsx` — guard de rota via `<Stack.Protected guard={!!session}>` /
  `guard={!session}` (API nativa do expo-router nesta versão, confirmado em
  `node_modules/expo-router/build/views/Protected.js` antes de usar — ver `AGENTS.md`, a versão
  do Expo muda rápido). Splash screen só esconde quando fontes **e** sessão de auth estão prontos
  (evita piscar a tela de login por uma fração de segundo pra quem já tá logado).
- `src/app/(auth)/login.tsx` e `cadastro.tsx` — formulário simples, mensagens de erro do Supabase
  traduzidas pros casos comuns (credenciais inválidas, e-mail não confirmado, já cadastrado).

**Sincronização** (`src/lib/sync.ts`, orquestrado por `src/hooks/use-sync.tsx`)
- Cada linha local (clientes/sessoes/leituras) ganhou 3 colunas novas: `uuid` (identidade
  estável entre local e nuvem — o `id` remoto É esse uuid, não um serial novo), `atualizado_em`
  (carimbo de toda escrita) e `sincronizado_em` (até onde já foi enviado). Pendente de envio =
  `sincronizado_em IS NULL OR sincronizado_em < atualizado_em`.
- **Push**: por tabela, na ordem clientes → sessões → leituras (FK depende disso), upsert por
  uuid no Supabase, depois marca `sincronizado_em`.
- **Pull**: busca tudo que a RLS deixa ver (`educador_id = auth.uid()`), insere localmente o que
  ainda não existe por `uuid` (resolvendo `cliente_id`/`sessao_id` remotos, que são uuid, pro id
  local INTEGER correspondente).
- **Dispara automaticamente** ao logar e sempre que o app volta pro foreground
  (`AppState.addEventListener('change', ...)`), mais o botão manual "Sincronizar agora" na aba
  Ajustes — que também é o único lugar que mostra o estado real (nunca "sincronizado" sem ter
  sincronizado: estado vem de uma chamada real, sucesso ou erro, nunca hardcoded).
- **Limitação conhecida, documentada de propósito**: não há merge de conflito — se a mesma linha
  for editada em dois aparelhos entre dois syncs, o último push vence sem aviso. Aceitável hoje
  (uso single-device); vira relevante quando o gap "multi-dispositivo" for endereçado de verdade.

**Schema remoto** (SQL em `remote_migration.sql`, aplicado em 2026-09-21): tabelas
`clientes`/`sessoes`/`leituras` no schema `public`, PK `id uuid` (mesmo valor do `uuid` local),
`educador_id uuid references auth.users(id) default auth.uid()`, RLS habilitado com policy
`educador_id = auth.uid()` pra tudo (select/insert/update/delete). A aplicação foi validada no
banco conferindo tabelas, RLS, policies, índices e grants do papel `authenticated`.

**Teste ponta a ponta em device físico (2026-09-21)**: cadastro de conta nova (e-mail/senha),
login, e sync confirmados rodando de verdade — inclusive consultando as 3 tabelas remotas via
API depois do sync pra confirmar que os dados (1 cliente + 2 sessões + 3 leituras pré-existentes
no SQLite local) chegaram certos, com `educador_id`/FKs corretos. Esse teste encontrou e corrigiu
3 bugs reais que só apareciam rodando de verdade (nenhum pego por `tsc`/lint) — ver "Armadilhas
conhecidas" abaixo: `SQLiteProvider` memoizado travando `fontsLoaded`, `getSession()` sem
`.catch()` travando a tela em branco, e `atualizado_em` nulo em linhas antigas quebrando o push.

## Web/PWA (2026-09-21, deploy destravado em 2026-09-25)

Pedido do usuário: uma versão web pra mandar link de preview pro time. `expo-sqlite` tem suporte
a web em alpha — três peças precisaram ser configuradas do zero pra funcionar (detalhe completo
com sintoma/causa/fix em "Armadilhas conhecidas" → "`expo-sqlite` no target `web`"):

1. `metro.config.js` (novo, o projeto não tinha) — `.wasm` como asset resolvível +
   `Cross-Origin-Opener-Policy`/`Cross-Origin-Embedder-Policy` no dev server.
2. `app.json` → `web.output: "single"` (SPA, não `"static"`/SSG — o client do Supabase toca
   `window` na inicialização, o que quebra pré-renderização em Node).
3. PWA de verdade, não só "roda no browser": `public/manifest.json` (nome, ícone, `display:
   standalone`, cores do tema), `public/sw.js` (service worker simples — cacheia o shell da app
   pra abrir mais rápido em visitas repetidas, **não garante uso offline completo**: SQLite via
   wasm e sync continuam precisando de rede) e `src/lib/pwa-web.ts` (injeta as tags de PWA —
   manifest, theme-color, ícone pro iOS — em runtime, porque `+html.tsx` do expo-router não é
   aplicado no modo `"single"`).

**Deploy**: `vercel.json` já no repo (build command, output directory, os mesmos cabeçalhos
COOP/COEP pra produção, rewrite de SPA pra toda rota cair em `index.html`). O usuário conectou o
repositório pelo dashboard da Vercel (Import Git Repository) — projeto `educador-fisico-app` na
conta `gabrielscrins-projects`, deploy automático a cada push pra `main`. **Confirmado rodando em
2026-09-25** via MCP da Vercel: 3 deployments de produção `READY`, domínio
`educador-fisico-app.vercel.app` ativo. O projeto veio com **SSO Protection** ligado por padrão
(exige login na conta Vercel pra abrir os domínios `.vercel.app` que não são domínio customizado)
— desativado manualmente pelo usuário no dashboard (Settings → Deployment Protection), porque a
ferramenta MCP `update_project` retornou 403 (sem permissão) ao tentar mudar essa config via API
nesta sessão. A ferramenta MCP `create_project` da Vercel também se mostrou quebrada numa sessão
anterior (`"missing required property name"`) — não relevante agora que o projeto já existe, mas
não usar de novo sem revalidar se foi corrigida.

## FC via Bluetooth (2026-09-25, código integrado — não testado em device físico)

Usa o perfil BLE padrão **"Heart Rate"** (Bluetooth SIG, serviço `0x180D` / característica de
medição `0x2A37`) — funciona com qualquer monitor que anuncie esse serviço (Polar, Garmin, cintas
genéricas), sem código específico de marca.

- `src/lib/ble.ts` — `BleManager` (singleton, criado só na primeira chamada), permissões em
  runtime (`solicitarPermissoesBluetooth`: Android 12+ pede `BLUETOOTH_SCAN`/`BLUETOOTH_CONNECT`,
  Android mais antigo pede `ACCESS_FINE_LOCATION` — exigência do próprio Android pra escanear
  BLE, não da lib) e o decodificador do valor de bpm (formato fixo da spec Bluetooth: byte 0 são
  flags, bit 0 diz se o valor vem em 1 ou 2 bytes).
- `src/hooks/use-heart-rate-monitor.ts` — hook com máquina de estado
  (`desconectado`/`procurando`/`conectando`/`conectado`/`erro`), expõe `iniciarScan`, `conectar`,
  `desconectar`, `dispositivos` (lista achada no scan) e `bpm` (atualiza a cada notificação BLE).
- `src/app/sessao/[id].tsx` — UI dentro do modal de FC: procurar → listar dispositivos → conectar
  → bpm ao vivo com um botão explícito "toque para usar X bpm" (o registro em si continua sendo
  um instante escolhido pelo educador, igual às outras escalas — não grava cada notificação BLE
  sozinha no banco). **Escondido de propósito quando `Platform.OS === 'web'`**:
  `react-native-ble-plx` é só nativo, não tem implementação web.
- **Config plugin** (`app.json` → `plugins`): `["react-native-ble-plx", { isBackgroundEnabled:
  false, neverForLocation: true, bluetoothAlwaysPermission: "..." }]`. Confirmado lendo o código
  fonte real do plugin (não só o README) — ele já injeta sozinho no manifest/Info.plist:
  `BLUETOOTH`, `BLUETOOTH_ADMIN`, `BLUETOOTH_CONNECT`, `BLUETOOTH_SCAN`,
  `ACCESS_COARSE_LOCATION`/`ACCESS_FINE_LOCATION` (Android) e `NSBluetoothAlwaysUsageDescription`
  (iOS) — não precisa (nem deve) declarar essas permissões manualmente em outro lugar.
- **Pendente antes de considerar pronto**: exige módulo nativo → build EAS nova (o dev client
  atual não tem `react-native-ble-plx` compilado) → testar com um monitor BLE real em device
  físico. Sem isso, é código que compila e builda mas nunca rodou de verdade — mesma régua do
  resto do projeto (ver "Verificação visual real via screenshot por `adb`" abaixo).

## Transcrição de voz na nota (2026-09-25, código integrado — não testado em device físico)

Grava áudio local (`expo-audio`) e manda pra transcrição via **Gemini** (Google AI Studio, tier
gratuito), chamado de uma Edge Function no Supabase — a chave da API (`GEMINI_API_KEY`) nunca
entra no bundle do app (diferença importante de qualquer variável `EXPO_PUBLIC_*`, que é embutida
no bundle e portanto pública). Trocado de Whisper (OpenAI) pra Gemini na sessão de 2026-09-25 —
decisão do usuário, tier gratuito do Gemini cobre o volume esperado (nota de voz avulsa, não uso
em massa).

- `supabase/functions/transcrever-audio/index.ts` — recebe `multipart/form-data` (campo
  `audio`), converte pra base64 e encaminha pra `POST
  https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`
  (áudio como `inline_data`, mime `audio/mp4` — container real de um `.m4a`) usando a secret do
  servidor, devolve `{ texto }`. `gemini-flash-latest` é um alias estável (não uma versão pontual
  tipo `gemini-2.0-flash`, que a Google já descontinuou uma vez neste projeto) — resolve pro Flash
  mais recente disponível na conta, hoje `gemini-3.8-flash`. A verificação de JWT do Supabase
  (`verify_jwt`, ligada por padrão — não desligada em `config.toml`) já garante que só um educador
  logado consegue chamar essa função; não há checagem de auth manual no código da function de
  propósito.
- `src/lib/transcricao.ts` — monta o `FormData` com o arquivo local (padrão do React Native: um
  objeto `{ uri, name, type }` no lugar de um `Blob` de verdade, porque não existe filesystem de
  Blob em RN) e chama `supabase.functions.invoke('transcrever-audio', { body: formData })` — o
  `Authorization` com o JWT do usuário logado é anexado automaticamente pelo supabase-js.
- `src/app/sessao/[id].tsx` — botão de microfone no modal de Nota (`useAudioRecorder`,
  `useAudioRecorderState` de `expo-audio`), grava → transcreve → concatena o texto na nota
  existente (nunca substitui o que já tinha sido escrito).
- **Config plugin** (`app.json` → `plugins`): `["expo-audio", { microphonePermission: "..." }]`.
- **Pendente antes de considerar pronto**:
  1. **Configurar a secret no Supabase** — `supabase secrets set GEMINI_API_KEY=...` (chave do
     Google AI Studio, tier gratuito; sem isso a function responde erro 500).
  2. **Deploy da function** — `supabase functions deploy transcrever-audio` (ainda não deployada).
  3. Build EAS nova (mesmo motivo do BLE — `expo-audio` grava via módulo nativo) e teste em device
     físico com custo real de API.

## Multi-dispositivo — aviso de conflito de sync (2026-09-25)

Continua sendo **last-write-wins** (decisão deliberada, não um merge de campo a campo — ver
`src/lib/sync.ts`). O que mudou: antes de cada push, `contarConflitos()` compara, por linha
pendente de envio, o `sincronizado_em` deste aparelho (até onde ele sabe que já sincronizou)
contra o `atualizado_em` que está na nuvem agora. Se a nuvem tem uma versão mais nova que este
aparelho nunca viu — e não é a própria versão que ele está enviando agora —, outro aparelho editou
a mesma linha nesse intervalo: é um conflito real. O push continua acontecendo (LWW não muda), mas
o conflito é contado e devolvido em `ResultadoSincronizacao.conflitos`, exposto por `useSync()` e
mostrado como aviso na aba Ajustes (nunca silencioso). Não testado com dois aparelhos reais ainda
— a lógica foi validada só por leitura de código e typecheck.

## Armadilhas conhecidas

### Telas web esticando full-bleed numa janela larga de desktop ("distorcido")

- **Sintoma**: reportado pelo usuário em produção — na versão web (Vercel), qualquer tela (login,
  Clientes, etc.) esticava pra largura inteira da janela do navegador, com campos de busca, cards e
  botões gigantes numa tela de desktop larga.
- **Causa raiz**: toda tela do app é desenhada edge-to-edge (sem `maxWidth`, tudo `flex: 1`/`100%`)
  porque o app é feito pra rodar num celular — correto pra native, mas sem nenhum limite de largura
  a mesma tela ocupa o viewport inteiro do navegador num monitor.
- **Fix**: `src/app/_layout.tsx` agora envolve o `<Stack>` inteiro (dentro de `RootNavigator`) numa
  `View` que, só na web (`Platform.select`), limita a `maxWidth: 480` e centraliza
  (`alignSelf: 'center'`), dentro de outra `View` de fundo escuro (`Colors.dark.background`) que
  preenche a largura toda — sem isso apareceria o branco padrão do `<body>` nas laterais. Um único
  ponto de mudança cobre todas as telas (login, tabs, modais roteados) porque todas passam pelo
  mesmo `Stack`; `Modal` nativo (FC, Nota) não é afetado porque escapa via portal pro `<body>` na
  web, fora dessa árvore. Zero efeito nativo — `maxWidth: 480` nunca é atingido na largura real de
  um celular.
- **Como testar sem mexer em dado real**: pra reproduzir telas autenticadas sem usar a conta real
  do usuário, criar um usuário descartável já confirmado via Admin API do Supabase
  (`POST .../auth/v1/admin/users` com `email_confirm: true`, usando `SUPABASE_SECRET_KEY` do
  `.env`) — evita o passo de confirmação de e-mail que bloqueia `signUp` normal. Sempre deletar o
  usuário de teste depois (`DELETE .../auth/v1/admin/users/<id>`).

### `docs.expo.dev` pode estar bloqueado no ambiente de execução — GitHub raw/npm registry como alternativa

- **Contexto**: o `AGENTS.md` pede pra sempre confirmar contra a doc exata da versão do Expo antes
  de codar (já teve um caso de alucinação de doc numa sessão anterior). Em ambientes com política
  de rede restrita (ex.: sessão na nuvem do Claude Code), `docs.expo.dev` pode estar bloqueado
  enquanto `raw.githubusercontent.com` e `registry.npmjs.org` continuam liberados.
- **Fix**: os mesmos arquivos `.mdx` que geram a doc oficial existem no repositório
  `expo/expo` (branch `main`), em `docs/pages/versions/vX.Y.Z/sdk/<pacote>.mdx` — buscar via
  `https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/vX.Y.Z/sdk/<pacote>.mdx`.
  Pra bibliotecas de terceiros com config plugin (ex.: `react-native-ble-plx`), o README do GitHub
  raramente documenta o comportamento exato do plugin — mais confiável baixar o tarball publicado
  (`registry.npmjs.org/<pacote>` → `dist.tarball` da versão desejada) e ler o `plugin/build/*.js`
  compilado direto, que é o que de fato roda.
- **Como aplicar**: se uma tentativa de acessar `docs.expo.dev` falhar com erro de rede/proxy,
  tentar essas duas alternativas antes de desistir de confirmar contra a doc real.

### `SUPABASE_ACCESS_TOKEN` de sandbox conflita com a sessão de `supabase login` já salva na máquina

- **Sintoma**: `npx supabase projects list` (ou qualquer comando do CLI) retorna uma lista de
  projetos que não inclui o projeto real do app (`apyfxpegxjfgznmfvqzq`, "arcoalianca's Project"),
  mesmo já tendo rodado `supabase login` nesta máquina antes.
- **Causa raiz**: o ambiente de execução do terminal exporta uma env var `SUPABASE_ACCESS_TOKEN`
  própria (de outra conta/sandbox), e o CLI sempre prioriza essa env var sobre a sessão salva por
  `supabase login` (armazenada fora de env var, no keychain do SO). A env var "vence" em silêncio
  — não tem aviso de qual token está sendo usado.
- **Fix**: prefixar o comando com `env -u SUPABASE_ACCESS_TOKEN` pra forçar o CLI a cair pra sessão
  logada localmente. Ex.: `env -u SUPABASE_ACCESS_TOKEN npx supabase secrets set CHAVE=valor
  --project-ref apyfxpegxjfgznmfvqzq`.
- **Outra pegadinha relacionada**: mesmo com a sessão certa, `supabase link` nesse projeto retorna
  403 ("não tem privilégios") — mas `secrets list/set` e `functions deploy` funcionam normalmente
  passando `--project-ref` direto, sem precisar de `link`. Não perder tempo tentando linkar.

### Efeito que sincroniza estado automaticamente (`useEffect` + `setState`) é proibido pelo React Compiler

- **Sintoma**: `expo lint` acusa `react-hooks/set-state-in-effect` — "Calling setState
  synchronously within an effect can trigger cascading renders" — num efeito que parecia
  inofensivo (ex.: espelhar um valor de um hook externo pra dentro de um `useState` local).
- **Causa raiz**: mesma familia de regra do React Compiler que já pegou `Date.now()` em
  `useMemo` (ver entrada abaixo) — um `useEffect` cujo corpo só chama `setState` a partir de outro
  estado observado é, na prática, uma sincronização que o React já resolve sozinho ao re-renderizar;
  fazer isso manualmente causa um render extra em cascata.
- **Fix aplicado** (`src/app/sessao/[id].tsx`, integração do monitor de FC via Bluetooth): em vez
  de um `useEffect` espelhando `monitorFc.bpm` pro estado local `fcValor` a cada notificação BLE,
  o valor ao vivo (`monitorFc.bpm`) é mostrado direto na UI, e `fcValor` só é setado por uma ação
  explícita do usuário (toque num botão "usar bpm ao vivo") — nunca automaticamente dentro de um
  efeito.
- **Como aplicar**: sempre que a tentação for "espelhar X num useState via useEffect", perguntar
  se X pode simplesmente ser lido/exibido direto, ou se a atualização do estado local pode nascer
  de um handler de evento em vez de um efeito.

### `ON DELETE CASCADE` exige `PRAGMA foreign_keys = ON`

- O SQLite desliga a aplicação de foreign keys por padrão em cada conexão. `applyMigrations()`
  ativa a pragma antes das migrations, garantindo as exclusões em cascata de clientes, sessões
  e leituras.

### `.expo/types/router.d.ts` fica desatualizado ao criar rota nova

- **Sintoma**: `tsc` acusa erro de tipo (`Type '"/minha-rota"' is not assignable to...`) numa
  chamada de `router.push`/`Link` que parece perfeitamente válida, apontando pra uma rota que
  acabou de ser criada.
- **Causa raiz**: esse arquivo é gerado automaticamente pelo `expo-router` typegen, que só roda
  quando o Metro bundler sobe (`expo start`, `expo export`). Se você cria um arquivo de rota
  novo e roda só `tsc` sem nunca ter subido o bundler com essa rota presente, o cache de tipos
  fica atrasado.
- **Fix**: rodar `npx expo start` (ou `npx expo export --platform ios`) uma vez regenera o
  arquivo sozinho. Se precisar validar tipos sem subir o bundler completo, dá pra editar
  `.expo/types/router.d.ts` manualmente adicionando a rota nova nos três campos
  (`hrefInputParams`/`hrefOutputParams`/`href`) — é gitignored, então esse patch manual nunca
  é commitado e é substituído pela geração real na próxima vez que o bundler rodar.
- **Como aplicar**: depois de criar uma rota nova, rode `npx expo export --platform ios
  --output-dir /tmp/x` (ou `expo start`) antes de confiar no resultado de `tsc --noEmit`.

### `expo-sqlite` no target `web` — resolvido em 2026-09-21, precisa de 3 peças

_(Esta entrada dizia pra simplesmente evitar `--platform web`. Isso mudou quando o usuário pediu
uma build web/PWA pra mostrar pro time — resolvido de verdade, documentado abaixo.)_

- **Sintoma 1**: `npx expo export --platform web` falha com `Unable to resolve module
  ./wa-sqlite/wa-sqlite.wasm`.
  - **Causa**: o Metro não trata `.wasm` como asset por padrão, e o projeto nunca teve
    `metro.config.js` (rodava só no default do `expo/metro-config`).
  - **Fix**: `npx expo customize metro.config.js` pra gerar o arquivo, depois
    `config.resolver.assetExts.push('wasm')`. Doc oficial (`/versions/v57.0.0/sdk/sqlite/#web-setup`)
    menciona isso mas **não** publica o snippet completo de `metro.config.js` na versão em
    markdown (`/sdk/sqlite.md`) — só descreve em prosa. Cuidado ao pedir pra IA resumir essa
    página: numa tentativa ela alucinou um `babelTransformerPath: require.resolve(
    'react-native-svg-transformer')` que não existe na doc real nem faz sentido aqui (esse
    pacote nem é dependência do projeto) — sempre conferir contra o `.md` bruto
    (`curl .../sdk/sqlite.md`), não confiar no resumo de uma única passada.
- **Sintoma 2**: depois do fix acima, o worker do wa-sqlite usa `SharedArrayBuffer`, que exige
  os cabeçalhos `Cross-Origin-Opener-Policy: same-origin` e `Cross-Origin-Embedder-Policy:
  credentialless` — sem eles o banco falha silenciosamente no browser.
  - **Fix**: `config.server.enhanceMiddleware` no `metro.config.js` (dev/Metro) + `headers` no
    `vercel.json` (produção) setando os dois cabeçalhos pra toda rota.
- **Sintoma 3**: com o wasm resolvendo, `expo export --platform web` ainda quebrava com
  `ReferenceError: window is not defined` durante a "static rendering".
  - **Causa raiz**: `app.json` tinha `web.output: "static"` (o default do expo-router faz SSG —
    pré-renderiza cada rota em Node antes de servir). O client do Supabase (`src/lib/supabase.ts`)
    usa `AsyncStorage` como storage adapter, que no target web é um shim em cima de
    `window.localStorage` — e `createClient()`/`getSession()` tocam esse storage na
    inicialização, não só dentro de efeito React. Em Node (SSG) não existe `window`, crash.
  - **Fix**: `web.output: "single"` no `app.json` (SPA — um HTML shell, roteamento 100%
    client-side via History API). Certo pra este app de qualquer forma: é uma ferramenta
    autenticada, não um site de conteúdo que se beneficia de SEO por rota.
  - **Efeito colateral**: `src/app/+html.tsx` (customização oficial do `<head>` do expo-router)
    só é aplicado no modo `"static"` — em `"single"` é ignorado. As tags de PWA (manifest,
    theme-color, apple-touch-icon) precisaram ser injetadas em runtime via
    `src/lib/pwa-web.ts`, chamado num `useEffect` guardado por `Platform.OS === 'web'` em
    `src/app/_layout.tsx` — nunca criar um `+html.tsx` neste projeto enquanto `output` for
    `"single"`, ele não faz nada.

### React Compiler proíbe `Date.now()`/`new Date()` dentro de `useMemo`

- **Sintoma**: `expo lint` acusa `react-hooks/purity` — `Cannot call impure function during
  render` — numa conta de duração que parecia inofensiva dentro de um `useMemo`.
- **Causa raiz**: `app.json` tem `experiments.reactCompiler: true`. O compilador trata qualquer
  valor que mude sozinho com o tempo (como `Date.now()`) como impuro se for lido direto durante
  o render/memo — o resultado ficaria desatualizado e o compiler não tem como saber que precisa
  re-executar.
- **Fix**: todo timer "ao vivo" (tempo decorrido, contagem regressiva) passa pelos hooks de
  `src/hooks/use-elapsed-timer.ts` (`useElapsedSeconds`, `useCountUpTimer`), que isolam o
  `Date.now()`/`setInterval` dentro de `useState`+`useEffect` — nunca calculado direto num
  `useMemo` ou no corpo do componente.
- **Como aplicar**: qualquer tela nova que precise de "quanto tempo se passou desde X" reusa
  esses hooks em vez de calcular a diferença de datas inline.

### Ícones Material Symbols são texto com ligadura, não componentes

- **Sintoma**: tentar importar um ícone Material Symbols como componente JSX (padrão
  `@expo/vector-icons`) não existe nesse projeto — é fácil assumir que existe por hábito de
  outros projetos Expo.
- **Causa raiz**: o projeto usa a fonte `@expo-google-fonts/material-symbols` diretamente. Um
  `<Text>` com essa fonte e o **nome do ícone como conteúdo** (ex.: `"favorite"`) renderiza o
  glifo via ligadura — mesma técnica do HTML original do Stitch.
- **Fix**: usar sempre `src/components/material-symbol.tsx` (`<MaterialSymbol name="favorite"
  />`), nunca `@expo/vector-icons` (nem está instalado).
- **Nota**: o pacote instalado só tem cortes estáticos por peso (100–700), sem o eixo `FILL`
  variável — não dá pra alternar contorno/preenchido em runtime como no CSS do protótipo web.

### `<Link asChild>` com array de estilos volta a quebrar se o arquivo for movido

- **Sintoma**: `Render Error` — `[expo-router]: You are passing an array of styles to a child of
  <Slot>` — tela crasha ao abrir.
- **Causa raiz**: o fix de `c115880` (2026-09-10) trocou `style={[...]}` por um objeto único no
  `Pressable` dentro de `<Link asChild>` em `src/app/index.tsx`. Quando a tela foi movida pra
  `src/app/(tabs)/index.tsx` na reestruturação em abas (`393137e`), o código foi reescrito do zero
  nesse arquivo novo e reintroduziu o array de estilos — o fix não "viaja" com a lógica, é
  específico do arquivo/linha.
- **Fix**: `Pressable` filho direto de `<Link asChild>` sempre recebe um objeto único de estilo
  (`{ ...styles.x, ...outrasProps }`), nunca um array (`[styles.x, {...}]`). `ThemedView` já
  flatten a própria prop `style` internamente, mas isso não ajuda aqui — o `Slot` inspeciona as
  props do elemento filho *antes* dele renderizar, não o resultado final.
- **Como aplicar**: ao criar/mover qualquer tela com `<Link asChild>`, grep por `asChild` no
  arquivo e confirmar que nenhum filho direto recebe array de estilo. Encontrado e corrigido de
  novo em `src/app/(tabs)/index.tsx` na sessão de 2026-09-13, testando no device físico.

### Views em `flexDirection: 'row'` não encolhem sozinhas — overflow sai da tela, não quebra linha

- **Sintoma**: texto de cabeçalho sobrepondo um botão vizinho, ou dois "pills" lado a lado
  estourando a borda direita da tela (cortados, não visíveis por completo) — só aparece rodando
  no device de verdade, `tsc`/lint não pegam.
- **Causa raiz**: React Native, diferente da web, não dá `flexShrink: 1` por padrão a `View`/
  `Text` dentro de um container `flexDirection: 'row'`. Um texto ou pill com conteúdo mais largo
  que o espaço disponível simplesmente extrapola o container em vez de encolher ou quebrar linha,
  mesmo com o pai em `flex: 1`.
- **Fix aplicado em `src/app/sessao/[id].tsx`**: no cabeçalho, `numberOfLines={1}` +
  `flexShrink: 1` no rótulo "Sessão em andamento" e `flexShrink: 0` no timer (que nunca deve
  truncar). Nos pills "Tempo total"/"Intervalo" (`hudTimers`), `flexBasis: '100%'` no container
  (força quebra de linha própria dentro do `flexWrap: 'wrap'` do pai) + `flex: 1` em cada
  `timerPill` (divide a largura da linha igualmente em vez de cada um pedir sua largura de
  conteúdo).
- **Como aplicar**: qualquer texto/pill dentro de uma row que pode variar de tamanho (nomes de
  cliente, timers, contadores) precisa de `flexShrink` explícito ou `numberOfLines` — não confiar
  que "coube no Figma/Stitch" significa que cabe com dado real (esse bug só apareceu porque havia
  uma sessão de teste com timer de 78+ horas, mas o cálculo mostra que ele ocorre com qualquer
  duração de formato `HH:MM:SS`, não é exclusivo desse dado extremo).

### `SQLiteProvider` (sem `useSuspense`) não renderiza os filhos até o banco abrir

- **Contexto útil, não bug**: `SQLiteProvider` sem `useSuspense` (é o default, e é o que o app
  usa) mantém `loading=true` internamente e só monta `children` depois que `onInit` (as
  migrations) termina — confirmado lendo `node_modules/expo-sqlite/build/hooks.js`
  (`SQLiteProviderNonSuspense`) antes de assumir.
- **Por que importa**: qualquer provider que precise de `useSQLiteContext()` (ex.: `SyncProvider`
  em `src/hooks/use-sync.tsx`) pode ficar aninhado direto dentro de `<SQLiteProvider>` sem se
  preocupar em esperar o banco — se ele renderizou, o banco já está pronto.

### `SQLiteProvider` é memoizado ignorando `children` — nunca calcule valor externo pra passar como prop através dele

- **Sintoma**: achado testando login em device físico (2026-09-21) — app instalado, sessão
  autenticava (confirmado no Supabase), mas a tela ficava em branco pra sempre, sem erro nenhum
  no `adb logcat`/LogBox.
- **Causa raiz**: `SQLiteProvider` é `React.memo`-izado com um comparador customizado que só
  compara `databaseName`/`options`/`assetSource`/`directory`/`onInit`/`onError`/`useSuspense` —
  **não compara `children`** (confirmado lendo o código-fonte, não só a doc). `RootLayout` antes
  chamava `useFonts()` e passava `fontsLoaded` como prop pra baixo, através do `<SQLiteProvider>`.
  Como esses outros props nunca mudam entre renders, o `memo` bloqueia React de sempre re-montar
  a árvore de `children` depois do primeiro render — travando `fontsLoaded` no valor que existia
  no exato instante em que o provider montou (quase sempre `false`, já que fontes ainda não
  tinham carregado), pra sempre. `pronto = fontsLoaded && !carregando` nunca virava `true`.
- **Fix**: mover qualquer hook cujo valor mude ao longo do tempo (aqui, `useFonts()`) pra
  **dentro** de um componente que já está dentro da árvore de `children` do `SQLiteProvider` (ver
  `RootNavigator` em `src/app/_layout.tsx`) — nunca calculá-lo no componente que envolve o
  provider e passar como prop pra baixo.
- **Como aplicar**: mesma regra vale pra qualquer outro provider memoizado de terceiros (verificar
  o código-fonte antes de assumir que `memo` compara tudo) — se um valor externo precisa refletir
  mudança de estado ao longo do tempo, o hook que o produz tem que rodar dentro da árvore que o
  consome, não fora dela.

### `supabase.auth.getSession()` sem `.catch()` trava o app pra sempre em erro silencioso

- **Sintoma**: mesmo device/teste acima — antes do fix do `memo` já existia esse segundo bug
  empilhado: `AuthProvider` (`src/hooks/use-auth.tsx`) chamava `getSession().then(...)` sem
  `.catch()`/`.finally()`. Se essa promise rejeitar (ex.: falha de leitura do `AsyncStorage` no
  primeiro boot de uma build nova), `carregando` nunca vira `false` — tela em branco pra sempre,
  sem exception visível em lugar nenhum porque é uma rejeição de promise não tratada.
- **Fix**: sempre `.then(...).catch((erro) => console.error(...)).finally(() => setCarregando(false))`
  em qualquer chamada assíncrona que controla um `pronto`/`loading` de bloqueio de tela — nunca só
  `.then()`.

### Colunas novas de sincronização (`atualizado_em`) ficam `NULL` em linhas antigas — quebra o push se a tabela remota for `NOT NULL`

- **Sintoma**: primeiro sync real (2026-09-21) falhou com `null value in column "atualizado_em"
  of relation "clientes" violates not-null constraint` — mensagem real, mostrada na aba Ajustes
  (nunca escondida), não inferida.
- **Causa raiz**: a migração que adicionou `uuid`/`atualizado_em`/`sincronizado_em`
  (`src/db/schema.ts`) fazia backfill só do `uuid` (`src/db/migrate.ts`). Linhas criadas antes
  dessa migração ficaram com `atualizado_em` local `NULL` — e a tabela remota no Supabase declara
  essa coluna `NOT NULL`, então o `upsert` do `src/lib/sync.ts` falhava pra qualquer dado
  pré-existente.
- **Fix**: novo passo em `MIGRATIONS` (`schema.ts`) fazendo `UPDATE ... SET atualizado_em =
  <carimbo de criação> WHERE atualizado_em IS NULL` nas 3 tabelas.
- **Como aplicar**: toda vez que uma coluna `NOT NULL` remota corresponde a uma coluna local
  adicionada via `ALTER TABLE` (que sempre entra `NULL` pra linhas existentes), o backfill
  precisa cobrir *todas* as colunas novas usadas no payload remoto, não só as usadas pra
  identidade (`uuid`).

### O app é dark-only de propósito, não uma lacuna

`src/hooks/use-theme.ts` sempre retorna `Colors.dark`, ignorando `useColorScheme()`. Isso não é
um "ainda não implementei o tema claro" — é decisão de produto (uso em pé, sob luz de academia,
ver `PRODUTO.md` § Design visual). Se alguém pedir tema claro no futuro, é uma feature nova, não
um bug.

## Verificação visual real via screenshot por `adb`

_(seção migrada de `TESTE_APP.md` — ver o arquivo original pra contexto de quando foi escrita)_

Dados deste projeto: `applicationId`/`package` Android = `com.educadorfisico.app`, esquema de
deep link = `educadorfisicoapp://`. Ainda não há dev client e build de produção convivendo lado
a lado no mesmo device — quando isso passar a existir, confirmar o nome exato do pacote do dev
client (normalmente `com.educadorfisico.app.dev`, dependendo do `eas.json`) antes de aplicar a
regra de `-p` explícito abaixo.

### Tab bar customizada sem `useSafeAreaInsets` some atrás da navegação do sistema

- **Sintoma**: os ícones/labels das 4 abas aparecem espremidos na mesma linha dos botões de
  navegação do Android (voltar/home/recentes) — só visível rodando no device físico (com barra de
  navegação de 3 botões; gesture nav pode mascarar o mesmo bug de forma diferente).
- **Causa raiz**: `tabBarStyle` em `src/app/(tabs)/_layout.tsx` tinha `height: 64` fixo. O
  `@react-navigation/bottom-tabs` normalmente soma a safe-area inferior sozinho, mas um `height`
  fixo no `tabBarStyle` do usuário sobrescreve esse comportamento automático.
- **Fix**: `useSafeAreaInsets()` (já é dependência do projeto) e `height: 56 + insets.bottom,
  paddingBottom: insets.bottom` no `tabBarStyle`, calculado dentro do componente `TabsLayout`.
- **Como aplicar**: qualquer ajuste futuro de altura/padding da tab bar tem que continuar somando
  `insets.bottom` — nunca voltar a um `height` fixo sem isso.

### Setup do zero: `adb` não vem instalado por padrão nesta máquina

Se `adb` não estiver no PATH (nenhuma pasta `Android/Sdk`, `where adb` falha), instalar só o
Platform Tools (não precisa do Android Studio inteiro) via `winget install --id
Google.PlatformTools -e`. Ele fica em
`%LOCALAPPDATA%\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe`.
Depois de plugar o device, `adb devices` mostra `unauthorized` até aceitar o popup de depuração
USB **no próprio aparelho** — reiniciar o `adb` (`kill-server`/`start-server`) não resolve sozinho,
precisa da confirmação manual na tela do celular.

**Gotcha do Git Bash (MSYS)**: qualquer path Unix-style passado pro `adb` (`adb shell uiautomator
dump /sdcard/x.xml`, `adb pull /sdcard/x.xml`) é reescrito pelo MSYS para um path Windows antes de
chegar no `adb`, corrompendo o comando silenciosamente (ex.: `/sdcard/x.xml` vira
`C:/Program Files/Git/sdcard/x.xml`, then dump/pull falham ou, pior, silenciosamente leem um
arquivo antigo que já existia no device de um teste anterior). Sempre exportar
`MSYS_NO_PATHCONV=1` antes de qualquer comando `adb shell`/`adb pull`/`adb push` com path
absoluto tipo Unix.

**Gotcha do sandbox de execução de comandos**: o daemon do `adb` não sobrevive entre chamadas de
shell separadas (cada chamada mata o processo anterior) — rodar `adb kill-server && adb
start-server` no início de cada bloco de comandos antes de qualquer `adb devices`/`adb shell`,
em vez de assumir que o daemon de uma chamada anterior ainda está de pé.

**1. Device físico conectado (preferencial)**
- Metro + dev client já instalado — sem gerar `.apk`/`.aab` novo, a não ser que uma dependência
  **nativa** tenha sido adicionada/removida desde o último build instalado (`expo-sqlite`,
  `react-native-gesture-handler`, `reanimated`, `react-native-svg`, `expo-haptics` já estão no
  `package.json` — qualquer pacote novo com módulo nativo exige rebuild).
- Interagir via `adb shell input tap`/`swipe` (usar a resolução física do device, `adb shell wm
  size`, não o tamanho da imagem lida).
- Confirmar visualmente com `adb exec-out screencap -p > arquivo.png` e ler a imagem — nunca só
  inferir pelo código ou confiar em descrição verbal da tela.
- Repetir o teste exatamente no mesmo ponto/estado onde o bug apareceu antes de declarar
  resolvido (evita falso-positivo por sorte de timing/estado).
- Double-tap real (ex.: zoom) precisa dos dois toques em sequência sem `sleep` entre eles no
  mesmo comando — com delay o Android trata como toques separados.
- `adb` **não simula pinça** (multi-touch de dois dedos) — pra bugs que só aparecem com gesto
  contínuo real, a garantia vem do código ou de pedir pro usuário testar com o dedo.
- **Antes de instalar/desinstalar qualquer coisa num device físico**, sempre checar o que já
  está instalado (`adb shell pm list packages | grep <nome>`) — nunca assumir que é "só um
  device de teste".
- **Deep links via `adb shell am start`**: sempre com `-p <pacote exato>` explícito assim que
  dev client e produção conviverem no mesmo device. Sem isso, o Android pode travar num seletor
  de app sem efeito, ou abrir direto o app errado sem aviso, se já existir uma preferência de
  app padrão salva pra aquele esquema.

**2. Emulador Android (quando não há device físico disponível)**
- Mesmo ciclo do device físico (screenshot real via `adb`, não inferência).
- Cuidado com GPU de emulador em máquinas com placa mais fraca: pode renderizar mapa/telas com
  efeito visual em branco/preto sem erro nenhum — forçar `-gpu swiftshader_indirect` se
  acontecer (mais lento, mas correto).
- Se o emulador crashar ao abrir com janela: reinstalar o componente `emulator` do SDK do zero
  (apagar a pasta antes de reinstalar, não só renomear).

**3. Sem device/emulador disponível (ambiente da sessão de 2026-09-10)**
- `npx tsc --noEmit` + `npx expo lint` + `npx expo export --platform ios` (bundle completo,
  sem instalar em nada) são o mínimo pra pegar erro de import/tipo/regra do React Compiler antes
  de entregar. **Isso não substitui verificação visual real** — só garante que o código compila
  e não quebra regra conhecida. Sempre que possível, seguir pro passo 1 ou 2 antes de considerar
  uma mudança de UI pronta.

## Comandos úteis

```bash
npm install                            # instalar dependências
npx expo start                         # dev server (abre menu web/emulador/dev build)
npx tsc --noEmit                       # typecheck
npx expo lint                          # ESLint (inclui regras do React Compiler)
npx expo export --platform ios         # valida bundle completo sem precisar de device
```

## Deploy / publicação

Ainda não há pipeline de deploy — o app está em fase de MVP/teste em device físico via EAS
development build (`eas.json`, perfil `development`, `developmentClient: true`, Android
`buildType: apk`). Não há build de produção nem submissão pra loja configurada ainda
(`submit.production` está vazio no `eas.json`).

| O quê | Onde | Confirmado ao vivo pela última vez |
|---|---|---|
| Dev build EAS (Android) | `eas.json` → perfil `development` | 2026-09-10 (configuração) |
| Repositório | https://github.com/GabrielScrin/educador-fisico-app (privado) | 2026-09-10 |
| Supabase (linkado, sem uso real) | `apyfxpegxjfgznmfvqzq` — ver `SETUP.md` | 2025-12 (link inicial) |
