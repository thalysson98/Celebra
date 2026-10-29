import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import dadosMemoria from '../../servicos/dadosMemoria';

export default function TelaDetalheEvento({ route }) {
  const { idEvento } = route.params || {};
  const [evento, setEvento] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Simula a busca do evento pelo ID na memória
    const carregarDetalhes = () => {
      try {
        const eventoEncontrado = dadosMemoria.eventos.find(ev => ev.id === idEvento);
        setEvento(eventoEncontrado || null);
      } catch (error) {
        console.error("Erro ao carregar detalhes:", error);
      } finally {
        setCarregando(false); // <--- Isso tira o carregamento infinito!
      }
    };

    carregarDetalhes();
  }, [idEvento]);

  if (carregando) {
    return (
      <View style={estilos.centralizado}>
        <ActivityIndicator size="large" color="#1e1e1e" />
        <Text style={estilos.textoCarregando}>A carregar detalhes...</Text>
      </View>
    );
  }

  if (!evento) {
    return (
      <View style={estilos.centralizado}>
        <Text style={estilos.erro}>Evento não encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={estilos.conteiner}>
      <Text style={estilos.titulo}>{evento.titulo}</Text>
      
      <View style={estilos.card}>
        <Text style={estilos.rotulo}>Tipo de Evento:</Text>
        <Text style={estilos.valor}>{evento.tipoEvento || 'Não informado'}</Text>
      </View>

      <View style={estilos.card}>
        <Text style={estilos.rotulo}>Local / Endereço:</Text>
        <Text style={estilos.valor}>{evento.local || 'Não informado'}</Text>
      </View>

      <View style={estilos.card}>
        <Text style={estilos.rotulo}>Data:</Text>
        <Text style={estilos.valor}>{evento.dataInicio || 'Não informada'}</Text>
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  conteiner: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  centralizado: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  textoCarregando: { marginTop: 10, color: '#666' },
  erro: { fontSize: 16, color: 'red', fontWeight: 'bold' },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#1e1e1e' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  rotulo: { fontSize: 14, color: '#888', fontWeight: '600' },
  valor: { fontSize: 16, color: '#333', marginTop: 3 }
});