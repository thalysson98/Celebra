import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { subscribeToTechnicianAssignments, respondToAssignment } from '../services/assignmentService';
import { styles } from '../styles/technicianDashboardStyles';

function formatDate(value) {
  if (!value) return 'Data a confirmar';
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data a confirmar';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function TechnicianDashboardScreen({ user, onLogout, previewAssignments }) {
  const insets = useSafeAreaInsets();
  const [assignments, setAssignments] = useState(previewAssignments || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [respondingId, setRespondingId] = useState(null);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    if (previewAssignments) {
      setAssignments(previewAssignments);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const unsubscribe = subscribeToTechnicianAssignments(
      user.uid,
      (nextAssignments) => {
        setAssignments(nextAssignments);
        setError('');
        setLoading(false);
      },
      () => {
        setError('Não foi possível carregar suas convocações. Tente novamente mais tarde.');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user.uid, previewAssignments]);

  const pendingAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === 'pending'),
    [assignments],
  );
  const confirmedAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === 'accepted'),
    [assignments],
  );

  const updateResponse = async (assignment, status) => {
    if (previewAssignments) {
      setAssignments((currentAssignments) => currentAssignments.map((item) => (
        item.id === assignment.id
          ? { ...item, status, respondedAt: new Date() }
          : item
      )));
      return;
    }

    setRespondingId(assignment.id);
    try {
      await respondToAssignment({
        assignmentId: assignment.id,
        technicianUid: user.uid,
        status,
      });
    } catch (responseError) {
      Alert.alert('Não foi possível responder', responseError.message);
    } finally {
      setRespondingId(null);
    }
  };

  const confirmDecline = (assignment) => {
    if (previewAssignments) {
      updateResponse(assignment, 'declined');
      return;
    }

    Alert.alert('Recusar convocação', 'Deseja recusar este trabalho?', [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Recusar',
        style: 'destructive',
        onPress: () => updateResponse(assignment, 'declined'),
      },
    ]);
  };

  const renderTabButton = (tab, label, icon) => {
    const selected = activeTab === tab;
    return (
      <TouchableOpacity
        key={tab}
        style={styles.tabButton}
        onPress={() => setActiveTab(tab)}
        activeOpacity={0.75}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        accessibilityLabel={label}
      >
        <View style={[styles.tabIconContainer, selected && styles.tabIconSelected]}>
          <Feather name={icon} size={19} color={selected ? COLORS.textNavy : COLORS.textMuted} />
          {tab === 'home' && pendingAssignments.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{pendingAssignments.length}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const renderHome = () => (
    <>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryNumber}>{pendingAssignments.length}</Text>
        <Text style={styles.summaryLabel}>Convocações pendentes</Text>
      </View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <Text style={styles.sectionTitle}>Convocações</Text>
      {loading ? (
        <ActivityIndicator color={COLORS.buttonGold} style={styles.loader} />
      ) : pendingAssignments.length ? (
        pendingAssignments.map((assignment) => renderAssignment(assignment, true))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Nenhuma convocação pendente</Text>
          <Text style={styles.emptyText}>Quando a empresa convidar você para um evento, ele aparecerá aqui.</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Próximos eventos confirmados</Text>
      {confirmedAssignments.length ? (
        confirmedAssignments.map((assignment) => renderAssignment(assignment, false))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Seus eventos aceitos aparecerão aqui.</Text>
        </View>
      )}
    </>
  );

  const renderEvents = () => {
    const visibleAssignments = assignments.filter((assignment) => assignment.status !== 'declined');
    return (
      <>
        <Text style={styles.sectionTitle}>Meus eventos</Text>
        {loading ? (
          <ActivityIndicator color={COLORS.buttonGold} style={styles.loader} />
        ) : visibleAssignments.length ? (
          visibleAssignments.map((assignment) => renderAssignment(
            assignment,
            assignment.status === 'pending',
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Seus eventos e convocações aparecerão aqui.</Text>
          </View>
        )}
      </>
    );
  };

  const renderAgenda = () => (
    <>
      <Text style={styles.sectionTitle}>Agenda</Text>
      {confirmedAssignments.length ? (
        confirmedAssignments.map((assignment) => renderAssignment(assignment, false))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Seus eventos aceitos aparecerão na agenda.</Text>
        </View>
      )}
    </>
  );

  const renderProfile = () => (
    <>
      <Text style={styles.sectionTitle}>Meu perfil</Text>
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Feather name="user" size={25} color={COLORS.textNavy} />
        </View>
        <Text style={styles.profileName}>{user.name || 'Técnico'}</Text>
        <Text style={styles.profileRole}>Técnico de eventos</Text>
        {!!user.email && <Text style={styles.profileEmail}>{user.email}</Text>}
      </View>
      <TouchableOpacity style={styles.profileLogout} onPress={onLogout} activeOpacity={0.8}>
        <Feather name="log-out" size={17} color={COLORS.textNavy} />
        <Text style={styles.profileLogoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </>
  );

  const renderAssignment = (assignment, showActions) => (
    <View key={assignment.id} style={styles.assignmentCard}>
      <View style={styles.cardHeading}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{assignment.professionalTypeName || 'Convocação'}</Text>
        </View>
        <Text style={styles.statusText}>
          {assignment.status === 'accepted' ? 'Confirmado' : 'Pendente'}
        </Text>
      </View>

      <Text style={styles.eventTitle}>{assignment.eventTitle || 'Evento sem título'}</Text>
      {!!assignment.clientName && <Text style={styles.detailText}>{assignment.clientName}</Text>}
      <Text style={styles.detailText}>{formatDate(assignment.eventDate)}</Text>
      {!!assignment.eventAddress && <Text style={styles.detailText}>{assignment.eventAddress}</Text>}
      {!!assignment.roleName && <Text style={styles.roleText}>Função: {assignment.roleName}</Text>}

      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => confirmDecline(assignment)}
            disabled={respondingId === assignment.id}
            activeOpacity={0.8}
          >
            <Text style={styles.declineButtonText}>Recusar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => updateResponse(assignment, 'accepted')}
            disabled={respondingId === assignment.id}
            activeOpacity={0.8}
          >
            {respondingId === assignment.id ? (
              <ActivityIndicator size="small" color={COLORS.textNavy} />
            ) : (
              <Text style={styles.acceptButtonText}>Aceitar</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.brand}>Celebra <Text style={styles.star}>✦</Text></Text>
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.greeting}>Olá, {user.name || 'técnico'}!</Text>
        <Text style={styles.subtitle}>Acompanhe suas convocações e eventos</Text>
      </View>

      <ScrollView
        style={styles.mainContent}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'home' && renderHome()}
        {activeTab === 'events' && renderEvents()}
        {activeTab === 'agenda' && renderAgenda()}
        {activeTab === 'profile' && renderProfile()}
      </ScrollView>

      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {renderTabButton('home', 'Início', 'home')}
        {renderTabButton('events', 'Eventos', 'grid')}
        {renderTabButton('agenda', 'Agenda', 'calendar')}
        {renderTabButton('profile', 'Perfil', 'user')}
      </View>
    </View>
  );
}
