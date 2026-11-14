# Dados médicos, referências e sincronização

O Health7 tem uma API Fastify com **SQLite persistente** e uma fila no navegador. A tela **Medical data & sources**, acessível pelo cartão Report (`#/data`), mostra referências, estados de envio, avaliações salvas e os últimos 20 registros do servidor. O painel diário continua usando o histórico deste navegador; consultar o servidor não substitui automaticamente esse histórico.

## Executar

Requer Node.js 24 ou superior. Instale as dependências com `npm ci` em `backend/` e `frontend/`.

Na pasta `backend/`, execute em PowerShell:

```powershell
$env:API_KEY = 'health7-demo-local-token'
npm run dev
```

Em `frontend/.env.local`, configure:

```dotenv
VITE_HEALTH_API_URL=http://localhost:3001
VITE_HEALTH_API_KEY=health7-demo-local-token
```

Depois, execute `npm run dev` em `frontend/` e abra o endereço mostrado pelo Vite. Reinicie o Vite depois de alterar as variáveis. Sem URL e chave, o front mantém o modo local. A chave compartilhada é de demonstração, visível no navegador, e a API continua aceitando somente dados identificados como simulados.

Em tablets, a URL deve apontar para o IP do servidor; configure `HOST`, `CORS_ORIGINS` e a origem do Vite conforme `backend/README.md`. `localhost` no tablet aponta para o próprio tablet.

## Banco e rastreabilidade

O arquivo padrão é `backend/data/health7.sqlite`; `DATABASE_PATH` permite outro local. As tabelas existentes `crew` e `checkins` são preservadas. A inicialização cria as tabelas adicionais sem apagar dados:

| Tabela | Conteúdo |
|---|---|
| `medical_references` | Quatro referências NTRS, identificadores, links e papel na arquitetura/metodologia. |
| `medical_rules` | Conjunto versionado de regras de demonstração e sua indicação de ausência de fonte clínica. |
| `observations` | Valor, unidade, horário, método, qualidade, linha de base, regra aplicada, estado e explicação por medida e check-up. |
| `mission_simulations` | Entradas, semente, versão e resultados de cenários educativos. |

Novos registros e suas observações são gravados na mesma transação. A avaliação usa a linha de base do perfil do tripulante; sem linha de base ou regra, a medida fica sem avaliação. Pressão diastólica é preservada, mas o estado da regra de demonstração de pressão usa apenas a sistólica. Os resultados históricos são snapshots: não são recalculados quando uma linha de base muda.

Registros antigos recebem procedência `unknown` quando não havia metadados. As regras são guardadas com `INSERT OR IGNORE`: para mudar um conjunto de regras, crie uma nova versão em `backend/src/medical.ts`, em vez de reutilizar o identificador. As regras e linhas de base continuam fictícias.

## Fila e falhas

O front salva o check-up e seu payload de reenvio **no mesmo registro** em `localStorage`, preservando os dados v1/v2 existentes. Cada novo registro ganha um `clientId` estável; registros anteriores recebem identificador na primeira sincronização. Histórico corrompido não é sobrescrito por uma nova gravação. Falhas de gravação não mostram confirmação de sucesso.

- `pending`: sem confirmação. Rede indisponível, timeout, HTTP 408/429 e erros de servidor mantêm esse estado. Tenta novamente na abertura, reconexão, novo registro ou a cada 30 segundos.
- `synced`: somente após HTTP 200/201 com identificador correspondente e resposta de confirmação válida. As observações retornadas ficam também no navegador.
- `conflict`: HTTP 409; preserva o registro para revisão, sem reenvio automático.
- `rejected`: outros erros HTTP 4xx; interrompe reenvios automáticos. Após corrigir configuração ou dados, o botão de sincronização permite nova tentativa.

Uma resposta perdida pode resultar em um novo POST com o mesmo conteúdo e identificador; o servidor devolve o registro existente. O histórico local não é apagado após confirmação. O funcionamento sem conexão cobre registros e dados já disponíveis; o carregamento inicial de toda a aplicação não tem service worker. Abrir os documentos originais do NTRS requer conexão.

**Stored on server** confirma armazenamento de check-ups na API configurada. Não significa relatório completo transmitido à Terra, plano de prevenção sincronizado ou revisão médica. Chat, água, planos e radiação continuam fora desta sincronização.

## API

Todas as rotas abaixo exigem `X-API-Key`:

| Método | Rota | Resultado |
|---|---|---|
| POST / GET | `/api/v1/crew/crew-02/checkins` | Gravação idempotente / histórico com observações e avaliações. |
| GET | `/api/v1/references` | Referências públicas e papel de cada uma. |
| GET | `/api/v1/rules` | Conjuntos de regras versionados. |
| POST | `/api/v1/simulations` | Simulação educativa e armazenamento do cenário. |
| GET | `/api/v1/simulations/:simulationId` | Recuperação de cenário salvo. |

O contrato de check-up anterior permanece aceito. `vitals` também aceita `spo2`, `respiratoryRate` e `bodyMass`. O campo opcional `provenance` usa as mesmas chaves das medidas enviadas; cada item tem `method` (`manual`, `simulated-device`, `unknown`) e `quality` (`simulated`, `unknown`). Unidade e avaliação são atribuídas pelo servidor, não aceitas como resultado clínico do cliente.

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

O modelo amostra eventos de Poisson independentes com taxa constante e uma unidade de recurso compartilhada. Entradas são hipotéticas; o exemplo não é uma taxa médica. Limites: 100–5.000 simulações, 1–12 tripulantes, 1–1.000 dias, até 10 condições com taxa entre 0 e 0,01 evento/pessoa/dia. O resultado inclui média de eventos e recursos, percentis e fração de simulações que excedem os recursos. Semente e versão permitem reproduzir o cenário. Não modela tratamento, evacuação ou mortalidade e **não implementa o IMM da NASA**.

## Referências

Os registros públicos apoiam os conceitos usados: [MDA / suporte à decisão](https://ntrs.nasa.gov/citations/20220017869), [EIMO](https://ntrs.nasa.gov/citations/20250000009), [AMO](https://ntrs.nasa.gov/citations/20180002541) e [validação do IMM](https://ntrs.nasa.gov/citations/20180006877). Nenhum desses registros foi usado como justificativa clínica para os limiares do protótipo. Veja a nota `cofre/03 Pesquisa/NTRS - arquitetura de dados e autonomia médica.md` para a análise e os limites das fontes.

## Verificação

Em `backend/`: `npm run build` e `npm test`. Os testes usam bancos temporários e verificam persistência, atualização do esquema legado, avaliações imutáveis, compatibilidade das regras com o front, validação de metadados, deduplicação após resposta perdida e simulação reproduzível. Em `frontend/`: `npm run build` e `npm run lint`.
