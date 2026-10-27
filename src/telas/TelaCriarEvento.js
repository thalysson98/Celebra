import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { criarEvento } from '../servicos/repositorioEventos';

export default function TelaCriarEvento({ navigation }) {
  const [titulo, setTitulo] = useState('');
  const [local, setLocal] = useState('');
  const [data, setData] = useState('');

  const salvar = async () => {
    if (!titulo || !local) {
      Alert.alert('Atenção', 'Preencha os campos obrigatórios!');
      return;
    }

    const novoId = await criarEvento({ titulo, local, data });
    Alert.alert('Sucesso', 'Evento salvo em memória!');
    
    navigation.navigate('DetalheEvento', { idEvento: novoId });
  };

  return (
    <View style={estilos.conteiner}>
      <Text style={estilos.rotulo}>Título do Evento:</Text>
      <TextInput style={estilos.campoEntrada} value={titulo} onChangeText={setTitulo} placeholder="Ex: Casamento" />

      <Text style={estilos.rotulo}>Local:</Text>
      <TextInput style={estilos.campoEntrada} value={local} onChangeText={setLocal} placeholder="Ex: Espaço Celebra" />

      <Text style={estilos.rotulo}>Data:</Text>
      <TextInput style={estilos.campoEntrada} value={data} onChangeText={setData} placeholder="Ex: 2026-12-10" />

      <Button title="Salvar Evento" onPress={salvar} />
    </View>
  );
}

const estilos = StyleSheet.create({
  conteiner: { flex: 1, padding: 20, backgroundColor: '#fff' },
  rotulo: { fontSize: 16, marginTop: 10, fontWeight: '600' },
  campoEntrada: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 6, marginTop: 5, marginBottom: 10 }
});