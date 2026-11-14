# Decisões

| Data | Tema | Decisão | Motivo | Responsável | Revisar quando |
|---|---|---|---|---|---|
| 2026-11-05 | Organização inicial | Cinco áreas e documentação em português | Preparar distribuição | Proposta inicial | Primeiro encontro |
| 2026-11-05 | Nome | Saúde em Órbita, provisório | Identificar pasta e cofre | Proposta inicial | Equipe escolher nome |
| 2026-11-14 | Nome do sistema | O sistema se chamará **Health 7** (Saúde em Órbita fica só como nome da pasta e do cofre) | Equipe definiu o nome do produto | Equipe | Se a identidade visual pedir ajuste |
| 2026-11-05 | Visibilidade | Repositório privado | Preferência do participante | Participante | Se a equipe solicitar |
| 2026-11-14 | Stack | Front-end em React + TypeScript + Tailwind + shadcn/ui, **sem servidor próprio**; publicado como site estático (GitHub Pages ou Vercel) | Os juízes avaliam o demo e a interface, não o back-end; cabe no prazo de domingo. Ver [[Escopo do protótipo]] | Equipe | Se o demo exigir dois aparelhos sincronizados |
| 2026-11-14 | Armazenamento | Dados do app salvos no **localStorage** do navegador, em JSON; dados simulados de exemplo carregados de um arquivo JSON do repositório na primeira abertura | Garante que os check-ups ficam salvos sem servidor; funciona sem conexão. Limitação: os dados ficam só naquele navegador | Equipe | Se o volume ou as consultas pedirem IndexedDB |
| 2026-11-14 | Dado real da NASA | Usar a API **DONKI** (clima espacial) num cartão do painel ligado ao risco de radiação, com cópia local em JSON para funcionar sem conexão. Ver [[DONKI - clima espacial da NASA]] | Coloca dado da NASA no centro do projeto (critério Relevance), como fez o PureFlow em 2025 | Yvens (estudo e implementação) | Se a API ficar fora do ar no dia do demo |

| 2026-11-14 | Direção visual | Front v2 mantém a paleta do design system e larga as regras de forma do guia do Space Apps (borda de 2px em tudo, sem sombra, fundo único): cartões em camadas, borda fina, um amarelo sólido por tela. Ver [[Plano do front-end v2]] | A equipe achou a v1 feia; o guia do evento vale para o material do evento, não obriga a interface. **Proposta aplicada no código, a confirmar pela equipe** | Plano v2 (implementado por Claude Opus) | Se a equipe preferir voltar às regras do guia |
| 2026-11-14 | Gamificação | Pontos e ranks pela rotina diária (check-ups e água), nunca pelo valor medido; ninguém perde ponto; meta de água de demonstração (8 × 250 ml); tripulação fictícia com meta coletiva em destaque | Dar motivo para a rotina diária sem incentivar registrar números melhores que os reais | Equipe | Se a pesquisa achar fonte para a meta de água |
| 2026-11-14 | Chat de IA | Companheiro de conversa ligado a um webhook do n8n, **sem orientação médica**, com o prompt no fluxo do n8n; a conversa não entra no relatório para o solo. Revê o "IA: adiar" de [[Escopo do protótipo]] | Isolamento e confinamento citados no desafio; risco de mudanças comportamentais do HRP | Equipe (fluxo: Yvens) | Se o webhook não estiver pronto até o congelamento |
| 2026-11-14 | Solução: medicina preventiva | O Health 7 centraliza os dados de saúde do tripulante, compara com padrões de sinais e propõe um plano gamificado para voltar ao normal; para o que não se mede no corpo (câncer), acompanha a radiação recebida na missão. Ver [[Plano do front-end v3 - medicina preventiva]] | Dá um norte à solução e propósito à gamificação; ideia validada com a Valéria | Equipe | **A confirmar:** a forma proposta no plano v3 (falar em "sinais precoces", sem prever doença; três padrões no demo; plano só com ações de rotina; dose de radiação simulada) |

## Em aberto: 

- Nome dos membros: Pedro Paulo, Yvens Almeida, Pedro Herique, João Eduardo, Arthus Almeida, Valeria
- 9/11 - 12/11 Período de decisão e entrega do protótipo
- Escopo e indicadores (proposta em [[Escopo do protótipo]]).
- Funcionamento sem conexão e atraso de comunicação, se relevantes à proposta.

