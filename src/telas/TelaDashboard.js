import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Icon } from 'react-native-paper';
import { repositorioEventos } from '../servicos/repositorioEventos';

export default function TelaDashboard({ navigation }) {
  const [totalEventos, setTotalEventos] = useState(0);
  const [proximosEventos, setProximosEventos] = useState([]);

  useFocusEffect(
    useCallback(() => {
      carregarDadosDashboard();
    }, [])
  );

  const carregarDadosDashboard = async () => {
    const lista = await repositorioEventos.listarEventos();
    if (lista != null) {
      setTotalEventos(lista.length);
      setProximosEventos(lista.slice(0, 3)); // Pega os primeiros para exibição de exemplo
    } else {
      setTotalEventos(0);
      setProximosEventos([]);
    }
  };

  return (
    <View style={estilos.containerGeral}>
      {/* CABEÇALHO AZUL ESCURO */}
      <View style={estilos.headerTopo}>
        <View style={{ flex: 1 }}>
          <Text style={estilos.saudacao}>Olá, Organizador!</Text>
          <Text style={estilos.subtituloEmpresa}>Bella Produzione Vídeos • Seg, 12 out</Text>
        </View>
        <TouchableOpacity 
          style={estilos.botaoSinoTopo} 
          onPress={() => navigation.navigate('Notificacoes')}
        >
          <Icon source="bell-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={estilos.conteudoScroll} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* CARDS DE ESTATÍSTICAS (LADO A LADO) */}
        <View style={estilos.linhaEstatisticas}>
          <View style={estilos.cardEstatistica}>
            <View style={estilos.cabecalhoCardStat}>
              <Text style={estilos.numeroStat}>{totalEventos}</Text>
              <View style={estilos.pontoVerde} />
            </View>
            <Text style={estilos.rotuloStat}>Eventos cadastrados</Text>
          </View>

          <View style={estilos.cardEstatistica}>
            <Text style={estilos.numeroStat}>3</Text>
            <Text style={estilos.rotuloStat}>Nos próximos 15 dias</Text>
          </View>
        </View>

        {/* SEÇÃO: PRECISAM DA SUA ATENÇÃO */}
        <Text style={estilos.tituloSecao}>Precisam da sua atenção</Text>
        <Text style={estilos.subtituloSecao}>Resolva hoje e deixe os próximos eventos prontos.</Text>

        <TouchableOpacity 
          style={estilos.cardAtencao}
          onPress={() => navigation.navigate('ListaEventos')}
        >
          <View style={estilos.iconeCalendarioAmarelo}>
            <Icon source="calendar-month" size={22} color="#D99B00" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={estilos.tituloCardAtencao}>Eventos pendentes de finalização</Text>
            <Text style={estilos.subLinkAtencao}>Visualizar eventos pendentes</Text>
          </View>
          <View style={estilos.badgeNumeroAtencao}>
            <Text style={estilos.textoBadgeAtencao}>3</Text>
          </View>
        </TouchableOpacity>

        {/* SEÇÃO: PRÓXIMOS 15 DIAS */}
        <Text style={estilos.tituloSecao}>Próximos 15 dias</Text>

        {/* CARD PRINCIPAL COM FOTO (EX: ANA & PEDRO) */}
        <TouchableOpacity 
          style={estilos.cardEventoDestaque}
          onPress={() => navigation.navigate('ListaEventos')}
        >
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80' }} 
            style={estilos.fotoCapaDestaque} 
          />
          <View style={estilos.corpoCardDestaque}>
            <View style={estilos.linhaBadges}>
              <View style={estilos.badgeCasamento}>
                <Text style={estilos.textoBadgeCasamento}>Casamento</Text>
              </View>
              <View style={estilos.badgeDias}>
                <Text style={estilos.textoBadgeDias}>Em 5 dias</Text>
              </View>
            </View>
            <Text style={estilos.tituloEventoDestaque}>Ana & Pedro</Text>
            <Text style={estilos.detalhesEventoDestaque}>17 out • 16h • Sítio Romagna</Text>
          </View>
        </TouchableOpacity>

        {/* ITENS SECUNDÁRIOS DA LISTA */}
        <TouchableOpacity 
          style={estilos.cardItemLista}
          onPress={() => navigation.navigate('ListaEventos')}
        >
          <View style={estilos.iconeCinzaBox}>
            <Icon source="calendar" size={18} color="#0B2545" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={estilos.tituloItemLista}>18 out · 15 anos da Luiza</Text>
            <Text style={estilos.subItemLista}>19h • Villa Toscana</Text>
          </View>
          <Icon source="chevron-right" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={estilos.cardItemLista}
          onPress={() => navigation.navigate('ListaEventos')}
        >
          <View style={estilos.iconeCinzaBox}>
            <Icon source="calendar" size={18} color="#0B2545" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={estilos.tituloItemLista}>19 out · Formatura Medicina</Text>
            <Text style={estilos.subItemLista}>20h • Espaço Aurora</Text>
          </View>
          <Icon source="chevron-right" size={20} color="#999" />
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  containerGeral: { flex: 1, backgroundColor: '#F4F6F8' },
  headerTopo: { backgroundColor: '#0B2545', paddingTop: 45, paddingHorizontal: 20, paddingBottom: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  saudacao: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  subtituloEmpresa: { color: '#A0B2C6', fontSize: 13, marginTop: 2 },
  botaoSinoTopo: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A3A60', justifyContent: 'center', alignItems: 'center' },
  conteudoScroll: { flex: 1, padding: 20 },
  linhaEstatisticas: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  cardEstatistica: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, width: '48%', borderWidth: 1, borderColor: '#E0E0E0' },
  cabecalhoCardStat: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  numeroStat: { fontSize: 26, fontWeight: 'bold', color: '#0B2545' },
  pontoVerde: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  rotuloStat: { fontSize: 12, color: '#777', marginTop: 4 },
  tituloSecao: { fontSize: 16, fontWeight: 'bold', color: '#0B2545', marginTop: 10, marginBottom: 4 },
  subtituloSecao: { fontSize: 12, color: '#777', marginBottom: 12 },
  cardAtencao: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 20 },
  iconeCalendarioAmarelo: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF8E1', justifyContent: 'center', alignItems: 'center' },
  tituloCardAtencao: { fontSize: 14, fontWeight: 'bold', color: '#0B2545' },
  subLinkAtencao: { fontSize: 12, color: '#0B2545', marginTop: 2, fontWeight: '500' },
  badgeNumeroAtencao: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  textoBadgeAtencao: { fontSize: 13, fontWeight: 'bold', color: '#0B2545' },
  cardEventoDestaque: { backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 12 },
  fotoCapaDestaque: { height: 130, width: '100%', padding: 12, justifyContent: 'flex-start' },
  linhaBadges: { flexDirection: 'row', justifyContent: 'space-between' },
  badgeCasamento: { backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  textoBadgeCasamento: { fontSize: 11, fontWeight: 'bold', color: '#0B2545' },
  badgeDias: { backgroundColor: '#FFF8E1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  textoBadgeDias: { fontSize: 11, fontWeight: 'bold', color: '#B78103' },
  corpoCardDestaque: { padding: 14 },
  tituloEventoDestaque: { fontSize: 18, fontWeight: 'bold', color: '#0B2545' },
  detalhesEventoDestaque: { fontSize: 13, color: '#666', marginTop: 4 },
  cardItemLista: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 10 },
  iconeCinzaBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' },
  tituloItemLista: { fontSize: 14, fontWeight: 'bold', color: '#0B2545' },
  subItemLista: { fontSize: 12, color: '#777', marginTop: 2 }
});