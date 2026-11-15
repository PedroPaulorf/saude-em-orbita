---
tipo: plano
criada: 2026-11-14
estado: a implementar
para: agente de código que vai implementar (Claude Opus) e equipe
fontes: "avaliação do front em 14/11 com o app renderizado (API simulada, perfis NX-02, NX-04, NX-06 e conta vazia, em 1440, 1280, 1024, 820 e 390 px) e leitura do código; [[Plano do front-end v2]], [[Plano do front-end v3 - medicina preventiva]], [[Plano do assistente - monitoramento e plano de ação]]"
---
# Plano do front-end v4: UX e UI

Os planos v2, v3 e do assistente estão implementados. Este plano não acrescenta funcionalidade: corrige o que atrapalha a leitura das telas e dá ordem ao que já existe. Nada aqui muda regra de saúde, pontos, dados ou API.

**Prazo:** a submissão fecha domingo, 15/11, às 23h59, e as funcionalidades congelam às 15h. As fases estão em ordem de retorno por hora de trabalho. As fases 1 a 4 mudam o que aparece no vídeo; as fases 5 a 7 se cortam de baixo para cima.

## 1. Como trabalhar

- Branch `feat/front-v4-ux`, um commit por fase, PR para `main` ([[Equipe]] e `CONTRIBUTING.md`).
- Antes de começar: `cd frontend && npm run shots -- --out .shots/antes`. Depois de cada fase: `npm run shots -- --only <trecho do nome>` e **abra os PNG**. O comando sobe o Vite, simula a API com os tripulantes NEXUS-Med e grava cada tela sem precisar de banco (detalhes no cabeçalho de `frontend/scripts/ux-shots.mjs`). Perfis: `nx02` (Stable), `nx04` (Persistent change), `nx06` (Escalate), `empty`. Larguras: `desk` 1440, `tab` 820, `mob` 390.
- Ao fim de cada fase: `npm run lint`, `npm test` e `npm run build` limpos.
- Ao terminar, registre em "Desvios" (seção 7) o que ficou diferente do plano e atualize o `frontend/README.md` onde ele descrever algo que mudou.

### O que não pode mudar

1. **Regras do produto** (README do front, "Regras que o código segue"): estado sempre com ícone e palavra; "Simulated data" uma vez por tela, no cabeçalho; "Demonstration rule" em toda sinalização; nenhum texto com diagnóstico, previsão ou tratamento; pontos pelo que a pessoa faz; alvo de toque de 44 px; foco visível; `prefers-reduced-motion`.
2. **Textos da pesquisa:** os títulos dos padrões, `STATE_GUIDE` e `ESCALATE_PROTOCOL` (`src/lib/monitor.ts`) não se reescrevem.
3. **Lógica:** nada em `src/lib/` muda de comportamento, salvo o que uma fase pedir de forma explícita.
4. **Nomes que os testes de navegador usam** (`frontend/e2e/`). Eles precisam de banco e talvez você não consiga rodá-los, então preserve:
   - botões `Sign in`, `Log out` (visível logo depois do login, sem menu), `Next`, `Skip`, `Save check-up`, `Save check-in`, `250 ml`, `Simulated data`, `Load scenario`, `Send message`, `Open companion chat`, `Close companion`;
   - links `Back to Today`, `Back to Home`, `Medical data & sources`;
   - campos `Username`, `Password`, `Blood pressure (systolic/diastolic)`, `Sleep`;
   - títulos `Home` (pode continuar `sr-only`), `Prevention`, `Progress`, `Mission exposure`, `Head · Personal records`, `How are your urine and stool today?`;
   - o botão de conexão com `title` contendo `Select to sync now` e um `role="status"` dentro;
   - regiões do corpo com nome acessível começando por `Head:`, o atributo `data-body-model`, o diálogo `Companion`;
   - textos `No sleep measurements recorded.`, `Type a number from 0 to 24.`, `Demo reply`.
   
   Se uma mudança obrigar a trocar um desses nomes, troque também no teste e anote em "Desvios".

## 2. O que a avaliação encontrou

Do mais grave para o menos grave. "Print" é o nome do arquivo que `npm run shots` gera.

| # | Problema | Onde aparece | Causa no código |
|---|---|---|---|
| 1 | **A barra do companheiro cobre conteúdo em todas as telas.** No desktop ela tapa o cartão Report, a terceira Health note, as conquistas e o título do plano. No celular ocupa 76 px fixos acima das abas e cobre os rótulos do corpo e o botão Next do check-in | `nx04-home-desk-fold`, `nx04-progress-desk`, `nx04-prevention-desk`, `nx04-home-mob-fold` | `CompanionButton.tsx:113-116`: barra fixa de 440 × 76 px |
| 2 | **O estado do dia não tem lugar de destaque.** "Persistent change · score 50" só aparece como uma Health note no rodapé da Home, justamente a faixa que a barra cobre. A Home abre com três colunas de mesmo peso e nenhuma diz "como estou hoje e o que faço agora" | `nx04-home-desk` | `Home.tsx:81-125`: a grade não tem cartão de estado |
| 3 | **Fundo laranja e vermelho saturado na página inteira** (estados Watch, Persistent change e Escalate). Cansa, deixa os selos vermelhos e amarelos sem contraste com o que está em volta e dá a impressão de erro do sistema | `nx04-*`, `nx06-*` | `styles/theme.css:62-67` |
| 4 | **Laranja com quatro significados:** botão principal, selo "Flagged for ground", ícone de cartões e etiqueta "Today". Com o fundo laranja, o botão principal some | todas | `ui/button.tsx:13`, `Panel.tsx:8`, `RoadmapPanel.tsx:13` |
| 5 | **Detailed stats com região aberta chega a 13.500 px de altura** (16.000 px no celular): um cartão de 140 px por registro, 30 registros por medida, quatro medidas no peito | `nx04-stats-chest-desk` | `Stats.tsx:20-25` |
| 6 | **Cabeçalho quebra entre 768 e 1279 px:** "Detailed stats", "Day 19", "Simulated data" e "Server synced" partem em duas linhas | `nx04-home-tab` | `AppShell.tsx:145,168`: abas a partir de `md`, sem `whitespace-nowrap` |
| 7 | **O separador "·" cola na palavra seguinte** ("change ·score 50", "Mood ·stress ·rest", "Escalate ·Day 14"). O glifo da Overpass é torto; o componente `Dot` resolve, mas 35 arquivos ainda usam o caractere | todas | fonte Overpass |
| 8 | **Não aparece quem está conectado.** O cabeçalho mostra dia e rank, mas não o tripulante. O rank usa nomes de cargo: o perfil "Flight Engineer" aparece com o selo "Pilot" | cabeçalho | `App.tsx:93` |
| 9 | No celular, a Home começa pela figura do corpo (≈ 650 px). Rotina e check-ups, que são a ação do dia, ficam abaixo da dobra | `nx04-home-mob` | ordem do DOM em `Home.tsx` |
| 10 | Nos check-ups do celular, as abas e a linha de rank continuam na tela e empurram Next para fora da dobra no teste de reflexos | `nx04-check-behavioral-mob-fold` | `AppShell.tsx:178,185` |
| 11 | Prevention: três colunas do roteiro com a mesma largura, embora só "Today" tenha conteúdo; a linha de evidência em fonte mono de 12 px quebra mal; dois botões amarelos iguais "Log a water serving" com 32 px de altura | `nx04-prevention-desk` | `RoadmapPanel.tsx:92`, `RoadmapStep.tsx:67,79` |
| 12 | Detalhes: erro do login em `text-flag-mark` (≈ 3,6:1, abaixo de 4,5:1); campos do login com 36 px; "Verifying your session…" sem estilo; aviso "+25 points" cai em cima do cartão "Saved."; histórico do Progress corta o sexto item sem indicar rolagem | `login-desk`, fim do check-in | `Login.tsx:16`, `ui/input.tsx:10`, `App.tsx:44`, `AppShell.tsx:211`, `Progress.tsx:133` |

O que está bom e fica como está: a figura do corpo com os rótulos, o fluxo de uma pergunta por etapa, o cartão de clima espacial, o painel do chat, os gráficos do Progress, os estados vazios e os textos de procedência.

**Aviso para a equipe (não é tarefa deste plano):** `npm run import:nexus` prende "hoje" à data da importação. No dia seguinte, a Home mostra "No measurements recorded today" para todas as contas NX. Rode `npm run import:nexus -- --reset` no dia da gravação.

## 3. Decisões de desenho

Testei as três primeiras no navegador antes de escrever.

1. **O fundo continua seguindo a saúde, em tom escuro.** Watch e Persistent change: `#3d1608`. Escalate: `#4a0a02`. A página ainda muda de cor de forma evidente, e os cartões e selos voltam a se destacar. Cor sólida, sem degradê (regra do v3).
2. **Botão principal branco** (`bg-white text-sa-deep`). Laranja e vermelho ficam só para estado sinalizado; amarelo, só para atenção. É o que o botão "Notify ground" já faz na faixa de Escalate. Continua valendo uma ação principal por tela.
3. **Ponto "·" corrigido na fonte, não em cada texto:** uma `@font-face` que cobre só o caractere U+00B7 com a Fira Sans. Resolve os 35 arquivos de uma vez.
4. **Companheiro recolhido.** No desktop, um círculo de 64 px com o rosto, que abre a frase por alguns segundos ao carregar e ao passar o mouse. No celular, o rosto ocupa o centro da barra de abas.
5. **Cartão "Today" no topo da Home** com o estado do motor, os sinais principais e a única ação principal da tela.
6. **Histórico em linhas, não em cartões,** com os 7 registros mais recentes e "Show all".

As decisões 1 e 2 são de gosto e se desfazem em uma linha cada (`theme.css` e `button.tsx`). Se a equipe preferir o laranja no botão, mantenha as demais.

## 4. Fases

### Fase 1: correções globais (≈ 1 h)

**1.1 Ponto "·".** Em `src/index.css`, antes do `@theme`:

```css
/* O "·" da Overpass fica deslocado e cola na palavra seguinte: só esse caractere vem da Fira Sans. */
@font-face {
  font-family: "H7 Dot";
  src: url("../node_modules/@fontsource/fira-sans/files/fira-sans-latin-600-normal.woff2") format("woff2");
  unicode-range: U+00B7;
}
```

e `--font-sans: "H7 Dot", Overpass, system-ui, sans-serif;`. Confirme no `npm run build` que o arquivo da fonte entra em `dist/assets`. O componente `Dot` continua como está.
*Pronto quando:* em `nx04-home-desk` se lê "Persistent change · score 50" e "Mood · stress · rest" com espaço dos dois lados.

**1.2 Cabeçalho responsivo** (`AppShell.tsx`).
- Abas no topo a partir de `lg` (`hidden lg:block`); barra de abas inferior até `lg` (`lg:hidden`).
- `headerExtra` (rank e Log out) dentro do cabeçalho a partir de `xl`; abaixo disso, na segunda linha (`xl:hidden`).
- `whitespace-nowrap` nos links das abas, em "Day N", no chip "Simulated data" e no estado de conexão.
- Identidade: troque "Day 19" por "NX-04 · Day 19". Nome curto = `profile.nexus?.crewId ?? profile.displayName.split(' ')[0]`; passe por uma prop nova `crewLabel`. Na segunda linha (abaixo de `xl`), mostre o `displayName` completo à esquerda e rank e Log out à direita.
- Ajuste os outros pontos que dependem do mesmo corte: `pb-40 md:pb-28` do contêiner e os `md:` de posição em `CompanionButton.tsx` e `ChatPanel.tsx` (fase 1.3).

*Pronto quando:* nenhum item do cabeçalho quebra linha em 390, 820, 1024, 1280 e 1440 px. Para conferir 1024 e 1280, acrescente as duas larguras a `VIEWPORTS` em `scripts/ux-shots.mjs` enquanto trabalha.

**1.3 Companheiro que não cobre conteúdo** (`CompanionButton.tsx`, `AppShell.tsx`, `ChatPanel.tsx`). Continua sendo um único `<button>` com `aria-label`, `aria-expanded` e o `ref` de hoje.
- **A partir de `lg`:** fixo em `right-6 bottom-6`. Recolhido, é o círculo do rosto (64 px). Aberto, é a pílula atual com a frase. Abre por 8 s ao montar e a cada troca de rota, e enquanto estiver com hover ou foco; fora disso, recolhe. A troca de frase a cada 7 s só roda aberto. Recolhido e com estado diferente de `STABLE`, mostra um ponto de 10 px na borda do rosto, na cor do estado (prop nova `attention?: Status`, passada pelo `App.tsx`). Anime `max-width` e opacidade do texto; sem animação com `prefers-reduced-motion`.
- **Abaixo de `lg`:** o rosto (56 px) fica no centro da barra de abas. A barra passa a ter 5 colunas, com a do meio vazia; o botão fica `fixed bottom-1 left-1/2 -translate-x-1/2 z-40`, sem frase. A frase do dia passa a morar no cartão "Today" (fase 3).
- Nos check-ups continua oculto.
- Contêiner: `pb-24 lg:pb-10` no lugar de `pb-40 md:pb-28`.
- `ChatPanel.tsx:134`: confira a posição do painel acima do círculo (`lg:bottom-24`) e que, no celular, continua em tela cheia.
- Círculo de enviar da pílula: `bg-sa-neon-blue` no lugar de `bg-sa-rocket-600` (decisão 2).

*Pronto quando:* em `nx04-home-desk-fold`, `nx04-progress-desk` e `nx04-prevention-desk` nenhum texto fica atrás do companheiro; em `nx04-home-mob-fold` nada flutua sobre o conteúdo; `nx04-chat-desk` e `nx04-chat-mob` abrem como antes.

**1.4 Miúdos.**
- `Login.tsx:16`: `text-flag-mark` → `text-flag-ink`.
- `ui/input.tsx`: altura `h-9` → `h-11` (confira o formulário de `MedicalData.tsx`).
- `App.tsx:44`: tela de espera centralizada, com a marca "Health7" e "Verifying your session…" em `text-ink-soft`, no mesmo alinhamento da tela de login.
- `AppShell.tsx:211`: `Toaster` em `top-right`, para o aviso de pontos não cair sobre o cartão central.

### Fase 2: cor (≈ 45 min)

**2.1 Fundo** (`styles/theme.css:62-67`): `watch` → `#3d1608`; `alert` → `#4a0a02`. Atualize o comentário.

**2.2 Botão principal** (`ui/button.tsx:13`): `default: "bg-white font-bold text-sa-deep hover:bg-white/90"`. Em `EscalateBanner.tsx:60`, remova as classes que repetiam isso. Corrija os comentários que falam em amarelo ou laranja como ação principal (`button.tsx`, `CheckUpCards.tsx`, `CheckFlow.tsx`, `Home.tsx`) e a frase do README ("um amarelo sólido por tela").

**2.3 Cor só para estado.**
- `Panel.tsx`: os ícones de cartão usam só os azuis. Health check-up `blue`; Behavioral check-in `sky`; Body `sky`; Today's routine `blue`; Report `blue`; Health notes e roteiro `blue`. Remova os tons `orange`, `yellow` e `red` se ficarem sem uso.
- `CheckFlow.tsx:67`: ícone da etapa em `bg-surface-2 text-interactive`.
- `RoadmapPanel.tsx:12-16`: "Today" em `bg-white text-sa-deep`; "Next 3 days" e "This week" com borda (`border border-hairline-strong text-ink-soft`).
- `RoadmapStep.tsx:52`: passo feito em `bg-sa-neon-blue` (laranja num item concluído lê como alerta).
- `RoadmapStep.tsx:79`: "Log a water serving" vira `Button variant="secondary" size="sm"` (44 px, neutro).
- Não mexa em `StatusBadge`, na figura do corpo, na faixa de Escalate nem nas bordas de destaque dos cartões: ali a cor é estado.

*Pronto quando:* em `nx04-home-desk` e `nx06-home-desk`, laranja e vermelho aparecem só em selos, regiões do corpo, bordas de destaque e na faixa de Escalate; cada tela tem um único botão branco.

### Fase 3: Home com o estado do dia no topo (≈ 1 h 30)

**3.1 Extraia `StateLine`** de `RoadmapPanel.tsx:19-46` para `components/app/MonitorStateLine.tsx`, sem mudar o que ela mostra, e use o mesmo componente nos dois lugares.

**3.2 Novo `components/app/TodayCard.tsx`,** primeiro item da grade da Home, ocupando a largura toda:
- À esquerda: `StateBadge`, "score N", "Day N" e a frase do estado com os sinais principais (o conteúdo de `StateLine`), mais o `DemoTag`. Sem ícone de cartão. Borda de destaque do estado (`accent` do `Panel`).
- Abaixo da frase, em `text-ink-soft`: a primeira frase do companheiro (`lines[0].text`, que o `App.tsx:66` já calcula; passe para a Home por prop). É o texto que saiu da barra no celular.
- À direita (embaixo, no celular): **a única ação principal da tela**, escolhida nesta ordem:
  1. `ESCALATE`: sem botão principal (a faixa vermelha já tem "Notify ground"); link "See the protocol" para `#/prevention`.
  2. check-up de saúde pendente: botão "Start health check-up" para `#/check/health`.
  3. check-in comportamental pendente: botão "Start behavioral check-in".
  4. estado diferente de `STABLE`: botão "Open roadmap" para `#/prevention`.
  5. senão: texto "Today's routine is done." sem botão.
- Os botões Start dos dois cartões de check-up deixam de ser principais: passe `primary={false}` (viram `outline`). O `aria-label` deles continua "Start health check-up" e "Start behavioral check-in"; no botão do cartão novo use o texto visível como nome.

**3.3 Ordem e grade** (`Home.tsx`).
- DOM (ordem do celular): Today, rotina, Health check-up, Behavioral check-in, Body, Health notes, clima espacial, Report.
- Desktop (`xl`): Today na linha 1 com `col-span-3`; as três colunas descem uma linha; Health notes na última. Ajuste `xl:grid-rows` e os `row-start`.
- Body no celular: `--avatar-h: 260px`.
- `HealthNotes`: filtre na Home as notas `kind === 'state'` e `kind === 'pending'`, que agora estão no cartão Today. Se não sobrar nota, não renderize a faixa.

**3.4 Health check-up** (`CheckUpCards.tsx:52`): até 5 medidas a partir de `xl` e 3 abaixo; se houver mais medidas registradas, um link "+N more" para `#/stats`.

*Pronto quando:* em `nx04-home-desk-fold` o estado e a ação aparecem sem rolar; em `nx04-home-mob-fold` a primeira dobra mostra o cartão Today e o início da rotina; `nx06-home-desk` mostra Escalate no cartão sem botão principal além de "Notify ground"; `empty-home-desk` pede o check-up; `nx02-home-desk` (Stable) continua limpo.

### Fase 4: Detailed stats legível (≈ 1 h)

**4.1 Histórico em linhas** (`Stats.tsx`, `MeasurementHistory`).
- Cada registro vira uma linha de ≈ 44 px: data e hora (mono), valor com unidade, `StatusBadge` quando houver avaliação salva, e um `details` "Measurement details" que abre abaixo com a procedência e o `AssessmentDetails` de hoje.
- Mostre os 7 mais recentes. Se houver mais, um botão "Show all N records" (estado local por medida).
- Em telas largas, as medidas da região em duas colunas (`lg:grid-cols-2`).
- Mantenha o título `{Região} · Personal records` e a frase `No {medida} measurements recorded.`

**4.2 "Today's measures" mais curta** (`DetailedStats.tsx:101-131`): valor em 28 px no lugar de 40 px; a linha de procedência e "Local comparison preview" só no item selecionado.

**4.3 Sintomas** (`Stats.tsx`, `SymptomList`): a lista de eventos em linhas com data em mono à esquerda. Sem mudança de conteúdo.

*Pronto quando:* `nx04-stats-chest-desk` tem menos de 3.500 px de altura e `nx04-stats-chest-mob` menos de 6.000 px, com os mesmos dados acessíveis.

### Fase 5: check-ups sem distração (≈ 30 min)

- `AppShell.tsx`: em rotas `/check`, esconda a barra de abas inferior e a segunda linha do cabeçalho. O link "Home" do `CheckFlow` já é o caminho de volta.
- `CognitiveTests.tsx:139`: "Start 1" → "Attempt 1" (o rótulo atual lê como botão).
- `CheckFlow.tsx:43`: em telas baixas o Next do teste de reflexos precisa caber: reduza o respiro vertical do formulário no celular (`gap-4 p-4`) se ainda ficar fora da dobra.

*Pronto quando:* em `nx04-check-behavioral-mob-fold` os botões Cancel, Skip e Next aparecem sem rolar.

### Fase 6: Prevention (≈ 45 min)

- `RoadmapPanel.tsx:92`: `lg:grid-cols-[2fr_1fr_1fr]`.
- `RoadmapStep.tsx:67`: a linha de evidência (`step.why`) em `text-[13px] text-ink-soft` na fonte normal.
- `PatternCard.tsx`: a linha inteira do sinal vira o link para Detailed stats, com uma seta à direita, no lugar de um "See in Detailed stats" por sinal. Linha sem medida continua sem link.
- Confira que a tela tem um único botão branco ("Start plan", quando houver plano sugerido).

### Fase 7: acabamento (≈ 30 min)

- `Progress.tsx:133`: histórico com 5 itens e "Show all", sem `max-h-96`.
- `Progress.tsx`: o cartão "Body mass" entra na mesma grade de duas colunas dos outros gráficos; a coluna de pontos da tripulação ganha o cabeçalho "pts this week".
- `GameBits.tsx`, `RankChip`: texto visível "Rank: Pilot" a partir de `xl`, para o rank não se confundir com o cargo.
- `MedicalData.tsx`: o link "Back to Home" no mesmo estilo do link "Home" do `CheckFlow` (texto mantido).
- `Login.tsx`: abaixo do formulário, uma linha com os usuários de demonstração (`crew02`, `crew03`, `nx01` a `nx06`). Só os nomes, nunca a senha.

## 5. Fora do escopo

- Tema claro, internacionalização e novas telas.
- Mostrar o último valor conhecido quando hoje não tem check-up (mexe em `lib/health.ts` e nos testes; fica para depois da submissão).
- Trocar os nomes dos ranks (decisão de conteúdo da equipe).
- Qualquer mudança no backend, no motor de regras ou nos fluxos do n8n.

## 6. Conferência final

1. `npm run lint`, `npm test`, `npm run build`.
2. `npm run shots -- --out .shots/depois` e comparação com `.shots/antes` nos quatro perfis e três larguras.
3. Navegação por teclado na Home: Tab chega ao botão do cartão Today antes dos cartões; o companheiro abre com Enter e devolve o foco ao fechar.
4. Se houver banco de testes: `npm run test:e2e`.
5. Critérios da seção 2 revistos, um a um.

## 7. Desvios

*(preencher na implementação)*
