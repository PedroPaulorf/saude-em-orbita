# Login e avatar individual — Health 7

Branch de integração baseada no backend PostgreSQL, mantendo a main intacta.
Pedido: conectar login do front e clique nas regiões do avatar aos dados próprios.

- [x] Cliente API com cookies, CSRF, timeout e tratamento de sessão expirada.
- [x] Login, restauração de sessão e logout sem dados visíveis da conta anterior.
- [x] Perfil autenticado fornece nome, baseline, dia da missão e bodyModel.
- [x] Cache e pendências por astronauta; nenhuma migração silenciosa da chave antiga compartilhada.
- [x] Check-up envia para /me/checkins e recupera histórico; reenvio idempotente.
- [x] Avatar usa male/female do perfil e abre detalhes regionais com datas e estado vazio explícito.
- [x] Cabeça: sono, descanso e sintomas; peito: cardiovascular; tronco: temperatura/relatos;
  membros: relatos próprios. Conteúdo HRP separado de registros pessoais.
- [x] Testes de isolamento, troca de conta, reenvio e navegação; build/lint e revisão.

Limites: não criar modelo 3D, diagnóstico ou provedor de IA. Água permanece local,
mas separada por conta. Regiões sem medição não devem sugerir normalidade clínica.
Publicar somente branch de integração; sem incluir alterações locais no cofre.
