---
tipo: plano
criada: 2026-11-14
estado: proposta para a equipe validar
para: agente de código que vai implementar (Claude Opus) e equipe de interface
fontes: "wireframe do quadro branco (arquivos/wireframe-home-quadro-branco.jpg), conversa de 2026-11-14, [[Escopo do protótipo]], [[Decisões]], [[DONKI - clima espacial da NASA]]"
---
# Plano do front-end v2 (Health 7)

Refazer a interface do Health 7: novo visual, navegação em três abas, check-ups separados, tela focada no avatar, gamificação da rotina diária (pontos, rank e registro de água) e um chat de IA de companhia ligado a um webhook do n8n. A lógica que já funciona (regras de linha de base, DONKI, armazenamento) fica.

**Prazo:** a submissão fecha domingo, 15/11, às 23h59. Congelar funcionalidades domingo às 15h. As fases da seção 10 estão em ordem de prioridade: se o tempo acabar, corta-se de baixo para cima e o app continua inteiro.

## 1. Como usar este plano

Para quem implementa:

1. Leia antes de escrever código: `frontend/README.md`, `health7-design-system/README.md` (as regras de conteúdo continuam valendo; as de forma mudam, ver seção 4) e abra a foto `arquivos/wireframe-home-quadro-branco.jpg`.
2. Trabalhe na branch `feat/front-v2`, com commits pequenos e mensagens em português (ver `CONTRIBUTING.md`).
3. Ao fim de cada fase: `npm run build` e `npm run lint` sem erro, e um commit.
4. **Olhe o que você fez.** A queixa da equipe é visual, e código que compila não prova que ficou bom. A cada fase, rode o app, tire prints em 1440 px e em 390 px de largura e compare com os critérios da seção 4. Há um Chromium headless em `~/.cache/ms-playwright/` na máquina do Yvens; se não houver navegador disponível, diga isso no relatório em vez de afirmar que conferiu.
5. Onde o plano não cobrir um caso, vale a seção 3, depois a opção mais simples. Anote o que decidiu em "Desvios", no fim deste arquivo.

## 2. Situação atual

A equipe acredita que o front não usa Tailwind nem shadcn/ui. Não é bem isso:

- **Tailwind 4 está instalado e em uso**, mas só para layout (grid, espaçamento).
- **shadcn/ui está configurado** (`frontend/components.json`, variáveis em `src/index.css`), mas **nenhum componente foi adicionado**: não existe `src/components/ui/`.
- Todo o visual vem das classes `h7-` de `health7-design-system/components/bundle.css`, importadas em `src/index.css`.
- Existem duas telas, trocadas por estado em `src/App.tsx`: `Dashboard` e `CheckIn`. Não há navegação.

Ou seja: instalar biblioteca não resolve sozinho. O que deixa a tela feia são as regras de forma do design system atual.

### Por que parece feio (visto no app rodando em 14/11)

| Problema | Causa |
|---|---|
| Tudo grita no mesmo volume | Cartão, selo, botão e indicador têm a mesma borda de 2px em azul claro (`--line`, #2e96f5) |
| Não há profundidade | Página e cartões têm o mesmo fundo (`--ground`); o cartão é só um contorno |
| Texto de apoio parece link | `--ink-muted` é o mesmo azul da borda, e parágrafos inteiros saem nessa cor |
| Amarelo demais | Botão de largura total, selos, peito do boneco e links em Neon Yellow ao mesmo tempo |
| Boneco de cápsulas | Um círculo e seis retângulos, preenchidos com cor chapada |
| Muito texto em maiúsculas, negrito e monoespaçada | Rótulos, selos e metadados competem com os números |
| Cartões carregados | Avisos legais e regras ficam sempre abertos dentro do cartão |
| Espaço morto | Três colunas de alturas diferentes, metade da tela vazia |

### O que fica como está

Não reescreva: `src/lib/donki/*` (cliente, cópia local, modo histórico), `evaluate` e `ruleText` em `src/lib/health.ts`, `src/data/*.json`, `src/data/regions.ts`, `scripts/*`. Mudam só os componentes de tela, o formato de `src/lib/storage.ts` (fase 3) e `simulated.json`, que ganha a chave `game` (fase 4) sem alterar o que já existe.

## 3. Regras que não mudam

Vêm do cofre e pesam na nota dos juízes (critério Validity). Valem para toda tela nova, inclusive o chat.

- O app **informa e encaminha; não diagnostica**. Nada de dose, remédio ou limiar clínico inventado.
- Todo estado tem **ícone e palavra**, nunca só cor: "Within baseline", "Attention", "Flagged for ground". São três estados; não crie um quarto.
- Dado de saúde simulado aparece identificado como **"Simulated"**. Regra sem fonte clínica aparece como **"Demonstration rule"**, com a regra por escrito. Dado da NASA aparece como **"Live NASA data"**, com link.
- Texto da interface em **inglês**, frases curtas, segunda pessoa. "Differs from your baseline", não "abnormal".
- **"Behavioral health"**, nunca "sanity". O autorrelato não tem pontuação somada e leva o aviso de que não substitui o psicólogo.
- **Pontos premiam o que a pessoa faz, nunca o que a medida mostra** (ver 7.6).
- **Sem logo da NASA** nem identificador de missão.
- Contraste de texto de 4,5:1 ou mais, alvo de toque de 44 px, foco de teclado visível, `prefers-reduced-motion` respeitado.
- Sem servidor próprio. Os dados ficam no `localStorage`.

## 4. Direção visual

Opinião do planejador: **manter a paleta e largar as regras de forma**. Deep Blue, Electric Blue e Neon Yellow dão identidade e combinam com o tema. O que pesa é "borda de 2px em tudo, sem sombra, um fundo só". Essas regras vieram do guia de marca do Space Apps, que vale para material do evento; ele não obriga a interface do projeto a segui-lo.

A referência é um painel de bordo médico: escuro, calmo, com o número como protagonista e a cor reservada para o que pede atenção.

### Tema

Crie `frontend/src/styles/theme.css` com os tokens novos, derivados dos atuais. Não edite `health7-design-system/`: ele fica como referência da v1.

| Token novo | Valor de partida | Uso |
|---|---|---|
| `--surface-1` | #0b2150 | Fundo de cartão |
| `--surface-2` | #11306b | Hover, área interna, popover, balão do chat |
| `--hairline` | `--line` a cerca de 25% de opacidade | Borda de 1px de cartões e campos |
| `--ink-soft` | #a9bde6 | Texto de apoio (9,2:1 sobre `--ground`, 8,2:1 sobre `--surface-1`) |
| `--brand` | `--accent` (#eafe07) | Ação principal e estado de atenção |
| `--flag-ink` | #ff9d80 | Texto e ícone do estado sinalizado (7,7:1 sobre `--surface-1`) |

Os valores são ponto de partida: ajuste olhando a tela, e recalcule o contraste se mudar.

- **Fundo da página:** `--ground` com um degradê radial discreto no topo. Opcional: padrão de órbitas a baixa opacidade, que o design system já previa.
- **Cartão:** `--surface-1`, borda de 1px em `--hairline`, raio de 12 px, padding de 20 a 24 px, sem sombra. Sombra só no que flutua: chat, diálogo, botão da IA.
- **Azul claro (#2e96f5):** só em link, elemento interativo e linha de gráfico. Nunca em parágrafo. Sobre `--surface-2` ele tem 4,1:1, então ali não serve para texto pequeno.
- **Rocket Red (#e43700):** só em borda, ponto e preenchimento. Como texto ele fica em 3,6:1; use `--flag-ink`.
- **Amarelo:** um botão principal por tela, de largura natural (não de largura total), e o estado de atenção. Mais nada.
- **Selos de estado:** fundo tingido (cor do estado a 12 a 18% sobre a superfície), texto na cor do estado, ícone, sem borda grossa. "Within baseline" é o estado calmo: texto em `--ink-soft` com ícone de check, sem caixa.
- **Selos de origem:** discretos, texto pequeno. "Simulated" aparece **uma vez por tela**, num chip fixo no cabeçalho ("Simulated data"), em vez de um selo por cartão. O princípio fica (todo dado simulado identificado); o que muda é repetir menos.

### Tipografia

- Títulos em Fira Sans SemiBold ou Bold, **caixa normal**. Fira Sans Black em maiúsculas só na marca "Health7".
- Texto em Overpass. Rótulos pequenos em maiúsculas com parcimônia: no máximo um nível por cartão.
- Fira Code só para valor medido e horário. O número do dia é o maior elemento do cartão (40 px ou mais).
- **Sirva as fontes localmente** (`@fontsource/fira-sans`, `@fontsource/overpass`, `@fontsource/fira-code`) e tire o `<link>` do Google Fonts do `index.html`. Hoje, sem internet, o app cai na fonte do sistema, o que contradiz a história de funcionar sem conexão.

### Critérios para os prints

- Em cada tela, o olho encontra em menos de 3 segundos: o estado geral, a ação principal e o que saiu da linha de base.
- No máximo um elemento amarelo sólido por tela.
- Nenhum parágrafo em azul claro. Nenhum cartão com mais de cinco linhas de texto corrido.
- Colunas da Home com alturas alinhadas, sem metade da tela vazia em 1440×900.
- Em 390 px nada estoura a largura nem exige rolagem horizontal.

## 5. Bibliotecas

| Biblioteca | Veredito | Para quê |
|---|---|---|
| **shadcn/ui** (Radix) | Usar | `button`, `card`, `tabs`, `badge`, `dialog`, `sheet`, `tooltip`, `progress`, `scroll-area`, `separator`, `skeleton`, `input`, `textarea`, `sonner`. Entra por `npx shadcn@latest add ...`; o código fica em `src/components/ui/` |
| **lucide-react** | Já instalada, usar | Todos os ícones. É a continuação do Feather, que o design system pedia |
| **Recharts**, pelo `chart` do shadcn | Usar na fase 7 | Gráficos de tendência da aba Progress. Se a instalação com React 19 der mais de 15 minutos de trabalho, amplie o `Sparkline` atual em SVG e siga |
| **motion** | Opcional | Entrada do painel do chat, pulso na região selecionada do avatar. O resto resolve com transição CSS de 150 a 200 ms |
| **@fontsource/\*** | Usar | Fontes locais (seção 4) |
| **vite-plugin-pwa** | Só se sobrar tempo | Faz o app abrir sem rede, o que torna verdadeira a frase "offline-first". Conferir a compatibilidade com o Vite 8 antes |
| Biblioteca do corpo humano | Teste com tempo marcado | Ver seção 7.3 |
| `@n8n/chat` (widget pronto do n8n) | Não usar | Economiza uma hora, mas traz visual próprio e tira o controle dos estados sem conexão. O chat fica nosso e fala com um Webhook comum |
| MUI, Chakra, Ant Design | Não usar | Brigam com Tailwind e com os tokens |
| Aceternity, Magic UI e efeitos pesados | Não usar | O tom pedido pela equipe é "sério" |
| three.js / 3D | Não usar agora | O cofre põe 3D em "se sobrar tempo" |
| react-router, Zustand | Não usar | Rota por hash em 20 linhas e `useState` com contexto bastam |

### Cuidado ao ligar o shadcn

Há uma colisão de nomes. No shadcn, `accent` é um fundo sutil de hover; aqui, `--accent` é o Neon Yellow. Do jeito que `src/index.css` está, todo `hover:bg-accent` de um componente do shadcn acende em amarelo. `--muted` e `--card` também apontam para `--ground`, o que apaga a diferença entre cartão e página.

Corrija no mapeamento do Tailwind, **sem mexer na variável CSS `--accent`** (as classes `h7-` que ainda estiverem em uso dependem dela):

- No `@theme inline`: `--color-accent` passa a apontar para `--surface-2` e `--color-accent-foreground` para `--ink`. Crie `--color-brand` (aponta para `--accent`) e `--color-brand-foreground` (para `--on-accent`).
- `--card`: `--surface-1`. `--popover`, `--muted`, `--secondary`: `--surface-2`. `--muted-foreground`: `--ink-soft`. `--border` e `--input`: `--hairline`. `--primary`: o amarelo. `--radius`: 8 px.
- Nenhum arquivo em `src/` usa hoje os utilitários `bg-accent` ou `text-on-accent` (conferido por busca), então a troca não quebra nada.

## 6. Arquitetura de telas

Navegação no topo, como no quadro: **Home · Progress · Detailed stats**. No celular, vira uma barra fixa embaixo. Rota por hash (`#/`, `#/progress`, `#/stats`, `#/check/health`, `#/check/behavioral`), sem biblioteca, para funcionar no GitHub Pages com `base: './'` e para o botão voltar do navegador funcionar.

```
Casca do app (todas as telas)
├─ Cabeçalho: marca · abas · "Crew member 02 · Mission day 47" · rank e pontos · chip "Simulated data" · conexão
├─ Conteúdo da rota
└─ Botão da IA, fixo no canto inferior direito  →  painel do chat

#/                  Home
#/progress          Progress
#/stats             Detailed stats (avatar em foco); aceita ?region=head
#/check/health      Health check-up
#/check/behavioral  Behavioral check-in
```

Estrutura de pastas sugerida:

```
src/components/ui/     shadcn (gerado)
src/components/app/    componentes do Health 7 v2 (StatusBadge, VitalTile, BodyAvatar, ChatPanel...)
src/screens/           Home, Progress, DetailedStats, HealthCheckUp, BehavioralCheckIn
src/lib/               health, storage, donki (existentes) + notes, game, chat, route
src/styles/theme.css   tokens v2
```

Migre os componentes de `src/components/h7/` para `src/components/app/` conforme cada tela for refeita. Quando nenhuma classe `h7-` restar em `src/`, tire o import de `bundle.css` de `src/index.css` e apague `src/components/h7/`.

## 7. Telas

### 7.1 Home

O quadro desenha o avatar à direita; na conversa a equipe disse que o ideal é **o avatar no meio e os cartões dos lados**. Vale a conversa.

Em telas de 1280 px ou mais, três colunas:

| Esquerda | Centro | Direita |
|---|---|---|
| Cartão **Health check-up** | Cartão **Avatar** (o maior da tela) | Cartão **Today's routine** (pontos e água, ver 7.6) |
| Cartão **Behavioral check-in** | | Cartão **Space weather** (compacto) |
| | | Cartão **Report for ground** (compacto) |

Embaixo, de ponta a ponta: faixa **Health notes**. Em telas menores a ordem vira: avatar, rotina de hoje, os dois check-ups, notas, clima espacial, relatório. A coluna da direita tem três cartões e a da esquerda dois: os da direita são compactos, para as colunas fecharem na mesma altura.

- **Today's routine.** As três tarefas do dia com o estado e os pontos de cada uma, o registro de água e o total de pontos de hoje. Detalhes em 7.6.
- **Cartões de check-up.** Título, estado de hoje ("Done today · 09:42 UTC" ou "Pending today"), três linhas com os últimos valores (o cartão de saúde mostra as medidas fora da linha de base primeiro) e o botão **Start**. Se o check-up de hoje já foi feito, o botão vira "Redo", em estilo secundário. O amarelo vai para o primeiro check-up pendente; se os dois estiverem feitos, nenhum botão da Home é amarelo.
- **Avatar.** O boneco com as regiões pintadas pelo estado e os rótulos com linha-guia que já existem hoje (região e estado por escrito). Acima, uma frase de resumo: "2 measures differ from your baseline" ou "All measures within your baseline". O cartão inteiro leva para `#/stats`; clicar numa região leva para `#/stats?region=...` com ela já aberta.
- **Space weather.** Só a linha principal (há ou não evento de partículas solares), a maior erupção, a idade do dado e o selo de origem. O botão "Details" abre um diálogo com o conteúdo completo do cartão atual: linhas SEP, FLR e GST, avisos, modo histórico. A lógica vem de `useSpaceWeather`, sem alteração.
- **Report for ground.** Quantos itens estão sinalizados e o estado do envio ("Queued · no ground link"). "Open report" abre um diálogo com o relatório atual (`ReportCard`), com as regras por escrito.
- **Health notes.** Ver 7.5.

### 7.2 Check-ups

Hoje `src/screens/CheckIn.tsx` emenda saúde e comportamento num fluxo só. Passam a ser **dois fluxos independentes**, cada um aberto pelo seu cartão.

- Uma pergunta por etapa, como hoje, com barra de progresso (`progress` do shadcn) e o campo grande no centro.
- Ao salvar: tela curta de confirmação ("Saved. Queued for ground.") com o resumo do que saiu da linha de base, e volta para a Home.
- **Nome:** o quadro diz "Mental check-up". O cofre e o design system pedem "Behavioral health check-in". Use "Behavioral check-in" no cartão e na tela (ver seção 11).
- **Armazenamento.** `src/lib/storage.ts` passa a guardar registros com `kind: 'health' | 'behavioral'` na chave `health7:checkins:v2`. Migre o que houver em `v1`: cada registro antigo vira dois. `latestCheckIn` passa a receber o tipo. Ajuste `getTodayVitals` e o cálculo de `connection` em `App.tsx`.

### 7.3 Detailed stats (avatar em foco)

É a tela "focada só no avatar" da conversa. Três colunas no desktop:

| Esquerda | Centro | Direita |
|---|---|---|
| As quatro medidas de hoje, em lista compacta (valor, linha de base, diferença, estado) | O avatar, grande | Painel da região selecionada |

Painel da região, de cima para baixo: nome e estado; as medidas ligadas a ela, com a regra por escrito quando houver sinalização; e os riscos do NASA HRP ligados (conteúdo do `RiskCard` atual: "Top risks", "What can be done", link para a fonte). Sem região selecionada, o painel mostra o resumo geral e a instrução "Select a body region".

A ligação entre o clima espacial e o risco de radiação (`RADIATION_RISKS`) continua: o diálogo do clima espacial tem um link que abre esta tela com o risco de radiação no painel.

**O boneco.** É a peça que mais pesa no visual. Faça um teste de no máximo 30 minutos:

1. Experimente `@mjcdev/react-body-highlighter`. Conferido no npm em 14/11: versão 0.0.4, publicada há cerca de dois anos, sem outros projetos dependentes; tem corpo masculino e feminino, frente e costas, `onBodyPartClick` e cores por intensidade. É uma adaptação para web do `react-native-body-highlighter`, de HichamELBSI. **Não foi conferido:** a licença e se instala com React 19. Confira os dois antes de adotar.
2. Se instalar e a licença permitir, envolva num componente `BodyAvatar` que traduz as nossas sete regiões para as partes da biblioteca: `head` → head; `chest` → chest; `core` → abs, obliques; braços → deltoids, biceps, triceps, forearm, hands; pernas → quadriceps, knees, tibialis, calves, adductors, ankles, feet.
3. Se o pacote não instalar mas a licença permitir, copie os traçados SVG para dentro do projeto.
4. Se nada disso der certo, redesenhe a silhueta à mão em SVG com um traçado por região. Mesmo a figura atual melhora muito com contorno fino, preenchimento tingido em vez de chapado e um brilho radial atrás.

Em qualquer caso: mantenha os ids de região de `src/types.ts`, os rótulos com linha-guia e a navegação por teclado que o `BodyFigure` já tem. Se usar código ou traçados de terceiros, registre autor, licença e link numa seção "Credits" do `frontend/README.md`: a submissão exige References completas. O seletor masculino e feminino entra se a biblioteca der de graça.

### 7.4 Progress

De cima para baixo:

- **Rank e pontos** (ver 7.6): rank atual, barra até o próximo, sequência de dias, conquistas e o quadro da tripulação.
- **Tendências:** um gráfico por medida com os últimos 7 dias, a linha de base tracejada e o ponto de hoje destacado. Abaixo de cada gráfico, uma frase: "Below your baseline for 4 days in a row".
- **Histórico** dos check-ups salvos, com data, tipo, quantos itens foram sinalizados e os pontos ganhos.
- Respostas do check-in comportamental ao longo do tempo, uma linha por pergunta, sem somar.
- Selo "Simulated data" visível: o histórico de 7 dias vem de `src/data/simulated.json`.

### 7.5 Health notes

Uma faixa com até três notas curtas, geradas por regra em `src/lib/notes.ts`. Cada nota tem ícone, uma frase e um link para onde a pessoa age.

| Condição | Nota | Leva para |
|---|---|---|
| Check-up de hoje pendente | "Today's health check-up is pending." | Check-up |
| Medida em atenção ou sinalizada | "Sleep is 2.1 h below your baseline." | Região no Detailed stats |
| Evento de partículas solares na janela | "Solar particle event detected on 05 Sep." | Diálogo do clima espacial |
| Água abaixo da meta do dia | "3 of 8 water servings logged today." | Cartão Today's routine |
| Tudo dentro da linha de base | "All measures within your baseline." | Nenhum |

A orientação do que fazer vem do texto da NASA ("What can be done", em `hrp-risks.json`), mostrado no Detailed stats. A nota não inventa conselho. A faixa leva o selo "Demonstration rule".

O exemplo do quadro, "You need to drink water!", entra agora que existe o registro de água (7.6). A nota diz o fato ("3 of 8 logged"), não dá ordem, e a meta diária é uma meta de demonstração.

### 7.6 Gamificação

Objetivo: dar à pessoa um motivo para fazer a rotina todo dia. O tom continua sóbrio: sem mascote, sem chuva de confete.

**Princípio: os pontos premiam o que a pessoa faz, nunca o que a medida mostra.** Fazer o check-up dá ponto; ter a pressão "boa" não. Se o valor desse ponto, haveria incentivo para registrar um número melhor que o real, e o relatório para o solo perderia o valor. Pela mesma razão, ninguém perde ponto.

**Pontos.** A tabela fica em `src/data/simulated.json`, numa chave `game`, para a equipe ajustar sem mexer no código.

| Ação | Pontos | Limite |
|---|---|---|
| Health check-up | 20 | Um por dia |
| Behavioral check-in | 20 | Um por dia |
| Porção de água registrada (250 ml) | 5 | Até a meta do dia (8 porções) |
| Rotina completa: os dois check-ups e a meta de água | 20 de bônus | Um por dia |
| Sequência: dias seguidos com os dois check-ups | 5 por dia de sequência | Até 25 por dia |

O máximo de um dia é 125 pontos. A meta de 8 porções é uma **meta de demonstração**, sem fonte: aparece com esse selo e fica na configuração, para quem cuida da pesquisa trocar por um valor com fonte.

**Rank.** Cinco patamares por pontos acumulados: Cadet (0), Specialist (500), Flight Engineer (1 500), Pilot (3 000), Commander (5 000). São funções genéricas de tripulação, não identificadores de missão.

O tripulante simulado está no dia 47 da missão, então não começa do zero: `game.startingPoints` vale 2 940, a 60 pontos de Pilot. Assim, **fazer a rotina durante o demo faz o rank subir diante da câmera**. É um valor simulado e identificado como tal.

**Conquistas.** Quatro bastam: primeira rotina completa; sequência de 7 dias; meta de água 3 dias seguidos; 10 check-ups comportamentais.

**Tripulação.** Lista "Crew this week" com os pontos da semana de quatro colegas simulados (em `game.crew`), a posição da pessoa e uma barra de meta coletiva ("Crew routine: 5 of 6 done today"). É dado fictício: o app não tem servidor e não sincroniza com ninguém. Opinião do planejador: destacar a meta coletiva mais que a posição individual, porque o risco de [[Trabalho em equipe inadequado]] é um dos 17 do HRP e uma disputa entre seis pessoas confinadas não ajuda (ver seção 11).

**Onde aparece.**

- **Cabeçalho:** chip com o rank e os pontos ("Flight Engineer · 2 940 pts"), que leva para Progress.
- **Home, cartão Today's routine:** as três tarefas com estado e pontos ("Health check-up · +20"), o contador de água com os botões "+ 250 ml" e desfazer, e o total de hoje num anel de progresso.
- **Ao ganhar pontos:** aviso curto ("+20 points"), com o `sonner`. Ao subir de rank, um diálogo com o novo rank.
- **Progress:** rank com a barra até o próximo, sequência, conquistas e a lista da tripulação.

**Como calcular.** Em `src/lib/game.ts`, com funções puras que derivam tudo dos registros: pontos de hoje, total, rank, próximo rank, sequência e conquistas saem dos check-ups salvos e do registro de água, somados a `startingPoints`. Não guarde o total de pontos em lugar nenhum: recalculado a cada leitura, ele não tem como divergir dos registros. O registro de água fica em `health7:water:v1`, como `{ "2026-11-14": 3 }`. O dia é o dia UTC, como no resto do app.

## 8. Chat de IA

### Papel

O chat é um **companheiro de conversa**, não um assistente médico. Quem passa meses confinado, longe de casa, com as mesmas poucas pessoas, ganha alguém com quem conversar a qualquer hora: acolhedor, atento ao dia da pessoa, sem julgar. Liga-se ao isolamento e ao confinamento, que o enunciado do desafio cita, e ao risco de [[Mudanças comportamentais e transtornos psiquiátricos]].

Ele não dá orientação médica nem faz papel de psicólogo. Pode comentar o dia com base no que a pessoa registrou ("you logged less sleep than usual, how are you feeling?") e incentivar a rotina, mas não interpreta medida nem sugere conduta.

**O prompt não fica no front.** A personalidade e os limites do agente são configurados no nó AI Agent do fluxo do n8n. O código do site só envia a mensagem com o contexto e mostra a resposta. O anexo traz uma sugestão de prompt para colar no n8n.

### Interface

- Botão redondo fixo no canto inferior direito, em todas as telas, com ícone e o rótulo acessível "Open companion". No celular fica acima da barra de abas.
- No desktop abre um painel flutuante de cerca de 400×600 px, ancorado ao botão. No celular, uma folha de altura total (`sheet`).
- Dentro: cabeçalho com o nome "Companion" e um selo "AI"; lista de mensagens com `aria-live="polite"`; indicador de digitação; campo de texto que envia com Enter (Shift+Enter quebra linha).
- O visual do painel é o mais caloroso do app: balões arredondados, mais respiro, uma saudação com o nome do tripulante quando a conversa está vazia.
- Com a conversa vazia, três sugestões clicáveis: "I'd like to talk about my day", "Help me unwind before sleep", "I miss home".
- Aviso fixo e discreto acima do campo: "AI companion. Not a medical or psychological service. For health concerns, contact your flight surgeon."
- A conversa fica em `localStorage` (`health7:chat:v1`), com um `sessionId` gerado na primeira mensagem e um botão "Clear conversation".
- **A conversa não entra no relatório para o solo.** Diga isso no painel ("Conversations are not part of your ground report"): a pessoa só se abre se souber quem lê.

### Estados

| Situação | O que o chat faz |
|---|---|
| Sem conexão (`navigator.onLine` falso ou falha de rede) | Campo desativado e a frase "Your companion needs a ground link right now. Your check-ups still work offline." |
| Esperando a resposta | Indicador de digitação; envio bloqueado; desiste em 45 s |
| Erro ou tempo esgotado | Mensagem de erro no lugar da resposta, com "Try again" |
| `VITE_N8N_CHAT_WEBHOOK_URL` vazia | **Modo de demonstração:** respostas prontas, marcadas "Demo reply", para desenvolver e gravar sem depender do fluxo |

Uma limitação honesta para o pitch: no demo o companheiro depende da internet, porque o agente roda no n8n. Numa missão real, com minutos de atraso até a Terra, uma conversa não pode esperar o solo; o modelo teria de rodar a bordo, que é a ideia de "IA local" da reunião (ver [[Escopo do protótipo]]). Vale um slide de próximos passos.

### Contrato com o n8n

O Yvens monta o fluxo (Webhook → AI Agent → Respond to Webhook). O front só precisa do endereço e deste formato.

Configuração: `VITE_N8N_CHAT_WEBHOOK_URL` em `frontend/.env.local` (o `.gitignore` já cobre) e um `frontend/.env.example` versionado. A variável entra no pacote do site, então **o endereço é público**: não ponha segredo no front, e a chave do modelo fica só no n8n.

Pedido, `POST` com `Content-Type: application/json`:

```json
{
  "sessionId": "c0a8…",
  "message": "I'd like to talk about my day",
  "context": {
    "crew": { "id": "crew-02", "displayName": "Crew member 02", "missionDay": 47 },
    "dataNotice": "Simulated health data. Demonstration rules, no clinical source.",
    "vitals": [
      { "id": "sleep", "label": "Sleep", "value": "5.1", "unit": "h", "baseline": "7.2", "delta": "−2.1", "status": "flagged", "rule": "Rule: 2.0 h or more below baseline today." }
    ],
    "behavioral": { "mood": 3, "stress": 4, "rest": 2 },
    "routine": { "healthCheckUpDone": true, "behavioralCheckInDone": false, "waterServings": 3, "waterGoal": 8, "streakDays": 4, "rank": "Flight Engineer", "pointsToday": 35 },
    "spaceWeather": { "sepCount": 0, "strongestFlare": "M1.7", "maxKp": null, "windowDays": 7, "fetchedAt": "2026-11-14T14:40Z", "source": "live" }
  }
}
```

`context` é montado em `src/lib/chat.ts` a partir de `getTodayVitals()`, do último check-in comportamental (as chaves são os ids de `behavioral` em `simulated.json`), do estado da rotina em `src/lib/game.ts` e do `DonkiSnapshot` que o `useSpaceWeather` entrega (`sep`, `flr`, `gst`, `fetchedAt`). Serve para o companheiro ser atento ao dia da pessoa, não para ele avaliar a saúde dela. O histórico da conversa fica na memória do agente no n8n, pela chave `sessionId`.

Resposta esperada: `{ "reply": "texto" }`.

O leitor da resposta deve ser tolerante, porque o nó AI Agent devolve o texto em `output` e o formato muda conforme o nó de resposta: aceite `reply`, `output`, `text` ou `message`, dentro de um objeto ou do primeiro item de uma lista, e também texto puro.

Para o fluxo do n8n funcionar com o site:

- Webhook em `POST`, com resposta pelo nó "Respond to Webhook".
- Nas opções do Webhook, liberar a origem do site em **Allowed Origins (CORS)**. Sem isso o navegador bloqueia a chamada, mesmo com o fluxo funcionando no teste do n8n.
- Usar o endereço de **produção** do webhook (fluxo ativo), não o de teste.
- Memória do agente com chave `sessionId`.

### Limites da IA

O cofre registrava "IA: adiar; se entrar, sem orientação médica". A equipe decidiu ter o chat como companheiro de conversa, o que respeita a segunda parte: ele não orienta sobre saúde. Três cuidados, todos no prompt do n8n:

- Sem diagnóstico, remédio, dose ou conduta. Pergunta de saúde vai para o cirurgião de voo.
- Não é terapia. O companheiro escuta e acolhe; não avalia, não rotula, não trata.
- Se a pessoa demonstrar sofrimento intenso ou falar em se machucar, a resposta é de cuidado e encaminha na hora para a tripulação e para o cirurgião de voo.

No front, a única salvaguarda é o aviso fixo do painel. O uso de IA tem de ser declarado na submissão. No demo os dados são simulados; fora dele, lembrar que a conversa passa pelo n8n e pelo provedor do modelo.

## 9. Clima espacial: dá para ser em tempo real em órbita?

Resposta curta: **em órbita baixa, quase; longe da Terra, não, e é isso que o app deve mostrar.**

- **O DONKI é "quase tempo real" no solo.** Cada evento é publicado depois da análise. No exemplo do cofre, o evento de partículas de 05/09 começou às 15h45 UTC e o alerta saiu às 15h54.
- **Na ISS** a comunicação com o solo passa por satélites de retransmissão e é quase contínua, com janelas curtas sem sinal. Um app a bordo consegue o dado com atraso de minutos.
- **Na Lua** o sinal leva pouco mais de um segundo. Funciona.
- **A caminho de Marte** o sinal leva de 4 a 24 minutos em cada sentido, e há períodos de semanas sem contato quando o Sol fica entre os dois planetas. Além disso, os instrumentos do DONKI medem perto da Terra; uma nave do outro lado do Sol recebe outra coisa.
- **A física ajuda só em parte.** O clarão de uma erupção viaja à velocidade da luz, junto com qualquer aviso. As partículas chegam de dezenas de minutos a horas depois, e a nuvem de plasma, de um a três dias. Dá tempo de avisar sobre as duas últimas, não sobre a primeira.
- **A medida em tempo real de verdade é local:** os dosímetros a bordo (ver [[Monitoramento de radiação e saúde dos astronautas (CSA)]]). O DONKI é o contexto que vem do solo, e não informa a dose recebida.

Consequência para a interface: o cartão não promete "agora". Ele mostra **a idade do dado e por onde ele veio**. `useSpaceWeather` já entrega as quatro origens; falta dar destaque a elas:

| `source` | Texto no cartão |
|---|---|
| `live` | "Live · synced 2 min ago" |
| `cache` | "Last ground sync · 14 Nov 09:42 UTC" |
| `bundled` | "Stored copy · 14 Nov 09:42 UTC" |
| `history` | "Past event · 05 Sep 2026" |

No pitch isso vira argumento: o app foi desenhado para o dado chegar atrasado, e diz a idade dele.

## 10. Fases

Cada fase termina com o app funcionando, build e lint limpos, prints conferidos e um commit.

| # | Fase | Entrega | Pronto quando |
|---|---|---|---|
| 0 | Preparação | Branch criada, app rodando, prints do estado atual guardados para comparar | Os prints existem |
| 1 | Fundação | `theme.css`, mapeamento do shadcn corrigido, componentes base instalados, fontes locais, casca do app com abas e rota por hash, botão da IA no lugar (ainda sem abrir nada) | As telas antigas abrem dentro da casca nova; trocar de aba e usar o botão voltar funciona; sem pedido ao Google Fonts |
| 2 | Home | Seção 7.1 e 7.5 | Passa nos critérios da seção 4 em 1440 e 390 px |
| 3 | Check-ups | Seção 7.2, com o armazenamento v2 e a migração | Fazer só o check-up de saúde atualiza a Home e o avatar; um registro antigo em `v1` continua aparecendo |
| 4 | Gamificação, núcleo | Seção 7.6: `game.ts`, registro de água, cartão Today's routine, chip no cabeçalho, aviso de pontos e diálogo de subida de rank | Fazer um check-up e registrar água soma os pontos da tabela; repetir o check-up no mesmo dia não soma de novo; a rotina completa leva o tripulante simulado a Pilot |
| 5 | Detailed stats | Seção 7.3, com o teste do boneco | Clicar na cabeça, na Home ou na própria tela, mostra o estado do sono e os riscos da NASA ligados; funciona pelo teclado |
| 6 | Chat de IA | Seção 8, primeiro no modo de demonstração, depois com o webhook | Os quatro estados da tabela aparecem; com o endereço configurado, uma mensagem recebe resposta do n8n |
| 7 | Progress | Seção 7.4: rank, conquistas, tripulação, gráficos e histórico | Os quatro gráficos mostram a linha de base; o histórico lista os check-ups salvos com os pontos |
| 8 | Acabamento | Estados vazios, de carregamento e de erro; remoção de `bundle.css` e de `components/h7/`; `frontend/README.md` atualizado; nota em [[Decisões]] | Nenhuma classe `h7-` em `src/`; o README descreve a estrutura nova |

Ordem de corte se o tempo apertar: PWA, animações, seletor masculino e feminino, conquistas, lista da tripulação, depois os gráficos da fase 7 reduzidos aos `Sparkline` atuais. As fases 1 a 6 são o demo.

## 11. Decisões para a equipe confirmar

O plano segue com a recomendação. Se a equipe decidir diferente, avise antes da fase indicada.

| # | Pergunta | Recomendação | Afeta |
|---|---|---|---|
| 1 | Largar as regras de forma do design system (borda de 2px, sem sombra, fundo único)? | Sim; manter a paleta | Fase 1 |
| 2 | "Mental check-up" ou "Behavioral check-in"? | Behavioral check-in | Fase 2 |
| 3 | Meta diária de água | 8 porções de 250 ml, como meta de demonstração; a pesquisa troca se achar fonte | Fase 4 |
| 4 | Tripulação: disputa ou meta coletiva? | Mostrar os dois, com a meta coletiva em destaque | Fase 7 |
| 5 | Nomes dos ranks e valores dos pontos | Os da seção 7.6 | Fase 4 |
| 6 | Nome do companheiro de IA | "Companion"; um nome próprio fica a gosto da equipe | Fase 6 |
| 7 | Boneco masculino e feminino? | Só se a biblioteca der de graça | Fase 5 |
| 8 | Endereço do webhook e CORS liberado | O Yvens ajusta no n8n; até lá o chat roda em modo de demonstração | Fase 6 |
| 9 | Tema claro (White)? | Fora do demo; só o Deep Blue é conferido | Fase 1 |

Já decidido pela equipe em 14/11: o chat de IA é um companheiro de conversa, sem orientação médica, com o prompt no fluxo do n8n; a gamificação entra, com pontos por fazer check-ups e registrar água.

Depois de confirmar, registrar em [[Decisões]]: a mudança de direção visual, a gamificação e o chat de IA, que revê o "IA: adiar" de [[Escopo do protótipo]].

## 12. Fora do escopo

Modelo 3D; visão computacional; servidor ou banco próprios; IA rodando localmente; login e vários tripulantes; internacionalização; tema claro; a tela separada para o cirurgião de voo (o relatório continua como diálogo na Home).

## Anexo: prompt sugerido para o agente no n8n

Para colar no nó AI Agent do fluxo. **Não vai para o código do site.** É um ponto de partida; quem monta o fluxo ajusta.

```
You are the companion inside Health7, an app used by an astronaut on a long space mission. They have been away from home for weeks or months, living in a small space with the same few people. You are someone they can talk to at any hour.

How to be:
- Warm, calm and unhurried. Listen first. Reflect back what you heard before you offer anything.
- Curious about them: their day, their crew, what they miss, what they are looking forward to.
- Brief. Two to five sentences, like a person talking, not a report. Ask one question at a time.
- Honest that you are an AI. Never pretend to be a person, a doctor or a psychologist.

What you know:
Each message comes with a "context" object: the crew member's check-ups for today, their daily routine (check-ups done, water logged, streak, rank) and current space weather. Use it to be attentive, for example to notice that they logged less sleep than usual and ask how they feel, or to cheer a streak. The health values are simulated demonstration data. Do not recite numbers unless they ask.

Limits:
- You do not give medical or psychological advice. No diagnosis, no causes, no medication, doses or treatment. If they ask a health question or describe a symptom, say kindly that this is one for their flight surgeon, and stay with them in the conversation.
- You are not a therapist. You listen and keep company; you do not assess or label.
- Do not turn space weather into a radiation dose or a risk estimate.
- If you do not know something, say so.

If they express intense distress, hopelessness or any thought of harming themselves: respond with care, take it seriously, and encourage them to reach a crewmate and their flight surgeon right now. Do not try to handle it alone.

Answer in the language they write in.
```

## Desvios

A preencher por quem implementar: o que foi decidido diferente do plano e por quê.

Registrado pelo agente de código (Claude Opus) durante as fases 0 a 2, em 14/11.

**Fase 0**
- Os prints de cada fase ficam em `arquivos/prints-front-v2/fase-N/`, para a equipe comparar sem rodar o app. Tirados com o Chromium headless de `~/.cache/ms-playwright/` (via `playwright-core` fora do repositório).

**Fase 1**
- O `npx shadcn add` gerou os componentes importando `cn` de um pacote npm chamado `cn` (não do nosso `@/lib/utils`) e instalou `next-themes`. Corrigi os imports e removi os dois pacotes; o `sonner` ficou com tema escuro fixo.
- O `button` do shadcn foi ajustado para ter 44 px de altura em todos os tamanhos (o padrão dele é 36 px) e o `dialog` passou a usar `--surface-1`, borda fina, sombra de flutuante e botão de fechar de 44 px.
- `src/components/ui/**` não leva a regra de lint `only-export-components` (arquivos gerados que exportam variantes).
- Na fase 1, `#/check/health` e `#/check/behavioral` abriam o fluxo antigo, com saúde e comportamento juntos. A separação fica para a fase 3, como no plano.
- Texto da conexão no cabeçalho: "Offline" e "Report queued" (antes "Saved for downlink"), mais curto para caber ao lado do chip "Simulated data".

**Fase 2**
- **Boneco antecipado da fase 5.** O pacote `@mjcdev/react-body-highlighter` tem licença MIT e aceita qualquer React, mas fixa largura e altura em pixels, não tem navegação por teclado e repete `id` nos traçados. Segui o item 3 da seção 7.3: copiei os traçados de frente (masculino e feminino) para `src/data/body-paths.ts` e fiz o `BodyAvatar` nosso, com regiões tingidas, teclado, rótulos com linha-guia e brilho atrás. Crédito em `frontend/README.md`. O seletor masculino/feminino já tem os traçados; falta só o controle (fase 5).
- **Registro de água antecipado da fase 4.** A nota "3 of 8 water servings logged today" (7.5) depende dele, então `src/lib/water.ts` (chave `health7:water:v1`) e o cartão Today's routine entram já na fase 2, sem pontos. `simulated.json` ganhou a chave `game` com `waterServingMl` e `waterGoal`; o resto da tabela de pontos entra na fase 4. O registro aceita até o dobro da meta (os pontos param na meta, fase 4).
- **Ordem das notas** (até três): check-up pendente; "tudo dentro da linha de base", se for o caso; medidas sinalizadas; evento de partículas solares; medidas em atenção; água. Com o check-up pendente e duas medidas fora, a nota de água não aparece.
- **Rótulos das regiões** em caixa normal ("Head · sleep" em vez de "HEAD · SLEEP") em `getBodyRegions`; `evaluate` e `ruleText` não mudaram. Na tela, o nome vira duas linhas: região e sistema.
- **Cartão comportamental**: mostra a resposta como "3 / 5" e repete a palavra da escala só nas pontas (1 e 5), para não interpretar os valores do meio.
- **Armadilha para a equipe**: não use a classe `text-link` como marcador de link. Ela é um utilitário de cor do Tailwind ligado ao `--link` da v1, que é o amarelo; os links da Home saíram amarelos até eu trocar por `underline`.
- O `Dashboard` antigo foi apagado (a Home o substitui). Os componentes `h7/` continuam porque o check-in antigo ainda os usa; saem na fase 8.
- Com a página toda em 1440×900, a faixa Health notes termina em 925 px: fica visível na dobra, menos a borda de baixo.

**Fase 3**
- A migração do v1 roda na primeira leitura, quando ainda não existe `health7:checkins:v2`, e **não apaga** a chave v1. `clearCheckIns` grava uma lista vazia em vez de remover a chave, para o v1 não voltar por migração.
- `latestCheckIn` exige o tipo (`'health'` ou `'behavioral'`); `latestAny()` serve à conexão do cabeçalho.
- O campo de medida não tem placeholder com número: mostrar a linha de base dentro do campo poderia induzir a pessoa a digitar esse valor. A frase de apoio "Your baseline is 62 bpm." continua, como na v1.
- O armazenamento avisa quando grava (`useCheckInsVersion`), para o cabeçalho trocar para "Report queued" já na tela de confirmação.
- A confirmação tem o botão "Back to Home" (amarelo, a ação da tela); não volta sozinha para a Home, para dar tempo de ler o resumo.
- Os componentes de `src/components/h7/` já não são usados por nenhuma tela; ficam até a fase 8, como o plano pede.

**Fase 4**
- A sequência conta só a partir dos registros salvos: no primeiro dia de demo ela é 1 (+5), não os "4 dias" do exemplo do contrato do chat. Não criei um "startingStreak" simulado porque o plano não pede; se a equipe quiser a sequência maior no vídeo, é uma chave a mais em `game`.
- A sequência atual mostrada é a de hoje ou, se hoje ainda não tem os dois check-ups, a de ontem (para não "zerar" de manhã).
- Desfazer uma porção de água tira os 5 pontos dela: é correção de registro, não perda de ponto por medida. Acima da meta, desfazer não muda nada.
- O aviso "+N points" mostra só o ganho do dia (não aparece ao desfazer). O diálogo de rank aparece quando o patamar sobe durante o uso, não ao abrir o app já num rank novo.
- O chip de rank fica no cabeçalho a partir de 1024 px; abaixo disso vai para a linha do tripulante, embaixo do cabeçalho. O texto do tripulante sai do cabeçalho abaixo de 1280 px, para caber.
- Pontos formatados no padrão do inglês ("2,940 pts"), já que a interface é em inglês; o plano escreve "2 940".
- `game.crew` (colegas simulados) fica para a fase 7, junto com a tela Progress.

**Fase 5**
- O teste do boneco já tinha sido feito na fase 2 (traçados copiados, componente nosso). Nesta fase entrou o seletor **Male / Female**, porque a biblioteca dava os dois corpos de graça; a escolha fica no `localStorage` (`health7:body:v1`), só como preferência de quem vê.
- A região escolhida fica na URL (`#/stats?region=head`) e trocar de região **substitui** a entrada do histórico: o botão voltar sai da tela em vez de passar por cada região clicada.
- O risco de radiação abre por `#/stats?risk=radiation`, a partir do link no diálogo do clima espacial (aparece quando há evento de partículas, por exemplo no modo "Show past event").
- Os textos da NASA são longos (até 1.600 caracteres); cada trecho aparece recortado em quatro linhas com "Show more", para cumprir "no máximo cinco linhas de texto corrido por cartão".
- Clicar numa medida da lista da esquerda também escolhe a região ligada a ela. Braços e pernas não têm medida diária: o painel diz isso e mostra só os riscos.
- No celular a ordem é avatar, painel da região, medidas; ao escolher uma região a tela rola até o painel.
- Em coluna estreita o selo de estado do rótulo do avatar quebra em duas linhas, para não invadir o cartão vizinho.
- Home: "Report for ground" virou "Report", com o subtítulo "For your flight surgeon", e o botão "Open report" foi para o cabeçalho do cartão, como o "Details" do clima espacial. Com a rotina maior da fase 4, a Home tem 934 px em 1440×900.

**Fase 6**
- No celular o painel ocupa a tela inteira, mas é o mesmo componente do desktop, não o `sheet` do shadcn: um só código, com o mesmo foco (vai para o campo ao abrir), Esc para fechar e foco de volta no botão.
- O webhook real ainda não foi configurado. O caminho com webhook foi testado contra um servidor local que imita o n8n (CORS liberado, resposta `[{"output": "..."}]`, texto puro, erro 500, resposta lenta e sem resposta). O pedido saiu no formato do contrato, com o mesmo `sessionId` em toda a conversa. Falta o teste com o fluxo de verdade: preencher `VITE_N8N_CHAT_WEBHOOK_URL` em `frontend/.env.local` (modelo em `frontend/.env.example`).
- O leitor da resposta também aceita o item do n8n no formato `{ "json": { "output": ... } }`, além do que o plano lista.
- Falha de rede (fetch rejeita, inclusive por CORS bloqueado) mostra a frase de "sem conexão" do plano, com "Try again". Tempo esgotado (45 s) e erro HTTP têm frases próprias.
- O modo de demonstração responde com frases prontas e sem orientação médica. Pergunta com palavra de saúde (dor, remédio, sintoma...) recebe o encaminhamento ao cirurgião de voo; frase de sofrimento intenso recebe a resposta de cuidado que encaminha para a tripulação e o cirurgião de voo. No n8n, isso fica no prompt do anexo.
- `context.behavioral` só vai preenchido se o check-in comportamental for de hoje; senão vai `null`.
- O painel usa o `useSpaceWeather` quando abre, para mandar o resumo do clima espacial. Isso pode disparar uma consulta ao DONKI a mais.

**Fase 7**
- Recharts entrou pelo `chart` do shadcn sem problema com React 19. O `shadcn add chart` parou pedindo para sobrescrever `card.tsx` e trouxe de novo o pacote `cn`; rodei com `--overwrite` (o `card.tsx` não tinha mudança nossa e ficou igual), corrigi o import e tirei o `cn`.
- A tela Progress é carregada sob demanda (`React.lazy`): o Recharts (366 KB) só baixa ao abrir a aba, e a Home fica em 527 KB.
- Gráficos com **linha reta** entre os dias, não curva suavizada: a curva inventava picos entre os pontos, o que engana em dado de saúde. O eixo mostra só o mínimo e o máximo; a linha de base aparece tracejada no gráfico e com o valor na legenda.
- A frase de tendência conta os dias seguidos, até hoje, fora da linha de base do mesmo lado, pela mesma regra de demonstração. O exemplo do plano sai igual para o sono: "Below your baseline for 4 days in a row."
- **Tripulação com cinco colegas, não quatro.** O plano pede quatro colegas e, ao mesmo tempo, "5 of 6 done today" e "seis pessoas confinadas". Fiquei com seis pessoas (cinco colegas e o tripulante), para a meta coletiva fechar: começa em 4 de 6 e vai a 5 de 6 quando a pessoa completa a rotina.
- Os pontos da semana do tripulante somam `game.weekPointsBeforeToday` (360, simulado) aos pontos dos últimos 7 dias, para ele não aparecer zerado contra colegas com a semana cheia.
- No histórico, um check-up refeito no mesmo dia aparece com "redo · 0".
- As respostas comportamentais ao longo do tempo viraram uma tabela: uma linha por pergunta, uma coluna por check-in (até os 7 mais recentes), sem soma.

