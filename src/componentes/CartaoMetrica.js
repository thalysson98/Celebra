import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CORES, FONTES } from '../tema/cores';

/**
 * Componente de Métrica do Dashboard inspirado nas aulas de React Native Paper
 */
export default function CartaoMetrica({ valor, rotulo, icone, corIcone = CORES.textNavy, estilo }) {
  return (
    <Card style={[estilos.card, estilo]}>
      <Card.Content style={estilos.conteudo}>
        <View style={estilos.topo}>
          <View style={estilos.circuloIcone}>
            <MaterialCommunityIcons name={icone} size={18} color={corIcone} />
          </View>
        </View>
        <Text style={estilos.valor}>{valor}</Text>
        <Text style={estilos.rotulo}>{rotulo}</Text>
      </Card.Content>
    </Card>
  );
}

const estilos = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: CORES.cardLightBlue,
    borderRadius: 18,
    elevation: 0,
  },
  conteudo: {
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  topo: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  circuloIcone: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valor: {
    fontFamily: FONTES.body,
    fontSize: 28,
    fontWeight: '800',
    color: CORES.textNavy,
    lineHeight: 32,
  },
  rotulo: {
    fontFamily: FONTES.body,
    fontSize: 12,
    fontWeight: '500',
    color: CORES.textMuted,
    marginTop: 2,
  },
});
