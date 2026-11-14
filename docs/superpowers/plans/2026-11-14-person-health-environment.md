# Pessoa, Saúde e Ambiente — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** organizar o PostgreSQL nos três domínios pedidos, com APIs autenticadas e preservação de histórico.

**Architecture:** migração aditiva cria `person`, `health` e `environment`. A tabela `checkins` permanece como origem auditável; gatilho transacional projeta medidas em `health` e peso legado em `person`. Rotas de domínio ficam em módulo próprio registrado dentro do escopo autenticado.

**Tech Stack:** PostgreSQL 18, Node 24, Fastify, TypeScript, node:test.

**Spec:** `docs/superpowers/specs/2026-11-14-person-health-environment-design.md`.

## Global Constraints

- Nenhum dado clínico inventado; campos ausentes são nulos.
- Preservar migrações aplicadas e dados existentes.
- Cookies, CSRF e identidade da sessão continuam obrigatórios.
- Dados de Ambiente pertencem ao contexto da conta até existir autorização por missão.
- Relatos de urina/fezes são texto, não escalas clínicas presumidas.

## Review Focus

- Peso em pendência antiga não pode sobrescrever peso atual da pessoa.
- Check-in reenviado não pode duplicar Saúde nem alterar Pessoa duas vezes.
- Registro apenas de urina/fezes deve funcionar sem criar respostas comportamentais.
- Janelas de contexto e truncamento devem incluir os novos dados corretamente.
- Migração deve preencher tabelas a partir de registros anteriores, sem alterar os JSON originais.

### Task 1: modelo e escrita compatível

Files: `backend/migrations/002_person_health_environment.sql`, `backend/src/contracts.ts`, `backend/src/app.ts`, `backend/src/seed.ts`, `backend/test/domains.test.ts`.

- [x] Escrever teste que cria estrutura antiga com registros, migra, e verifica Pessoa/Saúde e peso com data.
- [x] Executar e observar falha pela ausência das novas tabelas.
- [x] Criar migração, projeção e contratos `healthDetails`; preservar `bodyMass` como entrada legada direcionada a Pessoa.
- [x] Verificar relatos isolados, idempotência e peso fora de ordem.

### Task 2: APIs e contexto

Files: `backend/src/domains.ts`, `backend/src/app.ts`, `backend/test/domains.test.ts`.

Interfaces: registrar rotas autenticadas com pool e função que resolve o ID da sessão; expor funções de leitura de Pessoa/Saúde/Ambiente para composição de `/me/context`.

- [x] Escrever testes de pessoa, saúde, ambiente, autenticação, conflito e validação.
- [x] Observar falhas nas rotas inexistentes.
- [x] Implementar GET/POST `/me/person`, GET `/me/health`, GET/POST `/me/environment` e contexto com fontes/limites.
- [x] Executar suíte completa, compilação e testes do navegador existentes.

### Task 3: banco local e documentação

Files: `backend/README.md`, `backend/IMPLEMENTATION.md`, `README.md`.

- [x] Documentar campos, unidades, exemplos, compatibilidade e consultas para pgAdmin.
- [x] Revisar as alterações completas e corrigir problemas relevantes com testes.
- [x] Aplicar migração no banco local, conferir tabelas/contagens sem exibir credenciais ou dados pessoais.
- [x] Reiniciar backend, verificar saúde e preservar alteração local do cofre.
- [x] Registrar commit na branch separada de backend; comunicar o estado exato do repositório.

## Ledger

- Base: `15cce8c`, merge já enviado à main. Arquivo local do cofre restaurado e fora dos commits.
- Decisão técnica: trabalhar em branch separada no checkout existente, aproveitando instalações e o servidor local já configurado.
- Revisão: a remoção de peso exigiu marcador independente `weight_updated_at`; reproduzido com teste que falhou e passou após a correção. Pendência mais antiga não restaura o valor removido.
- Compatibilidade: adaptador de check-ups do frontend preserva `healthDetails` e reconhece relatos como Saúde; não foram adicionadas telas de cadastro.
- Validação: 18 testes backend, 26 frontend, 5 testes no navegador, compilação dos dois projetos e lint do frontend aprovados. Banco local: duas contas preservadas, duas pessoas criadas; nenhum registro clínico ou ambiental inventado.
- Arquivo local do cofre foi posteriormente registrado em `0282fcc` por uma alteração concorrente; conteúdo preservado.
