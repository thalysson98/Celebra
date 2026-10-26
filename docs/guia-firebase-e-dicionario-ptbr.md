# Guia do Firebase e Dicionário de Dados — Celebra

Este documento reúne as instruções passo a passo para configuração no Firebase Console, a criação dos primeiros documentos e o dicionário de campos traduzido para Português (Brasil) com correspondência técnica no Cloud Firestore.

---

## 1. Instruções para Criação e Configuração no Firebase

No Cloud Firestore (NoSQL), **não é necessário criar tabelas ou colunas vazias com antecedência**. As coleções e subcoleções são criadas automaticamente assim que o primeiro documento for gravado.

### 1.1. Ativação dos Serviços no Firebase Console
1. Acesse o [Firebase Console](https://console.firebase.google.com/) e selecione o projeto `celebra-c8f9e`.
2. **Authentication**:
   - Menu lateral: **Construção (Build) → Authentication** → **Começar (Get Started)**.
   - Na aba **Sign-in method**, ative o provedor **E-mail/senha**.
3. **Firestore Database**:
   - Menu lateral: **Construção (Build) → Firestore Database** → **Criar banco de dados**.
   - Escolha o local do servidor (recomendado: `southamerica-east1 - São Paulo`).
   - Inicie em modo de teste para desenvolvimento inicial ou utilize as regras de segurança abaixo.

---

### 1.2. Regras de Segurança Recomendadas (`firestore.rules`)
Na aba **Firestore Database → Regras (Rules)**, configure:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Perfil do usuário: cada usuário pode ler e atualizar seu próprio perfil
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Convocações de técnicos
    match /eventAssignments/{assignmentId} {
      allow read: if request.auth != null && (
        resource.data.technicianUid == request.auth.uid ||
        request.auth.token.companyId == resource.data.companyId
      );
      allow update: if request.auth != null && resource.data.technicianUid == request.auth.uid;
      allow create, delete: if request.auth != null;
    }

    // Dados da empresa e todas as subcoleções (membros, eventos, clientes, pagamentos)
    match /companies/{companyId}/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

### 1.3. Como Criar o Perfil de Usuário Manualmente (`users/{uid}`)

Se você desejar criar manualmente um usuário de teste no console do Firebase:

1. **Pegar o UID do Usuário**:
   - Vá em **Authentication → Users**.
   - Copie o **Identificador do usuário (UID)** (exemplo: `LqYrGLoV5TSASNMQmQUbYg18Po72`).
2. **Criar o documento no Firestore**:
   - Vá em **Firestore Database**.
   - Na coluna `(default)`, selecione a coleção **`users`** (ou clique em `+ Iniciar coleção` se ainda não existir).
   - Clique em **`+ Adicionar documento`**.
   - No campo **ID do documento**, **cole o UID do usuário** (não use código automático).
3. **Adicionar os campos**:
   - `uid` (`string`): O mesmo UID da autenticação.
   - `username` (`string`): Nome de usuário em minúsculas (ex: `joaosilva`).
   - `displayName` (`string`): Nome de exibição (ex: `João Silva`).
   - `email` (`string`): E-mail da conta (ex: `joao@celebra.com`).
   - `role` (`string`): `organizer` ou `technician`.
   - `companyId` (`null` ou `string`): `null` (ou o ID da empresa).
   - `active` (`boolean`): `true`.
   - `createdAt` (`timestamp`): Data e hora atuais.
   - `updatedAt` (`timestamp`): Data e hora atuais.

> **Nota:** No app Celebra, o arquivo `src/services/authService.js` já executa essa criação de forma 100% automática ao cadastrar uma conta na tela de registro.

---

## 2. Estrutura e Hierarquia das Coleções

```text
📁 users/{uid}                                    (Coleção raiz: perfis dos usuários)
📁 eventAssignments/{assignmentId}                (Coleção raiz: convocações para técnicos)
📁 companies/{companyId}                          (Coleção raiz: dados da empresa)
   ├── 📁 members/{uid}                           (Subcoleção: equipe vinculada)
   ├── 📁 clients/{clientId}                      (Subcoleção: clientes)
   ├── 📁 eventTypes/{typeId}                     (Subcoleção: catálogo de tipos de evento)
   ├── 📁 venueTypes/{typeId}                     (Subcoleção: catálogo de tipos de local)
   ├── 📁 professionalTypes/{typeId}              (Subcoleção: catálogo de especialidades)
   ├── 📁 venues/{venueId}                        (Subcoleção: locais cadastrados)
   └── 📁 events/{eventId}                        (Subcoleção: eventos)
          ├── 📁 locations/{locationId}           (Subcoleção: locais do evento)
          └── 📁 payments/{paymentId}             (Subcoleção: financeiro do evento)
```

---

## 3. Dicionário de Campos Traduzido (Português - BR)

### 3.1. `users/{uid}` — Perfil de Acesso
| Campo em Português (BR) | Campo no Código (Firestore) | Tipo de Dado | Obrigatório | Descrição |
|---|---|---|---|---|
| ID do Usuário | `uid` | Texto (`string`) | Sim (PK) | Mesmo ID do Firebase Authentication. |
| Nome de Usuário | `username` | Texto (`string`) | Sim (Único) | `@usuario` normalizado para minúsculas. |
| Nome de Exibição | `displayName` | Texto (`string`) | Sim | Nome completo ou como prefere ser chamado. |
| E-mail | `email` | Texto (`string`) | Sim | E-mail autenticado da conta. |
| Papel / Perfil | `role` | Texto (`string`) | Sim | `organizer` (organizador) ou `technician` (técnico). |
| ID da Empresa | `companyId` | Texto (`string \| null`) | Sim (FK) | Empresa ativa vinculada (`null` enquanto não houver vínculo). |
| Acesso Ativo? | `active` | Booleano (`boolean`) | Sim | Indica se o acesso está liberado (`true`) ou bloqueado (`false`). |
| Data de Criação | `createdAt` | Data e Hora (`Timestamp`) | Sim (Auditoria) | Data e hora em que a conta foi criada. |
| Data de Atualização | `updatedAt` | Data e Hora (`Timestamp`) | Recomendado | Data e hora da última atualização de perfil. |

---

### 3.2. `companies/{companyId}` — Empresa
| Campo em Português (BR) | Campo no Código (Firestore) | Tipo de Dado | Obrigatório | Descrição |
|---|---|---|---|---|
| Nome Fantasia | `name` | Texto (`string`) | Sim | Nome da empresa exibido no aplicativo. |
| Razão Social | `legalName` | Texto (`string`) | Não | Razão social registrada, se diferente do nome fantasia. |
| CNPJ | `cnpj` | Texto (`string`) | Não | Cadastro Nacional da Pessoa Jurídica. |
| E-mail de Contato | `email` | Texto (`string`) | Não | E-mail administrativo/comercial. |
| Telefone | `phone` | Texto (`string`) | Não | Telefone comercial ou WhatsApp de contato. |
| Endereço | `address` | Objeto (`map`) | Não | Endereço estruturado (rua, número, complemento, bairro, cidade, CEP). |
| UID do Organizador Responsável | `ownerUid` | Texto (`string`) | Sim (FK) | UID do organizador proprietário da empresa. |
| Preferências de Notificação | `notificationPreferences` | Objeto (`map`) | Sim | Configurações booleanas de notificações de eventos, equipe e pagamentos. |
| Data de Criação | `createdAt` | Data e Hora (`Timestamp`) | Sim (Auditoria) | Data de cadastro da empresa. |
| Data de Atualização | `updatedAt` | Data e Hora (`Timestamp`) | Recomendado | Data da última alteração de dados da empresa. |

---

### 3.3. `companies/{companyId}/members/{uid}` — Membros da Equipe
| Campo em Português (BR) | Campo no Código (Firestore) | Tipo de Dado | Obrigatório | Descrição |
|---|---|---|---|---|
| UID do Usuário Membro | `uid` | Texto (`string`) | Sim (PK/FK) | UID do colaborador vinculado à empresa. |
| Papel na Empresa | `role` | Texto (`string`) | Sim | `organizer` (organizador) ou `technician` (técnico). |
| ID da Especialidade | `professionalTypeId` | Texto (`string \| null`) | Não (FK) | Especialidade do técnico (ex: técnico de som, iluminação). |
| Situação do Vínculo | `status` | Texto (`string`) | Sim | `active` (ativo), `invited` (convidado) ou `inactive` (inativo). |
| Data de Entrada | `joinedAt` | Data e Hora (`Timestamp`) | Não | Data em que ingressou na empresa. |

---

### 3.4. `companies/{companyId}/clients/{clientId}` — Clientes
| Campo em Português (BR) | Campo no Código (Firestore) | Tipo de Dado | Obrigatório | Descrição |
|---|---|---|---|---|
| Nome do Cliente | `name` | Texto (`string`) | Sim | Nome da pessoa física ou razão social da empresa contratante. |
| E-mail do Cliente | `email` | Texto (`string`) | Não | E-mail para contato e envio de propostas. |
| Telefone do Cliente | `phone` | Texto (`string`) | Não | Telefone/WhatsApp do cliente. |
| Documento (CPF/CNPJ) | `document` | Texto (`string`) | Não | CPF ou CNPJ do contratante. |
| Observações | `notes` | Texto (`string`) | Não | Anotações e particularidades do cliente. |
| Ativo? | `active` | Booleano (`boolean`) | Sim | `true` para ativo, `false` para arquivado. |
| Data de Criação | `createdAt` | Data e Hora (`Timestamp`) | Sim (Auditoria) | Data de cadastro do cliente. |
| Data de Atualização | `updatedAt` | Data e Hora (`Timestamp`) | Sim (Auditoria) | Data da última atualização de cadastro. |

---

### 3.5. Catálogos da Empresa
*Coleções:* `eventTypes/{typeId}`, `venueTypes/{typeId}` e `professionalTypes/{typeId}`

| Campo em Português (BR) | Campo no Código (Firestore) | Tipo de Dado | Obrigatório | Descrição |
|---|---|---|---|---|
| Nome da Categoria / Cargo | `name` | Texto (`string`) | Sim | Ex: "Casamento", "Salão de Festas", "Técnico de Som". |
| Descrição | `description` | Texto (`string`) | Não | Descrição detalhada opcional. |
| Ativo? | `active` | Booleano (`boolean`) | Sim | Permite desativar sem afetar registros históricos anteriores. |
| Data de Criação | `createdAt` | Data e Hora (`Timestamp`) | Sim (Auditoria) | Data de cadastro do tipo. |
| Data de Atualização | `updatedAt` | Data e Hora (`Timestamp`) | Sim (Auditoria) | Data da última alteração. |

---

### 3.6. `companies/{companyId}/venues/{venueId}` — Locais
| Campo em Português (BR) | Campo no Código (Firestore) | Tipo de Dado | Obrigatório | Descrição |
|---|---|---|---|---|
| Nome do Local | `name` | Texto (`string`) | Sim | Nome do espaço (ex: "Villa Bisutti", "Sítio Primavera"). |
| ID do Tipo de Local | `venueTypeId` | Texto (`string`) | Não (FK) | Referência ao catálogo de tipos de local. |
| Endereço | `address` | Objeto (`map`) | Não | Endereço estruturado do local. |
| Capacidade de Pessoas | `capacity` | Número (`number`) | Não | Capacidade máxima informada do local. |
| Observações | `notes` | Texto (`string`) | Não | Informações de carga/descarga, gerador, acústica, etc. |
| Ativo? | `active` | Booleano (`boolean`) | Sim | Disponibilidade para novos eventos. |
| Data de Criação | `createdAt` | Data e Hora (`Timestamp`) | Sim (Auditoria) | Data de cadastro do local. |
| Data de Atualização | `updatedAt` | Data e Hora (`Timestamp`) | Sim (Auditoria) | Data da última alteração. |

---

### 3.7. `companies/{companyId}/events/{eventId}` — Eventos
| Campo em Português (BR) | Campo no Código (Firestore) | Tipo de Dado | Obrigatório | Descrição |
|---|---|---|---|---|
| Título do Evento | `title` | Texto (`string`) | Sim | Título de identificação (ex: "Casamento Ana & Pedro"). |
| ID do Cliente | `clientId` | Texto (`string`) | Sim (FK) | Vínculo com o cliente contratante. |
| Nome do Cliente | `clientName` | Texto (`string`) | Recomendado | Snapshot para rápida renderização de listas. |
| ID do Tipo de Evento | `eventTypeId` | Texto (`string`) | Sim (FK) | Referência ao tipo de evento cadastrado. |
| Data e Hora de Início | `date` | Data e Hora (`Timestamp`) | Sim | Data e horário de início do evento. |
| Duração Planejada (Minutos) | `durationMinutes` | Número (`number`) | Não | Duração estimada total em minutos. |
| Quantidade de Convidados | `guestCount` | Número (`number`) | Não | Número total de convidados previstos. |
| Status do Evento | `status` | Texto (`string`) | Sim | `draft`, `scheduled`, `inProgress`, `completed` ou `cancelled`. |
| Observações Gerais | `notes` | Texto (`string`) | Não | Orientações gerais para a produção do evento. |
| Criado por (UID Organizador) | `createdBy` | Texto (`string`) | Sim (FK) | UID do organizador que criou o evento. |
| Data de Criação | `createdAt` | Data e Hora (`Timestamp`) | Sim (Auditoria) | Data de criação do evento. |
| Data de Atualização | `updatedAt` | Data e Hora (`Timestamp`) | Sim (Auditoria) | Data da última atualização. |

---

### 3.8. `companies/{companyId}/events/{eventId}/locations/{locationId}` — Locais do Evento
| Campo em Português (BR) | Campo no Código (Firestore) | Tipo de Dado | Obrigatório | Descrição |
|---|---|---|---|---|
| ID do Local Cadastrado | `venueId` | Texto (`string`) | Sim (FK) | Referência ao local cadastrado na empresa. |
| Nome do Local | `venueName` | Texto (`string`) | Recomendado | Snapshot para renderização da lista. |
| Ordem / Sequência | `sequence` | Número (`number`) | Não | Posição na linha do tempo (ex: 1 = Cerimônia, 2 = Recepção). |
| Horário de Início | `startAt` | Data e Hora (`Timestamp`) | Não | Início da janela de uso deste local. |
| Horário de Término | `endAt` | Data e Hora (`Timestamp`) | Não | Término da janela de uso deste local. |
| Instruções do Local | `notes` | Texto (`string`) | Não | Instruções operacionais para esta etapa. |

---

### 3.9. `eventAssignments/{assignmentId}` — Convocações / Atribuições de Técnicos
| Campo em Português (BR) | Campo no Código (Firestore) | Tipo de Dado | Obrigatório | Descrição |
|---|---|---|---|---|
| ID da Empresa | `companyId` | Texto (`string`) | Sim (FK) | Empresa organizadora do evento. |
| ID do Evento | `eventId` | Texto (`string`) | Sim (FK) | ID do evento na empresa. |
| UID do Técnico | `technicianUid` | Texto (`string`) | Sim (FK) | UID do técnico convocado. |
| Nome do Técnico | `technicianName` | Texto (`string`) | Recomendado | Snapshot para exibição em listas. |
| Título do Evento | `eventTitle` | Texto (`string`) | Recomendado | Snapshot do título do evento. |
| Data do Evento | `eventDate` | Data e Hora (`Timestamp`) | Recomendado | Snapshot de data/hora para a agenda do técnico. |
| Endereço do Evento | `eventAddress` | Texto (`string`) | Não | Endereço ou ponto de encontro para o técnico. |
| ID da Especialidade Solicitada | `professionalTypeId` | Texto (`string`) | Não (FK) | Especialidade requerida para a convocação. |
| Nome da Especialidade | `professionalTypeName` | Texto (`string`) | Recomendado | Snapshot da especialidade solicitada. |
| Função Específica | `roleName` | Texto (`string`) | Não | Atividade específica do técnico no evento. |
| Nome do Cliente | `clientName` | Texto (`string`) | Não | Snapshot do nome do cliente. |
| Status da Convocação | `status` | Texto (`string`) | Sim | `pending` (pendente), `accepted` (aceita) ou `declined` (recusada). |
| Data/Hora do Convite | `invitedAt` | Data e Hora (`Timestamp`) | Sim | Momento em que a convocação foi disparada. |
| Data/Hora da Resposta | `respondedAt` | Data e Hora (`Timestamp \| null`) | Sim | Momento em que respondeu (`null` enquanto pendente). |
| Data de Criação / Atualização | `createdAt`, `updatedAt` | Data e Hora (`Timestamp`) | Sim (Auditoria) | Auditoria do registro da convocação. |

---

### 3.10. `companies/{companyId}/events/{eventId}/payments/{paymentId}` — Lançamentos Financeiros
| Campo em Português (BR) | Campo no Código (Firestore) | Tipo de Dado | Obrigatório | Descrição |
|---|---|---|---|---|
| Descrição do Lançamento | `description` | Texto (`string`) | Sim | Descrição do valor (ex: "Cachê Técnico", "Entrada do Cliente"). |
| Valor em Centavos | `amountCents` | Número Inteiro (`number`) | Sim | Valor inteiro em centavos (ex: R$ 150,00 = `15000`). |
| Tipo de Fluxo (Direção) | `direction` | Texto (`string`) | Sim | `income` (receita) ou `expense` (despesa). |
| Data de Vencimento | `dueAt` | Data e Hora (`Timestamp`) | Não | Data limite para pagamento ou recebimento. |
| Data do Pagamento | `paidAt` | Data e Hora (`Timestamp \| null`) | Não | Data da quitação (`null` se em aberto). |
| Status do Pagamento | `status` | Texto (`string`) | Sim | `pending` (pendente), `paid` (pago) ou `cancelled` (cancelado). |
| Data de Criação / Atualização | `createdAt`, `updatedAt` | Data e Hora (`Timestamp`) | Sim (Auditoria) | Auditoria do registro financeiro. |

---

## 4. Relações do Modelo (Cardinalidades)

| Origem | Caminho de Origem | Destino | Caminho de Destino | Cardinalidade | Regra / Observação |
|---|---|---|---|:---:|---|
| Empresa | `companies/{companyId}` | Membro | `companies/{companyId}/members/{uid}` | 1:N | Uma empresa possui vários colaboradores na equipe. |
| Empresa | `companies/{companyId}` | Cliente | `companies/{companyId}/clients/{clientId}` | 1:N | Uma empresa cadastra múltiplos clientes. |
| Empresa | `companies/{companyId}` | Evento | `companies/{companyId}/events/{eventId}` | 1:N | Uma empresa organiza vários eventos. |
| Empresa | `companies/{companyId}` | Local | `companies/{companyId}/venues/{venueId}` | 1:N | Uma empresa gerencia vários locais disponíveis. |
| Empresa | `companies/{companyId}` | Catálogos | `eventTypes, venueTypes, professionalTypes` | 1:N | Catálogos configuráveis por empresa. |
| Perfil | `users/{uid}` | Empresa | `companies/{companyId}` | N:1 | `companyId` conecta o usuário à sua empresa ativa. |
| Empresa | `companies/{companyId}` | Organizador | `users/{uid}` | N:1 | `ownerUid` aponta para o organizador dono da empresa. |
| Usuário | `users/{uid}` | Membro | `companies/{companyId}/members/{uid}` | 1:0..1 | O documento de membro usa o UID do usuário na empresa. |
| Cliente | `clients/{clientId}` | Evento | `events/{eventId}` | 1:N | Cada evento é vinculado a um cliente. |
| Organizador | `users/{uid}` | Evento | `events/{eventId}` | 1:N | `createdBy` identifica o organizador que criou o evento. |
| Tipo de evento | `eventTypes/{typeId}` | Evento | `events/{eventId}` | 1:N | Cada evento possui uma categoria/tipo. |
| Tipo de local | `venueTypes/{typeId}` | Local | `venues/{venueId}` | 1:N | Um tipo classifica vários locais. |
| Evento | `events/{eventId}` | Local do evento | `events/{eventId}/locations/{locationId}` | 1:N | Um evento pode utilizar múltiplos locais em sua programação. |
| Local | `venues/{venueId}` | Local do evento | `events/{eventId}/locations/{locationId}` | 1:N | O mesmo local físico pode ser usado em diversos eventos. |
| Evento | `events/{eventId}` | Convocação | `eventAssignments/{assignmentId}` | 1:N | Atribuição aponta para o evento via `companyId` e `eventId`. |
| Técnico | `users/{uid}` | Convocação | `eventAssignments/{assignmentId}` | 1:N | `technicianUid` permite consultar a agenda e convites do técnico. |
| Especialidade | `professionalTypes/{typeId}` | Membro | `members/{uid}` | 1:N | `professionalTypeId` define a área de atuação do membro. |
| Especialidade | `professionalTypes/{typeId}` | Convocação | `eventAssignments/{assignmentId}` | 1:N | `professionalTypeId` define a vaga solicitada na convocação. |
| Evento | `events/{eventId}` | Lançamento financeiro | `events/{eventId}/payments/{paymentId}` | 1:N | Um evento possui múltiplos lançamentos de receitas e despesas. |
