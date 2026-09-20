# Passagem de plantão — 2026-09-20 (login + sincronização com Supabase, gap #1 e #2 do MVP)

Nota rápida pra mim mesmo (Claude) na próxima sessão. `ARQUITETURA.md` é a fonte permanente de
verdade (estrutura de código, estado por feature, armadilhas técnicas) e `PRODUTO.md` é a visão
de produto ponta a ponta — este arquivo aqui é só o resumo de trabalho da sessão + as decisões
que valem ser lembradas antes de mexer de novo. Sempre confira os outros dois pro detalhe real.

## O que foi feito hoje

O usuário pediu pra fechar, um a um, os gaps do MVP listados em `PRODUTO.md`. Comecei pelos dois
primeiros (Sincronização e Login), que são amarrados por design — não faz sentido sincronizar sem
saber de quem é o dado.

1. **Login por e-mail/senha** (escolha do usuário, entre 3 opções oferecidas: e-mail/senha,
   magic link, Google) via Supabase Auth. `src/app/(auth)/login.tsx` + `cadastro.tsx`, gate de
   rota com `<Stack.Protected guard={!!session}>` em `src/app/_layout.tsx` (API nativa do
   expo-router nesta versão — confirmei lendo o source antes de usar, por causa do aviso do
   `AGENTS.md` sobre o Expo ter mudado).
2. **Sincronização com Supabase como backup** — SQLite local continua sendo a fonte primária.
   Cada linha (clientes/sessoes/leituras) ganhou `uuid`/`atualizado_em`/`sincronizado_em`
   (`src/db/schema.ts`, migração versionada por `PRAGMA user_version` em `src/db/migrate.ts`,
   novo — a lista de migrations antiga rodava tudo sempre, sem versionamento, e um `ALTER TABLE`
   novo ia quebrar quem já tinha o banco criado). Motor de sync em `src/lib/sync.ts` (push+pull
   por uuid, ordem clientes→sessões→leituras), disparado automaticamente ao logar e ao voltar pro
   foreground via `src/hooks/use-sync.tsx`, mais botão manual em Ajustes.
3. **Aba Ajustes** reescrita: seção "Conta" (e-mail logado + Sair) e status real de sincronização
   (nunca mostra "sincronizado" sem ter sincronizado de verdade — mesma régua que já valia pro
   resto do app).
4. Instalei `@react-native-async-storage/async-storage` (sessão do Supabase precisa de storage
   explícito em RN, não existe `localStorage`) e `expo-crypto` (gerar os uuid).
5. Validado com `tsc --noEmit`, `expo lint` e `expo export --platform ios` — todos limpos.
6. O commit remoto integrado nesta atualização também fecha o CRUD: editar/excluir cliente,
   editar nota/excluir sessão e editar/excluir leituras. A rota `cliente/[id]/editar` foi mantida
   junto com o novo guard de autenticação, e `PRAGMA foreign_keys = ON` foi preservado em
   `applyMigrations()` para as exclusões em cascata.

## O que NÃO foi feito (bloqueios reais, não esquecimento)

- **Migração remota não foi aplicada.** O SQL (tabelas `clientes`/`sessoes`/`leituras` + RLS por
  `educador_id = auth.uid()`) está pronto em `remote_migration.sql`, na raiz do repo. Duas coisas
  na ordem:
  1. Tentei aplicar via Management API (`SUPABASE_ACCESS_TOKEN` do `.env`, comando avulso, sem
     `supabase login` global — como o próprio `.env` já instruía). Primeira tentativa foi
     bloqueada pelo classificador de modo automático do Claude Code ("Production Deploy" — DDL em
     produção pede aprovação explícita, faz sentido). Segunda tentativa (usuário aprovou) passou
     da permissão mas deu **timeout de conexão** — descobri que o projeto Supabase
     `apyfxpegxjfgznmfvqzq` está com status `INACTIVE` (pausado, provavelmente por inatividade
     desde a criação em 2026-09-08).
  2. Perguntei se podia restaurar o projeto e já aplicar a migração. **O usuário pediu
     explicitamente pra eu não mexer** ("não faça nada, depois eu rodo as migrations") — ele vai
     restaurar e rodar `remote_migration.sql` por conta própria. **Não tentar de novo sem ele
     pedir.**
- **Nada disso foi testado em device físico.** O celular não estava conectado via USB nesta
  sessão (só na sessão de 2026-09-13). Login, sincronização, e até o app em si depois dessas
  mudanças no `_layout.tsx` (guard de rota novo) — nada disso rodou de verdade num aparelho
  ainda. `tsc`/lint/export só garantem que compila, não que a UI funciona (ver armadilha já
  documentada no `ARQUITETURA.md`).

## Decisões e o porquê

- **Sincronização é backup, não a fonte de dados** — decisão explícita pra não reescrever o app
  inteiro em cima de um modelo online-first. SQLite local continua sendo lido/escrito direto por
  toda tela; o sync só empurra/puxa por cima, de forma assíncrona.
- **Sem merge de conflito (last-write-wins implícito)** — documentado como limitação conhecida em
  `ARQUITETURA.md`, não escondido. Aceitável porque hoje é uso single-device; fica pra quando o
  gap "multi-dispositivo" (item 6 da lista) for endereçado de verdade.
- **uuid gerado no aparelho vira o `id` remoto** (não um serial novo do Postgres) — decisão
  técnica pra permitir push idempotente por upsert sem round-trip pra descobrir o id remoto
  depois de criar localmente.

## O que falta (ordem que o usuário pediu, dos gaps do MVP)

1. ~~Sincronização~~ — código pronto, migração remota pendente (usuário vai aplicar).
2. ~~Login~~ — código pronto, não testado em device.
3. **FC via Bluetooth** — próximo item, ainda não iniciado.
4. ~~Editar/excluir cliente, sessão ou leitura~~ — código integrado, ainda requer teste em device.
5. Transcrição de voz na nota.
6. Multi-dispositivo (depende de 1 estar rodando de verdade + resolver o gap de merge de
   conflito acima).

Antes de seguir pro item 3, vale confirmar com o usuário se ele já rodou a migração e testou
login/sync em device — isso pode revelar bugs que preferem ser corrigidos antes de empilhar mais
código em cima.

## Ver também

`ARQUITETURA.md` (técnico, seção "Autenticação e sincronização"), `PRODUTO.md` (produto/fluxo
completo, tabela de gaps).
