# Educador Físico — Visão do produto

> Documento de referência sobre do que o app se trata, de ponta a ponta — o que já existe e o
> que a ideia prevê como versão completa. Serve de base pra decisões de UX/visual (ver também
> o debriefing visual gerado em 2026-09-10) e pra qualquer pessoa nova que precise entender o
> produto sem reconstruir o contexto lendo código.

## O que é

Um app mobile pra **educadores físicos registrarem, em tempo real, durante o treino**, como o
esforço e a dor do cliente evoluem sessão a sessão — substituindo a prancheta/caderno de papel
ou o WhatsApp com anotações soltas. Não é um app de treino pro próprio usuário treinar sozinho:
é uma ferramenta de trabalho pro profissional que está treinando outra pessoa.

O conteúdo clínico das escalas (o que cada nota de 0 a 10 significa, os cortes de intensidade,
etc.) vem de material de referência do educador físico **Rafael de Souza Iyama** (CREF 010255),
citando fontes reconhecidas da ciência do exercício: *ACSM's Guidelines for Exercise Testing and
Prescription* (2020), Robertson et al. (escala OMNI-RES, 2003), Zourdos et al. (escala RIR, 2016)
e a literatura padrão de NPRS (escala numérica de dor).

## Pra quem é

Educadores físicos e personal trainers que atendem clientes presencialmente (academia, estúdio,
domicílio) e querem substituir registro em papel por um histórico digital comparável entre
sessões — sem precisar de internet, sem depender de login, sem fricção no meio do treino.

## O momento de uso que define o design

Isso está documentado como intenção explícita no próprio código (`scale-picker.tsx`): o app é
usado **em pé, com o celular na mão**, no intervalo entre séries — não sentado, preenchendo
formulário com calma. O educador e o cliente costumam olhar o mesmo número juntos, a curta
distância. Qualquer decisão de produto ou de UX precisa respeitar essa janela de tempo curta e
essa postura.

## Design visual

Desde 2026-09-10 o app usa o design system **"Clinical High-Contrast Dark"**, desenhado no Stitch
(projeto "Design de App Premium") a partir desse mesmo momento de uso: fundo bem escuro (OLED
pitch) pra reduzir reflexo sob luz de academia e poupar bateria em turnos longos, contraste alto,
alvos de toque generosos (mínimo 56px), números tabulares grandes pra leitura rápida a distância.

**Não existe variante clara** — é uma decisão de produto, não uma lacuna: o app roda sempre no
tema escuro (`src/hooks/use-theme.ts`, `app.json` com `userInterfaceStyle: "dark"`).

- Fonte: Inter (`@expo-google-fonts/inter`)
- Ícones: Material Symbols via ligadura de fonte (`@expo-google-fonts/material-symbols`,
  `src/components/material-symbol.tsx`)
- Tokens de cor/espaçamento/raio: `src/constants/theme.ts`

Ao portar o design do Stitch pro código real, alguns elementos dos protótipos **não foram
replicados de propósito**, por integridade dos dados clínicos ou porque não correspondem ao
estado real do produto:
- Nenhum valor de escala é auto-registrado (o protótipo tinha um atalho "Série Concluída" que
  gravava um OMNI 8 fake — removido).
- Nenhum indicador de identidade/sincronização é mostrado sem existir de fato (o protótipo
  mostrava "CREF" e "Supabase Sync Pronto" fixos; o app não tem login nem usa Supabase em
  nenhuma tela ainda — ver tabela de gaps abaixo).

## Como funciona, ponta a ponta

O app abre direto em **4 abas** (`src/app/(tabs)/`):

1. **Clientes** — lista com busca, filtros (Hoje / Todos / Alerta de dor) e, por cliente, a
   telemetria da última sessão + atalho "Iniciar sessão" direto da lista.
2. **Treino ativo** — sessões abertas (`finalizada_em IS NULL`) de qualquer cliente, com
   cronômetro ao vivo, pra retomar uma sessão que ficou em andamento.
3. **Evolução** — visão agregada do consultório: sessões na semana, clientes ativos nos últimos
   30 dias, alertas de dor abertos, e a lista de clientes ordenada por atividade recente.
4. **Ajustes** — estado real do app (armazenamento local, sem login), atribuição da fonte
   clínica das escalas, atalho pra consulta e versão do app.

Fluxo de uma sessão:

1. **Cadastrar cliente** — nome + contato opcional (WhatsApp/e-mail). Sem CPF, sem dados
   clínicos estruturados além do que a sessão gera.
2. **Abrir o histórico do cliente** — sessões anteriores (expansíveis, mostrando as leituras
   cronológicas de cada uma), gráfico de evolução do esforço (OMNI) nas últimas sessões, e
   resumo geral (carga média, pico de dor histórico, duração média).
3. **Iniciar uma sessão** — cria um registro de sessão vinculado ao cliente, com horário de
   início.
4. **Durante o treino, registrar leituras rápidas** — quatro tipos, cada um abrindo um seletor
   de tela cheia com números grandes:
   - **Borg CR10** (0–10) — percepção de esforço em exercício aeróbio.
   - **OMNI-RES** (0–10) — percepção de esforço em treino de força.
   - **Dor / NPRS** (0–10) — intensidade de dor por autorrelato.
   - **FC** (bpm) — frequência cardíaca, hoje digitada manualmente.
   Cada leitura fica registrada com timestamp e aparece na linha do tempo da sessão, mais
   recente primeiro. A tela também mostra telemetria ao vivo (FC atual, média de Borg, pico de
   dor da sessão) e a curva de esforço da sessão em gráfico.
5. **Anotar uma nota livre da sessão** (opcional) — salva como rascunho assim que digitada, não
   só no fim.
6. **Finalizar a sessão** — leva pra uma tela de **resumo** (médias, picos, duração, curva de
   séries) onde o educador revisa/edita a nota antes de consolidar. Só aí `finalizada_em` é
   gravado. Dá pra compartilhar esse resumo com o cliente via WhatsApp.
7. **Consultar as escalas de referência** a qualquer momento (`/escalas`), fora do fluxo de
   registro — útil pra explicar pro cliente o que cada nota significa.

## Modelo de dados (hoje, local)

```
clientes (id, nome, contato, criado_em)
   └─ sessoes (id, cliente_id, iniciada_em, finalizada_em, nota)
         └─ leituras (id, sessao_id, tipo['borg'|'omni'|'dor'|'fc'], valor, registrada_em)
```

Simples de propósito: cada leitura é um ponto no tempo, tipado, o que permite tanto a linha do
tempo dentro da sessão quanto médias/gráficos de evolução entre sessões.

## Estado atual (MVP) vs. versão completa

| Área | Hoje (MVP) | Versão completa prevista |
|---|---|---|
| Armazenamento | 100% local, SQLite (`expo-sqlite`) no aparelho do educador | Sincronização em nuvem via Supabase — o client já existe em `src/lib/supabase.ts`, criado mas **ainda não usado em nenhuma tela** |
| Login | Nenhum — app abre direto na aba Clientes | A pensar junto da sincronização (não faz sentido sincronizar sem identificar o educador dono dos dados) |
| Frequência cardíaca | Digitada manualmente num modal | "Integração automática com sensor Bluetooth" — já anunciada como texto de interface no modal de FC (`sessao/[id].tsx`), ainda não implementada |
| Edição/exclusão de cliente, sessão ou leitura | Não existe (só criar e listar) | Não definida ainda — precisa de decisão de produto (ex.: corrigir uma leitura errada registrada sem querer) |
| Transcrição de voz na nota de fechamento | Não existe | O protótipo visual tinha um botão de microfone; não implementado por não haver serviço de speech-to-text integrado ainda |
| Multi-dispositivo | Não existe — dado mora só naquele celular | Depende da sincronização acima |

## Fora de escopo, por ora

- Qualquer coisa voltada ao *cliente final* treinar sozinho (isso é ferramenta de trabalho do
  educador, não um app de treino self-service).
- Prescrição de treino / biblioteca de exercícios — o app registra **percepção de esforço e
  dor**, não substitui uma planilha de treino.
- Cobrança, agenda, financeiro — nada disso está no código ou foi mencionado como intenção.

## Fontes usadas pra montar este documento

- `SETUP.md` (descrição original do produto)
- `src/db/schema.ts`, `src/db/queries.ts` (modelo de dados real)
- `src/constants/scales.ts` (conteúdo clínico das três escalas)
- `src/constants/theme.ts`, `src/hooks/use-theme.ts` (design system real)
- `src/components/scale-picker.tsx` (comentário de intenção de uso em pé/tempo real)
- `src/app/sessao/[id].tsx`, `src/app/sessao/[id]/resumo.tsx` (fluxo de sessão e fechamento)
- `src/app/(tabs)/` (estrutura de navegação em abas)
- Projeto Stitch "Design de App Premium" (origem do design system e das telas de referência)
- Teste ao vivo do app num device físico em 2026-09-10
