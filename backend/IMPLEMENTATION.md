# Health 7: PostgreSQL, identidade e histórico

Escopo autorizado: implementar em branch separada `feat/backend-postgres-login`,
apenas backend. Front permanece inalterado; README explica contrato para futura integração.

## Decisões

- Node 24, TypeScript, Fastify, `pg`, PostgreSQL; substituir SQLite sem apagar o arquivo antigo.
- Login por nome/senha; scrypt com salt aleatório, sessão opaca em cookie HttpOnly,
  tokens de sessão persistidos apenas como hash, expiração e logout revogável.
- Proteção CSRF: cabeçalho `X-Requested-With: Health7` em requisições mutáveis,
  CORS restrito e cookies SameSite; Secure em produção com HTTPS.
- Autorização por sessão: `/api/v1/me`, nunca confiar em crewId fornecido pelo navegador.
- Perfil inclui bodyModel male/female, baseline e dia da missão. Duas contas fictícias
  por script seed com senha fornecida em variável, sem senha real no Git.
- Checkups idempotentes, consultas temporais limitadas, sintomas com eventos append-only
  de início/evolução/resolução e autoria. Ausência de relato não indica resolução.
- IA: contexto próprio por intervalo e análise persistida com referência aos registros,
  fontes e versão do método. Resumo determinístico identificado como tal disponível
  sem modelo. Adaptador opcional HTTP para serviço de IA configurado pelo operador;
  sem diagnóstico, probabilidade de doença ou previsão clínica.
- Sem envio a serviços externos durante os testes; somente dados fictícios.
- PostgreSQL com migrações versionadas; Docker compose opcional e conexão a servidor já instalado.

## Trabalho

- [x] Testes de API/PostgreSQL: login, sessão, logout, isolamento A/B, datas, idempotência,
  eventos de sintomas, contexto, proveniência das análises e integração do provedor por stub.
- [x] Implementar migrações, auth, perfis, checkins, sintomas e análises.
- [x] README completo: banco, setup, rotas, exemplos, migração SQLite e limites.
- [x] Instalação limpa, compilação, testes em PostgreSQL real e revisão independente.
Entrega: commit somente do backend e push da branch própria (sem merge em main).

Verificação: npm ci e build; testes contra PostgreSQL18 em schema temporário;
inicialização de dist em porta isolada, migração reaplicada e login feminino real.
Revisão independente sem bloqueios. IA usa apenas fixture HTTP local nos testes.
