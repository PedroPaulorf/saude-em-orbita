# Health 7 — front-end com login e avatar individual

React + TypeScript + Vite. Esta branch conecta o front ao backend PostgreSQL de
`../backend`. O nome do projeto é Health 7. O visual continua usando os componentes
e os tokens do design system do repositório.

## Rodar

1. Configure e inicie o backend seguindo [backend/README.md](../backend/README.md).
2. Na pasta `frontend`:

```powershell
npm.cmd ci
npm.cmd run dev -- --port 5173 --strictPort
```

Abra `http://localhost:5173`. Use o mesmo hostname para front e API; não misture
`localhost` com `127.0.0.1`. O backend precisa permitir a origem do front em
`CORS_ORIGINS`. A configuração padrão usa API no mesmo hostname, porta 3001.
Para outro endereço, configure `VITE_API_URL`, sem `/api/v1`, e reinicie o Vite.
Essa variável contém apenas endereço público; não coloque senha, token de banco
ou chave do provedor de IA nela.

## Contas

O seed do backend cria `crew02` (avatar masculino) e `crew03` (avatar feminino).
A senha é a escolhida em `backend/.env`, campo `DEMO_PASSWORD`, na primeira
execução do seed. Senhas não são incluídas no repositório.

- Login valida a conta no servidor e recebe cookie HttpOnly.
- Ao recarregar, o front consulta `/api/v1/me` para restaurar a sessão.
- O perfil fornece nome, dia da missão, baseline e `bodyModel`.
- Log out encerra a sessão e remove os dados da conta anterior da tela.
- Sessão expirada pede novo login. O armazenamento local não autentica uma pessoa.

## Avatar e dados pessoais

A Home mostra o modelo 2D selecionado no perfil. O clique em uma região abre
Detailed stats com a região selecionada. A figura é uma organização visual dos
registros; não representa diagnóstico de um órgão.

| Região | Registros apresentados |
|---|---|
| Cabeça | Sono, autorrelatos de descanso/humor/estresse e sintomas relacionados |
| Peito | Frequência cardíaca, pressão e sintomas relacionados |
| Tronco | Temperatura e relatos associados ao tronco |
| Braços e pernas | Sintomas associados à região |

Os registros pessoais mostram datas e horas. Quando não há dados, a tela informa
isso; o histórico fictício antigo não preenche automaticamente uma conta vazia.
As regras visuais continuam sendo de demonstração. Conteúdo informativo do NASA
HRP aparece separado dos registros do astronauta, com indicação de fonte.
O modelo 3D não faz parte desta entrega; o 2D já é o avatar interativo.

## Salvamento e sincronização

O check-up é salvo localmente na conta correta antes do envio. O front envia
`clientId`, `at`, `source`, `vitals` e `behavioral` para `/api/v1/me/checkins`.
O identificador é preservado no reenvio, evitando duplicação.

- Confirmação da API permite marcar o registro como sincronizado com o servidor.
- Falha de rede mantém o registro pendente; Sync now permite nova tentativa.
- Erros de validação/conflito não devem ser tratados como envio bem-sucedido.
- O histórico é consultado no servidor para refletir registros de outros aparelhos.
- Sincronização com o servidor local não significa envio à Terra ou revisão médica.

Check-ups pendentes e água são separados por astronauta no navegador. A chave
compartilhada antiga não é importada automaticamente, pois não identifica o dono.
Dados pendentes de uma conta não devem ser enviados na sessão de outra conta.
Água continua sendo um registro local, sem sincronização com o backend nesta versão.
O armazenamento local não é criptografado; este protótipo usa dados fictícios.

## Verificar

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Para testar no navegador com PostgreSQL real e schema isolado:

```powershell
$env:TEST_DATABASE_URL = 'postgresql://USUARIO:SENHA@127.0.0.1:5432/health7_test'
npm.cmd run test:e2e
```

Use um banco separado, nunca o banco da demonstração. O runner cria um schema
aleatório, aplica migrações, cria contas fictícias e remove esse schema no final.
Ele inicia API e front nas portas **3003 e 5174** e não reutiliza serviços existentes.
Instale Chromium para Playwright (`npx playwright install chromium`) ou indique um
navegador Chromium já instalado por `PLAYWRIGHT_EXECUTABLE_PATH`.

Os testes de navegador verificam conta/modelo, clique na cabeça, histórico próprio,
troca de conta e reenvio sem duplicar. Não enviam dados a um serviço de IA.

## O que continua fora

- Aplicativo instalável/PWA e abertura offline completa.
- IA conversacional e modelo 3D.
- Previsão clínica de doenças, diagnóstico ou avaliação médica automatizada.
- Compartilhamento de dados entre astronautas sem permissão.
- Sincronização do registro local de água.

## Design e dados de pesquisa

`src/index.css` usa o design system do projeto. Os componentes visuais ficam em
`src/components/app` e `src/components/ui`; as figuras masculina e feminina estão
em `src/data/body-paths.ts`. O DONKI continua com consulta própria e cópia local:

```powershell
npm.cmd run data:risks
npm.cmd run data:donki
```

Eventos solares não informam dose recebida pelo astronauta. Os documentos HRP e os
valores pessoais devem permanecer claramente identificados por origem.
