# Dicionário de dados — Celebra

## Escopo

Este documento descreve o modelo inicial para a aplicação Celebra com Firebase Authentication e Cloud Firestore. Ele parte das telas identificadas no Figma: cadastro/login, empresa, eventos, clientes, locais, tipos de evento/local/profissional, equipe, financeiro, perfil, dashboard técnico e convocações.

Campos marcados como **propostos** precisam ser confirmados com o cliente e com os formulários completos do protótipo. Datas devem ser gravadas como `Timestamp` do Firestore; valores monetários como inteiro em centavos (`amountCents`) para evitar erros de ponto flutuante.

## Convenções

- `uid`: identificador de usuário do Firebase Authentication.
- `companyId`: identificador da empresa à qual o registro pertence.
- IDs de documentos devem ser gerados pelo Firestore, exceto quando o ID de usuário for naturalmente o `uid`.
- Registros operacionais devem incluir `createdAt` e `updatedAt` (Timestamp).
- Papéis controlam a experiência de navegação. As regras do Firestore também devem validar permissões; esconder uma tela no app não é controle de segurança suficiente.

## Coleções e documentos

### `users/{uid}` — perfil de acesso

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---:|---|
| `uid` | string | sim | Mesmo ID do Firebase Authentication. |
| `username` | string | sim | Nome de usuário normalizado para minúsculas. |
| `displayName` | string | sim | Nome para exibição. |
| `email` | string | sim | E-mail autenticado. |
| `cpf` | string | não | CPF do usuário, armazenado somente com números; campo pessoal opcional do perfil. Restringir leitura e escrita ao próprio usuário e aos administradores autorizados. |
| `phone` | string | não | Telefone com DDD, armazenado somente com números. |
| `city` | string | não | Cidade informada no perfil. |
| `notificationPreferences` | map | recomendado | Preferências pessoais; `eventsAndTeam` e `clientPayments` são booleanos. O padrão inicial do app é `true`. |
| `role` | string | sim | `organizer`, `technician` ou `pending`. Não aceitar papel enviado livremente sem validação. |
| `companyId` | string \| null | sim | Empresa ativa; `null` enquanto o vínculo não estiver concluído. |
| `active` | boolean | sim | Indica se o acesso está ativo. |
| `createdAt` | Timestamp | sim | Criação do perfil. |
| `updatedAt` | Timestamp | recomendado | Última atualização do perfil. |

### `companies/{companyId}` — empresa

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---:|---|
| `name` | string | sim | Nome da empresa mostrado em “Minha empresa”. |
| `legalName` | string | não | Razão social, se diferente. |
| `cnpj` | string | não | Documento da empresa. |
| `email` | string | não | E-mail de contato. |
| `phone` | string | não | Telefone de contato. |
| `address` | map | não | Endereço: `street`, `number`, `complement`, `district`, `city`, `state`, `postalCode`. |
| `ownerUid` | string | sim | Usuário organizador responsável. |
| `notificationPreferences` | map | sim | Preferências como `eventsAndTeam` e `clientPayments` (boolean). |
| `createdAt` | Timestamp | sim | Criação. |
| `updatedAt` | Timestamp | recomendado | Última atualização. |

### `companies/{companyId}/members/{uid}` — vínculo com a empresa

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---:|---|
| `uid` | string | sim | Usuário vinculado. |
| `role` | string | sim | `organizer` ou `technician`. |
| `professionalTypeId` | string \| null | não | Especialidade do técnico. |
| `status` | string | sim | `active`, `invited` ou `inactive`. |
| `joinedAt` | Timestamp | não | Data de entrada. |

### `companies/{companyId}/clients/{clientId}` — clientes

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---:|---|
| `name` | string | sim | Nome da pessoa ou empresa cliente. |
| `email` | string | não | E-mail de contato. |
| `phone` | string | não | Telefone de contato. |
| `document` | string | não | CPF/CNPJ, se necessário para o negócio. |
| `notes` | string | não | Observações. |
| `active` | boolean | sim | Exclusão lógica/arquivamento. |
| `createdAt` / `updatedAt` | Timestamp | sim | Auditoria básica. |

### Catálogos da empresa

Coleções: `companies/{companyId}/eventTypes/{typeId}`, `venueTypes/{typeId}` e `professionalTypes/{typeId}`.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---:|---|
| `name` | string | sim | Nome do tipo. |
| `description` | string | não | Descrição opcional. |
| `active` | boolean | sim | Permite desativar sem quebrar eventos antigos. |
| `createdAt` / `updatedAt` | Timestamp | sim | Auditoria básica. |

### `companies/{companyId}/venues/{venueId}` — locais

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---:|---|
| `name` | string | sim | Nome do local. |
| `venueTypeId` | string | não | Referência ao tipo de local. |
| `address` | map | não | Endereço estruturado. |
| `capacity` | number | não | Capacidade informada do local. |
| `notes` | string | não | Observações de acesso/uso. |
| `active` | boolean | sim | Local disponível para novos eventos. |
| `createdAt` / `updatedAt` | Timestamp | sim | Auditoria básica. |

### `companies/{companyId}/events/{eventId}` — eventos

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---:|---|
| `title` | string | sim | Título, por exemplo “Ana & Pedro”. |
| `clientId` | string | sim | Referência a `clients/{clientId}`. |
| `clientName` | string | recomendado | Cópia de exibição para listas; atualizar quando o cliente for editado, ou tratar como snapshot. |
| `eventTypeId` | string | sim | Referência ao catálogo de tipos de evento. |
| `date` | Timestamp | sim | Data/hora de início. |
| `durationMinutes` | number | não | Duração planejada. |
| `guestCount` | number | não | Quantidade de convidados (ex.: 180). |
| `status` | string | sim | `draft`, `scheduled`, `inProgress`, `completed` ou `cancelled`. |
| `notes` | string | não | Observações gerais. |
| `createdBy` | string | sim | UID do organizador que criou o evento. |
| `createdAt` / `updatedAt` | Timestamp | sim | Auditoria básica. |

Locais, equipe e pagamentos ficam em subcoleções para permitir múltiplos itens e atualizações independentes.

### `companies/{companyId}/events/{eventId}/locations/{locationId}` — locais do evento

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---:|---|
| `venueId` | string | sim | Referência a `venues/{venueId}`. |
| `venueName` | string | recomendado | Snapshot para renderizar a lista. |
| `sequence` | number | não | Ordem do local na programação. |
| `startAt` / `endAt` | Timestamp | não | Janela de uso do local. |
| `notes` | string | não | Instruções específicas. |

### `eventAssignments/{assignmentId}` — convocações/atribuições

Coleção raiz para consultar diretamente as convocações de um técnico. O documento também representa a alocação daquele profissional no evento.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---:|---|
| `companyId` | string | sim | Empresa proprietária do evento. |
| `eventId` | string | sim | ID do evento dentro da empresa. |
| `technicianUid` | string | sim | Usuário convocado. |
| `technicianName` | string | recomendado | Snapshot do nome para o painel do organizador. |
| `eventTitle` | string | recomendado | Snapshot do título para a caixa de convocação. |
| `eventDate` | Timestamp | recomendado | Snapshot de data/hora para ordenar/exibir. |
| `eventAddress` | string | não | Endereço ou instrução de local resumida. |
| `professionalTypeId` | string | não | Especialidade/função solicitada. |
| `professionalTypeName` | string | recomendado | Snapshot do nome da especialidade para exibição. |
| `roleName` | string | não | Atividade específica do técnico neste evento. |
| `clientName` | string | não | Snapshot do nome do cliente para exibição na convocação. |
| `status` | string | sim | `pending`, `accepted` ou `declined`. |
| `invitedAt` | Timestamp | sim | Momento da convocação. |
| `respondedAt` | Timestamp \| null | sim | Momento da resposta. |
| `createdAt` / `updatedAt` | Timestamp | sim | Auditoria básica. |

### `technicianUnavailability/{availabilityId}` — indisponibilidade do técnico

Um documento por técnico e dia. O ID determinístico usa `{uid}_{YYYY-MM-DD}`, evitando registros duplicados para a mesma data.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---:|---|
| `technicianUid` | string | sim | UID do técnico autenticado. |
| `dateKey` | string | sim | Dia local no formato `YYYY-MM-DD`, usado na comparação do calendário. |
| `date` | Timestamp | sim | Data normalizada para meia-noite local. |
| `createdAt` / `updatedAt` | Timestamp | sim | Auditoria básica. |

### `companies/{companyId}/events/{eventId}/payments/{paymentId}` — financeiro

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---:|---|
| `description` | string | sim | Descrição do valor. |
| `amountCents` | number | sim | Valor em centavos. |
| `direction` | string | sim | `income` ou `expense`, confirmar com o cliente. |
| `dueAt` | Timestamp | não | Vencimento. |
| `paidAt` | Timestamp \| null | não | Data do pagamento/recebimento. |
| `status` | string | sim | `pending`, `paid` ou `cancelled`. |
| `createdAt` / `updatedAt` | Timestamp | sim | Auditoria básica. |

## Relações principais

- Uma empresa possui muitos clientes, locais, membros e eventos.
- Um evento pertence a um cliente e a um tipo de evento.
- Um evento pode usar vários locais.
- Um evento pode ter várias atribuições; cada atribuição relaciona um técnico a um evento e registra a resposta à convocação.
- Um evento pode ter vários lançamentos financeiros.
- Um usuário técnico pode ter várias atribuições, consultadas por `technicianUid`.

## Consultas do MVP

1. Perfil atual: `users/{uid}`.
2. Convocações do técnico: `eventAssignments` filtrada por `technicianUid == uid`; ordenar em memória por `invitedAt` enquanto o volume for pequeno.
3. Eventos da empresa: subcoleção `companies/{companyId}/events`, com filtros de `status` e `date`.
4. Resumo mensal: contar/agregar eventos da empresa por período; pode ser calculado no cliente para o MVP e migrado para função/backend se a escala exigir.
5. Agenda do técnico: convocações aceitas de `eventAssignments` e indisponibilidades de `technicianUnavailability` filtradas por `technicianUid == uid`.

## Dados mínimos para visualizar a etapa técnica

Para uma conta de demonstração técnica, primeiro crie a conta no Firebase Authentication e copie o UID. No documento `users/{uid}`, configure `role: "technician"`, `companyId` com o ID da empresa e `active: true`. Em seguida, crie um documento em `eventAssignments` com os campos mínimos:

```json
{
  "companyId": "ID_DA_EMPRESA",
  "eventId": "ID_DO_EVENTO",
  "technicianUid": "UID_DO_TECNICO",
  "eventTitle": "Ana & Pedro",
  "clientName": "Ana Costa & Pedro Almeida",
  "eventDate": "Timestamp do Firestore",
  "eventAddress": "Jundiaí, SP",
  "professionalTypeName": "Videomaker",
  "roleName": "Filmagem da cerimônia",
  "status": "pending",
  "invitedAt": "Timestamp do Firestore",
  "respondedAt": null,
  "createdAt": "Timestamp do Firestore",
  "updatedAt": "Timestamp do Firestore"
}
```

O texto `Timestamp do Firestore` é descritivo: no console, selecione o tipo Timestamp em vez de salvar essa frase como string. A tela do técnico escuta `eventAssignments` pelo `technicianUid` e atualiza `status`, `respondedAt` e `updatedAt` ao responder.

Para visualizar a interface localmente sem autenticação nem escrita no Firebase, inicie o Expo Web e abra `http://localhost:8081/?preview=technician`. Esse modo é exclusivo de desenvolvimento (`__DEV__`), usa dados fictícios mantidos no app e simula as respostas apenas em memória.

## Decisões de segurança e integridade

- Não confiar no papel guardado no estado do app: regras do Firestore devem validar empresa e papel antes de permitir escrita.
- O cadastro atual atribui `organizer` a toda conta criada por ele para manter o fluxo de demonstração do MVP. Isso é apenas um roteamento de interface, não uma concessão de acesso segura. Antes de usar dados reais, o primeiro organizador deve ser provisionado de forma controlada, técnicos devem receber vínculo/convite e regras do Firestore devem bloquear autoatribuição de papel.
- Aceitar/recusar deve atualizar somente uma atribuição cujo `technicianUid` seja o usuário autenticado e cujo status ainda seja `pending`.
- Indisponibilidades devem ser consultadas e alteradas somente pelo técnico autenticado cujo UID consta em `technicianUid`; validar isso nas regras do Firestore.
- Eventos e atribuições devem ser arquivados/cancelados, não apagados em cascata sem decisão explícita de retenção.
- Criar regras e índices do Firestore no Firebase antes de disponibilizar dados reais. O app client-side faz roteamento e validações de interface, mas isso não substitui regras do servidor.

## Próximas telas por etapa

1. **Perfil técnico**: leitura e atualização dos dados pessoais, preferência de notificações, redefinição de senha e saída da conta.
2. **Início técnico**: resumo de convocações e próximos eventos.
3. **Eventos técnico**: busca e filtros entre aceitos e pendentes.
4. **Agenda técnico**: calendário mensal, eventos aceitos e indisponibilidade diária.
5. **Próximas frentes**: dashboard e CRUD do organizador, gestão de equipe, detalhes completos de eventos e publicação de oportunidades para técnicos.
