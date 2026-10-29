import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import CartaoMetrica from '../../componentes/CartaoMetrica';

import { COLORS, FONTS } from '../../tema/cores';
import { styles } from '../../estilos/estilosInicioOrganizador';
import { repositorioEventos } from '../../servicos/repositorioEventos';

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

  // Cálculo das métricas para os cards de topo
  const totalEventos = eventos.length;
  // Consideramos eventos nos próximos 15 dias (futuros)
  const eventosProximos = eventos.filter((e) => e.statusTempo === 'futuros');
  const eventosPendentes = eventos.filter(
    (e) => e.statusEquipa === 'Equipa Pendente' || e.statusEquipa === 'Equipe Pendente'
  );

  // Evento destaque (primeiro da lista de próximos ou fallback)
  const eventoDestaque = eventosProximos[0] || null;
  const outrosEventos = eventosProximos.slice(1, 3);

  // Formatação de data amigável no topo (ex: "Seg, 12 out")
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
      {/* 1. Header Superior Azul-Marinho Fiel ao Figma */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerGreeting}>
            Olá, {usuario?.name ? usuario.name.split(' ')[0] : 'Organizador'}!
          </Text>
          <Text style={styles.headerCompany}>
            {usuario?.companyName || 'Sua produtora'} • {obterDataFormatada()}
          </Text>
        </View>

        <TouchableOpacity style={styles.bellButton} activeOpacity={0.7}>
          <Feather name="bell" size={20} color={COLORS.textWhite} />
          {eventosPendentes.length > 0 && <View style={styles.bellBadge} />}
        </TouchableOpacity>
      </View>

      {/* 2. Conteúdo com Fundo Icy Blue e Cantos Arredondados */}
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
        {/* Cards de Métricas Principais (Lado a Lado) */}
        <View style={styles.metricRow}>
          <CartaoMetrica
            valor={totalEventos}
            rotulo="Eventos cadastrados"
            mostrarIndicador
            estilo={{ marginRight: 8 }}
          />
          <CartaoMetrica
            valor={eventosProximos.length}
            rotulo="Nos próximos 15 dias"
            estilo={{ marginLeft: 8 }}
          />
        </View>

        {/* Seção: Precisam da sua atenção */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Precisam da sua atenção</Text>
          <Text style={styles.sectionSubtitle}>
            Resolva hoje e deixe os próximos eventos prontos.
          </Text>
        </View>

        {/* Card de Atenção (Eventos pendentes) */}
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
                  Eventos pendentes de finalização
                </Text>
              </View>
              <Text style={styles.attentionCount}>
                {eventosPendentes.length}
              </Text>
            </View>

            <View style={styles.attentionActionRow}>
              <Text style={styles.attentionActionText}>Visualizar eventos pendentes</Text>
              <Feather name="arrow-right" size={16} color={COLORS.textNavy} />
            </View>
          </Card.Content>
        </Card>

        {/* Seção: Próximos 15 dias */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximos 15 dias</Text>
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
                  <Text style={styles.chipDaysText}>Próximo</Text>
                </View>
              </View>

              <Text style={styles.featuredTitle}>{eventoDestaque.titulo}</Text>
              <Text style={styles.featuredMeta} numberOfLines={1}>
                {eventoDestaque.dataInicio || 'Data a definir'} • {eventoDestaque.horaInicio || 'Horário a definir'} •{' '}
                {eventoDestaque.locais?.[0]?.nomeDoLocal || eventoDestaque.locaisDoEvento?.[0]?.nomeEstabelecimento || eventoDestaque.local || 'Local a definir'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Lista de Outros Eventos Subsequentes */}
        {outrosEventos.length > 0 ? (
          <View style={styles.subsequentEventsBox}>
            {outrosEventos.map((ev, index) => (
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
                      {ev.dataInicio || 'Data a definir'} · {ev.titulo}
                    </Text>
                    <Text style={styles.eventListSubtitle} numberOfLines={1}>
                      {ev.horaInicio || 'Horário a definir'} • {ev.locais?.[0]?.nomeDoLocal || ev.locaisDoEvento?.[0]?.nomeEstabelecimento || ev.local || 'Local a definir'}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={COLORS.textSubtle} />
                </TouchableOpacity>
                {index < outrosEventos.length - 1 && <View style={styles.eventListDivider} />}
              </React.Fragment>
            ))}
          </View>
        ) : (
          <View style={styles.noUpcomingBox}>
            <Text style={styles.noUpcomingText}>Nenhum outro evento programado para os próximos dias.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Eventos')} activeOpacity={0.7}>
              <Text style={styles.noUpcomingAction}>Ver todos os eventos</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Espaçamento final */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}
