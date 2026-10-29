# Guia do Firebase — modelo Celebra

Este guia usa como fonte de verdade o [modelo de banco e regras](modelo-banco-e-regras-celebra.md). O aplicativo usa Firebase Authentication para a senha e Cloud Firestore para o perfil do usuário. A senha nunca é gravada em uma coleção.

## Configuração

1. No Firebase Console, ative Authentication → Sign-in method → E-mail/senha.
2. Crie o Cloud Firestore no projeto `celebra-c8f9e`, preferencialmente em `southamerica-east1`.
3. Publique o arquivo [`firestore.rules`](../firestore.rules).
4. Publique as funções de `functions/` com `firebase deploy --only functions`.
5. O app grava automaticamente o perfil em `usuarios/{id_usuario}` após o cadastro.

## Cadastro e login

O cadastro solicita nome completo, e-mail e senha. O Firebase Authentication cria a credencial; em seguida o app cria:

```text
usuarios/{uid}
  id_usuario: uid
  nome_completo: string
  email: string
  telefone: string
  papel: false
  id_empresa: null
  ativo: true
  criado_em: Timestamp
```

O papel inicial é `false` e `id_empresa` fica nulo. Depois do cadastro pessoal, o usuário informa o código de vínculo fornecido pela empresa. O cadastro da empresa acontece pelo fluxo administrativo. A senha fica somente no Firebase Authentication.

O login usa o e-mail da conta. O campo “usuário” foi removido da tela porque não existe na tabela oficial `usuarios`.

## Cadastro de empresa e vínculo de funcionário

O cadastro da empresa é feito pelo fluxo administrativo. Para se vincular, o funcionário informa o ID do documento da empresa (20 caracteres). O app grava `membros` e atualiza `usuarios.id_empresa` no mesmo lote; as regras do Firestore só aceitam esse vínculo para o próprio usuário, com `papel: false` e uma empresa existente. O app nunca altera `papel`. O administrador da própria empresa pode editar os campos comerciais permitidos (`nome_fantasia`, `razao_social`, `cnpj`, `email`, `telefone` e `endereco`); as regras bloqueiam alterações aos demais campos.

## Estrutura de coleções

```text
usuarios/{id_usuario}
empresas/{id_empresa}
membros/{id_membro}
clientes/{id_cliente}
tipos_profissional/{id_tipo_profissional}
locais/{id_local}
tipos_local/{id_tipo_local}
eventos/{id_evento}
convites/{id_convite}
indisponibilidade/{id_indisponibilidade}
```

Todos os caminhos acima são coleções de primeiro nível e usam os nomes e campos em português definidos no documento de modelo. O dicionário completo está em [dicionario-de-dados.md](dicionario-de-dados.md).

## Teste manual

Crie uma conta pela tela de cadastro e informe o ID de uma empresa existente. Confirme o vínculo em `usuarios` e `membros`. Publique primeiro as regras atualizadas do Firestore. Não copie os campos antigos `users`, `role`, `companyId`, `active`, `createdAt` ou `updatedAt`.

## Segurança

As regras bloqueiam a alteração client-side de papel, empresa e ativo. O cliente valida o UID antes de atualizar o próprio perfil, mas a autorização real fica no Firestore. Antes de produção, publique e valide as regras com usuários de ambos os papéis, incluindo leitura, vínculo por código, convites e indisponibilidade.
