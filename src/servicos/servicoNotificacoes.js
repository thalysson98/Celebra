import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
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

// Configura o telemóvel para mostrar o banner e tocar som
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const bannersLocaisDisparados = new Set();

// 1. Pede permissão e salva o Push Token
export async function inicializarNotificacoesDispositivo(idUsuario) {
  try {
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Avisos de Eventos',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
        });
      } catch (canalErr) {
        // Ignora incompatibilidade de canal no Expo Go
      }
    }

    const { status: statusAtual } = await Notifications.getPermissionsAsync();
    let statusFinal = statusAtual;

    if (statusAtual !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      statusFinal = status;
    }

    if (statusFinal !== 'granted') {
      console.log('⚠️ [Push] Permissão de notificações não concedida pelo usuário.');
      return null;
    }

    if (!Device.isDevice) {
      console.log('ℹ️ [Push] Emulador/Web detectado. Push token remoto Expo exige celular físico.');
      return null;
    }

    let pushToken = null;
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId ??
        '1a448861-4c80-4505-8160-59d3bb8bd0a7';

      console.log('🔄 [Push] Solicitando Expo Push Token com projectId:', projectId);
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      pushToken = tokenData?.data;

      if (pushToken && idUsuario) {
        console.log('✅ [Push] Push Token gerado com sucesso:', pushToken);
        await updateDoc(doc(bancoDados, 'usuarios', idUsuario), {
          pushToken,
        });
        console.log('✅ [Push] pushToken gravado com sucesso no Firestore para o usuário:', idUsuario);
      }
    } catch (pushErr) {
      console.log('ℹ️ [Push] No Expo Go Android (SDK 53+), push remoto é indisponível. O app usará notificações locais em tempo real.');
    }

    return pushToken;
  } catch (erro) {
    console.log('Aviso ao inicializar notificações:', erro?.message || erro);
  }
  return null;
}

// 2. Envia Push Remoto via API do Expo
async function enviarPushRemotoParaUsuario(idUsuarioDestino, titulo, mensagem) {
  try {
    const userSnap = await getDoc(doc(bancoDados, 'usuarios', idUsuarioDestino));
    const pushToken = userSnap.data()?.pushToken;

    if (!pushToken) {
      console.log(`ℹ️ [Push] Usuário ${idUsuarioDestino} não possui pushToken cadastrado. Notificação push não enviada.`);
      return;
    }

    console.log(`📤 [Push] Disparando notificação remota para token: ${pushToken}`);
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
    const resultado = await resposta.json();
    console.log('📥 [Push] Resposta do envio Expo:', JSON.stringify(resultado));
  } catch (e) {
    console.error('❌ [Push] Erro ao enviar push remoto:', e?.message || e);
  }
}

// 3. Dispara notificação imediata
export async function dispararNotificacaoBarraCelular(titulo, mensagem, idNotificacao = null) {
  try {
    if (idNotificacao) {
      if (bannersLocaisDisparados.has(idNotificacao)) return;
      bannersLocaisDisparados.add(idNotificacao);
    }
    await Notifications.scheduleNotificationAsync({
      content: { title: titulo, body: mensagem, sound: true },
      trigger: null, 
    });
  } catch (e) {
    console.log('Erro na notificação local:', e?.message);
  }
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

// 4. Agenda alarmes locais para 7 dias antes, 3 dias antes e no próprio dia do evento
export async function agendarAlarmesLocaisEvento({ idEvento, nomeEvento, dataEvento }) {
  const dataAlvo = converterParaDataLocal(dataEvento);
  if (!dataAlvo) return;

  const dataFormatada = formatarDataNotificacao(dataEvento);
  const agora = new Date();

  // 7 dias antes às 09:00
  const data7DiasAntes = new Date(dataAlvo);
  data7DiasAntes.setDate(data7DiasAntes.getDate() - 7);
  data7DiasAntes.setHours(9, 0, 0, 0);

  if (data7DiasAntes > agora) {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `alarme_7d_${idEvento}`,
        content: {
          title: 'Evento chegando (7 dias)!',
          body: `Faltam 7 dias para o evento "${nomeEvento}" (${dataFormatada}).`,
          sound: true,
        },
        trigger: criarTriggerData(data7DiasAntes),
      });
    } catch (e) {
      console.log('Aviso ao agendar alarme de 7 dias:', e?.message);
    }
  }

  // 3 dias antes às 09:00
  const data3DiasAntes = new Date(dataAlvo);
  data3DiasAntes.setDate(data3DiasAntes.getDate() - 3);
  data3DiasAntes.setHours(9, 0, 0, 0);

  if (data3DiasAntes > agora) {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `alarme_3d_${idEvento}`,
        content: {
          title: 'Atenção: Evento em 3 dias!',
          body: `Faltam apenas 3 dias para o evento "${nomeEvento}" (${dataFormatada}). Prepare-se!`,
          sound: true,
        },
        trigger: criarTriggerData(data3DiasAntes),
      });
    } catch (e) {
      console.log('Aviso ao agendar alarme de 3 dias:', e?.message);
    }
  }

  // No próprio dia do evento às 08:00
  const dataDiaEvento = new Date(dataAlvo);
  dataDiaEvento.setHours(8, 0, 0, 0);

  if (dataDiaEvento > agora) {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `alarme_hoje_${idEvento}`,
        content: {
          title: 'É hoje! Dia do evento!',
          body: `É HOJE! O evento "${nomeEvento}" acontece hoje (${dataFormatada}). Confira o horário e local!`,
          sound: true,
        },
        trigger: criarTriggerData(dataDiaEvento),
      });
    } catch (e) {
      console.log('Aviso ao agendar alarme do dia do evento:', e?.message);
    }
  }
}

// 5. Utilitários de Data
export function converterParaDataLocal(valorData) {
  if (!valorData) return null;
  if (typeof valorData?.toDate === 'function') {
    const d = valorData.toDate();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  if (typeof valorData === 'string') {
    const limpa = valorData.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(limpa)) {
      const [dia, mes, ano] = limpa.split('/').map(Number);
      return new Date(ano, mes - 1, dia);
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(limpa)) {
      const [ano, mes, dia] = limpa.slice(0, 10).split('-').map(Number);
      return new Date(ano, mes - 1, dia);
    }
  }
  const d = new Date(valorData);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function formatarDataNotificacao(valorData) {
  if (!valorData) return '';
  if (typeof valorData === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(valorData.trim())) {
    return valorData.trim();
  }
  const d = converterParaDataLocal(valorData);
  if (!d) return String(valorData);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

export function calcularDiasAteEvento(dataEvento) {
  const dataAlvo = converterParaDataLocal(dataEvento);
  if (!dataAlvo) return null;
  const hoje = new Date();
  const hojeMeiaNoite = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((dataAlvo.getTime() - hojeMeiaNoite.getTime()) / (1000 * 60 * 60 * 24));
}

// 6. Grava notificação no Firestore
async function criarNotificacaoUnica(idNotificacao, dados, opcoes = {}) {
  const ref = doc(bancoDados, 'notificacoes', idNotificacao);
  const snap = await getDoc(ref);

  if (snap.exists()) return false;

  await setDoc(ref, {
    id: idNotificacao,
    id_usuario: dados.idUsuario,
    id_evento: dados.idEvento || null,
    tipo: dados.tipo,
    titulo: dados.titulo,
    mensagem: dados.mensagem,
    lida: false,
    criado_em: serverTimestamp(),
  });

  if (opcoes.dispararBannerLocal) {
    await dispararNotificacaoBarraCelular(dados.titulo, dados.mensagem, idNotificacao);
  }
  if (opcoes.enviarPushRemoto) {
    await enviarPushRemotoParaUsuario(dados.idUsuario, dados.titulo, dados.mensagem);
  }
  return true;
}

// 7. Gatilho de Novo Evento
export async function notificarNovoEventoParaTecnico({ idUsuario, idEvento, nomeEvento, dataEvento, funcao }) {
  if (!idUsuario || !idEvento) return;
  const dataFormatada = formatarDataNotificacao(dataEvento);
  const idNotificacao = `novo_evento_${idEvento}_${idUsuario}`;
  await criarNotificacaoUnica(
    idNotificacao,
    { idUsuario, idEvento, tipo: 'novo_evento', titulo: 'Novo evento lançado para você!', mensagem: `Você foi escalado como ${funcao || 'profissional'} no evento "${nomeEvento || 'Evento'}" (${dataFormatada}).` },
    { enviarPushRemoto: true }
  );
  await verificarLembretesProximidadeEvento({ idUsuario, idEvento, nomeEvento, dataEvento: dataFormatada, enviarPushRemoto: true });
}

// 8. Gatilho de Cancelamento
export async function notificarEventoCancelado({ idUsuario, idDestinatario, idEvento, nomeEvento, nomeTecnico, dataEvento }) {
  const alvoUid = idDestinatario || idUsuario;
  if (!alvoUid || !idEvento) return;
  const dataFormatada = formatarDataNotificacao(dataEvento);

  try {
    await Notifications.cancelScheduledNotificationAsync(`alarme_7d_${idEvento}`);
    await Notifications.cancelScheduledNotificationAsync(`alarme_3d_${idEvento}`);
    await Notifications.cancelScheduledNotificationAsync(`alarme_hoje_${idEvento}`);
  } catch (e) {}

  const idNotificacao = `cancelado_${idEvento}_${alvoUid}_${Date.now()}`;
  await criarNotificacaoUnica(
    idNotificacao,
    { idUsuario: alvoUid, idEvento, tipo: 'evento_cancelado', titulo: 'Participação em evento cancelada', mensagem: nomeTecnico ? `O técnico ${nomeTecnico} cancelou a participação no evento "${nomeEvento || 'Evento'}" (${dataFormatada}).` : `Você cancelou sua participação no evento "${nomeEvento || 'Evento'}" (${dataFormatada}).` },
    { dispararBannerLocal: true, enviarPushRemoto: Boolean(idDestinatario) }
  );
}

// 9. Gatilho de 7 dias, 3 dias antes e no próprio dia do evento
export async function verificarLembretesProximidadeEvento({ idUsuario, idEvento, nomeEvento, dataEvento, statusConfirmacao, enviarPushRemoto = false }) {
  if (!idUsuario || !idEvento || !dataEvento) return;
  const statusLimpo = String(statusConfirmacao || '').toLowerCase();
  if (statusLimpo.includes('recusad') || statusLimpo.includes('cancelad')) return;

  const diasRestantes = calcularDiasAteEvento(dataEvento);
  if (diasRestantes === null || diasRestantes < 0) return;

  const dataFormatada = formatarDataNotificacao(dataEvento);

  if (!enviarPushRemoto) {
    await agendarAlarmesLocaisEvento({ idEvento, nomeEvento, dataEvento: dataFormatada });
  }

  // Lembrete de 7 dias antes (entre 7 e 4 dias restantes)
  if (diasRestantes <= 7 && diasRestantes > 3) {
    const idNotif7Dias = `lembrete_7d_${idEvento}_${idUsuario}`;
    await criarNotificacaoUnica(
      idNotif7Dias,
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

  // Lembrete de 3 dias antes (entre 3 e 1 dia restante)
  if (diasRestantes <= 3 && diasRestantes > 0) {
    const idNotif3Dias = `lembrete_3d_${idEvento}_${idUsuario}`;
    const titulo3Dias = diasRestantes === 3
      ? 'Atenção: Evento em 3 dias!'
      : `Atenção: Evento muito próximo (${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'})!`;
    await criarNotificacaoUnica(
      idNotif3Dias,
      {
        idUsuario,
        idEvento,
        tipo: 'lembrete_3_dias',
        titulo: titulo3Dias,
        mensagem: `Faltam ${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'} para o evento "${nomeEvento}" (${dataFormatada}). Confira o horário e local!`,
      },
      { dispararBannerLocal: !enviarPushRemoto, enviarPushRemoto }
    );
  }

  // Lembrete no próprio dia do evento (0 dias restantes)
  if (diasRestantes === 0) {
    const idNotifHoje = `lembrete_hoje_${idEvento}_${idUsuario}`;
    await criarNotificacaoUnica(
      idNotifHoje,
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
  for (const ev of listaEventos) {
    await verificarLembretesProximidadeEvento({
      idUsuario,
      idEvento: ev.idEvento || ev.id,
      nomeEvento: ev.nome || ev.titulo || ev.nomeEvento || 'Evento',
      dataEvento: ev.dataInicio || ev.data || ev.dataEvento,
      statusConfirmacao: ev.statusConfirmacao || ev.status,
    });
  }
}

// 10. Escuta notificações em tempo real para o Sininho
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

// 11. Marca como lida ao clicar
export async function marcarNotificacaoComoLida(idNotificacao) {
  if (!idNotificacao) return;
  await updateDoc(doc(bancoDados, 'notificacoes', idNotificacao), {
    lida: true,
  });
}

// 12. Marca todas as notificações não lidas do usuário como lidas no Firestore
export async function marcarTodasNotificacoesComoLidas(listaNotificacoes = []) {
  const naoLidas = listaNotificacoes.filter((item) => !item.lida);
  if (naoLidas.length === 0) return;

  await Promise.all(
    naoLidas.map((item) =>
      updateDoc(doc(bancoDados, 'notificacoes', item.id), {
        lida: true,
      })
    )
  );
}