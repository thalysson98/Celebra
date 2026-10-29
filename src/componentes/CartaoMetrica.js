import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { COLORS, FONTES } from '../tema/cores';

/**
 * Componente de Métrica do Dashboard inspirado nas aulas de React Native Paper
 */
export default function CartaoMetrica({ valor, rotulo, mostrarIndicador = false, estilo }) {
  return (
    <Card style={[estilos.card, estilo]}>
      <Card.Content style={estilos.conteudo}>
        <View style={estilos.topo}>
          <Text style={estilos.valor}>{valor}</Text>
          {mostrarIndicador && <View style={estilos.indicador} />}
        </View>
        <Text style={estilos.rotulo}>{rotulo}</Text>
      </Card.Content>
    </Card>
  );
}

const estilos = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.cardWhite,
    borderRadius: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  conteudo: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  topo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  valor: {
    fontFamily: FONTES.bold,
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textNavy,
  },
  indicador: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.statusConfirmed,
  },
  rotulo: {
    fontFamily: FONTES.medium,
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});
