# Setup — Educador Físico App

App mobile (Expo/React Native + TypeScript) para educadores físicos registrarem, em tempo
real durante o treino, as escalas de Borg CR10, OMNI-RES e dor (NPRS) por cliente, com
histórico comparável entre sessões. Conteúdo das escalas vem dos PDFs de referência de
Rafael de Souza Iyama (CREF 010255), em `EDUCADOR FÍSICO/LOW TICKETS` no OneDrive.

## Rodando localmente

```bash
npm install
npx expo start          # abre o menu (web / emulador / dev build)
```

MVP atual: dados 100% locais (SQLite via `expo-sqlite`, ver `src/db/`). Sem login, sem
sincronização em nuvem ainda.

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha. **O `.env` nunca é commitado** (está no
`.gitignore`).

| Variável | Onde pegar | Pode ir no bundle do app? |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Dashboard do projeto Supabase → Settings → API | Sim |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Idem (chave `publishable`, novo formato) | Sim |
| `SUPABASE_SECRET_KEY` | Idem (chave `secret`, novo formato) | **Não** — só scripts/CLI locais |
| `SUPABASE_ACCESS_TOKEN` | Dashboard → sua conta → Access Tokens (`sbp_...`) | **Não** — só CLI, por comando (ver abaixo) |

Qualquer variável prefixada com `EXPO_PUBLIC_` é embutida no bundle do app (extraível de
dentro do APK/IPA por qualquer pessoa). Por isso a chave secreta **nunca** leva esse
prefixo — ela existe só pra rodar comandos locais (migrations, seed), nunca é lida pelo
código do app (`src/lib/supabase.ts` usa só a `publishable`).

## Supabase

- Projeto: `apyfxpegxjfgznmfvqzq` — "arcoalianca's Project", org `oetppdvwfzmcsjmweggd`
  (https://supabase.com/dashboard/project/apyfxpegxjfgznmfvqzq)
- Client do app: `src/lib/supabase.ts` (criado, ainda não usado em nenhuma tela — o MVP
  é local-first; entra quando o produto precisar de sync entre aparelhos ou login).
- **⚠️ NUNCA rode `supabase login` puro neste projeto.** Essa conta (`sbp_...` acima) é
  diferente da conta usada nos outros ~20 projetos Supabase desta máquina — `supabase
  login` grava a credencial como sessão *padrão global* da CLI, o que troca a conta ativa
  pra TODOS os projetos ao mesmo tempo (já aconteceu uma vez, foi revertido com
  `supabase logout`). O jeito seguro é passar o token só na variável de ambiente **daquele
  comando específico**, sem tocar no login global:
  ```bash
  # bash
  SUPABASE_ACCESS_TOKEN=sbp_... supabase link --project-ref apyfxpegxjfgznmfvqzq
  SUPABASE_ACCESS_TOKEN=sbp_... supabase db push
  ```
  ```powershell
  # PowerShell — só nessa janela de terminal, não persiste
  $env:SUPABASE_ACCESS_TOKEN = "sbp_..."
  supabase db push
  ```
  O token já está salvo em `.env` (`SUPABASE_ACCESS_TOKEN`) só como referência local —
  a CLI não lê `.env` sozinha, então sempre precisa passar explícito como acima.
- `supabase/config.toml` versionado; `supabase/.temp/` (cache do link, local por máquina)
  fica de fora do git pelo `supabase/.gitignore` que o próprio `supabase init` criou.
  O link em si (`supabase/.temp/project-ref`) já está feito nesta máquina; numa máquina
  nova, rode o `supabase link` do bloco acima de novo antes de usar comandos de schema.
- Ainda sem nenhuma tabela/migration — o MVP não usa o Supabase de verdade ainda.
- **Alternativa mais segura pro futuro**: reconectar o connector Supabase do Claude
  (Configurações do Claude → Connectors) pra essa conta específica, aí dá pra gerenciar
  schema por ali sem precisar de CLI nem token nenhum guardado em arquivo.

## GitHub

- Repositório: https://github.com/GabrielScrin/educador-fisico-app (privado)
- `gh` autenticado localmente (conta GabrielScrin) e `git push -u origin main` já feito —
  histórico local e remoto sincronizados.
