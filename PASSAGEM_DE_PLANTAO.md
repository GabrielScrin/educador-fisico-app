# Passagem de plantão — 2026-09-21 (teste ponta a ponta em device + build web/PWA)

Nota rápida pra mim mesmo (Claude) na próxima sessão. `ARQUITETURA.md` é a fonte permanente de
verdade (estrutura de código, estado por feature, armadilhas técnicas) e `PRODUTO.md` é a visão
de produto ponta a ponta — este arquivo aqui é só o resumo de trabalho da sessão + as decisões
que valem ser lembradas antes de mexer de novo. Sempre confira os outros dois pro detalhe real.

## O que foi feito hoje

Duas frentes bem distintas na mesma sessão.

**1. Teste ponta a ponta de login+sync em device físico** (fechando o que tinha ficado pendente
da sessão de 2026-09-20) — reconectei o celular via `adb`, apliquei a migração remota (usuário
restaurou o projeto Supabase pausado e rodou `remote_migration.sql` ele mesmo), gerei uma build
de dev client nova via EAS (obrigatório: a sessão anterior tinha adicionado `expo-crypto` e
`@react-native-async-storage/async-storage`, que são módulos nativos — não dá pra servir via
Metro num dev client antigo que não tem esses módulos compilados). Encontrei e corrigi **3 bugs
reais**, todos só visíveis rodando de verdade (nenhum pego por `tsc`/lint):

1. `SQLiteProvider` é memoizado ignorando `children` — `fontsLoaded` calculado em `RootLayout` e
   passado como prop ficava congelado em `false` pra sempre. Fix: mover `useFonts()` pra dentro
   de `RootNavigator` (dentro da árvore de children do provider). Detalhe completo em
   `ARQUITETURA.md`.
2. `supabase.auth.getSession()` sem `.catch()`/`.finally()` — uma rejeição silenciosa travava
   `carregando` em `true` pra sempre, tela em branco sem erro visível.
3. Linhas locais antigas (criadas antes da migração de sync) ficaram com `atualizado_em` NULL —
   quebrava o push com `null value ... violates not-null constraint`. Fix: novo passo de
   `MIGRATIONS` fazendo backfill.

Depois dos 3 fixes: cadastro de conta (`gabon_es@hotmail.com`), login, e sync confirmados
rodando de verdade — conferi as 3 tabelas remotas via API depois do sync e os dados batem
(1 cliente + 2 sessões + 3 leituras, `educador_id`/FKs corretos).

**2. Build web/PWA**, a pedido do usuário, pra mandar link de preview pro time. `expo-sqlite` web
é alpha e não tinha nenhuma configuração — 3 peças novas: `metro.config.js` (não existia; `.wasm`
como asset + cabeçalhos COOP/COEP), `app.json` → `web.output: "single"` (não `"static"`, que
quebrava com `window is not defined` porque o client do Supabase toca `window` na inicialização),
e PWA de verdade (`public/manifest.json`, `public/sw.js`, `src/lib/pwa-web.ts` injetando as tags
de `<head>` em runtime já que `+html.tsx` não roda no modo `"single"`). Tudo documentado com
sintoma/causa/fix em `ARQUITETURA.md` → "Armadilhas conhecidas" → "`expo-sqlite` no target web".

## O que NÃO foi feito / ficou pendente

- **Deploy na Vercel não terminou.** Não havia projeto Vercel conectado a este repo (nem na conta
  MCP, nem webhook no GitHub, nem `.vercel/` local) — o usuário escolheu conectar pelo dashboard
  (Import Git Repository) em vez de eu fazer via CLI/API. `vercel.json` já está no repo (build
  command, output directory, headers COOP/COEP, rewrite de SPA). O usuário importou o projeto
  (`educador-fisico-app`, existe agora na conta `gabrielscrin's projects`), mas **nenhum deploy
  foi disparado** (`latestDeployment: null`, domínio dá 404 DEPLOYMENT_NOT_FOUND) — o import
  criou o projeto mas não iniciou build nenhum. Não confirmei se a conexão Git de fato completou
  (`get_project` não mostrou nenhum campo de `link`/`gitRepository`, o que é suspeito). Pedi pro
  usuário conferir Settings → Git nesse projeto e ver se o repo aparece conectado de verdade.
- **As ferramentas MCP da Vercel para criar projeto/deploy têm bug nesta sessão**: `create_project`
  sempre retorna `"missing required property name"` mesmo passando `name` corretamente, de
  várias formas testadas. Descobri o motivo no meio do caminho: o parâmetro real é `requestBody`
  (um objeto aninhado, não campos soltos no top-level) — mas mesmo passando dessa forma pro
  `create_deployment`, a chamada continuou falhando (`"expected object, received string"`,
  mesmo passando um objeto de verdade). **Não fica claro se é limitação da forma como estou
  invocando a tool ou bug real do lado do servidor MCP** — não gastar muito tempo nisso de novo
  sem antes confirmar se foi corrigido; o caminho confiável é o dashboard/CLI, não essa tool.
- **Nada foi commitado até o usuário perguntar diretamente** ("vc fez o comit e push das
  alterações?") — só commitei depois disso. Sempre commitar/documentar antes de considerar uma
  etapa "pronta", não deixar acumular.

## Decisões e o porquê

- **`web.output: "single"` (SPA), não `"static"` (SSG)** — não é só workaround do bug do
  `window`, é a escolha certa pra este app de qualquer forma: é uma ferramenta autenticada, não
  um site de conteúdo que se beneficia de pré-renderização por rota pra SEO.
- **Service worker simples, sem prometer offline completo** — só cacheia o shell da app
  (stale-while-revalidate) pra abrir mais rápido e ser instalável. SQLite via wasm e sync
  continuam precisando de rede pra funcionar de verdade; documentado assim no próprio código e
  aqui, pra não prometer mais do que existe (mesma régua que já vale pro resto do produto).
- **Usuário preferiu conectar a Vercel pelo dashboard, não por mim via CLI/API** — deploy
  automático a cada push, sem precisar de login recorrente numa ferramenta que só eu uso.

## O que falta (ordem que o usuário pediu, dos gaps do MVP)

1. ~~Sincronização~~ — testado ponta a ponta, funcionando.
2. ~~Login~~ — testado ponta a ponta, funcionando.
3. **FC via Bluetooth** — ainda não iniciado (pausado pra entrar o pedido de build web).
4. ~~Editar/excluir cliente, sessão ou leitura~~ — código integrado numa sessão anterior
   (2026-09-15), ainda não testado especificamente em device (o teste desta sessão focou
   login/sync).
5. Transcrição de voz na nota.
6. Multi-dispositivo (depende do sync, que já está rodando — falta resolver merge de conflito).

Fora da lista de gaps do MVP: **destravar o deploy web na Vercel** é o item mais imediato — ver
seção acima.

## Ver também

`ARQUITETURA.md` (técnico — seções "Autenticação e sincronização" e "Web/PWA", mais as 4
armadilhas novas desta sessão), `PRODUTO.md` (produto/fluxo completo, tabela de gaps).
