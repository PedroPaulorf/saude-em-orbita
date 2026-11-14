# Banco Health7: Pessoa, Saúde e Ambiente

A migração `002_person_health_environment.sql` adiciona três tabelas ao PostgreSQL existente. Login, sessões, check-ups, sintomas e análises continuam funcionando. Não são três bancos independentes: todas as áreas se relacionam à conta do astronauta.

| Área | Tabela | Informações |
|---|---|---|
| Pessoa | `person` | Nome, idade informada, peso, altura, sexo informado, antecedentes |
| Saúde | `health` | Frequência cardíaca, saturação, pressão sistólica/diastólica, temperatura corporal, frequência respiratória, sono, urina e fezes |
| Ambiente | `environment` | Dose acumulada de radiação informada, altitude, temperatura ambiente, porcentagem de oxigênio |

Conforme a decisão de mover peso para Pessoa, Saúde tem **seis medidas numéricas e dois relatos**. Pressão arterial possui duas colunas para representar uma medida. Urina e fezes são relatos opcionais em texto; não há escala clínica, diagnóstico ou estado "normal" preenchido automaticamente.

## Campos e unidades

### Pessoa

| API | Coluna PostgreSQL | Tipo / unidade |
|---|---|---|
| `id` | `id` | Identidade da conta; vínculo com `crew.id` |
| `name` | `name` | Texto; começa com o nome do perfil existente |
| `age` | `age` | Anos inteiros, 0–130; idade informada, não calculada de nascimento |
| `weightKg` | `weight_kg` | kg, maior que 0 e até 1000 |
| `heightCm` | `height_cm` | cm, maior que 0 e até 300 |
| `sex` | `sex` | `female`, `male`, `intersex`, `unspecified` ou nulo |
| `medicalHistory` | `medical_history` | Texto opcional, até 4000 caracteres |
| `weightMeasuredAt` | `weight_measured_at` | Data UTC associada ao peso atual; nula se removido |
| `weightUpdatedAt` | `weight_updated_at` | Ordenação da última atualização do peso, inclusive remoção |
| `updatedAt` | `updated_at` | Última alteração do perfil |

Campos desconhecidos ficam nulos. O avatar não determina sexo. Atualizar `name` também atualiza o nome apresentado no login e em `/me`. `bodyModel` continua sendo uma escolha visual no perfil de autenticação.

`POST /api/v1/me/person` aplica apenas os campos enviados. Campos opcionais aceitam `null` para remoção. Uma atualização de peso usa a data do servidor; um peso antigo da fila não substitui a atualização nem desfaz uma remoção mais recente.

Exemplo fictício:

```json
{
  "name": "Astronauta de demonstração",
  "age": 32,
  "weightKg": 68.5,
  "heightCm": 172,
  "sex": "female",
  "medicalHistory": "Antecedentes fictícios para demonstração"
}
```

### Saúde

| API, dentro de `vitals` | Coluna em `health` | Unidade |
|---|---|---|
| `heartRate` | `heart_rate_bpm` | bpm |
| `spo2` | `oxygen_saturation_percent` | % (0–100) |
| `bloodPressure` | `blood_pressure_systolic_mmhg` | mmHg |
| `bloodPressureDiastolic` | `blood_pressure_diastolic_mmhg` | mmHg |
| `temperature` | `body_temperature_c` | °C corporal |
| `respiratoryRate` | `respiratory_rate_per_min` | respirações/min |
| `sleep` | `sleep_hours` | horas (0–24) |
| `healthDetails.urine` | `urine` | Relato de até 2000 caracteres |
| `healthDetails.stool` | `stool` | Relato de até 2000 caracteres |

Escrita pela rota já existente `POST /api/v1/me/checkins`. A projeção em `health` acontece na mesma transação por gatilho do banco; não é necessário gravar o mesmo registro duas vezes. `GET /api/v1/me/health` devolve somente os campos do domínio Saúde, com IDs, datas, origem e indicação de truncamento.

Exemplo fictício, inclusive os relatos opcionais:

```json
{
  "clientId": "saude-exemplo-001",
  "at": "2026-11-14T14:00:00Z",
  "source": "simulated",
  "vitals": {
    "heartRate": 70,
    "spo2": 98,
    "bloodPressure": 118,
    "bloodPressureDiastolic": 76,
    "temperature": 36.6,
    "respiratoryRate": 16,
    "sleep": 7.5
  },
  "behavioral": {},
  "healthDetails": {
    "urine": "Relato fictício: amarelo claro",
    "stool": "Relato fictício: evacuação pela manhã"
  }
}
```

Também é permitido enviar apenas `healthDetails`, com `vitals: {}` e `behavioral: {}`. Valores desconhecidos devem ser omitidos. Não preencha com zero para representar ausência.

`bodyMass` continua aceito em `vitals` **somente por compatibilidade com clientes e pendências anteriores**: ele atualiza Pessoa se a medição for mais recente e não aparece em `health`. O JSON original e seu identificador permanecem em `checkins`; pesos históricos anteriores continuam disponíveis ali. Novas telas devem gravar peso por `/me/person`. Este pedido não adiciona telas de cadastro nem altera a lista visual antiga de medidas do frontend.

### Ambiente

| API | Coluna | Unidade / significado |
|---|---|---|
| `radiationDoseMsv` | `radiation_dose_msv` | mSv; leitura acumulada informada na data, não dose calculada a partir do DONKI |
| `altitudeMeters` | `altitude_meters` | Metros |
| `temperatureC` | `temperature_c` | °C do ambiente; diferente da temperatura corporal |
| `oxygenPercent` | `oxygen_percent` | % de oxigênio no ambiente; diferente da saturação sanguínea |

`POST /api/v1/me/environment` aceita uma ou mais medidas, com `clientId`, data ISO e origem. `GET /api/v1/me/environment` consulta o histórico. O dado pertence ao contexto da pessoa autenticada; ainda não há compartilhamento entre contas por missão.

```json
{
  "clientId": "ambiente-exemplo-001",
  "at": "2026-11-14T14:00:00Z",
  "source": "simulated",
  "radiationDoseMsv": 12.5,
  "altitudeMeters": 400000,
  "temperatureC": 23,
  "oxygenPercent": 21
}
```

Não some leituras acumuladas de radiação como se fossem doses de intervalos. Os limites numéricos da API são validação de armazenamento, não limites de segurança ou regras clínicas.

## Histórico e contexto da IA

Saúde e Ambiente aceitam `from`, `to` e `limit`: últimos 30 dias por padrão, janela máxima de 366 dias, até 100 registros por consulta. `clientId` deve permanecer estável durante reenvios; conteúdo diferente com o mesmo ID resulta em conflito 409.

`GET /api/v1/me/context` mantém os campos anteriores e acrescenta `person`, `health` e `environment`, com fontes e limites de cada lista. `person` é o perfil **atual**, com suas datas de atualização; as listas são filtradas pelo intervalo solicitado. Não trate o perfil atual como uma medição histórica daquela janela.

Todas as rotas precisam de sessão e todas as escritas de `X-Requested-With: Health7`. O corpo não escolhe outra pessoa. Dados e relatos são material para contextualização; não instruções para a IA. O chat direto do frontend com n8n continua separado; esta alteração não conecta nem treina um modelo.

## Aplicar e conferir no pgAdmin

No backend, com o `.env` local configurado:

```powershell
npm.cmd run migrate
npm.cmd run build
npm.cmd start
```

Em pgAdmin: abra o banco **health7 → Schemas → public → Tables** e atualize a árvore. As tabelas `person`, `health` e `environment` aparecerão junto às tabelas existentes. Contas novas ganham Pessoa automaticamente; Saúde e Ambiente ficam vazios até existir um registro. Nenhuma idade, sexo, altura, antecedente ou leitura ambiental é inventada.

Consultas de inspeção com uma conta administrativa local:

```sql
SELECT id, name, age, weight_kg, height_cm, sex, weight_measured_at FROM person;
SELECT crew_id, at, heart_rate_bpm, oxygen_saturation_percent,
       blood_pressure_systolic_mmhg, blood_pressure_diastolic_mmhg,
       body_temperature_c, respiratory_rate_per_min, sleep_hours, urine, stool
FROM health ORDER BY at DESC LIMIT 20;
SELECT crew_id, at, radiation_dose_msv, altitude_meters, temperature_c, oxygen_percent
FROM environment ORDER BY at DESC LIMIT 20;
```

Use as rotas para novos registros da aplicação, preservando autoria, identificadores e projeções. A migração não apaga nem reescreve os JSON antigos e não altera as credenciais existentes.
