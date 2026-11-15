# AROW e dispositivos vestíveis

**Atualização de 15/11/2026:** o projeto também oferece receptor Bluetooth HRS, aplicativo Android de ligação Samsung Health/Fit3 e paginação do histórico. Veja [Bluetooth e Galaxy Fit3](bluetooth-fit3.md) para esses caminhos, contratos e requisitos. Os fluxos por arquivo documentados em 14/11 abaixo continuam disponíveis.

Implementação de 14/11/2026. A interface mantém o inglês usado no restante do Health7.

## Acesso e estado das integrações

A Home contém os cartões **Artemis mission tracking** e **Watches & research devices**. A rota autenticada `#/integrations`, também acessível por `#/data`, reúne os caminhos de importação e o histórico da conta.

| Origem | Funciona nesta versão | Para leitura automática |
| --- | --- | --- |
| NASA AROW | Link para a página oficial com informações e recursos de trajetória | Selecionar e validar uma fonte pública e seu contrato antes de ingerir telemetria; nenhuma API não documentada é usada |
| Apple Watch / Apple Health | XML extraído do Apple Health para os tipos abaixo; JSON/CSV Health7 | Aplicativo iOS com HealthKit, permissões por tipo e envio autenticado à API |
| Samsung Galaxy Watch | JSON/CSV no contrato Health7 | Aplicativo Android com Health Connect ou Samsung Health Data SDK, permissões e requisitos de distribuição aplicáveis |
| Garmin | JSON/CSV no contrato Health7 | Acesso ao programa Garmin Connect adequado ao uso, credenciais e autorização do usuário |
| ActLumus | JSON/CSV Health7 com temperatura da pele ou canais explícitos de luz | Exportação autorizada do ActStudio, mapeamento validado com arquivos reais e eventual acordo com fabricante/instituição |

Os caminhos Samsung, Garmin e ActLumus **não leem diretamente os formatos proprietários brutos**. É preciso converter as colunas para o contrato abaixo. Identificar uma origem no arquivo não comprova o fabricante ou o dispositivo físico. Nenhuma conexão automática, pareamento Bluetooth ou credencial de fabricante foi criada.

O equipamento relacionado à USP é o **ActLumus**, produzido pela Condor Instruments: um actígrafo para pesquisa de ritmos biológicos, movimento e exposição luminosa. A [Agência USP de Inovação](https://auspin.usp.br/tecnologia-brasileira-e-lancada-no-espaco-com-os-tripulantes-da-artemis/) documenta seu uso na Artemis II. Isso não implica acesso aos dados dos astronautas nem validação deste aplicativo pela NASA.

## Importar pela interface

1. Entrar na própria conta e abrir **Mission & device integrations**.
2. Selecionar a origem e baixar um modelo JSON ou CSV. Os modelos são fictícios, com `quality: example`.
3. Preencher as medidas autorizadas, sem mudar o significado da métrica. Para registros reais usar `quality: unverified`.
4. Selecionar o arquivo, conferir a prévia e os registros XML não suportados. Nada é enviado durante a prévia.
5. Marcar a autorização e escolher **Save imported measurements**. O histórico confirma o resultado e informa duplicatas.

O navegador aceita arquivos de até **10 MiB**, com **1–500 amostras suportadas**. O POST normalizado tem limite de **256 KiB**. Dividir arquivos maiores antes da importação; ZIP não é aceito. O histórico mostra as últimas 100 amostras por horário de medição, com contagem total e aviso de truncamento. Registros anteriores permanecem no banco; ainda não há paginação, exportação ou exclusão de importações na interface.

A prévia fica somente na memória da tela. Não existe fila offline para importações de vestíveis. Manter o arquivo original; em falha de rede, repetir a operação com a mesma prévia preserva o identificador. Ao sair da tela, selecionar outro arquivo ou trocar de conta, a prévia é descartada. A fila existente dos check-ups simulados continua com seu comportamento anterior.

## Contrato Health7 v1

Arquivo JSON de exemplo, sem dados pessoais reais:

```json
{
  "version": 1,
  "source": "garmin",
  "quality": "example",
  "samples": [
    {
      "device": "Garmin exemplo ficticio",
      "metric": "restingHeartRate",
      "value": 62,
      "unit": "bpm",
      "at": "2026-11-14T12:00:00Z"
    }
  ]
}
```

`source`: `apple | samsung | garmin | actlumus`. `quality`: `unverified | example`. `device` é uma descrição fornecida pela origem, de 1 a 160 caracteres. Datas precisam ser ISO 8601 com fuso; o servidor normaliza para UTC e rejeita datas inexistentes. Campos extras são rejeitados.

CSV UTF-8 tem cabeçalho e ordem exatos, separador vírgula e ponto decimal. Aspas, vírgulas dentro de campos e aspas duplicadas seguem as convenções CSV. Todas as linhas precisam ter a mesma origem e qualidade:

```csv
source,quality,device,metric,value,unit,at,endAt
garmin,example,Garmin exemplo ficticio,restingHeartRate,62,bpm,2026-11-14T12:00:00Z,
```

| Métrica | Unidade exata | Faixa aceita |
| --- | --- | --- |
| `heartRate` | `bpm` | 1–350 |
| `restingHeartRate` | `bpm` | 1–350 |
| `spo2` | `%` | 0–100 |
| `respiratoryRate` | `breaths/min` | 1–150 |
| `bodyMass` | `kg` | 1–500 |
| `sleepDuration` | `h` | 0–24 |
| `skinTemperature` | `degC` | −20–60 |
| `photopicLight` | `lux` | 0–200000 |
| `melanopicLight` | `melanopic-lux` | 0–200000 |

São limites de aceitação do contrato, **não intervalos de normalidade clínica**. Disponibilidade depende de modelo, sensor e exportação; esta tabela não garante que todo relógio meça todos esses dados. Não há conversão automática de libras, Fahrenheit ou unidades de atividade sem uma regra específica.

ActLumus aceita somente `skinTemperature`, `photopicLight` e `melanopicLight`. Os canais de luz ficam restritos a essa origem nesta versão. Nunca mapear luz fotópica para luz melanópica, temperatura da pele para temperatura central ou contagens de atividade para horas de sono. O [manual do ActStudio/ActLumus](https://condorinst.com/wp-content/uploads/2025/05/Manual_ActTrust_2_1_0_EN.pdf) descreve sensores e exportações; a importação genérica não equivale a uma validação de seu formato bruto.

`endAt` é opcional para medidas pontuais. Se presente, deve ser posterior ou igual a `at`, com intervalo máximo de 24 horas. Para `sleepDuration`, é obrigatório e `value` deve corresponder exatamente ao intervalo em horas. Enviar intervalos efetivamente dormidos, não o tempo inteiro na cama. Esta versão armazena intervalos e não calcula total diário, não resolve sobreposições de sono nem executa classificação de sono.

### Apple Health XML

O usuário pode [exportar os dados do app Saúde em XML](https://support.apple.com/en-gb/guide/iphone/iph5ede58c3d/ios). Extrair o arquivo antes de selecionar. Exportações grandes devem ser convertidas/divididas; o importador não corta silenciosamente os primeiros 500 registros.

| Tipo `Record` do XML | Unidade de entrada | Resultado |
| --- | --- | --- |
| `HKQuantityTypeIdentifierHeartRate` | `count/min` | `heartRate`, `bpm` |
| `HKQuantityTypeIdentifierRestingHeartRate` | `count/min` | `restingHeartRate`, `bpm` |
| `HKQuantityTypeIdentifierOxygenSaturation` | `%`, fração HealthKit | `spo2`, multiplicação por 100 |
| `HKQuantityTypeIdentifierRespiratoryRate` | `count/min` | `respiratoryRate`, `breaths/min` |
| `HKQuantityTypeIdentifierBodyMass` | `kg` | `bodyMass`, `kg` |
| `HKQuantityTypeIdentifierAppleSleepingWristTemperature` | `degC` | `skinTemperature`, `degC` |

O [HealthKit representa porcentagens como frações de 0 a 1](https://developer.apple.com/documentation/healthkit/hkunit/percent%28%29): por exemplo `0.97` vira `97 %` somente neste adaptador XML. No JSON/CSV Health7 a porcentagem já deve estar na escala 0–100. Unidades diferentes das listadas causam erro, não conversão por palpite. Datas Apple com deslocamento como `-0300` são normalizadas; `sourceName` é preservado como identificação declarada de dispositivo/origem. O app Saúde agrega múltiplas fontes, portanto não se presume que todo registro venha de um Apple Watch.

Tipos fora dessa lista, incluindo categorias de sono, são contados como não suportados e apresentados na prévia. Tipos suportados com conteúdo inválido impedem a importação inteira. XML malformado, entidades e DTD externo são rejeitados. O XML não é inserido na página nem enviado ao servidor; só as amostras normalizadas passam pela API.

## API e armazenamento

As rotas são registradas dentro do grupo autenticado existente:

```text
POST /api/v1/me/wearables/imports
GET  /api/v1/me/wearables
```

POST recebe o objeto do arquivo, acrescido de `clientId` e `format: health7-json-v1 | health7-csv-v1 | apple-health-xml`. O frontend gera um identificador por prévia. Não enviar `skipped`, nome do arquivo, `crewId` ou XML bruto.

Exige cookie de sessão, origem permitida e `X-Requested-With: Health7`. O frontend também envia `X-Health7-Crew`; troca de conta invalida o pedido. O proprietário vem da sessão, nunca do arquivo. A rota de importação permite 20 requisições por minuto por IP com o mecanismo de rate limit existente. A validação é repetida no servidor.

Resposta de criação: `201`, com `id`, `crewId`, `clientId`, `source`, `format`, `quality`, `count`, `added`, `duplicates`, `receivedAt`. Repetição idêntica do mesmo `clientId` retorna `200` com a resposta original. Reutilizar o identificador com conteúdo diferente retorna `409`.

A migração aditiva `004_wearables.sql` cria:

- `wearable_imports`: dono, identificador, hash do conteúdo normalizado, origem, formato, qualidade, contadores e recebimento.
- `wearable_samples`: observação normalizada, vínculo à importação e dono, chave de deduplicação e horário. Chave estrangeira composta impede vínculo a importação de outra conta.

A identidade de uma observação é o hash de **origem + qualidade + dispositivo + métrica + início + fim** dentro da conta. O valor não faz parte da identidade: se mudar, a API acusa conflito. Reimportar a mesma observação em outro arquivo não duplica a amostra. A origem deve usar identificadores de dispositivo consistentes; nomes diferentes ou qualidade diferente são registros distintos. Não há deduplicação entre fabricantes nem resolução automática de correções.

Cada lote é uma transação com trava por conta. Um conflito ou erro desfaz todo o lote, incluindo seu cabeçalho. A resposta GET traz `crewId`, `total`, `truncated` e `items` com as 100 amostras mais recentes. Payloads têm `verification: user-declared` e `assessment: not-evaluated` definidos pelo servidor.

Os dados não entram nas tabelas de check-ups simulados nem disparam suas projeções ou regras. Também não são enviados ao chat, à NASA ou aos fabricantes. Isso preserva o significado dos registros atuais enquanto se prepara uma futura avaliação com contexto de coleta e regras adequadas.

## Instalação e testes

Com a conexão PostgreSQL existente configurada, executar em `backend`:

```powershell
npm.cmd run migrate
npm.cmd run build
npm.cmd start
```

No ambiente de desenvolvimento, `npm.cmd run dev` também verifica migrações ao iniciar. Para o frontend, `npm.cmd run build` e servir o resultado, ou usar `npm.cmd run dev` na configuração atual. Não é necessário seed, nova conta ou substituição do `.env` para esta mudança.

Os testes do backend e de navegador exigem um PostgreSQL **separado**, definido em `TEST_DATABASE_URL`. Os testes criam esquemas isolados e os removem ao terminar:

```powershell
# em backend, com TEST_DATABASE_URL configurada
npm.cmd test
# em frontend
npm.cmd test
npm.cmd run test:e2e
# Somente o fluxo acrescentado nesta entrega
npm.cmd run test:e2e -- integrations.spec.ts
```

Cobertura adicionada: autorização, vinculação de conta, repetição concorrente, conflitos e rollback, validação de dados/unidades, fontes, exemplos, reinício, histórico parcial, CSV, XML no navegador, consentimento, layout móvel e isolamento entre contas. Não foram utilizados relógios físicos nem contas de desenvolvedor de fabricantes nos testes.

### Resultado da validação em 14/11/2026

Base: `origin/main` em `61e48f5`, preservando as mudanças visuais e os testes cognitivos existentes.

| Verificação | Resultado |
| --- | --- |
| Backend com PostgreSQL temporário real | 33/33 testes passaram |
| Frontend, Vitest | 51/51 testes passaram |
| Playwright, `integrations.spec.ts`, Chrome local | 1/1 fluxo passou; quatro origens, consentimento, XML, repetição, reinício da página, contas distintas e telas de 1440 e 390 px |
| Compilação TypeScript do backend | Passou |
| Compilação de produção do frontend | Passou; aviso de tamanho de bundle do Vite |
| Lint do frontend | Sem erros; um aviso preexistente em `src/lib/roadmap.ts:521` sobre `Date` durante renderização |

A suíte antiga de navegador não foi revalidada integralmente nesta base; seus seletores e passos precisam acompanhar o novo fluxo de check-up da `main`. O comando com `integrations.spec.ts` executa a cobertura específica desta entrega. As capturas de conferência ficam em `frontend/test-results/integrations-desktop.png` e `integrations-mobile.png` (artefatos locais ignorados pelo Git).

## Referências oficiais para os próximos conectores

- [NASA AROW](https://www.nasa.gov/missions/artemis/artemis-2/track-nasas-artemis-ii-mission-in-real-time/): acompanhamento durante a missão e recursos de trajetória; o cartão não declara uma missão ativa nem telemetria local atualizada.
- [Apple HealthKit](https://developer.apple.com/documentation/healthkit): acesso nativo e autorização por tipo de dado.
- [Samsung Health Data SDK](https://developer.samsung.com/health/data/overview.html) e [Android Health Connect](https://developer.android.com/health-and-fitness/health-connect/read-data): leitura autorizada no Android.
- [Garmin Connect Developer Program](https://developer.garmin.com/gc-developer-program/overview/): alternativas Personal e Business. Acesso e condições precisam ser conferidos para a aplicação concreta.
- [USP e ActLumus na Artemis II](https://auspin.usp.br/tecnologia-brasileira-e-lancada-no-espaco-com-os-tripulantes-da-artemis/) e [manual do fabricante](https://condorinst.com/wp-content/uploads/2025/05/Manual_ActTrust_2_1_0_EN.pdf).
