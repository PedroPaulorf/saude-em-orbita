# Como rodar com os mesmos tripulantes

Guia rápido para quem acabou de fazer o `git pull`. No fim você terá o app com os **6 tripulantes fictícios NEXUS-Med** (`nx01` a `nx06`) e o histórico de check-ups, sintomas e ambiente iguais aos do projeto original.

## Por que os dados são os mesmos

Os dados **não vêm do banco de ninguém**. Eles estão no Git, em `dados/derivados/*.json`. Ao subir, o back lê esses arquivos e cria tudo no **seu** PostgreSQL. Dois bancos, mesmo conteúdo.

A data de "hoje" é recalculada na hora da importação: o último dia de cada tripulante cai em hoje, e os dias anteriores ficam para trás. Por isso a tela "Today's measures" sempre tem medidas.

## O que você precisa

- Node.js 24 ou mais novo
- Docker (para o PostgreSQL) ou um PostgreSQL próprio
- Python 3 só se mudar as planilhas em `dados/` (não é preciso para rodar)

## Passo a passo

### 1. Banco (PostgreSQL)

```bash
cd backend
cp .env.example .env
```

Edite `backend/.env`:

| Variável | O que pôr |
|---|---|
| `POSTGRES_PASSWORD` | uma senha qualquer para o banco |
| `DATABASE_URL` | a mesma senha na URL: `postgresql://health7:SUA_SENHA@127.0.0.1:5433/health7` |
| `DEMO_PASSWORD` | `health7-demo-2026` (já vem preenchida no exemplo). É a senha de login dos tripulantes |
| `NEXUS_AUTO_REANCHOR` | `true` (já vem no exemplo): importa os tripulantes sozinho |

Suba o banco:

```bash
docker compose up -d
```

> **Porta 5433 ocupada?** Se já houver outro Postgres nela, troque `POSTGRES_PORT` (por exemplo `5434`) e use a mesma porta na `DATABASE_URL`.
> Se você já tem um PostgreSQL, crie nele o banco e o usuário `health7` e só ajuste a `DATABASE_URL`.

### 2. Back-end

```bash
cd backend
npm ci
npm run dev
```

Na primeira subida ele aplica as migrações e **importa os 6 tripulantes**. No log aparece `NEXUS: dados ancorados em dia antigo; reimportando...`. Confira em <http://localhost:3001/health>.

Opcional: `npm run seed` cria também `crew02` e `crew03`, dois perfis simulados sem histórico. Não são necessários para os tripulantes NEXUS.

### 3. Front-end

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

Abra <http://localhost:5173>.

O `.env.local` aponta para a API (`VITE_API_URL=http://localhost:3001`) e para os fluxos do n8n do chat, do roteiro e do alerta. **Sem esse arquivo o chat fica em modo de demonstração** ("Demo reply") e não chama o n8n.

### 4. Entrar

| Login | Tripulante | Dia de voo hoje | Para que serve |
|---|---|---|---|
| `nx01` | NX-01, Mission Specialist | 2 | Adaptação do início do voo |
| `nx02` | NX-02, Pilot | 30 | Controle, sem falso positivo |
| `nx03` | NX-03, Payload Specialist | 14 | Mudança persistente sem emergência |
| `nx04` | NX-04, Flight Engineer | 19 | Plano de hidratação |
| `nx05` | NX-05, Crew Medical Officer | 30 | Estável em voo |
| `nx06` | NX-06, Commander | 14 | Alerta (red flag no dia 14) |

**Senha de todas as contas: `health7-demo-2026`**

| Login | Senha |
|---|---|
| `nx01`, `nx02`, `nx03`, `nx04`, `nx05`, `nx06` | `health7-demo-2026` |
| `crew02`, `crew03` (só depois de `npm run seed`) | `health7-demo-2026` |

É uma senha **fictícia de demonstração**, igual para todos, e as contas só existem em banco local. Ela vale porque o `DEMO_PASSWORD` do `.env` é usado ao criar as contas. Se você usar outro valor, a senha será esse valor. Se o banco já tinha as contas, a senha antiga continua.

## Quando o dia vira

Com `NEXUS_AUTO_REANCHOR=true`, o back confere a cada 10 minutos se a data de "hoje" dos tripulantes ficou para trás. Se sim, ele **apaga e recria só os registros de `nx01` a `nx06`** com hoje = data atual. Efeitos:

- Check-ups que você fizer à mão nessas contas são perdidos na virada do dia.
- A sessão cai e é preciso entrar de novo.
- `crew02` e `crew03` não são afetados.

Para um banco "de verdade", sem essa limpeza, deixe `NEXUS_AUTO_REANCHOR` vazio ou apague a linha.

## Importar ou refazer na mão

Dentro de `backend/`, com o `.env` preenchido:

```bash
npm run import:nexus                  # importa (não duplica se já existir)
npm run import:nexus -- --reset       # apaga e recria os 6 com hoje = data atual
npm run import:nexus -- --only NX-04 --today-day NX-04=21 --reset
```

Detalhes e opções em [backend/README.md](backend/README.md).

## Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| Tela com "No measurements recorded today" | Os dados ficaram com a data de ontem. Reinicie o back (ele reimporta) ou rode `npm run import:nexus -- --reset`. |
| Banner "Cannot reach the server" | O back não está rodando, ou `VITE_API_URL` não bate com a porta do back. |
| Chat com "Demo reply" | Falta o `frontend/.env.local`. Copie o `.env.example` e reinicie o front. |
| `docker compose` reclama de `POSTGRES_PASSWORD` | Falta o `backend/.env`. |
| Erro de conexão no back | Porta ou senha da `DATABASE_URL` diferente das do Compose. |
| Não consigo entrar com `nx01` | Use `health7-demo-2026`. Se mudou o `DEMO_PASSWORD` depois de criar as contas, a senha antiga ficou valendo: apague o banco (`docker compose down -v`) e suba de novo. |

Os arquivos `.env` e `.env.local` ficam fora do Git de propósito. Não os envie por commit.
