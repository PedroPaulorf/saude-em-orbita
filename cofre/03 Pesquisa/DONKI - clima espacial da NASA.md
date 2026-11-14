---
tipo: pesquisa
tema: dado-real-da-nasa
fonte: NASA CCMC / Moon to Mars Space Weather Analysis Office
url: https://ccmc.gsfc.nasa.gov/tools/DONKI/
consulta: 2026-11-14
---
# DONKI: clima espacial da NASA

O DONKI é o candidato a **dado real da NASA** do protótipo (ver [[Escopo do protótipo]]). Esta nota explica o que ele traz, o que a API devolveu numa chamada real e como usar no app sem exagerar.

## O que é, em uma frase

**Não é previsão do tempo da Terra.** É um banco de eventos de **clima espacial** (*space weather*): erupções no Sol, nuvens de partículas, tempestades magnéticas. Cada evento é analisado em quase tempo real pelo Moon to Mars Space Weather Analysis Office, do centro Goddard da NASA, e fica disponível numa API aberta.

Nome completo: *Space Weather Database Of Notifications, Knowledge, Information*.

## O que ele traz

| Sigla | Evento | Em palavras simples | Relação com a saúde do astronauta |
|---|---|---|---|
| **SEP** | Solar Energetic Particle | Chuva de partículas de alta energia vindas do Sol | **A mais relevante.** É o tipo de evento do DONKI mais ligado à radiação que chega à tripulação. Ver [[Cânceres induzidos por radiação]] |
| **FLR** | Solar Flare | Explosão de luz e raio X no Sol, com classe C, M ou X (X é a mais forte) | Indireta: erupções fortes podem vir acompanhadas de SEP |
| **CME** | Coronal Mass Ejection | Nuvem de plasma lançada pelo Sol | Indireta: pode causar tempestade geomagnética e SEP |
| **GST** | Geomagnetic Storm | Tempestade no campo magnético da Terra, medida pelo índice Kp (0 a 9) | Baixa para a saúde; afeta satélites e comunicações |
| **RBE** | Radiation Belt Enhancement | Aumento de elétrons no cinturão de radiação externo | Baixa para a ISS: o próprio alerta cita naves em órbitas GEO e MEO, mais altas que a da ISS |
| **IPS**, **MPC**, **HSS** | Choque interplanetário, cruzamento da magnetopausa, vento solar rápido | Fenômenos de vento solar | Contexto técnico; pouco útil para o app |
| **notifications** | Alertas e relatórios | Texto pronto em inglês resumindo cada evento | Útil para mostrar o alerta original com link |

Cada evento traz data e hora, instrumento que mediu, link para a página do evento e **eventos ligados**. Exemplo real: o SEP de 05/09/2026 está ligado a uma erupção (FLR) e a uma ejeção de massa (CME) do mesmo dia, o que permite contar a cadeia "o Sol explodiu → nuvem de partículas → alerta".

## O que a API devolveu em 2026-11-14

Chamada real à API feita em 2026-11-14, cobrindo de 15/10 a 14/11/2026:

- **13 erupções solares** (FLR), da classe C1.3 à M3.5. Nenhuma de classe X.
- **0 eventos de partículas solares** (SEP).
- **1 tempestade geomagnética** (GST), em 31/10, com Kp 6.
- **32 notificações**: 15 de cinturão de radiação, 11 de CME, 4 relatórios e 2 de tempestade.

Episódios de SEP em 2026, consultados em janelas de 60 dias: 18–19/01, 25/05, 30/07 e 05/09.

**Consequência para o demo:** é provável que, no dia da apresentação, o cartão mostre "sem eventos de partículas solares". Isso é um resultado válido (estado calmo). Para mostrar um alerta, o app pode ter um **modo histórico** que carrega o evento de 05/09/2026, deixando claro que é um evento passado.

## Como acessar

Referência completa dos endpoints, parâmetros e campos em [[DONKI - documentação da API]].

| Endereço | Chave | CORS (chamar do navegador) | Observação em 2026-11-14 |
|---|---|---|---|
| `https://ccmc.gsfc.nasa.gov/DONKI-API/get/{TIPO}?startDate=AAAA-MM-DD&endDate=AAAA-MM-DD` | Não precisa | Liberado | **Recomendado.** Todos os tipos responderam. Intervalo máximo de 60 dias por chamada |
| `https://api.nasa.gov/DONKI/{TIPO}?...&api_key=...` | `DEMO_KEY` ou chave gratuita | Liberado | Com `DEMO_KEY`, limite de 10 requisições informado no cabeçalho. **FLR devolveu erro 404**; SEP, GST e notifications funcionaram |

O DONKI mudou de endereço em 30/09/2026 (de `kauai.ccmc.gsfc.nasa.gov` para `ccmc.gsfc.nasa.gov`), o que pode explicar o erro no `api.nasa.gov`.

Exemplo de registro SEP (resumido):

```json
{
  "sepID": "2026-09-05T15:45:00-SEP-001",
  "eventTime": "2026-09-05T15:45Z",
  "instruments": [{ "displayName": "GOES-P: SEISS >100 MeV" }],
  "linkedEvents": [
    { "activityID": "2026-09-05T15:04:00-FLR-001" },
    { "activityID": "2026-09-05T15:36:00-CME-001" }
  ],
  "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/48551/-1"
}
```

## Como usar no app

Proposta, a decidir pela equipe:

- **Cartão "Clima espacial"** no painel: busca SEP e FLR dos últimos 7 dias.
  - Sem SEP: "Nenhum evento de partículas solares nos últimos 7 dias".
  - Com SEP: aviso informativo com data, link para o alerta original e link para o risco de radiação.
  - A janela de 7 dias é uma **regra de demonstração**, não um critério da NASA. Mostrar isso na tela.
- **Cópia local:** guardar a última resposta num JSON do repositório e usar quando a API ou a internet falhar, mostrando a data da cópia. Combina com o app sem servidor e sem conexão (ver [[Decisões]]).
- **Modo histórico** com o evento de 05/09/2026 para o vídeo do demo.

## O que o DONKI não faz

- **Não informa a dose de radiação recebida pelo astronauta.** Informa eventos no ambiente espacial. O app não pode transformar um SEP em "você recebeu X de radiação".
- **Não é previsão oficial.** O próprio DONKI diz: "NOAA Space Weather Prediction Center is the United States Government official source for space weather forecasts. This 'Experimental Research Information' consists of preliminary NASA research products and should be interpreted and used accordingly."
- Os dados são "prototyping quality and in research context", segundo as regras de uso do DONKI. Para um protótipo de hackathon isso é adequado, mas deve aparecer nas limitações.

## Para a submissão

- Citar o DONKI e o CCMC em References e na seção de dados da NASA da página do projeto.
- Dizer no pitch: "dado real e ao vivo da NASA, com cópia local para funcionar sem conexão".
- Não usar o logo da NASA que aparece na página do DONKI (ver item 9 de [[Escopo do protótipo]]).

## Fontes (consulta em 2026-11-14)

- Página do DONKI: https://ccmc.gsfc.nasa.gov/tools/DONKI/
- Documentação da API: https://ccmc.gsfc.nasa.gov/DONKI/api/
- NASA Open APIs (seção DONKI): https://api.nasa.gov/
- Chamadas feitas em 2026-11-14 aos endpoints FLR, SEP, GST e notifications nas duas URLs acima.
