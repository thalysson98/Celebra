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

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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

// ATENÇÃO: Verifique se o caminho do seu banco de dados Firebase está correto no topo do arquivo
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { bancoDados } from '../configuracao/configuracaoFirebase'; // Ajuste este caminho conforme o seu projeto (ex: '../config/firebase')

// 1. Função para escutar as notificações do usuário no Firestore em tempo real
export const assinarNotificacoesUsuario = (uid, onSucesso, onErro) => {
  try {
    const q = query(
      collection(bancoDados, 'notificacoes'),
      where('userId', '==', uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (onSucesso) onSucesso(lista);
    }, (erro) => {
      console.error("Erro no onSnapshot:", erro);
      if (onErro) onErro(erro);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error("Erro ao assinar notificações:", error);
    if (onErro) onErro(error);
    return () => {}; // Retorna uma função vazia para evitar quebra no useEffect
  }
};

// 2. Função para processar e agendar lembretes da lista de eventos
export const processarLembretesListaEventos = async (uid, listaEventos) => {
  // Aqui ficará a sua lógica de verificar datas e agendar notificações futuras.
  // Por enquanto, apenas evitamos o erro no aplicativo.
  console.log(`Processando lembretes para o usuário ${uid}. Total de eventos: ${listaEventos.length}`);
};

// 3. Função para disparar uma notificação imediata na tela do celular (usando a correção do trigger)
export const dispararNotificacaoBarraCelular = async (titulo, corpo) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body: corpo,
    },
    trigger: null, // O trigger "null" dispara a notificação imediatamente (solução do seu primeiro erro)
  });
};