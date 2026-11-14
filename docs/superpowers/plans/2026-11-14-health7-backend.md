# Health 7 — backend

Pedido autorizado: criar e enviar o esqueleto do backend; IA fica fora desta entrega.

Arquitetura: API Node.js 24 + TypeScript + Fastify, SQLite no servidor compartilhado.
Preservar frontend e alterações locais do cofre. Contrato compatível com CheckIn do front,
acrescentando clientId para idempotência, crewId na rota e receivedAt no servidor.
Banco com tripulante fictício, referência pessoal e check-ups. Sem diagnósticos ou IA.

- [x] Testar recebimento, validação, isolamento por tripulante, idempotência, autenticação e persistência.
- [x] Implementar GET /health, GET /api/v1/crew/:id, POST/GET /api/v1/crew/:id/checkins.
- [x] Documentar execução, integração com tablets, token de demonstração e limitações.
- [ ] Compilar, executar testes, revisar diff e enviar ao repositório.

Ruling: trabalhar em branch própria no checkout atual, alterando apenas backend e este plano;
as edições do usuário no cofre permanecem intocadas. SQLite exige disco persistente no servidor.

Revisão independente: sem bloqueios para dados simulados. Corrigido timestamp aceito
pelo esquema mas não representável por Date; testes ampliados para dois tripulantes reais no banco de teste.
