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
  sincronização de clientes/sessões/leituras foram implementados em código na sessão de
  2026-09-20 (ver seção "Autenticação e sincronização" abaixo). **A migração remota (tabelas +
  RLS) ainda não foi aplicada no projeto** — o app não vai sincronizar de verdade até isso
  rodar. SQLite local continua sendo a fonte primária de dados em qualquer cenário.
- Conteúdo clínico das escalas (`src/constants/scales.ts`) vem de material de referência do
  educador físico Rafael de Souza Iyama (CREF 010255) — fonte externa ao código, citada no
  comentário do próprio arquivo. Se um valor for revisado, é o Rafael quem revisa, não uma
  decisão de engenharia.
- Design visual: origem no projeto Stitch "Design de App Premium" (telas de referência
  "Sessão Ativa V3 Plus", "Clientes & Início Rápido", "Prontuário & Evolução", "Seletor em
  Tela Cheia", "Resumo & Fechamento de Treino", "Escalas de Referência"). O design foi portado
  pro código com funcionalidade real por trás — ver seção de decisões abaixo.

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
| Login / identificação do educador | 🟡 | Código pronto (e-mail/senha via Supabase Auth), não testado em device ainda |
| Sync com Supabase | 🟡 | Código pronto (push+pull por uuid, ver seção abaixo), **migração remota (tabelas/RLS) ainda não aplicada** — não sincroniza de verdade até isso rodar |
| FC via Bluetooth | ❌ | Anunciado na UI como "próxima versão", não implementado |
| Editar/excluir cliente, sessão ou leitura | ✅ | Cliente: editar/excluir; sessão: editar nota/excluir; leitura: editar durante sessão e excluir |
| Transcrição de voz na nota | ❌ | Existia no protótipo visual (Stitch), não implementada — sem serviço de speech-to-text integrado |
| Multi-dispositivo (2º aparelho do mesmo educador) | ❌ | Depende do sync acima estar rodando de verdade; sync atual não faz merge de conflito (last-write-wins), só push+pull simples |

_Atualizado na sessão de 2026-09-20 (login + sincronização com Supabase, código completo — ver seção "Autenticação e sincronização")._ Sessão anterior: 2026-09-10 (reskin "Clinical High-Contrast Dark" + navegação em abas).

## Autenticação e sincronização (código pronto, migração remota pendente)

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

**Schema remoto** (SQL em `remote_migration.sql`, gerado na sessão — ainda não aplicado): tabelas
`clientes`/`sessoes`/`leituras` no schema `public`, PK `id uuid` (mesmo valor do `uuid` local),
`educador_id uuid references auth.users(id) default auth.uid()`, RLS habilitado com policy
`educador_id = auth.uid()` pra tudo (select/insert/update/delete). **Precisa ser aplicado**
manualmente ou com aprovação explícita — ver `PASSAGEM_DE_PLANTAO.md` para o motivo (bloqueio do
classificador de modo automático, "Production Deploy": DDL em produção não roda sem confirmação
explícita, mesmo com o token de acesso disponível no `.env`).

## Armadilhas conhecidas

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

### `expo-sqlite` não builda pra `web`

- **Sintoma**: `npx expo export --platform web` falha com
  `Unable to resolve module ./wa-sqlite/wa-sqlite.wasm`.
- **Causa raiz**: o app nunca configurou o loader de wasm que o `expo-sqlite` precisa no target
  web (o `app.json` tem um bloco `"web"` só porque veio do template padrão do `create-expo-app`
  — o projeto real nunca teve o alvo web como prioridade, é 100% mobile).
- **Fix**: não é um bug pra corrigir agora — **use `--platform ios` ou `--platform android`**
  pra validar bundle/compilação sem device, nunca `--platform web`.

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
