# Orientação de teste do app (Android/Expo)

Este documento registra a hierarquia de testes combinada com o usuário pra validar mudanças neste app antes de considerar algo pronto, e como manter esse registro atualizado. Adaptado do processo já validado no projeto irmão `AbastecAI` (`G:\dev\AbastecAI\ARQUITETURA.md`, seções 7, 21.2, 22 e 31) — mesma stack (Expo + React Native + Supabase), mesmas ferramentas de teste.

Dados deste projeto: `applicationId`/`package` Android = `com.educadorfisico.app`, esquema de deep link = `educadorfisicoapp://`. **Ainda não há um dev client/build de produção convivendo lado a lado neste device** (projeto em estágio inicial) — quando isso passar a existir, confirmar o nome exato do pacote do dev client (normalmente algo como `com.educadorfisico.app.dev`, dependendo de como o `eas.json`/`app.config` for configurado) antes de aplicar a regra do item 4 abaixo.

## Hierarquia de teste

**1. Device físico conectado (preferencial)**
- Metro + dev client já instalado — sem gerar `.apk`/`.aab` novo, a não ser que uma dependência **nativa** tenha sido adicionada/removida desde o último build instalado (ex.: `expo-router`, `expo-sqlite`, `react-native-gesture-handler`, `reanimated` já estão no `package.json` deste projeto — qualquer pacote novo com módulo nativo exige rebuild).
- Interagir via `adb shell input tap`/`swipe` (usar a resolução física do device, `adb shell wm size`, não o tamanho da imagem lida).
- Confirmar visualmente com `adb exec-out screencap -p > arquivo.png` e ler a imagem — nunca só inferir pelo código ou confiar em descrição verbal da tela.
- Repetir o teste exatamente no mesmo ponto/estado onde o bug apareceu antes de declarar resolvido (evita falso-positivo por sorte de timing/estado).
- Double-tap real (ex.: zoom) precisa dos dois toques em sequência sem `sleep` entre eles no mesmo comando — com delay o Android trata como toques separados.
- `adb` **não simula pinça** (multi-touch de dois dedos) — pra bugs que só aparecem com gesto contínuo real, a garantia vem do código ou de pedir pro usuário testar com o dedo.
- **Antes de instalar/desinstalar qualquer coisa num device físico**, sempre checar o que já está instalado (`adb shell pm list packages | grep <nome>`) — nunca assumir que é "só um device de teste". Ver seção 21.2 do `ARQUITETURA.md` do AbastecAI: um `adb uninstall` sem checagem prévia apagou o app de produção real do usuário.
- **Deep links via `adb shell am start`**: sempre com `-p <pacote exato>` explícito assim que dev client e produção conviverem no mesmo device. Sem isso, o Android pode ou travar num seletor de app sem efeito (`ResolverActivity`) ou — pior — abrir direto o app errado sem aviso nenhum, se já existir uma preferência de app padrão salva pra aquele esquema (caso real documentado na seção 31 do AbastecAI).

**2. Emulador Android (quando não há device físico disponível)**
- Mesmo ciclo do device físico (screenshot real via `adb`, não inferência).
- Cuidado com GPU de emulador em máquinas com placa mais fraca: pode renderizar mapa/telas com efeito visual em branco/preto sem erro nenhum — forçar `-gpu swiftshader_indirect` se acontecer (mais lento, mas correto).
- Se o emulador crashar ao abrir com janela: reinstalar o componente `emulator` do SDK do zero (apagar a pasta antes de reinstalar, não só renomear).

## Como manter isso atualizado

Este projeto ainda não tem um `ARQUITETURA.md` próprio. Quando a primeira sessão de teste real acontecer (rebuild nativo, device físico, bug de UI, etc.), o padrão a seguir é o mesmo do AbastecAI:

1. Criar `ARQUITETURA.md` na raiz do projeto (ver skill `doc-arquitetura` disponível no Claude Code).
2. Cada sessão relevante de build/teste ganha uma seção numerada e datada.
3. **Incidentes** (algo quebrou, um teste deu falso-positivo/negativo, um comando teve efeito colateral inesperado) merecem registro específico com: o que aconteceu, **por quê** (causa raiz quando conhecida, ou hipótese marcada como não confirmada), e a **lição prática** pra próxima sessão não repetir o erro.
4. Esta seção de hierarquia de teste deve ser copiada/adaptada pra dentro do `ARQUITETURA.md` assim que ele existir (como seção própria, ex. "Verificação visual real via screenshot por `adb`"), e o conteúdo deste arquivo (`TESTE_APP.md`) pode então ser removido ou apontar pra lá.
5. Sempre que um novo comportamento divergente do que está documentado aqui for observado (ex.: um `-p` que devia bloquear mas não bloqueou), registrar como incidente novo em vez de simplesmente sobrescrever a orientação antiga — mantém rastreável o que mudou e quando.
