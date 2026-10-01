import { View, StyleSheet, Text, TextInput, Button } from 'react-native';
import { useState } from 'react';
import OpenDB from '../database/db';

export default function Produtos({ navigation }) {
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');

  const AdicionarProduto = async () => {
    if (!nome.trim() || !valor.trim()) {
      return;
    }

    const db = await OpenDB();
    await db.runAsync(
      'INSERT INTO produtos (name, valor) VALUES(?,?)',
      [nome, parseFloat(valor)]
    );
    setNome('');
    setValor('');
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastrar Produto</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome do produto"
        value={nome}
        onChangeText={setNome}
      />
      <TextInput
        style={styles.input}
        placeholder="Valor do produto (ex: 15.50)"
        value={valor}
        keyboardType="numeric"
        onChangeText={setValor}
      />
      <View style={styles.btnContainer}>
        <Button
          title="Adicionar produto"
          onPress={AdicionarProduto}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  btnContainer: {
    marginTop: 10,
  },
});

