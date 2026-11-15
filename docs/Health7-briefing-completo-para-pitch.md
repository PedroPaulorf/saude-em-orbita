# Health7 — briefing completo para criação de elevator pitch

**Data de referência:** 15 de novembro de 2026.  
**Projeto:** Health7 / Saúde em Órbita.  
**Evento:** NASA Space Apps Challenge 2026.  
**Desafio escolhido:** Create Health Monitoring Software for Astronauts on Space Missions.  
**Página oficial:** https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/  
**Repositório:** https://github.com/PedroPaulorf/saude-em-orbita  
**Versão examinada:** branch `main`, commit `46c7cad`, após atualização por `git pull --ff-only`, sem conflitos.

## 1. Para que serve este documento

Este documento fornece contexto factual a outra IA para que ela ajude a redigir um elevator pitch do Health7. Ele explica o problema, o recorte escolhido pela equipe, o funcionamento implementado, a função da inteligência artificial, as fontes de dados, os diferenciais demonstráveis e os limites do protótipo.

Não é uma especificação de um produto futuro nem uma afirmação de eficácia médica. Ao escrever o pitch, preservar a diferença entre funcionalidade implementada, teste com dados fictícios, benefício esperado e possibilidade futura.

A equipe já definiu a solução. O trabalho solicitado à IA é de síntese, clareza e apresentação dessa solução, sem inventar funcionalidades, resultados ou compromissos.

## 2. Resumo executivo

O Health7 é um protótipo de acompanhamento preventivo da saúde de astronautas. Ele reúne check-ups físicos, relatos de sintomas, respostas comportamentais e testes cognitivos. Compara os registros com referências pessoais e observa como as mudanças se comportam ao longo do tempo.

O resultado é apresentado como um estado de acompanhamento, com os sinais que explicam esse estado e um roteiro de ações de rotina. Quando a regra identifica sinais que exigem avaliação médica, a interface prioriza o protocolo de encaminhamento ao responsável médico da missão.

A inteligência artificial é uma camada de comunicação e elaboração do roteiro. A classificação principal vem de regras explícitas implementadas no software. O sistema mantém um roteiro local quando o serviço de IA está indisponível.

**Síntese do valor proposto:** ajudar o astronauta a entender o que mudou em relação ao seu próprio padrão e o que acompanhar em seguida, com informações organizadas para apoiar a revisão médica.

**Estágio real:** protótipo funcional de software, demonstrado com dados fictícios; sem validação clínica, implantação em voo ou eficácia preventiva comprovada.

## 3. O desafio oficial e a relação com o projeto

### 3.1 Resumo do desafio

A página oficial descreve riscos associados a missões prolongadas, como radiação espacial, isolamento, confinamento, gravidade alterada e ambiente fechado hostil. O objetivo central é criar software que reúna indicadores e permita ao astronauta avaliar sua saúde e agir sobre seu estado. O Health7 responde a essa necessidade com acompanhamento pessoal e orientação de rotina.

Fonte: [desafio oficial do Space Apps 2026](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/).

**Limite da consulta:** o título e o resumo foram recuperados no resultado indexado da página oficial em 15/11/2026. A abertura direta da página retornou erro 502. Portanto, este briefing não apresenta uma transcrição integral nem presume ter confirmado todos os requisitos ou regras de submissão da página. As perguntas detalhadas abaixo também constam das notas locais de pesquisa da equipe; não são apresentadas como citação literal recém-verificada do site.

### 3.2 Correspondência entre a necessidade e a implementação

| Necessidade | Resposta do Health7 | Limite atual |
|---|---|---|
| Reunir indicadores | Check-up físico, sintomas, comportamento, testes cognitivos e contexto ambiental | Não há coleta automática validada de sensores físicos |
| Permitir avaliação pelo astronauta | Comparação pessoal, histórico, estados de acompanhamento e explicações dos sinais | Avaliação por regras de demonstração; não diagnóstico |
| Permitir agir | Roteiro para hoje, próximos dias e semana; acompanhamento de planos | Ações de rotina do protótipo, sem eficácia clínica demonstrada |
| Identificar quando pedir apoio | Estado de escalonamento e protocolo fixo para revisão médica | Não há comprovação de entrega automática a uma equipe médica externa |
| Tornar informações compreensíveis | Mapa corporal, gráficos, estados visuais, relatório e assistente | Interface de demonstração, sem estudo formal de usabilidade com astronautas |

Perguntas úteis para orientar a narrativa: quais indicadores são reunidos; como se obtêm os dados; por que uma mudança merece atenção; o que o astronauta pode fazer a partir da informação; e quando deve procurar apoio médico.

## 4. O problema que a equipe pretende enfrentar

O problema de produto é a dificuldade de transformar registros dispersos em uma visão compreensível da própria saúde durante uma missão. Um número isolado mostra uma medição; uma sequência contextualizada permite perceber que algo está diferente do padrão pessoal.

O Health7 organiza três perguntas para o astronauta:

1. **O que mudou em relação ao meu padrão?**
2. **Quais registros explicam essa mudança?**
3. **Qual é o próximo passo de acompanhamento e quando devo pedir apoio?**

O software foi pensado para apoiar autonomia de acompanhamento em missões. Isso não significa independência da medicina nem autorização para conduzir tratamento sem supervisão.

Para o pitch curto, não é necessário listar doenças ou todos os perigos espaciais. O centro da história pode ser a necessidade de perceber mudanças, entendê-las e agir de forma organizada.

## 5. Para quem o Health7 foi feito

- **Usuário principal:** astronauta que realiza a rotina de acompanhamento da própria saúde.
- **Profissional a apoiar:** responsável médico da tripulação e equipe médica de suporte, por meio de registros e relatório mais claros.
- **Contexto de demonstração:** contas individuais com perfis fictícios de astronautas.

Não existe, nesta versão, um painel médico completo com acesso autorizado a toda a tripulação. Cada conta acessa seus próprios dados. O relatório prepara informações para revisão; não comprova uma operação de telemedicina em funcionamento.

## 6. Como o projeto reúne as informações

### 6.1 Perfil pessoal

O perfil contempla dados da pessoa, como nome, idade, sexo, altura e peso, além de informações da missão e referências pessoais disponíveis no perfil de sessão.

A versão atual acrescentou uma tela de edição do perfil. Esses campos não equivalem a prontuário clínico completo. O modelo visual do corpo também não determina, por si só, limiares clínicos.

### 6.2 Check-up físico

O astronauta preenche medidas e relatos pela interface. O fluxo possui seis etapas de medidas e uma etapa de eliminação, agrupadas na proposta dos sete parâmetros do check-up:

| Dado | O que é registrado | Observação importante |
|---|---|---|
| Pressão arterial | Sistólica e diastólica, quando informadas | A regra de demonstração de pressão compara a sistólica |
| Frequência cardíaca | Valor em bpm | Não há sensor lendo automaticamente pelo navegador |
| Saturação de oxigênio | SpO₂ em porcentagem | Informação registrada pelo usuário ou por fonte suportada |
| Temperatura | Temperatura corporal em °C | Temperatura da pele importada é uma métrica distinta |
| Frequência respiratória | Respirações por minuto | Não há medição automática demonstrada |
| Sono | Duração em horas | Autorregistro não equivale a classificação clínica do sono |
| Urina e fezes | Opções de autorrelato e observações | Não são exames laboratoriais |

As etapas podem ser puladas; o salvamento exige ao menos um dado. O backend também aceita alguns dados adicionais, como contagens de micções e evacuações nos registros fictícios importados.

A interface apresenta uma proposta de check-up rápido. Não foi confirmado um estudo cronometrado que prove duração universal de dois minutos. Caso esse tempo apareça no pitch, tratá-lo como intenção de experiência, não resultado medido.

O aplicativo organiza as medidas; instrumentos apropriados continuam necessários para obter sinais como pressão e saturação. Dizer que a demonstração pode ser usada sem integrar um relógio não significa que o navegador mede sinais vitais sozinho.

### 6.3 Sintomas e mapa corporal

O usuário pode registrar região do corpo, descrição, intensidade, início e evolução de um sintoma. A resolução é um evento explícito no histórico.

O mapa corporal facilita navegar pelas regiões e contextualizar os registros. Não constitui um exame de imagem, scanner corporal ou diagnóstico visual.

Os eventos de evolução preservam a sequência do relato. Não relatar novamente um episódio não deve ser apresentado como prova de resolução clínica.

### 6.4 Acompanhamento comportamental

O check-in inclui respostas sobre humor, estresse e descanso em escalas de autorrelato. Essas respostas ajudam a contextualizar a rotina e podem orientar sugestões de recuperação e acompanhamento.

Elas não são um diagnóstico psicológico e não devem ser anunciadas como um índice validado de saúde mental. O projeto evita resumir todas as respostas comportamentais em uma nota única de saúde mental.

### 6.5 Testes cognitivos

Há três atividades no navegador:

| Teste | O que o software registra | Participação no monitoramento |
|---|---|---|
| Reflexo | Tempos de reação, mediana e antecipações | Pode contribuir como sinal ao comparar com o histórico pessoal |
| Memória | Rodadas, acertos e amplitude da sequência | Resultado registrado; não participa da classificação principal examinada |
| Atenção / Stroop | Acertos, total e tempo médio | Pode contribuir como sinal de mudança |

A comparação pessoal depende de histórico suficiente; as referências começam a ser construídas a partir de três sessões anteriores. No motor atual, reflexo pelo menos 15% mais lento ou dois acertos a menos no Stroop podem gerar sinal de atenção. Esses valores são escolhas de demonstração, não pontos de corte clínicos validados.

Latência do dispositivo, navegador e prática podem alterar os resultados. Não afirmar que a bateria é equivalente ao teste oficial da NASA ou que detecta comprometimento cognitivo clínico.

Os resultados cognitivos ficam no navegador, separados por conta, com retenção das últimas 60 sessões. Não são sincronizados integralmente para o banco como os check-ups.

### 6.6 Água e execução da rotina

Há registro de água, planos e ações concluídas. Esses dados apoiam a organização da rotina. A gamificação reconhece atividades realizadas; não comprova adesão maior nem melhora clínica.

### 6.7 Ambiente e clima espacial

O backend suporta registros ambientais. A base fictícia NEXUS-Med inclui contexto de cabine, como CO₂, temperatura, umidade e radiação em mGy.

Separadamente, a interface consulta eventos de clima espacial no catálogo NASA DONKI e possui uma cópia de dados para consulta quando a fonte ao vivo não está disponível. É necessário distinguir fonte ao vivo, cópia e dado fictício.

**Diferenças fundamentais:** evento solar não é dose recebida pelo astronauta; radiação de um cenário não é medição real de bordo; mGy não deve ser convertido automaticamente em mSv.

O ambiente contextualiza a leitura do acompanhamento. No motor examinado, sua carga é apresentada separadamente e não entra no score principal de intensidade da mudança.

### 6.8 Importação de vestíveis

Existe uma tela de integrações com importação manual:

- Apple Saúde: XML exportado e extraído pelo usuário, além do contrato JSON/CSV Health7.
- Samsung, Garmin e ActLumus: JSON/CSV no formato normalizado Health7, não leitura universal de todos os formatos proprietários.
- Apple XML: processamento local em blocos, fora da tela principal, com limite de 200 MiB e até um milhão de medidas suportadas.
- Após confirmação, envio por lotes com progresso, pausa, retomada e deduplicação no servidor.
- Métricas suportadas incluem frequência cardíaca, frequência de repouso, saturação, respiração, massa corporal, intervalos de sono, temperatura da pele, passos, distância, velocidade e energia, conforme a origem e o contrato.
- Os canais de luz do ActLumus são tratados como métricas próprias, sem equivalência presumida entre luz fotópica e melanópica.

**Limite essencial para o pitch:** os dados de vestíveis permanecem separados dos check-ups e não alimentam automaticamente os alertas ou avaliações atuais. Importar arquivos não é sincronizar continuamente um relógio.

O código de um aplicativo auxiliar iOS com HealthKit foi preparado, mas o aplicativo não foi compilado, instalado ou testado em iPhone físico. O foco da equipe passou à importação manual. Não apresentar o botão Connect iPhone como comprovação de integração automática concluída.

## 7. Como o sistema transforma registros em acompanhamento

### 7.1 Referências pessoais

Há duas referências importantes:

1. **Pré-voo:** valores pessoais cadastrados no perfil.
2. **Em voo:** mediana de medidas recentes, em uma janela dos últimos 14 dias anteriores ao dia analisado, com pelo menos três dias de dados.

A intenção é distinguir adaptação gradual da missão de uma mudança recente. É estatística implementada no software; não treinamento de um modelo de aprendizado de máquina.

Existe uma diferença técnica que não precisa entrar no pitch, mas evita simplificação excessiva: os cartões de comparação usam a mediana recente, enquanto o motor temporal aplica proteção adicional para não absorver rapidamente mudanças simultâneas com outras medidas ou sintomas. As avaliações por medida preservadas no backend também têm suas próprias referências e versões. Não são todas uma única análise idêntica.

### 7.2 O que entra no motor principal

O motor de monitoramento recebe perfil, check-ups, sintomas, resultados cognitivos e registros ambientais. As medidas físicas examinadas incluem frequência cardíaca, pressão sistólica, sono, temperatura, saturação, frequência respiratória, massa corporal e micções em 24 horas, quando disponíveis.

Ele observa diferenças em relação à referência pessoal, quantidade de medidas alteradas, persistência e determinados sintomas de alerta. Não considera qualquer dado importado automaticamente só porque ele está armazenado no banco.

### 7.3 Estados de acompanhamento

| Estado interno | Explicação em português | Funcionamento simplificado |
|---|---|---|
| `STABLE` | Estável | Sem mudança identificada pela regra nas informações consideradas |
| `WATCH` | Atenção | Mudança de medida ou sintoma que merece acompanhamento |
| `PERSISTENT CHANGE` | Mudança persistente | Alterações combinadas por pelo menos dois dias, fora da janela inicial de adaptação |
| `ESCALATE` | Buscar avaliação médica | Sinal de alerta que aciona o protocolo de revisão |

Uma combinação persistente pode ser duas medidas alteradas ou uma medida alterada acompanhada de sintoma. Nos três primeiros dias de missão, a regra limita mudanças esperadas ao estado de atenção, salvo sinais de alerta.

O score de 0 a 100 representa intensidade de mudança segundo a fórmula demonstrativa. **Não é porcentagem de risco, probabilidade de doença, chance de sobrevivência ou nota clínica de saúde.** O estado não é simplesmente decidido por um corte nesse score.

### 7.4 Dados ausentes

Ausência de registro não comprova normalidade. A interface atual avisa quando não há check-up do dia. Não dizer que o sistema monitora continuamente alguém que não fez registros.

O histórico carregado pode ser limitado e sinaliza truncamento; não presumir acesso ilimitado a toda a missão.

### 7.5 Padrões demonstrativos

Há cartões que combinam sinais e apresentam padrões de preocupação para revisão. Eles usam textos de cautela e mostram os sinais presentes. Um padrão não equivale à confirmação da condição associada e não muda sozinho o estado do motor principal.

No pitch curto, a expressão mais fiel é “identifica mudanças e sinais que merecem atenção”. Evitar “detecta doenças”.

## 8. O papel exato da inteligência artificial

### 8.1 Divisão de responsabilidades

| Camada | Responsabilidade |
|---|---|
| Regras locais | Calcular o estado e os sinais de mudança |
| Roteiro local | Montar ações de rotina mesmo sem resposta da IA |
| IA via n8n | Receber contexto selecionado e elaborar texto e roteiro |
| Assistente de conversa | Ajudar na interação e no acompanhamento da rotina |
| Profissional médico | Interpretar clinicamente e decidir condutas |

O roteiro enviado à IA inclui medidas, referências pessoais, contexto comportamental, sinais do motor, padrões, registro de água e informações selecionadas de clima espacial. Isso não significa acesso irrestrito da IA ao PostgreSQL.

As instruções pedem linguagem simples, explicação vinculada aos números, ações de rotina e ausência de diagnóstico, medicamentos ou doses. Pedem também que o modelo preserve o estado calculado pelas regras. Essas instruções e a validação do formato da resposta não garantem que todo texto gerado esteja correto; os resultados precisam de revisão apropriada.

### 8.2 Conexão e falhas

Os links do n8n para assistente, roteiro e alertas foram configurados anteriormente. O assistente respondeu a um teste de conexão registrado no histórico da conversa.

Se houver falha, o produto apresenta aviso, permite nova tentativa e mantém o roteiro local. Isso sustenta a frase “a IA ajuda a explicar, e o acompanhamento básico não depende da resposta dela”. Não sustenta “a IA roda toda localmente”.

Nesta exportação não foi refeito um teste de disponibilidade dos serviços n8n, nem inspecionada a configuração remota atual dos fluxos ou do modelo. Não atribuir um provedor específico ou uma versão de modelo sem confirmar.

### 8.3 Frases que descrevem corretamente a IA

- “As regras acompanham as mudanças; a IA ajuda a explicar os sinais e organizar o roteiro.”
- “A IA recebe o contexto do acompanhamento para traduzir informações em orientações de rotina.”
- “O sistema preserva um roteiro local quando a IA está indisponível.”

Evitar “a IA diagnostica”, “prevê doenças”, “analisa continuamente todos os sensores” ou “decide quando o astronauta pode trabalhar”.

## 9. Como o acompanhamento vira plano de ação

A tela Prevention foi simplificada na versão atual para responder a três perguntas: como estou, o que faço hoje e por quê.

Ela mostra o estado, os sinais principais e até três passos do dia, ou um plano já em andamento. Próximos dias, semana, padrões e detalhes ficam em uma área recolhida.

O roteiro pode incluir repetir uma medida em repouso, completar o relato de sintomas, acompanhar o sono, registrar água, manter a rotina prevista ou conversar com o responsável pela missão sobre a carga de atividades. São exemplos do conteúdo demonstrativo do software, não recomendações clínicas deste briefing.

Os planos permitem acompanhar execução e registrar encerramento. Quando o aplicativo indica retorno à referência, isso significa resultado segundo os dados e regras do protótipo; não prova cura nem que o plano causou a melhora.

Em `ESCALATE`, a interface pausa sugestões rotineiras e prioriza um texto fixo para procurar o Crew Medical Officer ou suporte médico conforme o protocolo da missão. Esse protocolo não é redigido livremente pela IA.

## 10. Alertas, relatório e equipe médica

O relatório reúne registros, diferenças, procedência e explicações úteis para revisão. O backend preserva avaliações por medida, com valor, unidade, horário, referência usada e versão da regra, quando disponíveis.

O fluxo de alerta pode registrar a ocorrência no n8n e receber confirmação. Sua modalidade atual é `crew-only`: fica com a tripulação, sem envio externo automático comprovado. Sem rede ou endpoint, o horário fica registrado no aparelho.

**Distinguir três acontecimentos:**

1. Check-up salvo no navegador ou sincronizado com o backend.
2. Alerta registrado no fluxo n8n.
3. Relatório recebido e revisado por um profissional médico externo.

Os dois primeiros não comprovam o terceiro. Não prometer que “a Terra é avisada automaticamente” ou que um médico já acompanha os perfis em tempo real.

## 11. Arquitetura e persistência

### 11.1 Componentes

- **Frontend:** React e TypeScript, com Vite e componentes de interface.
- **Backend:** Node.js, TypeScript e Fastify.
- **Banco:** PostgreSQL, com configuração local do projeto voltada ao PostgreSQL 18.
- **Serviço de IA e automações:** integrações HTTP opcionais, incluindo os fluxos n8n.

Fluxo simplificado:

```text
Astronauta
  -> interface no navegador
     -> preenchimento de medidas, sintomas e testes
     -> comparação e roteiro local
     -> API autenticada
        -> PostgreSQL: histórico por conta
     -> serviço n8n, quando configurado e disponível
        -> conversa / elaboração do roteiro / registro do alerta
```

### 11.2 Onde cada dado fica

| Local | Dados principais |
|---|---|
| PostgreSQL | Perfil e dados pessoais, check-ups, sintomas e eventos, ambiente, avaliações, importações de vestíveis e demais registros de servidor |
| Navegador, separado por conta | Resultados cognitivos, água, planos, conversa e cache/pendências de check-ups |
| Serviço externo configurado | Contexto enviado nas chamadas e processamento conforme o fluxo e a configuração daquele serviço |

O navegador não acessa diretamente o PostgreSQL. A API autentica e restringe as consultas ao usuário da sessão. Há hash de senhas e cookie de sessão HttpOnly, mas isso não equivale a conformidade regulatória ou auditoria completa de segurança.

### 11.3 O que funciona com conexão limitada

O motor e o roteiro local podem calcular a partir dos dados já disponíveis. Check-ups possuem armazenamento local e fila de reenvio, com identificadores estáveis para evitar duplicações.

Entretanto, o aplicativo atual depende de backend para autenticação e sincronização, não tem garantia de carregamento inicial sem conexão e não tem service worker que o torne uma aplicação totalmente offline. As importações de vestíveis não possuem a mesma fila offline dos check-ups.

Portanto, a expressão adequada é **“preserva registros e parte do acompanhamento diante de falhas de conexão”**. Evitar “funciona integralmente sem internet ou servidor” e não confundir a rede local entre aparelho e backend com um enlace real de comunicação espacial.

## 12. Fontes NASA e seu papel

| Fonte ou recurso | Uso no Health7 | O que não comprova |
|---|---|---|
| NASA Human Research Program / riscos | Contextualização educativa de riscos e regiões do corpo | Validação clínica das regras do aplicativo |
| NASA DONKI | Eventos de clima espacial | Dose individual, diagnóstico ou previsão clínica |
| NASA NTRS | Referências de arquitetura, autonomia e suporte à decisão | Certificação ou parceria com NASA |
| NASA AROW | Link para recurso oficial de acompanhamento de missão | Ingestão própria de telemetria em tempo real |

As páginas e referências são fontes de contexto e pesquisa. As regras do protótipo são identificadas como regras de demonstração e não herdam validação só por apontarem para documentos da NASA.

Links para consulta da outra IA, sem afirmar que todos foram reabertos nesta exportação:

- Desafio: https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/
- Riscos HRP: https://www.nasa.gov/hrp/risks/
- Perigos de voo espacial: https://www.nasa.gov/hrp/hazards/
- DONKI: https://ccmc.gsfc.nasa.gov/tools/DONKI/
- API DONKI: https://ccmc.gsfc.nasa.gov/DONKI/api/
- Referência NTRS de suporte à decisão: https://ntrs.nasa.gov/citations/20220017869
- Referência NTRS EIMO: https://ntrs.nasa.gov/citations/20250000009
- Referência NTRS AMO: https://ntrs.nasa.gov/citations/20180002541

O Health7 foi desenvolvido para participar de um desafio do Space Apps. Não foi apresentado como aprovado, certificado, utilizado ou endossado pela NASA.

## 13. Dados fictícios e evidências de desenvolvimento

### 13.1 Base NEXUS-Med

O projeto usa seis astronautas fictícios, NX-01 a NX-06, com cenários de 30 dias. A importação permite apresentar situações de adaptação, estabilidade, mudança persistente e sinais de alerta.

O histórico de trabalho desta conversa registra uma carga de **109 check-ups, 109 registros ambientais e 8 episódios de sintomas**. Esses números descrevem a importação feita naquele momento, não uma contagem atual consultada nesta exportação. O conjunto de cenários tem 180 dias possíveis no total, mas a importação da demonstração considera os dias até a data de cada perfil; por isso os números não precisam coincidir.

São dados sintéticos para demonstrar e testar o comportamento do sistema. Não são dados reais de astronautas da NASA, amostra clínica ou evidência de prevenção de doenças.

### 13.2 Testes já relatados

Antes da atualização mais recente, o histórico registra 96 testes do frontend aprovados e compilações de frontend e backend aprovadas no commit `ec5384b`.

O fluxo de importação foi anteriormente validado com 1.501 medidas fictícias, interrupção e retomada, reimportação sem duplicação e XML fictício de aproximadamente 200 MB. A importação completa do arquivo pessoal do usuário ainda não foi confirmada.

O código contém testes do motor com os cenários NEXUS-Med. Esses testes verificam comportamento de software, não sensibilidade, especificidade, acurácia clínica ou desempenho em missão.

**Nesta exportação:** foi usada a inspeção do código e da documentação atualizados no commit `46c7cad`; não foi executada novamente a suíte completa, nem consultado o banco para recontar registros, nem revalidada a disponibilidade da aplicação e da IA. Não transferir os resultados antigos automaticamente para a versão nova.

## 14. O que entrou na atualização atual

O `git pull` anterior a este documento avançou a `main` de `ec5384b` para `46c7cad`, sem conflitos. Entre os arquivos atualizados estão:

- Página de apresentação com conteúdo em português e inglês.
- Tela de perfil pessoal e edição de dados.
- Navegação e estrutura da interface.
- Tela de prevenção com estado, passos de hoje e detalhes recolhidos.

Existem outras branches no remoto. A simples existência delas não comprova que suas funções estejam integradas à `main`. Este briefing descreve o código integrado examinado.

Algumas notas antigas do cofre e textos promocionais ainda descrevem um aplicativo “sem servidor” ou uma fila como se fosse entrega ao solo. Em caso de divergência, priorizar os limites descritos neste documento e o código atual. Não repetir alegações antigas como funcionalidades confirmadas.

## 15. Diferenciais que podem ser apresentados

Não foi feita nesta exportação uma pesquisa competitiva atual que prove exclusividade. Os pontos abaixo descrevem a proposta de valor, não uma alegação de ser o primeiro ou único sistema.

1. **Comparação com a própria pessoa.** O foco está em mudanças em relação ao padrão individual e ao histórico da missão.
2. **Integração de corpo, comportamento e cognição.** O acompanhamento reúne mais de uma dimensão, sem afirmar que todas entram da mesma maneira no score.
3. **Explicação ligada aos registros.** O usuário consegue entender quais dados e regras motivaram uma sinalização.
4. **Da informação à rotina.** A experiência não termina em um gráfico: apresenta ações de acompanhamento e permite marcar execução.
5. **Separação entre regra e linguagem da IA.** A classificação principal é explícita; a IA ajuda a apresentar o contexto.
6. **Continuidade parcial diante de falhas.** Roteiro local e pendências de check-ups ajudam a preservar o trabalho.
7. **Contexto espacial reconhecível.** Riscos HRP, eventos DONKI e rotina por dia da missão conectam a interface ao desafio.

Para 30 segundos, selecionar dois ou três desses pontos. Uma lista completa reduz a clareza e tira espaço do problema e do impacto.

## 16. Impacto pretendido e como descrevê-lo

### Benefícios que o projeto busca

- Mais autonomia para registrar e acompanhar mudanças.
- Melhor compreensão dos motivos de um sinal de atenção.
- Rotina de acompanhamento mais organizada.
- Informações mais claras para a revisão médica.
- Menor dependência de uma resposta imediata da IA para manter o roteiro básico.

Esses são objetivos e benefícios esperados. Ainda não foram demonstrados em estudo com astronautas ou usuários clínicos.

### Possível evolução

O conceito poderia ser estudado para ambientes remotos na Terra e futuras missões. Isso é possibilidade de aplicação, não implantação já realizada.

Antes de um uso operacional seriam necessários, entre outros trabalhos: revisão e validação clínica das regras, avaliação de usabilidade, integração validada com dispositivos, políticas de dados e segurança e fluxo efetivo de revisão médica. Não é necessário enumerar tudo no pitch, mas a outra IA precisa conhecer a distância entre demonstração e operação.

## 17. Quadro de afirmações permitidas e exageros a evitar

| Evitar | Formulação fiel |
|---|---|
| “Prevê doenças antes de acontecerem” | “Acompanha mudanças que merecem atenção” |
| “A IA diagnostica o astronauta” | “A IA ajuda a explicar os sinais e elaborar o roteiro” |
| “Score de risco de 80%” | “Índice demonstrativo de intensidade da mudança” |
| “Clinicamente validado” | “Testado como software com dados fictícios” |
| “Monitora tudo em tempo real” | “Atualiza o acompanhamento a partir dos registros disponíveis” |
| “Lê automaticamente Apple Watch, Garmin e Samsung” | “Permite importação manual de arquivos suportados” |
| “Qualquer arquivo de qualquer fabricante” | “XML Apple e arquivos no contrato Health7, conforme o suporte” |
| “A importação já altera os alertas” | “Os dados importados ficam separados das avaliações atuais” |
| “Mede a radiação recebida a partir do Sol” | “Mostra eventos de clima espacial como contexto” |
| “Envia automaticamente ao médico na Terra” | “Organiza informações e indica quando procurar revisão médica” |
| “Funciona integralmente offline” | “Preserva dados locais e parte do acompanhamento quando há falhas” |
| “Dispensa instrumentos para medir sinais vitais” | “Não exige integrar um relógio para demonstrar o fluxo” |
| “Evita doenças e salva vidas comprovadamente” | “Busca apoiar prevenção, autonomia e revisão oportuna” |
| “É um sistema da NASA” | “É um protótipo desenvolvido para o NASA Space Apps Challenge” |
| “É o primeiro ou único” | “Combina acompanhamento pessoal, explicações e roteiro de ações” |
| “Aprende com IA o estado normal” | “Constrói referências estatísticas a partir do histórico pessoal” |
| “O plano curou o astronauta fictício” | “Os registros posteriores voltaram à referência segundo a regra” |

## 18. História de uso para orientar o pitch

**Cenário ilustrativo; não é caso clínico real nem resultado observado em voo.**

Uma astronauta faz o check-up e relata que dormiu menos. Em registros seguintes, outras medidas e o desempenho de atenção também se afastam de seu padrão pessoal. O Health7 organiza o histórico, apresenta os sinais da mudança e oferece um roteiro de acompanhamento, como confirmar medidas e completar o relato de sintomas.

Se a regra identificar sinal de alerta, o aplicativo prioriza procurar o responsável médico da missão. A IA pode ajudar a explicar o contexto em linguagem simples; a decisão clínica permanece com o profissional.

Essa história ilustra a transformação: **registros dispersos → mudança compreensível → próximo passo → apoio à autonomia e à revisão médica**.

Não acrescentar uma doença específica ou um final em que o sistema impediu uma emergência, porque isso não foi demonstrado.

## 19. Estrutura solicitada para o elevator pitch

A orientação fornecida pela equipe é seguir **problema → solução → plano de ação → impacto**, em aproximadamente 30 segundos:

| Tempo aproximado | Função narrativa | Conteúdo prioritário |
|---|---|---|
| 0–8 s | Problema | Astronautas precisam perceber mudanças na própria saúde e saber quando agir |
| 8–18 s | Solução | Health7 reúne dados físicos e cognitivos, compara com o histórico pessoal e usa IA para apoiar a explicação |
| 18–25 s | Plano de ação | Mostra os sinais, organiza o acompanhamento e indica quando procurar avaliação médica |
| 25–30 s | Impacto | Mais autonomia e informações mais claras para apoiar a equipe médica |

“Plano de ação” aqui significa **o que o usuário faz com o sistema**, não um cronograma de desenvolvimento, estratégia comercial ou pedido de investimento.

A estrutura de tempo foi fornecida na conversa. Não foi verificada como regra oficial de submissão. O pitch deve ser cronometrado em voz alta; contagem de palavras sozinha não garante 30 segundos.

### Mensagens que merecem sobreviver ao corte

- É um software para acompanhamento da saúde de astronautas.
- Ele compara o astronauta com seu próprio histórico.
- Ele transforma sinais em ações de acompanhamento compreensíveis.
- Ele apoia autonomia e a revisão médica.

### Detalhes que podem ficar na apresentação longa

- Tecnologias do frontend e backend.
- Tamanho máximo do XML e divisão em lotes.
- Nome das tabelas, endpoints e fórmulas.
- Lista completa de medidas.
- Quantidade de testes e registros sintéticos.
- AROW, limites do HealthKit e detalhes da instalação.

Esses detalhes comprovam desenvolvimento, mas não precisam disputar espaço na fala de 30 segundos.

## 20. Pedido pronto para encaminhar à outra IA

Use este briefing como base factual para redigir um elevator pitch do Health7. A solução já foi definida pela equipe; ajude a comunicá-la com clareza, sem criar novas funcionalidades.

Entregue:

1. Uma versão principal em português brasileiro, natural para fala, de aproximadamente 30 segundos.
2. Uma versão equivalente em inglês, também curta e natural, sem tradução literal desnecessária.
3. A divisão da fala em problema, solução, plano de ação e impacto.
4. Uma proposta simples do que mostrar na tela em cada trecho, usando apenas funcionalidades existentes.
5. Uma conferência breve das afirmações, apontando qualquer frase que possa sugerir função futura ou eficácia não demonstrada.

Diretrizes:

- Diga o nome Health7 e torne claro que se trata de astronautas.
- Priorize a necessidade humana e o resultado esperado, sem começar pelas tecnologias.
- Destaque comparação pessoal e a passagem de registros para ações.
- Se citar IA, respeite que as regras determinam o estado e a IA ajuda a explicar e elaborar o roteiro.
- Use impacto como objetivo; não invente percentuais, benefícios clínicos ou economia.
- Não chame o sistema de médico autônomo, preditor de doenças ou produto certificado.
- Não apresente relógios conectados automaticamente, comunicação operacional com a Terra ou funcionamento integral offline.
- Evite uma lista de ressalvas na fala curta; escolha palavras precisas que não criem promessas falsas.
- Não invente nome da equipe, membros, pacientes, parcerias, prêmios, clientes ou investidores. Esses dados não foram fornecidos.
- Caso sugira uso de dados reais de saúde na apresentação, lembre que não há autorização neste documento para divulgar o arquivo pessoal de ninguém. Prefira os perfis fictícios.
- Faça uma estimativa de duração e recomende ensaio cronometrado.
- Se perceber conflito entre uma frase de marketing e os limites técnicos, preserve a informação factual deste briefing.

## 21. Fontes de implementação e rastreabilidade

Os caminhos abaixo são relativos à raiz do repositório no commit examinado. Servem para auditoria e aprofundamento; não precisam entrar no pitch.

| Arquivo ou pasta | O que sustenta |
|---|---|
| `README.md` | Visão geral e estrutura |
| `backend/README.md` | API, autenticação, persistência, contas fictícias e limites |
| `docs/medical-data.md` | Avaliações versionadas, procedência, fila e limitações offline |
| `docs/integrations.md` | Contratos de vestíveis, XML, lotes e separação das avaliações |
| `frontend/src/screens/HealthCheckUp.tsx` | Entrada manual do check-up |
| `frontend/src/screens/BehavioralCheckIn.tsx` | Testes e autorrelatos |
| `frontend/src/lib/cognitive.ts` | Resultados cognitivos e armazenamento local |
| `frontend/src/lib/baselines.ts` | Referências pré-voo e em voo |
| `frontend/src/lib/monitor.ts` | Motor temporal, estados e score |
| `frontend/src/lib/useMonitor.ts` | Entradas efetivas do motor |
| `frontend/src/lib/prevention.ts` | Avaliação de padrões demonstrativos |
| `frontend/src/data/conditions.json` | Padrões, textos de cautela e planos |
| `frontend/src/lib/roadmap.ts` | Roteiro local e chamada de IA |
| `frontend/src/lib/useRoadmapInput.ts` | Contexto que alimenta o roteiro |
| `frontend/src/lib/chat.ts` | Conversa e contexto selecionado |
| `frontend/src/lib/alert.ts` | Alerta local e registro `crew-only` |
| `frontend/src/lib/session.ts` e `storage.ts` | Sessão, cache e sincronização |
| `frontend/src/lib/donki/` | Consulta e representação de eventos espaciais |
| `frontend/src/screens/Prevention.tsx` | Tela atual de estado e ações |
| `frontend/src/screens/Profile.tsx` e `lib/person.ts` | Perfil pessoal |
| `frontend/src/screens/Landing.tsx` e `data/landing.ts` | Página de apresentação |
| `backend/src/medical.ts` | Regras e avaliações preservadas no servidor |
| `backend/src/import-nexus.ts` e `dados/README.md` | Importação e origem sintética dos cenários |
| `ios/README.md` | Aplicativo auxiliar ainda sem validação física |

**Nota de confiabilidade:** o código e a documentação descrevem capacidade implementada; o histórico da conversa informa testes e cargas anteriores; o resumo indexado do site oficial informa o objetivo geral do desafio. Benefícios pretendidos e sugestões narrativas foram identificados como tais. Nada neste documento comprova eficácia clínica, certificação ou uso operacional no espaço.
