# NTRS - arquitetura de dados e autonomia médica

Consulta: **2026-11-14**. Fontes: registros e resumos públicos do NASA Technical Reports Server (NTRS). Esta nota não representa uma revisão integral dos PDFs e apresentações. Revisão técnica pela equipe: pendente.

Esta pesquisa fundamenta a evolução do Health7. **Registrar uma referência não significa implementar a tecnologia descrita nem validar as regras clínicas do protótipo.** As aplicações abaixo são adaptações para o projeto, não requisitos prescritos por esses trabalhos. A implementação inicial está descrita em `docs/medical-data.md` e disponível na tela `#/data`.

## Referências e aplicações

| Referência no NTRS | O que oferece | Aplicação proposta no Health7 |
|---|---|---|
| [Medical Data Architecture / arquitetura de suporte à decisão — 20220017869](https://ntrs.nasa.gov/citations/20220017869) | Arquitetura integrada de dados como base para suporte à decisão médica em missões de longa duração. | Registrar unidade, origem, qualidade do dado e versão da regra aplicada. |
| [EIMO — Concept of Operations — 20250000009](https://ntrs.nasa.gov/citations/20250000009) | Autonomia progressiva da tripulação diante de atrasos de comunicação, recursos limitados e restrições de evacuação. | Evoluir o armazenamento local para uma fila persistente de sincronização e manter histórico e referências disponíveis sem conexão. |
| [Autonomous Medical Operations — 20180002541](https://ntrs.nasa.gov/citations/20180002541) | Pesquisa de apoio médico computacional, incluindo interpretação de ultrassom. | Inspirar explicações com evidências e indicação de limitações no relatório. |
| [Validação do Integrated Medical Model — 20180006877](https://ntrs.nasa.gov/citations/20180006877) | Simulação Monte Carlo de eventos médicos e uso de recursos, com comparação entre previsões e eventos observados. | Estudar um simulador separado de cenários de missão, com hipóteses e incertezas explícitas. |

### Medical Data Architecture (MDA) e suporte à decisão

**Título:** Exploration Medical Capability Clinical Decision Support System Architecture Recommendation. Publicação: 2023. Documento HRP-48032 Rev. B, registro NTRS **20220017869**.

O resumo descreve a MDA como uma plataforma já desenvolvida e demonstrada sobre a qual pode ser construído suporte à decisão clínica. A recomendação trata de uma arquitetura integrada para missões com maior autonomia médica. [Fonte](https://ntrs.nasa.gov/citations/20220017869).

**Proposta para o projeto:** ampliar a rastreabilidade de cada observação e avaliação. Unidade e origem já aparecem na configuração das medidas; falta persistir metadados por observação, definir qualidade e vincular a avaliação a uma versão da regra e da linha de base. Separar a origem do dado da evidência que justifica uma regra.

**Limite:** a arquitetura não fornece, por si só, limiares de alerta para os sinais vitais do Health7. Os campos propostos são uma adaptação para o projeto, não um esquema extraído do documento.

### Earth-Independent Medical Operations (EIMO)

**Título:** Earth-Independent Medical Operations (EIMO) Concept of Operations. Apresentação de 2025, registro NTRS **20250000009**.

O resumo propõe uma transferência gradual de cuidados e decisões para sistemas e tripulação a bordo, integrada ao planejamento de missão e à arquitetura de dados. Considera atrasos e interrupções de comunicação, sensores, bases de referência e apoio ao Crew Medical Officer. [Fonte](https://ntrs.nasa.gov/citations/20250000009).

**Aplicação no projeto:** a fila autenticada da aplicação salva cada registro antes de transmitir e mantém seu identificador para reenvio. A integração preserva o cache separado por conta e acrescenta referências e avaliações ao histórico. Isso não garante que toda a aplicação carregue sem rede; restaurar a sessão ainda exige verificar a API.

**Limite:** autonomia de software e funcionamento sem conexão não demonstram capacidade de atendimento médico autônomo. Confirmação da API local também não equivale a envio à Terra ou revisão médica.

### Autonomous Medical Operations (AMO)

**Título:** Space Technology - Game Changing Development NASA Facts: Autonomous Medical Operations. Publicação: 2018. Registro NTRS **20180002541**.

O resumo descreve pesquisa de interpretação de imagens de ultrassom com algoritmos de IA e avaliação clínica como base de um sistema de apoio à decisão para tripulações em missões remotas. [Fonte](https://ntrs.nasa.gov/citations/20180002541).

**Proposta para o projeto:** associar cada sinalização aos dados usados, à regra executada, à referência pertinente e às limitações conhecidas. Essa rastreabilidade pode começar com regras determinísticas no relatório e nas notas de saúde.

**Limite:** o registro não fornece um modelo pronto para avaliar os sinais vitais do Health7, e não valida o chat, os padrões de prevenção ou recomendações geradas pelo protótipo.

### Integrated Medical Model (IMM)

**Título:** Validation of the NASA Integrated Medical Model: a Space Flight Medical Risk Prediction Tool. Publicação: 2018. Registro NTRS **20180006877**.

O trabalho descreve Monte Carlo com dados médicos espaciais e terrestres para estimar desfechos e utilização de recursos. A validação compara previsões com eventos observados em missões STS e ISS e relata discrepâncias dependentes do cenário de missão. [Fonte](https://ntrs.nasa.gov/citations/20180006877).

**Proposta para o projeto:** estudar, em módulo separado, simulação de cenários com perfil de missão, taxas de ocorrência documentadas, recursos disponíveis e distribuições de incerteza. Registrar hipóteses, versão dos parâmetros e semente aleatória para reproduzir resultados; comparar previsões com dados de referência antes de atribuir validade ao modelo.

**Limite:** os estados `baseline`, `attention` e `flagged` não são probabilidades do IMM. Um simulador inspirado na metodologia não é o IMM da NASA. Este registro não entrega a base completa de parâmetros nem permite inferir risco individual a partir dos desvios atuais do painel.

## Relação com o código atual

Os caminhos abaixo são relativos à raiz do repositório.

| Ponto do projeto | O que existe | Evolução proposta |
|---|---|---|
| `frontend/src/types.ts` e `frontend/src/lib/health.ts` | Medidas com unidade, origem e entrada manual ou de aparelho; comparação com linha de base. | Metadados por observação, qualidade explícita e versão da regra e da linha de base. |
| `frontend/src/lib/storage.ts` e `frontend/src/lib/session.ts` | Check-ups, fila e cache separados por conta; login e reenvio com identificador estável. | Preservar procedência e avaliações nos registros e tratar reenvios e falhas sem misturar contas. |
| `backend/src/contracts.ts`, `backend/src/medical.ts` e `backend/migrations/003_medical_traceability.sql` | API autenticada e PostgreSQL com Pessoa, Saúde e Ambiente. | Migração adicional de referências, regras e snapshots pessoais; payloads antigos continuam aceitos. |
| `frontend/src/lib/notes.ts`, `frontend/src/lib/prevention.ts` e `frontend/src/components/app/Report.tsx` | Notas, padrões e relatório com regras de demonstração. | Expor evidência, versão e limites de cada avaliação; preservar a distinção entre referência de arquitetura e fonte clínica. |
| `backend/src/simulation.ts` e tela `#/data` | Simulação educativa de cenários hipotéticos, com semente reproduzível e resultados privados da conta. | Selecionar dados e validar antes de atribuir interpretação médica; não é o IMM da NASA. |

## Próximos passos propostos

Estado da implementação inicial (2026-11-14). Os itens concluídos são recursos do protótipo, sem validação clínica:

- [x] Definir o contrato de metadados das observações e uma migração que preserve os registros existentes.
- [x] Definir procedência e versão das regras sem usar fontes de arquitetura como justificativa de limiares clínicos.
- [x] Integrar front e API com fila persistente, reenvio idempotente e apresentação explícita de conflitos.
- [x] Manter histórico local, tratar falha de gravação e incluir resumos das referências no pacote do aplicativo.
- [x] Preservar no banco e exibir na tela de dados a regra aplicada, os valores e a indicação de ausência de evidência clínica.
- [ ] Ler os documentos completos antes de transformar as propostas em requisitos técnicos detalhados.
- [x] Implementar um simulador educativo separado, com taxas hipotéticas, semente reproduzível e resultados persistidos.
- [ ] Selecionar dados de incidência e validar um modelo de missão antes de atribuir validade médica aos cenários.

## Uso na apresentação

Formulação sugerida: “O Health7 usa referências públicas da NASA sobre arquitetura de dados médicos e autonomia para orientar sua evolução. O protótipo demonstra acompanhamento da linha de base com dados simulados, regras explicáveis e sincronização opcional de check-ups. Um simulador separado permite explorar cenários hipotéticos de eventos e recursos de missão.”

As referências não sustentam afirmar que o Health7 é validado ou certificado pela NASA, implementa o IMM ou calcula probabilidades clínicas individuais. Os limites em `simulated.json` e os padrões em `conditions.json` continuam sendo de demonstração até revisão específica com evidências adequadas.

## Ligações

- [[Recursos oficiais]] — registro das fontes e limitações.
- [[Plano do assistente - monitoramento e plano de ação]] — motor de regras e estados de alerta.
- [[Plano do front-end v3 - medicina preventiva]] — funcionalidades atuais e evolução do protótipo.
