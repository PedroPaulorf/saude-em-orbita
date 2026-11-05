# Como colaborar

1. Clone o repositório quando estiver publicado e abra `cofre` no Obsidian.
2. Atualize sua cópia antes de editar. Combine quem altera notas compartilhadas para evitar conflitos.
3. Abra uma issue com objetivo, responsável e critério de conclusão.
4. Crie uma branch: `docs/nome-da-tarefa`, `feat/nome-da-tarefa` ou `fix/nome-da-tarefa`.
5. Envie commits pequenos com mensagens claras em português.
6. Abra um pull request para `main` usando o modelo e peça revisão de outro membro.
7. Após revisão, integre e atualize o quadro de tarefas.

Exemplo após clonar:
```sh
git switch main
git pull --ff-only
git switch -c docs/definir-indicadores
git add cofre
git commit -m "docs: definir indicadores candidatos"
git push -u origin docs/definir-indicadores
```
No GitHub, use **Compare & pull request**. Exigir aprovação por regra de branch depende da configuração e disponibilidade do plano; não está configurado automaticamente.

Use dados fictícios identificados como simulados. Não publique credenciais, informações pessoais ou dados reais de saúde. Registre fontes e limitações de interpretações médicas. Tecnologias e regras clínicas permanecem em aberto.
