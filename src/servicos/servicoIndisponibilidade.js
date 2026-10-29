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
import { autenticacao, bancoDados } from '../configuracao/configuracaoFirebase';

function verificarUsuarioAtual(uid) {
  if (!autenticacao.currentUser || autenticacao.currentUser.uid !== uid) {
    throw new Error('Você só pode alterar sua própria disponibilidade.');
  }
}

function obterChaveData(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function obterIdIndisponibilidade(uid, data) {
  return `${uid}_${obterChaveData(data)}`;
}

export function assinarIndisponibilidadeTecnico(uid, aoReceberDatas, aoOcorrerErro) {
  const consultaIndisponibilidade = query(
    collection(bancoDados, 'technicianUnavailability'),
    where('technicianUid', '==', uid),
  );

  return onSnapshot(
    consultaIndisponibilidade,
    (snapshot) => {
      aoReceberDatas(snapshot.docs.map((item) => ({
        id: item.id,
        dateKey: item.data().dateKey,
      })));
    },
    aoOcorrerErro,
  );
}

export const subscribeToTechnicianUnavailability = assinarIndisponibilidadeTecnico;

export async function marcarIndisponibilidadeTecnico(uid, data) {
  verificarUsuarioAtual(uid);
  const dataNormalizada = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const chaveData = obterChaveData(dataNormalizada);
  const idIndisponibilidade = obterIdIndisponibilidade(uid, dataNormalizada);

  await setDoc(doc(bancoDados, 'technicianUnavailability', idIndisponibilidade), {
    technicianUid: uid,
    dateKey: chaveData,
    date: Timestamp.fromDate(dataNormalizada),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export const markTechnicianUnavailable = marcarIndisponibilidadeTecnico;

export async function removerIndisponibilidadeTecnico(uid, data) {
  verificarUsuarioAtual(uid);
  const dataNormalizada = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const idIndisponibilidade = obterIdIndisponibilidade(uid, dataNormalizada);

  await deleteDoc(doc(bancoDados, 'technicianUnavailability', idIndisponibilidade));
}

export const removeTechnicianUnavailability = removerIndisponibilidadeTecnico;
