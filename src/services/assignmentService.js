import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export function subscribeToTechnicianAssignments(technicianUid, onAssignments, onError) {
  const assignmentsQuery = query(
    collection(db, 'eventAssignments'),
    where('technicianUid', '==', technicianUid),
  );

  return onSnapshot(
    assignmentsQuery,
    (snapshot) => {
      const assignments = snapshot.docs
        .map((assignmentDoc) => ({ id: assignmentDoc.id, ...assignmentDoc.data() }))
        .sort((a, b) => getDateValue(a.eventDate || a.invitedAt) - getDateValue(b.eventDate || b.invitedAt));

      onAssignments(assignments);
    },
    onError,
  );
}

function getDateValue(value) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

export async function respondToAssignment({ assignmentId, technicianUid, status }) {
  if (!['accepted', 'declined'].includes(status)) {
    throw new Error('Resposta de convocação inválida.');
  }

  const assignmentRef = doc(db, 'eventAssignments', assignmentId);

  await runTransaction(db, async (transaction) => {
    const assignmentSnapshot = await transaction.get(assignmentRef);

    if (!assignmentSnapshot.exists()) {
      throw new Error('Esta convocação não está mais disponível.');
    }

    const assignment = assignmentSnapshot.data();
    if (assignment.technicianUid !== technicianUid) {
      throw new Error('Você não tem acesso a esta convocação.');
    }
    if (assignment.status !== 'pending') {
      throw new Error('Esta convocação já foi respondida.');
    }

    transaction.update(assignmentRef, {
      status,
      respondedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}
