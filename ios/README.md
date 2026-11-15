# Health7 Companion · iPhone (experimental)

Branch: `teste/conectar-dispositivos`. Código-fonte de um companion iOS 17+, SwiftUI e HealthKit, usando a API autenticada existente. **Ainda não compilado nem testado em iPhone: o ambiente de desenvolvimento atual é Windows.** Não é um aplicativo já distribuído por App Store/TestFlight.

## Compilar no Mac

1. Instalar Xcode e XcodeGen (`brew install xcodegen`, se usar Homebrew).
2. Nesta pasta, executar `xcodegen generate`. Ele gera o projeto Xcode, Info.plist e entitlement do HealthKit a partir de `project.yml`.
3. Abrir `Health7Companion.xcodeproj`, selecionar o target e escolher sua equipe em **Signing & Capabilities**. Ajustar o Bundle Identifier para um identificador disponível na sua conta Apple. Confirmar a capability HealthKit; este protótipo não precisa de Clinical Health Records nem Background Delivery.
4. Selecionar um iPhone físico com iOS 17 ou mais novo, habilitar Developer Mode conforme solicitado pelo Xcode e executar o app. Permissões de assinatura/HealthKit precisam estar disponíveis para sua equipe Apple.
5. Compilação de verificação sem assinatura: `xcodebuild -project Health7Companion.xcodeproj -scheme Health7Companion -sdk iphoneos CODE_SIGNING_ALLOWED=NO build`.

## Usar

- Deixar o notebook com backend e frontend ativos. Usar o servidor mostrado em **Connect iPhone** no site (endereço da API, porta 3001, sem `/api/v1`). Nunca colocar `localhost` no iPhone para acessar o notebook.
- Entrar na mesma conta do site. A senha não é gravada; a sessão usa cookies em memória. Para testes locais, contas fictícias usam a senha configurada na instalação.
- Autorizar o envio e tocar **Authorize Health & sync now**. No formulário do iOS, selecionar as permissões desejadas.
- Ativar **Automatic sync while this app is open**. A cada 60 segundos, enquanto a cena está ativa, o companion envia os dados disponíveis. Ao voltar ao app, tenta sincronizar novamente. Não há execução garantida em segundo plano.
- No site, tocar **Refresh imported history**. Dados chegam à conta autenticada no PostgreSQL, separados dos check-ups simulados. Não modificam automaticamente mapa corporal, linha de base, check-up concluído ou alertas.
- **Disconnect** interrompe envios, cancela requisições pendentes, descarta lote local e tenta revogar a sessão. Para remover permissão de leitura do HealthKit, usar Ajustes do iPhone. Registros já salvos no servidor não são apagados. A desconexão não desfaz um envio que o servidor já tenha concluído.

## Contrato e limites

`POST /api/v1/auth/login`, cookie de sessão, `X-Requested-With: Health7` e `X-Health7-Crew` no envio para `POST /api/v1/me/wearables/imports`. O proprietário vem da sessão, não de um ID livre no corpo. Nenhum segredo compartilhado no app.

Lê no máximo as **100 amostras mais recentes de cada uma de cinco medidas nos últimos sete dias**: FC, FC de repouso, saturação, frequência respiratória e massa corporal. Não é uma migração de histórico completo. Saturação HealthKit (fração) é convertida para porcentagem; FC/FR para contagens por minuto, massa para kg. Não inclui sono, pressão arterial, temperatura nem extração direta do relógio nesta etapa. Apple Saúde pode conter leituras de várias origens e entradas manuais; a origem é preservada, mas não verificada clinicamente.

O identificador da amostra HealthKit integra o campo de procedência `device`, ao lado do nome da origem. Lotes têm ID derivado de seu conteúdo e os reenvios usam o mesmo payload. A deduplicação existente por conta impede duplicação dos mesmos registros em lotes sobrepostos. Retém só um lote de até 500 medidas em memória na falha de rede. Não há fila persistente no disco; ao desconectar/encerrar o app, o lote se perde e a janela será relida no próximo login. Exclusões e correções no Apple Saúde não são propagadas ao servidor nesta versão.

Ausência de amostras não comprova recusa nem ausência de doença: HealthKit não revela todas as recusas de leitura. Não envia zeros como ausência. Respostas 401 pausam a sincronização automática e pedem novo login. Rejeições permanentes requerem revisão; não são apresentadas como sucesso.

## Rede

HTTPS é o caminho para uso real. HTTP é permitido apenas para demonstração em endereços `192.168.*`, `10.*` e `.local` e transmite credenciais/dados sem criptografia; usar somente dados fictícios em rede de testes. A configuração ATS permite rede local, sem `NSAllowsArbitraryLoads`. Autorizar o acesso à rede local quando o iOS perguntar. Firewall do notebook precisa permitir a API. O aplicativo não depende de CORS do Safari, mas o navegador continua respeitando as origens autorizadas.

## Validação pendente no Mac/iPhone

- Compilar com Xcode, instalar e conferir HealthKit e acesso à rede local.
- Autorizar só algumas medidas, negar todas e testar sem dados.
- Confirmar unidades e horários usando leituras conhecidas no Apple Saúde.
- Sincronizar duas vezes, adicionar leitura nova e verificar deduplicação no site.
- Derrubar Wi-Fi depois do envio e antes da resposta, restaurar e repetir.
- Desconectar durante leitura/envio e trocar de conta: nenhum lote anterior pode ir para outra conta.
- Expirar a sessão; confirmar pausa e necessidade de novo login.
- Conferir que desativar o toggle, bloquear o celular ou sair do app interrompe novas tentativas de foreground.

Referências oficiais: [autorização HealthKit](https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data), [HKSampleQuery](https://developer.apple.com/documentation/healthkit/hksamplequery), [rede local](https://developer.apple.com/documentation/bundleresources/information-property-list/nslocalnetworkusagedescription), [ATS local](https://developer.apple.com/documentation/bundleresources/information-property-list/nsapptransportsecurity/nsallowslocalnetworking).
