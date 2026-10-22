import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';

function assertCurrentUser(uid) {
  if (!auth.currentUser || auth.currentUser.uid !== uid) {
    throw new Error('Você só pode alterar sua própria disponibilidade.');
  }
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getAvailabilityId(uid, date) {
  return `${uid}_${getDateKey(date)}`;
}

export function subscribeToTechnicianUnavailability(uid, onDates, onError) {
  const availabilityQuery = query(
    collection(db, 'technicianUnavailability'),
    where('technicianUid', '==', uid),
  );

  return onSnapshot(
    availabilityQuery,
    (snapshot) => {
      onDates(snapshot.docs.map((item) => ({
        id: item.id,
        dateKey: item.data().dateKey,
      })));
    },
    onError,
  );
}

export async function markTechnicianUnavailable(uid, date) {
  assertCurrentUser(uid);
  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dateKey = getDateKey(normalizedDate);
  const availabilityId = getAvailabilityId(uid, normalizedDate);

  await setDoc(doc(db, 'technicianUnavailability', availabilityId), {
    technicianUid: uid,
    dateKey,
    date: Timestamp.fromDate(normalizedDate),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function removeTechnicianUnavailability(uid, date) {
  assertCurrentUser(uid);
  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  await deleteDoc(doc(db, 'technicianUnavailability', getAvailabilityId(uid, normalizedDate)));
}
