# Dados médicos, referências e sincronização

O Health7 usa **PostgreSQL**, login com cookie de sessão e histórico separado por astronauta. A tela **Medical data & sources** (`#/data`), acessível pelo cartão Report após login, mostra referências NTRS, estados de envio, avaliações versionadas e cenários educativos privados da conta.

Esta integração amplia as estruturas existentes de Pessoa, Saúde e Ambiente. Não cria um segundo banco SQLite nem uma fila paralela, e não usa `crew-02` fixo ou chave compartilhada no navegador.

## Onde aparece na interface

- **Detailed stats / Today's measures:** mostra método de coleta, qualidade registrada, horário UTC e sincronização de cada medição. Não apresenta o instrumento da configuração como se fosse procedência confirmada daquele registro.
- **Painel da região:** “Why this state?” explica a comparação e os limiares da avaliação salva. Versões e identificadores ficam em “Assessment record”.
- **Personal records:** “Measurement details” preserva a linha de base e a avaliação de cada data, inclusive o aviso de avaliação retrospectiva. A referência atual do perfil é apresentada separadamente. Sem snapshot, o histórico não inventa uma avaliação antiga.
- **Report:** inclui procedência e detalhes das avaliações das medidas sinalizadas; as demais medidas registradas ficam em uma seção recolhida. Prévias locais são identificadas explicitamente.
- **Sources & methodology:** link no rodapé das estatísticas para as referências de arquitetura e seus limites.
- **Progress / Mission planning:** acesso ao simulador educativo em seção separada das medições pessoais.

Quando existe um snapshot correspondente ao valor e horário da medição, o painel e o relatório usam seu estado e sua linha de base preservados. Sem snapshot, a comparação de hoje é uma prévia local com a referência atual; não é apresentada como avaliação arquivada. A mudança posterior de uma linha de base pessoal não reclassifica silenciosamente uma avaliação já salva.

## Executar

Requer Node.js 24 ou superior e PostgreSQL. Siga `backend/README.md` para configurar `DATABASE_URL`, contas fictícias (`DEMO_PASSWORD`) e `CORS_ORIGINS`. Não sobrescreva um `.env` já preenchido.

Dentro de `backend/`:

```powershell
npm ci
npm run migrate
npm run seed
npm run dev
```

Em `frontend/.env.local`, configure a origem da API, sem `/api/v1`:

```dotenv
VITE_API_URL=http://localhost:3001
```

Dentro de `frontend/`, execute `npm ci` e `npm run dev`. Entre com uma conta fictícia criada pelo seed e a senha configurada. O padrão da API é o hostname do front na porta 3001. Reinicie o Vite após mudar variáveis. Tablets devem apontar para o servidor, com origens permitidas configuradas; `localhost` no tablet aponta para ele próprio.

## Migração e persistência

A migração adicional `003_medical_traceability.sql` preserva as tabelas e os registros anteriores. O controle de checksum das migrações existentes permanece ativo.

A `004_nexus.sql` acrescenta, sem apagar nada, `health.urinations_24h` e `stools_24h` (projetados de `healthDetails` do check-up) e o contexto de cabine do RR-1 em `environment` (`radiation_dose_mgy_day`, `radiation_accum_mgy`, `co2_ppm`, `relative_humidity_pct`). A coluna antiga em mSv continua para os registros que já a usam; mGy não é convertido. A tripulação fictícia NEXUS-Med entra por `npm run import:nexus` (ver `backend/README.md` e `dados/README.md`).

| Tabela adicional | Conteúdo |
|---|---|
| `medical_references` | Quatro referências NTRS, links e papel de arquitetura/metodologia. |
| `medical_rules` | Conjuntos de regras de demonstração versionados, com `clinicalSource: null`. |
| `medical_observations` | Valor, unidade, horário, procedência, linha de base pessoal, regra e resultado por medida/check-up/conta. |
| `mission_simulations` | Cenários educativos, entradas, resultados, semente e conta proprietária. |

Ao iniciar a API, o registro de fontes e regras é preenchido de forma idempotente. Check-ups anteriores que ainda não têm avaliações recebem snapshots **retrospectivos**, identificados como tal: usam a linha de base disponível na atualização, sem alegar que ela era a linha de base na data original. Procedência ausente continua `unknown`; o payload original não é reescrito.

Novos check-ups, projeções em Saúde/Pessoa e avaliações são gravados na mesma transação. A perda de uma gravação de avaliação desfaz também o check-up e suas projeções. Reenvios simultâneos com o mesmo `clientId` não duplicam registros. Mesmo identificador com conteúdo diferente continua retornando HTTP 409.

Cada avaliação preserva a linha de base pessoal usada, um identificador derivado do conteúdo dessa linha de base, a versão da regra e a explicação. Uma mudança posterior do perfil não recalcula avaliações antigas. Sem linha de base pessoal ou regra, a medida recebe `not-evaluated`. A diastólica é preservada, mas a regra de demonstração de pressão compara apenas a sistólica.

Para mudar os limiares, crie um novo `RULE_VERSION` em `backend/src/medical.ts`; a versão existente é imutável por convenção de implementação (`ON CONFLICT DO NOTHING`). Referências de arquitetura não são fontes clínicas dos limiares.

## Fila autenticada e isolamento

A integração usa `frontend/src/lib/session.ts`, `api.ts` e `storage.ts` da aplicação atual. O check-up é salvo primeiro no navegador, em chave separada por conta, com identificador e metadados estáveis para reenvio. Respostas perdidas mantêm o mesmo payload. Uma gravação local que falha não mostra sucesso; um histórico corrompido não é sobrescrito silenciosamente.

- `pending`: aguarda confirmação. Rede indisponível, timeout, HTTP 408/429 e falhas de servidor preservam o registro para reenvio. Há tentativas no login/restauração, reconexão, gravação, botão de sincronização e a cada 30 segundos enquanto houver pendências.
- `saved`: resposta bem-sucedida com `clientId` correspondente e sem proprietário divergente. Avaliações retornadas são preservadas no cache da conta e no histórico sincronizado.
- `rejected`: rejeição permanente, incluindo HTTP 409. O registro é mantido para revisão; não há reenvio automático desses dados.

Cookies HttpOnly continuam sendo a autoridade da sessão. As requisições usam `credentials: include`, o cabeçalho CSRF existente `X-Requested-With: Health7` nas mutações e `X-Health7-Crew` para vinculá-las ao perfil capturado. Troca de conta, logout e sessão expirada cancelam ou descartam respostas antigas. Cenários usam essa mesma proteção e não podem ser consultados por outra conta.

O histórico exibido é a janela da sessão atual (padrão de 30 dias, até 100 check-ups), com aviso de truncamento. Os resumos das referências estão incluídos no pacote do front; abrir os documentos originais requer conexão. A aplicação não tem service worker para garantir carregamento inicial offline, e restaurar a sessão exige verificar a API.

Armazenamento no servidor não equivale a transmissão à Terra, relatório revisado ou atendimento médico autônomo. Chat, água, planos e radiação do painel continuam com suas integrações existentes.

## API

Todas as rotas exigem a sessão autenticada. O proprietário vem da sessão, nunca do corpo da requisição.

| Método | Rota | Resultado |
|---|---|---|
| POST / GET | `/api/v1/me/checkins` | Contrato atual, acrescido de procedência opcional e observações versionadas na resposta. |
| GET | `/api/v1/references` | Fontes e papel de cada uma. |
| GET | `/api/v1/rules` | Conjuntos de regras versionados. |
| POST / GET | `/api/v1/me/simulations` | Gravação / histórico de cenários da própria conta. |
| GET | `/api/v1/me/simulations/:id` | Recuperação de cenário próprio; HTTP 404 para outro proprietário. |

`healthDetails` e os domínios Pessoa, Saúde e Ambiente permanecem compatíveis. `provenance`, quando informado, usa as chaves das medidas enviadas, com `method` (`manual`, `simulated-device`, `unknown`) e `quality` (`simulated`, `unknown`). Unidade, linha de base e avaliação são atribuídas pelo servidor.

Exemplo de corpo de simulação:

```json
{
  "seed": 42,
  "trials": 2000,
  "crewSize": 4,
  "days": 180,
  "availableResources": 2,
  "conditions": [
    { "id": "hypothetical-event", "ratePerPersonDay": 0.001, "resourcesPerEvent": 1 }
  ]
}
```

O modelo amostra eventos de Poisson independentes, com taxas constantes e uma unidade compartilhada de recurso. As taxas são hipotéticas, não dados de incidência médica. Limites: 100–5.000 simulações, 1–12 tripulantes, 1–1.000 dias, até 10 condições e taxa de 0 a 0,01 evento/pessoa/dia; no máximo 20 requisições de simulação/minuto. Semente e versão permitem reproduzir resultados. Não modela tratamento, evacuação ou mortalidade e **não implementa o IMM da NASA**.

## Referências e verificação

Fontes: [MDA / suporte à decisão](https://ntrs.nasa.gov/citations/20220017869), [EIMO](https://ntrs.nasa.gov/citations/20250000009), [AMO](https://ntrs.nasa.gov/citations/20180002541) e [validação do IMM](https://ntrs.nasa.gov/citations/20180006877). Veja também a nota `cofre/03 Pesquisa/NTRS - arquitetura de dados e autonomia médica.md`.

Backend: `npm run build` e `npm test`, com `TEST_DATABASE_URL` apontando para um PostgreSQL de testes separado. Front: `npm test`, `npm run build` e `npm run lint`. Testes de navegador: `npm run test:e2e` no front, também com `TEST_DATABASE_URL`; o runner cria e remove um schema isolado, sem usar registros da demonstração.
