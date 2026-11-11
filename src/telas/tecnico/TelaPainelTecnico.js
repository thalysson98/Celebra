import React, { useEffect, useMemo, useState } from 'react';
import {
  inicializarNotificacoesDispositivo,
  processarLembretesListaEventos,
  assinarNotificacoesUsuario,
  dispararNotificacaoBarraCelular,
} from '../../servicos/servicoNotificacoes';
import {
  ActivityIndicator,
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
import { Card, Button } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, CORES, FONTES } from '../../tema/cores';
import { subscribeToTechnicianAssignments } from '../../servicos/servicoEscala';
import { requestPasswordReset } from '../../servicos/servicoAutenticacao';
import { setUserEventsNotificationPreference, updateUserProfile } from '../../servicos/servicoUsuario';
import { markTechnicianUnavailable, removeTechnicianUnavailability, subscribeToTechnicianUnavailability } from '../../servicos/servicoIndisponibilidade';
import { estilosPainelTecnico as styles } from '../../estilos/estilosPainelTecnico';
import { estilosNavegacao, obterEstiloHotbar } from '../../estilos/estilosNavegacao';
import Cabecalho from '../../componentes/Cabecalho';

function toDate(value) {
  if (!value) return null;
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeSearch(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function formatCpf(value) {
  const digits = onlyDigits(value).slice(0, 11);
  return digits.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function getInitials(value) {
  return String(value || 'Técnico').trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('pt-BR');
}

function getLocalDateKey(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatAgendaDate(value) {
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(value);
}

function formatShortDate(value) {
  const date = toDate(value);
  if (!date) return 'Data a confirmar';
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

// Formata o horário do evento no padrão 14:30h (usado no card de eventos)
function formatEventTime(value) {
  const date = toDate(value);
  if (!date) return 'Horário a confirmar';
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}h`;
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
  const [eventsNotificationsEnabled, setEventsNotificationsEnabled] = useState(user.notificationPreferences?.eventsAndTeam ?? true);
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
  const [, setAvailabilityLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState('');
  const [isUpdatingAvailability, setUpdatingAvailability] = useState(false);
  const [isAvailabilityDialogVisible, setAvailabilityDialogVisible] = useState(false);

  const [modalSucessoVisivel, setModalSucessoVisivel] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState({ titulo: '', descricao: '' });
  const [modalErroVisivel, setModalErroVisivel] = useState(false);
  const [msgErro, setMsgErro] = useState({ titulo: '', descricao: '' });
  
  const mostrarSucesso = (descricao, titulo = 'Sucesso') => {
    setMsgSucesso({ titulo, descricao });
    setModalSucessoVisivel(true);
  };

  const mostrarErro = (descricao, titulo = 'Atenção') => {
    setMsgErro({ titulo, descricao });
    setModalErroVisivel(true);
  };

  useEffect(() => {
  if (user?.uid) {
    // Pede permissão no celular e salva o Push Token no usuário para receber notificações externas
    inicializarNotificacoesDispositivo(user.uid);
    }
  }, [user?.uid]);

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

  // --- INÍCIO DO BLOCO DE NOTIFICAÇÕES AUTOMÁTICAS ---
  const [notificacoesSistema, setNotificacoesSistema] = useState([]);

  // Conta quantas notificações não lidas existem para mostrar no sininho
  const totalNaoLidas = useMemo(
    () => notificacoesSistema.filter((n) => !n.lida).length,
    [notificacoesSistema]
  );

  // 1. Registra o celular para notificações externas e escuta a coleção 'notificacoes' em tempo real
  useEffect(() => {
    if (!user?.uid) return;

    inicializarNotificacoesDispositivo(user.uid);

    const cancelarAssinatura = assinarNotificacoesUsuario(
      user.uid,
      (lista) => setNotificacoesSistema(lista),
      (erro) => console.log('Erro ao carregar notificações:', erro)
    );

    return () => {
      if (typeof cancelarAssinatura === 'function') cancelarAssinatura();
    };
  }, [user?.uid]);

  // 2. Quando a lista 'assignments' carregar, checa automaticamente a regra de 7 dias e 3 dias antes
  useEffect(() => {
    if (user?.uid && assignments?.length > 0 && eventsNotificationsEnabled) {
      const listaFormatada = assignments.map((a) => ({
        id: a.eventId || a.id,
        nome: a.eventTitle || 'Evento',
        dataInicio: a.eventDate,
        statusConfirmacao: a.status,
      }));
      processarLembretesListaEventos(user.uid, listaFormatada);
    }
  }, [user?.uid, assignments, eventsNotificationsEnabled]);
  // --- FIM DO BLOCO DE NOTIFICAÇÕES AUTOMÁTICAS ---

  const pendingAssignments = useMemo(() => assignments.filter((assignment) => assignment.status === 'pending'), [assignments]);
  const confirmedAssignments = useMemo(() => assignments.filter((assignment) => assignment.status === 'accepted'), [assignments]);
  const allAssignmentsForAgenda = useMemo(() => assignments.filter((a) => a.status === 'accepted' || a.status === 'pending'), [assignments]);

  const selectedAgendaDateKey = getLocalDateKey(selectedAgendaDay);
  const selectedDayAssignments = allAssignmentsForAgenda.filter((assignment) => {
    const date = toDate(assignment.eventDate);
    return date && getLocalDateKey(date) === selectedAgendaDateKey;
  });
  const selectedDateUnavailable = unavailableDates.some((item) => item.dateKey === selectedAgendaDateKey);

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
      mostrarErro('Informe seu nome para exibição.', 'Campo obrigatório');
      return;
    }
    setSavingProfile(true);
    try {
      const savedFields = await updateUserProfile(user.uid, profileForm);
      setProfile((current) => ({ ...current, ...savedFields, name: savedFields.displayName }));
      setProfileEditorVisible(false);
      mostrarSucesso('Seus dados foram salvos com sucesso.', 'Perfil atualizado');
    } catch (saveError) {
      mostrarErro(saveError.message, 'Não foi possível salvar');
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
      mostrarErro(preferenceError.message, 'Não foi possível atualizar');
    } finally {
      setSavingNotificationPreference(false);
    }
  };

  const sendPasswordReset = async () => {
    if (!profile.email) {
      mostrarErro('Esta conta não possui um e-mail para redefinição.', 'E-mail indisponível');
      return;
    }
    try {
      await requestPasswordReset(profile.email);
      mostrarSucesso(`Enviamos um link de redefinição para ${profile.email}.`, 'E-mail enviado');
    } catch (resetError) {
      mostrarErro(resetError.message, 'Não foi possível enviar');
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
      mostrarErro('Você tem um evento aceito neste dia.', 'Data com compromisso');
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
      mostrarErro(changeError.message, 'Não foi possível atualizar a agenda');
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
              {/* Mantém a cor de fundo do dia/evento e aplica a borda amarela ao redor quando selecionado */}
                <View style={[
                  styles.agendaDayCircle,
                  !day.inCurrentMonth && styles.agendaDayOutsideMonth,
                  day.isToday && styles.agendaDayToday,
                  day.unavailable && styles.agendaDayUnavailable,
                  day.hasPending && styles.agendaDayPending,
                  day.hasConfirmed && styles.agendaDayConfirmed,
                  day.selected && styles.agendaDaySelected, 
                ]}>
                  <Text style={[
                    styles.agendaDayNumber, 
                    !day.inCurrentMonth && styles.agendaDayNumberOutside, 
                    day.selected && styles.agendaDayNumberSelected,
                    (day.hasConfirmed || day.hasPending || day.unavailable) && styles.agendaDayNumberEvent, 
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
                  </View>
                  <View style={assignment.status === 'accepted' ? styles.agendaStatusBadgeVerde : styles.agendaStatusBadgeLaranja}>
                    <Text style={assignment.status === 'accepted' ? styles.agendaStatusTextoVerde : styles.agendaStatusTextoLaranja}>
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
        <TouchableOpacity style={styles.summaryCard} onPress={() => { setEventFilter('pending'); setActiveTab('events'); }} activeOpacity={0.8}>
          <Text style={styles.summaryNumber}>{pendingAssignments.length}</Text>
          <Text style={styles.summaryLabel}>Eventos pendentes de aprovação</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.summaryCard} onPress={() => { setEventFilter('mine'); setActiveTab('events'); }} activeOpacity={0.8}>
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
        ].filter(Boolean).join(' '));
        return searchTerms.every(term => combinedString.includes(term));
      })
      .sort((first, second) => (toDate(first.eventDate)?.getTime() || 0) - (toDate(second.eventDate)?.getTime() || 0));
    
    const monthLabel = visibleAssignments.length
      ? new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(toDate(visibleAssignments[0].eventDate) || new Date())
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
            returnKeyType="search"
          />
        </View>

        <View style={styles.eventFilters}>
          {eventFilters.map((filter) => {
            const selected = eventFilter === filter.key;
            return (
              <TouchableOpacity key={filter.key} style={[styles.eventFilterChip, selected && styles.eventFilterChipSelected]} onPress={() => setEventFilter(filter.key)} activeOpacity={0.75}>
                <Text style={[styles.eventFilterText, selected && styles.eventFilterTextSelected]}>{filter.label}</Text>
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
              {eventFilter === 'pending' ? 'Nenhuma convocação pendente' : 'Você ainda não tem eventos aceitos'}
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
    return (
      <Card key={assignment.id} style={styles.eventCardOrganizer} onPress={() => openEventDetails(assignment)}>
        <Card.Content style={styles.eventCardContentOrganizer}>
          <View style={styles.linhaTopo}>
            <Text style={styles.tipoBadge}>
              {assignment.eventTypeName || assignment.professionalTypeName || 'Evento'}
            </Text>
            {/* Mostra a data e o horário do evento no card (ex: 10/11/2026 • 14:30h) */}
            <Text style={styles.dataTexto}>
              {formatShortDate(assignment.eventDate)} • {formatEventTime(assignment.eventDate)}
            </Text>
          </View>

          <Text style={styles.tituloEvento}>
            {assignment.eventTitle || 'Evento sem título'}
          </Text>

          <View style={styles.linhaInfo}>
            <Feather name="video" size={16} color={COLORS.textMuted} />
            <Text style={styles.textoCliente}>
              Função: {assignment.roleName || assignment.professionalTypeName || 'Equipe'}
            </Text>
          </View>

          <View style={styles.linhaStatus}>
            <View style={[
              styles.statusBadge,
              assignment.status === 'accepted' ? styles.statusBadgeVerde : styles.statusBadgeAmarelo
            ]}>
              <Text style={[
                styles.statusTexto,
                assignment.status === 'accepted' ? styles.statusTextoVerde : styles.statusTextoAmarelo
              ]}>
                {assignment.status === 'accepted' ? 'Confirmado' : 'Pendente'}
              </Text>
            </View>

            <View style={styles.botaoVerDetalhes}>
              <Text style={styles.botaoVerDetalhesTexto}>Ver detalhes</Text>
              <Feather name="arrow-right" size={13} color={COLORS.textNavy} />
            </View>
          </View>
        </Card.Content>
      </Card>
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

      <TouchableOpacity 
        style={[styles.profileSecurityCard, { marginTop: 12 }]} 
        onPress={() => {
          dispararNotificacaoBarraCelular(
            'Celebra: Notificação de Teste',
            'Isso é um aviso externo na barra de notificações!'
          );
        }}
        activeOpacity={0.8}
      >
      <View style={[styles.profileSecurityIcon, { backgroundColor: '#FEF3C7' }]}>
        <Feather name="bell" size={17} color="#D97706" />
      </View>
      <View style={styles.profilePreferenceCopy}>
        <Text style={styles.profilePreferenceTitle}>Testar Notificação Externa</Text>
        <Text style={styles.profilePreferenceSubtitle}>Dispara aviso na barra do celular</Text>
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
      <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
        <View style={estilosNavegacao.tabContainer}>
          <View style={selected ? estilosNavegacao.pilulaIconeAtivo : estilosNavegacao.pilulaIconeInativo}>
            <Feather name={icon} size={24} color={selected ? CORES.textNavy : COLORS.textSubtle} />
            {tab === 'home' && pendingAssignments.length > 0 && (
              <View style={estilosNavegacao.badge}>
                <Text style={estilosNavegacao.badgeText}>{pendingAssignments.length}</Text>
              </View>
            )}
          </View>
          <Text style={[estilosNavegacao.tabLabel, { color: selected ? CORES.textNavy : COLORS.textSubtle }]}>{label}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Exibe a bolinha com o total não lido e envia o ID e os eventos ao abrir o sininho */}
      <Cabecalho 
        titulo={activeTab === 'home' ? `Olá, ${profile.displayName || profile.name || 'Técnico'}!` : { events: 'Eventos', profile: 'Perfil' }[activeTab]} 
        subtitulo={activeTab === 'home' ? 'Seu painel de eventos' : ''}
        mostrarSino={true}
        quantidadeNotificacoes={totalNaoLidas}
        badgeCount={totalNaoLidas}
        aoClicarSino={() =>
          navigation.navigate('Notificacoes', {
            idUsuario: user?.uid,
            assignments: assignments,
          })
        }
      />
      
      <ScrollView style={styles.mainContent} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'home' && renderHome()}
        {activeTab === 'events' && renderEvents()}
        {activeTab === 'profile' && renderProfile()}
      </ScrollView>

      
      <Modal visible={modalSucessoVisivel} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center' }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#E6F8F0', justifyContent: 'center', alignItems: 'center', marginBottom: 15 }}>
              <Feather name="check" size={32} color="#10B981" />
            </View>
            <Text style={{ fontFamily: FONTES.bold, fontSize: 18, color: CORES.textNavy, marginBottom: 8, textAlign: 'center' }}>{msgSucesso.titulo}</Text>
            <Text style={{ fontFamily: FONTES.body, fontSize: 14, color: CORES.textMuted, textAlign: 'center', marginBottom: 20 }}>{msgSucesso.descricao}</Text>
            <Button mode="contained" style={{ width: '100%', borderRadius: 10 }} buttonColor={CORES.buttonGold} textColor={CORES.textNavy} onPress={() => setModalSucessoVisivel(false)}>Ok</Button>
          </View>
        </View>
      </Modal>

      <Modal visible={modalErroVisivel} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center' }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 15 }}>
              <Feather name="alert-triangle" size={32} color="#EF4444" />
            </View>
            <Text style={{ fontFamily: FONTES.bold, fontSize: 18, color: CORES.textNavy, marginBottom: 8, textAlign: 'center' }}>{msgErro.titulo}</Text>
            <Text style={{ fontFamily: FONTES.body, fontSize: 14, color: CORES.textMuted, textAlign: 'center', marginBottom: 20 }}>{msgErro.descricao}</Text>
            <Button mode="contained" style={{ width: '100%', borderRadius: 10 }} buttonColor="#EF4444" textColor="#FFF" onPress={() => setModalErroVisivel(false)}>Ok, entendi</Button>
          </View>
        </View>
      </Modal>

  
      <Modal visible={isProfileEditorVisible} transparent animationType="fade" onRequestClose={() => setProfileEditorVisible(false)}>
        <KeyboardAvoidingView style={styles.profileModalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.profileEditorCard}>
            <View style={styles.profileEditorHeading}>
              <Text style={styles.profileEditorTitle}>Editar seus dados</Text>
              <TouchableOpacity onPress={() => setProfileEditorVisible(false)}>
                <Feather name="x" size={21} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.profileFieldLabel}>Nome</Text>
            <TextInput style={styles.profileFieldInput} value={profileForm.displayName} onChangeText={(displayName) => setProfileForm((current) => ({ ...current, displayName }))} placeholder="Seu nome" placeholderTextColor={COLORS.textMuted} maxLength={100} autoCapitalize="words" />
            <Text style={styles.profileFieldLabel}>CPF</Text>
            <TextInput style={styles.profileFieldInput} value={profileForm.cpf} onChangeText={(cpf) => setProfileForm((current) => ({ ...current, cpf: formatCpf(cpf) }))} placeholder="000.000.000-00" placeholderTextColor={COLORS.textMuted} keyboardType="numeric" />
            <Text style={styles.profileFieldLabel}>Telefone</Text>
            <TextInput style={styles.profileFieldInput} value={profileForm.phone} onChangeText={(phone) => setProfileForm((current) => ({ ...current, phone: formatPhone(phone) }))} placeholder="(00) 00000-0000" placeholderTextColor={COLORS.textMuted} keyboardType="phone-pad" />
            <Text style={styles.profileFieldLabel}>Cidade</Text>
            <TextInput style={styles.profileFieldInput} value={profileForm.city} onChangeText={(city) => setProfileForm((current) => ({ ...current, city }))} placeholder="Sua cidade" placeholderTextColor={COLORS.textMuted} maxLength={100} autoCapitalize="words" />
            <Text style={styles.profileEmailNote}>O e-mail da conta não pode ser alterado por esta tela.</Text>
            <View style={styles.profileEditorActions}>
              <TouchableOpacity style={styles.profileCancelButton} onPress={() => setProfileEditorVisible(false)} disabled={isSavingProfile}>
                <Text style={styles.profileCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.profileSaveButton} onPress={saveProfile} disabled={isSavingProfile}>
                {isSavingProfile ? <ActivityIndicator size="small" color={COLORS.textNavy} /> : <Text style={styles.profileSaveButtonText}>Salvar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

  
      <Modal visible={isAvailabilityDialogVisible} transparent animationType="fade" onRequestClose={() => setAvailabilityDialogVisible(false)}>
        <View style={styles.profileModalOverlay}>
          <View style={styles.availabilityDialogCard}>
            <View style={styles.profileSecurityIcon}>
              <Feather name={selectedDateUnavailable ? 'calendar' : 'slash'} size={19} color={COLORS.textNavy} />
            </View>
            <Text style={styles.availabilityDialogTitle}>
              {selectedDateUnavailable ? 'Remover indisponibilidade?' : 'Adicionar indisponibilidade?'}
            </Text>
            <Text style={styles.availabilityDialogMessage}>
              {selectedDateUnavailable ? `Você ficará disponível em ${formatAgendaDate(selectedAgendaDay)}.` : `Você ficará indisponível em ${formatAgendaDate(selectedAgendaDay)}.`}
            </Text>
            <View style={styles.profileEditorActions}>
              <TouchableOpacity style={styles.profileCancelButton} onPress={() => setAvailabilityDialogVisible(false)} disabled={isUpdatingAvailability}>
                <Text style={styles.profileCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.profileSaveButton} onPress={confirmAvailabilityChange} disabled={isUpdatingAvailability}>
                {isUpdatingAvailability ? <ActivityIndicator size="small" color={COLORS.textNavy} /> : <Text style={styles.profileSaveButtonText}>{selectedDateUnavailable ? 'Remover' : 'Confirmar'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={obterEstiloHotbar(insets.bottom)}>
        {renderTabButton('home', 'Início', 'home')}
        {renderTabButton('events', 'Eventos', 'tag')}
        {renderTabButton('profile', 'Perfil', 'user')}
      </View>
    </View>
  );
}