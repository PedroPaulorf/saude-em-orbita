# Health 7 — back-end

API compartilhada para receber e consultar os check-ups do front React existente.
Node.js **24 ou superior**, TypeScript, Fastify e SQLite (`node:sqlite`).
Sem Java, IA, n8n ou chamadas externas nesta entrega.

## Executar

Dentro de `backend/`:

```sh
npm ci
```

PowerShell:

```powershell
$env:API_KEY = 'troque-por-um-token-aleatorio-longo'
npm run dev
```

Linux/macOS:

```sh
API_KEY='troque-por-um-token-aleatorio-longo' npm run dev
```

Para compilar: `npm run build`. Para iniciar o código compilado: `npm start`.
Testes: `npm test` (banco temporário, sem alterar o banco da demonstração).
As configurações estão em `.env.example`. O servidor lê variáveis de ambiente;
para carregar um arquivo `.env` na versão compilada, use `node --env-file=.env dist/server.js`.

O banco é criado automaticamente em `backend/data/health7.sqlite` e preservado
entre reinícios. Execute os comandos na pasta `backend`. Os arquivos do banco
e segredos não entram no Git. A hospedagem precisa de disco persistente; não
coloque o arquivo SQLite em pasta de rede ou em OneDrive para uso simultâneo.
Somente o processo da API acessa esse arquivo; tablets consultam a API.

## Tablets na rede local

Configure `HOST=0.0.0.0` para aceitar conexões da rede. O front chama
`http://IP-DO-SERVIDOR:3001`; `localhost` no tablet aponta para o próprio tablet.
Configure `CORS_ORIGINS` com a origem real do front, incluindo porta, por exemplo
`http://192.168.1.20:5173`. Várias origens são separadas por vírgula.
O servidor do front também precisa aceitar conexões da rede. Portas e firewall
devem permitir os aparelhos da demonstração. Em uso real, servir por HTTPS.

## Rotas

Todas as rotas `/api/v1` exigem `X-API-Key`. `GET /health` é público.

| Método | Rota | Resultado |
|---|---|---|
| GET | `/health` | Estado do serviço |
| GET | `/api/v1/crew/crew-02` | Tripulante fictício e linha de base |
| POST | `/api/v1/crew/crew-02/checkins` | Salvar check-up |
| GET | `/api/v1/crew/crew-02/checkins` | Histórico, mais recente primeiro |

O histórico aceita `from` e `to` (data/hora ISO com fuso, inclusivos),
e `limit` (1–100, padrão 50). Resposta `{ "items": [...], "limit": 50 }`.
Nesta primeira versão não há paginação por cursor.

Exemplo do corpo POST, compatível com os nomes já usados pelo front:

```json
{
  "clientId": "tablet-01-registro-001",
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

Unidades: bpm, mmHg, horas e graus Celsius. Escalas comportamentais são inteiros
de 1 a 5. Pressão exige os dois valores juntos. Aceita check-up só físico ou só
comportamental, com pelo menos uma resposta. Sono zero é válido. Validações de
formato e domínio não são regras clínicas nem geram diagnóstico.

O POST devolve os campos enviados, `id`, `crewId` e `receivedAt`. Novo registro:
HTTP 201. Mesmo `clientId`, tripulante e conteúdo: HTTP 200, mesmo registro.
Mesmo identificador com conteúdo diferente: HTTP 409. Dados inválidos: 400;
token ausente/incorreto: 401; tripulante desconhecido: 404.

## Conectar o front (próxima etapa)

O front existente **não foi alterado nem conectado automaticamente** nesta entrega.
Em `frontend/src/lib/storage.ts`, o objeto atual já tem `at`, `vitals` e `behavioral`.
O adaptador de sincronização deve:

1. Acrescentar `clientId` (UUID) e `source: simulated` ao criar o registro.
2. Salvar localmente esse mesmo objeto antes de enviar, mantendo o identificador.
3. Enviar o POST com `Content-Type: application/json` e `X-API-Key`.
4. Marcar como sincronizado somente após HTTP 200/201. Repetir com o mesmo
   identificador se a resposta se perder. Em 409, mostrar conflito; não repetir indefinidamente.
5. Atualizar o histórico pelo GET para enxergar registros de outros tablets.

Os cálculos atuais de estados e o DONKI continuam no front. Receber um check-up
na API não significa que ele foi enviado à Terra, analisado por IA ou revisado
por um médico. A fila offline ainda depende dessa integração no front.

## Limites do esqueleto

- Apenas o perfil fictício `crew-02` é criado automaticamente; sem cadastro de usuários.
- Somente dados simulados são aceitos. Token compartilhado serve à demonstração,
  não distingue pessoas ou permissões. Quem conhece o token pode consultar todos
  os tripulantes existentes. Não inserir dados reais de saúde nesta versão.
- Autenticação individual, autorização de registros psicológicos, auditoria,
  backups, limitação de requisições e sincronização completa são próximos passos.
- O token não deve entrar no Git. Um token usado pelo navegador não é segredo
  contra quem tem acesso a esse navegador; CORS não substitui autenticação.
- O serviço de IA poderá consultar a API em uma etapa posterior.

## Organização

- `src/app.ts`: rotas e configuração testável, sem abrir porta.
- `src/contracts.ts`: contrato e validação dos check-ups.
- `src/database.ts`: esquema SQLite, índice e perfil fictício.
- `src/server.ts`: configuração por ambiente, porta e encerramento.
- `test/api.test.ts`: integração com a API e banco SQLite real temporário.
