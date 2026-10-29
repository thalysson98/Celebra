import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { bancoDados } from '../configuracao/configuracaoFirebase';

function valorData(valor) {
  if (!valor) return Number.MAX_SAFE_INTEGER;
  if (typeof valor.toDate === 'function') return valor.toDate().getTime();
  const convertido = new Date(valor).getTime();
  return Number.isNaN(convertido) ? Number.MAX_SAFE_INTEGER : convertido;
}

async function obterDocumento(colecao, id) {
  if (!id) return null;
  const snapshot = await getDoc(doc(bancoDados, colecao, id));
  return snapshot.exists() ? snapshot.data() : null;
}

async function mapearConvite(snapshot) {
  const convite = snapshot.data();
  const evento = await obterDocumento('eventos', convite.id_evento);
  if (!evento) return null;

  const [cliente, local, tipoEvento, tipoProfissional] = await Promise.all([
    obterDocumento('clientes', evento.id_cliente),
    obterDocumento('locais', evento.id_local),
    obterDocumento('tipos_evento', evento.id_tipo_evento),
    obterDocumento('tipos_profissional', convite.id_tipo_profissional),
  ]);

  const status = { pendente: 'pending', aceito: 'accepted', recusado: 'declined' }[convite.situacao] || 'pending';
  return {
    id: snapshot.id,
    idConvite: snapshot.id,
    idEvento: convite.id_evento,
    idUsuario: convite.id_usuario,
    idEmpresa: convite.id_empresa,
    idTipoProfissional: convite.id_tipo_profissional || null,
    status,
    eventTitle: evento.titulo || 'Evento sem título',
    eventDate: evento.data_inicio || null,
    eventAddress: local?.endereco_completo || '',
    eventTypeName: tipoEvento?.nome || '',
    clientName: cliente?.nome || '',
    professionalTypeName: tipoProfissional?.nome || '',
    roleName: tipoProfissional?.nome || '',
    inviteDate: convite.enviado_em || null,
    respondedAt: convite.respondido_em || null,
  };
}

export function assinarConvocacoesTecnico(uidTecnico, aoReceberConvocacoes, aoOcorrerErro) {
  const consulta = query(
    collection(bancoDados, 'convites'),
    where('id_usuario', '==', uidTecnico),
  );

  return onSnapshot(consulta, async (snapshot) => {
    try {
      const convocacoes = (await Promise.all(snapshot.docs.map(mapearConvite)))
        .filter(Boolean)
        .sort((a, b) => valorData(a.eventDate || a.inviteDate) - valorData(b.eventDate || b.inviteDate));
      aoReceberConvocacoes(convocacoes);
    } catch (erro) {
      aoOcorrerErro?.(erro);
    }
  }, aoOcorrerErro);
}

export const subscribeToTechnicianAssignments = assinarConvocacoesTecnico;

export async function responderConvocacao({ idConvocacao, uidTecnico, status, assignmentId, technicianUid }) {
  const idConvite = idConvocacao || assignmentId;
  const uid = uidTecnico || technicianUid;
  const situacao = { accepted: 'aceito', declined: 'recusado' }[status];
  if (!idConvite || !uid || !situacao) throw new Error('Resposta de convocação inválida.');

  const refConvite = doc(bancoDados, 'convites', idConvite);
  await runTransaction(bancoDados, async (transaction) => {
    const snapshotConvite = await transaction.get(refConvite);
    if (!snapshotConvite.exists()) throw new Error('Esta convocação não está mais disponível.');

    const convite = snapshotConvite.data();
    if (convite.id_usuario !== uid) throw new Error('Você não tem acesso a esta convocação.');
    if (convite.situacao !== 'pendente') throw new Error('Esta convocação já foi respondida.');

    const refEvento = doc(bancoDados, 'eventos', convite.id_evento);
    const snapshotEvento = await transaction.get(refEvento);
    if (!snapshotEvento.exists()) throw new Error('O evento desta convocação não está mais disponível.');

    transaction.update(refConvite, {
      situacao,
      respondido_em: serverTimestamp(),
    });
    if (situacao === 'aceito') {
      transaction.update(refEvento, { membros_escalados: arrayUnion(uid) });
    }
  });
}

export const respondToAssignment = responderConvocacao;
