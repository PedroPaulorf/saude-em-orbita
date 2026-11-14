# Health7 — front-end

React + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui. Sem servidor: os dados ficam no `localStorage` do navegador. Os planos estão em `cofre/01 Organização/`: `Plano do front-end v2.md` (visual, telas, pontos, chat) e `Plano do front-end v3 - medicina preventiva.md` (padrões de sinais, plano de volta à linha de base, radiação).

## Rodar

```sh
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # gera dist/ (site estático para GitHub Pages ou Vercel)
npm run lint
npm run data:risks # regenera src/data/hrp-risks.json a partir das notas do cofre
npm run data:donki # atualiza a cópia local do DONKI (src/data/donki-snapshot.json)
```

Chat do companheiro: copie `.env.example` para `.env.local` e preencha `VITE_N8N_CHAT_WEBHOOK_URL` (ver "Chat de IA" abaixo). Sem isso o chat roda em modo de demonstração.

## Telas e rotas

Rota por hash, sem biblioteca (`src/lib/route.ts`): funciona no GitHub Pages com `base: './'` e com o botão voltar.

| Rota | Tela | O quê |
| --- | --- | --- |
| `#/` | `screens/Home.tsx` | Check-ups, avatar, rotina do dia, clima espacial, relatório e Health notes |
| `#/prevention` | `screens/Prevention.tsx` | Padrões de sinais precoces, plano de volta à linha de base, radiação da missão, planos anteriores. `?section=radiation` rola até a radiação |
| `#/check/health` | `screens/HealthCheckUp.tsx` | Check-up de saúde, uma medida por etapa |
| `#/check/behavioral` | `screens/BehavioralCheckIn.tsx` | Check-in comportamental, escala de 1 a 5, sem soma |
| `#/stats?region=head` | `screens/DetailedStats.tsx` | Avatar em foco, medidas e riscos do NASA HRP da região. `?risk=radiation` abre o risco de radiação |
| `#/progress` | `screens/Progress.tsx` | Rank, tendências de 7 dias (as três medidas de aparelho numa linha compacta), tripulação, conquistas e histórico com os dias de plano. Carrega sob demanda (Recharts) |

Em todas: cabeçalho (abas, tripulante, rank, chip "Simulated data", conexão) e o botão fixo do companheiro de IA. O chip "Simulated data" abre o diálogo **Demo data**, com os cenários de demonstração.

## Estrutura

| Pasta ou arquivo | O quê |
| --- | --- |
| `src/components/ui/` | Componentes do shadcn/ui (gerados; `button` e `dialog` ajustados para 44 px e para o tema) |
| `src/components/app/` | Componentes do Health7: `AppShell`, `BodyAvatar`, `StatusBadge`, cartões da Home, `CheckFlow`, `RegionPanel`, `TrendChart`, `ChatPanel`... |
| `src/screens/` | Uma tela por rota |
| `src/styles/theme.css` | Tokens v2 (superfícies, linha fina, texto de apoio, cores de estado), com o contraste anotado |
| `src/lib/health.ts` | Medidas de hoje e histórico dos últimos 7 dias UTC (check-up salvo no dia, senão o valor simulado); regras de demonstração (`evaluate`, `ruleText`); regiões do corpo |
| `src/lib/storage.ts` | Check-ups em `health7:checkins:v2`, com `kind: 'health' \| 'behavioral'`; migra o v1 |
| `src/lib/water.ts` | Registro de água por dia UTC (`health7:water:v1`) |
| `src/lib/game.ts` | Pontos, rank, sequência e conquistas, recalculados dos registros (nada guardado) |
| `src/lib/notes.ts` | Health notes por regra de demonstração |
| `src/lib/chat.ts` | Conversa, contexto enviado ao n8n, leitura da resposta e modo de demonstração |
| `src/lib/progress.ts` | Frases de tendência, histórico com pontos, tripulação |
| `src/data/conditions.json` | Os três padrões de sinais (regras de demonstração) com os planos, e a chave `demo` com os cenários |
| `src/lib/prevention.ts` | Avalia cada sinal (presente, ausente ou sem dado) e cada padrão (ativo quando chega a `minSigns`) |
| `src/lib/usePrevention.ts` | Hooks: padrões e plano em andamento, recalculados com check-ups, água e planos |
| `src/lib/plans.ts` | Plano de volta à linha de base (`health7:plans:v1`): dias, passos, resultado e pontos derivados |
| `src/lib/radiation.ts` | Dose da missão a partir da série simulada do dosímetro e o limite de carreira com fonte |
| `src/lib/demo.ts` | Monta e grava os cenários Day 1, Day 3 e Day 5 |
| `src/lib/present.ts` | Textos compartilhados (estados, resumo, idade do dado do DONKI) |
| `src/lib/donki/` | Cliente do DONKI, cópia local e modo histórico (`useSpaceWeather`) |
| `src/data/simulated.json` | Tripulante, linha de base, histórico, limites das regras e `game` (pontos, ranks, tripulação). **Dados fictícios.** |
| `src/data/hrp-risks.json` | Os 17 riscos do NASA HRP, texto original em inglês |
| `src/data/regions.ts` | Quais riscos cada região do corpo abre |
| `src/data/body-paths.ts` | Traçados SVG do corpo (ver Credits) |

O visual usa a paleta de [`../health7-design-system`](../health7-design-system) (`tokens.css`, importado em `src/index.css`), com as regras de forma da v2: cartão em `--surface-1` com borda fina, cor reservada para estado e ação, um amarelo sólido por tela. As classes `h7-` da v1 não são mais usadas.

### Cuidados com o Tailwind e o shadcn

- `bg-accent` é o hover sutil do shadcn (aponta para `--surface-2`). O amarelo é `bg-brand` / `bg-primary`. A variável CSS `--accent` continua sendo o Neon Yellow.
- Não existe utilitário `text-link`: na v1 ele era amarelo. Link de texto é `text-interactive underline`.
- Ao rodar `npx shadcn add`, confira os imports: o gerador já trouxe `cn` de um pacote npm chamado `cn` em vez de `@/lib/utils`.

## Regras que o código segue

- O app informa e encaminha; não diagnostica. Estado sempre com ícone e palavra (`StatusBadge`): "Within baseline", "Attention", "Flagged for ground".
- Dado simulado identificado uma vez por tela (chip "Simulated data" no cabeçalho). Toda sinalização com a regra por escrito e "Demonstration rule". Dado da NASA com "Live NASA data" e link.
- Pontos premiam o que a pessoa faz (check-up, água, passo do plano), nunca o valor medido. Ninguém perde ponto por uma medida.
- Padrão não é diagnóstico: a tela diz quantos sinais estão presentes e qual regra gerou cada um. Sem "disease", "diagnosis", "predict", "treatment". Todo padrão leva "Demonstration rule"; todo plano, "Suggested plan · not reviewed by a flight surgeon", e os dois entram no relatório para o solo.
- Radiação: dose medida (simulada) comparada com o limite de 600 mSv da NASA, com fonte. O app não converte clima espacial em dose nem estima risco.
- Alvo de toque de 44 px, foco visível, `prefers-reduced-motion` respeitado.

## Medicina preventiva (plano v3)

- **Medidas e origens.** Sete medidas: quatro perguntadas no check-up (`input: "manual"`) e três que chegam de aparelho (`"device"`: saturação, frequência respiratória, massa corporal), simuladas no demo. Cada uma tem `source` em `simulated.json`.
- **Padrões.** Um sinal é de medida (fora da linha de base de um lado por N dias seguidos), de autorrelato (resposta de hoje) ou de água (meta perdida nos últimos N dias). Incluir um padrão é incluir um item em `conditions.json`.
- **Plano.** Passos automáticos (check-ups, meta de água) e manuais (caixas). Pontos: 5 por passo marcado, 10 pelo dia completo, 50 pelo plano. Um plano por vez.
- **Cenários de demonstração.** "Day 1 · signs appear", "Day 3 · plan under way", "Day 5 · back within baseline" substituem check-ups, água e planos do navegador.

## Regras de alerta

São **regras de demonstração**, sem fonte clínica. Os limites ficam em `src/data/simulated.json` (`rule`: direção, desvio para atenção e para sinalizar). A meta de água (8 × 250 ml) também é de demonstração (`game.waterGoal`).

## Clima espacial (NASA DONKI)

Base `https://ccmc.gsfc.nasa.gov/DONKI-API/get/{recurso}`, só GET, sem chave, CORS liberado, até 60 dias por chamada.

| Indicador | Endpoint | Como aparece |
| --- | --- | --- |
| Partículas solares (principal, ligado à radiação) | `SEP` | Linha principal do cartão; detecções e previsões de modelo contadas à parte |
| Alerta original | `notifications?type=SEP` | Resumo e link, no diálogo de detalhes |
| Erupções | `FLR?class=ALL` | Maior classe e quantas são M ou X |
| Tempestades geomagnéticas | `GST` | Kp máximo |

O cartão não promete "agora": mostra a idade e a origem do dado ("Live · synced 2 min ago", "Last ground sync", "Stored copy", "Past event"). Sem conexão, usa a cópia mais nova entre o `localStorage` e `donki-snapshot.json`. Rode `npm run data:donki` antes do demo. "Show past event" mostra o SEP de 05/09/2026.

## Chat de IA (n8n)

Companheiro de conversa, não assistente médico. A personalidade e os limites ficam no nó AI Agent do n8n (prompt sugerido no plano); o site só envia a mensagem com o contexto do dia.

- `POST` em `VITE_N8N_CHAT_WEBHOOK_URL` com `{ sessionId, message, context }`; resposta `{ "reply": "..." }`. O leitor aceita `reply`, `output`, `text` ou `message`, num objeto ou lista, e texto puro.
- No n8n: Webhook em `POST` com resposta pelo nó "Respond to Webhook", **Allowed Origins (CORS)** liberando a origem do site, endereço de **produção** e memória do agente com chave `sessionId`.
- O endereço entra no pacote do site, então é público: nenhum segredo no front.
- Estados: sem conexão (campo desativado), esperando (desiste em 45 s), erro com "Try again", e modo de demonstração quando o endereço está vazio.
- O `context` inclui `prevention` (padrões ativos, plano em andamento, dose da missão simulada). O trecho de prompt para o nó AI Agent está na seção 9 do plano v3.
- A conversa fica no `localStorage` (`health7:chat:v1`) e **não entra no relatório para o solo**.

## Credits

- **Figura do corpo** (`src/data/body-paths.ts`): traçados SVG de [@mjcdev/react-body-highlighter](https://github.com/MichaelMjc/react-body-highlighter) 0.0.4, de MichaelMJC, adaptação para web do [react-native-body-highlighter](https://github.com/HichamELBSI/react-native-body-highlighter) de HichamELBSI. Licença MIT, Copyright (c) 2022 ELABBASSI Hicham. Os traçados foram copiados (o pacote não é dependência); o componente `BodyAvatar` é nosso.
- **Componentes de interface**: [shadcn/ui](https://ui.shadcn.com) (MIT), sobre [Radix UI](https://www.radix-ui.com) (MIT). Gráficos: [Recharts](https://recharts.org) (MIT). Ícones: [Lucide](https://lucide.dev) (ISC). Avisos: [Sonner](https://sonner.emilkowal.ski) (MIT).
- **Fontes** servidas localmente via [Fontsource](https://fontsource.org): Fira Sans, Fira Code e Overpass (SIL Open Font License 1.1).
- **Dados**: NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information) e textos do NASA Human Research Program.
