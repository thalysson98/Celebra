import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ImageBackground } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { repositorioEventos } from '../servicos/repositorioEventos';

export default function TelaListaEventos({ navigation }) {
  const [eventos, setEventos] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('Futuros');

  useFocusEffect(
    useCallback(() => {
      carregarEventos();
    }, [])
  );

  const carregarEventos = async () => {
    const lista = await repositorioEventos.listarEventos();
    if (lista != null) {
      setEventos(lista);
    } else {
      setEventos([]);
    }
  };

  return (
    <View style={estilos.containerGeral}>
      {/* TOPO APENAS EM AZUL COM SINO CLICÁVEL */}
      <View style={estilos.headerTopoFigma}>
        <Text style={estilos.tituloEventosTopo}>Eventos</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Notificacoes')}>
          <Icon source="bell" size={22} color="#FFC107" />
        </TouchableOpacity>
      </View>

      <View style={estilos.conteudoCorpo}>
        <TouchableOpacity 
          style={estilos.botaoAdicionarFigma}
          onPress={() => navigation.navigate('CriarEvento')}
        >
          <Text style={estilos.textoBotaoAdicionar}>+ Adicionar Evento</Text>
        </TouchableOpacity>

        <View style={estilos.containerBusca}>
          <Icon source="magnify" size={20} color="#999" />
          <TextInput 
            style={estilos.inputBuscaFigma}
            placeholder="Buscar evento ou protagonista"
            placeholderTextColor="#999"
          />
        </View>

        <View style={estilos.linhaFiltros}>
          <TouchableOpacity 
            style={[estilos.pillFiltro, filtroStatus === 'Futuros' && estilos.pillFiltroAtivo]}
            onPress={() => setFiltroStatus('Futuros')}
          >
            <Text style={[estilos.textoPill, filtroStatus === 'Futuros' && estilos.textoPillAtivo]}>Futuros</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[estilos.pillFiltro, filtroStatus === 'Concluídos' && estilos.pillFiltroAtivo]}
            onPress={() => setFiltroStatus('Concluídos')}
          >
            <Text style={[estilos.textoPill, filtroStatus === 'Concluídos' && estilos.textoPillAtivo]}>Concluídos</Text>
          </TouchableOpacity>
        </View>

        <Text style={estilos.tituloMes}>Outubro de 2026</Text>

        <FlatList
          data={eventos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const clienteNome = item.cliente != null ? item.cliente.nome : 'Cliente não informado';
            return (
              <TouchableOpacity 
                style={estilos.cardEventoFigma}
                onPress={() => navigation.navigate('DetalheEvento', { idEvento: item.id })}
              >
                <ImageBackground 
                  source={{ uri: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80' }} 
                  style={estilos.capaCardFoto}
                >
                  <View style={estilos.badgeTipoEvento}>
                    <Text style={estilos.textoBadgeTipo}>{item.tipoEvento || 'Casamento'}</Text>
                  </View>
                </ImageBackground>

                <View style={estilos.corpoInfoCard}>
                  <Text style={estilos.tituloEventoCard}>{item.titulo}</Text>
                  <Text style={estilos.subtituloCliente}>{clienteNome}</Text>

                  {/* DADOS ESSENCIAIS DO EVENTO */}
                  <View style={estilos.linhaIconesDetalhes}>
                    <Text style={estilos.textoIconeInfo}>📅 {item.dataInicio || '17 out'}</Text>
                    <Text style={estilos.textoIconeInfo}>⏰ {item.horaInicio || '16h'}</Text>
                    <Text style={estilos.textoIconeInfo}>📍 2 locais</Text>
                    <Text style={estilos.textoIconeInfo}>👥 {item.numConvidados || 0}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={estilos.textoListaVazia}>Nenhum evento cadastrado ainda.</Text>
          }
        />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  containerGeral: { flex: 1, backgroundColor: '#F4F6F8' },
  headerTopoFigma: { backgroundColor: '#0B2545', paddingTop: 45, paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tituloEventosTopo: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  conteudoCorpo: { flex: 1, padding: 18 },
  botaoAdicionarFigma: { backgroundColor: '#FFC107', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  textoBotaoAdicionar: { color: '#0B2545', fontWeight: 'bold', fontSize: 15 },
  containerBusca: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 12, marginBottom: 12 },
  inputBuscaFigma: { flex: 1, paddingVertical: 12, paddingLeft: 8, fontSize: 14, color: '#333' },
  linhaFiltros: { flexDirection: 'row', marginBottom: 15 },
  pillFiltro: { backgroundColor: '#E0E0E0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  pillFiltroAtivo: { backgroundColor: '#0B2545' },
  textoPill: { color: '#555', fontWeight: 'bold', fontSize: 13 },
  textoPillAtivo: { color: '#FFF' },
  tituloMes: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 10 },
  cardEventoFigma: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', overflow: 'hidden', marginBottom: 15 },
  capaCardFoto: { height: 130, padding: 10, justifyContent: 'flex-start' },
  badgeTipoEvento: { backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  textoBadgeTipo: { fontSize: 11, fontWeight: 'bold', color: '#0B2545' },
  corpoInfoCard: { padding: 14 },
  tituloEventoCard: { fontSize: 18, fontWeight: 'bold', color: '#0B2545' },
  subtituloCliente: { fontSize: 13, color: '#777', marginTop: 2, marginBottom: 10 },
  linhaIconesDetalhes: { flexDirection: 'row', justifyContent: 'space-between' },
  textoIconeInfo: { fontSize: 12, color: '#555', fontWeight: '500' },
  textoListaVazia: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 15 }
});