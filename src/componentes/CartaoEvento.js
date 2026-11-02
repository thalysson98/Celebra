// src/componentes/CartaoEvento.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { CORES, FONTES } from '../tema/cores';

export default function CartaoEvento({ evento, aoPressionar }) {
  if (!evento) return null;

  return (
    <Card style={estilos.card} onPress={aoPressionar}>
      <Card.Content style={estilos.conteudo}>
        <View style={estilos.linhaTopo}>
          <Text style={estilos.tipoBadge}>{evento.tipoEvento || 'Evento'}</Text>
          <Text style={estilos.dataTexto}>
            {evento.dataInicio || 'Data a definir'} {evento.horaInicio ? ` • ${evento.horaInicio}` : ''}
          </Text>
        </View>

        <Text style={estilos.titulo}>{evento.titulo}</Text>

        {evento.cliente?.nome ? (
          <View style={estilos.linhaInfo}>
            <Feather name="user" size={16} color={CORES.textMuted} />
            <Text style={estilos.textoCliente}>{evento.cliente.nome}</Text>
          </View>
        ) : null}
        
        <View style={estilos.linhaStatus}>
          {evento.statusTempo !== 'concluidos' ? (
            <View style={[
              estilos.statusBadge,
              evento.statusEquipa?.includes('confirmada') || evento.statusEquipa?.includes('Completa') ? estilos.statusBadgeVerde : estilos.statusBadgeAmarelo
            ]}>
              <Text style={[
                estilos.statusTexto,
                evento.statusEquipa?.includes('confirmada') || evento.statusEquipa?.includes('Completa') ? estilos.statusTextoVerde : estilos.statusTextoAmarelo
              ]}>
                {evento.statusEquipa || 'Pendente'}
              </Text>
            </View>
          ) : (
            <View style={estilos.statusBadgeConcluido}>
               <Feather name="check-circle" size={14} color="#059669" style={{marginRight: 4}} />
               <Text style={estilos.statusTextoConcluido}>Evento Concluído</Text>
            </View>
          )}

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
  card: { backgroundColor: CORES.cardWhite, borderRadius: 20, marginBottom: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8 },
  conteudo: { paddingVertical: 14, paddingHorizontal: 16 },
  linhaTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  tipoBadge: { fontFamily: FONTES.bold, fontSize: 13, fontWeight: '700', color: '#2F80A8', textTransform: 'uppercase' },
  dataTexto: { fontFamily: FONTES.body, fontSize: 13, color: CORES.textNavy, fontWeight: 'bold' },
  titulo: { fontFamily: FONTES.body, fontSize: 17, fontWeight: '700', color: CORES.textNavy, marginBottom: 6 },
  linhaInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 2 },
  textoCliente: { fontFamily: FONTES.bold, fontSize: 15, color: CORES.textNavy, fontWeight: '700' },
  linhaStatus: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: CORES.cardDivider },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeVerde: { backgroundColor: '#E6F8F0' },
  statusBadgeAmarelo: { backgroundColor: '#FFF7E6' },
  statusBadgeConcluido: { backgroundColor: '#E6F8F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, flexDirection: 'row', alignItems: 'center' },
  statusTextoConcluido: { fontFamily: FONTES.bold, fontSize: 12, fontWeight: '700', color: '#059669' },
  statusTexto: { fontFamily: FONTES.bold, fontSize: 11, fontWeight: '700' },
  statusTextoVerde: { color: '#059669' },
  statusTextoAmarelo: { color: '#D97706' },
  botaoVerDetalhes: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  botaoVerDetalhesTexto: { fontFamily: FONTES.body, fontSize: 12, fontWeight: '700', color: CORES.textNavy },
});