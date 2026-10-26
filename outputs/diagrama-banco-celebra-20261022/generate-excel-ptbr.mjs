import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.join(__dirname, 'diagrama-banco-celebra-ptbr.xlsx');

const workbook = new ExcelJS.Workbook();
workbook.creator = 'Celebra App';
workbook.lastModifiedBy = 'Celebra App';
workbook.created = new Date();
workbook.modified = new Date();

// Cores
const NAVY = '102B46';
const BLUE = '24527A';
const LIGHT_BG = 'F4F8FA';
const HEADER_FONT = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
const BODY_FONT = { name: 'Arial', size: 10, color: { argb: '243947' } };

// ==========================================
// ABA 1: MODELO
// ==========================================
const modelSheet = workbook.addWorksheet('Modelo', { views: [{ showGridLines: true }] });

modelSheet.addRow(['Modelo de Dados — Celebra']);
modelSheet.addRow(['Firebase Authentication + Cloud Firestore | Entidades, caminhos e referências principais']);
modelSheet.addRow([]); // Linha 3 vazia
modelSheet.addRow(['Entidade', 'Caminho no Firestore', 'Chave do Documento (PK)', 'Referências Principais (FK)', 'Finalidade']);

const modelEntities = [
  ['Perfil de acesso', 'users/{uid}', 'uid (Firebase Auth)', 'companyId → companies/{companyId}', 'Perfil, papel e estado de acesso.'],
  ['Empresa', 'companies/{companyId}', 'companyId', 'ownerUid → users/{uid}', 'Empresa e preferências de notificação.'],
  ['Membro da empresa', 'companies/{companyId}/members/{uid}', 'uid (por empresa)', 'uid → users/{uid}; professionalTypeId → professionalTypes/{typeId}', 'Vínculo de usuário, papel e especialidade.'],
  ['Cliente', 'companies/{companyId}/clients/{clientId}', 'clientId', 'companyId → companies/{companyId}', 'Pessoa ou empresa atendida.'],
  ['Tipo de evento', 'companies/{companyId}/eventTypes/{typeId}', 'typeId', 'companyId → companies/{companyId}', 'Catálogo configurável de tipos de evento.'],
  ['Tipo de local', 'companies/{companyId}/venueTypes/{typeId}', 'typeId', 'companyId → companies/{companyId}', 'Catálogo configurável de tipos de local.'],
  ['Tipo profissional', 'companies/{companyId}/professionalTypes/{typeId}', 'typeId', 'companyId → companies/{companyId}', 'Catálogo configurável de especialidades/cargos.'],
  ['Local', 'companies/{companyId}/venues/{venueId}', 'venueId', 'venueTypeId → venueTypes/{typeId}', 'Local disponível para realização de eventos.'],
  ['Evento', 'companies/{companyId}/events/{eventId}', 'eventId', 'clientId → clients; eventTypeId → eventTypes; createdBy → users/{uid}', 'Evento principal da empresa.'],
  ['Local do evento', 'companies/{companyId}/events/{eventId}/locations/{locationId}', 'locationId', 'eventId → events/{eventId}; venueId → venues/{venueId}', 'Local usado na programação do evento.'],
  ['Convocação / atribuição', 'eventAssignments/{assignmentId}', 'assignmentId', 'companyId + eventId → evento; technicianUid → users/{uid}; professionalTypeId → professionalTypes', 'Alocação do técnico e resposta à convocação.'],
  ['Lançamento financeiro', 'companies/{companyId}/events/{eventId}/payments/{paymentId}', 'paymentId', 'eventId → events/{eventId}', 'Receita ou despesa ligada ao evento.']
];

modelEntities.forEach(row => modelSheet.addRow(row));

// Formatação ABA 1
modelSheet.getCell('A1').font = { name: 'Arial', size: 16, bold: true, color: { argb: NAVY } };
modelSheet.getCell('A2').font = { name: 'Arial', size: 10, italic: true, color: { argb: '61788D' } };

const headerRow1 = modelSheet.getRow(4);
headerRow1.height = 28;
headerRow1.eachCell(cell => {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  cell.font = HEADER_FONT;
  cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
});

for (let r = 5; r <= 4 + modelEntities.length; r++) {
  const row = modelSheet.getRow(r);
  row.height = 24;
  row.eachCell(cell => {
    cell.font = BODY_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    if (r % 2 === 0) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BG } };
    }
  });
}

modelSheet.columns = [
  { width: 25 },
  { width: 45 },
  { width: 25 },
  { width: 45 },
  { width: 45 }
];


// ==========================================
// ABA 2: CAMPOS (DICIONÁRIO DE DADOS EM PT-BR)
// ==========================================
const fieldsSheet = workbook.addWorksheet('Dicionário de Campos', { views: [{ showGridLines: true }] });

fieldsSheet.addRow(['Dicionário de Campos do Banco — Celebra']);
fieldsSheet.addRow(['Campos traduzidos para Português (Brasil) com correspondência técnica no Firestore']);
fieldsSheet.addRow([]); // Linha 3
fieldsSheet.addRow([
  'Coleção / Caminho',
  'Campo em Português (BR)',
  'Campo no Código (Firestore)',
  'Tipo de Dado',
  'Obrigatório?',
  'Chave / Observação',
  'Descrição Detalhada'
]);

const fieldsData = [
  // users/{uid}
  ['users/{uid}', 'ID do Usuário', 'uid', 'Texto (string)', 'Sim', 'Chave Primária (PK)', 'Mesmo identificador único gerado no Firebase Authentication.'],
  ['users/{uid}', 'Nome de Usuário', 'username', 'Texto (string)', 'Sim', 'Único no sistema', 'Nome de usuário (@usuario) normalizado para minúsculas.'],
  ['users/{uid}', 'Nome de Exibição', 'displayName', 'Texto (string)', 'Sim', '', 'Nome completo ou como prefere ser chamado no app.'],
  ['users/{uid}', 'E-mail', 'email', 'Texto (string)', 'Sim', '', 'E-mail autenticado da conta.'],
  ['users/{uid}', 'Papel / Perfil', 'role', 'Texto (string)', 'Sim', 'Papel de Acesso', '"organizer" (organizador), "technician" (técnico) ou "pending" (pendente).'],
  ['users/{uid}', 'ID da Empresa', 'companyId', 'Texto / Nulo (string | null)', 'Sim', 'Chave Estrangeira (FK)', 'Empresa ativa vinculada; nulo enquanto não houver vínculo.'],
  ['users/{uid}', 'Acesso Ativo?', 'active', 'Booleano (boolean)', 'Sim', '', 'Indica se a conta está ativa (true) ou bloqueada (false).'],
  ['users/{uid}', 'Data de Criação', 'createdAt', 'Data e Hora (Timestamp)', 'Sim', 'Auditoria', 'Data e hora exata em que o perfil foi criado.'],
  ['users/{uid}', 'Data de Atualização', 'updatedAt', 'Data e Hora (Timestamp)', 'Recomendado', 'Auditoria', 'Data e hora da última modificação do perfil.'],

  // companies/{companyId}
  ['companies/{companyId}', 'Nome Fantasia', 'name', 'Texto (string)', 'Sim', '', 'Nome da empresa exibido em "Minha empresa" e para a equipe.'],
  ['companies/{companyId}', 'Razão Social', 'legalName', 'Texto (string)', 'Não', '', 'Razão social registrada da empresa, se diferente do nome fantasia.'],
  ['companies/{companyId}', 'CNPJ', 'cnpj', 'Texto (string)', 'Não', '', 'Documento oficial CNPJ da empresa.'],
  ['companies/{companyId}', 'E-mail de Contato', 'email', 'Texto (string)', 'Não', '', 'E-mail comercial ou administrativo.'],
  ['companies/{companyId}', 'Telefone', 'phone', 'Texto (string)', 'Não', '', 'Telefone comercial/WhatsApp da empresa.'],
  ['companies/{companyId}', 'Endereço', 'address', 'Objeto / Mapa (map)', 'Não', '', 'Endereço estruturado (rua, número, complemento, bairro, cidade, estado, CEP).'],
  ['companies/{companyId}', 'UID do Organizador Responsável', 'ownerUid', 'Texto (string)', 'Sim', 'Chave Estrangeira (FK)', 'UID do usuário organizador dono/responsável pela empresa.'],
  ['companies/{companyId}', 'Preferências de Notificação', 'notificationPreferences', 'Objeto / Mapa (map)', 'Sim', '', 'Preferências de notificação (eventos, equipe e pagamentos).'],
  ['companies/{companyId}', 'Data de Criação', 'createdAt', 'Data e Hora (Timestamp)', 'Sim', 'Auditoria', 'Data e hora de criação da empresa no sistema.'],
  ['companies/{companyId}', 'Data de Atualização', 'updatedAt', 'Data e Hora (Timestamp)', 'Recomendado', 'Auditoria', 'Data e hora da última atualização dos dados da empresa.'],

  // companies/{companyId}/members/{uid}
  ['companies/{companyId}/members/{uid}', 'UID do Usuário Membro', 'uid', 'Texto (string)', 'Sim', 'PK / FK', 'Identificador do usuário membro vinculado à empresa.'],
  ['companies/{companyId}/members/{uid}', 'Papel na Empresa', 'role', 'Texto (string)', 'Sim', 'Papel de Acesso', '"organizer" (organizador) ou "technician" (técnico).'],
  ['companies/{companyId}/members/{uid}', 'ID da Especialidade', 'professionalTypeId', 'Texto / Nulo (string | null)', 'Não', 'Chave Estrangeira (FK)', 'Referência à especialidade cadastrada do técnico (ex: técnico de som).'],
  ['companies/{companyId}/members/{uid}', 'Situação do Vínculo', 'status', 'Texto (string)', 'Sim', '', '"active" (ativo), "invited" (convidado) ou "inactive" (inativo).'],
  ['companies/{companyId}/members/{uid}', 'Data de Entrada', 'joinedAt', 'Data e Hora (Timestamp)', 'Não', '', 'Data em que o membro passou a fazer parte da empresa.'],

  // companies/{companyId}/clients/{clientId}
  ['companies/{companyId}/clients/{clientId}', 'Nome do Cliente', 'name', 'Texto (string)', 'Sim', '', 'Nome completo da pessoa física ou razão da empresa cliente.'],
  ['companies/{companyId}/clients/{clientId}', 'E-mail do Cliente', 'email', 'Texto (string)', 'Não', '', 'E-mail de contato do cliente.'],
  ['companies/{companyId}/clients/{clientId}', 'Telefone do Cliente', 'phone', 'Texto (string)', 'Não', '', 'Telefone de contato do cliente.'],
  ['companies/{companyId}/clients/{clientId}', 'Documento (CPF/CNPJ)', 'document', 'Texto (string)', 'Não', '', 'Documento de identificação do cliente (CPF ou CNPJ).'],
  ['companies/{companyId}/clients/{clientId}', 'Observações', 'notes', 'Texto (string)', 'Não', '', 'Anotações gerais e preferências do cliente.'],
  ['companies/{companyId}/clients/{clientId}', 'Ativo?', 'active', 'Booleano (boolean)', 'Sim', '', 'Indica se o cliente está ativo para novos contratos.'],
  ['companies/{companyId}/clients/{clientId}', 'Data de Criação', 'createdAt', 'Data e Hora (Timestamp)', 'Sim', 'Auditoria', 'Data e hora de cadastro do cliente.'],
  ['companies/{companyId}/clients/{clientId}', 'Data de Atualização', 'updatedAt', 'Data e Hora (Timestamp)', 'Sim', 'Auditoria', 'Data da última alteração no cadastro do cliente.'],

  // companies/{companyId}/eventTypes/{typeId}
  ['companies/{companyId}/eventTypes/{typeId}', 'Nome do Tipo de Evento', 'name', 'Texto (string)', 'Sim', '', 'Ex: "Casamento", "Corporativo", "Aniversário", "Formatura".'],
  ['companies/{companyId}/eventTypes/{typeId}', 'Descrição', 'description', 'Texto (string)', 'Não', '', 'Descrição opcional do tipo de evento.'],
  ['companies/{companyId}/eventTypes/{typeId}', 'Ativo?', 'active', 'Booleano (boolean)', 'Sim', '', 'Permite desativar da lista de seleção sem perder o histórico antigo.'],
  ['companies/{companyId}/eventTypes/{typeId}', 'Data de Criação', 'createdAt', 'Data e Hora (Timestamp)', 'Sim', 'Auditoria', 'Data de criação do tipo no catálogo.'],
  ['companies/{companyId}/eventTypes/{typeId}', 'Data de Atualização', 'updatedAt', 'Data e Hora (Timestamp)', 'Sim', 'Auditoria', 'Data da última atualização.'],

  // companies/{companyId}/venueTypes/{typeId}
  ['companies/{companyId}/venueTypes/{typeId}', 'Nome do Tipo de Local', 'name', 'Texto (string)', 'Sim', '', 'Ex: "Salão de Festas", "Igreja", "Praia", "Hotel", "Sítio".'],
  ['companies/{companyId}/venueTypes/{typeId}', 'Descrição', 'description', 'Texto (string)', 'Não', '', 'Descrição opcional das características do local.'],
  ['companies/{companyId}/venueTypes/{typeId}', 'Ativo?', 'active', 'Booleano (boolean)', 'Sim', '', 'Disponibilidade para novos cadastros de locais.'],
  ['companies/{companyId}/venueTypes/{typeId}', 'Data de Criação', 'createdAt', 'Data e Hora (Timestamp)', 'Sim', 'Auditoria', 'Data de cadastro do tipo de local.'],
  ['companies/{companyId}/venueTypes/{typeId}', 'Data de Atualização', 'updatedAt', 'Data e Hora (Timestamp)', 'Sim', 'Auditoria', 'Data da última alteração.'],

  // companies/{companyId}/professionalTypes/{typeId}
  ['companies/{companyId}/professionalTypes/{typeId}', 'Nome da Especialidade / Cargo', 'name', 'Texto (string)', 'Sim', '', 'Ex: "Técnico de Som", "Iluminador", "Fotógrafo", "DJ", "Cerimonialista".'],
  ['companies/{companyId}/professionalTypes/{typeId}', 'Descrição', 'description', 'Texto (string)', 'Não', '', 'Descrição das atribuições da função.'],
  ['companies/{companyId}/professionalTypes/{typeId}', 'Ativo?', 'active', 'Booleano (boolean)', 'Sim', '', 'Disponibilidade para novas convocações.'],
  ['companies/{companyId}/professionalTypes/{typeId}', 'Data de Criação', 'createdAt', 'Data e Hora (Timestamp)', 'Sim', 'Auditoria', 'Data de criação da especialidade.'],
  ['companies/{companyId}/professionalTypes/{typeId}', 'Data de Atualização', 'updatedAt', 'Data e Hora (Timestamp)', 'Sim', 'Auditoria', 'Data da última alteração.'],

  // companies/{companyId}/venues/{venueId}
  ['companies/{companyId}/venues/{venueId}', 'Nome do Local', 'name', 'Texto (string)', 'Sim', '', 'Nome próprio do local (ex: "Espaço Villa Bisutti").'],
  ['companies/{companyId}/venues/{venueId}', 'ID do Tipo de Local', 'venueTypeId', 'Texto (string)', 'Não', 'Chave Estrangeira (FK)', 'Referência ao tipo de local cadastrado.'],
  ['companies/{companyId}/venues/{venueId}', 'Endereço', 'address', 'Objeto / Mapa (map)', 'Não', '', 'Endereço estruturado do local.'],
  ['companies/{companyId}/venues/{venueId}', 'Capacidade de Pessoas', 'capacity', 'Numérico (number)', 'Não', '', 'Capacidade máxima suportada pelo local.'],
  ['companies/{companyId}/venues/{venueId}', 'Observações', 'notes', 'Texto (string)', 'Não', '', 'Orientações de carga/descarga, gerador, restrições acústicas, etc.'],
  ['companies/{companyId}/venues/{venueId}', 'Ativo?', 'active', 'Booleano (boolean)', 'Sim', '', 'Indica se o local está disponível para novos eventos.'],
  ['companies/{companyId}/venues/{venueId}', 'Data de Criação', 'createdAt', 'Data e Hora (Timestamp)', 'Sim', 'Auditoria', 'Data de cadastro do local.'],
  ['companies/{companyId}/venues/{venueId}', 'Data de Atualização', 'updatedAt', 'Data e Hora (Timestamp)', 'Sim', 'Auditoria', 'Data da última atualização.'],

  // companies/{companyId}/events/{eventId}
  ['companies/{companyId}/events/{eventId}', 'Título do Evento', 'title', 'Texto (string)', 'Sim', '', 'Título amigável do evento (ex: "Casamento Ana & Pedro").'],
  ['companies/{companyId}/events/{eventId}', 'ID do Cliente', 'clientId', 'Texto (string)', 'Sim', 'Chave Estrangeira (FK)', 'ID do cliente contratante.'],
  ['companies/{companyId}/events/{eventId}', 'Nome do Cliente', 'clientName', 'Texto (string)', 'Recomendado', 'Snapshot de leitura', 'Cópia rápida do nome do cliente para renderizar em listas.'],
  ['companies/{companyId}/events/{eventId}', 'ID do Tipo de Evento', 'eventTypeId', 'Texto (string)', 'Sim', 'Chave Estrangeira (FK)', 'Referência ao catálogo de tipos de evento.'],
  ['companies/{companyId}/events/{eventId}', 'Data e Hora de Início', 'date', 'Data e Hora (Timestamp)', 'Sim', '', 'Data e horário em que o evento se inicia.'],
  ['companies/{companyId}/events/{eventId}', 'Duração Planejada (Minutos)', 'durationMinutes', 'Numérico (number)', 'Não', '', 'Tempo total planejado para o evento em minutos.'],
  ['companies/{companyId}/events/{eventId}', 'Quantidade de Convidados', 'guestCount', 'Numérico (number)', 'Não', '', 'Número estimado de convidados.'],
  ['companies/{companyId}/events/{eventId}', 'Status do Evento', 'status', 'Texto (string)', 'Sim', '', '"draft" (rascunho), "scheduled" (agendado), "inProgress" (em andamento), "completed" (concluído) ou "cancelled" (cancelado).'],
  ['companies/{companyId}/events/{eventId}', 'Observações Gerais', 'notes', 'Texto (string)', 'Não', '', 'Anotações gerais e orientações para a equipe.'],
  ['companies/{companyId}/events/{eventId}', 'Criado por (UID Organizador)', 'createdBy', 'Texto (string)', 'Sim', 'Chave Estrangeira (FK)', 'UID do organizador que cadastrou o evento.'],
  ['companies/{companyId}/events/{eventId}', 'Data de Criação', 'createdAt', 'Data e Hora (Timestamp)', 'Sim', 'Auditoria', 'Data de criação do evento no sistema.'],
  ['companies/{companyId}/events/{eventId}', 'Data de Atualização', 'updatedAt', 'Data e Hora (Timestamp)', 'Sim', 'Auditoria', 'Data da última alteração no evento.'],

  // companies/{companyId}/events/{eventId}/locations/{locationId}
  ['companies/{companyId}/events/{eventId}/locations/{locationId}', 'ID do Local Cadastrado', 'venueId', 'Texto (string)', 'Sim', 'Chave Estrangeira (FK)', 'Referência ao local da empresa utilizado nesta etapa.'],
  ['companies/{companyId}/events/{eventId}/locations/{locationId}', 'Nome do Local', 'venueName', 'Texto (string)', 'Recomendado', 'Snapshot de leitura', 'Snapshot do nome do local para carregar listas rapidamente.'],
  ['companies/{companyId}/events/{eventId}/locations/{locationId}', 'Ordem / Sequência', 'sequence', 'Numérico (number)', 'Não', '', 'Ordem do local na linha do tempo do evento (ex: 1 = Cerimônia, 2 = Festa).'],
  ['companies/{companyId}/events/{eventId}/locations/{locationId}', 'Horário de Início', 'startAt', 'Data e Hora (Timestamp)', 'Não', '', 'Início da janela de uso desse local.'],
  ['companies/{companyId}/events/{eventId}/locations/{locationId}', 'Horário de Término', 'endAt', 'Data e Hora (Timestamp)', 'Não', '', 'Fim da janela de uso desse local.'],
  ['companies/{companyId}/events/{eventId}/locations/{locationId}', 'Instruções do Local', 'notes', 'Texto (string)', 'Não', '', 'Instruções específicas para esta parte da programação.'],

  // eventAssignments/{assignmentId}
  ['eventAssignments/{assignmentId}', 'ID da Empresa', 'companyId', 'Texto (string)', 'Sim', 'Chave Estrangeira (FK)', 'Empresa que está organizando o evento.'],
  ['eventAssignments/{assignmentId}', 'ID do Evento', 'eventId', 'Texto (string)', 'Sim', 'Chave Estrangeira (FK)', 'ID do evento ao qual o técnico está sendo convocado.'],
  ['eventAssignments/{assignmentId}', 'UID do Técnico', 'technicianUid', 'Texto (string)', 'Sim', 'Chave Estrangeira (FK)', 'Identificador do usuário técnico que recebeu a convocação.'],
  ['eventAssignments/{assignmentId}', 'Nome do Técnico', 'technicianName', 'Texto (string)', 'Recomendado', 'Snapshot de leitura', 'Snapshot do nome do técnico para listagem rápida.'],
  ['eventAssignments/{assignmentId}', 'Título do Evento', 'eventTitle', 'Texto (string)', 'Recomendado', 'Snapshot de leitura', 'Snapshot do título do evento.'],
  ['eventAssignments/{assignmentId}', 'Data do Evento', 'eventDate', 'Data e Hora (Timestamp)', 'Recomendado', 'Snapshot de leitura', 'Snapshot da data do evento para exibir na agenda do técnico.'],
  ['eventAssignments/{assignmentId}', 'Endereço do Evento', 'eventAddress', 'Texto (string)', 'Não', '', 'Resumo ou endereço completo para o técnico ir ao local.'],
  ['eventAssignments/{assignmentId}', 'ID da Especialidade Solicitada', 'professionalTypeId', 'Texto (string)', 'Não', 'Chave Estrangeira (FK)', 'Referência ao tipo de serviço exigido.'],
  ['eventAssignments/{assignmentId}', 'Nome da Especialidade', 'professionalTypeName', 'Texto (string)', 'Recomendado', 'Snapshot de leitura', 'Ex: "Técnico de Som", "Iluminação".'],
  ['eventAssignments/{assignmentId}', 'Função Específica', 'roleName', 'Texto (string)', 'Não', '', 'Atividade específica planejada (ex: "Operador de Mesa de Som Principal").'],
  ['eventAssignments/{assignmentId}', 'Nome do Cliente', 'clientName', 'Texto (string)', 'Não', 'Snapshot de leitura', 'Nome do cliente para identificação.'],
  ['eventAssignments/{assignmentId}', 'Status da Convocação', 'status', 'Texto (string)', 'Sim', '', '"pending" (aguardando resposta), "accepted" (aceita) ou "declined" (recusada).'],
  ['eventAssignments/{assignmentId}', 'Data/Hora do Convite', 'invitedAt', 'Data e Hora (Timestamp)', 'Sim', '', 'Momento exato em que o organizador convocou o técnico.'],
  ['eventAssignments/{assignmentId}', 'Data/Hora da Resposta', 'respondedAt', 'Data / Nulo (Timestamp | null)', 'Sim', '', 'Momento em que o técnico aceitou ou recusou; nulo enquanto pendente.'],
  ['eventAssignments/{assignmentId}', 'Data de Criação', 'createdAt', 'Data e Hora (Timestamp)', 'Sim', 'Auditoria', 'Criação do registro no banco.'],
  ['eventAssignments/{assignmentId}', 'Data de Atualização', 'updatedAt', 'Data e Hora (Timestamp)', 'Sim', 'Auditoria', 'Última modificação no registro.'],

  // companies/{companyId}/events/{eventId}/payments/{paymentId}
  ['companies/{companyId}/events/{eventId}/payments/{paymentId}', 'Descrição do Lançamento', 'description', 'Texto (string)', 'Sim', '', 'Descrição da despesa ou receita (ex: "Cachê Técnico de Som", "Sinal do Cliente").'],
  ['companies/{companyId}/events/{eventId}/payments/{paymentId}', 'Valor em Centavos', 'amountCents', 'Numérico Inteiro (number)', 'Sim', 'Unidade: centavos', 'Valor financeiro inteiro em centavos (ex: R$ 150,00 = 15000) para evitar erros decimais.'],
  ['companies/{companyId}/events/{eventId}/payments/{paymentId}', 'Tipo de Fluxo (Receita / Despesa)', 'direction', 'Texto (string)', 'Sim', '', '"income" (receita/entrada) ou "expense" (despesa/saída).'],
  ['companies/{companyId}/events/{eventId}/payments/{paymentId}', 'Data de Vencimento', 'dueAt', 'Data e Hora (Timestamp)', 'Não', '', 'Data limite combinada para o pagamento/recebimento.'],
  ['companies/{companyId}/events/{eventId}/payments/{paymentId}', 'Data do Pagamento Efetuado', 'paidAt', 'Data / Nulo (Timestamp | null)', 'Não', '', 'Data em que o valor foi quitado; nulo enquanto pendente.'],
  ['companies/{companyId}/events/{eventId}/payments/{paymentId}', 'Status do Lançamento', 'status', 'Texto (string)', 'Sim', '', '"pending" (a pagar/receber), "paid" (pago/recebido) ou "cancelled" (cancelado).'],
  ['companies/{companyId}/events/{eventId}/payments/{paymentId}', 'Data de Criação', 'createdAt', 'Data e Hora (Timestamp)', 'Sim', 'Auditoria', 'Data em que o lançamento financeiro foi inserido.'],
  ['companies/{companyId}/events/{eventId}/payments/{paymentId}', 'Data de Atualização', 'updatedAt', 'Data e Hora (Timestamp)', 'Sim', 'Auditoria', 'Data da última alteração no lançamento.']
];

fieldsData.forEach(row => fieldsSheet.addRow(row));

// Formatação ABA 2
fieldsSheet.getCell('A1').font = { name: 'Arial', size: 16, bold: true, color: { argb: NAVY } };
fieldsSheet.getCell('A2').font = { name: 'Arial', size: 10, italic: true, color: { argb: '61788D' } };

const headerRow2 = fieldsSheet.getRow(4);
headerRow2.height = 28;
headerRow2.eachCell(cell => {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } };
  cell.font = HEADER_FONT;
  cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
});

for (let r = 5; r <= 4 + fieldsData.length; r++) {
  const row = fieldsSheet.getRow(r);
  row.height = 22;
  row.eachCell(cell => {
    cell.font = BODY_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    if (r % 2 === 0) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BG } };
    }
  });
}

fieldsSheet.columns = [
  { width: 45 }, // Coleção
  { width: 32 }, // Campo em PT-BR
  { width: 28 }, // Campo no código
  { width: 22 }, // Tipo
  { width: 15 }, // Obrigatório
  { width: 25 }, // Observação
  { width: 55 }  // Descrição
];


// ==========================================
// ABA 3: RELAÇÕES (CARDINALIDADE)
// ==========================================
const relSheet = workbook.addWorksheet('Relações entre Tabelas', { views: [{ showGridLines: true }] });

relSheet.addRow(['Relações do Modelo — Celebra']);
relSheet.addRow(['Cardinalidades e regras de integridade entre entidades']);
relSheet.addRow([]); // Linha 3
relSheet.addRow([
  'Origem',
  'Caminho de Origem',
  'Destino',
  'Caminho de Destino',
  'Cardinalidade',
  'Regra / Observação em Português'
]);

const relationsData = [
  ['Empresa', 'companies/{companyId}', 'Membro', 'companies/{companyId}/members/{uid}', '1:N', 'Uma empresa pode ter vários membros em sua equipe.'],
  ['Empresa', 'companies/{companyId}', 'Cliente', 'companies/{companyId}/clients/{clientId}', '1:N', 'Uma empresa pode cadastrar vários clientes.'],
  ['Empresa', 'companies/{companyId}', 'Evento', 'companies/{companyId}/events/{eventId}', '1:N', 'Uma empresa pode organizar vários eventos.'],
  ['Empresa', 'companies/{companyId}', 'Local', 'companies/{companyId}/venues/{venueId}', '1:N', 'Uma empresa pode cadastrar vários locais.'],
  ['Empresa', 'companies/{companyId}', 'Catálogos', 'eventTypes, venueTypes, professionalTypes', '1:N', 'Cada catálogo contém vários tipos configurados pela empresa.'],
  ['Perfil', 'users/{uid}', 'Empresa', 'companies/{companyId}', 'N:1', 'companyId vincula o usuário à sua empresa ativa.'],
  ['Empresa', 'companies/{companyId}', 'Organizador Responsável', 'users/{uid}', 'N:1', 'Cada empresa possui um ownerUid correspondente ao organizador.'],
  ['Usuário', 'users/{uid}', 'Membro da Equipe', 'companies/{companyId}/members/{uid}', '1:0..1', 'O documento de membro usa o próprio UID do usuário na empresa.'],
  ['Cliente', 'clients/{clientId}', 'Evento', 'events/{eventId}', '1:N', 'Cada evento referencia um cliente contratante.'],
  ['Organizador', 'users/{uid}', 'Evento', 'events/{eventId}', '1:N', 'createdBy armazena o UID de quem criou o evento.'],
  ['Tipo de Evento', 'eventTypes/{typeId}', 'Evento', 'events/{eventId}', '1:N', 'Cada evento referencia um tipo de evento cadastrado.'],
  ['Tipo de Local', 'venueTypes/{typeId}', 'Local', 'venues/{venueId}', '1:N', 'Um tipo classifica múltiplos locais.'],
  ['Evento', 'events/{eventId}', 'Local do Evento', 'events/{eventId}/locations/{locationId}', '1:N', 'Um evento pode utilizar múltiplos locais em sua programação.'],
  ['Local Cadastrado', 'venues/{venueId}', 'Local do Evento', 'events/{eventId}/locations/{locationId}', '1:N', 'Um local pode ser reutilizado em diversos eventos.'],
  ['Evento', 'events/{eventId}', 'Convocação', 'eventAssignments/{assignmentId}', '1:N', 'A convocação aponta para o evento via companyId e eventId.'],
  ['Técnico', 'users/{uid}', 'Convocação', 'eventAssignments/{assignmentId}', '1:N', 'technicianUid permite consultar todas as convocações recebidas pelo técnico.'],
  ['Especialidade', 'professionalTypes/{typeId}', 'Membro da Equipe', 'members/{uid}', '1:N', 'professionalTypeId define a especialidade do membro.'],
  ['Especialidade', 'professionalTypes/{typeId}', 'Convocação', 'eventAssignments/{assignmentId}', '1:N', 'professionalTypeId registra a função solicitada na convocação.'],
  ['Evento', 'events/{eventId}', 'Lançamento Financeiro', 'events/{eventId}/payments/{paymentId}', '1:N', 'Um evento pode possuir múltiplos pagamentos e recebimentos.']
];

relationsData.forEach(row => relSheet.addRow(row));

// Formatação ABA 3
relSheet.getCell('A1').font = { name: 'Arial', size: 16, bold: true, color: { argb: NAVY } };
relSheet.getCell('A2').font = { name: 'Arial', size: 10, italic: true, color: { argb: '61788D' } };

const headerRow3 = relSheet.getRow(4);
headerRow3.height = 28;
headerRow3.eachCell(cell => {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D97706' } }; // Âmbar escuro
  cell.font = HEADER_FONT;
  cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
});

for (let r = 5; r <= 4 + relationsData.length; r++) {
  const row = relSheet.getRow(r);
  row.height = 24;
  row.eachCell(cell => {
    cell.font = BODY_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    if (r % 2 === 0) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BG } };
    }
  });
}

relSheet.columns = [
  { width: 22 },
  { width: 45 },
  { width: 25 },
  { width: 45 },
  { width: 15 },
  { width: 65 }
];

await workbook.xlsx.writeFile(outputPath);
console.log(`Arquivo Excel gerado com sucesso em: ${outputPath}`);
