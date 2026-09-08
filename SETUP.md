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

Qualquer variável prefixada com `EXPO_PUBLIC_` é embutida no bundle do app (extraível de
dentro do APK/IPA por qualquer pessoa). Por isso a chave secreta **nunca** leva esse
prefixo — ela existe só pra rodar comandos locais (migrations, seed), nunca é lida pelo
código do app (`src/lib/supabase.ts` usa só a `publishable`).

## Supabase

- Projeto: `apyfxpegxjfgznmfvqzq` (https://supabase.com/dashboard/project/apyfxpegxjfgznmfvqzq)
- Client do app: `src/lib/supabase.ts` (criado, ainda não usado em nenhuma tela — o MVP
  é local-first; entra quando o produto precisar de sync entre aparelhos ou login).
- **Pendência**: a Supabase CLI nesta máquina está logada numa conta que não tem acesso a
  esse projeto (`supabase link` falhou com erro de permissão). Pra usar a CLI de verdade
  neste projeto (migrations via `supabase db push`, `supabase link`, etc.), rode
  `supabase login` de novo escolhendo a conta dona desse projeto, depois:
  ```bash
  supabase link --project-ref apyfxpegxjfgznmfvqzq
  ```

## GitHub

- Repositório: https://github.com/GabrielScrin/educador-fisico-app (privado)
- **Pendência**: o `gh` CLI local não está autenticado (`gh auth status` falha), então o
  `git push` ainda não foi feito — só existe local. Rode `gh auth login` (login via
  navegador) e depois:
  ```bash
  git push -u origin main
  ```
