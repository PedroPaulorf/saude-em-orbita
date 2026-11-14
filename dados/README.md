# Dados NEXUS-Med (fictícios)

Pesquisa da equipe para o Health7: **seis tripulantes fictícios** (NX-01 a NX-06), 30 dias de voo, pontos de pré e pós-voo, quatro estados de alerta e seis condições com "safe wording". Os valores das medidas seguem tendências publicadas (Inspiration4, Skylab, NASA-STD-3001; aba `03_Source_Evidence`). O ambiente é o **RR-1 real da NASA, reindexado** ao dia da missão: não foi medido junto com estes tripulantes.

| Arquivo | Conteúdo |
|---|---|
| `NEXUS-Med_6crew_daily_30d_cases.xlsm` | Perfis, 30 dias, casos, condições, pré/pós-voo, ambiente, resumo |
| `Med_6_crew_prototype_dataset.xlsm` | Perfis, telemetria, fontes por variável, ambiente, guia de alertas |
| `nexus_med_*.csv` | Os mesmos dados em CSV; o diário traz `health_change_score`, que a aba não tem |
| `scripts/exportar.py` | Exporta as abas para `derivados/` (só biblioteca padrão; as planilhas não têm macro) |
| `derivados/*.json` | Saída do script, lida pela importação (`npm run import:nexus`) e pelos testes do motor |

```bash
python3 -I dados/scripts/exportar.py   # da raiz do repositório
```

## Arquivos derivados

| JSON | Origem | Uso |
|---|---|---|
| `tripulantes.json` | `01_Crew_Profiles` + cenário do CSV | Perfil e linha de base pré-voo |
| `diario.json` | `02_Daily_Mission_30d`, conferido com o CSV | Check-ups, sintomas em rótulos, red flag, ambiente. **Sem** score nem alerta |
| `condicoes.json` | `04_Disease_Alignment` | As seis condições e o texto seguro |
| `estados.json` | `05_Alert_Guide` | Os quatro estados |
| `casos.json` | `03_Case_Scenarios` | Os três casos do demo |
| `fontes.json` | `03_Source_Evidence` (em espanhol) | `medical_references`, papel `data-anchor` |
| `pre-pos.json` | `05_Pre_Post` | Pré e pós-voo |
| `gabarito.json` | CSV diário | `health_change_score`, `alert_state`, `recommended_action`: **só para testes** |

## Sintomas: texto livre para rótulos

A planilha descreve sintomas em texto ("Mild nausea; no vomiting."). O script converte por palavras-chave (tabela `KEYWORDS`):

| Texto | Rótulo | Região |
|---|---|---|
| nausea | `nausea` | abdomen |
| vomit | `vomiting` | general |
| appetite | `reduced-appetite` | general |
| cough | `cough` | chest |
| sore throat | `sore-throat` | general |
| congestion | `congestion` | general |
| headache | `headache` | head |
| fatigue, malaise, reduced exercise tolerance | `fatigue` | general |
| dizz… | `dizziness` | general |
| thirst | `thirst` | general |
| flank | `flank-discomfort` | back |
| dark urine | `dark-urine` | general |
| shortness of breath, dyspn… | `shortness-of-breath` | general |

Regras: negação ("no vomiting", "no fever") e "X resolved" não contam. Intensidade: "4/10" logo depois do termo; senão "persistent" = 4, "mild" = 2, padrão 3. Texto de melhora ("improving", "nearly resolved"): termos citados ficam com intensidade 1; sem termo citado, os rótulos do dia anterior continuam com intensidade 1. A importação grava cada rótulo como um episódio da API de sintomas (início, evolução, resolução).

## Problemas conhecidos

1. `health_change_score` foi digitado, sem fórmula; `alert_state` não acompanha o score (rótulo por caso).
2. `07_Case_Summary` contradiz o diário (NX-03 com pior dia "Day 1" e STABLE; NX-04 com pico WATCH e cinco dias de PERSISTENT CHANGE). Não é exportada.
3. Radiação em **mGy** (dose absorvida), não em mSv. Não converter.
4. Fontes em espanhol; traduzir para slides e References.
5. Urina em contagem por dia; o check-up do app pergunta a cor. A importação grava a contagem (`urinations24h`) e deixa a cor vazia.

## Calibração do motor de monitoramento

O motor (`frontend/src/lib/monitor.ts`, regra `health7-nexus-2026-11-14-v1`) roda nos 180 dias em `frontend/src/lib/monitor.test.ts`, com as mesmas entradas que a importação grava. O `alert_state` da planilha é **gabarito de teste**, não alvo: foi rotulado à mão, por caso, e o motor não é ajustado para decorá-lo.

Critérios (todos passam): NX-06 em ESCALATE no dia 14 e fora dele na recuperação; NX-04 em PERSISTENT CHANGE em 5 dos dias 19 a 23; NX-03 em 6 dos dias 12 a 17; NX-02 nunca acima de WATCH, e WATCH só no dia 3 (janela de adaptação).

### Concordância por estado (180 dias)

Linhas: gabarito da planilha. Colunas: motor.

| Gabarito \ Motor | STABLE | WATCH | PERSISTENT CHANGE | ESCALATE |
|---|---:|---:|---:|---:|
| STABLE (146) | **134** | 10 | 2 | 0 |
| WATCH (15) | 0 | **8** | 7 | 0 |
| PERSISTENT CHANGE (16) | 0 | 0 | **16** | 0 |
| ESCALATE (3) | 0 | 0 | 2 | **1** |

Concordam em 159 de 180 dias (88%). Em 19 dos 21 desacordos o motor fica **mais cauteloso** que o gabarito; ele nunca diz STABLE quando o gabarito diz outra coisa. Score do motor contra o `health_change_score` digitado: correlação 0,89, diferença média de 10 pontos.

### Os desacordos, explicados

| Tripulante e dias | Gabarito | Motor | Por quê |
|---|---|---|---|
| NX-06, dias 13 e 15 | ESCALATE | PERSISTENT CHANGE | A planilha só marca `red_flag` no dia 14. O motor escala por red flag, nunca pelo número; nos dias 13 e 15 os sinais são os mesmos do 12 e do 16, que o próprio gabarito chama de PERSISTENT CHANGE |
| NX-06, dias 19 a 21 | WATCH | PERSISTENT CHANGE | FC +8 a +10, FR +3, T +0,5 a +0,7 e tosse ainda relatada: duas ou mais medidas fora por dias seguidos. O gabarito já rotula como recuperação |
| NX-06, dia 22; NX-03, dias 20 e 21; NX-04, dias 26 e 27 | STABLE | WATCH | O texto do dia diz que o sintoma "está melhorando": continua relatado (intensidade 1), e sintoma relatado é WATCH |
| NX-03, dias 18 e 19 | STABLE | PERSISTENT CHANGE | Sono ainda 1,3 a 1,5 h abaixo da linha de base, com dor de cabeça relatada. O gabarito muda para STABLE no primeiro dia da intervenção |
| NX-03, dia 11 | WATCH | PERSISTENT CHANGE | Sono −1,7 h com fadiga e dor de cabeça pelo segundo dia seguido (dias 10 e 11): é a regra de persistência |
| NX-04, dia 18 | WATCH | PERSISTENT CHANGE | Micções −3 (sinalizado), FC +7 e massa −1,2 kg com sede, pelo segundo dia. O gabarito tem score 55 neste dia e 54 no dia 19, que chama de PERSISTENT CHANGE |
| NX-04, dias 24 e 25 | WATCH | PERSISTENT CHANGE | Micções ainda −2 e FC +6 no dia 24, com urina escura relatada (melhorando) |
| NX-01, dias 3 e 4 | STABLE | WATCH | Náusea "improving" e "nearly resolved" seguem relatadas, com intensidade 1 |
| NX-02 dia 3; NX-03 dia 1; NX-05 dia 1 | STABLE | WATCH | Uma medida fora do pré-voo no começo do voo (massa −1,0 kg; sono −1,1 h). Janela de adaptação: não passa de WATCH |

### Decisões da calibração

- **Linha de base em voo robusta.** A mediana simples de 14 dias (`baselines.ts`) absorve a mudança enquanto ela dura: o sono da NX-03 deixaria de contar no dia 13. O motor usa a mesma janela e a mesma mediana, mas deixa de fora o valor de uma medida nos dias em que ela estava fora junto com outra medida ou com sintoma. Uma medida que se afasta sozinha, sem sintoma, é adaptação e entra (a perda de massa do NX-02, −1,0 a −1,5 kg, que sem isso ficaria em WATCH do dia 3 ao 16). Uma mudança que dura a janela inteira vira a nova linha de base.
- **Limiar de 5 bpm mantido.** O problema 9 do plano previa que ele marcaria o NX-02 (bradicardia de atleta). Não marca: a comparação é com a linha de base **pessoal** (52 bpm), e o NX-02 fica entre 51 e 54. Não foi preciso outro limiar.
- **Pesos do score mantidos** (8 por ponto de medida, 6 por sintoma, 4 por dia de persistência). Com eles o score acompanha o digitado (correlação 0,89) sem ajuste fino.
