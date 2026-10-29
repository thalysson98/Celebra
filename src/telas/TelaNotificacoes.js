import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-paper';
import Toast from 'react-native-toast-message';

export default function TelaNotificacoes({ navigation }) {
  const [abaAtiva, setAbaAtiva] = useState('NaoLidas');

  const [notificacoes, setNotificacoes] = useState([
    { id: '1', titulo: 'Evento chegando!', mensagem: 'O evento Casamento Ana & Pedro acontece em 2 dias.', data: 'Hoje, 10:30', lida: false, idEvento: '1' },
    { id: '2', titulo: 'Pagamento recebido', mensagem: 'Sinal de R$ 2.000,00 foi pago por Ana Costa.', data: 'Ontem, 16:45', lida: false, idEvento: '1' },
    { id: '3', titulo: 'Equipe alterada', mensagem: 'Ronald Cipriani foi adicionado como Cinegrafista.', data: '12 out, 14:00', lida: true, idEvento: '1' }
  ]);

  const marcarTodasLidas = () => {
    const atualizadas = [];
    for (let i = 0; i < notificacoes.length; i++) {
      const item = { ...notificacoes[i], lida: true };
      atualizadas.push(item);
    }
    setNotificacoes(atualizadas);
    Toast.show({ type: 'success', text1: 'Notificações', text2: 'Todas marcadas como lidas!' });
  };

  const clicarNotificacao = (notif) => {
    // Marcar item específico como lido
    const listaNova = [];
    for (let i = 0; i < notificacoes.length; i++) {
      if (notificacoes[i].id === notif.id) {
        listaNova.push({ ...notificacoes[i], lida: true });
      } else {
        listaNova.push(notificacoes[i]);
      }
    }
    setNotificacoes(listaNova);

    if (notif.idEvento != null) {
      navigation.navigate('DetalheEvento', { idEvento: notif.idEvento });
    }
  };

  const listaFiltrada = [];
  for (let i = 0; i < notificacoes.length; i++) {
    if (abaAtiva === 'NaoLidas' && notificacoes[i].lida === false) {
      listaFiltrada.push(notificacoes[i]);
    } else if (abaAtiva === 'Lidas' && notificacoes[i].lida === true) {
      listaFiltrada.push(notificacoes[i]);
    }
  }

  return (
    <View style={estilos.containerGeral}>
      {/* TOPO */}
      <View style={estilos.headerFigma}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon source="arrow-left" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={estilos.tituloHeader}>Notificações</Text>
        <TouchableOpacity onPress={marcarTodasLidas}>
          <Text style={estilos.textoMarcarLidas}>Marcar lidas</Text>
        </TouchableOpacity>
      </View>

      {/* ABAS */}
      <View style={estilos.linhaAbas}>
        <TouchableOpacity 
          style={[estilos.abaPill, abaAtiva === 'NaoLidas' && estilos.abaPillAtiva]} 
          onPress={() => setAbaAtiva('NaoLidas')}
        >
          <Text style={[estilos.textoAba, abaAtiva === 'NaoLidas' && estilos.textoAbaAtiva]}>Não Lidas</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[estilos.abaPill, abaAtiva === 'Lidas' && estilos.abaPillAtiva]} 
          onPress={() => setAbaAtiva('Lidas')}
        >
          <Text style={[estilos.textoAba, abaAtiva === 'Lidas' && estilos.textoAbaAtiva]}>Lidas</Text>
        </TouchableOpacity>
      </View>

      {/* LISTA DE NOTIFICAÇÕES */}
      <FlatList
        data={listaFiltrada}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 18 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={estilos.cardNotificacao} onPress={() => clicarNotificacao(item)}>
            <View style={estilos.iconeNotif}>
              <Icon source="bell-ring" size={20} color="#0B2545" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={estilos.tituloNotif}>{item.titulo}</Text>
              <Text style={estilos.msgNotif}>{item.mensagem}</Text>
              <Text style={estilos.dataNotif}>{item.data}</Text>
            </View>
            <Icon source="chevron-right" size={20} color="#CCC" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={estilos.vazio}>Nenhuma notificação nesta aba.</Text>
        }
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  containerGeral: { flex: 1, backgroundColor: '#F4F6F8' },
  headerFigma: { backgroundColor: '#0B2545', paddingTop: 45, paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tituloHeader: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  textoMarcarLidas: { color: '#FFC107', fontSize: 13, fontWeight: 'bold' },
  linhaAbas: { flexDirection: 'row', padding: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  abaPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E0E0E0', marginRight: 10 },
  abaPillAtiva: { backgroundColor: '#0B2545' },
  textoAba: { color: '#555', fontWeight: 'bold', fontSize: 13 },
  textoAbaAtiva: { color: '#FFF' },
  cardNotificacao: { backgroundColor: '#FFF', borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  iconeNotif: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF3CD', justifyContent: 'center', alignItems: 'center' },
  tituloNotif: { fontSize: 15, fontWeight: 'bold', color: '#0B2545' },
  msgNotif: { fontSize: 13, color: '#555', marginTop: 2 },
  dataNotif: { fontSize: 11, color: '#999', marginTop: 4 },
  vazio: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 14 }
});