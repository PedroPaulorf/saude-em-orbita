# Saúde em Órbita — Health 7

Projeto da equipe no NASA Space Apps 2026 para o desafio **Create Health Monitoring Software for Astronauts on Space Missions**.

O Health 7 é um protótipo com frontend React, backend Node/Fastify e PostgreSQL. Ele tem login individual, avatar por perfil, check-ups, histórico de sintomas, prevenção, progresso e um chat opcional com n8n. Os dados de saúde são fictícios e servem só para a demonstração.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `frontend/` | Interface (React + Vite + Tailwind + shadcn/ui). Veja o [README do frontend](frontend/README.md). |
| `backend/` | API e banco. Veja o [README do backend](backend/README.md) e a [estrutura do banco](backend/DATABASE.md). |
| `dados/` | Dados fictícios da pesquisa (NEXUS-Med) e os JSON derivados. Veja o [README dos dados](dados/README.md). |
| `docs/` | [Dados médicos e rastreabilidade](docs/medical-data.md). |
| `health7-design-system/` | Tokens e componentes de referência usados pelo frontend. |
| `cofre/` | Cofre do Obsidian com as decisões, os planos e a pesquisa. Comece por **Início**. |

## Executar

1. Configure o banco e inicie a API seguindo o [README do backend](backend/README.md).
2. Inicie a interface seguindo o [README do frontend](frontend/README.md).

Água, planos e conversa ficam no navegador, separados por conta. Check-ups e sintomas ficam no PostgreSQL, organizados em **Pessoa, Saúde e Ambiente**: peso em Pessoa; medidas corporais, urina e fezes em Saúde; radiação, altitude, temperatura ambiente e oxigênio em Ambiente.

## Colaborar

Veja [CONTRIBUTING.md](CONTRIBUTING.md): uma branch por tarefa, um PR para `main` e a revisão de outro membro.
