# Perfil do técnico

## Escopo

A aba Perfil segue o quadro do Figma e usa os serviços existentes de Firebase Authentication e Cloud Firestore. A tela permite editar os dados pessoais cadastrados, manter uma preferência de notificação, solicitar redefinição de senha por e-mail e sair da conta.

## Dados exibidos e persistidos

O perfil vem de `usuarios/{id_usuario}`. São lidos `nome_completo`, `email`, `telefone`, `id_empresa`, `papel` e `ativo`; em `papel`, `true` significa administrador e `false` significa funcionário. Se houver `id_empresa`, o app tenta ler `empresas/{id_empresa}.nome_fantasia` para mostrar a empresa; uma falha nessa leitura opcional não bloqueia o perfil.

O formulário pode editar nome completo e telefone. O e-mail, papel, empresa e ativo são somente leitura. O telefone é enviado ao Firestore somente com dígitos; o nome é obrigatório e limitado a 120 caracteres. O serviço confere que o UID informado corresponde à conta autenticada antes de escrever.

Preferências de notificação ainda não fazem parte da tabela oficial `usuarios`; o controle visual existente deve ser tratado como pendência de interface até que um campo seja incluído no modelo.

O item **Segurança da conta** solicita ao Firebase Authentication o envio de um link de redefinição para o e-mail da conta. A senha não é lida nem armazenada pelo app. **Sair da conta** continua usando a rotina de logout que já existia.

## Arquivos alterados

- `src/screens/TechnicianDashboardScreen.js`: estado do perfil, formulário, validação de apresentação, alteração da preferência, pedido de redefinição e layout da aba.
- `src/styles/technicianDashboardStyles.js`: estilos alinhados à tela do Figma.
- `src/servicos/servicoUsuario.js`: leitura e atualização segura de `usuarios/{id_usuario}` e leitura opcional do nome da empresa.
- `src/servicos/servicoAutenticacao.js`: login por e-mail, redefinição de senha e criação do perfil inicial em `usuarios/{id_usuario}`.
- `docs/dicionario-de-dados.md`: contrato oficial de `usuarios`, `empresas` e demais coleções.

## Limites entre prévia e conta real

Em `http://localhost:8081/?preview=technician`, editar o perfil e alternar a preferência altera somente o estado local da demonstração; nada é gravado no Firebase. A redefinição de senha é desabilitada nesse modo. Com uma conta autenticada, as operações chamam os serviços do Firebase.

## Segurança e configuração do Firebase

O arquivo [`firestore.rules`](../firestore.rules) restringe o perfil ao próprio UID e impede alteração client-side de `papel`, `id_empresa` e `ativo`. A leitura de `empresas/{id_empresa}` deve ser autorizada somente a membros da empresa.

O app usa Firebase diretamente do cliente; esta implementação não cria uma Cloud Function ou um servidor próprio. O link de redefinição depende do provedor de e-mail e das configurações do Firebase Authentication.
