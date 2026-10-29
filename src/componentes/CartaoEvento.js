import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { CORES, FONTES } from '../tema/cores';

/**
 * Componente de Card de Evento inspirado nas aulas de React Native Paper
 */
export default function CartaoEvento({ evento, aoPressionar }) {
  if (!evento) return null;

  return (
    <Card style={estilos.card} onPress={aoPressionar}>
      {evento.imagemUrl ? (
        <Card.Cover source={{ uri: evento.imagemUrl }} style={estilos.imagemCapa} />
      ) : null}
      <Card.Content style={estilos.conteudo}>
        <View style={estilos.linhaTopo}>
          <Text style={estilos.tipoBadge}>{evento.tipoEvento || 'Evento'}</Text>
          <Text style={estilos.dataTexto}>
            {evento.dataInicio || 'Data a definir'} {evento.horaInicio ? `às ${evento.horaInicio}` : ''}
          </Text>
        </View>

        <Text style={estilos.titulo}>{evento.titulo}</Text>

        {evento.cliente?.nome ? (
          <View style={estilos.linhaInfo}>
            <Feather name="user" size={13} color={CORES.textMuted} />
            <Text style={estilos.textoInfo}>{evento.cliente.nome}</Text>
          </View>
        ) : null}

        {evento.locais && evento.locais[0]?.nomeDoLocal ? (
          <View style={estilos.linhaInfo}>
            <MaterialCommunityIcons name="map-marker-outline" size={14} color={CORES.textMuted} />
            <Text style={estilos.textoInfo}>{evento.locais[0].nomeDoLocal}</Text>
          </View>
        ) : null}

        <View style={estilos.linhaStatus}>
          <View style={[
            estilos.statusBadge,
            evento.statusEquipa?.includes('Completa') ? estilos.statusBadgeVerde : estilos.statusBadgeAmarelo
          ]}>
            <Text style={[
              estilos.statusTexto,
              evento.statusEquipa?.includes('Completa') ? estilos.statusTextoVerde : estilos.statusTextoAmarelo
            ]}>
              {evento.statusEquipa || 'Pendente'}
            </Text>
          </View>

          <TouchableOpacity style={estilos.botaoVerDetalhes} onPress={aoPressionar}>
            <Text style={estilos.botaoVerDetalhesTexto}>Ver detalhes</Text>
            <Feather name="arrow-right" size={13} color={CORES.textNavy} />
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );
}

const estilos = StyleSheet.create({
  card: {
    backgroundColor: CORES.cardWhite,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  imagemCapa: {
    height: 140,
  },
  conteudo: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  linhaTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tipoBadge: {
    fontFamily: FONTES.body,
    fontSize: 11,
    fontWeight: '700',
    color: CORES.buttonGold,
    textTransform: 'uppercase',
  },
  dataTexto: {
    fontFamily: FONTES.body,
    fontSize: 12,
    color: CORES.textMuted,
  },
  titulo: {
    fontFamily: FONTES.body,
    fontSize: 17,
    fontWeight: '700',
    color: CORES.textNavy,
    marginBottom: 6,
  },
  linhaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 2,
  },
  textoInfo: {
    fontFamily: FONTES.body,
    fontSize: 13,
    color: CORES.textMuted,
  },
  linhaStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: CORES.cardDivider,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeVerde: {
    backgroundColor: '#E6F8F0',
  },
  statusBadgeAmarelo: {
    backgroundColor: '#FFF7E6',
  },
  statusTexto: {
    fontFamily: FONTES.bold,
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextoVerde: {
    color: '#059669',
  },
  statusTextoAmarelo: {
    color: '#D97706',
  },
  botaoVerDetalhes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  botaoVerDetalhesTexto: {
    fontFamily: FONTES.body,
    fontSize: 12,
    fontWeight: '700',
    color: CORES.textNavy,
  },
});
