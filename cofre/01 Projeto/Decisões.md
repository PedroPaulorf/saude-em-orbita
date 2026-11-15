# Decisões

Em ordem cronológica. Quando uma decisão é substituída, a linha antiga fica e aponta para a nova.

| Data | Tema | Decisão | Motivo | Responsável | Revisar quando |
|---|---|---|---|---|---|
| 2026-11-05 | Organização inicial | Cinco áreas e documentação em português | Preparar distribuição | Proposta inicial | Primeiro encontro |
| 2026-11-05 | Nome | Saúde em Órbita, provisório. **Substituída** pela linha "Nome do sistema" | Identificar pasta e cofre | Proposta inicial | Equipe escolher nome |
| 2026-11-05 | Visibilidade | Repositório privado | Preferência do participante | Participante | Se a equipe solicitar |
| 2026-11-14 | Nome do sistema | O sistema se chamará **Health 7** (Saúde em Órbita fica só como nome da pasta e do cofre) | Equipe definiu o nome do produto | Equipe | Se a identidade visual pedir ajuste |
| 2026-11-14 | Stack | Front-end em React + TypeScript + Tailwind + shadcn/ui, sem servidor próprio, publicado como site estático. **Substituída** pela linha "Back-end com PostgreSQL" | Os juízes avaliam o demo e a interface; cabia no prazo. Ver [[Escopo do protótipo]] | Equipe | — |
| 2026-11-14 | Armazenamento | Dados do app no **localStorage**, em JSON, com dados simulados carregados na primeira abertura. **Substituída em parte** pela linha "Back-end com PostgreSQL": água, planos e conversa continuam locais | Salvar check-ups sem servidor e funcionar sem conexão | Equipe | — |
| 2026-11-14 | Dado real da NASA | Usar a API **DONKI** (clima espacial) num cartão do painel ligado ao risco de radiação, com cópia local em JSON para funcionar sem conexão. Ver [[DONKI - clima espacial da NASA]] | Coloca dado da NASA no centro do projeto (critério Relevance), como fez o PureFlow em 2025 | Yvens | Se a API ficar fora do ar no dia do demo |
| 2026-11-14 | Direção visual | O front v2 mantém a paleta do design system e larga as regras de forma do guia do Space Apps: cartões em camadas, borda fina, um amarelo sólido por tela. Ver [[Plano do front-end v2]] | A equipe achou a v1 feia; o guia do evento vale para o material do evento, não obriga a interface | Plano v2 | Se a equipe preferir voltar às regras do guia |
| 2026-11-14 | Gamificação | Pontos e ranks pela rotina diária (check-ups e água), nunca pelo valor medido; ninguém perde ponto; meta de água de demonstração (8 × 250 ml); tripulação fictícia com meta coletiva em destaque | Dar motivo para a rotina diária sem incentivar registrar números melhores que os reais | Equipe | Se a pesquisa achar fonte para a meta de água |
| 2026-11-14 | Chat de IA | Companheiro de conversa ligado a um webhook do n8n, **sem orientação médica**, com o prompt no fluxo do n8n; a conversa não entra no relatório para o solo. Revê o "IA: adiar" de [[Escopo do protótipo]] | Isolamento e confinamento citados no desafio; risco de mudanças comportamentais do HRP | Equipe (fluxo: Yvens) | Se o webhook não estiver pronto até o congelamento |
| 2026-11-14 | Back-end com PostgreSQL | API Node + Fastify com PostgreSQL, login individual, perfil e avatar por conta. Check-ups e sintomas ficam no banco, organizados em Pessoa, Saúde e Ambiente (ver `backend/DATABASE.md`) | Cada astronauta precisa ver só os próprios dados e manter histórico entre aparelhos | Yvens, Pedro, Arthus | Se o demo precisar rodar sem servidor |
| 2026-11-14 | Solução: medicina preventiva | O Health 7 centraliza os dados de saúde do tripulante, compara com padrões de sinais e propõe um plano gamificado para voltar ao normal. Para o que não se mede no corpo (câncer), acompanha a radiação recebida na missão. Ver [[Plano do front-end v3 - medicina preventiva]] | Dá um norte à solução e propósito à gamificação; ideia validada com a Valéria | Equipe | Ver a linha seguinte |
| 2026-11-14 | Medicina preventiva no front | Fala em "sinais precoces" sem prever doença; plano de 5 dias só com ações de rotina, sugerido e enviado ao solo; pontos por passo, nunca pela medida; dose de radiação simulada comparada com o limite de 600 mSv da NASA; cenários Day 1, 3 e 5 para o vídeo | Cumprir a regra "informa e encaminha" (critério Validity) e caber no prazo | Plano v3 | Quando a Valéria trouxer padrões e ações com fonte (seção 12 do plano v3) |
| 2026-11-14 | Assistente com dados NEXUS-Med | O monitoramento usa a tripulação fictícia da pesquisa (`dados/`, NEXUS-Med) no lugar dos três padrões de demonstração, com quatro estados de alerta e fluxos no n8n. Ver [[Plano do assistente - monitoramento e plano de ação]] | Trocar padrões inventados por dados preparados pela pesquisa | Equipe | Se a pesquisa revisar os casos ou os limiares |

## Em aberto

- Funcionamento sem conexão e atraso de comunicação com o solo: quanto mostrar no demo.
