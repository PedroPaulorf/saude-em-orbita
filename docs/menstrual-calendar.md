# Calendário menstrual

O perfil feminino tem um botão **Menstrual calendar** na Home e um link nas estatísticas. A tela também pode ser aberta em `#/menstrual`. O registro é opcional: um perfil feminino não implica que a pessoa menstrua.

## Como usar

1. Entre em uma conta com `profile.bodyModel = female` — por exemplo, `crew03` na instalação de demonstração. A senha dessa conta é a configurada no servidor; esta alteração não redefine senhas.
2. Abra **Menstrual calendar**, escolha o mês e selecione um dia ou **Record a period**.
3. Informe início e fim. Deixe o fim vazio somente enquanto o período estiver em andamento. Fluxo, dor de 0 a 10, sintomas e observações são opcionais. Dor não informada é diferente de zero.
4. Clique em **Save period**. Os dias registrados ficam destacados. Use **Edit** para corrigir ou encerrar o período; **Delete** exige confirmação na tela.

Os registros são salvos no PostgreSQL por conta e sobrevivem a reinícios. O formulário não enviado fica apenas na memória da tela e é descartado ao sair do mês. O calendário exige conexão para salvar; não há fila local de sincronização para esses registros. Se a conexão cair durante o envio, recarregue antes de tentar novamente para verificar se o servidor confirmou a gravação.

## Uso da base indicada

Pasta fornecida: [NASA SPACE APPS CHALLENGE](https://drive.google.com/drive/folders/1M_BLpnYBPkhHI1AOSKiK_vtHp6DjI7p6).

Foi inspecionado o arquivo público [NEXUS-Med_6crew_daily_30d_cases.xlsm](https://drive.google.com/file/d/12rT8uTzcCMYUNBol3pIsnI5-PzxGmQe2/view), na subpasta USER, em 15/11/2026. A leitura usa XML dentro do arquivo, sem executar macros.

| Informação | Resultado utilizado |
|---|---|
| Aba | `01_Crew_Profiles` |
| Campos extraídos | `crew_id`, `sex_at_birth`, `role` |
| Perfis | Seis perfis sintéticos: NX-01 a NX-06 |
| Perfis com F na coluna de origem | NX-01, NX-03, NX-05 |
| Datas menstruais e duração de ciclo | Ausentes no arquivo examinado; nenhum registro menstrual foi criado a partir dele |
| SHA-256 do download examinado | `96778bfa076e041f21f97da317ced7d4f6a78f00b9b1b81d4f228f88f2dbede8` |

O manifesto derivado fica em `frontend/src/data/menstrual-source.json` e é consumido pela tela para mostrar a origem e os perfis disponíveis. Quando a conta já está vinculada a um `profile.nexus.crewId`, a tela também identifica o perfil correspondente. Isso não importa resultados clínicos nem transforma pessoas da pesquisa em usuários.

Para reproduzir a extração com uma cópia local do arquivo indicado:

```powershell
python dados/scripts/exportar_calendario.py CAMINHO_DO_ARQUIVO.xlsm
```

O arquivo NEXUS do Drive não tem o mesmo hash da versão NEXUS já presente em `dados/`. O manifesto mantém a procedência do download examinado; a implementação não substitui a base existente.

Também foram examinados os esquemas do arquivo `Med_riesgo_contextual_sexo_tiempo_ambiente.xlsm`, o cabeçalho `project_biomarker_schema.csv` e os arquivos `download (3).zip`/`download (4).zip` com dados OSD-575/OSD-656. Eles não forneceram datas menstruais para esta implementação. **Isso não representa uma auditoria de todos os arquivos da pasta**, incluindo o arquivo grande `download (5).zip`. Downloads e arquivos de pesquisa consultados ficam em `dados-privados/`, ignorado pelo Git.

As datas são informadas pela usuária. Não se deduz menstruação de sexo, idade, dia de missão, temperatura ou frequência cardíaca. Não existe um ciclo padrão de 28 dias, cálculo de fertilidade, previsão de ovulação ou alerta clínico. A seleção de campos para anotar datas, fluxo e sintomas segue a [orientação do Office on Women’s Health sobre registro menstrual](https://womenshealth.gov/menstrual-cycle/your-menstrual-cycle).

## Persistência e API

Migração aditiva: `backend/migrations/006_menstrual_calendar.sql`. Ela cria `menstrual_periods`, sem alterar check-ups, senhas ou tabelas existentes. O servidor aplica migrações ao iniciar. Banco de produção deve usar UTF-8 para aceitar observações em qualquer idioma.

| Método e rota relativa a `/api/v1` | Função |
|---|---|
| `GET /me/menstrual?from=YYYY-MM-DD&to=YYYY-MM-DD` | Registros que intersectam a janela; até 366 dias de diferença, limite de 500 registros e indicador de truncamento |
| `POST /me/menstrual/periods` | Cria registro com `clientId` UUID idempotente |
| `POST /me/menstrual/periods/:id` | Substitui os campos do registro; exige `version` atual |
| `POST /me/menstrual/periods/:id/delete` | Remove registro; exige `version` atual |

Criação e edição recebem `startDate`, `endDate` (ou `null`), `flow` (`unspecified`, `spotting`, `light`, `moderate`, `heavy`), `pain` (inteiro 0–10 ou `null`), `symptoms` (lista de identificadores permitidos) e `note` (até 1.000 caracteres). Na criação acrescente `clientId`; na edição acrescente `version`. A resposta informa `source: self-reported` e a versão.

São exigidos cookie autenticado, perfil elegível e, para POST, `X-Requested-With: Health7`. A interface envia também `X-Health7-Crew` para impedir que uma troca de conta em outra aba associe o envio ao usuário errado. O servidor deriva o proprietário exclusivamente da sessão. Datas inválidas, datas futuras, fim anterior ao início e períodos sobrepostos são rejeitados. Uma transação com bloqueio por conta impede que gravações simultâneas criem sobreposições. Alterações ou exclusões com versão antiga retornam 409.

Datas são `DATE` no banco e strings `YYYY-MM-DD` na API, sem conversão de fuso. O indicador de hoje e a validação de datas futuras usam UTC, explicitamente indicado na tela. Um fim vazio significa período em andamento: aparece até hoje e impede um novo período posterior até que seja encerrado. A duração exibida é inclusiva, contando início e fim. Fluxo e sintomas resumem o período inteiro; não são observações diárias.

O módulo não envia conteúdo para chat, serviços externos, motor de riscos, ranking ou simulações. O filtro por perfil usa a classificação de interface já existente (`bodyModel`); não é uma verificação de sexo biológico.

## Validação

Validação desta implementação em 15/11/2026: **97 testes do frontend, 47 testes da API e o cenário de navegador passaram**; builds de frontend e backend concluídos. A inspeção visual incluiu desktop e celular de 390 px. O lint não introduziu avisos novos; permanece um aviso anterior de pureza em `frontend/src/lib/roadmap.ts`. O build mantém o aviso já existente de tamanho de bundle.

- Testes de API em banco separado: autenticação, elegibilidade, isolamento entre contas, reinício, ano bissexto, datas inválidas, tentativas repetidas, concorrência, sobreposição e controle de versão.
- Testes unitários de calendário: viradas de mês/ano, 29 de fevereiro, intervalos inclusivos e períodos em andamento.
- Cenário de navegador `frontend/e2e/menstrual.spec.ts`: criação, consulta após recarregar, edição, exclusão, acesso por perfil e largura de celular.

Execute `npm test` e `npm run build` em `frontend/`; `npm run build` e `npm test` em `backend/`, com `TEST_DATABASE_URL` apontando para um banco **de testes**. Para o navegador, defina também `PLAYWRIGHT_EXECUTABLE_PATH` se necessário e execute `node e2e/run.mjs menstrual.spec.ts` na pasta `frontend/`. Os testes não devem usar o banco com registros pessoais.
