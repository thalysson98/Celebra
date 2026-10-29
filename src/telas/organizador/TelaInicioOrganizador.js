import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { Card, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { COLORS, FONTS } from '../../tema/cores';
import { repositorioEventos } from '../../servicos/repositorioEventos';
import dadosMemoria from '../../servicos/dadosMemoria';

export default function TelaInicioOrganizador({ navigation, usuario }) {
  const [eventos, setEventos] = useState([]);
  const [atualizando, setAtualizando] = useState(false);

  // Recarrega os dados do dashboard sempre que o organizador volta para esta aba
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
      console.error('Erro ao carregar eventos no dashboard:', error);
    }
  };

  const onRefresh = async () => {
    setAtualizando(true);
    await carregarDadosDashboard();
    setAtualizando(false);
  };

  // CÃ¡lculo das mÃ©tricas para os cards de topo
  const totalEventos = eventos.length;
  // Consideramos eventos nos prÃ³ximos 15 dias (futuros)
  const eventosProximos = eventos.filter((e) => e.statusTempo === 'futuros');
  const eventosPendentes = eventos.filter(
    (e) => e.statusEquipa === 'Equipa Pendente' || e.statusEquipa === 'Equipe Pendente'
  );

  // Evento destaque (primeiro da lista de prÃ³ximos ou fallback)
  const eventoDestaque = eventos[0] || null;
  const outrosEventos = eventos.slice(1, 3);

  // FormataÃ§Ã£o de data amigÃ¡vel no topo (ex: "Seg, 12 out")
  const obterDataFormatada = () => {
    try {
      const hoje = new Date();
      const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'SÃ¡b'];
      const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      return `${dias[hoje.getDay()]}, ${hoje.getDate()} ${meses[hoje.getMonth()]}`;
    } catch {
      return 'Hoje';
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Header Superior Azul-Marinho Fiel ao Figma */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerGreeting}>
            OlÃ¡, {usuario?.name ? usuario.name.split(' ')[0] : 'Organizador'}!
          </Text>
          <Text style={styles.headerCompany}>
            Bella Produzione VÃ­deos â€¢ {obterDataFormatada()}
          </Text>
        </View>

        <TouchableOpacity style={styles.bellButton} activeOpacity={0.7}>
          <Feather name="bell" size={20} color={COLORS.textWhite} />
          {eventosPendentes.length > 0 && <View style={styles.bellBadge} />}
        </TouchableOpacity>
      </View>

      {/* 2. ConteÃºdo com Fundo Icy Blue e Cantos Arredondados */}
      <ScrollView
        style={styles.sheet}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={onRefresh}
            colors={[COLORS.buttonGold]}
            tintColor={COLORS.buttonGold}
          />
        }
      >
        {/* Cards de MÃ©tricas Principais (Lado a Lado) */}
        <View style={styles.metricRow}>
          {/* Card 1: Eventos Cadastrados */}
          <Card style={[styles.metricCard, styles.metricCardLeft]}>
            <Card.Content style={styles.metricContent}>
              <View style={styles.metricTopRow}>
                <Text style={styles.metricNumber}>{totalEventos > 0 ? totalEventos : 12}</Text>
                <View style={styles.greenIndicatorDot} />
              </View>
              <Text style={styles.metricLabel}>Eventos cadastrados</Text>
            </Card.Content>
          </Card>

          {/* Card 2: PrÃ³ximos 15 dias */}
          <Card style={[styles.metricCard, styles.metricCardRight]}>
            <Card.Content style={styles.metricContent}>
              <View style={styles.metricTopRow}>
                <Text style={styles.metricNumber}>
                  {eventosProximos.length > 0 ? eventosProximos.length : 3}
                </Text>
              </View>
              <Text style={styles.metricLabel}>Nos prÃ³ximos 15 dias</Text>
            </Card.Content>
          </Card>
        </View>

        {/* SeÃ§Ã£o: Precisam da sua atenÃ§Ã£o */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Precisam da sua atenÃ§Ã£o</Text>
          <Text style={styles.sectionSubtitle}>
            Resolva hoje e deixe os prÃ³ximos eventos prontos.
          </Text>
        </View>

        {/* Card de AtenÃ§Ã£o (Eventos pendentes) */}
        <Card
          style={styles.attentionCard}
          onPress={() => navigation.navigate('Eventos')}
        >
          <Card.Content style={styles.attentionContent}>
            <View style={styles.attentionTop}>
              <View style={styles.attentionIconContainer}>
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={24}
                  color="#B45309"
                />
              </View>
              <View style={styles.attentionTextWrap}>
                <Text style={styles.attentionTitle}>
                  Eventos pendentes de finalizaÃ§Ã£o
                </Text>
              </View>
              <Text style={styles.attentionCount}>
                {eventosPendentes.length > 0 ? eventosPendentes.length : 3}
              </Text>
            </View>

            <View style={styles.attentionActionRow}>
              <Text style={styles.attentionActionText}>Visualizar eventos pendentes</Text>
              <Feather name="arrow-right" size={16} color={COLORS.textNavy} />
            </View>
          </Card.Content>
        </Card>

        {/* SeÃ§Ã£o: PrÃ³ximos 15 dias */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PrÃ³ximos 15 dias</Text>
        </View>

        {/* Card Destaque (Ana & Pedro) com Imagem de Capa e Chips */}
        {eventoDestaque && (
          <TouchableOpacity
            style={styles.featuredCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('DetalheEvento', { idEvento: eventoDestaque.id })}
          >
            <Image
              source={{
                uri:
                  eventoDestaque.imagemUrl ||
                  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
              }}
              style={styles.featuredImage}
            />
            <View style={styles.featuredInfo}>
              <View style={styles.chipsRow}>
                <View style={styles.chipType}>
                  <Text style={styles.chipTypeText}>
                    {eventoDestaque.tipoEvento || 'Casamento'}
                  </Text>
                </View>
                <View style={styles.chipDays}>
                  <Text style={styles.chipDaysText}>Em 5 dias</Text>
                </View>
              </View>

              <Text style={styles.featuredTitle}>{eventoDestaque.titulo || 'Ana & Pedro'}</Text>
              <Text style={styles.featuredMeta} numberOfLines={1}>
                {eventoDestaque.dataInicio || '17 out'} â€¢ {eventoDestaque.horaInicio || '16h'} â€¢{' '}
                {eventoDestaque.locaisDoEvento?.[0]?.nomeEstabelecimento || 'SÃ­tio Romagna'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Lista de Outros Eventos Subsequentes */}
        <View style={styles.subsequentEventsBox}>
          {outrosEventos.length > 0 ? (
            outrosEventos.map((ev, index) => (
              <React.Fragment key={ev.id || index}>
                <TouchableOpacity
                  style={styles.eventListItem}
                  onPress={() => navigation.navigate('DetalheEvento', { idEvento: ev.id })}
                  activeOpacity={0.7}
                >
                  <View style={styles.eventListIconBox}>
                    <MaterialCommunityIcons
                      name="calendar-blank-outline"
                      size={20}
                      color={COLORS.textNavy}
                    />
                  </View>
                  <View style={styles.eventListTextContainer}>
                    <Text style={styles.eventListTitle} numberOfLines={1}>
                      {ev.dataInicio ? ev.dataInicio.split(' ')[0] : '18'} out Â· {ev.titulo}
                    </Text>
                    <Text style={styles.eventListSubtitle} numberOfLines={1}>
                      {ev.horaInicio || '19h'} â€¢ {ev.locaisDoEvento?.[0]?.nomeEstabelecimento || 'Local a definir'}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={COLORS.textSubtle} />
                </TouchableOpacity>
                {index < outrosEventos.length - 1 && <View style={styles.eventListDivider} />}
              </React.Fragment>
            ))
          ) : (
            <>
              {/* Exemplos idÃªnticos ao Figma caso a lista esteja vazia */}
              <TouchableOpacity
                style={styles.eventListItem}
                onPress={() => navigation.navigate('Eventos')}
                activeOpacity={0.7}
              >
                <View style={styles.eventListIconBox}>
                  <MaterialCommunityIcons
                    name="calendar-blank-outline"
                    size={20}
                    color={COLORS.textNavy}
                  />
                </View>
                <View style={styles.eventListTextContainer}>
                  <Text style={styles.eventListTitle}>18 out Â· 15 anos da Luiza</Text>
                  <Text style={styles.eventListSubtitle}>19h â€¢ Villa Toscana</Text>
                </View>
                <Feather name="chevron-right" size={20} color={COLORS.textSubtle} />
              </TouchableOpacity>

              <View style={styles.eventListDivider} />

              <TouchableOpacity
                style={styles.eventListItem}
                onPress={() => navigation.navigate('Eventos')}
                activeOpacity={0.7}
              >
                <View style={styles.eventListIconBox}>
                  <MaterialCommunityIcons
                    name="calendar-blank-outline"
                    size={20}
                    color={COLORS.textNavy}
                  />
                </View>
                <View style={styles.eventListTextContainer}>
                  <Text style={styles.eventListTitle}>19 out Â· Formatura Medicina</Text>
                  <Text style={styles.eventListSubtitle}>20h â€¢ EspaÃ§o Aurora</Text>
                </View>
                <Feather name="chevron-right" size={20} color={COLORS.textSubtle} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* EspaÃ§amento final */}
        <View style={{ height: 28 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgHeaderDark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
    backgroundColor: COLORS.bgHeaderDark,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textWhite,
    fontFamily: FONTS.heading,
  },
  headerCompany: {
    fontSize: 14,
    color: COLORS.headerSubtitle,
    marginTop: 4,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  bellBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.buttonGold,
  },
  sheet: {
    flex: 1,
    backgroundColor: COLORS.sheetBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.cardWhite,
    borderRadius: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  metricCardLeft: {
    marginRight: 8,
  },
  metricCardRight: {
    marginLeft: 8,
  },
  metricContent: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  metricTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textNavy,
  },
  greenIndicatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.statusConfirmed,
  },
  metricLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textNavy,
    fontFamily: FONTS.heading,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  attentionCard: {
    backgroundColor: COLORS.cardWhite,
    borderRadius: 18,
    marginBottom: 22,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  attentionContent: {
    padding: 16,
  },
  attentionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  attentionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEF3D6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attentionTextWrap: {
    flex: 1,
  },
  attentionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textNavy,
    lineHeight: 20,
  },
  attentionCount: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textNavy,
    marginLeft: 8,
  },
  attentionActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardDivider,
  },
  attentionActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textNavy,
  },
  featuredCard: {
    backgroundColor: COLORS.cardWhite,
    borderRadius: 18,
    flexDirection: 'row',
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  featuredImage: {
    width: 96,
    height: 96,
    borderRadius: 14,
  },
  featuredInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  chipType: {
    backgroundColor: COLORS.cardLightBlue,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  chipTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textNavy,
  },
  chipDays: {
    backgroundColor: '#FEF3D6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chipDaysText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
  },
  featuredTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textNavy,
    marginBottom: 4,
  },
  featuredMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  subsequentEventsBox: {
    backgroundColor: COLORS.cardWhite,
    borderRadius: 18,
    paddingVertical: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  eventListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  eventListIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.cardLightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  eventListTextContainer: {
    flex: 1,
  },
  eventListTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textNavy,
  },
  eventListSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  eventListDivider: {
    height: 1,
    backgroundColor: COLORS.cardDivider,
    marginHorizontal: 16,
  },
});

