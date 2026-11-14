# Organização do banco: Pessoa, Saúde e Ambiente

Pedido: separar os dados conforme a imagem enviada. Decisão do usuário: mover peso para Pessoa e incluir urina e fezes em Saúde. O nome Health7 não obriga a agrupar relatos em sete números: Saúde passa a ter seis medidas numéricas e dois relatos descritivos.

## Estrutura e escolhas de implementação

- `person`: um perfil por conta, com nome, idade, peso em kg, altura em cm, sexo informado e antecedentes. Campos desconhecidos ficam nulos; não inferir sexo pelo avatar. Data da medição do peso evita que pendências antigas substituam um peso mais recente.
- `health`: histórico ligado ao check-up e à pessoa. Frequência cardíaca (bpm), saturação (%), pressão sistólica/diastólica (mmHg), temperatura corporal (°C), frequência respiratória (resp/min), sono (h), urina e fezes (relatos opcionais). Relatos não geram diagnóstico ou classificação automática.
- `environment`: histórico do contexto registrado por cada pessoa: dose acumulada informada de radiação (mSv), altitude (m), temperatura ambiente (°C), oxigênio (%), data e origem. Nenhuma conversão automática de clima espacial em dose. Ainda não existe um cadastro de missões que autorize compartilhamento de ambiente entre contas.

Alternativas consideradas: substituir as tabelas atuais quebraria clientes e histórico; apenas renomear JSON não tornaria a divisão visível no PostgreSQL. Escolha técnica: três tabelas tipadas adicionais, preservando autenticação, check-ups, sintomas e análises. Um gatilho transacional projeta check-ups em Saúde e direciona `bodyMass` legado para Pessoa. O JSON original fica como registro de origem; não é apagado.

## API e compatibilidade

Manter login e `/me/checkins`. Adicionar GET/POST `/me/person`, GET `/me/health`, GET/POST `/me/environment`. Check-ups passam a aceitar `healthDetails: { urine?, stool? }`, inclusive sem outras respostas. Consultas continuam limitadas por janela/data/quantidade e pela sessão autenticada. Ambiente usa identificador idempotente, sem aceitar a identidade de outra pessoa no corpo.

O contexto de análise inclui Pessoa, Saúde e Ambiente da própria conta, com fontes e indicação de limites. Nenhuma chamada a n8n é necessária para migrar ou testar. Não criar novas telas de cadastro neste pedido; documentar o contrato para o frontend.

## Migração e validação

Nova migração `002`, sem editar `001`. Preencher nomes a partir dos perfis e extrair medidas de check-ups existentes. Peso existente vai para Pessoa, mantendo a data e o JSON de origem. Testar em PostgreSQL isolado, incluindo um banco que já possua registros antes de `002`. Aplicar ao banco local após os testes, sem excluir tabelas ou registros.

Verificar campos nulos, limites/unidades, isolamento, CSRF, reenvio idempotente, incompatibilidade de payload, ordem temporal do peso, contexto e preservação das rotas existentes. Finalizar com README, revisão e registro da branch, preservando o arquivo local do cofre.
