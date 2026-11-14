---
tipo: pesquisa
tema: documentacao-api-donki
fonte: NASA CCMC, DONKI-API v2.0 (OpenAPI 3.0.1)
url: https://ccmc.gsfc.nasa.gov/DONKI/api/
especificacao: https://ccmc.gsfc.nasa.gov/DONKI-API/v3/api-docs
consulta: 2026-11-14
---
# DONKI: documentação da API

Referência técnica da API do DONKI, para quem for implementar o cartão de clima espacial do **Health 7**. A visão geral, o que cada evento significa e como usar no app estão em [[DONKI - clima espacial da NASA]]. Decisões ligadas: [[Decisões]] e [[Escopo do protótipo]].

Fontes: a página da documentação (`/DONKI/api/`) e a especificação OpenAPI oficial (`/DONKI-API/v3/api-docs`), lidas em 2026-11-14. Os exemplos de resposta abaixo foram conferidos com chamadas reais no mesmo dia.

## Resumo rápido

| Item | Valor |
|---|---|
| Nome | DONKI Public API (*Space Weather Database Of Notifications, Knowledge, Information*) |
| Versão | 2.0 (OpenAPI 3.0.1) |
| Endereço base | `https://ccmc.gsfc.nasa.gov/DONKI-API` |
| Método | Só `GET`, resposta em JSON |
| Chave de API | A especificação não declara autenticação, e as chamadas feitas sem chave funcionaram |
| Janela máxima | **60 dias** por chamada em todos os endpoints de eventos |
| Datas | Formato `AAAA-MM-DD`; padrão `^$\|^\d{4}-\d{2}-\d{2}$` (vazio vale como padrão) |
| Mantenedor | CCMC (Community Coordinated Modeling Center), NASA Goddard |

> [!note] Dois endereços
> Existe também o espelho `https://api.nasa.gov/DONKI/{TIPO}` (exige `api_key`, aceita `DEMO_KEY`). Em 2026-11-14 o tipo FLR devolveu 404 nele. Preferir o endereço base acima. Detalhes em [[DONKI - clima espacial da NASA]].

A página oferece o download da especificação em JSON e YAML e exemplos de código em Shell (curl), Ruby, Node.js, PHP e Python.

## Endpoints

Todos são `GET {base}/get/{recurso}`.

| Endpoint | O que devolve | Parâmetros (padrão) |
|---|---|---|
| `/get/notifications` | Notificações enviadas pelo DONKI | `startDate` (7 dias atrás), `endDate` (hoje), `type` (`ALL`) |
| `/get/SEP` | Partículas solares energéticas | `startDate` (30 dias atrás), `endDate` (hoje), `catalog` (`M2M_CATALOG`), `version` (`Latest`) |
| `/get/FLR` | Erupções solares | `startDate`, `endDate`, `catalog` (`M2M_CATALOG`), `class` (`ALL`), `version` (`Latest`) |
| `/get/GST` | Tempestades geomagnéticas | `startDate`, `endDate`, `catalog` (`ALL`), `version` (`Latest`) |
| `/get/CME` | Ejeções de massa coronal | `startDate`, `endDate`, `mostAccurateOnly`, `completeEntryOnly`, `speed` (0), `halfAngle` (0), `catalog` (`ALL`), `keyword` (`NONE`), `feature` (`ALL`), `version` (`Latest`) |
| `/get/CMEAnalysis` | Análises de CME | Mesmos do CME, com `mostAccurateOnly` e `completeEntryOnly` em `true` por padrão |
| `/get/CMEAnalysis.txt` | Análises de CME em texto simples | Mesmos de `CMEAnalysis` |
| `/get/CME/url` | Link da página do DONKI para uma CME | `activityID` |
| `/get/RBE` | Aumentos no cinturão de radiação | `startDate`, `endDate`, `catalog` (`ALL`), `version` (`Latest`) |
| `/get/MPC` | Cruzamentos da magnetopausa | `startDate`, `endDate`, `catalog` (`ALL`), `version` (`Latest`) |
| `/get/IPS` | Choques interplanetários | `startDate`, `endDate`, `location` (`ALL`), `catalog` (`ALL`), `version` (`Latest`) |
| `/get/HSS` | Fluxos de vento solar rápido | `startDate`, `endDate`, `catalog` (`ALL`), `version` (`Latest`) |
| `/get/WSAEnlilSimulations` | Simulações do modelo WSA-Enlil | `startDate`, `endDate` (filtra pela data de conclusão do modelo) |

Valores aceitos documentados:

- `notifications.type`: `FLR`, `SEP`, `CME`, `IPS`, `MPC`, `GST`, `RBE`, `REPORT`, `ALL`.
- `FLR.class`: por exemplo `ALL`, `M`, `X` (filtra pela classe da erupção).
- `IPS.location`: por exemplo `ALL`, `Earth`.
- `catalog`: o SEP e o FLR usam `M2M_CATALOG` por padrão; os outros usam `ALL`.
- `version`: por exemplo `Latest`.

## O que o Health 7 precisa

Para o cartão "Clima espacial" só quatro endpoints importam:

| Uso no app | Endpoint | Observação |
|---|---|---|
| Alerta principal ligado à radiação | `/get/SEP` | Lista vazia significa "sem eventos de partículas solares" no período |
| Contexto: erupções fortes | `/get/FLR?class=M` ou `class=X` | Reduz o volume de resposta |
| Contexto: tempestades magnéticas | `/get/GST` | Traz o índice Kp |
| Texto do alerta original | `/get/notifications?type=SEP` | `messageBody` vem em inglês, longo e em texto simples |

Chamada de exemplo (sem chave):

```bash
curl "https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP?startDate=2026-09-01&endDate=2026-09-10"
```

No navegador (o CORS está liberado):

```js
const fim = new Date().toISOString().slice(0, 10);
const inicio = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
const url = `https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP?startDate=${inicio}&endDate=${fim}`;
const eventos = await (await fetch(url)).json(); // [] se não houver SEP
```

## Formato das respostas

Cada endpoint devolve um **array** de objetos. Campos conferidos na especificação.

### SEP (partículas solares)

`sepID`, `eventTime`, `instruments[]` (`displayName`), `submissionTime`, `versionId`, `link`, `linkedEvents[]` (`activityID`), `sentNotifications[]` (`messageID`, `messageIssueTime`, `messageURL`).

Resposta real de 2026-09-05:

```json
{
  "sepID": "2026-09-05T15:45:00-SEP-001",
  "eventTime": "2026-09-05T15:45Z",
  "instruments": [{ "displayName": "GOES-P: SEISS >100 MeV" }],
  "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/48551/-1",
  "linkedEvents": [
    { "activityID": "2026-09-05T15:04:00-FLR-001" },
    { "activityID": "2026-09-05T15:36:00-CME-001" }
  ],
  "sentNotifications": [
    { "messageID": "20260905-AL-004", "messageIssueTime": "2026-09-05T15:54Z", "messageURL": "https://ccmc.gsfc.nasa.gov/DONKI/view/Alert/48552/1" },
    { "messageID": "20260905-AL-005", "messageIssueTime": "2026-09-05T15:58Z", "messageURL": "https://ccmc.gsfc.nasa.gov/DONKI/view/Alert/48553/1" }
  ],
  "submissionTime": "2026-09-05T15:54Z",
  "versionId": 1
}
```

### FLR (erupções solares)

`flrID`, `catalog`, `instruments[]`, `beginTime`, `peakTime`, `endTime`, `classType` (por exemplo `M3.5`), `sourceLocation` (por exemplo `S08E35`), `activeRegionNum`, `note`, `link`, `linkedEvents[]`, `sentNotifications[]`, `submissionTime`, `versionId`.

### GST (tempestades geomagnéticas)

`gstID`, `startTime`, `allKpIndex[]` (cada item com `observedTime`, `kpIndex` e `source`), `link`, `linkedEvents[]`, `submissionTime`, `versionId`, `sentNotifications[]`.

### Notificações

`messageType`, `messageID`, `messageURL`, `messageIssueTime`, `messageBody`. O `messageBody` é um texto em inglês com o cabeçalho "NASA Goddard Space Flight Center, Space Weather Research Center", o resumo do evento, o aviso de que se trata de informação experimental e o texto legal de isenção. Para o app, mostrar só o resumo e o link (`messageURL`), não o texto inteiro.

### RBE (cinturão de radiação)

`rbeID`, `eventTime`, `instruments[]`, `link`, `linkedEvents[]`, `sentNotifications[]`, `submissionTime`, `versionId`.

### Eventos ligados

`linkedEvents[].activityID` segue o padrão `AAAA-MM-DDThh:mm:ss-TIPO-NNN`, com o tipo (FLR, CME, SEP etc.) no meio. Dá para ligar um SEP à erupção e à CME que o originaram sem outra chamada, só lendo o texto do ID.

## Cuidados ao implementar

- **Janela de 60 dias:** pedir um intervalo maior pode falhar ou ser cortado. Para o app, usar 7 dias.
- **Padrões diferentes:** sem datas, `notifications` usa os últimos 7 dias e os demais endpoints usam os últimos 30. Sempre mandar `startDate` e `endDate` explícitos.
- **Lista vazia é normal:** em estado calmo, o SEP volta `[]`. Tratar como resultado válido, não como erro.
- **Cópia local:** guardar a última resposta num JSON do repositório e usar quando a API falhar, mostrando a data da cópia (ver [[Decisões]]).
- **Resposta de notificações é pesada:** cada `messageBody` tem vários parágrafos. Filtrar por `type` e descartar o corpo se não for mostrado.
- **Datas em UTC:** os campos de tempo terminam em `Z`. Converter para o horário local só na exibição.
- **Nada de dose:** a API informa eventos, não radiação recebida pelo astronauta (ver "O que o DONKI não faz" em [[DONKI - clima espacial da NASA]]).

## Aviso legal do DONKI

Ao usar o site, aceita-se o *disclaimer* do DONKI. Em resumo: o DONKI traz "Experimental Research Information", produtos preliminares de pesquisa da NASA. A fonte oficial de previsão de clima espacial dos EUA é o NOAA Space Weather Prediction Center. Os dados são fornecidos "como estão", sem garantias, e o uso não significa endosso da NASA. Mostrar esse aviso nas limitações do projeto e na seção de dados da NASA da submissão (ver [[Guia de submissão do projeto]]).

## Fontes

- Documentação interativa: https://ccmc.gsfc.nasa.gov/DONKI/api/
- Especificação OpenAPI (JSON): https://ccmc.gsfc.nasa.gov/DONKI-API/v3/api-docs
- Página do DONKI e disclaimer: https://ccmc.gsfc.nasa.gov/tools/DONKI/
