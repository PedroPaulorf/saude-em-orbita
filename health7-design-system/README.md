Sistema visual do Health7, o protótipo de check-up diário para astronautas, feito segundo o guia de marca do NASA Space Apps Challenge (atualizado em 25 de junho de 2026). Azul em quase tudo, Neon Yellow como acento, tipografia Fira Sans e Overpass.

## Princípios

- **Simples, sério e intuitivo.** Formas planas, borda de 2px, sem sombras.
- **Azul primeiro.** Cerca de 60% da tela em `ground`, 30% nos outros azuis, 10% em `accent`.
- **Cor nunca sozinha.** Todo estado leva ícone e palavra junto da cor, como o guia pede.
- **Contraste de 4,5:1 ou mais** em todo par de texto e fundo.
- **Sem marca oficial da NASA.** Não usar o logotipo da NASA nem identificadores de missão. O logo do Space Apps não faz parte da interface do Health7.

## Cor

- Texto só fica sobre três fundos: Deep Blue, Electric Blue ou White. Na prática: `ground` (Deep Blue no tema Deep Blue, branco no tema White) e `panel` (Electric Blue).
- Sobre `ground`: texto em `ink`, apoio em `ink-muted`.
- Sobre `panel`: só `on-panel`. `ink-muted` não tem contraste ali.
- `accent` (Neon Yellow) é para botão principal, selo de atenção e símbolos. Nunca como fundo de área. Texto sobre ele sempre em `on-accent`.
- Neon Yellow como texto só no tema Deep Blue, e só em links (`link`). Não usar em títulos.
- Rocket Red (`alert-mark`) nunca é fundo de texto: só bordas e marcas. O selo sinalizado usa Martian Red (`alert`) com `on-alert`.
- Cartões, campos e botões secundários: borda de 2px em `line`.
- Barra superior: degradê linear a 45°, de `panel` no alto à esquerda para `deep` embaixo à direita, suave, sem faixa visível.
- Foco de teclado: contorno de 2px em `ink`, com 2px de afastamento.

### Estados de uma medida

| Estado | Preenchimento | Texto | Ícone e palavra |
| --- | --- | --- | --- |
| Dentro da linha de base | `ground` com borda `line` | `ink` | check · "Within baseline" |
| Atenção (desvio da linha de base) | `accent` | `on-accent` | seta de tendência · "Attention" |
| Sinalizado para o solo | `alert` com borda `alert-mark` | `on-alert` | antena · "Flagged for ground" |

### Selos de origem do dado

- Dado simulado: borda tracejada e texto em `ink-muted`, palavra "Simulated".
- Regra de demonstração: borda contínua em `ink-muted`, texto em `ink`, palavra "Demonstration rule".
- Dado real (DONKI, HRP): borda e texto em `link`, palavra "Live NASA data", com link para a fonte.

## Tipografia

- Títulos em Fira Sans Black, maiúsculas, 5% de espaçamento entre letras (`display`, `h1`).
- Subtítulos em Overpass: `h2` em Regular, `h3` em SemiBold maiúsculas.
- Texto em Overpass Regular (`body`, `body-sm`); botões em Overpass Bold (`button`).
- Todo número medido em Fira Code: `reading` para o valor, `reading-sm` para unidade, linha de base e horário.
- As três famílias vêm do Google Fonts.

## Espaço e forma

- Padding de cartão `space-4`; entre cartões `space-6`; entre seções `space-8`.
- Botões, campos e selos com `radius-sm`; cartões com `radius-md`; círculos e o indicador de conexão com `radius-pill`.
- Alvo de toque mínimo de 44px de altura.
- Padrões de fundo (órbitas, coordenadas, ondas): uma cor só, a cerca de 25% de opacidade, sobre um azul.
- Fotos sempre dentro de uma forma (retângulo ou círculo), sem texto por cima.

## Figura do corpo

- Silhueta 2D em traço `ink` de 2px sobre `ground`.
- Região dentro da linha de base: sem preenchimento. Em atenção: `accent`. Sinalizada: `alert-mark`.
- Cada região marcada leva um rótulo de texto ao lado.

## Texto da interface

- Interface, página do projeto e slides em inglês.
- Frases curtas, voz ativa, segunda pessoa: "How did you sleep last night?".
- "Behavioral health check-in", nunca "sanity".
- O app informa e encaminha; não diagnostica. Escrever "differs from your baseline", não "abnormal".
- Preferir rótulo de texto a símbolo sempre que o símbolo puder ser ambíguo.

## Ícones

Feather ou Phosphor, estilo de linha, traço uniforme, em tamanhos de 16, 24 ou 32px, na cor do texto ao lado. Nenhum arquivo de ícone está guardado neste sistema.

## Componentes e telas

- As classes ficam em `components/bundle.css`, com prefixo `h7-`, dentro de um contêiner `.h7`. Todos os valores vêm dos tokens.
- Uma ação em `accent` (`h7-btn--primary`) por tela.
- Todo valor de saúde simulado aparece com o selo "Simulated"; toda sinalização, com a regra por escrito e o selo "Demonstration rule".
- VitalCard tem duas opções de formato (A, número primeiro; B, linha de tendência). Use uma só por tela.
- O painel tem duas opções de layout: DashboardA (figura do corpo no centro) e DashboardB (tendências primeiro).

## Uso com Tailwind e shadcn/ui

| Variável do shadcn | Token |
| --- | --- |
| `--background`, `--card` | `ground` |
| `--foreground` | `ink` |
| `--muted-foreground` | `ink-muted` |
| `--primary` | `accent` |
| `--primary-foreground` | `on-accent` |
| `--secondary` | `inverse` |
| `--secondary-foreground` | `on-inverse` |
| `--destructive` | `alert` |
| `--border`, `--input` | `line` |
| `--ring` | `ink` |
| `--radius` | `radius-sm` |
