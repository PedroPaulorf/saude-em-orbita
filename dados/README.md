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
