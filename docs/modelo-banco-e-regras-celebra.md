# Documentação Oficial do Banco de Dados e Regras de Negócio — Celebra

Este documento descreve a arquitetura completa do banco de dados Cloud Firestore do aplicativo **Celebra**, detalhando o funcionamento dos perfis de usuário, as regras de negócio operacionais e todas as tabelas (coleções) modeladas de forma plana e 100% em português.

---

## 1. Visão Geral e Modos de Operação

O sistema Celebra opera em **dois modos principais**:

```
+-----------------------------------------------------------------------------------+
|                                  SISTEMA CELEBRA                                  |
+-----------------------------------------+-----------------------------------------+
|        1. MODO ADMINISTRADOR (ADM)      |      2. MODO FUNCIONÁRIO (COLABORADOR)  |
+-----------------------------------------+-----------------------------------------+
| - Cadastra e gerencia a empresa         | - Cria conta pessoal no aplicativo      |
| - Gera o código de vínculo da equipe    | - Digita o código da empresa e vincula  |
| - Cadastra clientes, locais e funções   | - Marca seus dias de indisponibilidade  |
| - Cria e programa eventos               | - Visualiza eventos disponíveis         |
| - Convoca técnicos e acompanha respostas| - Visualiza eventos em que está escalado|
| - Consulta agenda de indisponibilidade  | - Aceita ou recusa convites de trabalho |
+-----------------------------------------+-----------------------------------------+
```

---

## 2. Lógica das Regras de Negócio

### 2.1. Vínculo por Código da Empresa
1. A pessoa cria a conta e o perfil nasce com `papel = false` e `id_empresa = null`.
2. A empresa e o administrador são cadastrados pelo fluxo administrativo existente; o administrador fornece o código de vínculo à equipe.
3. Depois de criar a conta, o funcionário informa o ID do documento da empresa (20 caracteres). O app grava `membros` e atualiza `usuarios.id_empresa` em um único lote; as regras do Firestore só permitem isso para o próprio usuário, com `papel = false` e empresa existente. O cliente nunca altera `papel`.

### 2.2. Eventos Disponíveis vs. Eventos Inscritos
- **Eventos Inscritos (Confirmados):**
  - Consulta na coleção `eventos` onde `id_empresa == empresa_do_usuario` e a lista `membros_escalados` **contém** o `id_usuario`.
- **Eventos Disponíveis (Vagas abertas):**
  - Consulta na coleção `eventos` com `situacao == "aberto"` onde a lista `membros_escalados` **NÃO contém** o `id_usuario`. O colaborador visualiza o evento para saber que a produtora tem trabalho agendado.

### 2.3. Bloqueio de Agenda (Indisponibilidade)
- O funcionário acessa seu calendário no app e seleciona as datas em que não pode prestar serviço (ex: compromissos pessoais, viagens).
- O app grava essas datas na tabela `indisponibilidade` com o campo `chave_data` no formato `"AAAA-MM-DD"`.
- Ao criar um evento ou disparar um convite, o Administrador é avisado caso o funcionário selecionado possua um bloqueio registrado naquela mesma data.

### 2.4. Fluxo de Convites
1. O Administrador escala um membro para o evento e cria um registro na tabela `convites` com `situacao = "pendente"`.
2. O funcionário recebe a notificação no app.
3. Se o funcionário **aceitar**: o convite vai para `situacao = "aceito"` e o `id_usuario` é adicionado à lista `membros_escalados` do evento.
4. Se o funcionário **recusar**: o convite vai para `situacao = "recusado"` e o Administrador pode convocar outro profissional.

---

## 3. Estrutura das Coleções no Cloud Firestore

Todas as coleções ficam no **primeiro nível (raiz)** do banco de dados, sem tabelas aninhadas dentro de outras. A integridade e os filtros são feitos pelas chaves de ligação (`id_empresa`, `id_usuario`, `id_evento`).

```text
(default)
 ├── usuarios
 ├── empresas
 ├── membros
 ├── clientes
 ├── tipos_evento
 ├── tipos_profissional
 ├── locais
 ├── tipos_local
 ├── eventos
 ├── convites
 └── indisponibilidade
```

---

## 4. Dicionário Completo das Tabelas

### 4.1. Tabela: `usuarios`
> Perfis de login e credenciais do aplicativo.

| Coluna | Tipo de Dado | Obrigatório? | Chave / Ligação | Descrição |
|---|---|:---:|:---:|---|
| `id_usuario` | texto | Sim | Chave Primária | Identificador único (mesmo UID do Firebase Auth) |
| `nome_completo` | texto | Sim | - | Nome e sobrenome do usuário |
| `email` | texto | Sim | - | E-mail autenticado de login |
| `telefone` | texto | Não | - | Telefone ou WhatsApp com DDD |
| `papel` | booleano | Sim | - | `true` para administrador ou `false` para funcionário |
| `id_empresa` | texto | Não | Chave Estrangeira → `empresas` | Empresa vinculada (nulo enquanto não vinculado) |
| `ativo` | booleano | Sim | - | `true` (acesso liberado) ou `false` (bloqueado) |
| `criado_em` | data e hora | Sim | Auditoria | Data e hora em que a conta foi criada |

---

### 4.2. Tabela: `empresas`
> Dados cadastrais da produtora/empresa e código de acesso da equipe.

| Coluna | Tipo de Dado | Obrigatório? | Chave / Ligação | Descrição |
|---|---|:---:|:---:|---|
| `id_empresa` | texto | Sim | Chave Primária | Identificador único da empresa |
| `codigo_vinculo` | texto | Não | Legado | O app usa o ID do documento de `empresas` como código de vínculo. |
| `nome_fantasia` | texto | Sim | - | Nome da empresa exibido no aplicativo |
| `razao_social` | texto | Não | - | Razão social registrada |
| `cnpj` | texto | Não | - | Documento oficial CNPJ |
| `email` | texto | Não | - | E-mail comercial ou de contato |
| `telefone` | texto | Não | - | Telefone / WhatsApp da empresa |
| `endereco` | objeto (mapa) | Não | - | `rua`, `numero`, `complemento`, `bairro`, `cidade`, `estado`, `cep` |
| `id_dono` | texto | Sim | Chave Estrangeira → `usuarios` | `id_usuario` do administrador criador da empresa |
| `criado_em` | data e hora | Sim | Auditoria | Data e hora de criação da empresa |

---

### 4.3. Tabela: `membros`
> Gestão da equipe vinculada à empresa (quem é administrador, quem é funcionário comum e função exercida).

| Coluna | Tipo de Dado | Obrigatório? | Chave / Ligação | Descrição |
|---|---|:---:|:---:|---|
| `id_membro` | texto | Sim | Chave Primária | Identificador único do registro de equipe |
| `id_empresa` | texto | Sim | Chave Estrangeira → `empresas` | Empresa proprietária |
| `id_usuario` | texto | Sim | Chave Estrangeira → `usuarios` | Usuário vinculado à equipe |
| `tipo_acesso` | texto | Sim | - | `"administrador"` (gerencia tudo) ou `"funcionario"` (comum) |
| `id_tipo_profissional` | texto | Não | Chave Estrangeira → `tipos_profissional` | Especialidade do técnico (ex: Filmmaker, Drone...) |
| `situacao` | texto | Sim | - | `"ativo"`, `"pendente_aprovacao"` ou `"bloqueado"` |
| `data_vinculo` | data e hora | Sim | - | Data em que ingressou na empresa |

---

### 4.4. Tabela: `clientes`
> Cadastro dos clientes atendidos pela empresa.

| Coluna | Tipo de Dado | Obrigatório? | Chave / Ligação | Descrição |
|---|---|:---:|:---:|---|
| `id_cliente` | texto | Sim | Chave Primária | Identificador único do cliente |
| `id_empresa` | texto | Sim | Chave Estrangeira → `empresas` | Empresa prestadora do serviço |
| `nome` | texto | Sim | - | Nome completo da pessoa física ou razão social |
| `documento` | texto | Não | - | CPF ou CNPJ do cliente |
| `email` | texto | Não | - | E-mail do cliente para envio de orçamentos e contato |
| `telefone` | texto | Não | - | Telefone ou WhatsApp |
| `observacoes` | texto | Não | - | Particularidades, preferências e anotações |
| `ativo` | booleano | Sim | - | `true` (ativo) ou `false` (arquivado) |
| `criado_em` | data e hora | Sim | Auditoria | Data do cadastro |

---

### 4.5. Tabela: `tipos_evento`
> Catálogo de tipos de evento configurado por cada empresa.

| Coluna | Tipo de Dado | Obrigatório? | Chave / Ligação | Descrição |
|---|---|:---:|:---:|---|
| `id_tipo_evento` | texto | Sim | Chave Primária | Identificador único do tipo |
| `id_empresa` | texto | Sim | Chave Estrangeira → `empresas` | Empresa dona do catálogo |
| `nome` | texto | Sim | - | Ex: `Casamento`, `15 Anos`, `Formatura` |
| `descricao` | texto | Não | - | Detalhes do tipo de evento |
| `ativo` | booleano | Sim | - | `true` (disponível) ou `false` (oculto) |
| `criado_em` | data e hora | Sim | Auditoria | Data do cadastro |

---

### 4.6. Tabela: `tipos_profissional`
> Catálogo configurável de cargos e especialidades da equipe.

| Coluna | Tipo de Dado | Obrigatório? | Chave / Ligação | Descrição |
|---|---|:---:|:---:|---|
| `id_tipo_profissional` | texto | Sim | Chave Primária | Identificador único do tipo |
| `id_empresa` | texto | Sim | Chave Estrangeira → `empresas` | Empresa dona do catálogo |
| `nome` | texto | Sim | - | Ex: `"Filmmaker"`, `"Operador de Drone"`, `"Fotógrafo"`, `"Técnico de Som"` |
| `descricao` | texto | Não | - | Atribuições e responsabilidades da função |
| `ativo` | booleano | Sim | - | `true` (disponível para escalar) ou `false` (oculto) |

---

### 4.7. Tabela: `tipos_local`
> Catálogo configurável das categorias de locais.

| Coluna | Tipo de Dado | Obrigatório? | Chave / Ligação | Descrição |
|---|---|:---:|:---:|---|
| `id_tipo_local` | texto | Sim | Chave Primária | Identificador único |
| `id_empresa` | texto | Sim | Chave Estrangeira → `empresas` | Empresa dona do catálogo |
| `nome` | texto | Sim | - | Ex: `"Salão de Festas"`, `"Igreja"`, `"Sítio"`, `"Praia"`, `"Hotel"` |
| `ativo` | booleano | Sim | - | `true` ou `false` |

---

### 4.8. Tabela: `locais`
> Cadastro dos locais para realização dos eventos com endereço e localização.

| Coluna | Tipo de Dado | Obrigatório? | Chave / Ligação | Descrição |
|---|---|:---:|:---:|---|
| `id_local` | texto | Sim | Chave Primária | Identificador único do local |
| `id_empresa` | texto | Sim | Chave Estrangeira → `empresas` | Empresa dona do cadastro |
| `nome` | texto | Sim | - | Nome do local (ex: `"Mansão Villa Real"`) |
| `id_tipo_local` | texto | Não | Chave Estrangeira → `tipos_local` | Categoria do espaço |
| `endereco_completo` | texto | Sim | - | Endereço com rua, número, bairro, cidade |
| `coordenadas` | mapa / geopoint | Não | - | Latitude e longitude para rotas no mapa |
| `capacidade` | número | Não | - | Capacidade máxima de convidados suportada |
| `observacoes` | texto | Não | - | Orientações de carga/descarga, energia, gerador |
| `ativo` | booleano | Sim | - | `true` (ativo para agendar) ou `false` |

---

### 4.9. Tabela: `eventos`
> Registro dos eventos da empresa, com datas, locais, cliente e equipe escalada.

| Coluna | Tipo de Dado | Obrigatório? | Chave / Ligação | Descrição |
|---|---|:---:|:---:|---|
| `id_evento` | texto | Sim | Chave Primária | Identificador único do evento |
| `id_empresa` | texto | Sim | Chave Estrangeira → `empresas` | Empresa organizadora |
| `titulo` | texto | Sim | - | Título (ex: `"Casamento Juliana & Marcos"`) |
| `id_tipo_evento` | texto | Sim | Chave Estrangeira → `tipos_evento` | Categoria do evento cadastrada pela empresa |
| `id_cliente` | texto | Sim | Chave Estrangeira → `clientes` | Cliente contratante |
| `id_local` | texto | Sim | Chave Estrangeira → `locais` | Local principal onde ocorrerá o evento |
| `data_inicio` | data e hora | Sim | - | Data e horário de início da programação |
| `data_fim` | data e hora | Não | - | Data e horário de término previsto |
| `quantidade_convidados` | número | Não | - | Estimativa de participantes do evento |
| `membros_escalados` | lista de textos | Sim | Lista de `id_usuario` | **IDs dos técnicos/membros confirmados no evento** |
| `situacao` | texto | Sim | - | `"aberto"`, `"em_andamento"`, `"concluido"` ou `"cancelado"` |
| `observacoes` | texto | Não | - | Roteiro, horários de montagem e instruções |
| `criado_em` | data e hora | Sim | Auditoria | Data e hora de criação do evento |

---

### 4.10. Tabela: `convites`
> Registro e disparo de convites/escalas feitas pelo Administrador para a equipe.

| Coluna | Tipo de Dado | Obrigatório? | Chave / Ligação | Descrição |
|---|---|:---:|:---:|---|
| `id_convite` | texto | Sim | Chave Primária | Identificador único do convite |
| `id_empresa` | texto | Sim | Chave Estrangeira → `empresas` | Empresa remetente |
| `id_evento` | texto | Sim | Chave Estrangeira → `eventos` | Evento para o qual o profissional foi chamado |
| `id_usuario` | texto | Sim | Chave Estrangeira → `usuarios` | Funcionário convocado |
| `id_tipo_profissional` | texto | Não | Chave Estrangeira → `tipos_profissional` | Especialidade requisitada (ex: `"Filmmaker"`) |
| `situacao` | texto | Sim | - | `"pendente"`, `"aceito"` ou `"recusado"` |
| `enviado_em` | data e hora | Sim | - | Momento do disparo do convite |
| `respondido_em` | data e hora | Não | - | Momento em que o funcionário aceitou ou recusou |

---

### 4.11. Tabela: `indisponibilidade`
> Registro dos dias em que cada funcionário avisa que não poderá trabalhar.

| Coluna | Tipo de Dado | Obrigatório? | Chave / Ligação | Descrição |
|---|---|:---:|:---:|---|
| `id_indisponibilidade` | texto | Sim | Chave Primária | Identificador único (ex: `idUsuario_AAAA-MM-DD`) |
| `id_usuario` | texto | Sim | Chave Estrangeira → `usuarios` | Funcionário que cadastrou o bloqueio |
| `data` | data e hora | Sim | - | Data em que o profissional estará indisponível |
| `chave_data` | texto | Sim | Índice rápido | Data formatada `"AAAA-MM-DD"` (ex: `"2026-10-30"`) |
| `motivo` | texto | Não | - | Motivo opcional (ex: `"Viagem"`, `"Compromisso pessoal"`) |
| `criado_em` | data e hora | Sim | Auditoria | Data de registro do bloqueio |

---

## 5. Regras de Segurança do Firebase (`firestore.rules`)

As regras versionadas estão em [`firestore.rules`](../firestore.rules). Elas aplicam o princípio de menor privilégio: o usuário lê o próprio `usuarios/{id_usuario}`, não altera `papel`, `id_empresa` ou `ativo`, gerencia somente sua `indisponibilidade`, responde somente aos próprios `convites` e acessa dados da empresa apenas quando está vinculado e ativo. Não use regras genéricas que liberem todas as coleções para qualquer usuário autenticado.
