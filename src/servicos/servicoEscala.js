
import { arrayUnion, arrayRemove, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, runTransaction, serverTimestamp, setDoc, where, writeBatch, updateDoc } from 'firebase/firestore';
import { bancoDados } from '../configuracao/configuracaoFirebase';
import { notificarNovoEventoParaTecnico } from './servicoNotificacoes';

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

export async function listarTecnicosDaEmpresa(idEmpresa) {
  if (!idEmpresa) return [];
  const resultado = await getDocs(query(collection(bancoDados, 'usuarios'), where('id_empresa', '==', idEmpresa), where('papel', '==', false), where('ativo', '==', true)));
  return resultado.docs
    .map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }))
    .map((tecnico) => ({ id: tecnico.id_usuario || tecnico.id, nome: tecnico.nome_completo || 'Colaborador' }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export async function enviarConvitesEvento({ idEvento, idEmpresa, profissionais = [] }) {
  const convidados = profissionais.filter((p) => p.enviarConvite !== false);
  if (!convidados.length) return;

  const lote = writeBatch(bancoDados);
  const docEmpresa = await getDoc(doc(bancoDados, 'empresas', idEmpresa));
  const nomeEmpresa = docEmpresa.exists() ? docEmpresa.data().nome_fantasia : 'O Organizador';

  // Busca os dados do evento para compor o texto da notificação externa
  const docEvento = await getDoc(doc(bancoDados, 'eventos', idEvento));
  const dadosEvento = docEvento.exists() ? docEvento.data() : {};
  const tituloEvento = dadosEvento.titulo || 'Novo Evento';
  
  let dataFormatada = '';
  if (dadosEvento.data_inicio) {
    const d = typeof dadosEvento.data_inicio.toDate === 'function' 
      ? dadosEvento.data_inicio.toDate() 
      : new Date(dadosEvento.data_inicio);
    dataFormatada = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  const convitesSnap = await getDocs(
    query(
      collection(bancoDados, 'convites'),
      where('id_empresa', '==', idEmpresa),
      where('id_evento', '==', idEvento)
    )
  );
  const convitesExistentes = new Map(convitesSnap.docs.map((d) => [d.id, d.data()]));

  for (const profissional of convidados) {
    const idUsuario = profissional.idUsuario || profissional.id;
    const idConvite = `${idEvento}_${idUsuario}`;
    const referencia = doc(bancoDados, 'convites', idConvite);
    const existente = convitesExistentes.get(idConvite);

    if (existente && existente.situacao !== 'cancelado') {
      throw new Error(`O profissional já possui convite ativo.`);
    }

    if (existente && existente.situacao === 'cancelado') {
      await deleteDoc(referencia);
    }
    
    lote.set(referencia, {
      id_convite: idConvite,
      id_empresa: idEmpresa,
      id_evento: idEvento,
      id_usuario: idUsuario,
      id_tipo_profissional: profissional.idTipoProfissional,
      nome_profissional: profissional.nomeProfissional || '',
      nome_tipo_profissional: profissional.funcao || '',
      nomeEmpresa: nomeEmpresa,
      situacao: 'pendente',
      enviado_em: serverTimestamp(),
    });
  }

  // 1. Salva todos os convites no Firestore
  await lote.commit();

  // 2. Dispara a notificação externa para cada técnico escalado
  for (const profissional of convidados) {
    const idUsuario = profissional.idUsuario || profissional.id;
    try {
      await notificarNovoEventoParaTecnico({
        idUsuario,
        idEvento,
        nomeEvento: tituloEvento,
        dataEvento: dataFormatada,
        funcao: profissional.funcao || 'Técnico',
      });
    } catch (e) {
      console.log('Erro ao enviar notificação externa para o técnico:', e?.message);
    }
  }
}

export async function reenviarConvite(idConvite) {
  const ref = doc(bancoDados, 'convites', idConvite);
  try {
    await updateDoc(ref, { situacao: 'pendente', enviado_em: serverTimestamp() });
  } catch {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const dados = snap.data();
      await deleteDoc(ref);
      const { respondido_em, ...resto } = dados;
      await setDoc(ref, { ...resto, situacao: 'pendente', enviado_em: serverTimestamp() });
    }
  }
}

export async function removerConvite(idConvite, idEvento, idUsuario) {
  await runTransaction(bancoDados, async (t) => {
     t.delete(doc(bancoDados, 'convites', idConvite));
     t.update(doc(bancoDados, 'eventos', idEvento), { membros_escalados: arrayRemove(idUsuario) });
  });
}

export async function atualizarFuncaoConvite(idConvite, idTipoProfissional, nomeTipoProfissional) {
  const ref = doc(bancoDados, 'convites', idConvite);
  try {
    await updateDoc(ref, {
      id_tipo_profissional: idTipoProfissional,
      nome_tipo_profissional: nomeTipoProfissional,
    });
  } catch {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const dados = snap.data();
      await deleteDoc(ref);
      await setDoc(ref, {
        ...dados,
        id_tipo_profissional: idTipoProfissional,
        nome_tipo_profissional: nomeTipoProfissional,
        situacao: 'pendente',
        enviado_em: serverTimestamp(),
      });
    }
  }
}

async function mapearConvite(snapshot) {
  const convite = snapshot.data();
  const evento = await obterDocumento('eventos', convite.id_evento);
  if (!evento) return null;
  const local = evento.id_locais && evento.id_locais.length > 0 ? await obterDocumento('locais', evento.id_locais[0]) : null;
  const tipoEvento = await obterDocumento('tipos_evento', evento.id_tipo_evento);
  const status = { pendente: 'pending', aceito: 'accepted', recusado: 'declined', cancelado: 'cancelled' }[convite.situacao] || 'pending';

  return {
    id: snapshot.id, idEvento: convite.id_evento, idUsuario: convite.id_usuario, idEmpresa: convite.id_empresa,
    status, eventTitle: evento.titulo || 'Evento sem título', eventDate: evento.data_inicio || null,
    eventAddress: local?.endereco_completo || '', eventTypeName: tipoEvento?.nome || '',
    roleName: convite.nome_tipo_profissional || '', nomeEmpresa: convite.nomeEmpresa || 'O Organizador',
    inviteDate: convite.enviado_em || null, respondedAt: convite.respondido_em || null,
  };
}

export function subscribeToTechnicianAssignments(uidTecnico, aoReceber, aoErro) {
  const consulta = query(collection(bancoDados, 'convites'), where('id_usuario', '==', uidTecnico));
  return onSnapshot(consulta, async (snapshot) => {
    try {
      const convocacoes = (await Promise.all(snapshot.docs.map(mapearConvite))).filter(Boolean).sort((a, b) => valorData(a.eventDate) - valorData(b.eventDate));
      aoReceber(convocacoes);
    } catch (e) { aoErro?.(e); }
  }, aoErro);
}

export async function respondToAssignment({ assignmentId, technicianUid, status }) {
  const situacao = { accepted: 'aceito', declined: 'recusado' }[status];
  const refConvite = doc(bancoDados, 'convites', assignmentId);

  await runTransaction(bancoDados, async (t) => {
    const snap = await t.get(refConvite);
    const convite = snap.data();
    if (convite.situacao === 'cancelado') throw new Error('Este convite foi cancelado pelo organizador.');

    t.update(refConvite, { situacao, respondido_em: serverTimestamp() });
    if (situacao === 'aceito') {
      t.update(doc(bancoDados, 'eventos', convite.id_evento), { membros_escalados: arrayUnion(technicianUid) });
    }
  });
}


export async function removerProfissionalInformativo(idEvento, idUsuario) {
  const eventoRef = doc(bancoDados, 'eventos', idEvento);
  const eventoSnap = await getDoc(eventoRef);
  
  if (eventoSnap.exists()) {
    const eventoData = eventoSnap.data();
    const equipeInformativa = eventoData.equipe_informativa || [];
  
    const novaEquipe = equipeInformativa.filter(p => String(p.id_usuario) !== String(idUsuario));
    
    await updateDoc(eventoRef, { equipe_informativa: novaEquipe });
  }
}