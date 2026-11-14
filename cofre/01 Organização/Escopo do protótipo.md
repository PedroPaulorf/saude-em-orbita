---
tipo: escopo
fonte: "[[Transcrição da reunião]] (brainstorming de cerca de 16 min)"
criada: 2026-11-14
estado: proposta para a equipe validar
---
# Escopo do protótipo

Resumo da reunião de brainstorming, avaliação crítica das ideias e proposta de escopo para o protótipo. Usa como base [[Padrões de projetos vencedores do Space Apps]], [[Riscos NASA HRP]] e [[Desafio e escopo]].

> [!warning] Tempo disponível
> A submissão ao Space Apps fecha **domingo, 15/11, às 23h59 (horário local)**, segundo o guia oficial. Contando a partir de hoje (sábado, 14/11), resta **cerca de um dia e meio**. Todo o escopo abaixo foi recortado para caber nesse prazo.

> [!info] Sobre a transcrição
> A transcrição é automática e tem muitos erros ("radiação de nêutro", "densidade ósseia", "Risks of Humans Besplite"). Quando um trecho foi interpretado, a interpretação está marcada. As marcações de tempo, como [14:01], apontam para a [[Transcrição da reunião]].

## O que a reunião decidiu

### Lista final de funções [14:01 – 15:39]

A equipe fechou cinco itens no fim da reunião:

| #   | Função                                                 | Situação na reunião |
| --- | ------------------------------------------------------ | ------------------- |
| 1   | Check-up de saúde física                               | Obrigatória         |
| 2   | Check-up de bem-estar psicológico                      | Obrigatória         |
| 3   | Interface intuitiva                                    | Obrigatória         |
| 4   | IA rodando localmente para ajudar em problemas médicos | Opcional            |
| 5   | Modelo 2d visando 3d do corpo, masculino e feminino    | Obrigatótrio        |
|     |                                                        |                     |

Também foi citado um item que a transcrição registra como "Terfáceito auditivo" [14:34]. **Interpretação:** pode ser "interface auditiva" (alertas ou comandos por voz). Confirmar com a equipe. Gamificação foi tratada como subtópico, não como função própria [14:34].

### Princípios que apareceram ao longo da conversa

- O app deve ser **simples, sério e intuitivo** e resolver o maior número de pontos possível [00:57], [07:10].
- O astronauta **não precisa saber medicina**: recebe informação básica; a informação detalhada vai para os médicos em solo [01:24].
- A telemedicina é "a parte central do atendimento" hoje [02:41].
- Os astronautas já são muito saudáveis e monitorados há anos; os problemas esperados são de **risco médio para baixo** [03:09 – 03:39].
- A base de conteúdo são os 17 riscos do [[Riscos NASA HRP|NASA HRP]] [06:11].

### Ideias discutidas que não entraram na lista final

- Mostrar se o **equipamento de proteção contra radiação** do astronauta está em ordem e usar **visão computacional** para ver se ele está de capacete ou traje [00:28 – 02:41]. A própria equipe levantou que não dá tempo e que seria só um complemento.
- Um avatar inspirado em menu de jogo de RPG para mostrar o estado do astronauta [06:40]. Conclusão da conversa: "tem que ser uma coisa séria" [07:10].
- **Stack técnica** [10:33 – 13:01]: uma proposta foi Spring Boot, PostgreSQL, React, Tailwind e shadcn/ui, com as cores da NASA. Outras pessoas citaram TypeScript, Node.js, SQLite, Python e até HTML simples. **Não houve consenso**; a discussão foi interrompida para definir primeiro o que o app faz [13:30].

## Avaliação crítica

Vereditos: **Manter**, **Ajustar**, **Adiar** (só se sobrar tempo) ou **Cortar**. Cada um cita o critério de julgamento ou o padrão dos vencedores que o justifica.

### 1. Duas camadas de informação: astronauta e cirurgião de voo. **Manter e pôr no centro da história.**

É a ideia mais forte da reunião e responde direto a uma pergunta do enunciado: "quando um resultado merece atenção da tripulação ou dos cirurgiões de voo em solo?". Foi também o que diferenciou o Shelter in Space (autocuidado ou telemedicina conforme a gravidade). A reunião citou a telemedicina mas não definiu **o que o médico em solo vê**. Proposta: uma tela de relatório para solo com o resumo dos check-ups e o que foi sinalizado.

### 2. Trazer os 17 riscos para o app. **Ajustar.**

"Trazer todos" [06:40] vai contra o padrão mais claro dos vencedores: uma pergunta, um conjunto de dados, um fluxo completo. Com um dia e meio, 17 riscos com entrada de dados, regras e telas não cabem.

Proposta: os 17 riscos entram como **conteúdo de consulta** (figura do corpo clicável que abre o resumo da NASA), mas só **três ou quatro** têm medição e acompanhamento. Pela tabela de [[Riscos NASA HRP]], os que já têm indicador do enunciado são: cardiovascular (pressão e frequência cardíaca), sono, comportamental (humor) e, de forma indireta, imunológico e microrganismos (temperatura). Vários riscos não têm como ser medidos por um app de rotina (doença descompressiva, SANS, cargas dinâmicas, perda óssea).

### 3. Check-up diário de saúde. **Manter, mas resolver de onde vem o alerta.**

O ponto fraco é o código de cores. Verde, amarelo e vermelho exigem limiar, e a regra do cofre é não inventar limiares clínicos.

O argumento da própria reunião ajuda aqui: se os astronautas são "o ápice do saudável" [03:09], o sinal útil não é "pressão de doente", e sim **"diferente do normal desta pessoa"**. Proposta: comparar cada medida com a **linha de base do próprio astronauta** (valores de antes da missão, simulados) e mostrar a tendência. Mesmo assim, o tamanho do desvio que vira alerta precisa de fonte. Sem fonte, a regra deve aparecer na tela como **"regra de demonstração"**, e isso deve ser dito no pitch. Os juízes pontuam rigor (Validity); esconder uma regra inventada é pior que declará-la.

### 4. Check-up de saúde mental separado. **Manter, com três ajustes.**

Separar do check-up físico e avisar que não substitui o psicólogo está certo.

- **Nome:** evitar "sanidade" e "perda de sanidade" [04:07]. A NASA usa "Behavioral Health and Performance" (saúde comportamental e desempenho). Em inglês, nos slides: *behavioral health check-in*. "Sanidade" soa estigmatizante e pouco científico para um juiz.
- **As quatro perguntas** não podem parecer um teste validado se foram criadas pela equipe. Ou se usa um instrumento com fonte, ou se apresenta como "autorrelato de humor, estresse e sono", sem pontuação diagnóstica.
- **Sugestão de "um passo além":** a NASA já usou na ISS o **Reaction Self Test**, um teste de tempo de reação (Psychomotor Vigilance Test) de 3 a 5 minutos, para o astronauta acompanhar a fadiga por sono ruim e carga de trabalho ([NTRS 20090029851](https://ntrs.nasa.gov/api/citations/20090029851/downloads/20090029851.pdf), [TechPort 23201](https://techport.nasa.gov/projects/23201)). Uma versão curta no app (tocar na tela quando o estímulo aparece) traz uma **medida objetiva**, liga ao risco de [[Sono inadequado e horários irregulares]] e já tem cara de jogo, o que resolve a gamificação sem parecer brincadeira. É preciso dizer que é uma demonstração inspirada no teste, não o teste validado.

### 5. IA rodando localmente. **Adiar, e não deixar a IA dar orientação médica.**

- **Risco de conteúdo:** um modelo de linguagem pode inventar diagnóstico ou conduta, o que viola a regra do cofre e derruba Validity.
- **Custo:** rodar um modelo local no navegador ou no dispositivo do demo consome horas que não existem.
- **O que vale aproveitar:** o motivo de ser "local" é bom. Longe da Terra a comunicação atrasa e falha (ver [[Suporte inadequado às operações de sistemas]]). Essa história se conta sem IA: o app **funciona sem conexão** e guarda o relatório para enviar quando houver contato.
- Se sobrar tempo, a IA pode **resumir os registros do próprio astronauta para o médico em solo**, sem diagnosticar. Nesse caso, declarar o uso de IA na submissão.

### 6. Modelo 3D masculino e feminino. **Ajustar: figura 2D clicável primeiro, 3D só se sobrar tempo.**

O enunciado sugere "figura humana clicável"; uma figura 2D (SVG) entrega quase todo o valor em uma fração do tempo. Ter as versões masculina e feminina custa pouco em 2D e mostra cuidado com inclusão. Um modelo 3D baixado precisa de licença compatível e deve entrar em References.

### 7. Equipamento de radiação e visão computacional. **Cortar a visão computacional; trocar por dado real da NASA.**

- Detectar capacete ou falha no traje com visão computacional não cabe no prazo, como a própria equipe disse.
- Na ISS a proteção contra radiação é sobretudo blindagem e medição (por exemplo, o espectrômetro CANS da [[Monitoramento de radiação e saúde dos astronautas (CSA)|nota da CSA]] mede o ambiente), não um equipamento que o astronauta "veste" como caneleira.
- **Alternativa que resolve a maior lacuna do projeto:** a API pública **DONKI** da NASA (detalhes em [[DONKI - clima espacial da NASA]]) traz eventos de clima espacial em quase tempo real, inclusive erupções solares (FLR) e partículas solares energéticas (SEP). Um cartão "clima espacial agora", com dado real, ligado ao risco [[Cânceres induzidos por radiação]], põe **dado da NASA no centro** (critério Relevance). Foi o que fez o PureFlow, vencedor de 2025. Limitação a declarar: o DONKI informa eventos solares, **não a dose recebida pelo astronauta**.

### 8. Stack técnica. **Rever: o juiz não vê o back-end.**

O que os juízes avaliam é o demo (vídeo de até 30 s ou até 7 slides) e a página do projeto. Spring Boot com PostgreSQL exige servidor e banco publicados, configuração e deploy; não roda no GitHub Pages. Com um dia e meio, isso consome horas e não aparece no demo.

Recomendação: **React + TypeScript + Vite + Tailwind + shadcn/ui**, dados guardados no próprio navegador (localStorage ou IndexedDB) e o conteúdo dos riscos em JSON, publicado no GitHub Pages ou na Vercel. Sem servidor, o app já funciona offline, o que reforça a história do item 5.

"Ser profissional" [12:33] aqui significa funcionar, ter link publicado e explicar as regras. Não significa ter mais camadas. A arquitetura com back-end (estação em solo com Spring Boot e PostgreSQL) pode aparecer num slide de **próximos passos**. Se quem cuida do back-end já domina Spring e consegue publicar em poucas horas, a decisão pode ser outra, mas deve ser tomada hoje.

### 9. Cores e marca da NASA. **Cuidado.**

O guia de submissão diz que conteúdo gerado "may not use, contain, or modify any NASA branding or design elements (such as the NASA logos, flags, or mission identifiers)". A regra dos participantes também proíbe usar o logo da NASA sem autorização escrita. Usar o logo ou imitar a identidade visual da NASA está fora. Proposta: uma **paleta própria de tema espacial**, sem logos da NASA nem de missões.

### 10. Avatar inspirado em jogo. **Usar a ideia, não o visual.**

A ideia de um boneco que mostra o estado da pessoa vira a figura do corpo do item 6. Copiar o visual de um jogo comercial pode ser problema de direitos autorais e vai contra o tom "sério" que a própria equipe pediu.

### O que a reunião não discutiu e precisa ser decidido

1. **Qual dado real da NASA o projeto usa.** É o critério mais citado nos vencedores e não apareceu na reunião (ver item 7).
2. **Dados reais ou simulados.** [[Desafio e escopo]] diz "usar dados reais"; o CONTRIBUTING diz para usar dados fictícios. Proposta: dados de saúde **simulados e identificados como tal**, e dado da NASA real (DONKI e textos do HRP).
3. **A história do demo** e quem a conta. Ver o roteiro abaixo.
4. **Quem faz o quê** até domingo.
5. **Idioma:** página do projeto e slides em inglês; vídeo em português só com legenda em inglês.

## Escopo proposto

### Uma frase (para o pitch, em inglês)

> *An offline-first daily check-in that turns NASA's human spaceflight risks into simple guidance for astronauts, and a clear report for flight surgeons on Earth.*

### Jornada do demo

1. **Check-up diário de saúde** (cerca de 1 minuto): sono, frequência cardíaca, pressão, temperatura e, opcionalmente, glicemia. Valores **simulados** com aviso na tela.
2. **Check-in comportamental** (separado): humor e estresse em poucas perguntas e o teste de reação curto.
3. **Painel com a figura do corpo:** cada região mostra o estado comparado com a linha de base, com **ícone e texto, não só cor**. O clique abre o risco da NASA ligado: o que é e o que pode ser feito, com link para a fonte.
4. **Cartão de clima espacial** com dado real do DONKI, ligado ao risco de radiação.
5. **Relatório para o cirurgião de voo:** resumo do dia, o que foi sinalizado e por qual regra, com o aviso "guardado para envio, sem conexão" para mostrar o atraso de comunicação.

### Prioridades

| Prioridade | Itens |
|---|---|
| **Obrigatório** | Check-up de saúde; check-in comportamental separado; figura do corpo 2D clicável ligada aos riscos HRP; relatório para solo; **cartão de clima espacial com dado real do DONKI** (decidido em 2026-11-14); dados simulados identificados; app publicado em um link; demo em inglês; References completas |
| **Desejável** | Teste de reação; figura masculina e feminina; lembrete de check-up |
| **Se sobrar tempo** | Modelo 3D; resumo por IA para o médico, sem diagnóstico; alertas por voz (se for isso o "item auditivo") |
| **Fora** | Visão computacional; diagnóstico; limiares clínicos sem fonte; servidor e banco publicados (se a equipe aceitar o item 8); logo ou identidade visual da NASA |

### Como o escopo responde aos critérios

| Critério | Onde o escopo responde |
|---|---|
| Impact | Missões longas com atraso de comunicação; o astronauta decide sozinho quando procurar o solo |
| Creativity | Linha de base pessoal em vez de limiar de população; teste de reação inspirado na ISS |
| Validity | Cada sinalização mostra a regra e a fonte; regras sem fonte aparecem como "de demonstração" |
| Relevance | Riscos do HRP como conteúdo; DONKI como dado real ao vivo |
| Presentation | Uma jornada de cinco passos que cabe em 30 s ou 7 slides |

## Cronograma sugerido até o envio

| Quando | O quê |
|---|---|
| Sábado, hoje | Fechar as decisões da lista abaixo; dividir tarefas; esqueleto do app publicado no link; JSON dos riscos; telas dos check-ups |
| Domingo, manhã | Painel com a figura do corpo; relatório para solo; cartão do DONKI integrado ao painel |
| Domingo, 15h | **Congelar funcionalidades**; só correções |
| Domingo, 18h | Gravar o vídeo ou fechar os slides; escrever a página do projeto em inglês |
| Domingo, até 21h | **Enviar**, com margem antes das 23h59 |

Horários são sugestão; ajustar ao horário do evento local.

## Decisões para registrar em [[Decisões]]

- [x] Stack: React + TypeScript + Tailwind + shadcn/ui, sem servidor, com dados no localStorage (registrado em 2026-11-14).
- [x] Usar o DONKI como dado real da NASA (registrado em 2026-11-14; o que ele traz: [[DONKI - clima espacial da NASA]]).
- [ ] Quantos e quais riscos têm medição (proposta: cardiovascular, sono, comportamental e temperatura).
- [ ] Regra dos alertas: linha de base pessoal com "regra de demonstração" declarada.
- [ ] O que era o quinto item ("Terfáceito auditivo").
- [ ] IA: adiar e, se entrar, só para resumo.
- [ ] Responsável por cada item até domingo.

## Escopo em cinco temas — atualização da conversa

Proposta baseada na [[Transcrição da reunião]], especialmente no fechamento entre 14:01 e 16:01. Esta seção registra o escopo solicitado na conversa; as avaliações e propostas anteriores permanecem como histórico para discussão.

**Objetivo:** facilitar o check-up e a compreensão da própria condição durante a missão, conectando os registros ao corpo interativo e à consulta offline.

| Tema | Ideia discutida | Como explorar no protótipo |
|---|---|---|
| **1. Check-up de saúde física** | Registrar diariamente a condição do astronauta. | Formulário curto sobre sintomas e condições físicas, com histórico individual. |
| **2. Check-up de bem-estar psicológico** | Fazer uma avaliação separada da saúde física, com perguntas básicas. | Registro de humor, estresse e percepção de bem-estar, sem substituir acompanhamento psicológico. |
| **3. Corpo humano em 3D** | Disponibilizar modelos masculino e feminino. | Selecionar regiões para registrar desconfortos e visualizar informações relacionadas ao próprio check-up. |
| **4. IA local para auxiliar na consulta médica** | Executar a IA localmente para ajudar com dúvidas e problemas durante a missão. | Consultar uma base de documentos selecionados, mostrando as fontes e reconhecendo quando não houver informação suficiente. |
| **5. Interface intuitiva — interpretação a confirmar** | Facilitar o entendimento dos dados, com inspiração na apresentação de informações em jogos. | Apresentar os registros no corpo e usar linguagem simples, com poucos passos para concluir cada tarefa. |

### Ressalva sobre o quinto tema

No fechamento da gravação, a equipe esquece qual era o quinto item. O trecho correspondente ficou pouco claro na transcrição automática. **Interface intuitiva é uma interpretação proposta na conversa, não uma decisão confirmada da reunião.** Gamificação aparece depois e é tratada como subtópico. Confirmar o quinto item com a equipe.

### Limites desta proposta

- Check-up físico e check-up psicológico são dois temas distintos; saúde mental e bem-estar psicológico não constituem dois módulos separados nesta proposta.
- A IA local e o modelo 3D foram apresentados como possibilidades opcionais em parte da conversa. A prioridade de implementação ainda precisa ser confirmada.
- Painel da missão não integra os cinco temas desta atualização: o participante apontou que esse recurso já existe.
- As funcionalidades da terceira coluna são propostas para explorar as ideias, não falas literais nem decisões adicionais da reunião.
