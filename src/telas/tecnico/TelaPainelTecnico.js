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
import { styles } from '../../estilos/estilosPainelTecnico';

// Caminho corrigido (mesma pasta technician):
import TelaDetalhesEventoTecnico from './TelaDetalhesEventoTecnico';

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
  return `${dayAndMonth} â€¢ ${time} â€¢ ${location}`;
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
  return String(value || 'TÃ©cnico')
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

export default function TelaPainelTecnico({ user, onLogout }) {
  const insets = useSafeAreaInsets();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [respondingId, setRespondingId] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailsSection, setDetailsSection] = useState('general');
  const [detailsReturnTab, setDetailsReturnTab] = useState('events');
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
        setError('NÃ£o foi possÃ­vel carregar suas convocaÃ§Ãµes. Tente novamente mais tarde.');
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
        setAvailabilityError('NÃ£o foi possÃ­vel carregar suas indisponibilidades.');
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

  const updateResponse = async (assignment, status) => {
    setRespondingId(assignment.id);
    try {
      await respondToAssignment({
        assignmentId: assignment.id,
        technicianUid: user.uid,
        status,
      });
    } catch (responseError) {
      Alert.alert('NÃ£o foi possÃ­vel responder', responseError.message);
    } finally {
      setRespondingId(null);
    }
  };

  const confirmDecline = (assignment) => {
    Alert.alert('Recusar convocaÃ§Ã£o', 'Deseja recusar este trabalho?', [
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
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{pendingAssignments.length}</Text>
          <Text style={styles.summaryLabel}>Eventos pendentes de aprovaÃ§Ã£o</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{confirmedAssignments.length}</Text>
          <Text style={styles.summaryLabel}>Seus eventos aceitos</Text>
        </View>
      </View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      {loading ? (
        <ActivityIndicator color={COLORS.buttonGold} style={styles.loader} />
      ) : (
        <>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>PrÃ³ximos 7 dias</Text>
            <TouchableOpacity
              onPress={() => setActiveTab('agenda')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Ver agenda completa"
            >
              <Text style={styles.sectionAction}>Ver agenda</Text>
            </TouchableOpacity>
          </View>

          {upcomingAssignments.length ? (
            <>
              {renderFeaturedEvent(upcomingAssignments[0])}
              {upcomingAssignments.length > 1 && (
                <View style={styles.upcomingList}>
                  {upcomingAssignments.slice(1).map((assignment, index) => (
                    <TouchableOpacity
                      key={assignment.id}
                      style={[
                        styles.upcomingRow,
                        index < upcomingAssignments.length - 2 && styles.upcomingRowDivider,
                      ]}
                      onPress={() => openEventDetails(assignment)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.upcomingIcon}>
                        <Feather name="calendar" size={16} color={COLORS.textNavy} />
                      </View>
                      <View style={styles.upcomingDetails}>
                        <Text style={styles.upcomingTitle} numberOfLines={1}>
                          {formatShortDate(assignment.eventDate)} Â· {assignment.eventTitle || 'Evento'}
                        </Text>
                        <Text style={styles.upcomingSubtitle} numberOfLines={1}>
                          {formatEventTime(assignment.eventDate)} â€¢ {assignment.eventAddress || 'Local a confirmar'}
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nenhum evento nos prÃ³ximos 7 dias</Text>
              <Text style={styles.emptyText}>Seus eventos aceitos aparecerÃ£o aqui.</Text>
            </View>
          )}
        </>
      )}
    </>
  );

  const renderFeaturedEvent = (assignment) => (
    <TouchableOpacity
      style={styles.featuredEvent}
      onPress={() => openEventDetails(assignment)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Ver detalhes do evento ${assignment.eventTitle || ''}`}
    >
      <View style={styles.featuredCover}>
        <View style={styles.coverSun} />
        <View style={[styles.coverTree, styles.coverTreeLeft]} />
        <View style={[styles.coverTree, styles.coverTreeRight]} />
        <View style={styles.coverCouple}>
          <View style={styles.coverPersonOne}>
            <View style={styles.coverHead} />
            <View style={styles.coverBody} />
          </View>
          <View style={styles.coverPersonTwo}>
            <View style={styles.coverHead} />
            <View style={[styles.coverBody, styles.coverBodyGold]} />
          </View>
        </View>
      </View>
      <View style={styles.featuredDetails}>
        <View style={styles.featuredBadges}>
          <Text style={styles.eventTypeBadge}>{assignment.eventTypeName || assignment.professionalTypeName || 'Evento'}</Text>
          <Text style={styles.daysBadge}>{formatDaysUntil(assignment.eventDate)}</Text>
        </View>
        <Text style={styles.featuredTitle} numberOfLines={1}>{assignment.eventTitle || 'Evento'}</Text>
        <Text style={styles.featuredMeta} numberOfLines={1}>{formatUpcomingDetails(assignment)}</Text>
      </View>
    </TouchableOpacity>
  );

  const formatShortDate = (value) => {
    const date = toDate(value);
    if (!date) return 'Data a confirmar';
    return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })
      .format(date)
      .replace(' de ', ' ')
      .replace('.', '');
  };

  const formatEventTime = (value) => {
    const date = toDate(value);
    return date ? `${date.getHours()}h` : 'HorÃ¡rio a confirmar';
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
      Alert.alert('Campo obrigatÃ³rio', 'Informe seu nome para exibiÃ§Ã£o.');
      return;
    }

    setSavingProfile(true);
    try {
      const savedFields = await updateUserProfile(user.uid, profileForm);
      setProfile((current) => ({ ...current, ...savedFields, name: savedFields.displayName }));
      setProfileEditorVisible(false);
      Alert.alert('Perfil atualizado', 'Seus dados foram salvos com sucesso.');
    } catch (saveError) {
      Alert.alert('NÃ£o foi possÃ­vel salvar', saveError.message);
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
      Alert.alert('NÃ£o foi possÃ­vel atualizar', preferenceError.message);
    } finally {
      setSavingNotificationPreference(false);
    }
  };

  const sendPasswordReset = async () => {
    if (!profile.email) {
      Alert.alert('E-mail indisponÃ­vel', 'Esta conta nÃ£o possui um e-mail para redefiniÃ§Ã£o.');
      return;
    }

    try {
      await requestPasswordReset(profile.email);
      Alert.alert('E-mail enviado', `Enviamos um link de redefiniÃ§Ã£o para ${profile.email}.`);
    } catch (resetError) {
      Alert.alert('NÃ£o foi possÃ­vel enviar', resetError.message);
    }
  };

  const selectedAgendaDateKey = getLocalDateKey(selectedAgendaDay);
  const selectedDayAssignments = confirmedAssignments.filter((assignment) => {
    const date = toDate(assignment.eventDate);
    return date && getLocalDateKey(date) === selectedAgendaDateKey;
  });
  const selectedDateUnavailable = unavailableDates.some((item) => item.dateKey === selectedAgendaDateKey);

  const changeAgendaMonth = (amount) => {
    const nextMonth = new Date(agendaMonth.getFullYear(), agendaMonth.getMonth() + amount, 1);
    setAgendaMonth(nextMonth);
    setSelectedAgendaDay(nextMonth);
    setAgendaDaySelected(false);
  };

  const openAvailabilityDialog = () => {
    if (!selectedDateUnavailable && selectedDayAssignments.length) {
      Alert.alert('Data com compromisso', 'VocÃª jÃ¡ tem um evento aceito neste dia.');
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
      Alert.alert('NÃ£o foi possÃ­vel atualizar a agenda', changeError.message);
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const openEventDetails = (assignment) => {
    setDetailsReturnTab(activeTab);
    setDetailsSection('general');
    setSelectedEvent(assignment);
  };

  const closeEventDetails = () => {
    setSelectedEvent(null);
    setActiveTab(detailsReturnTab);
  };

  const renderEvents = () => {
    const eventFilters = [
      { key: 'mine', label: 'Seus eventos' },
      { key: 'pending', label: 'Pendentes' },
      { key: 'available', label: 'DisponÃ­veis' },
    ];
    const statusByFilter = { mine: 'accepted', pending: 'pending' };
    const normalizedSearch = normalizeSearch(eventSearch);
    const visibleAssignments = eventFilter === 'available'
      ? []
      : assignments
        .filter((assignment) => assignment.status === statusByFilter[eventFilter])
        .filter((assignment) => normalizeSearch([
          assignment.eventTitle,
          assignment.clientName,
          assignment.eventTypeName,
          assignment.professionalTypeName,
          assignment.eventAddress,
        ].filter(Boolean).join(' ')).includes(normalizedSearch))
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
          <Feather name="sliders" size={16} color={COLORS.textNavy} />
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
                accessibilityRole="button"
                accessibilityState={{ selected }}
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
              <Feather name={eventFilter === 'available' ? 'compass' : 'calendar'} size={22} color={COLORS.textNavy} />
            </View>
            <Text style={styles.emptyTitle}>
              {eventFilter === 'available'
                ? 'Nenhum evento disponÃ­vel'
                : eventFilter === 'pending'
                  ? 'Nenhuma convocaÃ§Ã£o pendente'
                  : 'VocÃª ainda nÃ£o tem eventos aceitos'}
            </Text>
            <Text style={styles.emptyText}>
              {eventFilter === 'available'
                ? 'Novas oportunidades aparecerÃ£o aqui quando forem disponibilizadas pela equipe.'
                : 'Quando houver eventos nesta categoria, eles aparecerÃ£o aqui.'}
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
      : /aniversÃ¡rio|15 anos/i.test(eventType)
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
        accessibilityLabel={`Ver detalhes do evento ${assignment.eventTitle || 'evento'}`}
      >
        <View style={[
          styles.eventCover,
          styles[`eventCover${eventIcon[0].toUpperCase()}${eventIcon.slice(1)}`],
        ]}>
          <View style={styles.eventCoverGlow} />
          <View style={styles.eventCoverIcon}>
            <Feather name={eventIcon} size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.eventCoverType}>{eventType}</Text>
        </View>
        <View style={styles.eventCardContent}>
          <View style={styles.eventCardTitleRow}>
            <View style={styles.eventCardTitleBlock}>
              <Text style={styles.eventCardTitle} numberOfLines={1}>
                {assignment.eventTitle || 'Evento sem tÃ­tulo'}
              </Text>
              {!!assignment.clientName && (
                <Text style={styles.eventCardClient} numberOfLines={1}>{assignment.clientName}</Text>
              )}
            </View>
            <Feather name="chevron-right" size={18} color={COLORS.textNavy} />
          </View>

          <View style={styles.eventMetadata}>
            <View style={styles.eventMetadataItem}>
              <Feather name="calendar" size={14} color={COLORS.textMuted} />
              <Text style={styles.eventMetadataText}>{formatShortDate(assignment.eventDate)}</Text>
            </View>
            <View style={styles.eventMetadataItem}>
              <Feather name="clock" size={14} color={COLORS.textMuted} />
              <Text style={styles.eventMetadataText}>{formatEventTime(assignment.eventDate)}</Text>
            </View>
            <View style={styles.eventMetadataItem}>
              <Feather name="map-pin" size={14} color="#E5464D" />
              <Text style={styles.eventMetadataText} numberOfLines={1}>
                {assignment.eventAddress || 'Local a confirmar'}
              </Text>
            </View>
          </View>

          <View style={styles.eventCardFooter}>
            <View style={styles.eventRole}>
              <Feather name="video" size={14} color="#168D78" />
              <Text style={styles.eventRoleText} numberOfLines={1}>
                {assignment.roleName || assignment.professionalTypeName || 'Equipe do evento'}
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

  const renderAgenda = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthEvents = confirmedAssignments
      .filter((assignment) => {
        const date = toDate(assignment.eventDate);
        if (!date) return false;
        const isCurrentMonth = agendaMonth.getFullYear() === today.getFullYear()
          && agendaMonth.getMonth() === today.getMonth();
        return date.getFullYear() === agendaMonth.getFullYear()
          && date.getMonth() === agendaMonth.getMonth()
          && (!isCurrentMonth || date >= today);
      })
      .sort((first, second) => toDate(first.eventDate) - toDate(second.eventDate));
    const visibleAssignments = isAgendaDaySelected
      ? selectedDayAssignments
      : monthEvents;

    const firstDayOfMonth = new Date(agendaMonth.getFullYear(), agendaMonth.getMonth(), 1);
    const daysInMonth = new Date(agendaMonth.getFullYear(), agendaMonth.getMonth() + 1, 0).getDate();
    const leadingDays = firstDayOfMonth.getDay();
    const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;
    const calendarDays = Array.from({ length: totalCells }, (_, index) => {
      const date = new Date(agendaMonth.getFullYear(), agendaMonth.getMonth(), index - leadingDays + 1);
      const dateKey = getLocalDateKey(date);
      return {
        date,
        dateKey,
        inCurrentMonth: date.getMonth() === agendaMonth.getMonth(),
        selected: dateKey === selectedAgendaDateKey,
        isToday: dateKey === getLocalDateKey(today),
        unavailable: unavailableDates.some((item) => item.dateKey === dateKey),
        hasEvent: confirmedAssignments.some((assignment) => {
          const eventDate = toDate(assignment.eventDate);
          return eventDate && getLocalDateKey(eventDate) === dateKey;
        }),
      };
    });
    const monthTitle = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
      .format(agendaMonth);
    const monthTitleCapitalized = `${monthTitle.charAt(0).toLocaleUpperCase('pt-BR')}${monthTitle.slice(1)}`;

    return (
      <>
        <View style={styles.agendaCalendarCard}>
          <View style={styles.agendaCalendarHeader}>
            <Text style={styles.agendaMonthTitle}>{monthTitleCapitalized}</Text>
            <View style={styles.agendaMonthControls}>
              <TouchableOpacity
                style={styles.agendaMonthButton}
                onPress={() => changeAgendaMonth(-1)}
                accessibilityRole="button"
                accessibilityLabel="MÃªs anterior"
              >
                <Feather name="chevron-left" size={18} color={COLORS.textNavy} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.agendaMonthButton}
                onPress={() => changeAgendaMonth(1)}
                accessibilityRole="button"
                accessibilityLabel="PrÃ³ximo mÃªs"
              >
                <Feather name="chevron-right" size={18} color={COLORS.textNavy} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.agendaWeekdays}>
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'SÃ¡b'].map((weekday) => (
              <Text key={weekday} style={styles.agendaWeekday}>{weekday}</Text>
            ))}
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
                accessibilityRole="button"
                accessibilityLabel={`${formatAgendaDate(day.date)}${day.hasEvent ? ', com evento' : ''}${day.unavailable ? ', indisponÃ­vel' : ''}`}
                accessibilityState={{ selected: day.selected }}
              >
                <View style={[
                  styles.agendaDayCircle,
                  !day.inCurrentMonth && styles.agendaDayOutsideMonth,
                  day.isToday && !day.selected && styles.agendaDayToday,
                  day.unavailable && !day.selected && styles.agendaDayUnavailable,
                  day.selected && styles.agendaDaySelected,
                ]}>
                  <Text style={[
                    styles.agendaDayNumber,
                    !day.inCurrentMonth && styles.agendaDayNumberOutside,
                    day.selected && styles.agendaDayNumberSelected,
                  ]}>{day.date.getDate()}</Text>
                </View>
                {day.hasEvent && <View style={[styles.agendaEventDot, day.selected && styles.agendaEventDotSelected]} />}
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.agendaLegend}>
            <View style={[styles.agendaLegendDot, styles.agendaLegendEvent]} />
            <Text style={styles.agendaLegendText}>Evento</Text>
            <View style={[styles.agendaLegendDot, styles.agendaLegendUnavailable]} />
            <Text style={styles.agendaLegendText}>IndisponÃ­vel</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.agendaAvailabilityButton, selectedDayAssignments.length > 0 && !selectedDateUnavailable && styles.agendaAvailabilityDisabled]}
          onPress={openAvailabilityDialog}
          disabled={selectedDayAssignments.length > 0 && !selectedDateUnavailable}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Feather name={selectedDateUnavailable ? 'x-circle' : 'slash'} size={15} color={COLORS.textWhite} />
          <Text style={styles.agendaAvailabilityButtonText}>
            {selectedDateUnavailable ? 'Remover indisponibilidade' : 'Adicionar indisponibilidade'}
          </Text>
        </TouchableOpacity>
        {availabilityError ? <Text style={styles.errorText}>{availabilityError}</Text> : null}
        {selectedDayAssignments.length > 0 && !selectedDateUnavailable && (
          <Text style={styles.agendaConflictHint}>VocÃª jÃ¡ tem evento aceito nesta data.</Text>
        )}

        <View style={styles.agendaSectionHeading}>
          <Text style={styles.agendaSectionTitle}>
            {isAgendaDaySelected ? 'Eventos do dia' : 'Seus prÃ³ximos eventos'}
          </Text>
          <Text style={styles.agendaCommitmentCount}>
            {visibleAssignments.length} {visibleAssignments.length === 1 ? 'compromisso' : 'compromissos'}
          </Text>
        </View>

        {(loading || availabilityLoading) ? (
          <ActivityIndicator color={COLORS.buttonGold} style={styles.loader} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : visibleAssignments.length ? (
          <View style={styles.agendaEventList}>
            {visibleAssignments.map((assignment) => (
              <TouchableOpacity
                key={assignment.id}
                style={styles.agendaEventCard}
                onPress={() => openEventDetails(assignment)}
                activeOpacity={0.8}
              >
                <View style={styles.agendaEventIcon}>
                  <Feather name="calendar" size={16} color={COLORS.textNavy} />
                </View>
                <View style={styles.agendaEventDetails}>
                  <Text style={styles.agendaEventTitle} numberOfLines={1}>
                    {formatShortDate(assignment.eventDate)} Â· {assignment.eventTitle || 'Evento'}
                  </Text>
                  <Text style={styles.agendaEventSubtitle} numberOfLines={1}>
                    {formatEventTime(assignment.eventDate)} â€¢ {assignment.eventAddress || 'Local a confirmar'}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              {isAgendaDaySelected
                ? 'Nenhum evento aceito nesta data.'
                : 'Seus prÃ³ximos eventos aceitos aparecerÃ£o aqui.'}
            </Text>
          </View>
        )}
      </>
    );
  };

  const renderProfile = () => (
    <>
      <View style={styles.userProfileCard}>
        <View style={styles.userProfileHeading}>
          <View style={styles.userProfileAvatar}>
            <Text style={styles.userProfileInitials}>{getInitials(profile.companyName || profile.displayName || profile.name)}</Text>
          </View>
          <View style={styles.userProfileHeadingCopy}>
            <Text style={styles.userProfileName} numberOfLines={1}>
              {profile.displayName || profile.name || 'TÃ©cnico'}
            </Text>
            <Text style={styles.userProfileCompany} numberOfLines={1}>
              {profile.companyName || 'TÃ©cnico de eventos'}
            </Text>
          </View>
        </View>

        <View style={styles.profileDivider} />
        <Text style={styles.userProfileDetail}>CPF: {profile.cpf ? formatCpf(profile.cpf) : 'NÃ£o informado'}</Text>
        <Text style={styles.userProfileDetail} numberOfLines={1}>{profile.email || 'E-mail nÃ£o informado'}</Text>
        <Text style={styles.userProfileDetail} numberOfLines={1}>
          {[profile.city, profile.phone ? formatPhone(profile.phone) : null].filter(Boolean).join(' â€¢ ') || 'Cidade e telefone nÃ£o informados'}
        </Text>

        <TouchableOpacity style={styles.editProfileButton} onPress={openProfileEditor} activeOpacity={0.8}>
          <Feather name="edit-2" size={15} color={COLORS.textNavy} />
          <Text style={styles.editProfileButtonText}>Editar seus dados</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.profileSectionTitle}>NotificaÃ§Ãµes</Text>
      <View style={styles.profilePreferenceCard}>
        <View style={styles.profilePreferenceCopy}>
          <Text style={styles.profilePreferenceTitle}>Eventos e equipe</Text>
          <Text style={styles.profilePreferenceSubtitle}>PendÃªncias e eventos</Text>
        </View>
        {isSavingNotificationPreference ? (
          <ActivityIndicator size="small" color={COLORS.buttonGold} />
        ) : (
          <Switch
            value={eventsNotificationsEnabled}
            onValueChange={changeEventsNotificationPreference}
            trackColor={{ false: '#CAD5E2', true: COLORS.buttonGold }}
            thumbColor="#FFFFFF"
            accessibilityLabel="NotificaÃ§Ãµes de eventos e equipe"
          />
        )}
      </View>

      <Text style={styles.profileSectionTitle}>ConfiguraÃ§Ãµes</Text>
      <TouchableOpacity style={styles.profileSecurityCard} onPress={sendPasswordReset} activeOpacity={0.8}>
        <View style={styles.profileSecurityIcon}>
          <Feather name="shield" size={17} color="#14966F" />
        </View>
        <View style={styles.profilePreferenceCopy}>
          <Text style={styles.profilePreferenceTitle}>SeguranÃ§a da conta</Text>
          <Text style={styles.profilePreferenceSubtitle}>Senha e autenticaÃ§Ã£o</Text>
        </View>
        <Feather name="chevron-right" size={17} color={COLORS.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.profileLogout} onPress={onLogout} activeOpacity={0.8}>
        <Feather name="log-out" size={16} color="#FFFFFF" />
        <Text style={styles.profileLogoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </>
  );

  const renderAssignment = (assignment, showActions) => (
    <View key={assignment.id} style={styles.assignmentCard}>
      <View style={styles.cardHeading}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{assignment.professionalTypeName || 'ConvocaÃ§Ã£o'}</Text>
        </View>
        <Text style={styles.statusText}>
          {assignment.status === 'accepted' ? 'Confirmado' : 'Pendente'}
        </Text>
      </View>

      <Text style={styles.eventTitle}>{assignment.eventTitle || 'Evento sem tÃ­tulo'}</Text>
      {!!assignment.clientName && <Text style={styles.detailText}>{assignment.clientName}</Text>}
      <Text style={styles.detailText}>{formatDate(assignment.eventDate)}</Text>
      {!!assignment.eventAddress && <Text style={styles.detailText}>{assignment.eventAddress}</Text>}
      {!!assignment.roleName && <Text style={styles.roleText}>FunÃ§Ã£o: {assignment.roleName}</Text>}

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

  if (selectedEvent) {
    return (
      <TelaDetalhesEventoTecnico
        assignment={selectedEvent}
        profile={profile}
        section={detailsSection}
        onSectionChange={setDetailsSection}
        onBack={closeEventDetails}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.homeHeaderRow}>
          <Text style={styles.greeting}>
            {activeTab === 'home'
              ? `OlÃ¡, ${user.name || 'TÃ©cnico'}!`
              : { events: 'Eventos', agenda: 'Agenda', profile: 'Perfil' }[activeTab]}
          </Text>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => Alert.alert('NotificaÃ§Ãµes', 'VocÃª estÃ¡ em dia!')}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="NotificaÃ§Ãµes"
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
        {activeTab === 'agenda' && renderAgenda()}
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
                accessibilityLabel="Fechar ediÃ§Ã£o do perfil"
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

            <Text style={styles.profileEmailNote}>O e-mail da conta nÃ£o pode ser alterado por esta tela.</Text>

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
                ? `VocÃª ficarÃ¡ disponÃ­vel em ${formatAgendaDate(selectedAgendaDay)}.`
                : `VocÃª ficarÃ¡ indisponÃ­vel em ${formatAgendaDate(selectedAgendaDay)}.`}
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

      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {renderTabButton('home', 'InÃ­cio', 'home')}
        {renderTabButton('events', 'Eventos', 'tag')}
        {renderTabButton('agenda', 'Agenda', 'calendar')}
        {renderTabButton('profile', 'Perfil', 'user')}
      </View>
    </View>
  );
}
