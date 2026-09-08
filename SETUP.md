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

- Projeto: `apyfxpegxjfgznmfvqzq` — "arcoalianca's Project", org `oetppdvwfzmcsjmweggd`
  (https://supabase.com/dashboard/project/apyfxpegxjfgznmfvqzq)
- Client do app: `src/lib/supabase.ts` (criado, ainda não usado em nenhuma tela — o MVP
  é local-first; entra quando o produto precisar de sync entre aparelhos ou login).
- CLI local já autenticada e linkada (`supabase link --project-ref apyfxpegxjfgznmfvqzq`)
  via personal access token (`sbp_...`) dessa conta específica — **diferente** da conta
  usada nos outros projetos desta máquina. Isso trocou o *perfil padrão* da CLI
  globalmente (não é isolado por pasta). Se algum outro projeto Supabase nesta máquina
  parar de enxergar os próprios projetos, é por causa disso — rode `supabase login` de
  novo com o token daquela outra conta pra trocar de volta.
- `supabase/config.toml` versionado; `supabase/.temp/` (cache do link, local por máquina)
  fica de fora do git pelo `supabase/.gitignore` que o próprio `supabase init` criou.
  Ou seja: quem clonar este repo numa máquina nova precisa rodar
  `supabase link --project-ref apyfxpegxjfgznmfvqzq` de novo (autenticado na conta certa)
  antes de usar comandos de schema/migration.
- Ainda sem nenhuma tabela/migration — o MVP não usa o Supabase de verdade ainda.

## GitHub

- Repositório: https://github.com/GabrielScrin/educador-fisico-app (privado)
- `gh` autenticado localmente (conta GabrielScrin) e `git push -u origin main` já feito —
  histórico local e remoto sincronizados.
