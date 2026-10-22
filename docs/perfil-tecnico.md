# Perfil do técnico

## Escopo

A aba Perfil segue o quadro do Figma e usa os serviços existentes de Firebase Authentication e Cloud Firestore. A tela permite editar os dados pessoais cadastrados, manter uma preferência de notificação, solicitar redefinição de senha por e-mail e sair da conta.

## Dados exibidos e persistidos

O perfil vem de `users/{uid}`. São lidos `displayName`, `email`, `cpf`, `phone`, `city`, `companyId` e `notificationPreferences`. Se houver `companyId`, o app tenta ler `companies/{companyId}.name` para mostrar a empresa; uma falha nessa leitura opcional não bloqueia o perfil. Campos ainda não preenchidos são apresentados como não informados.

O formulário edita somente nome para exibição, CPF, telefone e cidade. O e-mail é mostrado como leitura e não pode ser alterado por esta tela. CPF e telefone são enviados ao Firestore somente com dígitos; CPF deve ter 11 dígitos e telefone deve ter DDD (10 ou 11 dígitos). O nome é obrigatório e limitado a 100 caracteres. O serviço confere que o UID informado corresponde à conta autenticada antes de escrever. A escrita também atualiza `updatedAt`.

O botão **Eventos e equipe** grava `notificationPreferences.eventsAndTeam` no documento do usuário. Se a preferência não existir, a interface considera o padrão `true`, compatível com o protótipo. A opção registra uma preferência; o envio de push notifications não faz parte desta implementação.

O item **Segurança da conta** solicita ao Firebase Authentication o envio de um link de redefinição para o e-mail da conta. A senha não é lida nem armazenada pelo app. **Sair da conta** continua usando a rotina de logout que já existia.

## Arquivos alterados

- `src/screens/TechnicianDashboardScreen.js`: estado do perfil, formulário, validação de apresentação, alteração da preferência, pedido de redefinição e layout da aba.
- `src/styles/technicianDashboardStyles.js`: estilos alinhados à tela do Figma.
- `src/services/userService.js`: leitura dos campos pessoais e da preferência, atualização segura por lista permitida e leitura opcional do nome da empresa.
- `src/services/authService.js`: envio de e-mail de redefinição de senha pelo Firebase Authentication e inicialização dos novos campos no cadastro.
- `docs/dicionario-de-dados.md`: inclusão dos campos pessoais e de preferência em `users/{uid}`.

## Limites entre prévia e conta real

Em `http://localhost:8081/?preview=technician`, editar o perfil e alternar a preferência altera somente o estado local da demonstração; nada é gravado no Firebase. A redefinição de senha é desabilitada nesse modo. Com uma conta autenticada, as operações chamam os serviços do Firebase.

## Segurança e configuração do Firebase

CPF é dado pessoal. O repositório não contém `firestore.rules`, nem há configuração de deploy do Firebase versionada aqui. Portanto, a autorização final das leituras e gravações depende das regras configuradas no projeto remoto. Antes de usar com dados reais, confirme que as regras permitem ao usuário autenticado ler e atualizar somente os campos de perfil do próprio `users/{uid}`, impedem alteração de `role`, `companyId`, `active` e outros campos de acesso, e restringem o acesso aos dados pessoais. A leitura de `companies/{companyId}` deve ser autorizada apenas aos membros pertinentes.

O app usa Firebase diretamente do cliente; esta implementação não cria uma Cloud Function ou um servidor próprio. O link de redefinição depende do provedor de e-mail e das configurações do Firebase Authentication.
