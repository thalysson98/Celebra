import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
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
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// 1. Pede permissão e salva o Push Token
export async function inicializarNotificacoesDispositivo(idUsuario) {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Avisos de Eventos',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const { status: statusAtual } = await Notifications.getPermissionsAsync();
    let statusFinal = statusAtual;

    if (statusAtual !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      statusFinal = status;
    }

    if (statusFinal !== 'granted') return null;

    if (Device.isDevice) {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const pushToken = tokenData?.data;

      if (pushToken && idUsuario) {
        await updateDoc(doc(bancoDados, 'usuarios', idUsuario), {
          pushToken,
        });
      }
      return pushToken;
    }
  } catch (erro) {
    console.log('Aviso ao configurar push token:', erro?.message);
  }
  return null;
}

// 2. Envia Push Remoto via API do Expo
async function enviarPushRemotoParaUsuario(idUsuarioDestino, titulo, mensagem) {
  try {
    const userSnap = await getDoc(doc(bancoDados, 'usuarios', idUsuarioDestino));
    const pushToken = userSnap.data()?.pushToken;

    if (!pushToken) return;

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to: pushToken, sound: 'default', title: titulo, body: mensagem }),
    });
  } catch (e) {
    console.log('Erro ao enviar push remoto:', e?.message);
  }
}

// 3. Dispara notificação imediata
export async function dispararNotificacaoBarraCelular(titulo, mensagem) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title: titulo, body: mensagem, sound: true },
      trigger: null, 
    });
  } catch (e) {
    console.log('Erro na notificação local:', e?.message);
  }
}

// 4. Agenda alarmes locais para 7 e 3 dias antes
export async function agendarAlarmesLocaisEvento({ idEvento, nomeEvento, dataEvento }) {
  const dataAlvo = converterParaDataLocal(dataEvento);
  if (!dataAlvo) return;

  const agora = new Date();

  // 7 dias antes às 09:00
  const data7DiasAntes = new Date(dataAlvo);
  data7DiasAntes.setDate(data7DiasAntes.getDate() - 7);
  data7DiasAntes.setHours(9, 0, 0, 0);

  if (data7DiasAntes > agora) {
    await Notifications.scheduleNotificationAsync({
      identifier: `alarme_7d_${idEvento}`,
      content: { title: 'Evento chegando (7 dias)!', body: `Faltam 7 dias para o evento "${nomeEvento}" (${dataEvento}).`, sound: true },
      trigger: data7DiasAntes,
    });
  }

  // 3 dias antes às 09:00
  const data3DiasAntes = new Date(dataAlvo);
  data3DiasAntes.setDate(data3DiasAntes.getDate() - 3);
  data3DiasAntes.setHours(9, 0, 0, 0);

  if (data3DiasAntes > agora) {
    await Notifications.scheduleNotificationAsync({
      identifier: `alarme_3d_${idEvento}`,
      content: { title: 'Atenção: Evento em 3 dias!', body: `Faltam apenas 3 dias para o evento "${nomeEvento}" (${dataEvento}). Prepare-se!`, sound: true },
      trigger: data3DiasAntes,
    });
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
    await dispararNotificacaoBarraCelular(dados.titulo, dados.mensagem);
  }
  if (opcoes.enviarPushRemoto) {
    await enviarPushRemotoParaUsuario(dados.idUsuario, dados.titulo, dados.mensagem);
  }
  return true;
}

// 7. Gatilho de Novo Evento
export async function notificarNovoEventoParaTecnico({ idUsuario, idEvento, nomeEvento, dataEvento, funcao }) {
  if (!idUsuario || !idEvento) return;
  const idNotificacao = `novo_evento_${idEvento}_${idUsuario}`;
  await criarNotificacaoUnica(
    idNotificacao,
    { idUsuario, idEvento, tipo: 'novo_evento', titulo: 'Novo evento lançado para você!', mensagem: `Você foi escalado como ${funcao || 'profissional'} no evento "${nomeEvento || 'Evento'}" (${dataEvento || ''}).` },
    { enviarPushRemoto: true }
  );
  await verificarLembretesProximidadeEvento({ idUsuario, idEvento, nomeEvento, dataEvento, enviarPushRemoto: true });
}

// 8. Gatilho de Cancelamento
export async function notificarEventoCancelado({ idUsuario, idDestinatario, idEvento, nomeEvento, nomeTecnico, dataEvento }) {
  const alvoUid = idDestinatario || idUsuario;
  if (!alvoUid || !idEvento) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(`alarme_7d_${idEvento}`);
    await Notifications.cancelScheduledNotificationAsync(`alarme_3d_${idEvento}`);
  } catch (e) {}

  const idNotificacao = `cancelado_${idEvento}_${alvoUid}_${Date.now()}`;
  await criarNotificacaoUnica(
    idNotificacao,
    { idUsuario: alvoUid, idEvento, tipo: 'evento_cancelado', titulo: 'Participação em evento cancelada', mensagem: nomeTecnico ? `O técnico ${nomeTecnico} cancelou a participação no evento "${nomeEvento || 'Evento'}" (${dataEvento || ''}).` : `Você cancelou sua participação no evento "${nomeEvento || 'Evento'}" (${dataEvento || ''}).` },
    { dispararBannerLocal: true, enviarPushRemoto: Boolean(idDestinatario) }
  );
}

// 9. Gatilho de 7 e 3 dias
export async function verificarLembretesProximidadeEvento({ idUsuario, idEvento, nomeEvento, dataEvento, statusConfirmacao, enviarPushRemoto = false }) {
  if (!idUsuario || !idEvento || !dataEvento) return;
  const statusLimpo = String(statusConfirmacao || '').toLowerCase();
  if (statusLimpo.includes('recusad') || statusLimpo.includes('cancelad')) return;

  const diasRestantes = calcularDiasAteEvento(dataEvento);
  if (diasRestantes === null || diasRestantes < 0) return;

  if (!enviarPushRemoto) {
    await agendarAlarmesLocaisEvento({ idEvento, nomeEvento, dataEvento });
  }

  if (diasRestantes <= 7 && diasRestantes > 3) {
    const idNotif7Dias = `lembrete_7d_${idEvento}_${idUsuario}`;
    await criarNotificacaoUnica(
      idNotif7Dias,
      { idUsuario, idEvento, tipo: 'lembrete_7_dias', titulo: 'Evento chegando (7 dias)!', mensagem: `Faltam ${diasRestantes} dias para o evento "${nomeEvento}" em ${dataEvento}. Prepare seus equipamentos!` },
      { dispararBannerLocal: !enviarPushRemoto, enviarPushRemoto }
    );
  }

  if (diasRestantes <= 3 && diasRestantes >= 0) {
    const idNotif3Dias = `lembrete_3d_${idEvento}_${idUsuario}`;
    const textoPrazo = diasRestantes === 0 ? 'É HOJE!' : `Faltam ${diasRestantes} dia(s)`;
    await criarNotificacaoUnica(
      idNotif3Dias,
      { idUsuario, idEvento, tipo: 'lembrete_3_dias', titulo: 'Atenção: Evento muito próximo (3 dias)!', mensagem: `${textoPrazo} para o evento "${nomeEvento}" (${dataEvento}). Confira o horário e local!` },
      { dispararBannerLocal: !enviarPushRemoto, enviarPushRemoto }
    );
  }
}

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