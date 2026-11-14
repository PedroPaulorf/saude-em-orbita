# Login e avatar individual — Health 7

Integração do backend PostgreSQL com as telas atuais da main.
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
Integração na main solicitada pelo responsável. Alterações locais no cofre são preservadas fora do commit da aplicação.

As telas Prevention e Progress, gamificação, planos, cenários e os dois check-ups separados foram preservados. Registros combinados anteriores continuam legíveis. Cenários adicionam dados fictícios somente à conta autenticada, sem remover registros do servidor. Não são inventadas medições ou comparações quando faltam dados ou linha de base. Datas ausentes quebram a contagem de dias consecutivos.
