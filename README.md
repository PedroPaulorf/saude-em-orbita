# Saúde em Órbita

Base de organização para uma equipe de 5 pessoas no desafio **Create Health Monitoring Software for Astronauts on Space Missions**.

## Escolha sua área
| Papel / área | Responsável | Entrega inicial |
|---|---|---|
| 1. Pesquisador(a) — pesquisa e saúde | A definir | Indicadores e fontes confiáveis |
| 2. Designer UI/UX — experiência e design | A definir | Jornada e protótipo visual |
| 3. Programador(a) front-end — interface | A definir | Telas e entrada de indicadores |
| 4. Programador(a) back-end — dados e regras | A definir | Modelo de dados e lógica explicável |
| 5. Apresentador(a) e coordenador(a) — integração e apresentação | A definir | Integração, roteiro e demonstração |

Cada pessoa assume uma área principal e ajuda na revisão de outra.

## Começar
Abra a pasta `cofre` como cofre no Obsidian e entre em **Início**. Preencha **Equipe**, escolha tarefas no **Quadro de tarefas** e registre decisões.

## Colaborar
Veja [CONTRIBUTING.md](CONTRIBUTING.md): uma branch por tarefa, PR para `main` e revisão por outro membro. Modelos de tarefas e PRs incluídos.

**Status:** protótipo Health7 implementado, com frontend React, backend Node/Fastify e PostgreSQL. Login individual, avatar por perfil, check-ups, histórico de sintomas, prevenção, progresso e chat opcional com n8n.

Para executar no notebook, siga o [README do backend](backend/README.md) para configurar o banco e iniciar a API; depois siga o [README do frontend](frontend/README.md). Os dados de saúde são fictícios para demonstração. Água, planos e conversa permanecem locais e separados por conta; check-ups e sintomas são persistidos no PostgreSQL.

O banco se organiza em **Pessoa, Saúde e Ambiente**. Consulte [a estrutura e os exemplos da API](backend/DATABASE.md): peso em Pessoa; medidas corporais, urina e fezes em Saúde; radiação, altitude, temperatura ambiente e oxigênio em Ambiente.
