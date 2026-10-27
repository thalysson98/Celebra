import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert } from 'react-native';
import { buscarEventoPorId, adicionarFornecedorAoEvento } from '../servicos/repositorioEventos';

export default function TelaDetalheEvento({ route }) {
  const { idEvento } = route.params;
  const [evento, setEvento] = useState(null);
  const [nomeFornecedor, setNomeFornecedor] = useState('');

  useEffect(() => {
    carregarDados();
  }, [idEvento]);

  const carregarDados = async () => {
    const dados = await buscarEventoPorId(idEvento);
    setEvento(dados);
  };

  const adicionarFornecedor = async () => {
    if (!nomeFornecedor) return;

    await adicionarFornecedorAoEvento(idEvento, { nome: nomeFornecedor, categoria: 'Geral' });
    setNomeFornecedor('');
    Alert.alert('Sucesso', 'Fornecedor adicionado!');
    carregarDados();
  };

  if (!evento) return <Text>Carregando...</Text>;

  return (
    <View style={estilos.conteiner}>
      <Text style={estilos.cabecalho}>{evento.titulo}</Text>
      <Text>{evento.local} | {evento.data}</Text>

      <View style={estilos.divisor} />

      <Text style={estilos.subCabecalho}>Adicionar Fornecedor</Text>
      <TextInput 
        style={estilos.campoEntrada} 
        value={nomeFornecedor} 
        onChangeText={setNomeFornecedor} 
        placeholder="Nome do Fornecedor" 
      />
      <Button title="Adicionar" onPress={adicionarFornecedor} />

      <Text style={[estilos.subCabecalho, { marginTop: 20 }]}>Fornecedores Cadastrados:</Text>
      <FlatList
        data={evento.fornecedores}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={estilos.item}>
            <Text style={{ fontWeight: 'bold' }}>{item.nome}</Text>
          </View>
        )}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  conteiner: { flex: 1, padding: 20, backgroundColor: '#fff' },
  cabecalho: { fontSize: 22, fontWeight: 'bold' },
  subCabecalho: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  divisor: { height: 1, backgroundColor: '#ddd', marginVertical: 15 },
  campoEntrada: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 6, marginBottom: 10 },
  item: { padding: 10, backgroundColor: '#f0f0f0', borderRadius: 6, marginBottom: 5 }
});