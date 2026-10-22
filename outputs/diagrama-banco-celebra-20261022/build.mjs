import fs from 'node:fs/promises';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const outputDir = new URL('.', import.meta.url).pathname.replace(/^\/(\w:)/, '$1').replaceAll('/', '\\');
const outputPath = `${outputDir}diagrama-banco-celebra.xlsx`;
const wb = Workbook.create();
const model = wb.worksheets.add('Modelo');
const fieldsSheet = wb.worksheets.add('Campos');
const relSheet = wb.worksheets.add('Relações');
const navy = '#102B46';
const blue = '#24527A';
const text = '#243947';
for (const sheet of [model, fieldsSheet, relSheet]) sheet.showGridLines = false;

const entities = [
  {name:'Perfil de acesso',path:'users/{uid}',pk:'uid (Firebase Auth)',refs:'companyId → companies/{companyId}',desc:'Perfil, papel e estado de acesso.',fields:[
    ['uid','string','Sim','Mesmo ID do Firebase Authentication.','PK'],['username','string','Sim','Nome de usuário normalizado para minúsculas.','Único (regra de negócio)'],['displayName','string','Sim','Nome para exibição.',''],['email','string','Sim','E-mail autenticado.',''],['role','string','Sim','organizer, technician ou pending. Validar no servidor.','Papel'],['companyId','string | null','Sim','Empresa ativa; null enquanto não houver vínculo.','FK'],['active','boolean','Sim','Indica se o acesso está ativo.',''],['createdAt','Timestamp','Sim','Criação do perfil.','Auditoria'],['updatedAt','Timestamp','Recomendado','Última atualização do perfil.','Auditoria']]},
  {name:'Empresa',path:'companies/{companyId}',pk:'companyId',refs:'ownerUid → users/{uid}',desc:'Empresa e preferências de notificação.',fields:[
    ['name','string','Sim','Nome mostrado em Minha empresa.',''],['legalName','string','Não','Razão social, se diferente.',''],['cnpj','string','Não','Documento da empresa.',''],['email','string','Não','E-mail de contato.',''],['phone','string','Não','Telefone de contato.',''],['address','map','Não','street, number, complement, district, city, state, postalCode.',''],['ownerUid','string','Sim','UID do usuário organizador responsável.','FK'],['notificationPreferences','map','Sim','Preferências eventsAndTeam e clientPayments (boolean).',''],['createdAt','Timestamp','Sim','Criação da empresa.','Auditoria'],['updatedAt','Timestamp','Recomendado','Última atualização.','Auditoria']]},
  {name:'Membro da empresa',path:'companies/{companyId}/members/{uid}',pk:'uid (por empresa)',refs:'uid → users/{uid}; professionalTypeId → professionalTypes/{typeId}',desc:'Vínculo de usuário, papel e especialidade.',fields:[
    ['uid','string','Sim','Usuário vinculado.','PK/FK'],['role','string','Sim','organizer ou technician.','Papel'],['professionalTypeId','string | null','Não','Especialidade do técnico.','FK'],['status','string','Sim','active, invited ou inactive.',''],['joinedAt','Timestamp','Não','Data de entrada na empresa.','']]},
  {name:'Cliente',path:'companies/{companyId}/clients/{clientId}',pk:'clientId',refs:'companyId → companies/{companyId}',desc:'Pessoa ou empresa atendida.',fields:[
    ['name','string','Sim','Nome da pessoa ou empresa cliente.',''],['email','string','Não','E-mail de contato.',''],['phone','string','Não','Telefone de contato.',''],['document','string','Não','CPF/CNPJ, se necessário.',''],['notes','string','Não','Observações.',''],['active','boolean','Sim','Exclusão lógica ou arquivamento.',''],['createdAt','Timestamp','Sim','Criação do registro.','Auditoria'],['updatedAt','Timestamp','Sim','Última atualização.','Auditoria']]},
  ...[['eventTypes','Tipo de evento'],['venueTypes','Tipo de local'],['professionalTypes','Tipo profissional']].map(([collection,name])=>({name,path:`companies/{companyId}/${collection}/{typeId}`,pk:'typeId',refs:'companyId → companies/{companyId}',desc:'Catálogo configurável da empresa.',fields:[
    ['name','string','Sim','Nome do tipo.',''],['description','string','Não','Descrição opcional.',''],['active','boolean','Sim','Permite desativar sem afetar registros antigos.',''],['createdAt','Timestamp','Sim','Criação do registro.','Auditoria'],['updatedAt','Timestamp','Sim','Última atualização.','Auditoria']]})),
  {name:'Local',path:'companies/{companyId}/venues/{venueId}',pk:'venueId',refs:'venueTypeId → venueTypes/{typeId}',desc:'Local disponível para eventos.',fields:[
    ['name','string','Sim','Nome do local.',''],['venueTypeId','string','Não','Referência ao tipo de local.','FK'],['address','map','Não','Endereço estruturado.',''],['capacity','number','Não','Capacidade informada do local.',''],['notes','string','Não','Observações de acesso e uso.',''],['active','boolean','Sim','Disponibilidade para novos eventos.',''],['createdAt','Timestamp','Sim','Criação do registro.','Auditoria'],['updatedAt','Timestamp','Sim','Última atualização.','Auditoria']]},
  {name:'Evento',path:'companies/{companyId}/events/{eventId}',pk:'eventId',refs:'clientId → clients; eventTypeId → eventTypes; createdBy → users/{uid}',desc:'Evento principal da empresa.',fields:[
    ['title','string','Sim','Título, por exemplo Ana & Pedro.',''],['clientId','string','Sim','Referência ao cliente.','FK'],['clientName','string','Recomendado','Snapshot para exibição em listas.','Snapshot'],['eventTypeId','string','Sim','Referência ao tipo de evento.','FK'],['date','Timestamp','Sim','Data e hora de início.',''],['durationMinutes','number','Não','Duração planejada.',''],['guestCount','number','Não','Quantidade de convidados.',''],['status','string','Sim','draft, scheduled, inProgress, completed ou cancelled.',''],['notes','string','Não','Observações gerais.',''],['createdBy','string','Sim','UID do organizador que criou o evento.','FK'],['createdAt','Timestamp','Sim','Criação do registro.','Auditoria'],['updatedAt','Timestamp','Sim','Última atualização.','Auditoria']]},
  {name:'Local do evento',path:'companies/{companyId}/events/{eventId}/locations/{locationId}',pk:'locationId',refs:'eventId → events/{eventId}; venueId → venues/{venueId}',desc:'Local usado na programação do evento.',fields:[
    ['venueId','string','Sim','Referência ao local cadastrado.','FK'],['venueName','string','Recomendado','Snapshot para renderização da lista.','Snapshot'],['sequence','number','Não','Ordem do local na programação.',''],['startAt','Timestamp','Não','Início da janela de uso.',''],['endAt','Timestamp','Não','Fim da janela de uso.',''],['notes','string','Não','Instruções específicas.','']]},
  {name:'Convocação / atribuição',path:'eventAssignments/{assignmentId}',pk:'assignmentId',refs:'companyId + eventId → evento; technicianUid → users/{uid}; professionalTypeId → professionalTypes',desc:'Alocação do técnico e resposta à convocação.',fields:[
    ['companyId','string','Sim','Empresa proprietária do evento.','FK'],['eventId','string','Sim','ID do evento dentro da empresa.','FK'],['technicianUid','string','Sim','Usuário técnico convocado.','FK'],['technicianName','string','Recomendado','Snapshot do nome do técnico.','Snapshot'],['eventTitle','string','Recomendado','Snapshot do título do evento.','Snapshot'],['eventDate','Timestamp','Recomendado','Snapshot de data e hora.','Snapshot'],['eventAddress','string','Não','Endereço ou resumo do local.',''],['professionalTypeId','string','Não','Especialidade solicitada.','FK'],['professionalTypeName','string','Recomendado','Snapshot do nome da especialidade.','Snapshot'],['roleName','string','Não','Atividade específica do técnico.',''],['clientName','string','Não','Snapshot do nome do cliente.','Snapshot'],['status','string','Sim','pending, accepted ou declined.',''],['invitedAt','Timestamp','Sim','Momento da convocação.',''],['respondedAt','Timestamp | null','Sim','Momento da resposta; null até responder.',''],['createdAt','Timestamp','Sim','Criação da atribuição.','Auditoria'],['updatedAt','Timestamp','Sim','Última atualização.','Auditoria']]},
  {name:'Lançamento financeiro',path:'companies/{companyId}/events/{eventId}/payments/{paymentId}',pk:'paymentId',refs:'eventId → events/{eventId}',desc:'Receita ou despesa ligada ao evento.',fields:[
    ['description','string','Sim','Descrição do valor.',''],['amountCents','number','Sim','Valor inteiro em centavos.','Unidade: centavos'],['direction','string','Sim','income ou expense; confirmar com o cliente.',''],['dueAt','Timestamp','Não','Vencimento.',''],['paidAt','Timestamp | null','Não','Data de pagamento ou recebimento.',''],['status','string','Sim','pending, paid ou cancelled.',''],['createdAt','Timestamp','Sim','Criação do lançamento.','Auditoria'],['updatedAt','Timestamp','Sim','Última atualização.','Auditoria']]}
];

function setupTitle(sheet, title, subtitle, cols) {
  sheet.getRange('A1').values = [[title]];
  sheet.getRange('A2').values = [[subtitle]];
  sheet.getRange(`A1:${cols}1`).format.font = {name:'Arial',size:16,bold:true,color:navy};
  sheet.getRange(`A2:${cols}2`).format.font = {name:'Arial',size:10,italic:true,color:'#61788D'};
  sheet.getRange(`A1:${cols}1`).format.rowHeight = 27;
  sheet.getRange(`A2:${cols}2`).format.rowHeight = 21;
}
function styleTable(sheet, range, header, rows) {
  const table = sheet.tables.add(range,true,header);
  table.style = 'TableStyleMedium2';
  sheet.getRange(range).format.font = {name:'Arial',size:10,color:text};
  sheet.getRange(range.split(':')[0]+':'+range.split(':')[1].replace(/\\d+$/, '4')).format.fill = navy;
  sheet.getRange(range.split(':')[0]+':'+range.split(':')[1].replace(/\\d+$/, '4')).format.font = {name:'Arial',size:10,bold:true,color:'#FFFFFF'};
  sheet.getRange(range.split(':')[0]+':'+range.split(':')[1].replace(/\\d+$/, '4')).format.wrapText = true;
  sheet.getRange(range.split(':')[0]+':'+range.split(':')[1].replace(/\\d+$/, '4')).format.rowHeight = 30;
  sheet.getRange(rows).format.wrapText = true;
}

const modelRows = entities.map(e=>[e.name,e.path,e.pk,e.refs,e.desc]);
setupTitle(model,'Modelo de dados Celebra','Firebase Authentication + Cloud Firestore | Entidades, caminhos e referências principais','E');
model.getRange('A4:E4').values = [['Entidade','Caminho no Firestore','Chave do documento','Referências principais','Finalidade']];
model.getRangeByIndexes(4,0,modelRows.length,5).values = modelRows;
const modelEnd = 4 + modelRows.length;
const mt = model.tables.add(`A4:E${modelEnd}`,true,'Entidades'); mt.style = 'TableStyleMedium2';
model.getRange(`A1:E1`).format.font = {name:'Arial',size:16,bold:true,color:navy};
model.getRange('A2:E2').format.font = {name:'Arial',size:10,italic:true,color:'#61788D'};
model.getRange(`A4:E${modelEnd}`).format.font = {name:'Arial',size:10,color:text};
model.getRange('A4:E4').format = {fill:navy,font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},verticalAlignment:'center',wrapText:true,rowHeight:30};
model.getRange(`A5:E${modelEnd}`).format.wrapText = true;
model.getRange(`A5:E${modelEnd}`).format.rowHeight = 34;
for (const [col,width] of [['A',25],['B',53],['C',24],['D',50],['E',38]]) model.getRange(`${col}:${col}`).format.columnWidth = width;
model.getRange('A1:E1').format.rowHeight = 27; model.getRange('A2:E2').format.rowHeight = 21;
model.freezePanes.freezeRows(4); model.tabColor = navy;

const fieldRows = [];
for (const entity of entities) for (const f of entity.fields) fieldRows.push([entity.path,f[0],f[1],f[2],f[4],f[3]]);
setupTitle(fieldsSheet,'Dicionário de campos','Fonte: docs/dicionario-de-dados.md | Datas como Timestamp; valores monetários inteiros em centavos.','F');
fieldsSheet.getRange('A4:F4').values = [['Coleção / caminho','Campo','Tipo','Obrigatoriedade','Chave / observação','Descrição']];
fieldsSheet.getRangeByIndexes(4,0,fieldRows.length,6).values = fieldRows;
const fieldEnd = 4 + fieldRows.length;
const ft = fieldsSheet.tables.add(`A4:F${fieldEnd}`,true,'CamposFirestore'); ft.style = 'TableStyleMedium2';
fieldsSheet.getRange(`A4:F${fieldEnd}`).format.font = {name:'Arial',size:10,color:text};
fieldsSheet.getRange('A4:F4').format = {fill:navy,font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},verticalAlignment:'center',wrapText:true,rowHeight:30};
fieldsSheet.getRange(`A5:F${fieldEnd}`).format.wrapText = true;
fieldsSheet.getRange(`A5:F${fieldEnd}`).format.rowHeight = 31;
for (const [col,width] of [['A',53],['B',24],['C',20],['D',18],['E',22],['F',66]]) fieldsSheet.getRange(`${col}:${col}`).format.columnWidth = width;
fieldsSheet.freezePanes.freezeRows(4); fieldsSheet.tabColor = blue;

const relations = [
  ['Empresa','companies/{companyId}','Membro','companies/{companyId}/members/{uid}','1:N','Uma empresa pode ter vários membros.'],
  ['Empresa','companies/{companyId}','Cliente','companies/{companyId}/clients/{clientId}','1:N','Uma empresa pode cadastrar vários clientes.'],
  ['Empresa','companies/{companyId}','Evento','companies/{companyId}/events/{eventId}','1:N','Uma empresa pode organizar vários eventos.'],
  ['Empresa','companies/{companyId}','Local','companies/{companyId}/venues/{venueId}','1:N','Uma empresa pode cadastrar vários locais.'],
  ['Empresa','companies/{companyId}','Catálogos','eventTypes, venueTypes, professionalTypes','1:N','Cada catálogo contém vários tipos da empresa.'],
  ['Perfil','users/{uid}','Empresa','companies/{companyId}','N:1','companyId vincula o perfil à empresa ativa.'],
  ['Empresa','companies/{companyId}','Organizador','users/{uid}','N:1','Cada empresa aponta para um ownerUid; unicidade entre empresas não definida.'],
  ['Usuário','users/{uid}','Membro','companies/{companyId}/members/{uid}','1:0..1','O documento do membro usa uid como ID dentro da empresa.'],
  ['Cliente','clients/{clientId}','Evento','events/{eventId}','1:N','Cada evento referencia um cliente.'],
  ['Organizador','users/{uid}','Evento','events/{eventId}','1:N','createdBy guarda o UID de quem criou o evento.'],
  ['Tipo de evento','eventTypes/{typeId}','Evento','events/{eventId}','1:N','Cada evento referencia um tipo de evento.'],
  ['Tipo de local','venueTypes/{typeId}','Local','venues/{venueId}','1:N','Um tipo pode classificar vários locais.'],
  ['Evento','events/{eventId}','Local do evento','events/{eventId}/locations/{locationId}','1:N','Um evento pode usar vários locais.'],
  ['Local','venues/{venueId}','Local do evento','events/{eventId}/locations/{locationId}','1:N','O local cadastrado pode ser usado em vários eventos.'],
  ['Evento','events/{eventId}','Convocação','eventAssignments/{assignmentId}','1:N','A atribuição aponta para o evento por companyId + eventId.'],
  ['Técnico','users/{uid}','Convocação','eventAssignments/{assignmentId}','1:N','technicianUid permite consultar as convocações do técnico.'],
  ['Tipo profissional','professionalTypes/{typeId}','Membro','members/{uid}','1:N','professionalTypeId representa a especialidade do membro.'],
  ['Tipo profissional','professionalTypes/{typeId}','Convocação','eventAssignments/{assignmentId}','1:N','professionalTypeId registra a especialidade solicitada.'],
  ['Evento','events/{eventId}','Lançamento financeiro','events/{eventId}/payments/{paymentId}','1:N','Um evento pode ter vários lançamentos.']
];
setupTitle(relSheet,'Relações do modelo','Caminhos internos são relativos a companies/{companyId}; cardinalidades derivadas do dicionário.','F');
relSheet.getRange('A4:F4').values = [['Origem','Caminho de origem','Destino','Caminho de destino','Cardinalidade','Regra / observação']];
relSheet.getRangeByIndexes(4,0,relations.length,6).values = relations;
const relEnd = 4 + relations.length;
const rt = relSheet.tables.add(`A4:F${relEnd}`,true,'RelacoesFirestore'); rt.style = 'TableStyleMedium2';
relSheet.getRange(`A4:F${relEnd}`).format.font = {name:'Arial',size:10,color:text};
relSheet.getRange('A4:F4').format = {fill:navy,font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},verticalAlignment:'center',wrapText:true,rowHeight:30};
relSheet.getRange(`A5:F${relEnd}`).format.wrapText = true;
relSheet.getRange(`A5:F${relEnd}`).format.rowHeight = 34;
for (const [col,width] of [['A',23],['B',48],['C',26],['D',51],['E',16],['F',70]]) relSheet.getRange(`${col}:${col}`).format.columnWidth = width;
relSheet.freezePanes.freezeRows(4); relSheet.tabColor = '#F4BA42';

wb.recalculate();
const overview = await wb.inspect({kind:'workbook,sheet,table',maxChars:3500,tableMaxRows:4,tableMaxCols:6});
console.log(overview.ndjson);
const preview = await wb.render({sheetName:'Modelo',range:`A1:E${modelEnd}`,scale:1,format:'png'});
await fs.writeFile(`${outputDir}modelo-preview.png`,new Uint8Array(await preview.arrayBuffer()));
for (const [sheetName, range, fileName] of [['Campos','A1:F15','campos-preview.png'],['Relações',`A1:F${relEnd}`,'relacoes-preview.png']]) {
  const sheetPreview = await wb.render({sheetName,range,scale:1,format:'png'});
  await fs.writeFile(`${outputDir}${fileName}`,new Uint8Array(await sheetPreview.arrayBuffer()));
}
await fs.mkdir(outputDir,{recursive:true});
const xlsx = await SpreadsheetFile.exportXlsx(wb);
await xlsx.save(outputPath);
console.log(`Salvo em ${outputPath} | entidades=${entities.length} | campos=${fieldRows.length} | relações=${relations.length}`);
