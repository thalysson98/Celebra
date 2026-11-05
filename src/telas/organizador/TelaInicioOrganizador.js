
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet
} from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import CartaoMetrica from '../../componentes/CartaoMetrica';
import { COLORS, FONTS, FONTES } from '../../tema/cores';
import { repositorioEventos } from '../../servicos/repositorioEventos';
import Cabecalho from '../../componentes/Cabecalho';

const parseMoeda = (valor) => {
  const v = Number(String(valor || '0').replace(/\D/g, '')) / 100;
  return isNaN(v) ? 0 : v;
}

const formatarMonetario = (num) => {
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function TelaInicioOrganizador({ navigation, usuario }) {
  const [eventos, setEventos] = useState([]);
  const [atualizando, setAtualizando] = useState(false);
  const [diasFiltro, setDiasFiltro] = useState(15); 

  useFocusEffect(
    useCallback(() => {
      carregarDadosDashboard();
    }, [])
  );

  const carregarDadosDashboard = async () => {
    try {
      const lista = await repositorioEventos.listarEventos();
      setEventos(lista || []);
    } catch (error) {
      console.log('Erro ao carregar eventos no dashboard:', error);
    }
  };

  const onRefresh = async () => {
    setAtualizando(true);
    await carregarDadosDashboard();
    setAtualizando(false);
  };

  const converterStringParaData = (dataStr) => {
    if (!dataStr) return null;
    const mesMap = { jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11 };
    const [dia, mesTexto, ano] = dataStr.split('/');
    if (dia && mesTexto && ano) {
      return new Date(ano, mesTexto - 1, dia); 
    }
    const [d, mT, a] = dataStr.split(' ');
    if (d && mT && a) return new Date(a, mesMap[mT.toLowerCase()], d);
    return new Date();
  };

  const { totalBruto, pendenteReceber } = useMemo(() => {
    let tBruto = 0;
    let pReceber = 0;
    eventos.forEach(ev => {
      tBruto += parseMoeda(ev.financeiro?.valorTotal);
      (ev.financeiro?.parcelasDetalhadas || []).forEach(p => {
         if (p.status !== 'paga') pReceber += parseMoeda(p.valor);
      });
    });
    return { totalBruto: formatarMonetario(tBruto), pendenteReceber: formatarMonetario(pReceber) };
  }, [eventos]);

  const eventosProximos = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    const limiteData = new Date(hoje);
    limiteData.setDate(limiteData.getDate() + diasFiltro);
    return eventos.filter(e => {
      if (e.statusTempo !== 'futuros') return false;
      const dataEv = e.dataInicio ? converterStringParaData(e.dataInicio) : null;
      if (!dataEv) return true;
      return dataEv >= hoje && dataEv <= limiteData;
    }).sort((a, b) => {
        const da = converterStringParaData(a.dataInicio);
        const db = converterStringParaData(b.dataInicio);
        return (da?.getTime() || 0) - (db?.getTime() || 0); 
    });
  }, [eventos, diasFiltro]);

  const obterDataFormatada = () => {
    try {
      const hoje = new Date();
      const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      return `${dias[hoje.getDay()]}, ${hoje.getDate()} ${meses[hoje.getMonth()]}`;
    } catch {
      return 'Hoje';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerGreeting}>
            Olá, {usuario?.name ? usuario.name.split(' ')[0] : 'Organizador'}!
          </Text>
          <Text style={styles.headerCompany}>
            {usuario?.companyName || 'Sua produtora'} • {obterDataFormatada()}
          </Text>
        </View>
        <TouchableOpacity style={styles.bellButton} onPress={() => navigation.navigate('Notificacoes')} activeOpacity={0.7}>
          <Feather name="bell" size={20} color={COLORS.textWhite} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={atualizando} onRefresh={onRefresh} colors={[COLORS.buttonGold]} tintColor={COLORS.buttonGold} />}>
        
  
        <View style={{ flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <CartaoMetrica valor={totalBruto} rotulo="Total Bruto (R$)" />
          <CartaoMetrica valor={pendenteReceber} rotulo="Pendente a receber" />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximos eventos</Text>
          <View style={styles.filterDaysRow}>
            {[7, 15, 20, 30].map((dias) => (
              <TouchableOpacity key={dias} style={[styles.filterDayChip, diasFiltro === dias && styles.filterDayChipSelected]} onPress={() => setDiasFiltro(dias)}>
                <Text style={[styles.filterDayText, diasFiltro === dias && styles.filterDayTextSelected]}>
                  {dias} dias
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {eventosProximos.length > 0 ? (
          <View style={styles.subsequentEventsBox}>
            {eventosProximos.map((ev, index) => (
              <React.Fragment key={ev.id || index}>
                <TouchableOpacity
                  style={styles.eventListItem}
                  onPress={() => navigation.navigate('Eventos', { screen: 'DetalheEvento', params: { idEvento: ev.id } })}
                  activeOpacity={0.7}
                >
                  <View style={styles.eventListIconBox}>
                    <MaterialCommunityIcons name="calendar-blank-outline" size={20} color={COLORS.textNavy} />
                  </View>
                  <View style={styles.eventListTextContainer}>
                    <Text style={styles.eventListTitle} numberOfLines={1}>
                      {ev.dataInicio || 'Data a definir'} • {ev.titulo}
                    </Text>
                    <Text style={styles.eventListSubtitle} numberOfLines={1}>
                      {ev.horaInicio || 'Horário a definir'}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={COLORS.textSubtle} />
                </TouchableOpacity>
                {index < eventosProximos.length - 1 && <View style={styles.eventListDivider} />}
              </React.Fragment>
            ))}
          </View>
        ) : (
          <View style={styles.noUpcomingBox}>
            <Text style={styles.noUpcomingText}>Nenhum evento programado para os próximos {diasFiltro} dias.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Eventos')} activeOpacity={0.7}>
              <Text style={styles.noUpcomingAction}>Ver todos os eventos</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgHeaderDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 22, backgroundColor: COLORS.bgHeaderDark },
  headerTextContainer: { flex: 1 },
  headerGreeting: { fontSize: 26, fontWeight: '700', color: COLORS.textWhite, fontFamily: FONTS.heading },
  headerCompany: { fontFamily: FONTES.body, fontSize: 14, color: COLORS.headerSubtitle, marginTop: 4 },
  bellButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)' },
  sheet: { flex: 1, backgroundColor: COLORS.sheetBg, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  sheetContent: { paddingHorizontal: 16, paddingTop: 20 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  sectionHeader: { marginBottom: 10, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textNavy, fontFamily: FONTS.heading },
  filterDaysRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  filterDayChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#DFE7EE' },
  filterDayChipSelected: { backgroundColor: COLORS.textNavy },
  filterDayText: { fontFamily: FONTES.semibold, fontSize: 12, color: COLORS.textMuted },
  filterDayTextSelected: { color: COLORS.textWhite },
  subsequentEventsBox: { backgroundColor: COLORS.cardWhite, borderRadius: 18, paddingVertical: 6, elevation: 1 },
  eventListItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  eventListIconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.cardLightBlue, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  eventListTextContainer: { flex: 1 },
  eventListTitle: { fontFamily: FONTES.bold, fontSize: 14, fontWeight: '700', color: COLORS.textNavy },
  eventListSubtitle: { fontFamily: FONTES.body, fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  eventListDivider: { height: 1, backgroundColor: COLORS.cardDivider, marginHorizontal: 16 },
  noUpcomingBox: { backgroundColor: COLORS.cardWhite, borderRadius: 18, padding: 16, gap: 10 },
  noUpcomingText: { fontFamily: FONTES.body, color: COLORS.textMuted, fontSize: 13, lineHeight: 19 },
  noUpcomingAction: { fontFamily: FONTES.bold, color: COLORS.textNavy, fontSize: 13, fontWeight: '700' },
  bottomSpacer: { height: 28 }
});