# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Delegação para subagentes (quando fizer sentido)

Para tarefas pequenas e diretas (ajuste em 1 arquivo, fix pontual, mudança de config), edite direto — não delegue por delegar.

Delegue para um subagente (tool Agent) quando a tarefa for:
- multi-arquivo ou exigir explorar a base antes de decidir onde mexer;
- uma revisão de código, debug não óbvio, ou algo que exija julgamento;
- paralelizável em partes independentes (nesse caso, dispare os agentes na mesma mensagem, não em série).

Ao delegar:
- escolha o modelo pelo tipo de tarefa: mecânico/busca → modelo mais leve; multi-arquivo/debug → padrão; julgamento/arquitetura → modelo mais forte. Sem certeza do modelo? Use o padrão, não faça a tarefa você mesmo só por isso.
- o subagente não herda contexto da conversa: passe a tarefa completa, paths relevantes, restrições (ex.: versão do Expo v57) e o formato de retorno esperado.
- depois de rodar, verifique o resultado (testes, typecheck, git diff) antes de considerar concluído.
