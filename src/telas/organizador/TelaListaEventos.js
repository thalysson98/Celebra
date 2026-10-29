import React, { useCallback, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from 'react-native-paper';
import { CORES } from '../../tema/cores';
import { styles } from '../../estilos/estilosListaEventosOrganizador';
import { repositorioEventos } from '../../servicos/repositorioEventos';
import CartaoEvento from '../../componentes/CartaoEvento';

export default function TelaListaEventos({ navigation }) {
  const [eventos, setEventos] = useState([]);
  const [filtro, setFiltro] = useState('futuros');
  const [busca, setBusca] = useState('');

  const carregarEventos = useCallback(async () => {
    const lista = await repositorioEventos.listarEventos();
    setEventos(lista || []);
  }, []);

  useFocusEffect(useCallback(() => { carregarEventos(); }, [carregarEventos]));

  const eventosFiltrados = eventos.filter((evento) => {
    const correspondeFiltro = filtro === 'futuros'
      ? evento.statusTempo !== 'concluidos' && evento.statusTempo !== 'concluídos'
      : evento.statusTempo === 'concluidos' || evento.statusTempo === 'concluídos';
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    const correspondeBusca = !termo || [evento.titulo, evento.cliente?.nome, evento.tipoEvento]
      .filter(Boolean).some((valor) => valor.toLocaleLowerCase('pt-BR').includes(termo));
    return correspondeFiltro && correspondeBusca;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Meus Eventos</Text>
            <Text style={styles.subtitle}>Organize os próximos momentos especiais.</Text>
          </View>
        </View>
        <Button mode="contained" icon="plus" onPress={() => navigation.navigate('CriarEvento')} buttonColor={CORES.buttonGold} textColor={CORES.textNavy} style={styles.addButton} contentStyle={styles.addButtonContent}>
          Adicionar Evento
        </Button>
      </View>

      <View style={styles.sheet}>
        <View style={styles.controls}>
          <View style={styles.searchBox}>
            <Feather name="search" size={18} color={CORES.textMuted} />
            <TextInput value={busca} onChangeText={setBusca} placeholder="Buscar evento ou protagonista" placeholderTextColor={CORES.textSubtle} style={styles.searchInput} returnKeyType="search" />
            {!!busca && <TouchableOpacity onPress={() => setBusca('')} accessibilityLabel="Limpar busca"><Feather name="x-circle" size={17} color={CORES.textSubtle} /></TouchableOpacity>}
          </View>
          <View style={styles.filterRow}>
            {[['futuros', 'Futuros'], ['concluidos', 'Concluídos']].map(([chave, rotulo]) => {
              const ativo = filtro === chave;
              return <TouchableOpacity key={chave} onPress={() => setFiltro(chave)} style={[styles.filter, ativo && styles.filterActive]}><Text style={[styles.filterText, ativo && styles.filterTextActive]}>{rotulo}</Text></TouchableOpacity>;
            })}
            <Text style={styles.count}>{eventosFiltrados.length} {eventosFiltrados.length === 1 ? 'evento' : 'eventos'}</Text>
          </View>
        </View>

        <FlatList
          data={eventosFiltrados}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <CartaoEvento evento={item} aoPressionar={() => navigation.navigate('DetalheEvento', { idEvento: item.id })} />}
          ListEmptyComponent={(
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}><Feather name={busca ? 'search' : 'calendar'} size={25} color={CORES.textMuted} /></View>
              <Text style={styles.emptyTitle}>{busca ? 'Nenhum evento encontrado' : filtro === 'futuros' ? 'Nenhum evento futuro' : 'Nenhum evento concluído'}</Text>
              <Text style={styles.emptyText}>{busca ? 'Tente buscar por outro nome.' : 'Seus eventos aparecerão aqui quando forem cadastrados.'}</Text>
              {!busca && filtro === 'futuros' && <Button mode="text" onPress={() => navigation.navigate('CriarEvento')} textColor={CORES.textNavy}>Adicionar primeiro evento</Button>}
            </View>
          )}
        />
      </View>
    </View>
  );
}
