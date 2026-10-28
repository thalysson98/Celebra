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
1. O Administrador cadastra sua empresa na tabela `empresas`. O sistema gera um código único e legível (ex: `"CEL-8492"` no campo `codigo_vinculo`).
2. O funcionário baixa o app, cria sua conta na tabela `usuarios` e, na tela inicial, digita o código da empresa.
3. Ao validar o código, o sistema cria o registro na tabela `membros` com `tipo_acesso = "funcionario"` e atualiza o `id_empresa` no perfil do usuário.

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
| `papel` | texto | Sim | - | `"administrador"` ou `"funcionario"` |
| `id_empresa` | texto | Não | Chave Estrangeira → `empresas` | Empresa vinculada (nulo enquanto não vinculado) |
| `ativo` | booleano | Sim | - | `true` (acesso liberado) ou `false` (bloqueado) |
| `criado_em` | data e hora | Sim | Auditoria | Data e hora em que a conta foi criada |

---

### 4.2. Tabela: `empresas`
> Dados cadastrais da produtora/empresa e código de acesso da equipe.

| Coluna | Tipo de Dado | Obrigatório? | Chave / Ligação | Descrição |
|---|---|:---:|:---:|---|
| `id_empresa` | texto | Sim | Chave Primária | Identificador único da empresa |
| `codigo_vinculo` | texto | Sim | Código Único | Código compartilhado com funcionários (ex: `"CEL-8492"`) |
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

### 4.5. Tabela: `tipos_profissional`
> Catálogo configurável de cargos e especialidades da equipe.

| Coluna | Tipo de Dado | Obrigatório? | Chave / Ligação | Descrição |
|---|---|:---:|:---:|---|
| `id_tipo_profissional` | texto | Sim | Chave Primária | Identificador único do tipo |
| `id_empresa` | texto | Sim | Chave Estrangeira → `empresas` | Empresa dona do catálogo |
| `nome` | texto | Sim | - | Ex: `"Filmmaker"`, `"Operador de Drone"`, `"Fotógrafo"`, `"Técnico de Som"` |
| `descricao` | texto | Não | - | Atribuições e responsabilidades da função |
| `ativo` | booleano | Sim | - | `true` (disponível para escalar) ou `false` (oculto) |

---

### 4.6. Tabela: `tipos_local`
> Catálogo configurável das categorias de locais.

| Coluna | Tipo de Dado | Obrigatório? | Chave / Ligação | Descrição |
|---|---|:---:|:---:|---|
| `id_tipo_local` | texto | Sim | Chave Primária | Identificador único |
| `id_empresa` | texto | Sim | Chave Estrangeira → `empresas` | Empresa dona do catálogo |
| `nome` | texto | Sim | - | Ex: `"Salão de Festas"`, `"Igreja"`, `"Sítio"`, `"Praia"`, `"Hotel"` |
| `ativo` | booleano | Sim | - | `true` ou `false` |

---

### 4.7. Tabela: `locais`
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

### 4.8. Tabela: `eventos`
> Registro dos eventos da empresa, com datas, locais, cliente e equipe escalada.

| Coluna | Tipo de Dado | Obrigatório? | Chave / Ligação | Descrição |
|---|---|:---:|:---:|---|
| `id_evento` | texto | Sim | Chave Primária | Identificador único do evento |
| `id_empresa` | texto | Sim | Chave Estrangeira → `empresas` | Empresa organizadora |
| `titulo` | texto | Sim | - | Título (ex: `"Casamento Juliana & Marcos"`) |
| `id_cliente` | texto | Sim | Chave Estrangeira → `clientes` | Cliente contratante |
| `id_local` | texto | Sim | Chave Estrangeira → `locais` | Local principal onde ocorrerá o evento |
| `data_inicio` | data e hora | Sim | - | Data e horário de início da programação |
| `data_fim` | data e hora | Não | - | Data e horário de término previsto |
| `membros_escalados` | lista de textos | Sim | Lista de `id_usuario` | **IDs dos técnicos/membros confirmados no evento** |
| `situacao` | texto | Sim | - | `"aberto"`, `"em_andamento"`, `"concluido"` ou `"cancelado"` |
| `observacoes` | texto | Não | - | Roteiro, horários de montagem e instruções |
| `criado_em` | data e hora | Sim | Auditoria | Data e hora de criação do evento |

---

### 4.9. Tabela: `convites`
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

### 4.10. Tabela: `indisponibilidade`
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

Para proteger os dados e garantir que cada empresa e funcionário só acesse o que lhe pertence:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Perfil do usuário: cada usuário pode ler e editar seu próprio perfil
    match /usuarios/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Bloqueios de agenda: funcionário gerencia seus próprios dias de indisponibilidade
    match /indisponibilidade/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (request.resource.data.id_usuario == request.auth.uid || resource.data.id_usuario == request.auth.uid);
    }

    // Convites: o funcionário pode responder aos convites disparados para ele
    match /convites/{id} {
      allow read: if request.auth != null;
      allow update: if request.auth != null && resource.data.id_usuario == request.auth.uid;
      allow create, delete: if request.auth != null;
    }

    // Demais tabelas da empresa (empresas, membros, clientes, locais, tipos, eventos)
    match /{colecao}/{documento} {
      allow read, write: if request.auth != null;
    }
  }
}
```
