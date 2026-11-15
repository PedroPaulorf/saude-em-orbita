# Health7 — front-end

React + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui, integrado ao backend Node/Fastify com PostgreSQL. Login, perfil, check-ups e sintomas são individuais. O navegador mantém uma fila e um cache por conta. Água, planos e conversa ficam localmente, também separados por conta. Os planos estão em `cofre/01 Organização/`: `Plano do front-end v2.md` (visual, telas, pontos, chat) e `Plano do front-end v3 - medicina preventiva.md` (padrões de sinais, plano de volta à linha de base, radiação).

## Rodar

Primeiro configure o PostgreSQL e inicie o backend seguindo `../backend/README.md` (porta 3001). Cadastre as contas fictícias com `npm run seed` no backend e a senha definida em `DEMO_PASSWORD`. Use `crew02` ou `crew03` para entrar; a segunda conta tem o avatar feminino. As contas começam sem registros de saúde.

```sh
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # gera dist/ (site estático para GitHub Pages ou Vercel)
npm run lint
npm run data:risks # regenera src/data/hrp-risks.json a partir das notas do cofre
npm run data:donki # atualiza a cópia local do DONKI (src/data/donki-snapshot.json)
npm run shots      # prints de todas as telas com a API simulada, sem banco (scripts/ux-shots.mjs)
```

Chat do companheiro: copie `.env.example` para `.env.local` e preencha `VITE_N8N_CHAT_WEBHOOK_URL` (ver "Chat de IA" abaixo). Sem isso o chat roda em modo de demonstração.

`VITE_API_URL` pode definir a origem do backend (ex.: `http://localhost:3001`); por padrão é o mesmo hostname do frontend na porta 3001. O backend precisa incluir a origem exata do frontend em `CORS_ORIGINS`. A sessão usa cookie HttpOnly; mantenha o mesmo hostname nos dois serviços.

### Login, registros e sincronização

- Escolha um avatar para entrar. Nos oito perfis fictícios (`nx01` a `nx06`, `crew02` e `crew03`), a senha pública `senha123` já vem preenchida: basta pressionar Enter ou clicar em **Sign in**. Se o backend usar outro `DEMO_PASSWORD`, configure o mesmo valor em `VITE_DEMO_PASSWORD` e reinicie/recompile o frontend. **Use another account** mantém a entrada manual sem senha preenchida.
- Se os perfis não carregarem, o login informa que a demo está indisponível e oferece **Try again**, em vez de trocar silenciosamente para o formulário manual. O frontend, a API e o PostgreSQL precisam estar disponíveis; em uma demo publicada, `VITE_API_URL` deve apontar para a API hospedada.
- O perfil autenticado define nome, avatar e linha de base. Valores ausentes aparecem como ausentes, sem usar o histórico fixo do JSON como medições pessoais.
- Os check-ups de saúde e comportamental continuam separados. Cada registro recebe um identificador estável, fica na fila da própria conta e é enviado ao servidor. `Sync now` e a reconexão repetem o envio sem duplicar registros.
- Login e restauração da sessão exigem o servidor. Após autenticação, falhas de conexão conservam os registros pendentes. Ao sair ou trocar de conta, o app limpa a tela e impede respostas atrasadas de aparecerem na nova conta.
- O avatar abre os registros e sintomas da região selecionada. A consulta apresenta os últimos 30 dias, até 100 registros, e informa quando o histórico foi limitado. Os gráficos mostram somente datas com medições, preservando lacunas.
- Água, planos e chat ainda não são sincronizados entre dispositivos. O cache antigo sem dono não é migrado automaticamente. Radiação e comparação com a tripulação continuam sendo demonstrações identificadas.
- A API aceita as sete medidas. Saturação, frequência respiratória e massa corporal aparecem sem dado até um registro fornecê-las; não há aparelho conectado. Comparações exigem linha de base cadastrada no perfil.
- O banco agora separa Pessoa, Saúde e Ambiente: peso fica em Pessoa, e Saúde inclui os relatos opcionais `healthDetails.urine` e `healthDetails.stool`. O cliente preserva esses relatos na fila; os novos formulários e a adaptação visual da lista antiga de medidas ainda não estão incluídos. Contrato em `../backend/DATABASE.md`.
- Os cenários adicionam registros fictícios à conta conectada e os colocam na fila para o servidor. Água e planos locais dessa conta são substituídos; registros existentes no servidor e conversa são preservados.
- Sincronizar com o backend não envia relatórios para a Terra. O chat com n8n continua sendo uma integração opcional separada.

Validação: `npm test`, `npm run lint`, `npm run build`. Para os testes no navegador, configure `TEST_DATABASE_URL` com um banco PostgreSQL exclusivo de testes e rode `npm run test:e2e`; o executor cria e remove um schema temporário. Instale o Chromium do Playwright ou defina `PLAYWRIGHT_EXECUTABLE_PATH`.

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
| `src/lib/health.ts` | Medidas pessoais de hoje e histórico dos últimos 7 dias UTC; ausência explícita de dados; regras de demonstração e regiões do corpo |
| `src/lib/storage.ts` | Check-ups por conta, com `kind: 'health' \| 'behavioral' \| 'combined'` e estado de sincronização |
| `src/lib/water.ts` | Registro local de água por conta e dia UTC (`health7:water:v2:<conta>`) |
| `src/lib/session.ts`, `api.ts`, `active-profile.ts` | Sessão autenticada, perfil ativo, fila de envio e proteção contra troca de conta |
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

- **Medidas e origens.** Sete medidas: quatro perguntadas no check-up (`input: "manual"`) e três previstas para aparelho (`"device"`: saturação, frequência respiratória, massa corporal). Cada uma tem `source` em `simulated.json`; esses nomes descrevem a origem prevista. Não há aparelho real conectado.
- **Padrões.** Um sinal é de medida (fora da linha de base de um lado por N dias seguidos), de autorrelato (resposta de hoje) ou de água (meta perdida nos últimos N dias). Incluir um padrão é incluir um item em `conditions.json`.
- **Plano.** Passos automáticos (check-ups, meta de água) e manuais (caixas). Pontos: 5 por passo marcado, 10 pelo dia completo, 50 pelo plano. Um plano por vez.
- **Cenários de demonstração.** "Day 1 · signs appear", "Day 3 · plan under way", "Day 5 · back within baseline" adicionam check-ups fictícios e substituem água e planos locais da conta conectada.

## Regras de alerta

São **regras de demonstração**, sem fonte clínica. Os limites ficam em `src/data/simulated.json` (`rule`: direção, desvio para atenção e para sinalizar). A meta de água (8 × 250 ml) também é de demonstração (`game.waterGoal`).

## Motor de monitoramento (NEXUS-Med)

`src/lib/monitor.ts` é a **regra que decide**; a IA, quando houver, só explica. Função pura, roda no aparelho. Recebe perfil, check-ups, sintomas, testes cognitivos e ambiente e devolve, para hoje e para cada dia anterior: um dos quatro estados da pesquisa (STABLE, WATCH, PERSISTENT CHANGE, ESCALATE), um score de 0 a 100, os sinais que formaram os dois e o texto da pesquisa para o estado (`05_Alert_Guide`, sem reescrever).

- **Score é intensidade**, nunca probabilidade nem porcentagem: `min(100, 8 × pontos das medidas + 6 × sintomas + 4 × dias de persistência)`.
- **Estado pela regra:** ESCALATE com red flag (pergunta de alerta do check-up, sintoma de alerta, SpO₂ ou desconforto no flanco com temperatura sinalizada, dor de cabeça forte); PERSISTENT CHANGE com duas ou mais medidas fora (ou uma e um sintoma) por 2 dias seguidos; WATCH com qualquer medida fora ou sintoma; dias 1 a 3 de voo não passam de WATCH, salvo red flag.
- **Linhas de base:** pré-voo (perfil) e em voo (mediana de 14 dias, sem os dias de mudança em várias frentes). Limiares por medida iguais aos de `backend/src/medical.ts`, mais micções em 24 h (2 e 3 abaixo).
- **Calibração** contra o gabarito da planilha em `monitor.test.ts`; a tabela de concordância e os desacordos explicados estão em `../dados/README.md`.
- Versão `health7-nexus-2026-11-14-v1`, registrada pelo servidor em `medical_rules`. Mudou limiar ou peso, muda a versão.

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

### Fluxos no n8n (pasta "health7")

A regra do app (`monitor.ts`) decide o estado, o score e os sinais; os fluxos só escrevem em cima disso. Endereços em `.env.example`.

| Fluxo | Variável | Recebe | Devolve | Proteções |
|---|---|---|---|---|
| `[H7] Assistente` | `VITE_N8N_CHAT_WEBHOOK_URL` (`/webhook/h7-assistente`) | `{ sessionId, message, context }`, com `context.prevention.monitor` (estado, score, sinais) e os padrões com o texto seguro | `{ reply }` | AI Agent (OpenAI) com memória por `sessionId`; prompt proíbe diagnóstico, probabilidade, remédio e números inventados; filtro troca a resposta se aparecer palavra proibida; em ESCALATE só aponta o protocolo e a faixa vermelha |
| `[H7] Roteiro` | `VITE_N8N_ROADMAP_WEBHOOK_URL` (`/webhook/h7-roteiro`) | `{ mode, instructions, context }`, com `monitor` e `conditionSteps` | `{ headline, summary, phases }` | ESCALATE não passa pela IA (volta o protocolo fixo); palavra proibida devolve 422 e o app mantém o roteiro do aparelho; o `parseAiRoadmap` recusa formato errado |
| `[H7] Alerta` | `VITE_N8N_ALERT_WEBHOOK_URL` (`/webhook/h7-alerta`) | `{ crew, crewId, date, day, state, reasons, signals, ruleVersion }` do botão "Notify ground" | `{ ok, recordedAt, delivery: "crew-only", message }` | Sem IA; só aceita ESCALATE; por enquanto não envia nada para fora (o registro é a execução no n8n). Sem endereço ou sem rede, o horário fica no aparelho |

Os endereços não têm autenticação e ficam públicos no site: só dados fictícios.

## Credits

- **Figura do corpo** (`src/data/body-paths.ts`): traçados SVG de [@mjcdev/react-body-highlighter](https://github.com/MichaelMjc/react-body-highlighter) 0.0.4, de MichaelMJC, adaptação para web do [react-native-body-highlighter](https://github.com/HichamELBSI/react-native-body-highlighter) de HichamELBSI. Licença MIT, Copyright (c) 2022 ELABBASSI Hicham. Os traçados foram copiados (o pacote não é dependência); o componente `BodyAvatar` é nosso.
- **Componentes de interface**: [shadcn/ui](https://ui.shadcn.com) (MIT), sobre [Radix UI](https://www.radix-ui.com) (MIT). Gráficos: [Recharts](https://recharts.org) (MIT). Ícones: [Lucide](https://lucide.dev) (ISC). Avisos: [Sonner](https://sonner.emilkowal.ski) (MIT).
- **Fontes** servidas localmente via [Fontsource](https://fontsource.org): Fira Sans, Fira Code e Overpass (SIL Open Font License 1.1).
- **Dados**: NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information) e textos do NASA Human Research Program.

## Dados médicos e API

Acesse **Medical data & sources** pelo cartão Report após login para ver a fila da sua conta, avaliações versionadas, referências NTRS e cenários educativos privados. A integração usa o PostgreSQL, a sessão e o histórico individual existentes. Configure a API seguindo [Dados médicos e sincronização](../docs/medical-data.md).
