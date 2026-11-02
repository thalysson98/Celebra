// src/componentes/CartaoLocal.js
import React from 'react';
import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native';
import { Card } from 'react-native-paper';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { CORES, FONTES } from '../tema/cores';

export default function CartaoLocal({ local, fallbackHora }) {
  
  const horaLocal = local.horaLocal || fallbackHora || 'Horário a confirmar';
  const address = local.enderecoLocal || local.endereco || local.endereco_completo || local.nomeDoLocal;

  return (
    <Card style={{ backgroundColor: CORES.cardWhite, borderRadius: 16, borderWidth: 1, borderColor: '#E1E7EF', elevation: 0, marginBottom: 16 }}>
      <Card.Content>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <MaterialCommunityIcons name="map-marker-outline" size={24} color={CORES.statusDanger || '#E5484D'} />
          
         
          <Text style={{ fontFamily: FONTES.bold, color: '#000000', fontSize: 20 }}>
            {local.tipoLocal || 'Tipo não informado'}
          </Text>
        </View>
        
        <Text style={{ fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 18, marginTop: 4 }}>
          {local.nomeDoLocal || local.nomeEstabelecimento || local.nome || 'Local'}
        </Text>
        
        <Text style={{ fontFamily: FONTES.semibold, color: CORES.textNavy, fontSize: 13, marginTop: 14 }}>
          {local.enderecoLocal || local.endereco || local.endereco_completo || 'Endereço não informado'}
        </Text>
        
        {!!local.observacoesLocal && (
          <Text style={{ fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 13, marginTop: 8 }}>
            Obs: {local.observacoesLocal}
          </Text>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E4ECF2' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="clock" size={18} color={CORES.textNavy} />
            <Text style={{ fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 16 }}>{horaLocal}</Text>
          </View>
          
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFBEB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
            onPress={() => {
              if (address) {
                const url = Platform.OS === 'ios' ? `maps:0,0?q=${encodeURIComponent(address)}` : `geo:0,0?q=${encodeURIComponent(address)}`;
                Linking.openURL(url);
              }
            }}
          >
            <Text style={{ fontFamily: FONTES.bold, color: '#D97706', fontSize: 13 }}>Abrir rotas</Text>
            <Feather name="external-link" size={14} color="#D97706" />
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );
}