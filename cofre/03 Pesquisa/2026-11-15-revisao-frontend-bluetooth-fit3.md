# Revisão do frontend e conexão do Galaxy Fit3

Data: 15/11/2026.

Base da implementação: branch `feat/arow-vestiveis`, em `8f99295`, preservando o código que estava aberto no ambiente.

A importação de relógios continua no projeto. Foram acrescentados um fluxo específico para **Galaxy Fit3**, um receptor Bluetooth para transmissores padronizados e acesso ao histórico antigo.

## Entrega

| Área | Resultado |
| --- | --- |
| Galaxy Fit3 | Botão no frontend com instruções e download do aplicativo Android de ligação |
| Aplicativo no celular | APK de teste para Android 14+, leitura autorizada de batimentos compartilhados pelo Samsung Health no Health Connect, prévia e envio à própria conta |
| Bluetooth direto | Seletor de sensores BLE Heart Rate, leitura enquanto a página está aberta e gravação explícita de uma medida |
| Estados da interface | Ausência de suporte, URL sem segurança, permissão negada, desconexão, pacote inválido, medida antiga, erro e repetição de gravação |
| Histórico de dispositivos | Botão para carregar medidas antigas, além dos primeiros 100 registros, e orientação quando não há dados |
| Origem dos dados | Distingue arquivo, Bluetooth genérico e carga do Samsung Health pelo celular |

O Fit3 usa o celular como ponte. Seu botão não anuncia pareamento direto pelo navegador: os aplicativos Samsung continuam administrando o Bluetooth da pulseira. A ligação adicional lê dados autorizados do celular e envia ao Health7. A [Samsung descreve o compartilhamento com Health Connect](https://developer.samsung.com/health/health-connect-faq.html).

O APK foi compilado e a assinatura verificada. Ainda falta testar o fluxo em seu celular e Fit3 físicos. A versão do Android do celular determina se este APK instala; a implementação atual requer Android 14 ou posterior.

## Áreas que ainda precisam evoluir no frontend

| Área observada | Estado / próximo passo |
| --- | --- |
| Medidas reais no avatar e na prevenção | Continuam separadas dos check-ups simulados. É preciso definir contexto, qualidade e regras adequadas antes de usá-las nos alertas |
| AROW dentro do painel | Há acesso à fonte oficial; mapa e telemetria de Orion não são carregados localmente |
| Histórico principal de check-ups e sintomas | A sincronização mantém uma janela limitada; a paginação nova se aplica às observações de dispositivos |
| Conversa do companion | Sem `VITE_N8N_CHAT_WEBHOOK_URL`, usa respostas de demonstração identificadas. Serviço real depende de configuração |
| Água, planos e testes cognitivos | Persistem localmente por conta; não há sincronização completa entre aparelhos |
| Configuração física do Fit3 | Depende de pareamento Samsung, compartilhamento Health Connect, permissões no celular e API acessível pela rede |
| Sincronização em segundo plano | O aplicativo de ligação atual lê e envia após ações do usuário no celular |

Esses limites foram identificados pelo código e pela navegação de teste. Esta entrega não altera regras clínicas nem importa dados reais de outras contas. As pendências não são apresentadas como funções prontas.

## Como testar

Abrir `#/integrations`, pressionar **Connect Samsung Galaxy Fit3 via phone**, instalar o APK **no celular**, autorizar a leitura, entrar no servidor Health7 e enviar uma prévia. Depois atualizar o histórico do site e conferir valor, origem e horário.

Para um sensor que já transmita o padrão BLE Heart Rate, usar **Connect Bluetooth** em `localhost` ou HTTPS num navegador compatível. A existência desse serviço não é presumida no Fit3.

Instruções técnicas e limites: [Bluetooth e Galaxy Fit3](../../docs/bluetooth-fit3.md).

Validação: 41 testes de backend, 94 de frontend e 12 cenários distintos de navegador passaram. O APK foi compilado e a assinatura conferida. As capturas de desktop/celular foram inspecionadas. O teste com Fit3 e celular físicos continua pendente.
