import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Button } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { repositorioEventos } from '../../servicos/repositorioEventos';

export default function TelaListaEventos({ navigation, onLogout }) {
  const [eventos, setEventos] = useState([]);

  // useFocusEffect recarrega os eventos sempre que a tela entra em foco (ex: ao voltar da criação)
  useFocusEffect(
    useCallback(() => {
      carregarEventos();
    }, [])
  );

  const carregarEventos = async () => {
    const lista = await repositorioEventos.listarEventos();
    setEventos(lista);
  };

  return (
    <View style={estilos.conteiner}>
      <View style={estilos.cabecalho}>
        <Text style={estilos.tituloTopo}>Meus Eventos</Text>
        <Button 
          title="+ Adicionar Evento" 
          onPress={() => navigation.navigate('CriarEvento')} 
          color="#fbc02d"
        />
      </View>

      <FlatList
        data={eventos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={estilos.cardEvento}
            onPress={() => navigation.navigate('DetalheEvento', { idEvento: item.id })}
          >
            <Text style={estilos.tituloEvento}>{item.titulo}</Text>
            <Text style={estilos.subtituloEvento}>📍 {item.local || 'Local não definido'}</Text>
            <Text style={estilos.dataEvento}>📅 {item.dataInicio || 'Data não definida'}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={estilos.vazio}>Nenhum evento cadastrado ainda.</Text>
        }
      />

      <View style={estilos.botaoSair}>
        <Button title="Sair da Conta" onPress={onLogout} color="#d9534f" />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  conteiner: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  tituloTopo: { fontSize: 22, fontWeight: 'bold', color: '#1e1e1e' },
  cardEvento: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  tituloEvento: { fontSize: 18, fontWeight: 'bold', color: '#1e1e1e' },
  subtituloEvento: { fontSize: 14, color: '#666', marginTop: 4 },
  dataEvento: { fontSize: 12, color: '#888', marginTop: 2 },
  vazio: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 16 },
  botaoSair: { marginTop: 10 }
});