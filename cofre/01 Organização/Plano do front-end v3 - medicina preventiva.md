---
tipo: plano
criada: 2026-11-14
estado: proposta para a equipe validar
para: agente de código que vai implementar (Claude Opus) e equipe
fontes: "conversa da equipe de 2026-11-14 sobre a solução (gravação de 7min42s, transcrita), [[Plano do front-end v2]], [[Decisões]], [[Riscos NASA HRP]], [[Monitoramento de radiação e saúde dos astronautas (CSA)]]"
---
# Plano do front-end v3: medicina preventiva

Continuação do [[Plano do front-end v2]], que já está implementado (fases 0 a 8). Este plano acrescenta a tese que a equipe fechou em 14/11: **juntar os dados de saúde num lugar só, reconhecer cedo um conjunto de sinais e dar à pessoa um plano para voltar à linha de base**, com a exposição à radiação acompanhada ao longo da missão.

**Prazo:** a submissão fecha domingo, 15/11, às 23h59; congelar funcionalidades domingo às 15h. As fases da seção 10 estão em ordem de prioridade. As fases 1 a 3 são o demo; o resto se corta de baixo para cima.

Valem as instruções da seção 1 do plano v2 (branch `feat/front-v2`, build e lint limpos, prints em 1440 e 390 px, um commit por fase, "Desvios" no fim deste arquivo) e os critérios visuais da seção 4 de lá.

## 1. O que a equipe decidiu

Resumo da conversa de 14/11, com a Valéria (pesquisa de saúde espacial):

1. **Centralizar.** Nas missões, cada medida (saturação, frequência respiratória, peso) é coletada, mas fica espalhada. O Health 7 junta tudo, por tripulante.
2. **Comparar com padrões.** Com os dados juntos, o sistema compara as medidas da pessoa com o conjunto de sinais que costuma vir antes de um problema de saúde.
3. **Prevenir com um plano.** Quando vários sinais aparecem, a pessoa recebe um plano de alguns dias (o exemplo foi de cinco) para voltar ao normal antes de adoecer. É aqui que a gamificação ganha propósito, "como um treino de academia".
4. **O que não dá para medir no corpo, medir no ambiente.** Câncer não aparece nas medidas diárias, mas depende da radiação recebida. A nave mede radiação; o sistema guarda quanto a pessoa recebeu na viagem inteira.

A equipe falou em mapear umas vinte doenças, com sintomas, variáveis e níveis.

## 2. Opinião do planejador

A ideia é boa e resolve o que faltava: o app tinha medidas, pontos e clima espacial, mas não tinha uma frase que explicasse para que servem juntos. Agora tem. Cinco ajustes para ela caber nas regras do cofre, no prazo e na frente de um juiz que entenda de medicina:

| Ideia da conversa | Problema | Como entra no app |
|---|---|---|
| "Se continuar assim, vai ter a doença X" | É diagnóstico e previsão. A regra do cofre é "informa e encaminha; não diagnostica", e ela pesa no critério Validity | O app diz o fato: "3 of 4 early signs of sleep debt are present". Não diz que a pessoa vai adoecer. O padrão vai para o relatório do cirurgião de voo |
| Exemplo da diarreia (saturação e frequência respiratória caindo, peso, urina e fezes) | **Não sou médico e não consegui validar esse exemplo.** Pelo que sei, saturação baixa e frequência respiratória baixa não são sinais que antecedem diarreia. Um juiz da área pode notar | Não usar esse exemplo no pitch nem no app sem a Valéria conferir com fonte. A seção 4 propõe três padrões ligados aos riscos do HRP que já estão no cofre; ela troca ou confirma |
| Vinte doenças | Vinte tabelas clínicas com fonte não saem até domingo, e vinte regras sem fonte enfraquecem o projeto | **Três padrões** no demo. A lista é um arquivo de dados: incluir um padrão é incluir um item no JSON. No pitch: "três implementados, a estrutura recebe os outros" |
| Plano de cinco dias para "resolver" (alimentação específica, "tomar...") | Vira prescrição. Remédio, dose e dieta são do cirurgião de voo | O plano tem só ações de rotina que a pessoa já faz ou marca (dormir no horário, registrar água e refeições, fazer os check-ups). Aparece como **sugerido** e vai para o solo revisar |
| Gamificar até "ficar verde de novo" | Ponto por valor medido incentiva registrar número melhor que o real (princípio da seção 7.6 do v2) | **Ponto por cumprir o passo do plano, não por a medida melhorar.** A medida voltar à linha de base aparece como resultado, sem pontos |
| Radiação: usar o que a nave mede e somar a viagem | O DONKI não informa dose (seção 9 do v2). Dose acumulada vem de dosímetro, que o app não tem | Série de dosímetro **simulada** e identificada, comparada com o limite de carreira real da NASA (600 mSv). O app não calcula risco de câncer nem inventa orientação ("use roupa tal") |

Duas coisas que o pitch vai precisar e que eu não tenho como confirmar: uma **fonte para a afirmação de que os dados ficam dispersos** nas missões, e uma **fonte para cada padrão de sinais**. As duas são da Valéria (seção 12).

Um ponto prático: **um plano de cinco dias não cabe num vídeo de três minutos**. A seção 8 resolve com cenários de demonstração que carregam o dia 3 e o dia 5.

## 3. Regras

Todas as da seção 3 do plano v2 continuam. Acrescentam-se:

- **Padrão não é diagnóstico.** A tela mostra quantos sinais estão presentes e qual regra gerou cada um. Palavras proibidas na interface: disease, diagnosis, predict, treatment, cure, prescription, patient. Palavras da casa: early signs, pattern, signs present, back-to-baseline plan, suggested, flight surgeon review.
- **Continuam três estados.** Um padrão usa "Attention" ou "Flagged for ground"; não existe estado novo.
- **Todo padrão leva o selo "Demonstration rule"** até ter fonte. Com fonte, mostra a fonte.
- **Todo plano leva "Suggested plan · not reviewed by a flight surgeon"** e entra no relatório para o solo.
- **Nem todo padrão tem plano.** Se o padrão não se resolve com rotina, o app só sinaliza para o solo (ver "Reduced oxygenation" na seção 4).
- **Pontos só por ação.** Ninguém ganha ponto porque a medida melhorou, nem perde porque piorou ou porque pulou um dia do plano.
- **Radiação:** o app mostra dose medida (simulada) e um limite com fonte. Não converte clima espacial em dose, não estima risco e não dá ordem de proteção sem fonte.

## 4. Dados

### Medidas novas e origem de cada dado

Em `src/data/simulated.json`, cada medida ganha `source` (de onde o dado vem) e `input` (`"manual"`, perguntada no check-up, ou `"device"`, que chega sozinha). Entram três medidas `"device"`, que o check-up **não** pergunta:

| id | Rótulo | Unidade | Linha de base | Histórico de 7 dias | Regra de demonstração | Região |
|---|---|---|---|---|---|---|
| `spo2` | Oxygen saturation | % | 97 | 97, 97, 98, 97, 97, 96, 97 | abaixo: 2 atenção, 4 sinalizado | chest |
| `respiratoryRate` | Respiratory rate | breaths/min | 14 | 14, 14, 15, 14, 15, 15, 16 | os dois lados: 3 e 6 | chest |
| `bodyMass` | Body mass | kg | 74.0 | 74.0, 73.9, 73.9, 73.8, 73.6, 73.5, 73.3 | abaixo: 1.0 e 2.0 | core |

Origem (`source`) de cada dado: Heart rate "Wearable"; Blood pressure "Cuff, typed in"; Sleep "Self-report"; Temperature "Thermometer, typed in"; Oxygen saturation "Pulse oximeter"; Respiratory rate "Wearable"; Body mass "Body mass device"; água "Self-logged"; comportamental "Self-report"; radiação "Dosimeter"; clima espacial "NASA DONKI". Tudo que é aparelho é simulado no demo, e a tela diz isso uma vez ("Device feeds are simulated in this demo").

É essa etiqueta de origem que torna a **centralização** visível: a mesma lista mostra sete medidas vindas de seis lugares.

Mudanças de código que isso pede: `VitalId` em `src/types.ts`; `VITAL_REGION` em `src/lib/notes.ts`; `getBodyRegions` (o peito passa a considerar também saturação e frequência respiratória; o tronco, a massa corporal); o check-up de saúde filtra `input === "manual"`; o contexto do chat e o relatório passam a listar as sete.

**Histórico por dia.** Hoje `getTodayVitals` monta o histórico com a série simulada mais o último check-up salvo. Passa a montar os últimos 7 dias UTC assim: para cada dia, o check-up de saúde salvo naquele dia, se houver; senão, o valor simulado da mesma posição. `evaluate` e `ruleText` não mudam. Sem isso, os padrões de vários dias e os cenários da seção 8 não funcionam.

### Padrões de sinais

Arquivo novo: `src/data/conditions.json`. Lógica nova: `src/lib/prevention.ts`, com funções puras, no estilo de `game.ts`.

Um sinal é um de três tipos:

| `type` | Campos | Presente quando |
|---|---|---|
| `measure` | `measure`, `side` (`below` ou `above`), `days` | A medida está fora da linha de base daquele lado (atenção ou sinalizada, pela regra dela) por `days` dias seguidos até hoje |
| `selfReport` | `question`, `atMost` ou `atLeast` | A resposta do check-in comportamental **de hoje** atende ao limite |
| `water` | `missedDays` | A meta de água não foi atingida em cada um dos últimos `missedDays` dias completos |

Cada sinal tem três resultados: presente, ausente ou **desconhecido** (sem check-in hoje, sem registro de água no dia). Desconhecido não conta como presente e aparece como "No data today", com link para o check-up.

Um padrão está **ativo** quando os sinais presentes chegam a `minSigns`. O estado dele é o pior estado entre as medidas dos sinais presentes; sinal de autorrelato e de água conta como "Attention".

```json
{
  "_note": "DEMONSTRATION RULES. No clinical source yet. Research (Valéria) replaces signs, limits and sources.",
  "patterns": [
    {
      "id": "sleep-debt",
      "title": "Sleep debt",
      "summary": "Several days of short sleep with signs of strain.",
      "hrpRisk": "inadequate-sleep-and-irregular-schedules",
      "source": null,
      "minSigns": 2,
      "signs": [
        { "id": "sleep-low", "type": "measure", "measure": "sleep", "side": "below", "days": 3, "label": "Sleep below your baseline for 3 days or more" },
        { "id": "hr-up", "type": "measure", "measure": "heartRate", "side": "above", "days": 1, "label": "Resting heart rate above your baseline" },
        { "id": "rest-low", "type": "selfReport", "question": "rest", "atMost": 2, "label": "You reported feeling little rested" },
        { "id": "stress-high", "type": "selfReport", "question": "stress", "atLeast": 4, "label": "You reported high stress" }
      ],
      "plan": {
        "days": 5,
        "stepsSource": "Adapted from NASA HRP, 'What can be done' for this risk.",
        "steps": [
          { "id": "check-ups", "type": "auto", "rule": "bothCheckUps", "label": "Do both check-ups" },
          { "id": "sleep-period", "type": "manual", "label": "Kept the scheduled sleep period" },
          { "id": "lights", "type": "manual", "label": "Dimmed the lights before the sleep period" },
          { "id": "relax", "type": "manual", "label": "Took the scheduled relaxation time" }
        ]
      }
    }
  ]
}
```

Os outros dois, no mesmo formato:

| Padrão | Sinais (`minSigns` 2) | Risco HRP | Plano |
|---|---|---|---|
| `low-intake`, "Low fluid and food intake" | Meta de água não atingida nos últimos 2 dias; massa corporal abaixo da linha de base por 2 dias; frequência cardíaca acima da linha de base | `inadequate-food-and-nutrition` | 5 dias: atingir a meta de água (`auto`, regra `waterGoal`); "Logged all scheduled meals" (`manual`); fazer os dois check-ups (`auto`) |
| `reduced-oxygenation`, "Reduced oxygenation" | Saturação abaixo da linha de base; frequência respiratória acima; frequência cardíaca acima | `hypoxia` | **Sem plano.** Mostra "No self-care plan for this pattern. It is flagged for your flight surgeon." |

Com os dados simulados de hoje, ao abrir o app: "Sleep debt" tem 2 de 4 sinais (sono abaixo há 4 dias, frequência cardíaca +9) e dois desconhecidos, até a pessoa fazer o check-in comportamental. Como o sono está sinalizado, o padrão aparece como "Flagged for ground". Os outros dois ficam inativos. É o roteiro do demo.

Os três padrões são **meus palpites de demonstração**, escolhidos porque usam medidas que o app já tem e riscos que já estão no cofre. Não têm fonte clínica.

## 5. Plano de volta à linha de base

Nome na interface: **"Back-to-baseline plan"**.

**Ciclo.** Padrão ativo sem plano mostra o plano como sugestão e o botão "Start plan". Com o plano iniciado, cada dia tem a lista de passos de `plan.steps`. Passo `auto` se marca sozinho pelos registros (os dois check-ups, a meta de água). Passo `manual` é uma caixa que a pessoa marca, e pode desmarcar no mesmo dia. O plano fecha quando todos os passos do último dia estão feitos, ou quando o último dia passa, com um de dois resultados:

- o padrão ficou inativo: "Plan complete. Measures back within your baseline."
- o padrão continua ativo: "Plan complete. Signs still present. Flagged for your flight surgeon."

A pessoa pode encerrar antes ("End plan"), sem perder nada. Só um plano ativo por vez; se dois padrões estiverem ativos, o segundo fica como sugestão.

**Armazenamento.** Chave `health7:plans:v1`, lista de `{ id, patternId, startedDay, days, done: { "2026-11-14": ["sleep-period", "lights"] }, endedDay? }`. O dia do plano, o que falta hoje e o resultado são derivados, como os pontos. Arquivo: `src/lib/plans.ts`, com o mesmo padrão reativo de `water.ts`.

**Pontos.** Entram em `game.points`, no `simulated.json`:

| Ação | Pontos | Limite |
|---|---|---|
| Passo manual do plano marcado | 5 | Uma vez por passo, por dia |
| Todos os passos do dia feitos | 10 de bônus | Um por dia |
| Plano concluído (passos do último dia feitos) | 50 | Um por plano |

Passo `auto` não dá ponto extra: o check-up e a água já pontuam na rotina. O anel "Today" da rotina continua com o máximo de 125; os pontos do plano entram no total e aparecem numa linha própria ("Plan · +25 today"). Desmarcar um passo tira os pontos dele, como o desfazer da água. Uma conquista nova: "First plan completed".

`game.ts` passa a receber os planos junto com os check-ups e a água. O total continua sem ser guardado.

## 6. Telas

**Aba nova: Prevention** (`#/prevention`), entre Home e Progress. É a tese do projeto e precisa estar a um toque no vídeo. Conferir que as quatro abas cabem em 390 px. De cima para baixo:

1. **Early-sign patterns.** Um cartão por padrão ativo: título, estado (ícone e palavra), "3 of 4 signs present", e a lista de sinais com marca de presente, ausente ou "No data today". Cada sinal de medida mostra o valor e a regra ("Sleep 5.1 h · 2.1 h below baseline · 4 days") e leva à região no Detailed stats. Abaixo, o texto "What can be done" da NASA para o risco ligado, recortado como no Detailed stats. Padrões inativos ficam numa linha só: "2 other patterns checked: no signs."
2. **Back-to-baseline plan.** Sugerido: os passos e "Start plan" (amarelo, a ação da tela). Ativo: "Day 2 of 5" com os cinco dias em linha (feito, hoje, por vir), os passos de hoje e os pontos do dia. Concluído: o resultado e o link para o relatório.
3. **Radiation exposure** (seção 7).
4. **Past plans**, se houver: padrão, datas, dias completos, resultado.

Sem padrão ativo, a tela não fica vazia: "No early-sign pattern today. 3 patterns checked.", a lista dos três com o que cada um observa, e a radiação.

**Home.**

- Health notes: nota nova, logo depois da de check-up pendente: "Early signs of sleep debt: 2 of 4 present.", que leva a `#/prevention`. Com plano ativo, o texto vira "Back-to-baseline plan: day 2 of 5, 1 of 3 steps done today."
- Today's routine: com plano ativo, uma linha "Plan · day 2 of 5 · 1 of 3 steps" que leva à aba. As caixas ficam na aba, para a Home não crescer.
- Space weather: uma linha a mais, "Mission exposure 23.9 mSv · Simulated", que leva à seção de radiação.

**Detailed stats.** A lista de medidas mostra as sete, cada uma com a etiqueta de origem. O painel da região mostra, se houver, "Part of an active pattern: Sleep debt".

**Progress.** Os gráficos passam a sete; se a grade não fechar bem, as três medidas de aparelho ficam numa linha compacta. O histórico ganha os dias de plano e os pontos deles.

**Relatório para o solo.** Duas seções novas: "Early-sign patterns" (padrão, sinais presentes, regra de cada um) e "Back-to-baseline plan" (padrão, dia, passos feitos por dia, "Suggested plan, awaiting flight surgeon review"). É o que mantém o "informa e encaminha".

## 7. Radiação acumulada

O que a conversa pediu: guardar quanto de radiação a pessoa recebeu na viagem inteira.

**Dados.** Chave `radiation` em `simulated.json`: `unit` "mSv", `missionTotalBeforeWindow` 20.4, `daily` dos últimos 7 dias (0.48, 0.51, 0.47, 0.52, 0.49, 0.50, 0.53), `careerLimit` 600 e a fonte do limite. Total no dia 47: 23.9 mSv. A ordem de grandeza (cerca de 0,5 mSv por dia na ISS) vem do resumo técnico OCHMO-TB-020 da NASA; **conferir a frase no PDF antes de citar**.

**Fatos conferidos em 14/11:**

- O limite de carreira da NASA é de **600 mSv** de dose efetiva, igual para todas as idades e sexos (NASA-STD-3001, volume 1, requisito 4.8.2 [V1 4030]): <https://www.nasa.gov/reference/4-0-human-performance/>.
- A NASA publica telemetria de radiação de vários instrumentos (ISS, Artemis I, Curiosity, LRO) no **RadLab**, com API: <https://visualization.osdr.nasa.gov/radlab/gui/overview/>. É a "base de dados aberta da NASA" que a Valéria citou.

**Cartão.** "Mission exposure · 23.9 mSv · Day 47", com a etiqueta "Simulated dosimeter"; barras dos últimos 7 dias; uma barra fina com "4% of the 600 mSv NASA career limit", com link para a fonte e a ressalva "This mission only. Earlier missions not included."; o texto "What can be done" de `radiation-induced-cancers`. Se o DONKI tiver evento de partículas na janela: "Solar particle event on 05 Sep. Dose during an event is measured on board; this demo does not model it."

**O que o cartão não faz:** não soma dose a partir do DONKI, não estima risco de câncer, não diz o que vestir nem onde se abrigar. Se a Valéria trouxer uma medida de proteção com fonte, ela entra como texto citado.

**Extra, só se sobrar tempo:** trocar a série simulada por uma série histórica real do RadLab, gerada por script como o `data:donki`. **Não testei a API** (formato, CORS, tamanho). Teste de 30 minutos; se não sair, fica o simulado. Atenção à unidade: os instrumentos do RadLab informam dose absorvida (Gy); não converter para mSv por conta própria.

## 8. Cenários de demonstração

Para gravar a história inteira em minutos. O chip "Simulated data" do cabeçalho passa a abrir um diálogo "Demo data" com:

| Cenário | O que grava no `localStorage` |
|---|---|
| Day 1 · signs appear | Limpa check-ups, água e planos. É o estado inicial |
| Day 3 · plan under way | Um plano de "Sleep debt" iniciado há 2 dias; check-ups de saúde dos 3 dias, hoje incluído (sono 5.6, 5.9, 6.1; frequência cardíaca 69, 68, 67); check-ins comportamentais, água e passos marcados dos 2 dias anteriores. Ficam para a câmera o check-in comportamental e os passos de hoje |
| Day 5 · back within baseline | O mesmo para 5 dias, hoje incluído (sono 5.6, 6.1, 6.6, 6.9, 7.1; frequência cardíaca 68, 66, 65, 64, 63). O padrão já saiu de ativo. Ficam para a câmera os passos manuais de hoje: ao marcar o último, o plano fecha |

Os dois cenários já trazem o check-up de saúde de hoje. Sem ele, o dia de hoje cairia no valor simulado (sono de 5.1 h) e pareceria uma recaída.

As datas são relativas a hoje. Os valores ficam numa chave `demo` de `conditions.json`. Arquivo: `src/lib/demo.ts`. O diálogo diz que os dados são fictícios e pede confirmação antes de sobrescrever.

## 9. Chat de IA

O contexto enviado ao n8n ganha `prevention`:

```json
"prevention": {
  "patterns": [ { "id": "sleep-debt", "title": "Sleep debt", "signsPresent": 3, "signsTotal": 4, "status": "flagged" } ],
  "plan": { "pattern": "Sleep debt", "day": 2, "days": 5, "stepsDoneToday": 1, "stepsToday": 3 },
  "radiation": { "missionTotal": 23.9, "unit": "mSv", "simulated": true }
}
```

O prompt continua no fluxo do n8n. Trecho para o Yvens acrescentar no nó AI Agent:

```
The context may include "prevention": early-sign patterns and a back-to-baseline plan made of routine steps. You may encourage the person to keep up with the plan and celebrate steps done. Do not explain what a pattern means medically, do not say they are getting sick, and do not add steps of your own. Radiation numbers are simulated; do not comment on risk.
```

O modo de demonstração ganha uma resposta pronta que cita o plano ("You're on day 2 of your plan...").

## 10. Fases

| # | Fase | Entrega | Pronto quando |
|---|---|---|---|
| 1 | Dados e regras | Seção 4: medidas novas com origem, histórico por dia, `conditions.json`, `prevention.ts` | Com os dados simulados, "Sleep debt" sai ativo com 2 de 4 sinais e os outros dois inativos; depois de um check-in comportamental com "rest" 2, sai com 3 de 4; o check-up de saúde continua com quatro perguntas |
| 2 | Aba Prevention e nota na Home | Seção 6, itens 1 e o estado sem padrão; nota em Health notes; seções novas do relatório | A nota leva à aba; cada sinal mostra valor e regra; passa nos critérios visuais em 1440 e 390 px |
| 3 | Plano e pontos | Seção 5 e o item 2 da aba | Iniciar o plano, marcar um passo e ver "+5 points"; completar o dia dá o bônus; recarregar a página mantém tudo; desmarcar tira os pontos |
| 4 | Radiação | Seção 7, sem o extra do RadLab | O cartão mostra 23.9 mSv, 4% do limite e o link da fonte |
| 5 | Cenários de demonstração | Seção 8 | Carregar "Day 5" e marcar os passos de hoje fecha o plano com "Measures back within your baseline"; "Day 1" volta ao estado inicial |
| 6 | Acabamento | Etiquetas de origem no Detailed stats; Progress com sete medidas; `prevention` no contexto do chat; `frontend/README.md`; linha em [[Decisões]] | README descreve os arquivos novos; o pedido ao webhook leva `prevention` |

Ordem de corte: RadLab real, cenário "Day 3", contexto do chat, etiquetas de origem, depois a fase 4 reduzida a uma linha no cartão de clima espacial. **As fases 1 a 3 são o que o pitch promete.** Se a fase 5 cair, o vídeo mostra só o dia 1 e o início do plano.

## 11. Decisões para a equipe confirmar

O plano segue com a recomendação.

| # | Pergunta | Recomendação | Afeta |
|---|---|---|---|
| 1 | Dizer "doença prevista" ou "sinais precoces"? | Sinais precoces, sem prever doença | Fase 1 |
| 2 | Quantos padrões no demo? | Três, com a lista em arquivo de dados | Fase 1 |
| 3 | Quais padrões e sinais? | Os da seção 4 até a Valéria trocar | Fase 1 |
| 4 | Aba própria ou dentro de outra tela? | Aba "Prevention" | Fase 2 |
| 5 | Nome do plano | "Back-to-baseline plan" | Fase 3 |
| 6 | Duração do plano | 5 dias, como na conversa | Fase 3 |
| 7 | Pontos do plano | 5 por passo, 10 por dia completo, 50 pelo plano | Fase 3 |
| 8 | Comparar a dose com o limite de 600 mSv? | Sim, com fonte e a ressalva "this mission only" | Fase 4 |

## 12. Para a Valéria preencher

Sem isto, os padrões ficam com o selo "Demonstration rule". Com isto, cada um mostra a fonte, e o pitch tem base. Uma linha por padrão; três bastam.

| Padrão (nome curto) | Sinais que vêm antes (medida, direção, por quantos dias) | Fonte dos sinais (link) | Ações de rotina que ajudam, sem remédio | Fonte das ações (link) |
|---|---|---|---|---|
| | | | | |

Mais duas fontes para o pitch: uma que mostre que **os dados de saúde ficam dispersos** nas missões de hoje, e uma para **qualquer medida de proteção contra radiação** que a equipe queira mostrar.

## Desvios

A preencher por quem implementar: o que foi decidido diferente do plano e por quê.

Registrado pelo agente de código (Claude Opus), em 14/11.

**Fase 1**
- A frequência cardíaca tem origem "Wearable" mas continua `input: "manual"`: a pessoa lê no aparelho e digita. Assim o check-up segue com as quatro perguntas, como o critério da fase pede.
- As origens que não são medidas (água, autorrelato comportamental, dosímetro, DONKI) ficaram numa chave `_sources` do `simulated.json`, com a frase "Device feeds are simulated in this demo.", para as telas da fase 6 lerem de um lugar só.
- Regiões do corpo: o peito virou "Chest · heart and lungs" (frequência cardíaca, pressão, saturação, frequência respiratória) e o tronco "Core · temperature and mass". O estado da região é o pior entre as medidas dela, e o detalhe mostra a medida que define esse estado.
- O histórico por dia usa o último check-up de saúde salvo em cada dia UTC. Mudança de comportamento: um check-up de ontem não aparece mais como "hoje"; hoje volta ao valor simulado até a pessoa fazer o check-up do dia.
- Sinal de medida: "presente" quando a medida está fora da linha de base, do lado pedido, pela regra dela, por `days` dias seguidos até hoje. O texto do sinal mostra quantos dias seguidos, quando passa de um ("Sleep 5.1 h · 2.1 h below baseline · 4 days").
- Sinal de água: "desconhecido" se algum dos dias completos pedidos não tem registro (chave ausente no `health7:water:v1`). Um dia com registro 0 conta como meta não atingida.
- Ordem dos padrões: ativos primeiro, sinalizados antes de atenção, depois por número de sinais presentes.
