import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import dadosMemoria from '../servicos/dadosMemoria';

export default function TelaDetalheEvento({ route, navigation }) {
  const params = route != null ? route.params : null;
  const idEvento = params != null ? params.idEvento : null;

  const [abaAtiva, setAbaAtiva] = useState('Geral');
  const [evento, setEvento] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarDetalhes();
  }, [idEvento]);

  const carregarDetalhes = () => {
    try {
      if (dadosMemoria != null && dadosMemoria.eventos != null) {
        let eventoEncontrado = null;
        for (let i = 0; i < dadosMemoria.eventos.length; i++) {
          if (dadosMemoria.eventos[i].id === idEvento) {
            eventoEncontrado = dadosMemoria.eventos[i];
            break;
          }
        }
        setEvento(eventoEncontrado);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  if (carregando) {
    return <View style={estilos.centralizado}><ActivityIndicator size="large" color="#FFC107" /></View>;
  }

  if (evento == null) {
    return <View style={estilos.centralizado}><Text>Evento não encontrado.</Text></View>;
  }

  const financeiro = evento.financeiro != null ? evento.financeiro : {};
  const parcelas = financeiro.parcelas != null ? financeiro.parcelas : [];

  return (
    <View style={estilos.containerGeral}>
      <View style={estilos.headerFigma}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={estilos.tituloHeader}>Detalhes do evento</Text>

        <View style={estilos.tabBarHeader}>
          {['Geral', 'Locais', 'Equipe', 'Financeiro'].map((aba) => (
            <TouchableOpacity 
              key={aba}
              style={[estilos.tabItemHeader, abaAtiva === aba && estilos.tabItemAtivoHeader]}
              onPress={() => setAbaAtiva(aba)}
            >
              <Text style={[estilos.textoTabHeader, abaAtiva === aba && estilos.textoTabAtivoHeader]}>{aba}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={estilos.conteudoScroll}>
        {abaAtiva === 'Geral' && (
          <View>
            <View style={estilos.bannerEvento}>
              <Text style={estilos.tituloEventoBanner}>{evento.titulo}</Text>
              <Text style={estilos.subtituloEventoBanner}>{evento.dataInicio || 'Data não informada'} • {evento.numConvidados || 0} convidados</Text>
            </View>

            <View style={estilos.cardFigma}>
              <Text style={estilos.rotuloFigma}>Clientes</Text>
              <Text style={estilos.valorFigma}>👤 {evento.cliente != null ? evento.cliente.nome : 'Não informado'}</Text>
            </View>

            <View style={estilos.cardFigma}>
              <Text style={estilos.rotuloFigma}>Notas da produção</Text>
              <Text style={estilos.valorFigma}>{evento.notasProducao || 'Nenhuma nota registrada.'}</Text>
            </View>

            <TouchableOpacity style={estilos.botaoEditarFigma} onPress={() => Alert.alert('Editar Dados', 'Abrindo formulário de edição do evento.')}>
              <Text style={estilos.textoBotaoEditar}>✏️ Editar dados</Text>
            </TouchableOpacity>
          </View>
        )}

        {abaAtiva === 'Locais' && (
          <View>
            <Text style={estilos.tituloSecaoBloco}>Local do Evento</Text>
            <View style={estilos.cardFigma}>
              <Text style={estilos.rotuloFigma}>Local Principal</Text>
              <Text style={estilos.valorFigma}>📍 {evento.local || 'Endereço principal'}</Text>
            </View>
          </View>
        )}

        {abaAtiva === 'Equipe' && (
          <View>
            <Text style={estilos.tituloSecaoBloco}>Equipe de campo</Text>
            <View style={estilos.cardFigma}>
              <Text style={estilos.rotuloFigma}>Cinegrafista Principal</Text>
              <Text style={estilos.valorFigma}>📹 Ronald Cipriani</Text>
            </View>
          </View>
        )}

        {abaAtiva === 'Financeiro' && (
          <View>
            <View style={estilos.cardFinanceiroDestaque}>
              <Text style={estilos.rotuloFinanceiroCard}>Valor total do evento</Text>
              <Text style={estilos.valorTotalGrande}>R$ {financeiro.valorTotal != null ? financeiro.valorTotal.toFixed(2) : '0.00'}</Text>
            </View>

            <Text style={estilos.tituloSecaoBloco}>Parcelas</Text>
            {parcelas.map((p, i) => (
              <View key={p.id != null ? p.id : i} style={estilos.cardFigma}>
                <Text style={{ fontWeight: 'bold', color: '#0B2545' }}>{p.descricao}</Text>
                <Text>R$ {p.valor.toFixed(2)} - Vencimento: {p.dataVencimento}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  containerGeral: { flex: 1, backgroundColor: '#F4F6F8' },
  centralizado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerFigma: { backgroundColor: '#0B2545', paddingTop: 45, paddingHorizontal: 20, paddingBottom: 10 },
  tituloHeader: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  tabBarHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  tabItemHeader: { paddingVertical: 8, paddingHorizontal: 12 },
  tabItemAtivoHeader: { borderBottomWidth: 3, borderBottomColor: '#FFC107' },
  textoTabHeader: { color: '#A0B2C6', fontSize: 14 },
  textoTabAtivoHeader: { color: '#FFC107', fontWeight: 'bold' },
  conteudoScroll: { flex: 1, padding: 20 },
  bannerEvento: { backgroundColor: '#0B2545', padding: 20, borderRadius: 12, marginBottom: 15 },
  tituloEventoBanner: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  subtituloEventoBanner: { color: '#A0B2C6', fontSize: 14, marginTop: 4 },
  cardFigma: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', padding: 15, marginBottom: 10 },
  rotuloFigma: { fontSize: 13, color: '#777', fontWeight: '600' },
  valorFigma: { fontSize: 15, color: '#333', marginTop: 4 },
  botaoEditarFigma: { backgroundColor: '#FFC107', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  textoBotaoEditar: { color: '#0B2545', fontWeight: 'bold', fontSize: 15 },
  tituloSecaoBloco: { fontSize: 16, fontWeight: 'bold', color: '#0B2545', marginBottom: 10, marginTop: 10 },
  cardFinanceiroDestaque: { backgroundColor: '#0B2545', borderRadius: 12, padding: 18, marginBottom: 15 }
});