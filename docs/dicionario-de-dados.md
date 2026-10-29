# Dicionário de dados do Celebra

Este dicionário foi alinhado ao [modelo oficial de banco e regras](modelo-banco-e-regras-celebra.md). Os nomes persistidos abaixo são os nomes em português do contrato atual; os aliases em inglês existentes no estado React servem somente para compatibilidade da interface.

## Convenções

- Firebase Authentication guarda a credencial de e-mail/senha; o Firestore guarda o perfil e os dados operacionais.
- O ID de `usuarios` é o mesmo UID do Firebase Authentication.
- Datas são `Timestamp` do Firestore. `chave_data` usa `AAAA-MM-DD`.
- `papel` é booleano: `true` representa administrador e `false` representa funcionário. `tipo_acesso` em `membros` continua sendo texto para registrar o vínculo.
- O cliente não pode escolher nem alterar o papel, a empresa ou o status de acesso.
- Cadastros administrativos são arquivados com `ativo: false`; a exclusão física é bloqueada para preservar referências históricas. O organizador pode reativar um cadastro arquivado.

## `usuarios/{id_usuario}`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|:---:|---|
| `id_usuario` | string | sim | UID do Firebase Authentication e chave do documento. |
| `nome_completo` | string | sim | Nome usado no perfil. |
| `email` | string | sim | E-mail de login. |
| `telefone` | string | não | Telefone/WhatsApp com DDD. |
| `papel` | boolean | sim | `true` para administrador; `false` para funcionário. |
| `id_empresa` | string/null | não | Empresa vinculada; fica nulo até o vínculo. |
| `ativo` | boolean | sim | Libera ou bloqueia o acesso. |
| `criado_em` | Timestamp | sim | Data de criação do perfil. |

O serviço [`servicoAutenticacao.js`](../src/servicos/servicoAutenticacao.js) cria novos cadastros com `papel: false`, sem empresa. A sessão mantém o mesmo booleano; somente `true` abre a navegação do administrador e `false` abre a do funcionário.

## `empresas/{id_empresa}`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|:---:|---|
| `id_empresa` | string | sim | Chave da empresa. |
| `codigo_vinculo` | string | não | Campo legado. No fluxo atual, o ID do documento de `empresas` é o código usado no vínculo. |
| `nome_fantasia` | string | sim | Nome exibido no app. |
| `razao_social` | string | não | Razão social. |
| `cnpj` | string | não | CNPJ. |
| `email` | string | não | E-mail comercial. |
| `telefone` | string | não | Contato comercial. |
| `endereco` | map | não | `rua`, `numero`, `complemento`, `bairro`, `cidade`, `estado`, `cep`. |
| `id_dono` | string | sim | Usuário administrador dono. |
| `criado_em` | Timestamp | sim | Auditoria. |

## `membros/{id_membro}`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|:---:|---|
| `id_membro` | string | sim | Chave do vínculo. |
| `id_empresa` | string | sim | Empresa do vínculo. |
| `id_usuario` | string | sim | Usuário vinculado. |
| `tipo_acesso` | string | sim | `administrador` ou `funcionario`. |
| `id_tipo_profissional` | string | não | Especialidade do funcionário. |
| `situacao` | string | sim | `ativo`, `pendente_aprovacao` ou `bloqueado`. |
| `data_vinculo` | Timestamp | sim | Data do vínculo. |

## `clientes/{id_cliente}`

`id_cliente`, `id_empresa`, `nome`, `documento`, `email`, `telefone`, `observacoes`, `ativo` e `criado_em`. O documento pertence à empresa indicada por `id_empresa`; o campo `id_cliente` repete o ID do documento.

## `tipos_evento/{id_tipo_evento}`

Contém `id_tipo_evento`, `id_empresa`, `nome`, `descricao` opcional, `ativo` e `criado_em`. O campo `id_tipo_evento` repete o ID do documento.

## `tipos_profissional/{id_tipo_profissional}` e `tipos_local/{id_tipo_local}`

Cada catálogo contém o campo identificador correspondente (`id_tipo_profissional` ou `id_tipo_local`), `id_empresa`, `nome`, `descricao` quando aplicável, `ativo` e `criado_em`. O identificador repete o ID do documento. Esses documentos são administrados pela empresa.

## `locais/{id_local}`

Contém `id_local`, `id_empresa`, `nome`, `id_tipo_local`, `endereco_completo`, `coordenadas`, `capacidade`, `observacoes`, `ativo` e `criado_em`. `id_local` repete o ID do documento e `id_tipo_local` aponta para `tipos_local` da mesma empresa. Cadastros são arquivados com `ativo: false`, preservando referências históricas; o organizador pode reativá-los.

## `eventos/{id_evento}`

Contém `id_evento`, `id_empresa`, `titulo`, `id_tipo_evento`, `id_cliente`, `id_local`, `data_inicio`, `data_fim`, `quantidade_convidados`, `membros_escalados` (lista de `id_usuario` que aceitaram o convite), `equipe_informativa` (lista opcional de profissionais registrados sem convite no app), `situacao` (`aberto`, `em_andamento`, `concluido` ou `cancelado`), `observacoes` e `criado_em`. `id_tipo_evento` vincula o evento ao catálogo da própria empresa; `quantidade_convidados` é opcional.

## `convites/{id_convite}`

Contém `id_convite`, `id_empresa`, `id_evento`, `id_usuario`, `id_tipo_profissional`, `nome_profissional`, `nome_tipo_profissional`, `situacao` (`pendente`, `aceito` ou `recusado`), `enviado_em` e `respondido_em`. Os nomes são cópias de exibição para manter o histórico do evento. O ID do documento de convite usa `{id_evento}_{id_usuario}` para permitir uma única convocação por pessoa/evento. Ao aceitar, o usuário também entra em `eventos.membros_escalados` na mesma transação.

## `indisponibilidade/{id_indisponibilidade}`

Contém `id_usuario`, `data`, `chave_data`, `motivo` opcional e `criado_em`. O ID recomendado é `{id_usuario}_{chave_data}` para impedir duplicidade diária.

## Fluxo de autenticação

1. Authentication cria o usuário.
2. Firestore cria `usuarios/{uid}` com `papel: false`, `id_empresa: null` e `ativo: true`.
3. No login, o app lê o perfil pelo UID e roteia o funcionário ou administrador.
4. Após criar a conta, o usuário informa o ID do documento da empresa (20 caracteres). O app cria `membros` e atualiza `usuarios.id_empresa` no mesmo lote; as regras do Firestore validam o usuário, a empresa e o vínculo. O cadastro da empresa acontece pelo fluxo administrativo.
5. Usuário inexistente ou inativo não deve acessar dados operacionais.

## Consultas por tela

- Login: Firebase Authentication por e-mail; perfil em `usuarios/{uid}`.
- Perfil: o usuário lê o próprio perfil e atualiza `nome_completo` e `telefone`; organizadores ativos podem consultar os perfis de funcionários ativos da própria empresa para montar a equipe do evento.
- Convites: `convites` por `id_usuario`.
- Agenda: `eventos` por `id_empresa` e `membros_escalados`, mais `indisponibilidade` por `id_usuario`.
- Área administrativa: coleções filtradas por `id_empresa`.

As regras versionadas estão em [`firestore.rules`](../firestore.rules). O documento de modelo contém o detalhamento de negócio e deve ser atualizado junto deste arquivo quando houver mudança de contrato.
