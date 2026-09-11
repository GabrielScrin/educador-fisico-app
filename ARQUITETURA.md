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
- Backend real: nenhum ainda. Tudo roda local (SQLite no aparelho). Um projeto Supabase já
  existe e está linkado (`apyfxpegxjfgznmfvqzq`, ver `SETUP.md`), mas **nenhuma tabela foi
  criada e nenhuma tela usa `src/lib/supabase.ts`** — é infraestrutura pronta pra quando o
  produto precisar de sync, não algo em uso.
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
    (tabs)/                  # grupo de abas — barra de navegação inferior
      _layout.tsx            # define as 4 abas + ícones + estilo da tab bar
      index.tsx               # aba "Clientes" (lista, busca, filtros)
      treino-ativo.tsx        # aba "Treino ativo" (sessões com finalizada_em NULL)
      evolucao.tsx             # aba "Evolução" (telemetria agregada do consultório)
      ajustes.tsx              # aba "Ajustes" (estado real do app, atribuição clínica)
    cliente/
      novo.tsx                # modal de cadastro — fora do grupo de abas de propósito
      [id].tsx                 # prontuário do cliente — tela cheia, sem tab bar
    sessao/
      [id].tsx                 # sessão ao vivo — tela cheia, gestureEnabled:false
      [id]/resumo.tsx           # fechamento/consolidação da sessão
    escalas.tsx                # consulta de referência das 3 escalas (sem registro)
    _layout.tsx                # Stack raiz: carrega fontes, tema de navegação, migrations
  components/                # componentes de UI compartilhados (ver tabela abaixo)
  constants/
    theme.ts                  # tokens de cor/espaçamento/raio — fonte única do design system
    scales.ts                  # conteúdo clínico das 3 escalas (Borg/OMNI/Dor)
  hooks/
    use-theme.ts               # sempre retorna o tema escuro (app é dark-only, ver abaixo)
    use-elapsed-timer.ts        # timers "ao vivo" — único jeito seguro de usar Date.now() aqui
  db/
    schema.ts                   # migrations SQLite (clientes/sessoes/leituras)
    queries.ts                   # toda a camada de acesso a dados — nenhuma tela faz SQL direto
  lib/supabase.ts               # client criado, não usado em nenhuma tela ainda
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
| Aba Ajustes | ✅ | Info real (armazenamento local, sem login), sem nada fake |
| Escalas de referência (consulta livre) | ✅ | `/escalas`, fora do fluxo de registro |
| FC via Bluetooth | ❌ | Anunciado na UI como "próxima versão", não implementado |
| Login / identificação do educador | ❌ | Não definido — bloqueia sync multi-dispositivo |
| Sync com Supabase | ❌ | Client existe, projeto linkado, zero tabelas/uso real |
| Editar/excluir cliente, sessão ou leitura | ❌ | Só criar e listar hoje |
| Transcrição de voz na nota | ❌ | Existia no protótipo visual (Stitch), não implementada — sem serviço de speech-to-text integrado |

_Atualizado na sessão de 2026-09-10 (reskin completo pro design "Clinical High-Contrast Dark" + navegação em abas)._

## Armadilhas conhecidas

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
