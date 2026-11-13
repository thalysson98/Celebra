// ============================================================================
// src/servicos/servicoNotificacoes.js
// ATENÇÃO: Este código deve ficar APENAS em src/servicos/servicoNotificacoes.js
// ============================================================================
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { bancoDados } from '../configuracao/configuracaoFirebase';

// 1. Inicializa permissões e canal de notificações do celular
export const inicializarNotificacoesDispositivo = async (uid) => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permissão para notificações não concedida!');
    return false;
  }

  return true;
};

// 2. Escuta em tempo real as notificações do usuário pelo campo 'id_usuario'
export const assinarNotificacoesUsuario = (uid, onSucesso, onErro) => {
  try {
    const consulta = query(
      collection(bancoDados, 'notificacoes'),
      where('id_usuario', '==', uid)
    );

    const cancelarAssinatura = onSnapshot(
      consulta,
      (snapshot) => {
        const lista = snapshot.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        }));

        // Ordena da mais recente para a mais antiga pelo campo 'data'
        lista.sort((a, b) => {
          const dataA = a.data?.toDate ? a.data.toDate().getTime() : new Date(a.data || 0).getTime();
          const dataB = b.data?.toDate ? b.data.toDate().getTime() : new Date(b.data || 0).getTime();
          return dataB - dataA;
        });

        if (onSucesso) onSucesso(lista);
      },
      (erro) => {
        console.error('Erro no onSnapshot:', erro);
        if (onErro) onErro(erro);
      }
    );

    return cancelarAssinatura;
  } catch (error) {
    console.error('Erro ao assinar notificações:', error);
    if (onErro) onErro(error);
    return () => {};
  }
};

// 3. Alterna status entre Lida (true) e Não Lida (false)
export const alterarStatusLeituraNotificacao = async (idNotificacao, novoStatusLida) => {
  if (!idNotificacao) return;

  try {
    const referenciaNotificacao = doc(bancoDados, 'notificacoes', idNotificacao);
    await updateDoc(referenciaNotificacao, {
      lida: novoStatusLida,
    });
  } catch (erro) {
    console.error('Erro ao alterar status da notificação:', erro);
    throw erro;
  }
};

// 4. Atalho para marcar uma única notificação como lida ao clicar no card
export async function marcarNotificacaoComoLida(idNotificacao) {
  return alterarStatusLeituraNotificacao(idNotificacao, true);
}

// 5. Marca todas as notificações não lidas como lidas de uma vez
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

// 6. Processa lembretes de eventos
export const processarLembretesListaEventos = async (uid, listaEventos = []) => {
  console.log(
    `Processando lembretes para o usuário ${uid}. Total de eventos: ${listaEventos.length}`
  );
};

// 7. Dispara notificação imediata na barra do celular
export const dispararNotificacaoBarraCelular = async (titulo, corpo) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body: corpo,
    },
    trigger: null,
  });
};