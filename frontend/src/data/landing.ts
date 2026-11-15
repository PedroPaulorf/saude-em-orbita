/*
  Texto da landing page, em inglês e português. As afirmações seguem o relatório
  "Diferencial competitivo do Health7" (seção "O que não afirmar no pitch"): nada de "detecta doença",
  "o único", "validado" ou dose de radiação.
*/

const en = {
  lang: 'en',
  nav: { how: 'How it works', try: 'Try it', features: 'Features', science: 'Science', demo: 'Try the demo', open: 'Open the app', switchTo: 'Português', switchLabel: 'Ler em português' },
  hero: {
    kicker: 'NASA Space Apps Challenge 2026',
    title: 'Your health, compared only with you.',
    sub: 'A two-minute daily check-up for astronauts. It learns your normal, notices when you drift from it and turns that into a small preventive plan.',
    cta: 'Try the demo',
    secondary: 'How it works',
    noteFace: 'that’s Seven. it asks how you’re doing',
    noteNever: 'it blinks. it never diagnoses.',
    bubbles: ['Need help, astronaut?', 'How did you sleep?', 'Had some water lately?', 'Ready for today’s check-up?'],
  },
  problem: {
    title: 'Space is hard on the body.',
    text: 'Far from Earth there is no quick trip to the doctor. Radiation, isolation and altered gravity change the body day after day, and on the way to Mars a message to Earth takes 4 to 24 minutes, one way.',
    stickers: ['Radiation', 'Isolation', 'Distance from Earth', 'Bone loss', 'Heart and blood', 'Sleep', 'Immune system', 'Nutrition', 'Mood'],
    note: 'all of these are on NASA’s own list of human spaceflight risks',
    signal: { earth: 'Earth', mars: 'Mars', unit: 'min, one way' },
  },
  idea: {
    title: 'Health7 checks seven measures a day against your own pre-flight self, and tells you what to do next.',
    note: 'not against an “average astronaut”',
  },
  how: {
    title: 'How it works',
    steps: [
      { title: 'Check in', text: 'Blood pressure, heart rate, oxygen, temperature, breathing, sleep, urine and stool. About two minutes, no extra hardware.' },
      { title: 'Compare with yourself', text: 'Each value is compared with your pre-flight baseline and your last 14 days in flight. Every alert shows the rule behind it.' },
      { title: 'Get a preventive roadmap', text: 'Small steps for today, the next 3 days and this week, each linked to a NASA human research risk.' },
    ],
  },
  demo: {
    title: 'Try it right here',
    sub: 'One simulated day in four steps, on the app’s own screens and rules. Nothing is saved.',
    note: 'go on, type a number',
    steps: ['Check-up', 'Body', 'Prevention', 'Report'],
    tryValue: 'Or try one:',
    invalid: 'Type a number between {min} and {max}.',
    next: 'Next',
    sync: 'The link is back: sync now',
    restart: 'Start over',
    full: 'Try the full demo',
    seven: {
      heart: 'I’m Seven. Type your resting heart rate, or pick one of mine.',
      sleep: 'And how long did you sleep last night?',
      bodyCalm: 'Everything is within your own baseline. Tap a region to see its measures.',
      bodyOff: 'Something moved away from your baseline. Tap the lit region.',
      region: 'That’s the rule behind the color. No hidden score.',
      planCalm: 'Nothing extra today. Keep the routine.',
      planOff: 'Small steps for today. Tick one off.',
      planDone: 'Nice. The rest stays on the list.',
      queued: 'The report waits on this device until the link is back.',
      synced: 'Saved. Your flight surgeon decides what happens next.',
    },
  },
  features: {
    title: 'What’s inside',
    items: {
      mind: { title: 'Reflexes, memory, attention', text: 'Start lights like in Formula 1, a quick number grid and a color test. Compared only with your own past sessions.', note: 'inspired by the Reaction Self Test used on the ISS' },
      weather: { title: 'Real space weather', text: 'Solar flares and particle events from NASA’s DONKI catalogue, live, with an offline copy. Awareness, not a dose reading.', note: 'real NASA data, not simulated' },
      ground: { title: 'A report for the flight surgeon', text: 'What differs from your baseline, which rule flagged it, and a queue that waits until Earth is back in reach.', note: 'the surgeon decides. always.' },
      watch: { title: 'Your watch can take the reading', text: 'Connect a Bluetooth heart-rate sensor straight from the browser, bring a Galaxy Fit3 through your phone, or import files from Apple Health, Samsung, Garmin and ActLumus. You see each reading before it is saved.', note: 'this sensor is simulated. try it' },
      cycle: { title: 'A period calendar that doesn’t guess', text: 'Female profiles can log period dates, flow, pain and symptoms. Everything is self-reported: no 28-day default, no predictions, no alerts. Using it is optional.', note: 'tap a day to mark it' },
      companion: { title: 'Seven is a companion, not a doctor', text: 'Seven reminds, asks and listens. It doesn’t diagnose and it doesn’t decide.', note: 'say hi to Seven' },
    },
  },
  why: {
    title: 'Why trust it?',
    items: [
      { title: 'The rule is on the screen', text: 'Every alert says which rule fired, in plain words, labelled “Demonstration rule”. No hidden score.' },
      { title: 'NASA data at the core', text: 'Body regions link to NASA Human Research Program risks. Space weather comes live from DONKI.' },
      { title: 'It informs and refers', text: 'Three states: within baseline, attention, flagged for ground. The flight surgeon decides.' },
      { title: 'Mood without a score', text: 'Behavioral answers are never added into one number, so nobody disappears into an average.' },
      { title: 'Works when Earth doesn’t answer', text: 'Check-ins stay on the device and sync when the link comes back.' },
    ],
  },
  science: {
    title: 'Science and sources',
    text: 'What we built on. Links open the original source.',
    sources: [
      { label: 'NASA Human Research Program: risks of human spaceflight', href: 'https://www.nasa.gov/hrp/risks/' },
      { label: 'DONKI space weather database (NASA CCMC)', href: 'https://ccmc.gsfc.nasa.gov/tools/DONKI/' },
      { label: 'Jones et al., Sleep 2022: the Reaction Self Test on the ISS', href: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8919197' },
      { label: 'Basner et al., PLoS ONE 2014: mood and sleep in Mars-500', href: 'https://doi.org/10.1371/journal.pone.0093298' },
      { label: 'Russell et al., npj Microgravity 2023: medical decision support beyond low Earth orbit', href: 'https://www.nature.com/articles/s41526-023-00284-1' },
      { label: 'NASA EIMO concept of operations, 2024', href: 'https://ntrs.nasa.gov/api/citations/20240001402/downloads/2024_IWS_EIMO_ConOps_FINAL.pdf' },
      { label: 'The challenge: Create Health Monitoring Software for Astronauts', href: 'https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/' },
    ],
  },
  honest: {
    title: 'What it doesn’t do',
    items: [
      'It doesn’t diagnose, and it isn’t a medical device.',
      'Alert rules are demonstration rules, without a clinical source.',
      'Demo data is simulated.',
      'Space weather is awareness, not a radiation dose.',
      'Reaction times depend on the device. Compare only with yourself.',
    ],
  },
  footer: {
    built: 'Built for the NASA Space Apps Challenge 2026, challenge “Create Health Monitoring Software for Astronauts”.',
    notNasa: 'Not affiliated with or endorsed by NASA.',
    code: 'Source code',
    cta: 'Ready? Check in.',
  },
}

export type LandingCopy = typeof en

const pt: LandingCopy = {
  lang: 'pt',
  nav: { how: 'Como funciona', try: 'Teste', features: 'Recursos', science: 'Ciência', demo: 'Testar a demo', open: 'Abrir o app', switchTo: 'English', switchLabel: 'Read in English' },
  hero: {
    kicker: 'NASA Space Apps Challenge 2026',
    title: 'Sua saúde, comparada só com você.',
    sub: 'Um check-up diário de dois minutos para astronautas. Ele aprende o seu normal, percebe quando você se afasta dele e transforma isso num pequeno plano preventivo.',
    cta: 'Testar a demo',
    secondary: 'Como funciona',
    noteFace: 'esse é o Seven. ele pergunta como você está',
    noteNever: 'ele pisca. ele nunca diagnostica.',
    bubbles: ['Precisa de ajuda, astronauta?', 'Como você dormiu?', 'Bebeu água hoje?', 'Pronto para o check-up?'],
  },
  problem: {
    title: 'O espaço é duro com o corpo.',
    text: 'Longe da Terra não existe ida rápida ao médico. Radiação, isolamento e gravidade alterada mudam o corpo dia após dia, e a caminho de Marte uma mensagem para a Terra leva de 4 a 24 minutos, só de ida.',
    stickers: ['Radiação', 'Isolamento', 'Distância da Terra', 'Perda óssea', 'Coração e sangue', 'Sono', 'Sistema imune', 'Nutrição', 'Humor'],
    note: 'todos estão na lista oficial de riscos do voo espacial humano da NASA',
    signal: { earth: 'Terra', mars: 'Marte', unit: 'min, só de ida' },
  },
  idea: {
    title: 'O Health7 confere sete medidas por dia contra você mesmo antes do voo, e diz o que fazer em seguida.',
    note: 'não contra um “astronauta médio”',
  },
  how: {
    title: 'Como funciona',
    steps: [
      { title: 'Faça o check-in', text: 'Pressão, frequência cardíaca, oxigênio, temperatura, respiração, sono, urina e fezes. Uns dois minutos, sem aparelho extra.' },
      { title: 'Compare com você', text: 'Cada valor é comparado com a sua linha de base pré-voo e com os seus últimos 14 dias em voo. Todo alerta mostra a regra que o gerou.' },
      { title: 'Receba um roteiro preventivo', text: 'Passos pequenos para hoje, os próximos 3 dias e esta semana, cada um ligado a um risco do programa de pesquisa humana da NASA.' },
    ],
  },
  demo: {
    title: 'Teste aqui mesmo',
    sub: 'Um dia simulado em quatro passos, nas telas e regras do próprio app (que é em inglês). Nada é salvo.',
    note: 'vai, digita um número',
    steps: ['Check-up', 'Corpo', 'Prevenção', 'Relatório'],
    tryValue: 'Ou teste um:',
    invalid: 'Digite um número entre {min} e {max}.',
    next: 'Avançar',
    sync: 'A conexão voltou: sincronizar',
    restart: 'Recomeçar',
    full: 'Testar a demo completa',
    seven: {
      heart: 'Eu sou o Seven. Digite sua frequência cardíaca em repouso, ou escolha uma das minhas.',
      sleep: 'E quantas horas você dormiu esta noite?',
      bodyCalm: 'Tudo dentro da sua linha de base. Toque numa região para ver as medidas.',
      bodyOff: 'Algo se afastou da sua linha de base. Toque na região acesa.',
      region: 'Essa é a regra por trás da cor. Nenhuma nota escondida.',
      planCalm: 'Nada extra hoje. Siga a rotina.',
      planOff: 'Passos pequenos para hoje. Marque um.',
      planDone: 'Boa. O resto continua na lista.',
      queued: 'O relatório espera neste aparelho até a conexão voltar.',
      synced: 'Salvo. Quem decide o próximo passo é o seu cirurgião de voo.',
    },
  },
  features: {
    title: 'O que tem dentro',
    items: {
      mind: { title: 'Reflexo, memória, atenção', text: 'Luzes de largada como na Fórmula 1, uma grade rápida de números e um teste de cores. Comparado só com as suas sessões anteriores.', note: 'inspirado no Reaction Self Test usado na ISS' },
      weather: { title: 'Clima espacial de verdade', text: 'Erupções solares e eventos de partículas do catálogo DONKI da NASA, ao vivo, com cópia offline. Consciência da situação, não leitura de dose.', note: 'dado real da NASA, não simulado' },
      ground: { title: 'Um relatório para o cirurgião de voo', text: 'O que mudou em relação à sua linha de base, qual regra sinalizou, e uma fila que espera a Terra voltar a responder.', note: 'quem decide é o cirurgião. sempre.' },
      watch: { title: 'O relógio pode fazer a leitura', text: 'Conecte um sensor de frequência cardíaca por Bluetooth direto do navegador, traga uma Galaxy Fit3 pelo celular ou importe arquivos do Apple Health, Samsung, Garmin e ActLumus. Você vê cada leitura antes de salvar.', note: 'esse sensor é simulado. pode testar' },
      cycle: { title: 'Um calendário menstrual que não adivinha', text: 'Perfis femininos podem registrar datas, fluxo, dor e sintomas do período. Tudo é informado pela própria pessoa: sem ciclo padrão de 28 dias, sem previsões, sem alertas. O uso é opcional.', note: 'toque num dia para marcar' },
      companion: { title: 'O Seven é um companheiro, não um médico', text: 'O Seven lembra, pergunta e escuta. Não diagnostica e não decide.', note: 'dá um oi pro Seven' },
    },
  },
  why: {
    title: 'Por que confiar?',
    items: [
      { title: 'A regra está na tela', text: 'Todo alerta diz qual regra disparou, em palavras simples, com o rótulo “Demonstration rule”. Nenhuma nota escondida.' },
      { title: 'Dados da NASA no centro', text: 'As regiões do corpo levam aos riscos do Human Research Program da NASA. O clima espacial vem ao vivo do DONKI.' },
      { title: 'Informa e encaminha', text: 'Três estados: dentro da linha de base, atenção, sinalizado para o solo. Quem decide é o cirurgião de voo.' },
      { title: 'Humor sem nota', text: 'As respostas comportamentais nunca viram um número só, então ninguém some dentro de uma média.' },
      { title: 'Funciona quando a Terra não responde', text: 'Os check-ins ficam no aparelho e sincronizam quando a conexão volta.' },
    ],
  },
  science: {
    title: 'Ciência e fontes',
    text: 'Onde nos apoiamos. Os links abrem a fonte original, em inglês.',
    sources: en.science.sources.map((s, i) => ({
      ...s,
      label: [
        'NASA Human Research Program: riscos do voo espacial humano',
        'Base de clima espacial DONKI (NASA CCMC)',
        'Jones et al., Sleep 2022: o Reaction Self Test na ISS',
        'Basner et al., PLoS ONE 2014: humor e sono na Mars-500',
        'Russell et al., npj Microgravity 2023: apoio à decisão médica além da órbita baixa',
        'NASA EIMO, conceito de operações, 2024',
        'O desafio: Create Health Monitoring Software for Astronauts',
      ][i],
    })),
  },
  honest: {
    title: 'O que ele não faz',
    items: [
      'Não diagnostica e não é um dispositivo médico.',
      'As regras de alerta são de demonstração, sem fonte clínica.',
      'Os dados da demo são simulados.',
      'Clima espacial é consciência da situação, não dose de radiação.',
      'O tempo de reação depende do aparelho. Compare só com você.',
    ],
  },
  footer: {
    built: 'Feito para o NASA Space Apps Challenge 2026, desafio “Create Health Monitoring Software for Astronauts”.',
    notNasa: 'Sem afiliação ou endosso da NASA.',
    code: 'Código-fonte',
    cta: 'Pronto? Faça o check-in.',
  },
}

export const LANDING = { en, pt }
export type Lang = keyof typeof LANDING

/** Caminho de uma imagem da landing (public/landing/). */
export const landingImg = (name: string) => `${import.meta.env.BASE_URL}landing/${name}`

export const REPO_URL = 'https://github.com/PedroPaulorf/saude-em-orbita'
