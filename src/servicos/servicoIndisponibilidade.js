//"Aqui na camada de serviço do Firebase, criei duas funções: uma que normaliza a data do evento (que vem no formato brasileiro DD/MM/AAAA) para o padrão do banco (AAAA-MM-DD), e outra que usa o getDoc para buscar na coleção indisponibilidade a chave composta ID_do_Tecnico + Data. Se o documento existir, o sistema sabe que o técnico bloqueou aquele dia."
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
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

export function normalizarParaChaveData(valorData) {
  if (!valorData) return null;
  if (typeof valorData === 'string') {
    const limpa = valorData.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(limpa)) {
      const [dia, mes, ano] = limpa.split('/');
      return `${ano}-${mes}-${dia}`;
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(limpa)) {
      return limpa.slice(0, 10);
    }
  }
  const d = typeof valorData?.toDate === 'function' ? valorData.toDate() : new Date(valorData);
  if (Number.isNaN(d.getTime())) return null;
  return obterChaveData(d);
}

function obterIdIndisponibilidade(uid, data) {
  return `${uid}_${obterChaveData(data)}`;
}

export async function verificarIndisponibilidadeTecnicoNaData(uid, dataEvento) {
  const chaveData = normalizarParaChaveData(dataEvento);
  if (!uid || !chaveData) return false;

  const idIndisponibilidade = `${uid}_${chaveData}`;
  const docSnap = await getDoc(doc(bancoDados, 'indisponibilidade', idIndisponibilidade));
  return docSnap.exists();
}

export function assinarIndisponibilidadeTecnico(uid, aoReceberDatas, aoOcorrerErro) {
  const consultaIndisponibilidade = query(
    collection(bancoDados, 'indisponibilidade'),
    where('id_usuario', '==', uid),
  );

  return onSnapshot(
    consultaIndisponibilidade,
    (snapshot) => {
      aoReceberDatas(snapshot.docs.map((item) => ({
        id: item.id,
        dateKey: item.data().chave_data,
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

  await setDoc(doc(bancoDados, 'indisponibilidade', idIndisponibilidade), {
    id_indisponibilidade: idIndisponibilidade,
    id_usuario: uid,
    chave_data: chaveData,
    data: Timestamp.fromDate(dataNormalizada),
    criado_em: serverTimestamp(),
  });
}

export const markTechnicianUnavailable = marcarIndisponibilidadeTecnico;

export async function removerIndisponibilidadeTecnico(uid, data) {
  verificarUsuarioAtual(uid);
  const dataNormalizada = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const idIndisponibilidade = obterIdIndisponibilidade(uid, dataNormalizada);

  await deleteDoc(doc(bancoDados, 'indisponibilidade', idIndisponibilidade));
}

export const removeTechnicianUnavailability = removerIndisponibilidadeTecnico;