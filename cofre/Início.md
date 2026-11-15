# Saúde em Órbita

Cofre da equipe no NASA Space Apps 2026, desafio **Create Health Monitoring Software for Astronauts on Space Missions**. O sistema se chama **Health 7** (ver [[Decisões]]).

> [!warning] Prazo
> A submissão fecha **domingo, 15/11, às 23h59**. Congelar funcionalidades às 15h. Ver [[Guia de submissão do projeto]].

## 01 Projeto

- [[Desafio e escopo]]: o enunciado recebido e os critérios que guiam o protótipo.
- [[Escopo do protótipo]]: o que a reunião decidiu, a avaliação crítica e o recorte final.
- [[Decisões]]: o registro das decisões e de quando revê-las.
- [[Equipe]]: quem faz o quê.
- [[Guia de submissão do projeto]]: regras, campos, demo e prazo de envio.
- [[Transcrição da reunião]]: a transcrição automática do brainstorming, de onde saiu o escopo.

## 02 Planos

Os planos 1 a 3 já foram implementados; o 4 está a implementar. Cada um termina com uma seção "Desvios", que registra o que mudou na implementação.

1. [[Plano do front-end v2]]: o novo visual, as telas, a gamificação e o chat com n8n.
2. [[Plano do front-end v3 - medicina preventiva]]: os sinais precoces, o plano de volta à linha de base e a radiação acumulada.
3. [[Plano do assistente - monitoramento e plano de ação]]: os dados NEXUS-Med, o motor de regras, os estados de alerta e o plano de ação.
4. [[Plano do front-end v4 - UX e UI]]: a avaliação das telas e as correções de leitura, cor e hierarquia.

## 03 Pesquisa

- [[Recursos oficiais]]: as fontes registradas e as revisões pendentes.
- [[Riscos NASA HRP]]: os 17 riscos do voo espacial humano, com uma nota por risco. O front gera `hrp-risks.json` a partir dessas notas.
- [[DONKI - clima espacial da NASA]] e [[DONKI - documentação da API]]: o dado real da NASA no painel.
- [[Monitoramento de radiação e saúde dos astronautas (CSA)]]
- [[NTRS - arquitetura de dados e autonomia médica]]: MDA, EIMO, AMO e IMM, com as referências, as aplicações no Health 7 e os limites.
- [[Padrões de projetos vencedores do Space Apps]]: os critérios de julgamento e o que os projetos premiados têm em comum.
- [[Diferencial competitivo do Health7]]: comparação com os concorrentes e o argumento para o pitch.

## Fora do cofre

- Código: `frontend/` (React) e `backend/` (Fastify + PostgreSQL). Veja o `README.md` na raiz do repositório.
- Dados fictícios da pesquisa: `dados/`.
- Imagens do cofre: `anexos/`.
