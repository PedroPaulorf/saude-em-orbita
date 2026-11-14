# Health7 — front-end

React + TypeScript + Vite + Tailwind CSS v4, com shadcn/ui configurado. Sem servidor: os dados ficam no `localStorage` do navegador.

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

## Design system

O visual vem de [`../health7-design-system`](../health7-design-system). **Não copie nem edite os tokens aqui**: `src/index.css` importa `tokens.css` e `components/bundle.css` direto de lá.

- Componentes React em `src/components/h7/`, um por componente do design system, usando as classes `h7-`. Importe de `@/components/h7`.
- Tailwind para layout. As cores dos tokens viram utilitários: `bg-ground`, `text-ink`, `text-ink-muted`, `border-line`, `bg-accent`, `text-on-accent`, `bg-panel`...
- As classes `h7-` ficam na camada `components`, então um utilitário do Tailwind pode sobrescrevê-las (ex.: `h7-card p-6`).
- Tema: `data-theme="deep"` (padrão) ou `"white"` no `<html>`.
- shadcn/ui: `npx shadcn@latest add dialog` funciona; as variáveis do shadcn já apontam para os tokens (tabela no README do design system).

Regras do design system que valem para o código: uma ação `primary` por tela; todo valor de saúde simulado com `<SourceBadge source="simulated" />`; toda sinalização com a regra por escrito e `<SourceBadge source="demo" />`; estado sempre com ícone e palavra (`<StatusBadge />`).

## Estrutura

| Pasta | O quê |
| --- | --- |
| `src/screens/` | Telas: `Dashboard` (opção A do design system) e `CheckIn` (uma pergunta por etapa). |
| `src/components/h7/` | Componentes do design system. |
| `src/data/simulated.json` | Tripulante, linha de base, histórico e limites das regras. **Dados fictícios.** |
| `src/data/hrp-risks.json` | Os 17 riscos do NASA HRP, texto original em inglês. Gerado por `npm run data:risks`. |
| `src/data/regions.ts` | Quais riscos cada região da figura do corpo abre. |
| `src/lib/health.ts` | Junta dados simulados e último check-up; calcula o estado contra a linha de base. |
| `src/lib/storage.ts` | Check-ups no `localStorage`. |
| `src/lib/donki/api.ts` | Cliente tipado de todos os endpoints do DONKI (nota "DONKI - documentação da API" do cofre). |
| `src/lib/donki/snapshot.ts` | Os quatro endpoints que o app usa e os indicadores calculados a partir deles. |
| `src/lib/donki/index.ts` | Hook `useSpaceWeather`: consulta ao vivo, cópia local e modo histórico. |
| `src/data/donki-snapshot.json` | Cópia local do DONKI: últimos 7 dias e o SEP de 05/09/2026 (modo histórico). |

## Regras de alerta

São **regras de demonstração**, sem fonte clínica. Os limites ficam em `src/data/simulated.json` (`rule`: direção, desvio para atenção e para sinalizar). Quem cuida de dados e regras pode mudar ali sem mexer no código.

## Clima espacial (NASA DONKI)

Base `https://ccmc.gsfc.nasa.gov/DONKI-API/get/{recurso}`, só GET, sem chave, CORS liberado, até 60 dias por chamada (contando os dois extremos; acima disso a API responde HTTP 400).

`donki` em `src/lib/donki/api.ts` tem todos os endpoints documentados: `notifications`, `sep`, `flr`, `gst`, `rbe`, `cme`, `cmeAnalysis`, `cmeAnalysisText`, `cmeUrl`, `mpc`, `ips`, `hss`, `wsaEnlilSimulations`.

| Indicador no cartão | Endpoint | Como aparece |
| --- | --- | --- |
| Partículas solares (principal, ligado à radiação) | `SEP` | Primeira detecção do episódio mais recente; detecções e previsões de modelo contadas à parte; eventos ligados (FLR + CME) |
| Alerta original | `notifications?type=SEP` | Só a seção "Summary" e o link. Só é pedido quando há SEP |
| Erupções | `FLR?class=ALL` | Maior classe e quantas são M ou X. Não use `class=M`: devolve só M e deixa as X de fora |
| Tempestades geomagnéticas | `GST` | Kp máximo |

Sem conexão, o cartão usa a cópia mais nova entre o `localStorage` e `donki-snapshot.json`, mostrando a data dela. Rode `npm run data:donki` antes do demo para a cópia do repositório ficar recente. O botão "Show past event" mostra o SEP de 05/09/2026, marcado como evento passado.

Limites que aparecem na tela: o DONKI informa eventos, não a dose recebida; é dado experimental de pesquisa (a fonte oficial de previsão é o NOAA SWPC); a janela de 7 dias é regra de demonstração.
