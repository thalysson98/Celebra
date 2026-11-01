// src/telas/tecnico/TelaPainelTecnico.js

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../tema/cores';
import { subscribeToTechnicianAssignments, respondToAssignment } from '../../servicos/servicoEscala';
import { requestPasswordReset } from '../../servicos/servicoAutenticacao';
import { setUserEventsNotificationPreference, updateUserProfile } from '../../servicos/servicoUsuario';
import {
  markTechnicianUnavailable,
  removeTechnicianUnavailability,
  subscribeToTechnicianUnavailability,
} from '../../servicos/servicoIndisponibilidade';
import { estilosPainelTecnico as styles } from '../../estilos/estilosPainelTecnico';

function formatDate(value) {
  if (!value) return 'Data a confirmar';
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data a confirmar';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function toDate(value) {
  if (!value) return null;
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatUpcomingDetails(assignment) {
  const date = toDate(assignment.eventDate);
  if (!date) return assignment.eventAddress || 'Data a confirmar';
  const dayAndMonth = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
  }).format(date).replace(' de ', ' ').replace('.', '');
  const time = `${date.getHours()}h`;
  const location = assignment.eventAddress || 'Local a confirmar';
  return `${dayAndMonth} • ${time} • ${location}`;
}

function formatDaysUntil(value) {
  const date = toDate(value);
  if (!date) return 'Data a confirmar';
  const days = Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000));
  return days === 0 ? 'Hoje' : `Em ${days} dias`;
}

function normalizeSearch(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function formatCpf(value) {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function getInitials(value) {
  return String(value || 'Técnico')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('pt-BR');
}

function getLocalDateKey(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatAgendaDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(value);
}

function formatShortDate(value) {
  const date = toDate(value);
  if (!date) return 'Data a confirmar';
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })
    .format(date)
    .replace(' de ', ' ')
    .replace('.', '');
}

function formatEventTime(value) {
  const date = toDate(value);
  return date ? `${date.getHours()}h` : 'Horário a confirmar';
}

export default function TelaPainelTecnico({ navigation, user, onLogout }) {
  const insets = useSafeAreaInsets();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState('home');
  const [eventFilter, setEventFilter] = useState('mine');
  const [eventSearch, setEventSearch] = useState('');

  const [profile, setProfile] = useState(() => ({
    ...user,
    displayName: user.name || user.displayName || '',
  }));
  const [profileForm, setProfileForm] = useState({ displayName: '', cpf: '', phone: '', city: '' });
  const [isProfileEditorVisible, setProfileEditorVisible] = useState(false);
  const [isSavingProfile, setSavingProfile] = useState(false);
  const [eventsNotificationsEnabled, setEventsNotificationsEnabled] = useState(
    user.notificationPreferences?.eventsAndTeam ?? true,
  );
  const [isSavingNotificationPreference, setSavingNotificationPreference] = useState(false);
  const [agendaMonth, setAgendaMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedAgendaDay, setSelectedAgendaDay] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [isAgendaDaySelected, setAgendaDaySelected] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState('');
  const [isUpdatingAvailability, setUpdatingAvailability] = useState(false);
  const [isAvailabilityDialogVisible, setAvailabilityDialogVisible] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToTechnicianAssignments(
      user.uid,
      (nextAssignments) => {
        setAssignments(nextAssignments || []);
        setError('');
        setLoading(false);
      },
      () => {
        setError('Não foi possível carregar suas convocações. Tente novamente mais tarde.');
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [user.uid]);

  useEffect(() => {
    setAvailabilityLoading(true);
    const unsubscribe = subscribeToTechnicianUnavailability(
      user.uid,
      (dates) => {
        setUnavailableDates(dates || []);
        setAvailabilityError('');
        setAvailabilityLoading(false);
      },
      () => {
        setAvailabilityError('Não foi possível carregar suas indisponibilidades.');
        setAvailabilityLoading(false);
      },
    );
    return unsubscribe;
  }, [user.uid]);

  const pendingAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === 'pending'),
    [assignments],
  );
  const confirmedAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === 'accepted'),
    [assignments],
  );
  const upcomingAssignments = useMemo(() => {
    const now = Date.now();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);
    return confirmedAssignments
      .filter((assignment) => {
        const date = toDate(assignment.eventDate);
        return date && date.getTime() >= now && date.getTime() <= nextWeek.getTime();
      })
      .sort((first, second) => toDate(first.eventDate) - toDate(second.eventDate));
  }, [confirmedAssignments]);

  const allAssignmentsForAgenda = useMemo(
    () => assignments.filter((a) => a.status === 'accepted' || a.status === 'pending'),
    [assignments]
  );

  const selectedAgendaDateKey = getLocalDateKey(selectedAgendaDay);
  
  const selectedDayAssignments = allAssignmentsForAgenda.filter((assignment) => {
    const date = toDate(assignment.eventDate);
    return date && getLocalDateKey(date) === selectedAgendaDateKey;
  });
  
  const selectedDateUnavailable = unavailableDates.some((item) => item.dateKey === selectedAgendaDateKey);

  const updateResponse = async (assignment, status) => {
    try {
      await respondToAssignment({
        assignmentId: assignment.id,
        technicianUid: user.uid,
        status,
      });
    } catch (responseError) {
      Alert.alert('Não foi possível responder', responseError.message);
    }
  };

  const confirmDecline = (assignment) => {
    Alert.alert('Recusar convocação', 'Deseja recusar este trabalho?', [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Recusar',
        style: 'destructive',
        onPress: () => updateResponse(assignment, 'declined'),
      },
    ]);
  };

  const openProfileEditor = () => {
    setProfileForm({
      displayName: profile.displayName || profile.name || '',
      cpf: formatCpf(profile.cpf),
      phone: formatPhone(profile.phone),
      city: profile.city || '',
    });
    setProfileEditorVisible(true);
  };

  const saveProfile = async () => {
    if (!profileForm.displayName.trim()) {
      Alert.alert('Campo obrigatório', 'Informe seu nome para exibição.');
      return;
    }
    setSavingProfile(true);
    try {
      const savedFields = await updateUserProfile(user.uid, profileForm);
      setProfile((current) => ({ ...current, ...savedFields, name: savedFields.displayName }));
      setProfileEditorVisible(false);
      Alert.alert('Perfil atualizado', 'Seus dados foram salvos com sucesso.');
    } catch (saveError) {
      Alert.alert('Não foi possível salvar', saveError.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const changeEventsNotificationPreference = async (enabled) => {
    const previousValue = eventsNotificationsEnabled;
    setEventsNotificationsEnabled(enabled);
    setSavingNotificationPreference(true);
    try {
      await setUserEventsNotificationPreference(user.uid, enabled);
      setProfile((current) => ({
        ...current,
        notificationPreferences: {
          ...(current.notificationPreferences || {}),
          eventsAndTeam: enabled,
        },
      }));
    } catch (preferenceError) {
      setEventsNotificationsEnabled(previousValue);
      Alert.alert('Não foi possível atualizar', preferenceError.message);
    } finally {
      setSavingNotificationPreference(false);
    }
  };

  const sendPasswordReset = async () => {
    if (!profile.email) {
      Alert.alert('E-mail indisponível', 'Esta conta não possui um e-mail para redefinição.');
      return;
    }
    try {
      await requestPasswordReset(profile.email);
      Alert.alert('E-mail enviado', `Enviamos um link de redefinição para ${profile.email}.`);
    } catch (resetError) {
      Alert.alert('Não foi possível enviar', resetError.message);
    }
  };

  const changeAgendaMonth = (amount) => {
    const nextMonth = new Date(agendaMonth.getFullYear(), agendaMonth.getMonth() + amount, 1);
    setAgendaMonth(nextMonth);
    setSelectedAgendaDay(nextMonth);
    setAgendaDaySelected(false);
  };

  const openAvailabilityDialog = () => {
    if (!selectedDateUnavailable && selectedDayAssignments.some(a => a.status === 'accepted')) {
      Alert.alert('Data com compromisso', 'Você tem um evento aceito neste dia.');
      return;
    }
    setAvailabilityDialogVisible(true);
  };

  const confirmAvailabilityChange = async () => {
    setUpdatingAvailability(true);
    try {
      if (selectedDateUnavailable) {
        await removeTechnicianUnavailability(user.uid, selectedAgendaDay);
      } else {
        await markTechnicianUnavailable(user.uid, selectedAgendaDay);
      }
      setAvailabilityDialogVisible(false);
    } catch (changeError) {
      Alert.alert('Não foi possível atualizar a agenda', changeError.message);
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const openEventDetails = (assignment) => {
    const serializableAssignment = {
      ...assignment,
      eventDate: toDate(assignment.eventDate)?.toISOString() || null,
      inviteDate: toDate(assignment.inviteDate)?.toISOString() || null,
      respondedAt: toDate(assignment.respondedAt)?.toISOString() || null,
    };
    navigation.navigate('TechnicianEventDetails', { assignment: serializableAssignment });
  };

  const renderAgenda = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(agendaMonth.getFullYear(), agendaMonth.getMonth(), 1);
    const daysInMonth = new Date(agendaMonth.getFullYear(), agendaMonth.getMonth() + 1, 0).getDate();
    const leadingDays = firstDayOfMonth.getDay();
    const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;

    const calendarDays = Array.from({ length: totalCells }, (_, index) => {
      const date = new Date(agendaMonth.getFullYear(), agendaMonth.getMonth(), index - leadingDays + 1);
      const dateKey = getLocalDateKey(date);
      
      const dayAssignments = allAssignmentsForAgenda.filter(a => {
        const evDate = toDate(a.eventDate);
        return evDate && getLocalDateKey(evDate) === dateKey;
      });

      return {
        date,
        dateKey,
        inCurrentMonth: date.getMonth() === agendaMonth.getMonth(),
        selected: dateKey === selectedAgendaDateKey,
        isToday: dateKey === getLocalDateKey(today),
        unavailable: unavailableDates.some(item => item.dateKey === dateKey),
        hasConfirmed: dayAssignments.some(a => a.status === 'accepted'),
        hasPending: dayAssignments.some(a => a.status === 'pending'),
      };
    });

    const monthTitle = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(agendaMonth);
    const monthTitleCapitalized = `${monthTitle.charAt(0).toLocaleUpperCase('pt-BR')}${monthTitle.slice(1)}`;

    return (
      <View style={{ marginTop: 24 }}>
        <Text style={styles.sectionTitle}>Sua Agenda</Text>
        <View style={styles.agendaCalendarCard}>
          <View style={styles.agendaCalendarHeader}>
            <Text style={styles.agendaMonthTitle}>{monthTitleCapitalized}</Text>
            <View style={styles.agendaMonthControls}>
              <TouchableOpacity style={styles.agendaMonthButton} onPress={() => changeAgendaMonth(-1)}>
                <Feather name="chevron-left" size={18} color={COLORS.textNavy} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.agendaMonthButton} onPress={() => changeAgendaMonth(1)}>
                <Feather name="chevron-right" size={18} color={COLORS.textNavy} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.agendaWeekdays}>
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <Text key={day} style={styles.agendaWeekday}>{day}</Text>)}
          </View>
          <View style={styles.agendaCalendarGrid}>
            {calendarDays.map((day) => (
              <TouchableOpacity
                key={day.dateKey}
                style={styles.agendaDayCell}
                onPress={() => {
                  setSelectedAgendaDay(day.date);
                  setAgendaDaySelected(true);
                  if (day.date.getMonth() !== agendaMonth.getMonth()) {
                    setAgendaMonth(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
                  }
                }}
              >
                <View style={[
                  styles.agendaDayCircle,
                  !day.inCurrentMonth && styles.agendaDayOutsideMonth,
                  day.isToday && !day.selected && styles.agendaDayToday,
                  day.unavailable && !day.selected && styles.agendaDayUnavailable,
                  day.hasConfirmed && !day.selected && styles.agendaDayConfirmed, // Fundo circular preenchido
                  day.hasPending && !day.selected && styles.agendaDayPending,     // Fundo circular preenchido
                  day.selected && styles.agendaDaySelected, // Se selecionado vira borda amarela
                ]}>
                  <Text style={[
                    styles.agendaDayNumber, 
                    !day.inCurrentMonth && styles.agendaDayNumberOutside, 
                    (day.hasConfirmed || day.hasPending || day.unavailable) && !day.selected && styles.agendaDayNumberEvent, 
                    day.selected && styles.agendaDayNumberSelected
                  ]}>
                    {day.date.getDate()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.agendaLegend}>
            <View style={[styles.agendaLegendDot, styles.agendaLegendEvent]} />
            <Text style={styles.agendaLegendText}>Confirmado</Text>
            <View style={[styles.agendaLegendDot, styles.agendaLegendPending]} />
            <Text style={styles.agendaLegendText}>Pendente</Text>
            <View style={[styles.agendaLegendDot, styles.agendaLegendUnavailable]} />
            <Text style={styles.agendaLegendText}>Indisponível</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.agendaAvailabilityButton, selectedDayAssignments.some(a => a.status === 'accepted') && !selectedDateUnavailable && styles.agendaAvailabilityDisabled]}
          onPress={openAvailabilityDialog}
          disabled={selectedDayAssignments.some(a => a.status === 'accepted') && !selectedDateUnavailable}
        >
          <Feather name={selectedDateUnavailable ? 'x-circle' : 'slash'} size={15} color={COLORS.textWhite} />
          <Text style={styles.agendaAvailabilityButtonText}>
            {selectedDateUnavailable ? 'Remover indisponibilidade' : 'Adicionar indisponibilidade'}
          </Text>
        </TouchableOpacity>

        {availabilityError ? <Text style={styles.errorText}>{availabilityError}</Text> : null}

        {isAgendaDaySelected && selectedDayAssignments.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.agendaSectionTitle}>Eventos do dia</Text>
            <View style={styles.agendaEventList}>
              {selectedDayAssignments.map((assignment) => (
                <TouchableOpacity key={assignment.id} style={styles.agendaEventCard} onPress={() => openEventDetails(assignment)}>
                  <View style={styles.agendaEventIcon}><Feather name="calendar" size={16} color={COLORS.textNavy} /></View>
                  <View style={styles.agendaEventDetails}>
                    <Text style={styles.agendaEventTitle}>{formatShortDate(assignment.eventDate)} • {assignment.eventTitle}</Text>
                    <Text style={styles.agendaEventSubtitle}>{formatEventTime(assignment.eventDate)} • {assignment.eventAddress}</Text>
                  </View>
                  <View>
                    <Text style={[styles.eventStatusText, assignment.status === 'pending' && styles.eventStatusPendingText]}>
                      {assignment.status === 'accepted' ? 'Confirmado' : 'Pendente'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderHome = () => (
    <>
      <View style={styles.summaryRow}>
        <TouchableOpacity 
          style={styles.summaryCard} 
          onPress={() => { setEventFilter('pending'); setActiveTab('events'); }}
          activeOpacity={0.8}
        >
          <Text style={styles.summaryNumber}>{pendingAssignments.length}</Text>
          <Text style={styles.summaryLabel}>Eventos pendentes de aprovação</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.summaryCard}
          onPress={() => { setEventFilter('mine'); setActiveTab('events'); }}
          activeOpacity={0.8}
        >
          <Text style={styles.summaryNumber}>{confirmedAssignments.length}</Text>
          <Text style={styles.summaryLabel}>Seus eventos aceitos</Text>
        </TouchableOpacity>
      </View>
      
      {renderAgenda()}
    </>
  );

  const renderEvents = () => {
    const eventFilters = [
      { key: 'mine', label: 'Seus eventos aceitos' },
      { key: 'pending', label: 'Pendentes' },
    ];
    
    const statusByFilter = { mine: 'accepted', pending: 'pending' };
    
    const searchTerms = normalizeSearch(eventSearch).split(/\s+/).filter(Boolean);
    
    const visibleAssignments = assignments
      .filter((assignment) => assignment.status === statusByFilter[eventFilter])
      .filter((assignment) => {
        if (searchTerms.length === 0) return true;
        const combinedString = normalizeSearch([
          assignment.eventTitle,
          assignment.clientName,
          assignment.eventTypeName,
          assignment.professionalTypeName,
          assignment.eventAddress,
        ].filter(Boolean).join(' '));
        
        return searchTerms.every(term => combinedString.includes(term));
      })
      .sort((first, second) => (toDate(first.eventDate)?.getTime() || 0) - (toDate(second.eventDate)?.getTime() || 0));
    
    const monthLabel = visibleAssignments.length
      ? new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
        toDate(visibleAssignments[0].eventDate) || new Date(),
      )
      : '';

    return (
      <>
        <View style={styles.eventSearchBox}>
          <Feather name="search" size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.eventSearchInput}
            value={eventSearch}
            onChangeText={setEventSearch}
            placeholder="Buscar evento ou protagonista"
            placeholderTextColor={COLORS.textMuted}
            accessibilityLabel="Buscar evento ou protagonista"
            returnKeyType="search"
          />
        </View>
        <View style={styles.eventFilters}>
          {eventFilters.map((filter) => {
            const selected = eventFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[styles.eventFilterChip, selected && styles.eventFilterChipSelected]}
                onPress={() => setEventFilter(filter.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.eventFilterText, selected && styles.eventFilterTextSelected]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {loading ? (
          <ActivityIndicator color={COLORS.buttonGold} style={styles.loader} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : visibleAssignments.length ? (
          <>
            <Text style={styles.eventMonthLabel}>{monthLabel}</Text>
            {visibleAssignments.map((assignment) => renderEventCard(assignment))}
          </>
        ) : (
          <View style={styles.eventEmptyCard}>
            <View style={styles.eventEmptyIcon}>
              <Feather name="calendar" size={22} color={COLORS.textNavy} />
            </View>
            <Text style={styles.emptyTitle}>
              {eventFilter === 'pending'
                ? 'Nenhuma convocação pendente'
                : 'Você ainda não tem eventos aceitos'}
            </Text>
            <Text style={styles.emptyText}>
              Quando houver eventos nesta categoria, eles aparecerão aqui.
            </Text>
          </View>
        )}
      </>
    );
  };

  const renderEventCard = (assignment) => {
    const eventType = assignment.eventTypeName || assignment.professionalTypeName || 'Evento';
    const eventIcon = /casamento/i.test(eventType)
      ? 'heart'
      : /aniversário|15 anos/i.test(eventType)
        ? 'gift'
        : /formatura/i.test(eventType)
          ? 'award'
          : 'camera';
    return (
      <TouchableOpacity
        key={assignment.id}
        style={styles.eventCard}
        onPress={() => openEventDetails(assignment)}
        activeOpacity={0.9}
        accessibilityRole="button"
      >
        <View style={[
          styles.eventCover,
          styles[`eventCover${eventIcon[0].toUpperCase()}${eventIcon.slice(1)}`],
        ]}>
          <View style={styles.eventCoverIcon}>
            <Feather name={eventIcon} size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.eventCoverType}>{eventType}</Text>
        </View>
        <View style={styles.eventCardContent}>
          <View style={styles.eventCardTitleRow}>
            <View style={styles.eventCardTitleBlock}>
              <Text style={styles.eventCardTitle} numberOfLines={1}>
                {assignment.eventTitle || 'Evento sem título'}
              </Text>
              {!!assignment.clientName && (
                <Text style={styles.eventCardClient} numberOfLines={1}>{assignment.clientName}</Text>
              )}
            </View>
            <Feather name="chevron-right" size={18} color={COLORS.textNavy} />
          </View>
          <View style={styles.eventMetadata}>
            <View style={styles.eventMetadataItem}>
              <Feather name="calendar" size={16} color={COLORS.textNavy} />
              <Text style={styles.eventMetadataTextLarge}>{formatShortDate(assignment.eventDate)}</Text>
            </View>
            <View style={styles.eventMetadataItem}>
              <Feather name="clock" size={16} color={COLORS.textNavy} />
              <Text style={styles.eventMetadataTextLarge}>{formatEventTime(assignment.eventDate)}</Text>
            </View>
            {/* Endereço removido daqui */}
          </View>
          <View style={styles.eventCardFooter}>
            <View style={styles.eventRole}>
              <Feather name="video" size={14} color="#168D78" />
              <Text style={styles.eventRoleText} numberOfLines={1}>
                Função: {assignment.roleName || assignment.professionalTypeName || 'Equipe'}
              </Text>
            </View>
            <View style={[styles.eventStatus, assignment.status === 'pending' && styles.eventStatusPending]}>
              <Text style={[styles.eventStatusText, assignment.status === 'pending' && styles.eventStatusPendingText]}>
                {assignment.status === 'accepted' ? 'Aceito' : 'Pendente'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderProfile = () => (
    <>
      <View style={styles.userProfileCard}>
        <View style={styles.userProfileHeading}>
          <View style={styles.userProfileAvatar}>
            <Text style={styles.userProfileInitials}>{getInitials(profile.displayName || profile.name || user.name)}</Text>
          </View>
          <View style={styles.userProfileHeadingCopy}>
            <Text style={styles.userProfileName} numberOfLines={1}>
              {profile.displayName || profile.name || 'Técnico'}
            </Text>
            <Text style={styles.userProfileCompany} numberOfLines={1}>
              {profile.companyName || 'Técnico de eventos'}
            </Text>
          </View>
        </View>
        <View style={styles.profileDivider} />
        <Text style={styles.userProfileDetail}>CPF: {profile.cpf ? formatCpf(profile.cpf) : 'Não informado'}</Text>
        <Text style={styles.userProfileDetail} numberOfLines={1}>{profile.email || 'E-mail não informado'}</Text>
        <Text style={styles.userProfileDetail} numberOfLines={1}>
          {[profile.city, profile.phone ? formatPhone(profile.phone) : null].filter(Boolean).join(' • ') || 'Cidade e telefone não informados'}
        </Text>
        <TouchableOpacity style={styles.editProfileButton} onPress={openProfileEditor} activeOpacity={0.8}>
          <Feather name="edit-2" size={15} color={COLORS.textNavy} />
          <Text style={styles.editProfileButtonText}>Editar seus dados</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.profileSectionTitle}>Notificações</Text>
      <View style={styles.profilePreferenceCard}>
        <View style={styles.profilePreferenceCopy}>
          <Text style={styles.profilePreferenceTitle}>Eventos e equipe</Text>
          <Text style={styles.profilePreferenceSubtitle}>Pendências e eventos</Text>
        </View>
        {isSavingNotificationPreference ? (
          <ActivityIndicator size="small" color={COLORS.buttonGold} />
        ) : (
          <Switch
            value={eventsNotificationsEnabled}
            onValueChange={changeEventsNotificationPreference}
            trackColor={{ false: '#CAD5E2', true: COLORS.buttonGold }}
            thumbColor="#FFFFFF"
            accessibilityLabel="Notificações de eventos e equipe"
          />
        )}
      </View>
      <Text style={styles.profileSectionTitle}>Configurações</Text>
      <TouchableOpacity style={styles.profileSecurityCard} onPress={sendPasswordReset} activeOpacity={0.8}>
        <View style={styles.profileSecurityIcon}>
          <Feather name="shield" size={17} color="#14966F" />
        </View>
        <View style={styles.profilePreferenceCopy}>
          <Text style={styles.profilePreferenceTitle}>Segurança da conta</Text>
          <Text style={styles.profilePreferenceSubtitle}>Senha e autenticação</Text>
        </View>
        <Feather name="chevron-right" size={17} color={COLORS.textMuted} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.profileLogout} onPress={onLogout} activeOpacity={0.8}>
        <Feather name="log-out" size={16} color="#FFFFFF" />
        <Text style={styles.profileLogoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </>
  );

 const renderTabButton = (tab, label, icon) => {
    const selected = activeTab === tab;
    return (
      <TouchableOpacity
        key={tab}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 }}
        onPress={() => setActiveTab(tab)}
      >
        <View style={selected ? { backgroundColor: '#FCE082', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, minHeight: 36, justifyContent: 'center', alignItems: 'center' } : { paddingHorizontal: 16, paddingVertical: 6, minHeight: 36, justifyContent: 'center', alignItems: 'center' }}>
          <Feather name={icon} size={22} color={selected ? COLORS.textNavy : COLORS.textSubtle} />
          {tab === 'home' && pendingAssignments.length > 0 && (
            <View style={{ position: 'absolute', top: -3, right: 4, minWidth: 14, height: 14, borderRadius: 7, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: 'bold' }}>{pendingAssignments.length}</Text>
            </View>
          )}
        </View>
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: selected ? COLORS.textNavy : COLORS.textSubtle, marginTop: 4 }}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.homeHeaderRow}>
          <Text style={styles.greeting}>
            {activeTab === 'home'
              ? `Olá, ${user.name || 'Técnico'}!`
              : { events: 'Eventos', profile: 'Perfil' }[activeTab]}
          </Text>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notificacoes')}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Notificações"
          >
            <Feather name="bell" size={18} color={COLORS.textWhite} />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView
        style={styles.mainContent}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'home' && renderHome()}
        {activeTab === 'events' && renderEvents()}
        {activeTab === 'profile' && renderProfile()}
      </ScrollView>

      <Modal
        visible={isProfileEditorVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileEditorVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.profileModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.profileEditorCard}>
            <View style={styles.profileEditorHeading}>
              <Text style={styles.profileEditorTitle}>Editar seus dados</Text>
              <TouchableOpacity
                onPress={() => setProfileEditorVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar edição do perfil"
              >
                <Feather name="x" size={21} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.profileFieldLabel}>Nome</Text>
            <TextInput
              style={styles.profileFieldInput}
              value={profileForm.displayName}
              onChangeText={(displayName) => setProfileForm((current) => ({ ...current, displayName }))}
              placeholder="Seu nome"
              placeholderTextColor={COLORS.textMuted}
              maxLength={100}
              autoCapitalize="words"
            />
            <Text style={styles.profileFieldLabel}>CPF</Text>
            <TextInput
              style={styles.profileFieldInput}
              value={profileForm.cpf}
              onChangeText={(cpf) => setProfileForm((current) => ({ ...current, cpf: formatCpf(cpf) }))}
              placeholder="000.000.000-00"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
            />
            <Text style={styles.profileFieldLabel}>Telefone</Text>
            <TextInput
              style={styles.profileFieldInput}
              value={profileForm.phone}
              onChangeText={(phone) => setProfileForm((current) => ({ ...current, phone: formatPhone(phone) }))}
              placeholder="(00) 00000-0000"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
            />
            <Text style={styles.profileFieldLabel}>Cidade</Text>
            <TextInput
              style={styles.profileFieldInput}
              value={profileForm.city}
              onChangeText={(city) => setProfileForm((current) => ({ ...current, city }))}
              placeholder="Sua cidade"
              placeholderTextColor={COLORS.textMuted}
              maxLength={100}
              autoCapitalize="words"
            />
            <Text style={styles.profileEmailNote}>O e-mail da conta não pode ser alterado por esta tela.</Text>
            <View style={styles.profileEditorActions}>
              <TouchableOpacity
                style={styles.profileCancelButton}
                onPress={() => setProfileEditorVisible(false)}
                disabled={isSavingProfile}
                activeOpacity={0.8}
              >
                <Text style={styles.profileCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.profileSaveButton}
                onPress={saveProfile}
                disabled={isSavingProfile}
                activeOpacity={0.8}
              >
                {isSavingProfile ? (
                  <ActivityIndicator size="small" color={COLORS.textNavy} />
                ) : (
                  <Text style={styles.profileSaveButtonText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={isAvailabilityDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAvailabilityDialogVisible(false)}
      >
        <View style={styles.profileModalOverlay}>
          <View style={styles.availabilityDialogCard}>
            <View style={styles.profileSecurityIcon}>
              <Feather name={selectedDateUnavailable ? 'calendar' : 'slash'} size={19} color={COLORS.textNavy} />
            </View>
            <Text style={styles.availabilityDialogTitle}>
              {selectedDateUnavailable ? 'Remover indisponibilidade?' : 'Adicionar indisponibilidade?'}
            </Text>
            <Text style={styles.availabilityDialogMessage}>
              {selectedDateUnavailable
                ? `Você ficará disponível em ${formatAgendaDate(selectedAgendaDay)}.`
                : `Você ficará indisponível em ${formatAgendaDate(selectedAgendaDay)}.`}
            </Text>
            <View style={styles.profileEditorActions}>
              <TouchableOpacity
                style={styles.profileCancelButton}
                onPress={() => setAvailabilityDialogVisible(false)}
                disabled={isUpdatingAvailability}
                activeOpacity={0.8}
              >
                <Text style={styles.profileCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.profileSaveButton}
                onPress={confirmAvailabilityChange}
                disabled={isUpdatingAvailability}
                activeOpacity={0.8}
              >
                {isUpdatingAvailability ? (
                  <ActivityIndicator size="small" color={COLORS.textNavy} />
                ) : (
                  <Text style={styles.profileSaveButtonText}>
                    {selectedDateUnavailable ? 'Remover' : 'Confirmar'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

  
      <View style={{ 
        flexDirection: 'row', 
        backgroundColor: '#FFFFFF', 
        borderTopColor: COLORS.cardDivider, 
        borderTopWidth: 1, 
        height: Platform.OS === 'ios' ? 84 : 74, 
        paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 6),
        paddingTop: 8 
      }}>
        {renderTabButton('home', 'Início', 'home')}
        {renderTabButton('events', 'Eventos', 'tag')}
        {renderTabButton('profile', 'Perfil', 'user')}
      </View>
    </View>
  );
}