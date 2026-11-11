// Tela de teste: cartões em uma coluna no celular e em duas colunas na web.
import { ScrollView, View, StyleSheet, Text } from 'react-native';
import CartaoPadrao from '../../componentes/CartaoPadrao';
import { useResponsivo } from '../../tema/responsivo';

// Dados de exemplo. No app real, virão do Firestore.
const eventos = [
  { id: '1', titulo: 'Casamento Ana', descricao: 'Sábado, 14h', botao: 'Ver detalhes' },
  { id: '2', titulo: 'Formatura Lucas', descricao: 'Domingo, 19h', botao: 'Ver detalhes' },
  { id: '3', titulo: 'Aniversário 15 anos', descricao: 'Sexta, 21h', botao: 'Ver detalhes' },
  { id: '4', titulo: 'Evento corporativo', descricao: 'Segunda, 9h', botao: null }, // sem botão
];

export default function TelaExemploCartoes() {
  const { isMobile } = useResponsivo();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.grade}>
        {eventos.map((evento) => (
          // No celular ocupa a largura toda; na web, 48% (duas colunas)
          <View key={evento.id} style={{ width: isMobile ? '100%' : '48%' }}>
            <CartaoPadrao
              title={evento.titulo}
              buttonLabel={evento.botao}
              onPress={() => console.log('Clicou em', evento.titulo)}
            >
              <Text>{evento.descricao}</Text>
            </CartaoPadrao>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});