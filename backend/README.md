# Health 7 — back-end

API de contas individuais e histórico de saúde em **Node.js 24 + TypeScript + Fastify + PostgreSQL**.
Esta branch substitui o SQLite como banco principal. Não usa Java ou Spring.

## O que esta versão entrega

- Login por usuário e senha, sessão individual com expiração e logout.
- Perfil do astronauta com nome, dia da missão, referências pessoais e `bodyModel: male | female`.
- Check-ups físicos e psicológicos persistidos e separados por astronauta.
- Relatos de sintomas com início, intensidade, região, evolução e resolução explícita.
- Contexto temporal do próprio astronauta para análise, com referências aos registros.
- Análises persistidas: resumo determinístico sem IA e adaptador HTTP opcional para um serviço de IA.
- Migrações do PostgreSQL, contas fictícias para demonstração e testes de integração.

**Esta branch altera somente o back-end.** O front atual ainda precisa de tela de login,
requisições autenticadas e armazenamento local separado por conta. O back devolve `bodyModel`;
é o front que passa esse valor ao `BodyAvatar`, que já possui as duas figuras 2D.
Não basta adicionar o login no front: a autorização é aplicada no servidor em todas as consultas.

## Arquitetura

```text
Front React no notebook/tablet
       | HTTP + cookie de sessão
       v
API Fastify
  |-- login e autorização
  |-- perfil, check-ups, sintomas e análises
  v
PostgreSQL compartilhado

Análise opcional: API -> serviço HTTP configurado de IA
                  (contexto limitado ao astronauta autenticado)
```

O banco roda no computador/servidor compartilhado, não em cada navegador.
Tablets/notebooks não se conectam diretamente ao PostgreSQL.

## Preparar o PostgreSQL

Use um PostgreSQL já instalado e crie um **banco e usuário próprios do projeto**,
por exemplo `health7`. Não use o banco de outra aplicação.
Defina `DATABASE_URL` com usuário, senha, endereço, porta e nome do banco.
Caracteres especiais da senha precisam ser codificados na URL.

Alternativa, se tiver Docker instalado:

```powershell
# Dentro de backend; configure POSTGRES_PASSWORD em .env primeiro
Copy-Item .env.example .env
docker compose up -d
```

O Compose usa PostgreSQL 18, porta local **5433** por padrão e volume persistente.
A senha do banco e a senha das contas de demonstração são configurações diferentes.
Não use `docker compose down -v` se quiser manter os dados.
O PostgreSQL de testes não é o banco de uso da demonstração.

Principais configurações:

| Variável | Uso |
|---|---|
| `DATABASE_URL` | Conexão do banco compartilhado da aplicação |
| `DEMO_PASSWORD` | Senha fictícia de 12 a 256 caracteres usada ao criar as contas |
| `POSTGRES_PASSWORD` | Senha do banco, quando usar o Compose |
| `CORS_ORIGINS` | Origens permitidas do front, separadas por vírgula |
| `COOKIE_SECURE` | `false` no HTTP local; `true` com HTTPS em produção |
| `HOST` / `PORT` | Interface de rede e porta da API |
| `TEST_DATABASE_URL` | Banco separado para os testes |
| `AI_PROVIDER_URL` | Endpoint opcional do serviço de resumo; vazio deixa IA desabilitada |
| `AI_PROVIDER_NAME` / `AI_MODEL_VERSION` | Identificação do serviço e versão do modelo para rastreabilidade |
| `AI_PROVIDER_KEY` | Token opcional do serviço, somente no back |
| `AI_PROVIDER_TIMEOUT_MS` | Tempo máximo da chamada, em milissegundos |

## Rodar no Windows / PowerShell

Abra um terminal na pasta `backend`:

```powershell
npm.cmd ci
Copy-Item .env.example .env
```

Edite `.env` com a conexão ao seu PostgreSQL e uma senha fictícia longa em
`DEMO_PASSWORD`. O arquivo é ignorado pelo Git. Copie o exemplo apenas na primeira
configuração; não sobrescreva seu `.env` preenchido.

Depois de configurar `.env`, execute:

```powershell
npm.cmd run migrate
npm.cmd run seed
npm.cmd run dev
```

Os scripts carregam o `.env` quando ele existe. As migrações também são conferidas
na inicialização, com controle de versão e checksum. O seed é idempotente: não
troca a senha de uma conta já existente. Escolha a senha antes da primeira execução.
O serviço usa a porta 3001 e o front usa 5173.
`GET http://localhost:3001/health` verifica o serviço.

Para executar a versão compilada:

```powershell
npm.cmd run build
npm.cmd start
```

Mantenha a pasta `migrations` ao lado de `dist` ao distribuir o backend compilado.

**Ainda não execute o front esperando login pronto:** essa integração é uma etapa
separada e está descrita ao final deste README.

## Contas de demonstração

O seed cria dois perfis fictícios:

| Login | Astronauta | Modelo do corpo |
|---|---|---|
| `crew02` | `crew-02` | `male` |
| `crew03` | `crew-03` | `female` |

A senha é a definida pelo operador em `DEMO_PASSWORD`, não uma senha fixa no código.
Não há cadastro público ou gerenciamento completo de usuários nesta versão.
O perfil retorna referências pessoais; a escolha do modelo visual não determina
limiares clínicos nem permite deduzir informações médicas da pessoa.

## Autenticação e acesso

- Senhas são armazenadas com hash scrypt e salt aleatório; nunca em texto puro.
- O login cria uma sessão opaca em cookie `HttpOnly`, com expiração. O banco guarda
  o hash do token da sessão. Logout revoga a sessão.
- Cookie `SameSite` e `Secure` quando configurado para HTTPS em produção.
- Requisições que alteram dados exigem `X-Requested-With: Health7`.
- Origem do front deve estar permitida em `CORS_ORIGINS`; requisições de navegador
  precisam usar `credentials: 'include'`.
- Todas as consultas privadas usam a identidade da sessão. Enviar outro `crewId`
  não troca a pessoa consultada. As rotas antigas `/crew/:id` não concedem acesso.
- O antigo `API_KEY` compartilhado deixa de autenticar os astronautas.

Utilize sempre o mesmo hostname na configuração: `localhost` e `127.0.0.1` não
são intercambiáveis para cookies. Em rede local use o IP/hostname do servidor e
configure a origem exata do front. Em produção, use HTTPS e cookies seguros.
Nenhuma senha de banco, sessão ou provedor deve ir ao Git ou a variáveis públicas do front.

Exemplo no PowerShell, depois de iniciar a API (a variável `$demoPassword` deve
conter a senha escolhida no seed):

```powershell
$headers = @{ 'X-Requested-With' = 'Health7' }
$login = @{ username = 'crew03'; password = $demoPassword } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/api/v1/auth/login' `
  -Headers $headers -ContentType 'application/json' -Body $login -SessionVariable health7Session
Invoke-RestMethod -Uri 'http://localhost:3001/api/v1/me' -WebSession $health7Session
```

No front, as requisições precisam de `credentials: 'include'`; as mutáveis também
de `Content-Type: application/json` e `X-Requested-With: Health7`. Verifique o status
HTTP antes de navegar ou marcar um registro como enviado. O cookie é gerido pelo navegador.
O front integrado envia também `X-Health7-Crew` com o perfil que originou a operação.
Se outra aba trocou o cookie para outra conta, o back rejeita a operação com 401,
sem revogar a sessão legítima da outra conta. O cabeçalho é uma proteção contra
trocas de sessão concorrentes; a identidade continua vindo da sessão no servidor.

## Rotas

Prefixo `/api/v1`:

| Método | Rota | Função |
|---|---|---|
| POST | `/auth/login` | Entrar com `{username, password}` |
| POST | `/auth/logout` | Revogar a sessão atual |
| GET | `/me` | Perfil do astronauta autenticado |
| GET / POST | `/me/checkins` | Histórico / novo check-up |
| GET / POST | `/me/symptoms` | Consultar / iniciar relatos de sintomas |
| POST | `/me/symptoms/:id/events` | Acrescentar evolução ou resolução |
| GET | `/me/context` | Contexto do próprio histórico por período |
| GET / POST | `/me/analyses` | Consultar / gerar análises rastreáveis |

`GET /health` é público. Rotas privadas sem sessão válida devolvem 401.
Registros de outra pessoa não são retornados. Consultas usam períodos e limites
para evitar carregar todo o histórico indefinidamente.

As consultas aceitam `from` e `to` ISO com fuso, com no máximo 366 dias, e `limit`
de 1 a 100 (padrão 50). Sem datas, usam os últimos 30 dias. O retorno inclui
indicador de truncamento, não um histórico necessariamente completo.
Datas impossíveis, intervalos invertidos e identificadores inválidos são rejeitados.

### Check-up

```json
{
  "clientId": "registro-unico-criado-no-front",
  "at": "2026-11-14T14:00:00Z",
  "source": "simulated",
  "vitals": {
    "heartRate": 71,
    "bloodPressure": 118,
    "bloodPressureDiastolic": 76,
    "sleep": 5.1,
    "temperature": 36.7
  },
  "behavioral": { "mood": 4, "stress": 3, "rest": 2 }
}
```

Unidades: bpm, mmHg, horas e graus Celsius. Escalas psicológicas de 1 a 5 são
autorrelato. Não se calcula diagnóstico a partir delas.
Check-ups parciais físicos ou psicológicos são permitidos, com ao menos um dado.
Ao repetir o mesmo registro, preserve `clientId` para evitar duplicações.
As datas são ISO com fuso; o servidor guarda também o horário de recebimento.

### Sintomas e evolução

Novo relato, `POST /me/symptoms`:

```json
{
  "clientId": "sintoma-001",
  "at": "2026-11-14T14:00:00Z",
  "onsetAt": "2026-11-14T10:00:00Z",
  "label": "Desconforto relatado",
  "bodyPart": "head",
  "severity": 2,
  "note": "Exemplo fictício para demonstração"
}
```

Guarde o `id` devolvido. Para acrescentar uma evolução:

```json
{
  "clientId": "evolucao-001",
  "at": "2026-11-15T14:00:00Z",
  "type": "evolution",
  "severity": 1,
  "note": "Relato de melhora"
}
```

Envie para `/me/symptoms/ID/events`. Para encerrar, use `type: resolution` e um
novo identificador de evento. A intensidade é um inteiro de **0 a 10**, sem
interpretação clínica automática. A região aceita `head`, `neck`, `chest`,
`abdomen`, `back`, `left-arm`, `right-arm`, `left-leg`, `right-leg` ou `general`.
O front precisará mapear esses nomes para as regiões de sua figura 2D.
Um episódio resolvido não recebe novas evoluções: uma recorrência é um novo episódio.
Os eventos anteriores permanecem no banco com autoria e horário. Sintoma não
relatado novamente não deve ser considerado resolvido. Não confundir a data em
que a pessoa preencheu o relato (`at`) com a data em que começou (`onsetAt`).

### Histórico e análise

Exemplo de janela explícita:

```text
GET /api/v1/me/context?from=2026-11-01T00:00:00Z&to=2026-11-15T00:00:00Z
```

Para gerar e guardar um resumo:

```json
{
  "from": "2026-11-01T00:00:00Z",
  "to": "2026-11-15T00:00:00Z",
  "method": "deterministic"
}
```

Envie para `POST /me/analyses`. A resposta registra intervalo, fontes, registros
usados e versão do método. `deterministic` é um resumo por regras, **não IA**;
funciona sem instalar um modelo. O contexto informa quando houve truncamento.

O modo `ai` depende de um serviço HTTP configurado pelo operador. Ele não treina
um modelo nem instala o n8n. O serviço recebe o contexto autorizado e deve devolver
JSON com `{ "summary": "resumo textual" }`. O pedido contém `task` e `context`.
Configure também o nome do serviço e a versão do modelo realmente utilizada.
Há timeout e limite de tamanho da resposta; falhas não se tornam análises válidas nem diagnósticos.
As referências aos registros são construídas pelo back, não aceitas cegamente do
modelo. Isso prova quais dados foram enviados; não prova que cada frase é correta.
Há uma verificação textual básica para rejeitar certas alegações clínicas. Ela
não é uma validação semântica e não garante a segurança de uma resposta: todo
resultado do modelo precisa de revisão humana e não pode orientar condutas sozinho.
O serviço de IA configurado poderá receber dados psicológicos e de saúde: use
somente ambiente e destinatário autorizados. Nenhum serviço externo vem habilitado
por padrão e os testes usam servidor HTTP fictício local.

**Não há previsão clínica de doenças, probabilidade validada ou diagnóstico.**
A função acompanha mudanças e organiza registros para revisão; qualquer evolução
para predição clínica exige dados adequados e validação independente.

## Integração futura com o front atual

1. Criar tela de login que chama `/auth/login` com cabeçalho CSRF e cookies.
2. Consultar `/me` para nome, modelo do corpo e referências individuais.
3. Passar `bodyModel` para a propriedade `gender` do componente `BodyAvatar`.
4. Trocar o `crew-02` fixo por perfil carregado; não reutilizar baseline de outro astronauta.
5. Separar check-ups, água, rascunhos e fila pendente no navegador por usuário.
6. Usar `/me/checkins` e `/me/symptoms`; sincronizar registros e atualizar a tela.
7. No logout, limpar o estado da tela. Pendências ficam vinculadas ao dono e não
   podem ser enviadas na próxima conta. Sessão expirada exige novo login.

O back sozinho não instala o aplicativo offline, não cria fila no navegador e não
sincroniza automaticamente o front. Ao guardar dados localmente em aparelho
compartilhado, também será necessário definir acesso e remoção desses dados.

## Migração do protótipo SQLite

O arquivo antigo `data/health7.sqlite` não é apagado nem importado automaticamente.
Preserve-o como cópia do protótipo. O PostgreSQL começa com esquema próprio e
perfis fictícios do seed. Se houver registros a manter, exporte-os, vincule-os ao
perfil correto e importe pela API autenticada com identificadores estáveis.
Não atribua automaticamente registros antigos sem identificação a uma conta nova.
Dados do `localStorage` também não são importados automaticamente.

## Limites atuais

- Protótipo com dados fictícios; não é um sistema clínico certificado.
- Cadastro administrativo, recuperação de senha, MFA e painel médico não estão incluídos.
- Sem permissões para um astronauta ler os registros de outro, nem acesso amplo da IA ao banco.
- Backups, política de retenção, criptografia de infraestrutura e revisão de segurança
  precisam ser definidos antes de uso com dados reais.
- O PostgreSQL depende de serviço disponível. Sem conexão, é o front que deverá
  manter uma fila de envio; o serviço de back não roda dentro do navegador.

## Testar sem alterar o banco da demonstração

Crie um banco separado de testes e configure `TEST_DATABASE_URL` para ele.
O usuário de teste precisa poder criar schemas e tabelas nesse banco.

```powershell
$env:TEST_DATABASE_URL = 'postgresql://USUARIO:SENHA@127.0.0.1:5432/health7_test'
npm.cmd test
npm.cmd run build
```

Não use a URL do banco com dados reais. Cada execução cria um schema aleatório,
executa as migrações e remove esse schema no encerramento. Sem a configuração,
os testes falham explicitamente; não são ignorados silenciosamente.
O teste de provedor de IA usa somente um servidor HTTP de teste no próprio computador.

## Mapa do código e do banco

- `src/server.ts`: configurações, porta e encerramento.
- `src/app.ts`: autenticação, autorização e rotas da API.
- `src/auth.ts`: hash de senha e de token de sessão.
- `src/contracts.ts`: campos aceitos e validação de datas e limites.
- `src/database.ts`: pool PostgreSQL e aplicação transacional das migrações.
- `src/manage.ts` e `src/seed.ts`: comandos de migração e criação dos perfis fictícios.
- `migrations/`: esquema versionado; não edite uma migração já aplicada.
- `test/api.test.ts`: testes de integração da API com PostgreSQL real.
- `test/auth.test.ts`: hash, salt e verificação de senhas.
- `compose.yaml`: PostgreSQL local opcional por Docker.

Tabelas: `crew` (perfil e credenciais), `sessions`, `checkins`, `symptoms`,
`symptom_events`, `analyses` e `schema_migrations`.
Índices relacionam registros ao astronauta e à data. Check-ups usam `jsonb` para
os campos; datas e vínculos permanecem em colunas próprias. Eventos de sintomas
têm proteção no banco contra alteração e exclusão; correções devem ser novos
eventos e políticas de retenção exigem um procedimento administrativo próprio.
