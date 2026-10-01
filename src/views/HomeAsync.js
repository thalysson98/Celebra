import { View, Text, StyleSheet, FlatList, Button } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Card } from 'react-native-paper';
import OpenDB from '../database/db';


export default function Home({ navigation }) {
  const [produtos, setProdutos] = useState([]);

  const CarregarProduto = async () => {
    const db = await OpenDB();
    const rows = await db.getAllAsync('SELECT * FROM produtos');
    setProdutos(rows);
  };

  const DeletarProduto = async (id) => {
    const db = await OpenDB();
    await db.runAsync('DELETE FROM produtos WHERE id = ?', [id]);
    CarregarProduto();
  };

  // useFocusEffect recarrega os produtos sempre que o usuário entra na aba Home
  useFocusEffect(
    useCallback(() => {
      CarregarProduto();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de Produtos</Text>
      <FlatList
        data={produtos}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum produto cadastrado ainda.</Text>
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>R$ {parseFloat(item.valor).toFixed(2)}</Text>
              <View style={styles.deleteButton}>
                <Button
                  title="Deletar produto"
                  color="#d32f2f"
                  onPress={() => DeletarProduto(item.id)}
                />
              </View>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    fontWeight: 'bold',
    marginVertical: 15,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#888',
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    color: '#2e7d32',
    marginBottom: 10,
  },
  deleteButton: {
    marginTop: 5,
  },
});