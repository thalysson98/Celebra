// ============================================================================
// src/servicos/servicoNotificacoes.js
// ATENÇÃO: Este código deve ficar APENAS em src/servicos/servicoNotificacoes.js
// ============================================================================
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { bancoDados } from '../configuracao/configuracaoFirebase';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

const bannersLocaisDisparados = new Set();
const notificacoesCriadasSessao = new Set();

export async function notificarRemocaoConvocacao({
  idUsuario,
  idEvento,
  nomeEvento,
  dataEvento,
  funcao,
  nomeEmpresa,
}) {
  if (!idUsuario || !idEvento) return false;

  const dataFormatada = formatarDataNotificacao(dataEvento);
  const idNotificacao = `convocacao_removida_${idEvento}_${idUsuario}_${Date.now()}`;
  return criarNotificacaoUnica(
    idNotificacao,
    {
      idUsuario,
      idEvento,
      tipo: 'convocacao_removida',
      titulo: 'Convocação removida',
      mensagem: `${nomeEmpresa || 'O organizador'} removeu sua convocação${funcao ? ` como ${funcao}` : ''} do evento "${nomeEvento || 'Evento'}" (${dataFormatada}).`,
    },
    { dispararBannerLocal: false, enviarPushRemoto: true }
  );
}

export async function inicializarNotificacoesDispositivo(idUsuario) {
  if (Platform.OS === 'web') return null;

  try {
    if (Platform.OS === 'android' && !isRunningInExpoGo()) {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Avisos de Eventos',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
        });
      } catch (erroCanal) {
        console.warn('Não foi possível configurar o canal de notificações:', erroCanal?.message || erroCanal);
      }
    }

    const { status: statusAtual } = await Notifications.getPermissionsAsync();
    let statusFinal = statusAtual;
    if (statusAtual !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      statusFinal = status;
    }

    if (statusFinal !== 'granted') {
      console.log('Permissão de notificações não concedida pelo usuário.');
      return null;
    }

    if (!Device.isDevice) {
      console.log('Push remoto exige um dispositivo físico.');
      return null;
    }

    if (Platform.OS === 'android' && isRunningInExpoGo()) {
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      '1a448861-4c80-4505-8160-59d3bb8bd0a7';
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const pushToken = tokenData?.data;

    if (pushToken && idUsuario) {
      await updateDoc(doc(bancoDados, 'usuarios', idUsuario), { pushToken });
    }

    return pushToken;
  } catch (erro) {
    console.log('Aviso ao inicializar notificações:', erro?.message || erro);
    return null;
  }
}

// Cancela todos os alarmes locais agendados no celular quando o técnico desativa as notificações
export async function cancelarTodasNotificacoesAgendadas() {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (erro) {
    console.error('Erro ao cancelar notificações agendadas:', erro?.message || erro);
  }
}

async function enviarPushRemotoParaUsuario(idUsuarioDestino, titulo, mensagem) {
  // Na versão Web o navegador bloqueia chamadas diretas para a API do Expo Push (CORS)
  if (Platform.OS === 'web') return;

  try {
    const userSnap = await getDoc(doc(bancoDados, 'usuarios', idUsuarioDestino));
    const dadosUsuario = userSnap.data();
    // Respeita a preferência do técnico caso ele tenha desligado as notificações
    if (dadosUsuario?.notificacoes_eventos === false) {
      return;
    }
    const pushToken = dadosUsuario?.pushToken;

    if (!pushToken) {
      console.log(`Usuário ${idUsuarioDestino} não possui pushToken cadastrado.`);
      return;
    }

    const resposta = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        sound: 'default',
        title: titulo,
        body: mensagem,
        channelId: 'default',
        priority: 'high',
      }),
    });

    if (!resposta.ok) {
      throw new Error(`Expo Push respondeu com status ${resposta.status}.`);
    }
  } catch (erro) {
    console.error('Erro ao enviar push remoto:', erro?.message || erro);
  }
}

export async function dispararNotificacaoBarraCelular(titulo, mensagem, idNotificacao = null) {
  if (Platform.OS === 'web') return;

  try {
    if (idNotificacao) {
      if (bannersLocaisDisparados.has(idNotificacao)) return;
      bannersLocaisDisparados.add(idNotificacao);
    }

    await Notifications.scheduleNotificationAsync({
      content: { title: titulo, body: mensagem, sound: true },
      trigger: null,
    });
  } catch (erro) {
    if (idNotificacao) bannersLocaisDisparados.delete(idNotificacao);
    console.error('Erro na notificação local:', erro?.message || erro);
  }
}

export function converterParaDataLocal(valorData) {
  if (!valorData) return null;

  if (typeof valorData?.toDate === 'function') {
    const data = valorData.toDate();
    return new Date(data.getFullYear(), data.getMonth(), data.getDate());
  }

  if (valorData instanceof Date) {
    if (Number.isNaN(valorData.getTime())) return null;
    return new Date(valorData.getFullYear(), valorData.getMonth(), valorData.getDate());
  }

  if (typeof valorData === 'string') {
    const limpa = valorData.trim();
    let partes;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(limpa)) {
      const [dia, mes, ano] = limpa.split('/').map(Number);
      partes = [ano, mes - 1, dia];
    } else if (/^\d{4}-\d{2}-\d{2}/.test(limpa)) {
      const [ano, mes, dia] = limpa.slice(0, 10).split('-').map(Number);
      partes = [ano, mes - 1, dia];
    }

    if (partes) {
      const [ano, mes, dia] = partes;
      const data = new Date(ano, mes, dia);
      if (data.getFullYear() !== ano || data.getMonth() !== mes || data.getDate() !== dia) {
        return null;
      }
      return data;
    }
  }

  const data = new Date(valorData);
  if (Number.isNaN(data.getTime())) return null;
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

export function formatarDataNotificacao(valorData) {
  if (!valorData) return '';
  if (typeof valorData === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(valorData.trim())) {
    return valorData.trim();
  }

  const data = converterParaDataLocal(valorData);
  if (!data) return String(valorData);

  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${data.getFullYear()}`;
}

export function calcularDiasAteEvento(dataEvento) {
  const dataAlvo = converterParaDataLocal(dataEvento);
  if (!dataAlvo) return null;

  const hoje = new Date();
  const hojeMeiaNoite = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((dataAlvo.getTime() - hojeMeiaNoite.getTime()) / (1000 * 60 * 60 * 24));
}

function criarTriggerData(data) {
  if (Notifications.SchedulableTriggerInputTypes?.DATE) {
    return {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: data,
    };
  }
  return { type: 'date', date: data };
}

export async function agendarAlarmesLocaisEvento({ idEvento, nomeEvento, dataEvento }) {
  if (Platform.OS === 'web') return;

  const dataAlvo = converterParaDataLocal(dataEvento);
  if (!dataAlvo) return;

  const dataFormatada = formatarDataNotificacao(dataEvento);
  const agora = new Date();
  const alarmes = [
    {
      diasAntes: 7,
      hora: 9,
      identifier: `alarme_7d_${idEvento}`,
      title: 'Evento chegando (7 dias)!',
      body: `Faltam 7 dias para o evento "${nomeEvento}" (${dataFormatada}).`,
    },
    {
      diasAntes: 3,
      hora: 9,
      identifier: `alarme_3d_${idEvento}`,
      title: 'Evento em 3 dias!',
      body: `Faltam apenas 3 dias para o evento "${nomeEvento}" (${dataFormatada}). Prepare-se!`,
    },
    {
      diasAntes: 0,
      hora: 8,
      identifier: `alarme_hoje_${idEvento}`,
      title: 'É hoje! Dia do evento!',
      body: `É HOJE! O evento "${nomeEvento}" acontece hoje (${dataFormatada}). Confira o horário e local!`,
    },
  ];

  for (const alarme of alarmes) {
    const dataAlarme = new Date(dataAlvo);
    dataAlarme.setDate(dataAlarme.getDate() - alarme.diasAntes);
    dataAlarme.setHours(alarme.hora, 0, 0, 0);
    if (dataAlarme <= agora) continue;

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: alarme.identifier,
        content: { title: alarme.title, body: alarme.body, sound: true },
        trigger: criarTriggerData(dataAlarme),
      });
    } catch (erro) {
      console.error(`Erro ao agendar ${alarme.identifier}:`, erro?.message || erro);
    }
  }
}

async function criarNotificacaoUnica(idNotificacao, dados, opcoes = {}) {
  if (notificacoesCriadasSessao.has(idNotificacao)) return false;

  try {
    const referencia = doc(bancoDados, 'notificacoes', idNotificacao);
    const snapshot = await getDoc(referencia);

    if (!snapshot.exists()) {
      await setDoc(referencia, {
        id: idNotificacao,
        id_usuario: dados.idUsuario,
        id_evento: dados.idEvento || null,
        tipo: dados.tipo,
        titulo: dados.titulo,
        mensagem: dados.mensagem,
        lida: false,
        criado_em: serverTimestamp(),
      });
    }
    notificacoesCriadasSessao.add(idNotificacao);

    if (snapshot.exists()) return false;
  } catch (erro) {
    console.error('Erro ao gravar notificação no Firestore:', erro?.message || erro);
    return false;
  }

  if (opcoes.dispararBannerLocal) {
    await dispararNotificacaoBarraCelular(dados.titulo, dados.mensagem, idNotificacao);
  }
  if (opcoes.enviarPushRemoto) {
    await enviarPushRemotoParaUsuario(dados.idUsuario, dados.titulo, dados.mensagem);
  }
  return true;
}

export const assinarNotificacoesUsuario = (uid, onSucesso, onErro) => {
  try {
    const consulta = query(
      collection(bancoDados, 'notificacoes'),
      where('id_usuario', '==', uid)
    );

    return onSnapshot(
      consulta,
      (snapshot) => {
        const lista = snapshot.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        }));
        lista.sort((a, b) => {
          const dataA = a.criado_em?.toDate
            ? a.criado_em.toDate().getTime()
            : new Date(a.criado_em || a.data || 0).getTime();
          const dataB = b.criado_em?.toDate
            ? b.criado_em.toDate().getTime()
            : new Date(b.criado_em || b.data || 0).getTime();
          return dataB - dataA;
        });
        if (onSucesso) onSucesso(lista);
      },
      (erro) => {
        console.error('Erro ao receber notificações em tempo real:', erro);
        if (onErro) onErro(erro);
      }
    );
  } catch (erro) {
    console.error('Erro ao assinar notificações:', erro);
    if (onErro) onErro(erro);
    return () => {};
  }
};

export const alterarStatusLeituraNotificacao = async (idNotificacao, novoStatusLida) => {
  if (!idNotificacao) return;

  try {
    await updateDoc(doc(bancoDados, 'notificacoes', idNotificacao), {
      lida: novoStatusLida,
    });
  } catch (erro) {
    console.error('Erro ao alterar status da notificação:', erro);
    throw erro;
  }
};

export async function marcarNotificacaoComoLida(idNotificacao) {
  return alterarStatusLeituraNotificacao(idNotificacao, true);
}

export async function marcarTodasNotificacoesComoLidas(listaNotificacoes = []) {
  const naoLidas = listaNotificacoes.filter((item) => !item.lida);
  if (naoLidas.length === 0) return;

  await Promise.all(
    naoLidas.map((item) =>
      updateDoc(doc(bancoDados, 'notificacoes', item.id), { lida: true })
    )
  );
}

// Marca como lidas as notificações pendentes do evento e cancela os alarmes locais no celular
export async function marcarNotificacoesEventoComoLidas(idUsuario, idEvento) {
  if (!idUsuario || !idEvento) return;

  if (Platform.OS !== 'web') {
    for (const identificador of [
      `alarme_7d_${idEvento}`,
      `alarme_3d_${idEvento}`,
      `alarme_hoje_${idEvento}`,
    ]) {
      try {
        await Notifications.cancelScheduledNotificationAsync(identificador);
      } catch (erro) {
        console.error(`Erro ao cancelar ${identificador}:`, erro?.message || erro);
      }
    }
  }

  try {
    const consulta = query(
      collection(bancoDados, 'notificacoes'),
      where('id_usuario', '==', idUsuario)
    );
    const snapshot = await getDocs(consulta);
    const paraAtualizar = snapshot.docs.filter((documento) => {
      const dados = documento.data();
      return !dados.lida && dados.id_evento === idEvento;
    });

    await Promise.all(
      paraAtualizar.map((documento) =>
        updateDoc(doc(bancoDados, 'notificacoes', documento.id), { lida: true })
      )
    );
  } catch (erro) {
    console.error('Erro ao limpar notificações do evento:', erro?.message || erro);
  }
}

export async function notificarNovoEventoParaTecnico({
  idUsuario,
  idEvento,
  nomeEvento,
  dataEvento,
  funcao,
}) {
  if (!idUsuario || !idEvento) return;

  const dataFormatada = formatarDataNotificacao(dataEvento);
  const idNotificacao = `novo_evento_${idEvento}_${idUsuario}`;
  await criarNotificacaoUnica(
    idNotificacao,
    {
      idUsuario,
      idEvento,
      tipo: 'novo_evento',
      titulo: 'Novo evento lançado para você!',
      mensagem: `Você foi escalado como ${funcao || 'profissional'} no evento "${nomeEvento || 'Evento'}" (${dataFormatada}).`,
    },
    { enviarPushRemoto: true }
  );
  await verificarLembretesProximidadeEvento({
    idUsuario,
    idEvento,
    nomeEvento,
    dataEvento: dataFormatada,
    enviarPushRemoto: true,
  });
}

export async function notificarConviteReenviadoParaTecnico({
  idUsuario,
  idEvento,
  nomeEvento,
  dataEvento,
  funcao,
}) {
  if (!idUsuario || !idEvento) return;

  const dataFormatada = formatarDataNotificacao(dataEvento);
  const idNotificacao = `convite_reenviado_${idEvento}_${idUsuario}_${Date.now()}`;
  await criarNotificacaoUnica(
    idNotificacao,
    {
      idUsuario,
      idEvento,
      tipo: 'novo_evento',
      titulo: 'Convite reenviado',
      mensagem: `O organizador reenviou o convite para você atuar como ${funcao || 'profissional'} no evento "${nomeEvento || 'Evento'}" (${dataFormatada}).`,
    },
    { enviarPushRemoto: true }
  );
}

export async function notificarEventoCancelado({
  idUsuario,
  idDestinatario,
  idEvento,
  nomeEvento,
  nomeTecnico,
  dataEvento,
}) {
  const alvoUid = idDestinatario || idUsuario;
  if (!alvoUid || !idEvento) return;

  if (Platform.OS !== 'web') {
    for (const identificador of [
      `alarme_7d_${idEvento}`,
      `alarme_3d_${idEvento}`,
      `alarme_hoje_${idEvento}`,
    ]) {
      try {
        await Notifications.cancelScheduledNotificationAsync(identificador);
      } catch (erro) {
        console.error(`Erro ao cancelar ${identificador}:`, erro?.message || erro);
      }
    }
  }

  const dataFormatada = formatarDataNotificacao(dataEvento);
  const idNotificacao = `cancelado_${idEvento}_${alvoUid}_${Date.now()}`;
  await criarNotificacaoUnica(
    idNotificacao,
    {
      idUsuario: alvoUid,
      idEvento,
      tipo: 'evento_cancelado',
      titulo: 'Participação em evento cancelada',
      mensagem: nomeTecnico
        ? `O técnico ${nomeTecnico} cancelou a participação no evento "${nomeEvento || 'Evento'}" (${dataFormatada}).`
        : `Você cancelou sua participação no evento "${nomeEvento || 'Evento'}" (${dataFormatada}).`,
    },
    { dispararBannerLocal: true, enviarPushRemoto: Boolean(idDestinatario) }
  );
}

export async function verificarLembretesProximidadeEvento({
  idUsuario,
  idEvento,
  nomeEvento,
  dataEvento,
  statusConfirmacao,
  enviarPushRemoto = false,
}) {
  if (!idUsuario || !idEvento || !dataEvento) return;
  const statusLimpo = String(statusConfirmacao || '').toLowerCase();
  // Não gera lembretes para eventos já recusados ou cancelados (em PT ou EN)
  if (
    statusLimpo.includes('recusad') ||
    statusLimpo.includes('cancelad') ||
    statusLimpo.includes('declined') ||
    statusLimpo.includes('cancelled')
  ) {
    return;
  }

  const diasRestantes = calcularDiasAteEvento(dataEvento);
  if (diasRestantes === null || diasRestantes < 0) return;

  const dataFormatada = formatarDataNotificacao(dataEvento);
  if (!enviarPushRemoto) {
    await agendarAlarmesLocaisEvento({ idEvento, nomeEvento, dataEvento: dataFormatada });
  }

  if (diasRestantes <= 7 && diasRestantes > 3) {
    await criarNotificacaoUnica(
      `lembrete_7d_${idEvento}_${idUsuario}`,
      {
        idUsuario,
        idEvento,
        tipo: 'lembrete_7_dias',
        titulo: 'Evento chegando (7 dias)!',
        mensagem: `Faltam ${diasRestantes} dias para o evento "${nomeEvento}" em ${dataFormatada}. Prepare seus equipamentos!`,
      },
      { dispararBannerLocal: !enviarPushRemoto, enviarPushRemoto }
    );
  }

  if (diasRestantes <= 3 && diasRestantes > 0) {
    const titulo = diasRestantes === 3
      ? 'Evento em 3 dias!'
      : `Evento muito próximo (${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'})!`;
    const verboFalta = diasRestantes === 1 ? 'Falta' : 'Faltam';
    await criarNotificacaoUnica(
      `lembrete_3d_${idEvento}_${idUsuario}`,
      {
        idUsuario,
        idEvento,
        tipo: 'lembrete_3_dias',
        titulo,
        mensagem: `${verboFalta} ${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'} para o evento "${nomeEvento}" (${dataFormatada}). Confira o horário e local!`,
      },
      { dispararBannerLocal: !enviarPushRemoto, enviarPushRemoto }
    );
  }

  if (diasRestantes === 0) {
    await criarNotificacaoUnica(
      `lembrete_hoje_${idEvento}_${idUsuario}`,
      {
        idUsuario,
        idEvento,
        tipo: 'lembrete_dia_evento',
        titulo: 'É hoje! Dia do evento!',
        mensagem: `É HOJE! O evento "${nomeEvento}" acontece hoje (${dataFormatada}). Confira o horário e local!`,
      },
      { dispararBannerLocal: !enviarPushRemoto, enviarPushRemoto }
    );
  }
}

export async function processarLembretesListaEventos(idUsuario, listaEventos = []) {
  if (!idUsuario || !Array.isArray(listaEventos)) return;

  for (const evento of listaEventos) {
    await verificarLembretesProximidadeEvento({
      idUsuario,
      idEvento: evento.idEvento || evento.id,
      nomeEvento: evento.nome || evento.titulo || evento.nomeEvento || 'Evento',
      dataEvento: evento.dataInicio || evento.data || evento.dataEvento,
      statusConfirmacao: evento.statusConfirmacao || evento.status,
    });
  }
}
