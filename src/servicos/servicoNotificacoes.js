// src/servicos/servicoNotificacoes.js
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { bancoDados } from '../configuracao/configuracaoFirebase';

// 1. Converte datas (DD/MM/AAAA, AAAA-MM-DD ou Timestamp) para objeto Date (meia-noite local)
export function converterParaDataLocal(valorData) {
  if (!valorData) return null;

  if (typeof valorData?.toDate === 'function') {
    const d = valorData.toDate();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  if (typeof valorData === 'string') {
    const limpa = valorData.trim();
    // Formato brasileiro DD/MM/AAAA
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(limpa)) {
      const [dia, mes, ano] = limpa.split('/').map(Number);
      return new Date(ano, mes - 1, dia);
    }
    // Formato ISO AAAA-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(limpa)) {
      const [ano, mes, dia] = limpa.slice(0, 10).split('-').map(Number);
      return new Date(ano, mes - 1, dia);
    }
  }

  const d = new Date(valorData);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// 2. Calcula quantos dias faltam de HOJE até a data do evento
export function calcularDiasAteEvento(dataEvento) {
  const dataAlvo = converterParaDataLocal(dataEvento);
  if (!dataAlvo) return null;

  const hoje = new Date();
  const hojeMeiaNoite = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  const diferencaMs = dataAlvo.getTime() - hojeMeiaNoite.getTime();
  return Math.round(diferencaMs / (1000 * 60 * 60 * 24));
}

// 3. Cria uma notificação única no Firestore (evita duplicatas usando ID fixo)
async function criarNotificacaoUnica(idNotificacao, dados) {
  const ref = doc(bancoDados, 'notificacoes', idNotificacao);
  const snap = await getDoc(ref);

  // Se já foi enviada antes, não envia de novo
  if (snap.exists()) return false;

  await setDoc(ref, {
    id: idNotificacao,
    id_usuario: dados.idUsuario,
    id_evento: dados.idEvento || null,
    tipo: dados.tipo, // 'novo_evento' | 'lembrete_7_dias' | 'lembrete_3_dias' | 'evento_cancelado'
    titulo: dados.titulo,
    mensagem: dados.mensagem,
    lida: false,
    criado_em: serverTimestamp(),
  });

  return true;
}

// 4. GATILHO 1: Notificar quando um evento é lançado/escalado para o técnico
export async function notificarNovoEventoParaTecnico({ idUsuario, idEvento, nomeEvento, dataEvento, funcao }) {
  if (!idUsuario || !idEvento) return;

  const idNotificacao = `novo_evento_${idEvento}_${idUsuario}`;
  await criarNotificacaoUnica(idNotificacao, {
    idUsuario,
    idEvento,
    tipo: 'novo_evento',
    titulo: 'Novo evento lançado para você!',
    mensagem: `Você foi escalado como ${funcao || 'profissional'} no evento "${nomeEvento || 'Evento'}" (${dataEvento || 'data a definir'}).`,
  });

  // Se o evento já foi lançado faltando 7 dias ou menos (ou 3 dias ou menos), já avalia o lembrete!
  await verificarLembretesProximidadeEvento({
    idUsuario,
    idEvento,
    nomeEvento,
    dataEvento,
  });
}

// 5. GATILHO 2: Notificar quando um evento é cancelado pelo técnico (ou organizador)
export async function notificarEventoCancelado({ idUsuario, idDestinatario, idEvento, nomeEvento, nomeTecnico, dataEvento }) {
  const alvoUid = idDestinatario || idUsuario;
  if (!alvoUid || !idEvento) return;

  const idNotificacao = `cancelado_${idEvento}_${alvoUid}_${Date.now()}`;
  await criarNotificacaoUnica(idNotificacao, {
    idUsuario: alvoUid,
    idEvento,
    tipo: 'evento_cancelado',
    titulo: 'Participação em evento cancelada',
    mensagem: nomeTecnico
      ? `O técnico ${nomeTecnico} cancelou a participação no evento "${nomeEvento || 'Evento'}" (${dataEvento || ''}).`
      : `O evento "${nomeEvento || 'Evento'}" (${dataEvento || ''}) foi cancelado na sua agenda.`,
  });
}

// 6. GATILHO 3: Verifica automaticamente os lembretes de 7 dias e 3 dias antes
export async function verificarLembretesProximidadeEvento({ idUsuario, idEvento, nomeEvento, dataEvento, statusConfirmacao }) {
  if (!idUsuario || !idEvento || !dataEvento) return;

  // Ignora eventos cancelados ou recusados
  const statusLimpo = String(statusConfirmacao || '').toLowerCase();
  if (statusLimpo.includes('recusad') || statusLimpo.includes('cancelad')) return;

  const diasRestantes = calcularDiasAteEvento(dataEvento);
  if (diasRestantes === null || diasRestantes < 0) return; // Evento já passou

  // REGRA 1: Faltam exatos 7 dias (ou entre 4 e 7 dias caso ainda não tenha sido avisado dos 7 dias)
  if (diasRestantes <= 7 && diasRestantes > 3) {
    const idNotif7Dias = `lembrete_7d_${idEvento}_${idUsuario}`;
    await criarNotificacaoUnica(idNotif7Dias, {
      idUsuario,
      idEvento,
      tipo: 'lembrete_7_dias',
      titulo: 'Evento chegando (7 dias)!',
      mensagem: `Faltam ${diasRestantes} dias para o evento "${nomeEvento}" em ${dataEvento}. Prepare seus equipamentos!`,
    });
  }

  // REGRA 2: Faltam 3 dias ou menos (mesmo que tenha recebido/aceitado com menos de 7 dias!)
  if (diasRestantes <= 3 && diasRestantes >= 0) {
    const idNotif3Dias = `lembrete_3d_${idEvento}_${idUsuario}`;
    const textoPrazo = diasRestantes === 0 ? 'é HOJE' : `faltam ${diasRestantes} dia(s)`;
    await criarNotificacaoUnica(idNotif3Dias, {
      idUsuario,
      idEvento,
      tipo: 'lembrete_3_dias',
      titulo: 'Atenção: Evento muito próximo (3 dias)!',
      mensagem: `Atenção! ${textoPrazo} para o evento "${nomeEvento}" (${dataEvento}). Confira o horário e local.`,
    });
  }
}

// 7. Varre a lista de eventos do técnico e dispara os lembretes de 7 e 3 dias automaticamente
export async function processarLembretesListaEventos(idUsuario, listaEventos = []) {
  if (!idUsuario || !Array.isArray(listaEventos)) return;

  for (const ev of listaEventos) {
    await verificarLembretesProximidadeEvento({
      idUsuario,
      idEvento: ev.id || ev.idEvento,
      nomeEvento: ev.nome || ev.titulo || ev.nomeEvento || 'Evento',
      dataEvento: ev.dataInicio || ev.data || ev.dataEvento,
      statusConfirmacao: ev.statusConfirmacao || ev.status,
    });
  }
}

// 8. Escuta em tempo real todas as notificações do técnico para mostrar na tela
export function assinarNotificacoesUsuario(idUsuario, aoReceberNotificacoes, aoErro) {
  const q = query(
    collection(bancoDados, 'notificacoes'),
    where('id_usuario', '==', idUsuario)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const lista = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      // Ordena das mais recentes para as mais antigas
      lista.sort((a, b) => {
        const tA = a.criado_em?.toMillis ? a.criado_em.toMillis() : 0;
        const tB = b.criado_em?.toMillis ? b.criado_em.toMillis() : 0;
        return tB - tA;
      });
      aoReceberNotificacoes(lista);
    },
    aoErro
  );
}

// 9. Marca uma notificação como lida
export async function marcarNotificacaoComoLida(idNotificacao) {
  if (!idNotificacao) return;
  await updateDoc(doc(bancoDados, 'notificacoes', idNotificacao), {
    lida: true,
  });
}