# Recursos oficiais

**Estado:** fontes institucionais registradas abaixo; confirmação dos recursos específicos do desafio e revisão clínica pela equipe permanecem pendentes. As referências de arquitetura e autonomia não validam os limiares de demonstração do protótipo.

## Registro de fontes
| Título | URL | Instituição | Consulta em | Afirmação apoiada | Limitações | Validado por |
|---|---|---|---|---|---|---|
| [[Riscos NASA HRP\|Risks of Human Spaceflight (17 riscos, uma nota por risco)]] | https://www.nasa.gov/hrp/risks/ | NASA Human Research Program | 2026-11-14 | Lista os riscos à saúde do voo espacial humano em 3 blocos (fisiologia, desempenho comportamental, radiação), com o que fazer e o que se pesquisa | Texto de divulgação, sem limiares clínicos nem instrumentos; números a validar nas descrições formais do HRP | A preencher |
| [[DONKI - clima espacial da NASA\|DONKI (Space Weather Database Of Notifications, Knowledge, Information)]] | https://ccmc.gsfc.nasa.gov/tools/DONKI/ | NASA CCMC / Moon to Mars Space Weather Analysis Office | 2026-11-14 | Eventos de clima espacial em quase tempo real (erupções, partículas solares, tempestades), com API aberta | Informação experimental de pesquisa; não informa dose recebida pelo astronauta; previsão oficial é da NOAA | A preencher |
| [[Monitoramento de radiação e saúde dos astronautas (CSA)\|Monitoring radiation for astronaut health]] | https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp | Agência Espacial Canadense (CSA) | 2026-11-14 | Radiação de nêutrons responde por cerca de 30% da radiação total na ISS; o CANS mede a exposição de forma contínua e autônoma | Notícia institucional, sem dados nem limiares; "30%" sem fonte primária | A preencher |
| [[DONKI - documentação da API\|DONKI-API v2.0 (documentação e OpenAPI)]] | https://ccmc.gsfc.nasa.gov/DONKI/api/ | NASA CCMC | 2026-11-14 | Endpoints, parâmetros, limite de 60 dias e formato JSON das respostas | Documenta o formato, não a qualidade dos dados; sem chave declarada | A preencher |
| [[Guia de submissão do projeto\|Project Submission Guide]] | https://www.spaceappschallenge.org/resources/project-submission-guide/ | NASA Space Apps Challenge | 2026-11-14 | Prazos, campos do formulário, regras do demo (30 s ou 7 slides), uso de IA e requisitos de envio | Regras de organização do evento, não de conteúdo clínico | A preencher |

## Arquitetura de dados e autonomia médica — NTRS

Veja [[NTRS - arquitetura de dados e autonomia médica]] para aplicações propostas no código, estado atual e próximos passos. Consulta dos registros e resumos públicos: 2026-11-14; leitura integral e revisão técnica pela equipe pendentes.

| Título / registro | URL | Instituição | Afirmação apoiada | Limitações | Revisão da equipe |
|---|---|---|---|---|---|
| ExMC Clinical Decision Support System Architecture Recommendation — 20220017869 | https://ntrs.nasa.gov/citations/20220017869 | NASA Ames / ExMC | MDA como base para arquitetura integrada de suporte à decisão médica | Não fornece limiares clínicos do Health7; metadados propostos são adaptação do projeto | Pendente |
| EIMO Concept of Operations — 20250000009 | https://ntrs.nasa.gov/citations/20250000009 | NASA / ExMC | Autonomia progressiva com atrasos de comunicação e recursos limitados | Conceito de operações; não fornece implementação de sincronização para o aplicativo | Pendente |
| Autonomous Medical Operations — 20180002541 | https://ntrs.nasa.gov/citations/20180002541 | NASA Ames | Pesquisa de apoio à decisão com interpretação computacional de ultrassom | Não disponibiliza neste registro um modelo pronto para avaliar os sinais vitais do Health7 | Pendente |
| Validation of the NASA Integrated Medical Model — 20180006877 | https://ntrs.nasa.gov/citations/20180006877 | NASA Glenn e colaboradores | Monte Carlo para desfechos médicos e recursos, com validação contra eventos observados | Depende do cenário e dos dados; não valida estados ou probabilidades individuais do protótipo | Pendente |

## Indicadores candidatos do enunciado
Pressão arterial, frequência cardíaca, glicemia, temperatura corporal, horas de sono e humor. São candidatos para pesquisa, não uma seleção final nem recomendações clínicas.

Para cada indicador, registrar unidade, instrumento, viabilidade em voo, contexto, limitações e evidência para orientações. Não preencher valores de alerta por suposição.

