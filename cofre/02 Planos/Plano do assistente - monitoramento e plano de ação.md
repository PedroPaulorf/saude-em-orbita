---
tipo: plano
criada: 2026-11-14
atualizada: 2026-11-14 (depois do pull de 61e48f5; telas reduzidas a poucos ajustes)
estado: implementado (ver "Desvios" no fim)
para: equipe e agente de código que vai implementar
fontes: "quadro branco 'Como o assistente vai funcionar' (foto de 14/11), gravação da equipe de 13min24s (14/11), pasta `dados/` (planilhas NEXUS-Med), commits até 61e48f5 (roteiro preventivo, linhas de base pré-voo e em voo, rastreabilidade NTRS, testes cognitivos), [[Plano do front-end v3 - medicina preventiva]], [[NTRS - arquitetura de dados e autonomia médica]], [[Escopo do protótipo]], [[Decisões]]"
---
# Plano do assistente: monitoramento, análise e plano de ação

Continuação do [[Plano do front-end v3 - medicina preventiva]]. Este plano troca os três padrões de demonstração inventados pelo planejador pelos **dados da pesquisa** (pasta `dados/`), define como o assistente monitora, analisa e monta o plano de ação, e diz o que vai em cada tela. A IA no n8n fica para a fase 5, depois que dados e regras estiverem funcionando.

**Prazo:** submissão domingo, 15/11, às 23h59; congelar funcionalidades domingo às 15h. As fases da seção 11 estão em ordem de prioridade e se cortam de baixo para cima.

## 1. O que o quadro e a gravação pedem

O quadro "Como o assistente vai funcionar" lista cinco funções:

| Função no quadro | O que significa para o sistema |
|---|---|
| Interação com o usuário, conversa objetiva | Chat curto, que responde sobre os dados da própria pessoa |
| Medicina preventiva, montar plano de ação | Quando aparece uma mudança, o sistema propõe ações de rotina |
| Score de 0 a 100 (anotado no quadro com 90% e 50%) | Um número de intensidade da mudança, com estados |
| Análise de dados ("Com que dados? Como iterar?") | Comparar cada medida com a linha de base da pessoa, dia após dia |
| Monitoramento | Recalcular a cada novo dado e avisar quando o estado muda |

O desenho do quadro mostra o fluxo de tela: **notificação na tela principal → conversa com o assistente → tela do plano de ação**.

Da gravação, o que a equipe fechou:

1. O assistente **monitora os dados o tempo todo**. Ao primeiro sinal de mudança, monta um plano de ação, e continua monitorando enquanto o plano corre [06:00 – 07:00].
2. Em situação crítica, dá **alerta de emergência** para a tripulação e para o solo [04:00 – 04:30], [07:00 – 07:30].
3. **Não substitui o médico.** O plano não manda tomar remédio; fala de hidratação, alimentação, sono [07:30], [10:30 – 11:00].
4. Os sintomas se repetem entre doenças, então a análise precisa do **antes, durante e depois** e de estágios: agudo, persistente, causa de fundo [00:00 – 01:30].
5. Não pode ser só um chatbot que devolve texto pronto: a IA trabalha **sobre os dados** [02:00], [09:20 – 10:00].
6. Os dados vêm da pesquisa com artigos e dados da NASA, de pré-voo, voo e pós-voo [12:00 – 12:30]. É a pasta `dados/`.

## 2. O que já existe no código (pull de 14/11, até 61e48f5)

Boa parte do que o quadro pede já tem base. O plano aproveita em vez de refazer:

| Já existe | Onde | Como este plano usa |
|---|---|---|
| **Roteiro preventivo** em três horizontes (hoje, 3 dias, semana), com motor no aparelho e IA opcional por `VITE_N8N_ROADMAP_WEBHOOK_URL` | `frontend/src/lib/roadmap.ts`, `RoadmapPanel` | **É o plano de ação do quadro.** Ganha os passos das condições da pesquisa (seção 8) |
| **Duas linhas de base**: pré-voo (perfil) e em voo (mediana dos últimos 14 dias, a partir de 3) | `frontend/src/lib/baselines.ts` | É o "antes e durante" da gravação. O motor (seção 7) compara hoje com as duas |
| **Avaliação por medida no servidor**, com regra versionada (`RULE_VERSION`), procedência e linha de base guardadas em `medical_observations` | `backend/src/medical.ts`, migração 003 | O motor parte dessas avaliações por medida e acrescenta a visão de várias medidas e vários dias |
| **Check-up de 7 parâmetros**, com urina e fezes em opções | `HealthCheckUp.tsx` | Mantém; ganha a pergunta de sintomas de alerta (seção 9) |
| **Relatos de sintomas** com rótulo, região do corpo e intensidade | API `/me/symptoms` | A importação grava os sintomas da planilha por aqui; o motor lê os sintomas |
| **Testes cognitivos** (reflexo, memória, Stroop), comparados com a própria mediana | `frontend/src/lib/cognitive.ts` (só no aparelho) | Viram sinal da condição C18 (sono e ritmo): a planilha cita "errors" e "sleepiness" |
| **Barra do companheiro** com rosto de LED e frases do dia | `CompanionButton.tsx`, `companion.ts` | É a notificação proativa do quadro (seção 9) |
| **Fundo da página pela saúde** (azul, laranja, vermelho) | `index.css`, `theme.css` | Passa a seguir o estado do motor |
| **Fontes NTRS e tela de dados** (`#/data`), simulador Monte Carlo educativo | `medical-references.json`, `MedicalData.tsx` | As fontes da planilha entram na mesma lista, com papel "data anchor" |
| **Contas de teste por comando explícito** | `backend/src/users.ts` | A importação segue a mesma regra: só roda quando alguém manda |

Consequências para o plano: a migração nova é a **004**, não a 003; o plano de ação **não** é uma tela nova, é o roteiro; e o app hoje tem dois "planos" (o roteiro e o plano de 5 dias com pontos do v3), o que precisa ser resolvido (decisão 8 da seção 12).

## 3. Opinião do planejador

A ideia fecha bem com o que o app já tem, e os dados que chegaram são melhores do que o esperado: linha de base por pessoa, casos de 30 dias, quatro estados de alerta e frases seguras escritas pela própria pesquisa. Três ajustes para caber nas regras do cofre e no critério Validity:

| Ideia | Problema | Como entra |
|---|---|---|
| "Você está com probabilidade de ter a doença X" | Não existe dado para calcular probabilidade. Um número de 90% seria inventado; o README do back-end e a nota NTRS já proíbem probabilidade clínica | O score é **intensidade da mudança** em relação à linha de base. A tela diz "pattern compatible with dehydration concern, requires review", o texto seguro da própria planilha |
| "A IA monitora e decide" | Um modelo de linguagem inventa números e não é reproduzível | **Regra decide, IA explica.** É o mesmo princípio que o `roadmap.ts` já segue ("a IA escreve os passos, não decide o que é sinalizado") |
| "Se for grave, a IA manda voltar para casa" | Decisão de missão é do cirurgião de voo e do comandante | Estado ESCALATE mostra texto fixo: "Escalate to Crew Medical Officer / ground medical support according to mission protocol". O alerta não passa pela IA |

Sobre a origem dos números: os **valores** das medidas seguem tendências publicadas (Inspiration4, Skylab, NASA-STD-3001), e a aba `03_Source_Evidence` aponta a página de cada uma. O **score e os rótulos de alerta**, porém, foram escritos à mão (sem fórmula, e o rótulo nem sempre acompanha o score; ver seção 5). Então o score do app é uma **regra de demonstração com valores ancorados na literatura**, e deve ser apresentado assim.

## 4. Regras

Todas as regras do plano v3 continuam (palavras proibidas, ponto só por ação, plano sempre "suggested" e enviado ao solo). Acrescentam-se:

- **Regra decide, IA explica.** Estado, score e sinais vêm do motor (seção 7). A IA recebe o resultado pronto e não pode alterá-lo.
- **Sem probabilidade.** Proibido na interface e nas respostas da IA: probability, chance, likely to develop, risk of death, além das palavras do v3 (disease, diagnosis, predict, treatment, cure, prescription, patient).
- **Texto seguro da pesquisa.** Cada padrão compatível mostra o "Safe wording" da aba `04_Disease_Alignment`, sem reescrever. A tela não mostra o nome da condição sozinho; mostra a frase inteira.
- **Emergência sem IA.** ESCALATE dispara o alerta direto do motor, com texto fixo. A IA pode comentar depois, nunca antes.
- **Plano só com passos de rotina.** Os passos vêm da biblioteca do roteiro (seção 8). A IA reescreve e ordena; os sinais e o "ground" continuam vindo da regra, como o `buildWithAi` já faz.
- **Selo em tudo.** "Demonstration rule · values anchored in published spaceflight data" no score; "Synthetic crew profiles" nos tripulantes; "Real NASA RR-1 environment, re-indexed" no ambiente.
- **Versão da regra.** O motor tem versão própria (`health7-nexus-2026-11-14-v1`), registrada em `medical_rules` como as outras. Mudou limiar, muda a versão.

## 5. Os dados da pasta `dados/`

### O que tem

| Arquivo | Conteúdo |
|---|---|
| `nexus_med_crew_profiles.csv` | 6 tripulantes fictícios (NX-01 a NX-06): sexo, idade, função, histórico médico, cenário, linha de base de cada medida |
| `nexus_med_daily_30d_6crew.csv` | 180 linhas: 30 dias de voo por tripulante, com medidas, sintomas, condição, estágio, red flag, ambiente, score, alerta e ação recomendada |
| `nexus_med_telemetry_6crew.csv` | 66 linhas: pontos de pré-voo, voo e pós-voo (L-30 a R+30) |
| `Med_6_crew_prototype_dataset.xlsm` | Perfis, telemetria, **fontes por variável** (`03_Source_Evidence`), ambiente e **guia de alertas** (`05_Alert_Guide`) |
| `NEXUS-Med_6crew_daily_30d_cases.xlsm` | Perfis, 30 dias, **casos** (`03_Case_Scenarios`), **condições** (`04_Disease_Alignment`), pré e pós-voo, ambiente e resumo dos casos |

As planilhas não têm macros (sem `vbaProject.bin`). A única fórmula calcula a carga de ambiente (`context_load`).

### Medidas

Frequência cardíaca, frequência respiratória, temperatura corporal, SpO₂, massa corporal, altura, micções em 24 h, evacuações em 24 h, sono, pressão sistólica e diastólica. As colunas `baseline_*` trazem a linha de base pessoal (vira a linha de base **pré-voo** do `baselines.ts`). Os 30 dias de voo alimentam a linha de base **em voo**.

### Os quatro estados (aba `05_Alert_Guide`)

| Estado | Significado | Texto para a pessoa | Ação |
|---|---|---|---|
| STABLE | Dentro da variação pessoal esperada | Measurements are within your expected personal range. | Continue routine monitoring. |
| WATCH | Mudança relevante; pode ser adaptação ou passageira | A change from your personal baseline was detected. | Repeat measurement; complete symptom check-in; review context. |
| PERSISTENT CHANGE | Mudança em várias medidas que merece revisão | Several measurements are moving away from your personal baseline. | Repeat/confirm; reduce non-critical workload; open action card. |
| ESCALATE | Padrão ou sintoma pede revisão médica | Current changes require medical evaluation. | Escalate to CMO / ground support according to mission protocol. |

São os "estágios" da gravação, já com texto seguro.

### As seis condições (aba `04_Disease_Alignment`)

| ID | Condição | Medidas principais | Padrão no protótipo |
|---|---|---|---|
| C05 | Late headache | PA, FC, T°, FR, SpO₂, sono | Dor de cabeça + vários desvios |
| C06 | Space motion sickness + dehydration risk | FC, PA, massa, urina, sono | Náusea no início do voo com mudanças passageiras |
| C09 | Respiratory infection | T°, FC, FR, SpO₂, PA, sono | Sintomas + T↑ FC↑ FR↑ SpO₂↓ sono↓ persistentes |
| C12 | Dehydration / hypovolemia pattern | FC, PA, massa, urina, FR | FC↑ + PA↓ + urina↓ + massa↓ |
| C16 | Nephrolithiasis | urina, hidratação, massa, FC/T° | Desconforto no flanco + mudanças de urina e hidratação |
| C18 | Sleep / circadian deterioration | sono, FC, atividade | Queda persistente do sono com impacto |

### Os casos, que já são o roteiro do vídeo

| Tripulante | Caso | Evolução nos dados | Uso no demo |
|---|---|---|---|
| NX-06, M, 52 | C09, infecção respiratória | WATCH no dia 10, PERSISTENT 11–12, ESCALATE 13–15 (red flag no 14), recuperação até o 22 | **Alerta de emergência** |
| NX-04, M, 41 | C12 + C16, desidratação e preocupação renal | WATCH 16–18, PERSISTENT 19–23, recuperação 24–27 | **Plano de ação** de hidratação |
| NX-03, F, 37 | C18 + C05, sono e dor de cabeça | WATCH 9–11, PERSISTENT 12–17, recuperação | Mudança persistente sem emergência; usa os testes cognitivos |
| NX-01, F, 29 | C06, enjoo do início do voo | WATCH nos dias 1–2, estável depois | Adaptação normal |
| NX-02, M, 33 | Controle (bradicardia de atleta) | Estável os 30 dias | **Sem falso positivo** |
| NX-05, F, 46 | Intolerância ortostática pós-voo | Estável em voo; FC 92 no R+1 | Pós-voo, se sobrar tempo |

### Problemas encontrados (para a pesquisa corrigir ou confirmar)

1. **O score não tem fórmula.** `health_change_score` está digitado.
2. **O alerta não segue o score.** NX-03 fica em PERSISTENT CHANGE com score 24–27; NX-01 tem 39 no dia 1 e está em WATCH; NX-04 está em WATCH com 55 no dia 18 e em PERSISTENT com 54 no dia 19. O rótulo foi dado por caso, não pelo número. Por isso o motor decide o estado por **persistência e número de medidas**, e usa o score só como intensidade.
3. **`07_Case_Summary` contradiz os dados diários.** NX-03 aparece com pior dia "Day 1", pico 27 e STABLE; NX-04 aparece com pico WATCH, mas tem cinco dias de PERSISTENT CHANGE.
4. **Radiação em mGy** (dose absorvida), não em mSv. O cartão de hoje compara mSv simulado com o limite de 600 mSv. Não converter por conta própria.
5. **Ambiente real reindexado.** O RR-1 é real, mas não foi medido junto com estes tripulantes. A própria planilha avisa; o app repete o aviso.
6. **Aba de fontes em espanhol.** Traduzir para os slides e para as References.
7. **Sintomas em texto livre** ("Mild nausea; no vomiting."). A importação converte em rótulos por palavras-chave (seção 6).
8. **Urina em contagem, check-up em cor.** A planilha tem micções por dia; o check-up pergunta a cor ("Clear or pale", "Dark yellow"...). A importação grava as duas coisas (seção 6).
9. **Limiar de frequência cardíaca do servidor** (`medical.ts`: atenção a 5 bpm, nos dois lados) deve marcar o NX-02, que tem bradicardia de atleta, em quase todo dia. A calibração confere isso (seção 7).

## 6. Importação para o banco

**Exportar as abas uma vez** para `dados/derivados/` em JSON, com um script versionado (`dados/scripts/exportar.py`, só biblioteca padrão, lendo o XML das planilhas):

- `condicoes.json`: as seis condições, com medidas, sintomas de check-in, padrão e texto seguro;
- `estados.json`: o guia de `05_Alert_Guide`;
- `casos.json`: `03_Case_Scenarios`;
- `fontes.json`: `03_Source_Evidence`, que entra em `medical_references` com `role: "data-anchor"` e `clinicalThresholdEvidence: false`;
- `pre-pos.json`: `05_Pre_Post`;
- `gabarito.json`: `health_change_score`, `alert_state` e `recommended_action` por dia, **só para os testes do motor**.

**Migração `004_nexus.sql`** (a 003 já é a de rastreabilidade):

- `health`: `urinations_24h` e `stools_24h` (inteiros);
- `environment`: `radiation_dose_mgy_day`, `radiation_accum_mgy`, `co2_ppm`, `relative_humidity_pct`; a coluna antiga em mSv continua para os dados que já existem.

**Script `backend/src/import-nexus.ts`** (`npm run import:nexus`, comando explícito como o `users.ts`, nunca na subida da API):

1. Cria as contas `nx01` a `nx06` com a senha de demonstração. O perfil leva `bodyModel` pelo sexo, `baseline` com as colunas `baseline_*`, `missionDay: 30`, `scenario` e `source: "synthetic-nexus"`.
2. Grava Pessoa (idade, sexo, altura, massa, histórico).
3. Grava um check-in por dia de voo (1 a 30) com os sete parâmetros e `bodyMass` no payload (o servidor guarda a série em `checkins` e atualiza Pessoa com o mais recente). `provenance` de cada medida: `method: "simulated-device"`, `quality: "simulated"`. A cor da urina do check-up fica vazia; a contagem vai para `urinations_24h`.
4. Grava os sintomas pela API de sintomas: rótulo (nausea, vomiting, reduced-appetite, cough, sore-throat, congestion, headache, fatigue, dizziness, thirst, flank-discomfort, dark-urine, shortness-of-breath), região (cough → chest, headache → head, flank-discomfort → back, nausea → abdomen, o resto → general) e intensidade. A tabela de palavras-chave fica no script.
5. Grava um registro de ambiente por dia, com a origem RR-1.
6. Datas: cada conta tem um **dia que cai em hoje** (`--today-day`, padrão NX-06 = 14, NX-04 = 19, NX-03 = 14, NX-01 = 2, NX-02 = 30, NX-05 = 30). O dia N vira `hoje - (diaHoje - N)`, e só entram os dias até o de hoje; `missionDay` do perfil é o dia de hoje. Assim o demo mostra cada caso sem mexer no front. `clientId` estável (`nexus-NX-04-d17`) para poder rodar de novo sem duplicar.

As avaliações por medida (`medical_observations`) são geradas pelo próprio servidor na gravação, como em qualquer check-up.

## 7. Motor de monitoramento (regra decide)

**Onde roda:** `frontend/src/lib/monitor.ts`, função pura no estilo de `roadmap.ts` e `baselines.ts`, com testes. Recomendação mudada depois do pull: o roteiro, as linhas de base e os padrões já rodam no aparelho, e o EIMO (nota NTRS) pede funcionar sem conexão. Uma rota `GET /me/monitor` no back-end fica como próximo passo.

**Entrada:** perfil (linha de base pré-voo), check-ups até o dia escolhido, sintomas, testes cognitivos e ambiente. **Saída:** `{ day, state, score, signals[], patterns[], action, environment, ruleVersion, notice }`.

### Passo 1: desvio de cada medida, contra as duas linhas de base

Cada medida é comparada com a linha de base **pré-voo** e, quando existir, com a **em voo** de `baselines.ts`. O limiar por medida é o de `medical.ts` (mesma regra que o servidor guarda), mais dois que faltam:

| Medida | Lado | Atenção (1 ponto) | Sinalizado (2 pontos) | Origem do limiar |
|---|---|---|---|---|
| Frequência cardíaca | os dois | 5 bpm | 15 bpm | `medical.ts` (rever na calibração, problema 9) |
| Pressão sistólica | os dois | 10 mmHg | 20 mmHg | `medical.ts` |
| Sono | abaixo | 1 h | 2 h | `medical.ts` |
| Temperatura | os dois | 0,5 °C | 1 °C | `medical.ts` |
| SpO₂ | abaixo | 2 pontos | 4 pontos | `medical.ts` |
| Frequência respiratória | os dois | 3/min | 6/min | `medical.ts` |
| Massa corporal | abaixo | 1 kg | 2 kg | `medical.ts` |
| Micções em 24 h | abaixo | 2 | 3 | Novo, demonstração |
| Testes cognitivos | pior | 15% acima da própria mediana (reflexo) ou 2 acertos a menos (Stroop) | — | Novo, demonstração |

Altura fica fora: o alongamento da coluna em microgravidade é esperado (fonte na aba de evidências).

**Hoje contra em voo** mostra mudança de agora; **em voo contra pré-voo** mostra adaptação lenta ao voo (o `Signal.kind` do roteiro já distingue "today" e "drift"). Só a mudança de agora conta para o estado; a adaptação aparece como contexto.

### Passo 2: sintomas e persistência

- Sintoma relatado hoje soma pontos.
- **Persistência:** quantos dias seguidos cada medida está fora. É o "agudo, persistente" da gravação.
- **Janela de adaptação:** nos dias 1 a 3 de voo, mudanças são esperadas (todos os tripulantes têm score mais alto no começo). Nessa janela o estado não passa de WATCH, salvo red flag.

### Passo 3: estado (pela regra, não pelo score)

| Estado | Quando |
|---|---|
| ESCALATE | Algum **red flag**: resposta "sim" a uma pergunta de alerta do check-up (seção 9) ou sintoma da lista de alerta (shortness-of-breath; flank-discomfort com febre; sintomas neurológicos ou visuais; dor de cabeça forte); ou SpO₂ sinalizada junto de febre |
| PERSISTENT CHANGE | Duas ou mais medidas fora (ou uma medida e um sintoma) por **2 dias seguidos ou mais** |
| WATCH | Alguma medida fora hoje ou algum sintoma relatado |
| STABLE | Nada disso |

### Passo 4: score de 0 a 100 (intensidade)

`score = min(100, a × pontos das medidas + b × sintomas + c × dias de persistência)`, com ponto de partida `a = 8`, `b = 6`, `c = 4`, ajustados na calibração. Aparece ao lado do estado, com a lista de sinais que o formaram. Nunca como porcentagem.

### Passo 5: padrões compatíveis

Para cada condição de `condicoes.json`, conta quantos dos seus sinais estão presentes. Mostra no máximo dois, com o texto seguro. Um padrão sozinho nunca muda o estado. **Os três padrões antigos de `conditions.json` saem** (decisão 6).

### Ambiente

A carga de ambiente usa a fórmula da planilha: 1 ponto para cada item entre CO₂ ≥ 3500 ppm, dose ≥ 0,25 mGy/dia, temperatura fora de 21–27 °C e umidade fora de 25–60%. Aparece como **contexto** ("cabin CO₂ high today"), não entra no score.

### Calibração

Teste automático que roda o motor nos 180 dias e compara com o `alert_state` do gabarito. "Pronto quando" da fase 2:

- NX-06 chega a ESCALATE no dia 14 e sai dele na recuperação;
- NX-04 fica em PERSISTENT CHANGE em pelo menos 3 dos dias 19 a 23;
- NX-03 fica em PERSISTENT CHANGE em pelo menos 3 dos dias 12 a 17;
- NX-02 nunca passa de WATCH, e só dentro da janela de adaptação. Se o limiar de 5 bpm de `medical.ts` impedir isso, criar a versão nova da regra com outro limiar, sem mudar a antiga;
- uma tabela de concordância por estado vai para o README, **com os desacordos explicados**, em vez de forçar o motor a decorar os rótulos.

## 8. Plano de ação = roteiro preventivo

O plano de ação do quadro é o **roteiro** que já existe (hoje, próximos 3 dias, esta semana), com os passos marcáveis de `useDoneSteps`. O que muda:

1. **Entrada.** `RoadmapInput` ganha o resultado do motor: `state`, `score`, `signals` e os padrões compatíveis da pesquisa (no lugar dos três padrões antigos).
2. **Biblioteca de passos.** Hoje o `ADVICE` do roteiro é por medida (`sleep:below`, `heartRate:above`). Ganha passos por condição, tirados das ações recomendadas da planilha:

| Condição | Hoje | Próximos 3 dias | Esta semana |
|---|---|---|---|
| C12, C06 (hidratação) | Reach the water goal; log urinations | Weigh in each morning with the same routine | If urine stays low, tell your flight surgeon |
| C16 | Log urinations and urine color | Keep the water goal every day | Ground review if flank discomfort continues |
| C18, C05 (sono e dor de cabeça) | Dim the lights before the sleep period; check cabin CO₂ with the crew | Keep the same sleep period start | Ask to review the work schedule |
| C09 (respiratório) | Repeat today's measurements; rest between tasks | Measure temperature morning and evening | Ground review |
| Qualquer PERSISTENT CHANGE | Ask to reduce non-critical workload today | Repeat the check-up daily | — |

3. **Por estado.** STABLE: roteiro normal de rotina. WATCH: "repeat the measurement" e "complete the symptom check-in" no topo. PERSISTENT CHANGE: roteiro completo. **ESCALATE: o roteiro some** e fica só o alerta com o texto do protocolo.
4. **Iteração** ("como iterar?" do quadro): o roteiro já se refaz quando a entrada muda (`roadmapKey`). Com o motor na entrada, cada novo check-up ou dia recalcula o roteiro.
5. **IA.** O contrato do webhook do roteiro já existe (`mode: "roadmap"`, `instructions`, `context` → JSON com `headline`, `summary`, `phases`). A IA recebe também o estado e os padrões, e continua sem poder mudar o que é sinalizado.

**Os dois planos.** O plano de 5 dias com pontos do v3 e o roteiro se sobrepõem. Recomendação: o roteiro vira o único plano de ação; o botão "Start plan" passa a acompanhar os passos do roteiro por 5 dias, com os mesmos pontos (5 por passo, 10 pelo dia completo, 50 no fim). Decisão 8.

## 9. Telas: poucos ajustes no front

O front mudou bastante com o pull de 14/11 (roteiro, linhas de base, check-up de 7 parâmetros, testes cognitivos, companheiro, fundo pela saúde). **A decisão é mexer pouco nas telas**: o trabalho fica nos dados e na regra, e as telas reaproveitam os componentes que já existem.

### Os cinco ajustes

| # | Onde | Ajuste | Componente reaproveitado |
|---|---|---|---|
| 1 | Prevention | Os padrões passam a ser as seis condições da pesquisa, com o texto seguro. É troca de dados em `conditions.json` (e um tipo de sinal novo, `symptom`), não de tela | `PatternCard` |
| 2 | Prevention | Uma linha no topo do roteiro com o estado e o score: "Persistent change · score 54 · Day 19 · Demonstration rule". Em ESCALATE, o roteiro some e fica o texto do protocolo | `RoadmapPanel` |
| 3 | Home | Uma nota nova em Health notes com o estado e os dois sinais principais, que leva à Prevention | `HealthNotes` |
| 4 | Todas | Faixa vermelha fixa em ESCALATE, com o texto do protocolo e "Notify ground" (no demo, só registra o horário) | Novo, pequeno, no `AppShell` |
| 5 | Companheiro | Quando o estado sobe, a frase do dia vira o aviso ("I noticed a change in your hydration. Want to talk about it?") e abre o chat | `companion.ts` |

**Estados:** a tela continua com as três cores que já existem. WATCH e PERSISTENT CHANGE usam a cor de atenção, ESCALATE usa a de sinalizado, e a **palavra** do estado da pesquisa aparece escrita. O fundo da página já segue as cores.

**Sem controle de dia da missão:** a importação escolhe, por conta, qual dia da planilha cai em "hoje" (seção 6): NX-06 no dia 14 (Escalate), NX-04 no dia 19 (plano), NX-03 no dia 14 (persistente), NX-02 no dia 30 (estável). Para o vídeo, basta entrar em cada conta.

**Roteiro do vídeo:** `nx04` → nota na Home → companheiro → chat → Prevention com o roteiro de hidratação e passos marcados; `nx06` → faixa vermelha e "Notify ground"; `nx02` → tudo estável, sem falso positivo.

### Só se sobrar tempo

Na ordem: perguntas de alerta no check-up (um "sim" vai para ESCALATE); linha do tempo do score dos 30 dias na Prevention; controle de dia da missão com "Play" no diálogo de demo; tripulação NX no Progress; cartão de ambiente RR-1 em mGy; relatório com histórico de estados; visão do solo (`#/ground`).

## 10. Assistente no n8n (fase 5)

O front já chama dois webhooks, com contrato definido no código:

| Fluxo | Variável | Contrato | Falta |
|---|---|---|---|
| `[H7] Assistente` | `VITE_N8N_CHAT_WEBHOOK_URL` | Mensagem + contexto do dia → `{ reply }` | O fluxo "My workflow" é só um Webhook que responde na hora. Precisa de AI Agent, memória pelo `sessionId`, "Respond to Webhook", URL de produção e CORS. Contexto ganha `monitor` |
| `[H7] Roteiro` | `VITE_N8N_ROADMAP_WEBHOOK_URL` | `{ mode: "roadmap", instructions, context }` → `{ headline, summary, phases }` | Fluxo novo. Contexto ganha estado e padrões. O `parseAiRoadmap` já rejeita resposta fora do formato |
| `[H7] Alerta ao solo` | nova, `VITE_N8N_ALERT_WEBHOOK_URL` | `{ crew, day, state, signals }` → mensagem (Telegram ou e-mail) | Fluxo novo. A faixa na tela não depende dele |
| `[H7] Relatório` | `AI_PROVIDER_URL` do back-end | `{ task, context }` → `{ summary }` | Fluxo novo; o back-end já chama |

As URLs ficam públicas dentro do site e não têm autenticação. Aceitável com dados fictícios; nunca com dados reais.

## 11. Fases

| # | Fase | Entrega | Pronto quando |
|---|---|---|---|
| 1 | Dados | Exportação das abas, migração 004, `import:nexus`, fontes da planilha em `medical_references` | Login com `nx04` mostra 30 dias de check-ups, sintomas e ambiente; rodar a importação de novo não duplica |
| 2 | Motor | `frontend/src/lib/monitor.ts` com testes de calibração; nova versão de regra registrada | Os critérios da calibração passam; tabela de concordância no README |
| 3 | Ajustes 1 a 4 da seção 9 | Condições da pesquisa no `conditions.json`, linha de estado no roteiro, nota na Home, faixa de ESCALATE; os três padrões antigos saem | `nx06` mostra a faixa vermelha; `nx02` fica estável; passa nos critérios visuais em 1440 e 390 px |
| 4 | Plano e conversa | Roteiro com o motor na entrada e os passos por condição (seção 8); ajuste 5 (companheiro) | `nx04`: companheiro → chat → Prevention com roteiro de água e urina; marcar passos dá pontos |
| 5 | n8n | Fluxos da seção 10 | O chat responde pela URL de produção; o roteiro da IA passa no `parseAiRoadmap`; ESCALATE gera mensagem para o solo |
| 6 | Acabamento | README, References a partir de `fontes.json`, linha em [[Decisões]]; itens de "Só se sobrar tempo" da seção 9 | Cada número da tela tem fonte ou selo de demonstração |

**Ordem de corte:** pós-voo do NX-05, alerta ao solo pelo n8n, relatório pelo n8n, roteiro pela IA (fica o do aparelho), ajuste 5 (companheiro). **As fases 1 a 4 são o demo.** Se a fase 1 atrasar, o front lê os CSVs convertidos em JSON estático no modo demo e o motor roda igual.

## 12. Decisões para a equipe confirmar

| # | Pergunta | Recomendação |
|---|---|---|
| 1 | Score como probabilidade ou como intensidade? | Intensidade de 0 a 100, sem porcentagem |
| 2 | Estado pela regra ou pelo score? | Pela regra (persistência e número de medidas); o score só mostra intensidade |
| 3 | Três ou quatro estados no app? | Três cores (as que já existem) com a palavra dos quatro estados da pesquisa |
| 4 | Onde roda o motor? | No front (`monitor.ts`), como o roteiro; rota no back-end depois |
| 5 | Tripulantes do demo | NX-06 (emergência), NX-04 (plano), NX-02 (sem falso positivo) |
| 6 | Os padrões antigos (sleep debt, low intake, reduced oxygenation) | Sair, trocados pelas seis condições da pesquisa |
| 7 | Radiação | Mostrar o RR-1 em mGy no cartão de ambiente; a comparação com 600 mSv sai ou fica só na série simulada, separada |
| 8 | Roteiro e plano de 5 dias | Um plano só: o roteiro, com "Start plan" acompanhando os passos por 5 dias e os mesmos pontos |
| 9 | Perguntas de alerta no check-up | Só se sobrar tempo; no demo, o red flag vem dos dados importados |
| 10 | Limiar de frequência cardíaca (5 bpm) | Rever na calibração por causa do NX-02, criando versão nova da regra |

## 13. Pendências da pesquisa

- Corrigir `07_Case_Summary` (NX-03 e NX-04) ou confirmar que a aba pode ser ignorada.
- Dizer se os rótulos de `alert_state` foram dados por caso (parece que sim) e se o motor pode discordar deles nos dias de transição.
- Lista de red flags com fonte, se existir; senão, as quatro perguntas ficam como regra de demonstração.
- Referências completas (autor, ano, link) dos PDFs citados em `03_Source_Evidence`, para as References da submissão.
- Tradução da aba de fontes para inglês.

## Desvios

Registrados durante a implementação (14/11).

### Fase 1: dados

| # | Onde | O plano dizia | O que foi feito | Por quê |
|---|---|---|---|---|
| 1 | `dados/derivados/` | Seis JSON | Mais dois: `tripulantes.json` (perfis e linha de base) e `diario.json` (30 dias, sem score nem alerta) | A importação e os testes do motor precisam das medidas diárias; o gabarito continua separado |
| 2 | Palavras-chave dos sintomas | Tabela no script de importação | Tabela em `exportar.py`; `diario.json` já traz os rótulos | Importação e testes do motor usam exatamente os mesmos rótulos |
| 3 | Leitura das abas | XML das planilhas | XML das planilhas, conferido com o CSV; o score vem do CSV | A aba `02_Daily_Mission_30d` não tem `health_change_score` |
| 4 | Sintomas | Gravar pela API | Um **episódio** por rótulo: início no primeiro dia, evolução nos seguintes, resolução no primeiro dia sem ele | A API de sintomas é por episódio; assim a evolução fica no histórico |
| 5 | Texto de melhora | — | "improving" e "nearly resolved" mantêm os rótulos com intensidade 1 | O texto diz que o sintoma continua, mais leve (regra no `dados/README.md`) |
| 6 | Red flag | Pergunta de alerta do check-up (só se sobrar tempo) | `healthDetails.redFlag: true` no check-up importado do dia marcado na planilha (NX-06, dia 14) | É o lugar onde a futura pergunta de alerta vai gravar; o motor lê daí |
| 7 | Contagens | `urinations_24h` e `stools_24h` em `health` | Chegam por `healthDetails.urinations24h` e `stools24h` no check-up; a 004 refaz a projeção | Mantém a regra de que o check-up é a fonte e `health` é projeção |
| 8 | Ambiente | Quatro colunas novas | Mais a troca da restrição "pelo menos um valor" (`environment_any_value`) para contar as colunas novas | Senão um registro só com CO₂ seria recusado |
| 9 | Importação | Gravar pela API | Rotas da própria API em processo (`app.inject`), com uma sessão curta criada e apagada pela importação | Mesma validação e mesmas avaliações por medida, sem servidor rodando e sem depender da senha |
| 10 | Datas | Dia N = hoje − (diaHoje − N) | Às 06:00 UTC; "hoje" é o dia UTC de 6 h atrás; a data fica no perfil (`profile.nexus.anchorDate`) | Rodar de novo em outro dia não troca as datas nem duplica. Para mover, `--reset` |
| 11 | `--reset` | — | Apaga os registros só das contas NEXUS (perfil `synthetic-nexus`); desliga a trava de "só acréscimo" dos eventos de sintoma dentro da transação | Gravar o vídeo em outro dia exige mover "hoje". Conta com o mesmo nome que não seja NEXUS não é tocada |
| 12 | Perfil | `source: "synthetic-nexus"` | Igual; a altura vai para Pessoa e fica fora da linha de base das medidas | Altura muda em microgravidade (seção 7) |
| 13 | Testes | — | Corrigido um teste antigo do back (`medical.test.ts`) que já falhava na main: o seed passou a ter SpO₂ na linha de base | Build e testes limpos |

### Fase 2: motor

| # | Onde | O plano dizia | O que foi feito | Por quê |
|---|---|---|---|---|
| 14 | Linha de base em voo | A de `baselines.ts` (mediana dos últimos 14 dias) | Mesma janela e mesma mediana, sem o valor da medida nos dias em que ela estava fora junto com outra medida ou com sintoma; uma mudança que dura 14 dias vira a nova linha de base | A mediana simples absorve a mudança enquanto ela dura: o sono da NX-03 deixaria de contar no dia 13. A tela do roteiro continua mostrando a mediana simples |
| 15 | Medida sozinha | — | Medida fora sozinha, sem sintoma, entra na linha de base em voo | Sem isso a perda de massa esperada em voo (NX-02, −1,0 a −1,5 kg) ficaria em WATCH do dia 3 ao 16 |
| 16 | Limiar de 5 bpm | Rever, porque marcaria o NX-02 | Mantido | Não marca: o NX-02 é comparado com a própria linha de base (52 bpm) e fica entre 51 e 54 |
| 17 | Pesos do score | `a = 8, b = 6, c = 4`, ajustar na calibração | Mantidos | Correlação 0,89 com o score digitado, sem ajuste |
| 18 | Febre | "SpO₂ sinalizada junto de febre" | Febre = temperatura **sinalizada** acima da linha de base pessoal (1 °C ou mais) | Mantém tudo relativo à pessoa, sem limiar clínico absoluto |
| 19 | Concordância | Tabela no README | Em `dados/README.md`, junto do gabarito; o teste falha se a tabela mudar | 159 de 180 dias (88%); 19 dos 21 desacordos são o motor mais cauteloso. Os 2 restantes são os dias 13 e 15 do NX-06, que o gabarito marca ESCALATE sem red flag |
| 20 | Versão da regra | Registrar em `medical_rules` | O servidor registra `health7-nexus-2026-11-14-v1` na subida, ao lado da versão antiga, que não muda | Testes no front conferem que limiares, pesos e versão batem com `medical.ts` |

### Fase 3: telas (ajustes 1 a 5 da seção 9)

| # | Onde | O plano dizia | O que foi feito | Por quê |
|---|---|---|---|---|
| 21 | Padrões | Avaliados por `prevention.ts` | As seis condições são avaliadas **sobre o resultado do motor** (`patternsFromMonitor`): a medida conta contra a mesma linha de base que decide o estado | Um avaliador só; padrão e estado nunca se contradizem. `usePatterns()`, o chat e o relatório passam a usar o motor |
| 22 | `conditions.json` | Seis condições e o tipo `symptom` | Mais o tipo `cognitive` (C18), `required` (C16 sem desconforto no flanco não ativa; C05, C06 e C09 precisam do sintoma) e `missionDayMax: 7` na C06 | Sem isso a C16 acenderia em qualquer desidratação e a C06 no dia 20 |
| 23 | Título do padrão | Texto seguro inteiro | O título é o texto seguro; o nome da condição fica só em `condition`, uso interno | Regra "nunca o nome sozinho". **Para a equipe:** o texto da C16 traz a palavra "diagnosis" ("imaging/lab needed for diagnosis"), da lista proibida do v3. Mantido sem reescrever; decidir se a pesquisa troca a frase |
| 24 | Planos de 5 dias | Decisão 8 em aberto | Cada condição tem um plano com os passos da tabela da seção 8; em ESCALATE não se sugere plano | "Start plan" continua funcionando até a equipe decidir a decisão 8 |
| 25 | Fundo da página | Já segue as cores | Passa a seguir o estado do motor (STABLE azul, WATCH e PERSISTENT laranja, ESCALATE vermelho) | Antes seguia a avaliação contra o pré-voo, que pinta de laranja a adaptação normal (massa do NX-02) |
| 26 | Sessão | — | Busca também `/me/environment` (não fatal) para o contexto de cabine do motor | Ambiente é contexto; falha não derruba a sincronização |
| 27 | "Notify ground" | Só registra o horário | Guarda o horário por conta e dia neste aparelho e mostra "Ground notified at …" | Demo, sem n8n (fase 5) |
| 28 | Companheiro | Frase quando o estado sobe | Estado subiu: "I noticed a change in your hydration…"; continua igual: "…is still off your baseline"; ESCALATE: aponta para a faixa, sem IA | O tema vem do padrão ativo ou, sem padrão, da medida principal |
| 29 | Relatório e plano | — | Textos ajustados para títulos que agora são frases ("Early-sign pattern: …") | Os títulos antigos eram nomes curtos |

### Fase 4: roteiro

| # | Onde | O plano dizia | O que foi feito | Por quê |
|---|---|---|---|---|
| 30 | `RoadmapInput` | `state`, `score`, `signals` e padrões | `monitor: { state, score, day, wording, reasons, signals }`; os padrões já vêm do motor (no máximo dois, como na tela) | Uma entrada só para o motor no aparelho e para a IA |
| 31 | Biblioteca de passos | Passos por condição (tabela da seção 8) | `CONDITION_ADVICE` por condição, na frente dos passos por medida; o passo da semana de C12, C06, C16 e C09 é "ground" | Segue a tabela; o que vai ao solo continua decidido pela regra |
| 32 | Por estado | WATCH, PERSISTENT, ESCALATE | WATCH: "repeat" e "symptom check-in" no topo; PERSISTENT: passo da condição, depois "reduce non-critical workload" e "repeat the check-up daily"; ESCALATE: o motor no aparelho devolve só o passo do protocolo, e a tela mostra o texto fixo | Seção 8, item 3 |
| 33 | IA do roteiro | Recebe estado e padrões | O contexto leva `monitor` e `conditionSteps`; as instruções proíbem mudar o estado, chamar o score de probabilidade e escrever passos em ESCALATE | "Regra decide, IA explica". O fluxo do n8n é da fase 5 |
| 34 | Pontos dos passos | "marcar passos dá pontos" (fase 4) | Não mexido: os passos do roteiro continuam marcáveis, e os pontos seguem no plano de 5 dias | Depende da decisão 8 (um plano só), ainda em aberto |



### Fase 5: n8n

| # | Onde | O plano dizia | O que foi feito | Por quê |
|---|---|---|---|---|
| 35 | Fluxos | Assistente, Roteiro, Alerta ao solo e Relatório | Feitos e publicados os três primeiros, na pasta "health7": `[H7] Assistente`, `[H7] Roteiro`, `[H7] Alerta`. O Relatório (back-end, `AI_PROVIDER_URL`) ficou para depois | Os três aparecem no vídeo; o relatório não |
| 36 | Alerta ao solo | Mensagem por Telegram ou e-mail | Decisão da equipe (14/11): **o alerta fica só com a tripulação**. O fluxo registra e confirma (`delivery: "crew-only"`), sem enviar nada para fora; a faixa mostra "Alert recorded at …" | Um canal para o solo pode sair do nó "Build Alert Record" depois |
| 37 | Guardas da IA | Regra decide, IA explica | Prompt com as regras; filtro de palavras no chat (troca a resposta) e no roteiro (422, o app usa o roteiro do aparelho); ESCALATE não chega à IA do roteiro; o chat em ESCALATE só aponta o protocolo | Testado com NX-04 e NX-06: sem diagnóstico, remédio ou probabilidade; corrigidos números inventados (água em litros, diastólica) e a oferta de "avisar o solo", que a IA não pode fazer |
| 38 | Modelo | — | OpenAI `gpt-5-mini`, esforço de raciocínio baixo, credencial "OpenAI account" que já existia | Rápido para o demo (chat em 6 a 10 s, roteiro em cerca de 15 s) |
