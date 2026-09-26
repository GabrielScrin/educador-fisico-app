# Educador Físico — Plano de assinatura (planejado, ainda não implementado)

> Documento de referência da feature de monetização decidida em 2026-09-26, ainda **não
> implementada**. Ver `PRODUTO.md` pra visão de produto geral e `ARQUITETURA.md` pra estrutura de
> código — este arquivo é só o plano da assinatura até ela entrar nesses dois.

## Decisões tomadas (2026-09-26)

- **Quem paga**: o educador físico (usuário do app), não o cliente final dele. Modelo B2B
  clássico — o educador assina o software.
- **Canal de cobrança**: assinatura **nativa dentro do app** (App Store / Play Store), porque o
  plano é publicar o app nas lojas. Isso descarta Stripe direto como mecanismo de desbloqueio de
  feature no app iOS — a Apple exige StoreKit/IAP pra compras digitais consumidas dentro do app.
- **Estrutura de preço**: múltiplos planos — **Free** (limitado) + **Pro** (sem limite). Critério
  exato de onde corta o Free ainda **não decidido** (ver Fase 1).
- **Ferramenta escolhida**: **RevenueCat**, não IAP nativo cru. Abstrai StoreKit (iOS) e Play
  Billing (Android) atrás de um SDK único, entrega webhooks prontos pra sincronizar com o backend,
  e tem free tier que cobre um app deste porte sem custo. Implementar IAP nativo direto nas duas
  plataformas seria trabalho muito maior pra o mesmo resultado.
- **Web**: a versão web/PWA (Vercel) **não vende assinatura própria** por agora — RevenueCat não
  processa compra no browser. A web só lê e mostra o status (read-only) e direciona o educador a
  assinar pelo app mobile. Isso é consistente com o papel atual da versão web no produto (link de
  preview pro time, não canal de distribuição principal — ver `ARQUITETURA.md` § Web/PWA).

## Estado atual

Nada disso foi implementado ainda: sem RevenueCat no projeto, sem tabela de assinatura no
Supabase, sem paywall, sem gating de nenhuma feature. O app aceita clientes/sessões ilimitados
pra qualquer educador logado, exatamente como hoje.

## Plano de implementação (fases)

### Fase 0 — Pré-requisitos de loja (bloqueante, fora do código, responsabilidade do usuário)

- Conta Apple Developer Program (paga, anual) e Google Play Console (taxa única) — pré-requisito
  pra sequer submeter o app, e mais ainda pra vender assinatura nele.
- Política de privacidade pública (URL) e Termos de Uso — exigidos pelas duas lojas pra apps com
  conta de usuário/assinatura. Pode virar uma página simples publicada no mesmo domínio Vercel que
  já existe (`educador-fisico-app.vercel.app`).
- Criar os produtos de assinatura no App Store Connect e no Play Console (IDs, preço por região,
  trial se decidido). Preço real sempre vem da própria loja em runtime (`getOfferings()`) — nunca
  hardcoded no app, é exigência de review.

**Nenhuma das fases seguintes tem sentido começar antes desta.**

### Fase 1 — Decisão de produto: onde corta Free vs. Pro (ainda em aberto)

Opções discutidas, nenhuma decidida ainda:
- Limite de **clientes ativos** no Free (ex.: até 3) — fácil de entender e de implementar, escala
  com o uso real.
- Restringir **features específicas** ao Pro (ex.: FC via Bluetooth, transcrição de voz) em vez de
  limite de volume.

Decidir isso é pré-requisito pra Fase 4 (gating), mas não bloqueia as Fases 2/3 (integração
técnica é a mesma independente de qual regra o Free usa).

### Fase 2 — Integração técnica (RevenueCat no app)

- `react-native-purchases` + config plugin no `app.json` (mesmo padrão de `react-native-ble-plx`/
  `expo-audio` já existentes).
- `Purchases.logIn(uuid_do_supabase)` disparado depois que `useAuth` resolve a sessão — o ID do
  RevenueCat precisa bater com o `id` do usuário no Supabase, senão a compra fica associada a um
  usuário anônimo desalinhado do backend.
- Novo hook `src/hooks/use-subscription.tsx`, mesmo padrão de `use-auth.tsx`/`use-sync.tsx`:
  expõe plano atual (`free`/`pro`) e os limites derivados.
- Tela/componente de paywall — preço sempre lido de `Purchases.getOfferings()`, nunca fixo no
  código.
- Botões **"Restaurar compras"** e **"Gerenciar assinatura"** na aba Ajustes — obrigatórios pela
  Apple em qualquer app com IAP.

### Fase 3 — Backend (fonte de verdade)

- Nova tabela Supabase `assinaturas` (`educador_id uuid`, `plano`, `status`, `expira_em`), RLS
  restringindo cada educador a ler só a própria linha (mesmo padrão de `clientes`/`sessoes`/
  `leituras` já existente).
- Nova Edge Function `revenuecat-webhook` recebendo eventos do RevenueCat (compra inicial,
  renovação, cancelamento, expiração) e atualizando essa tabela — mesmo padrão de
  `transcrever-audio` (function já existente, ver `ARQUITETURA.md`).

### Fase 4 — Gating no app

- Nos pontos que o Free limita (definidos na Fase 1), checar `useSubscription().plano` antes de
  permitir a ação; se bloqueado, mostrar o paywall da Fase 2.
- Web: sem paywall de compra — só mostra o status (lido da tabela `assinaturas` via Supabase) e um
  aviso/link direcionando a assinar pelo app mobile.

### Fase 5 — Testes (antes de qualquer submissão pra review)

- Sandbox tester do App Store Connect + faixa de teste interno do Google Play — compra real de
  assinatura **não** é testável no dev build atual sem essas contas de teste configuradas.
- Revisar a guideline 3.1.2 da Apple (assinaturas) antes de submeter pra review — é onde apps são
  mais comumente rejeitados na primeira tentativa.

## Ordem de trabalho recomendada

Fase 0 é do usuário (contas + política de privacidade) e destrava as demais. Fase 1 (regra
Free/Pro) pode ser decidida em paralelo, sem depender da Fase 0. Fases 2–4 são o grosso do
trabalho de código e podem começar assim que a Fase 1 estiver decidida, independente da Fase 0
já estar concluída (só a Fase 5 — teste de compra real — depende das contas de loja existirem).

## Ver também

`PRODUTO.md` (visão de produto — vai ganhar uma linha na tabela de gaps quando isso avançar),
`ARQUITETURA.md` (estrutura de código — vai ganhar as seções técnicas reais quando implementado).
