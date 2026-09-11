# Passagem de plantão — 2026-09-10 (reskin completo pro design Clinical High-Contrast Dark + navegação em abas)

Nota rápida pra mim mesmo (Claude) na próxima sessão. `ARQUITETURA.md` é a fonte permanente de
verdade (estrutura de código, estado por feature, armadilhas técnicas) e `PRODUTO.md` é a visão
de produto ponta a ponta — este arquivo aqui é só o resumo de trabalho da sessão + as decisões
que valem ser lembradas antes de mexer de novo. Sempre confira os outros dois pro detalhe real.

## O que foi feito hoje

O usuário tinha desenhado o app inteiro no Stitch (projeto "Design de App Premium", 10 telas ao
todo) e pediu pra portar isso pro código real — não como reskin visual só, mas com a
funcionalidade que os protótipos mostravam (timer, telemetria, curva de esforço) rodando de
verdade contra o SQLite.

1. **Design system** extraído do Stitch (`Colors`/`Fonts`/`Radius` em `src/constants/theme.ts`),
   fonte Inter + ícones Material Symbols por ligadura de fonte.
2. **Reskin completo** das 5 telas que já existiam (`sessao/[id]`, lista de clientes, prontuário
   do cliente, cadastro de cliente, seletor de escala) com dados reais por trás — nada de valor
   fixo/mockado.
3. **2 telas novas**: fechamento de sessão (`sessao/[id]/resumo.tsx`, com compartilhamento via
   WhatsApp) e consulta de escalas de referência (`escalas.tsx`).
4. **Barra de navegação inferior** com 4 abas reais (`src/app/(tabs)/`): Clientes, Treino ativo
   (sessões em andamento de qualquer cliente), Evolução (telemetria agregada do consultório),
   Ajustes (estado real do app).
5. Fechadas duas lacunas que já estavam documentadas: média de OMNI não aparecia no resumo da
   sessão (agora aparece); nota da sessão só era salva no fim (agora salva como rascunho a cada
   edição).
6. `ARQUITETURA.md` criado nesta sessão (não existia) — `TESTE_APP.md` migrado pra lá e virou
   só um ponteiro.

## Decisões e o porquê

- **App é dark-only, de propósito** — não é tema claro faltando implementar. O design inteiro
  (contraste alto, fundo bem escuro) existe pra reduzir reflexo/glare sob luz de academia e
  poupar bateria em turnos longos. `app.json` tem `userInterfaceStyle: "dark"`,
  `use-theme.ts` sempre retorna `Colors.dark`.
- **Removidos elementos do protótipo que fariam o app mentir sobre o próprio estado**: o
  protótipo tinha um botão "Série Concluída" que auto-registrava um OMNI 8 fake, e um badge fixo
  de "CREF #010255 / Supabase Sync Pronto" no topo da lista de clientes. Nenhum dos dois existe
  de verdade no app (não há login, Supabase não é usado em nenhuma tela) — mantê-los seria
  inventar dado clínico e mentir sobre sincronização que não acontece. Removidos, substituídos
  por um indicador honesto ("Local · sem sincronização").
- **Barra de navegação inferior construída com rotas reais, não a réplica do protótipo** — isso
  reverte a decisão inicial da sessão (não construir a barra, porque as telas "Treino Ativo" e
  "Ajustes" do protótipo não tinham equivalente no app). O usuário pediu explicitamente pra
  construir com rotas reais; as 3 abas novas (Treino ativo/Evolução/Ajustes) foram desenhadas do
  zero, alimentadas por queries novas no SQLite — nenhuma é decorativa.
- **Fechamento de sessão virou uma tela própria** (`sessao/[id]/resumo.tsx`) em vez do botão
  "Finalizar" gravar direto — dá espaço pra revisar/editar a nota clínica e ver os agregados da
  sessão antes de consolidar. `finalizarSessao` (que grava `finalizada_em`) só é chamado ali.

## Pontos de atenção

1. **Não testei em device físico nem emulador nesta sessão** — validação foi só `tsc --noEmit` +
   `expo lint` + `expo export --platform ios` (bundle completo, sem instalar em nada). Isso pega
   erro de import/tipo/regra do React Compiler, mas **não confirma que a UI renderiza certo**
   (altura da tab bar em telas pequenas, timers ao vivo realmente atualizando, scroll das telas
   novas). Antes de considerar pronto, seguir a seção "Verificação visual real via screenshot por
   `adb`" do `ARQUITETURA.md`.
2. Armadilhas técnicas encontradas nesta sessão (typegen de rota desatualizado, `expo-sqlite`
   não builda pra web, React Compiler proíbe `Date.now()` em `useMemo`, ícones são ligadura de
   fonte) estão documentadas com sintoma/causa/fix no `ARQUITETURA.md` — não precisa redescobrir.
3. O conteúdo da aba **Ajustes** (atribuição clínica das escalas, texto sobre armazenamento
   local) foi uma decisão minha de preencher com algo real em vez de deixar a aba vazia — vale
   confirmar com o usuário se é isso mesmo que ele queria ali, ou se tinha algo mais específico
   em mente.

## O que falta

- Testar de ponta a ponta em device físico (nenhuma das telas novas/reskinadas foi vista rodando
  de verdade ainda — só validado por bundle).
- Gaps antigos que continuam de pé (não mudaram nesta sessão): FC via Bluetooth, login/sync com
  Supabase, editar ou excluir cliente/sessão/leitura, transcrição de voz na nota.

## Ver também

`ARQUITETURA.md` (técnico), `PRODUTO.md` (produto/fluxo completo).
