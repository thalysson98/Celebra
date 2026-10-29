import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { bancoDados } from '../configuracao/configuracaoFirebase';

function extrairValorData(valor) {
  if (!valor) return Number.MAX_SAFE_INTEGER;
  if (typeof valor.toDate === 'function') return valor.toDate().getTime();
  const convertido = new Date(valor).getTime();
  return Number.isNaN(convertido) ? Number.MAX_SAFE_INTEGER : convertido;
}

export function assinarConvocacoesTecnico(uidTecnico, aoReceberConvocacoes, aoOcorrerErro) {
  const consultaConvocacoes = query(
    collection(bancoDados, 'eventAssignments'),
    where('technicianUid', '==', uidTecnico),
  );

  return onSnapshot(
    consultaConvocacoes,
    (snapshot) => {
      const convocacoes = snapshot.docs
        .map((docItem) => ({ id: docItem.id, ...docItem.data() }))
        .sort((a, b) => extrairValorData(a.eventDate || a.invitedAt) - extrairValorData(b.eventDate || b.invitedAt));

      aoReceberConvocacoes(convocacoes);
    },
    aoOcorrerErro,
  );
}

export const subscribeToTechnicianAssignments = assinarConvocacoesTecnico;

export async function responderConvocacao({ idConvocacao, uidTecnico, status, assignmentId, technicianUid }) {
  const convId = idConvocacao || assignmentId;
  const tecId = uidTecnico || technicianUid;

  if (!['accepted', 'declined'].includes(status)) {
    throw new Error('Resposta de convocação inválida.');
  }

  const refConvocacao = doc(bancoDados, 'eventAssignments', convId);

  await runTransaction(bancoDados, async (transaction) => {
    const snapshotConvocacao = await transaction.get(refConvocacao);

    if (!snapshotConvocacao.exists()) {
      throw new Error('Esta convocação não está mais disponível.');
    }

    const convocacao = snapshotConvocacao.data();
    if (convocacao.technicianUid !== tecId) {
      throw new Error('Você não tem acesso a esta convocação.');
    }
    if (convocacao.status !== 'pending') {
      throw new Error('Esta convocação já foi respondida.');
    }

    transaction.update(refConvocacao, {
      status,
      respondedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

export const respondToAssignment = responderConvocacao;
