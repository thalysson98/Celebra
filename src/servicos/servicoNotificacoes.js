// ============================================================================
// src/servicos/servicoNotificacoes.js
// ATENÇÃO: Este código deve ficar APENAS em src/servicos/servicoNotificacoes.js
// ============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { formatarDataBrasilia } from '../compartilhado/dataHoraBrasilia';

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
const CHAVE_BANNERS_DISPARADOS_PREFIXO = '@celebra:banners_disparados:';

async function carregarBannersDisparadosUsuario(idUsuario) {
  if (!idUsuario) return new Set();
  try {
    const bruto = await AsyncStorage.getItem(`${CHAVE_BANNERS_DISPARADOS_PREFIXO}${idUsuario}`);
    if (!bruto) return new Set();
    const lista = JSON.parse(bruto);
    return new Set(Array.isArray(lista) ? lista : []);
  } catch {
    return new Set();
  }
}

async function salvarBannersDisparadosUsuario(idUsuario, conjuntoIds) {
  if (!idUsuario || !conjuntoIds) return;
  try {
    const listaLimitada = Array.from(conjuntoIds).slice(-250);
    await AsyncStorage.setItem(
      `${CHAVE_BANNERS_DISPARADOS_PREFIXO}${idUsuario}`,
      JSON.stringify(listaLimitada)
    );
  } catch {
    // Falha de armazenamento local não interrompe o fluxo de notificações
  }
}

export function gerarIdNotificacaoRecusa({ idEvento, idUsuarioTecnico, enviadoEm }) {
  let sufixoCiclo = 'padrao';
  if (enviadoEm) {
    if (typeof enviadoEm.seconds === 'number') {
      sufixoCiclo = String(enviadoEm.seconds);
    } else if (typeof enviadoEm.toMillis === 'function') {
      sufixoCiclo = String(Math.floor(enviadoEm.toMillis() / 1000));
    } else if (typeof enviadoEm === 'number' || typeof enviadoEm === 'string') {
      const data = new Date(enviadoEm);
      if (!Number.isNaN(data.getTime())) {
        sufixoCiclo = String(Math.floor(data.getTime() / 1000));
      }
    }
  }
  return `convocacao_recusada_${idEvento}_${idUsuarioTecnico}_${sufixoCiclo}`;
}

export async function processarBannersNotificacoesUsuario(
  idUsuario,
  listaNotificacoes = [],
  notificacoesAnterioresRef,
  habilitado = true
) {
  if (!idUsuario || !Array.isArray(listaNotificacoes)) return;

  const primeiraCarga = notificacoesAnterioresRef.current === null;
  const idsAnteriores = new Set(
    (notificacoesAnterioresRef.current || []).map((item) => item.id)
  );
  notificacoesAnterioresRef.current = listaNotificacoes;

  if (!habilitado || Platform.OS === 'web') return;

  const jaDisparadosPersistidos = await carregarBannersDisparadosUsuario(idUsuario);
  let alterouPersistidos = false;

  for (const notif of listaNotificacoes) {
    if (!notif?.id) continue;

    if (notif.lida) {
      if (!jaDisparadosPersistidos.has(notif.id)) {
        jaDisparadosPersistidos.add(notif.id);
        alterouPersistidos = true;
      }
      continue;
    }

    const jaDisparouAntes =
      jaDisparadosPersistidos.has(notif.id) || bannersLocaisDisparados.has(notif.id);

    if (bannersLocaisDisparados.has(notif.id) && !jaDisparadosPersistidos.has(notif.id)) {
      jaDisparadosPersistidos.add(notif.id);
      alterouPersistidos = true;
    }

    if (primeiraCarga) {
      // Na abertura da sessão, dispara na barra de notificações as recusas de convocação
      // (ou cancelamentos) não lidas que ainda não foram exibidas na barra deste aparelho
      if (
        !jaDisparouAntes &&
        (notif.tipo === 'convocacao_recusada' || notif.tipo === 'evento_cancelado')
      ) {
        const disparou = await dispararNotificacaoBarraCelular(
          notif.titulo,
          notif.mensagem,
          notif.id,
          { idEvento: notif.id_evento || notif.idEvento || null, tipo: notif.tipo }
        );
        if (disparou) {
          jaDisparadosPersistidos.add(notif.id);
          alterouPersistidos = true;
        }
      } else if (!jaDisparouAntes && notif.tipo !== 'convocacao_recusada') {
        jaDisparadosPersistidos.add(notif.id);
        alterouPersistidos = true;
      }
    } else if (!idsAnteriores.has(notif.id) && !jaDisparouAntes) {
      const disparou = await dispararNotificacaoBarraCelular(
        notif.titulo,
        notif.mensagem,
        notif.id,
        { idEvento: notif.id_evento || notif.idEvento || null, tipo: notif.tipo }
      );
      if (disparou) {
        jaDisparadosPersistidos.add(notif.id);
        alterouPersistidos = true;
      }
    }
  }

  if (alterouPersistidos) {
    await salvarBannersDisparadosUsuario(idUsuario, jaDisparadosPersistidos);
  }
}

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

export async function notificarRecusaConvocacaoParaOrganizador({
  idEmpresa,
  idUsuarioOrganizador,
  idUsuarioTecnico,
  idEvento,
  nomeEvento,
  dataEvento,
  nomeTecnico,
  funcao,
  enviadoEm,
}) {
  if (!idUsuarioTecnico || !idEvento) {
    console.error('[notificacoes][recusa] dados obrigatórios ausentes', {
      temTecnico: Boolean(idUsuarioTecnico),
      temEvento: Boolean(idEvento),
    });
    return false;
  }

  try {
    let idDestinatario = idUsuarioOrganizador || null;
    let origemDestinatario = idDestinatario ? 'convite/evento' : null;

    if (!idDestinatario && idEmpresa) {
      try {
        const empresaSnap = await getDoc(doc(bancoDados, 'empresas', idEmpresa));
        if (empresaSnap.exists()) {
          const dadosEmpresa = empresaSnap.data() || {};
          idDestinatario =
            dadosEmpresa.id_dono ||
            dadosEmpresa.id_usuario_organizador ||
            dadosEmpresa.id_organizador ||
            dadosEmpresa.id_usuario ||
            dadosEmpresa.uid_dono ||
            null;
          if (idDestinatario) origemDestinatario = 'empresas';
        }
      } catch {
        // Prossegue para os demais fallbacks
      }
    }

    if (!idDestinatario && idEmpresa) {
      try {
        const membrosSnap = await getDocs(
          query(collection(bancoDados, 'membros'), where('id_empresa', '==', idEmpresa))
        );
        const docOrganizador = membrosSnap.docs.find((documento) => {
          const dados = documento.data() || {};
          return (
            (dados.tipo_acesso && dados.tipo_acesso !== 'funcionario') ||
            dados.papel === true
          );
        });
        if (docOrganizador) {
          idDestinatario = docOrganizador.data().id_usuario || null;
          if (idDestinatario) origemDestinatario = 'membros';
        }
      } catch {
        // Prossegue para o próximo fallback
      }
    }

    if (!idDestinatario && idEmpresa) {
      try {
        const usuariosSnap = await getDocs(
          query(
            collection(bancoDados, 'usuarios'),
            where('id_empresa', '==', idEmpresa),
            where('papel', '==', true)
          )
        );
        if (!usuariosSnap.empty) {
          const docOrg = usuariosSnap.docs[0];
          idDestinatario = docOrg.data()?.id_usuario || docOrg.id;
          if (idDestinatario) origemDestinatario = 'usuarios.papel';
        }
      } catch {
        // Se as regras atuais do Firestore restringirem a consulta de usuarios pelo técnico,
        // o monitoramento em tempo real do organizador criará a notificação automaticamente.
      }
    }

    if (!idDestinatario) {
      console.log('[notificacoes][recusa] destinatário será resolvido pelo listener do organizador', {
        idEvento,
        idEmpresa: idEmpresa || null,
      });
      return false;
    }

    const dataFormatada = formatarDataNotificacao(dataEvento);
    const idNotificacao = gerarIdNotificacaoRecusa({
      idEvento,
      idUsuarioTecnico,
      enviadoEm,
    });

    const criada = await criarNotificacaoUnica(
      idNotificacao,
      {
        idUsuario: idDestinatario,
        idEvento,
        tipo: 'convocacao_recusada',
        titulo: 'Convocação recusada',
        mensagem: `${nomeTecnico || 'Um profissional'} recusou o convite${funcao ? ` para atuar como ${funcao}` : ''} no evento "${nomeEvento || 'Evento'}" (${dataFormatada}).`,
      },
      { dispararBannerLocal: false, enviarPushRemoto: true }
    );
    console.log('[notificacoes][recusa] gravação concluída', {
      idNotificacao,
      origemDestinatario,
      criadaNoFirestore: criada,
    });
    return criada;
  } catch (erro) {
    console.error('[notificacoes][recusa] erro no envio', {
      idEvento,
      codigo: erro?.code || null,
      mensagem: erro?.message || String(erro),
    });
    return false;
  }
}

export function assinarMonitoramentoRecusasOrganizador({ idEmpresa, idUsuarioOrganizador }) {
  if (!idEmpresa || !idUsuarioOrganizador) return () => {};

  const situacoesAnteriores = new Map();
  let cargaInicialConcluida = false;

  try {
    const consulta = query(
      collection(bancoDados, 'convites'),
      where('id_empresa', '==', idEmpresa)
    );

    return onSnapshot(
      consulta,
      async (snapshot) => {
        for (const docSnap of snapshot.docs) {
          const convite = docSnap.data() || {};
          const idConvite = docSnap.id;
          const situacaoAtual = String(convite.situacao || '').toLowerCase();
          const situacaoAnterior = situacoesAnteriores.get(idConvite);
          situacoesAnteriores.set(idConvite, situacaoAtual);

          // Garante que todos os convites da empresa tenham o id_usuario_organizador vinculado
          if (!convite.id_usuario_organizador) {
            updateDoc(doc(bancoDados, 'convites', idConvite), {
              id_usuario_organizador: idUsuarioOrganizador,
            }).catch(() => {});
          }

          const ehRecusado = situacaoAtual === 'recusado' || situacaoAtual === 'declined';
          if (!ehRecusado || !convite.id_evento || !convite.id_usuario) continue;

          const mudouParaRecusadoAgora =
            cargaInicialConcluida &&
            situacaoAnterior !== 'recusado' &&
            situacaoAnterior !== 'declined';

          const idNotificacao = gerarIdNotificacaoRecusa({
            idEvento: convite.id_evento,
            idUsuarioTecnico: convite.id_usuario,
            enviadoEm: convite.enviado_em,
          });

          try {
            const notifRef = doc(bancoDados, 'notificacoes', idNotificacao);
            const notifSnap = await getDoc(notifRef);
            if (notifSnap.exists()) continue;

            // Na carga inicial, verifica se a recusa é recente (últimas 48h) para não recriar histórico antigo
            if (!mudouParaRecusadoAgora) {
              const respondidoMs =
                typeof convite.respondido_em?.toDate === 'function'
                  ? convite.respondido_em.toDate().getTime()
                  : convite.respondido_em
                    ? new Date(convite.respondido_em).getTime()
                    : Date.now();
              const limiteRecenteMs = 48 * 60 * 60 * 1000;
              if (
                !Number.isNaN(respondidoMs) &&
                Date.now() - respondidoMs > limiteRecenteMs
              ) {
                continue;
              }
            }

            let nomeEvento = 'Evento';
            let dataFormatada = '';
            try {
              const eventoSnap = await getDoc(doc(bancoDados, 'eventos', convite.id_evento));
              if (eventoSnap.exists()) {
                const dadosEvento = eventoSnap.data() || {};
                nomeEvento = dadosEvento.titulo || 'Evento';
                dataFormatada = formatarDataNotificacao(dadosEvento.data_inicio);
                if (!dadosEvento.id_usuario_organizador) {
                  updateDoc(doc(bancoDados, 'eventos', convite.id_evento), {
                    id_usuario_organizador: idUsuarioOrganizador,
                  }).catch(() => {});
                }
              }
            } catch {
              // Se não puder ler os detalhes extras do evento, usa o título padrão
            }

            const nomeTecnico = convite.nome_profissional || 'Um profissional';
            const funcao = convite.nome_tipo_profissional || '';
            const sufixoData = dataFormatada ? ` (${dataFormatada})` : '';

            await criarNotificacaoUnica(
              idNotificacao,
              {
                idUsuario: idUsuarioOrganizador,
                idEvento: convite.id_evento,
                tipo: 'convocacao_recusada',
                titulo: 'Convocação recusada',
                mensagem: `${nomeTecnico} recusou o convite${funcao ? ` para atuar como ${funcao}` : ''} no evento "${nomeEvento}"${sufixoData}.`,
              },
              { dispararBannerLocal: true, enviarPushRemoto: false }
            );
          } catch (erroRecusa) {
            console.log(
              '[notificacoes][monitor-organizador] erro ao sincronizar recusa:',
              erroRecusa?.message || erroRecusa
            );
          }
        }
        cargaInicialConcluida = true;
      },
      (erro) => {
        console.log(
          '[notificacoes][monitor-organizador] erro na assinatura de convites:',
          erro?.message || erro
        );
      }
    );
  } catch {
    return () => {};
  }
}

export async function inicializarNotificacoesDispositivo(idUsuario) {
  if (Platform.OS === 'web') return null;

  try {
    if (Platform.OS === 'android') {
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
  if (Platform.OS === 'android' && isRunningInExpoGo()) return;

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
    console.log('Aviso ao enviar push remoto:', erro?.message || erro);
  }
}

export async function dispararNotificacaoBarraCelular(
  titulo,
  mensagem,
  idNotificacao = null,
  dadosExtras = {}
) {
  if (Platform.OS === 'web') return false;

  try {
    if (idNotificacao) {
      if (bannersLocaisDisparados.has(idNotificacao)) return false;
      bannersLocaisDisparados.add(idNotificacao);
    }

    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Avisos de Eventos',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
        });
      } catch {
        // Canal já configurado
      }
    }

    const { status: statusAtual } = await Notifications.getPermissionsAsync();
    let statusFinal = statusAtual;
    if (statusAtual !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      statusFinal = status;
    }

    if (statusFinal !== 'granted') {
      if (idNotificacao) bannersLocaisDisparados.delete(idNotificacao);
      return false;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo,
        body: mensagem,
        sound: true,
        data: { idNotificacao, ...dadosExtras },
        ...(Platform.OS === 'android'
          ? { priority: Notifications.AndroidNotificationPriority.MAX }
          : {}),
      },
      trigger: null,
    });
    return true;
  } catch (erro) {
    if (idNotificacao) bannersLocaisDisparados.delete(idNotificacao);
    console.error('Erro na notificação local:', erro?.message || erro);
    return false;
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
  return formatarDataBrasilia(valorData) || String(valorData);
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
    let jaExistia = false;
    try {
      const snapshot = await getDoc(referencia);
      jaExistia = snapshot.exists();
    } catch (erroLeitura) {
      if (erroLeitura?.code === 'permission-denied') {
        jaExistia = true;
      } else {
        throw erroLeitura;
      }
    }

    if (!jaExistia) {
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

    if (jaExistia) return false;
  } catch (erro) {
    console.error('Erro ao gravar notificação no Firestore:', {
      codigo: erro?.code || null,
      mensagem: erro?.message || String(erro),
    });
    return false;
  }

  if (opcoes.dispararBannerLocal) {
    const disparou = await dispararNotificacaoBarraCelular(
      dados.titulo,
      dados.mensagem,
      idNotificacao,
      { idEvento: dados.idEvento || null, tipo: dados.tipo }
    );
    if (disparou && dados.idUsuario) {
      const jaDisparados = await carregarBannersDisparadosUsuario(dados.idUsuario);
      jaDisparados.add(idNotificacao);
      await salvarBannersDisparadosUsuario(dados.idUsuario, jaDisparados);
    }
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
        const quantidadeRecusas = lista.filter(
          (item) => item.tipo === 'convocacao_recusada'
        ).length;
        if (quantidadeRecusas > 0) {
          console.log('[notificacoes][listener] recusas recebidas', {
            quantidade: quantidadeRecusas,
          });
        }
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
