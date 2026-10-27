import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { buscarEventos } from '../servicos/repositorioEventos';

export default function TelaListaEventos({ navigation }) {
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    const desativarInscricao = navigation.addListener('focus', () => {
      carregarEventos();
    });
    return desativarInscricao;
  }, [navigation]);

  const carregarEventos = async () => {
    const dados = await buscarEventos();
    setEventos(dados);
  };

  return (
    <View style={estilos.conteiner}>
      <Button 
        title="Novo Evento" 
        onPress={() => navigation.navigate('CriarEvento')} 
      />

      <FlatList
        data={eventos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={estilos.cartao}
            onPress={() => navigation.navigate('DetalheEvento', { idEvento: item.id })}
          >
            <Text style={estilos.titulo}>{item.titulo}</Text>
            <Text>{item.local} - {item.data}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  conteiner: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  cartao: { padding: 15, backgroundColor: '#fff', marginBottom: 10, borderRadius: 8 },
  titulo: { fontSize: 18, fontWeight: 'bold' }
});