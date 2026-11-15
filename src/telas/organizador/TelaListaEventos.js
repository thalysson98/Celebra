import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from 'react-native-paper';
import { CORES } from '../../tema/cores';
import { styles } from '../../estilos/estilosListaEventosOrganizador';
import { repositorioEventos } from '../../servicos/repositorioEventos';
import CartaoEvento from '../../componentes/CartaoEvento';
import FiltroIntervaloDatas, { obterChaveDataLocal } from '../../compartilhado/FiltroIntervaloDatas';
import SeparadorCampoIcone from '../../compartilhado/SeparadorCampoIcone';

export default function TelaListaEventos({ navigation }) {
  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('futuros');
  const [filtroEquipe, setFiltroEquipe] = useState('todas');
  const [filtroEquipeRascunho, setFiltroEquipeRascunho] = useState('todas');
  const [tipoEventoSelecionado, setTipoEventoSelecionado] = useState('');
  const [tipoEventoRascunho, setTipoEventoRascunho] = useState('');
  const [ordemCrescente, setOrdemCrescente] = useState(true);
  const [busca, setBusca] = useState('');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');

  const carregarEventos = useCallback(async () => {
    setCarregando(true);
    try {
      const lista = await repositorioEventos.listarEventos();
      setEventos(lista || []);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregarEventos(); }, [carregarEventos]));

  const tiposDeEvento = useMemo(() => (
    [...new Set(eventos.map((evento) => String(evento.tipoEvento || '').trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
  ), [eventos]);

  const prepararFiltrosRascunho = () => {
    setFiltroEquipeRascunho(filtroEquipe);
    setTipoEventoRascunho(tipoEventoSelecionado);
  };

  const limparFiltrosRascunho = () => {
    setFiltroEquipeRascunho('todas');
    setTipoEventoRascunho('');
  };

  const eventosFiltrados = eventos
    .filter((evento) => {
      const correspondeFiltro = filtro === 'futuros'
        ? evento.statusTempo !== 'concluidos' && evento.statusTempo !== 'concluídos'
        : evento.statusTempo === 'concluidos' || evento.statusTempo === 'concluídos';
      const termo = busca.trim().toLocaleLowerCase('pt-BR');
      const correspondeBusca = !termo || [evento.titulo, evento.cliente?.nome, evento.tipoEvento]
        .filter(Boolean).some((valor) => valor.toLocaleLowerCase('pt-BR').includes(termo));
      const chaveDataEvento = obterChaveDataLocal(
        evento.data_inicio || evento.dataInicio || evento.eventDate || evento.data
      );
      const correspondeDataInicial = !dataInicial || (chaveDataEvento && chaveDataEvento >= dataInicial);
      const correspondeDataFinal = !dataFinal || (chaveDataEvento && chaveDataEvento <= dataFinal);
      const statusEquipe = String(evento.statusEquipa || '').toLocaleLowerCase('pt-BR');
      const correspondeEquipe = filtroEquipe === 'todas'
        || (filtroEquipe === 'confirmada' && statusEquipe === 'equipe confirmada')
        || (filtroEquipe === 'pendente' && statusEquipe === 'equipe pendente');
      const correspondeTipoEvento = !tipoEventoSelecionado
        || String(evento.tipoEvento || '').trim() === tipoEventoSelecionado;
      return correspondeFiltro && correspondeBusca && correspondeDataInicial && correspondeDataFinal && correspondeEquipe && correspondeTipoEvento;
    })
    .sort((primeiro, segundo) => {
      const primeiraData = obterChaveDataLocal(
        primeiro.data_inicio || primeiro.dataInicio || primeiro.eventDate || primeiro.data
      );
      const segundaData = obterChaveDataLocal(
        segundo.data_inicio || segundo.dataInicio || segundo.eventDate || segundo.data
      );
      if (!primeiraData && !segundaData) return 0;
      if (!primeiraData) return 1;
      if (!segundaData) return -1;
      const comparacao = primeiraData.localeCompare(segundaData);
      return ordemCrescente ? comparacao : -comparacao;
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
          <View style={styles.searchControls}>
            <View style={styles.searchBox}>
              <Feather name="search" size={18} color={CORES.textMuted} />
              <SeparadorCampoIcone />
              <TextInput value={busca} onChangeText={setBusca} placeholder="Buscar evento" placeholderTextColor={CORES.textSubtle} style={styles.searchInput} returnKeyType="search" />
              {!!busca && <TouchableOpacity onPress={() => setBusca('')} accessibilityLabel="Limpar busca"><Feather name="x-circle" size={17} color={CORES.textSubtle} /></TouchableOpacity>}
            </View>
            <FiltroIntervaloDatas
              dataInicial={dataInicial}
              dataFinal={dataFinal}
              aoMudarDataInicial={setDataInicial}
              aoMudarDataFinal={setDataFinal}
              aoLimpar={() => {
                limparFiltrosRascunho();
              }}
              aoAbrir={prepararFiltrosRascunho}
              aoAplicarConteudoAdicional={() => {
                setFiltroEquipe(filtroEquipeRascunho);
                setTipoEventoSelecionado(tipoEventoRascunho);
              }}
              limparAoAplicar
              mostrarLimpar
              ativo={Boolean(dataInicial || dataFinal || filtroEquipe !== 'todas' || tipoEventoSelecionado)}
              tituloModal="Filtros dos eventos"
              subtituloModal="Defina período, equipe e tipo de evento"
              conteudoAdicional={(
                <View>
                  <View style={styles.teamFilterSection}>
                    <Text style={styles.teamFilterLabel}>Equipe do evento</Text>
                    <View style={styles.teamFilterRow}>
                      {[
                        ['todas', 'Todas as equipes'],
                        ['confirmada', 'Equipe confirmada'],
                        ['pendente', 'Equipe pendente'],
                      ].map(([chave, rotulo]) => {
                        const ativo = filtroEquipeRascunho === chave;
                        return (
                          <TouchableOpacity
                            key={chave}
                            onPress={() => setFiltroEquipeRascunho(chave)}
                            style={[styles.teamFilter, ativo && styles.teamFilterActive]}
                            accessibilityRole="button"
                            accessibilityState={{ selected: ativo }}
                          >
                            <Text style={[styles.teamFilterText, ativo && styles.teamFilterTextActive]}>
                              {rotulo}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                  <View style={styles.teamFilterSection}>
                    <Text style={styles.teamFilterLabel}>Tipo de evento</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventTypeFilterRow}>
                      {[
                        ['', 'Todos os tipos'],
                        ...tiposDeEvento.map((tipo) => [tipo, tipo]),
                      ].map(([tipo, rotulo]) => {
                        const ativo = tipoEventoRascunho === tipo;
                        return (
                          <TouchableOpacity
                            key={tipo || 'todos-os-tipos'}
                            onPress={() => setTipoEventoRascunho(tipo)}
                            style={[styles.teamFilter, ativo && styles.teamFilterActive]}
                            accessibilityRole="button"
                            accessibilityState={{ selected: ativo }}
                          >
                            <Text style={[styles.teamFilterText, ativo && styles.teamFilterTextActive]}>
                              {rotulo}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
              )}
            />
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setOrdemCrescente((atual) => !atual)}
              accessibilityRole="button"
              accessibilityLabel={`Ordenar por data ${ordemCrescente ? 'decrescente' : 'crescente'}`}
            >
              <Feather name={ordemCrescente ? 'arrow-up' : 'arrow-down'} size={18} color={CORES.textNavy} />
            </TouchableOpacity>
          </View>
          <View style={styles.filterRow}>
            {[['futuros', 'Futuros'], ['concluidos', 'Concluídos']].map(([chave, rotulo]) => {
              const ativo = filtro === chave;
              return <TouchableOpacity key={chave} onPress={() => setFiltro(chave)} style={[styles.filter, ativo && styles.filterActive]}><Text style={[styles.filterText, ativo && styles.filterTextActive]}>{rotulo}</Text></TouchableOpacity>;
            })}
            <Text style={styles.count}>{eventosFiltrados.length} {eventosFiltrados.length === 1 ? 'evento' : 'eventos'}</Text>
          </View>
        </View>

        {carregando && eventos.length > 0 && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, paddingVertical: 10 }}>
            <ActivityIndicator size="small" color={CORES.buttonGold} />
            <Text style={{ color: CORES.textMuted }}>Atualizando eventos...</Text>
          </View>
        )}
        <FlatList
          data={eventosFiltrados}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <CartaoEvento evento={item} aoPressionar={() => navigation.navigate('DetalheEvento', { idEvento: item.id })} />}
          ListEmptyComponent={(
            <View style={styles.emptyState}>
              {carregando ? (
                <>
                  <ActivityIndicator size="large" color={CORES.buttonGold} />
                  <Text style={styles.emptyText}>Carregando eventos...</Text>
                </>
              ) : (
                <>
                  <View style={styles.emptyIcon}><Feather name={busca || dataInicial || dataFinal || filtroEquipe !== 'todas' || tipoEventoSelecionado ? 'search' : 'calendar'} size={25} color={CORES.textMuted} /></View>
                  <Text style={styles.emptyTitle}>{busca || dataInicial || dataFinal || filtroEquipe !== 'todas' || tipoEventoSelecionado ? 'Nenhum evento encontrado' : filtro === 'futuros' ? 'Nenhum evento futuro' : 'Nenhum evento concluído'}</Text>
                  <Text style={styles.emptyText}>{busca || dataInicial || dataFinal || filtroEquipe !== 'todas' || tipoEventoSelecionado ? 'Ajuste a busca, o período, a equipe ou o tipo de evento.' : 'Seus eventos aparecerão aqui quando forem cadastrados.'}</Text>
                  {!busca && !dataInicial && !dataFinal && filtroEquipe === 'todas' && !tipoEventoSelecionado && filtro === 'futuros' && <Button mode="text" onPress={() => navigation.navigate('CriarEvento')} textColor={CORES.textNavy}>Adicionar primeiro evento</Button>}
                </>
              )}
            </View>
          )}
        />
      </View>
    </View>
  );
}
