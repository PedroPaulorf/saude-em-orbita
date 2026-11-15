# Conexão iPhone · branch de testes

## Escopo

Ao lado de Start/Redo do Health check-up, **Connect iPhone** abre a configuração no painel de integrações. O site mostra endereço da API correto para o host usado, instruções, recebimento de dados Apple no histórico carregado e alternativa de importação por arquivo. Nunca considera instalação ou consentimento como prova de conexão viva. A integração já existente de arquivos continua funcionando.

Para sincronização automática, o companion SwiftUI/HealthKit em `ios/` lê cinco medidas autorizadas e envia para a API existente, sem novas permissões no banco e sem acesso direto do Safari ao HealthKit. Execução automática a cada minuto somente enquanto o companion está ativo. Instalação exige Mac/Xcode e iPhone físico. Sem promessa de leitura em background ou conexão universal com relógios.

## Escolha de implementação

- Reutilizar importação de arquivos: já funciona no navegador, mas exige ação manual.
- Companion iOS + HealthKit: caminho escolhido para leitura automática no iPhone, com autorização e envio autenticado. Requer instalação nativa.
- Pareamento Bluetooth direto: não resolve acesso ao histórico do Apple Saúde; fora desta etapa.

Os dados Apple permanecem separados dos check-ups/avaliações demonstrativas. A UI mostra recebimento confirmado do histórico da conta, não um status fictício Connected. A coleta não depende da IA.

## Verificação

Testes de renderização cobrem estado sem dados e contagem apenas de registros Apple. Teste de navegador confere botão, abertura da tela, endereço Wi-Fi e navegação para importação. Compilação e testes iOS continuam pendentes no Mac. Instruções, limites da janela de leitura, desconexão, rede e roteiro de validação física em [ios/README.md](../ios/README.md).
