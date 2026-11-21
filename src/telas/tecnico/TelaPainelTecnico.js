// ============================================================================
// src/telas/tecnico/TelaPainelTecnico.js
// Painel principal do Técnico: gerencia as abas Início (resumo e agenda mensal
// com controle de indisponibilidade), Eventos (listagem, busca, filtros de data
// e ordenação de convocações) e Perfil (dados cadastrais, preferências de
// notificação e segurança), além de escutar convites e notificações em tempo real.
// ============================================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { COLORS, CORES, FONTES } from '../../tema/cores';
import { subscribeToTechnicianAssignments } from '../../servicos/servicoEscala';
import { requestPasswordReset } from '../../servicos/servicoAutenticacao';
import { setUserEventsNotificationPreference, updateUserProfile } from '../../servicos/servicoUsuario';
import {
  markTechnicianUnavailable,
  removeTechnicianUnavailability,
  subscribeToTechnicianUnavailability,
} from '../../servicos/servicoIndisponibilidade';
import { estilosPainelTecnico as styles } from '../../estilos/estilosPainelTecnico';
import BarraInferior from '../../componentes/BarraInferior';
import Cabecalho from '../../componentes/Cabecalho';
import FiltroIntervaloDatas, { obterChaveDataLocal } from '../../compartilhado/FiltroIntervaloDatas';
import SeparadorCampoIcone from '../../compartilhado/SeparadorCampoIcone';

// ============================================================================
// FUNÇÕES AUXILIARES DE FORMATAÇÃO, CONVERSÃO DE DATAS E MÁSCARAS
// ============================================================================

/**
 * Converte valores de data do Firestore (Timestamp, String ou Date) para objeto Date válido.
 */
function toDate(value) {
  if (!value) return null;
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Normaliza textos removendo acentos e convertendo para minúsculas para facilitar buscas.
 */
function normalizeSearch(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

/**
 * Remove todos os caracteres não numéricos de uma string.
 */
function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

/**
 * Aplica máscara de CPF no formato 000.000.000-00.
 */
function formatCpf(value) {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/**
 * Aplica máscara de telefone brasileiro com DDD no formato (00) 00000-0000.
 */
function formatPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Extrai até duas iniciais do nome do técnico para exibição no avatar do perfil.
 */
function getInitials(value) {
  return String(value || 'Técnico')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('pt-BR');
}

/**
 * Gera uma chave de data local no padrão AAAA-MM-DD para indexação no calendário da agenda.
 */
function getLocalDateKey(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formata uma data por extenso em português (ex: "15 de novembro de 2026") para o modal da agenda.
 */
function formatAgendaDate(value) {
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(value);
}

/**
 * Formata uma data no padrão curto DD/MM/AAAA para exibição nos cards de evento.
 */
function formatShortDate(value) {
  const date = toDate(value);
  if (!date) return 'Data a confirmar';
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

// ============================================================================
// COMPONENTE PRINCIPAL DO PAINEL DO TÉCNICO
// ============================================================================

export default function TelaPainelTecnico({ navigation, route, user, onLogout }) {
  // Estados principais de convocações (assignments), aba ativa e filtros de busca de eventos
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [eventFilter, setEventFilter] = useState('mine');
  const [eventSearch, setEventSearch] = useState('');
  const [eventSortAscending, setEventSortAscending] = useState(true);
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');

  // Estados de dados do perfil do técnico, modal de edição e preferência de notificações
  const [profile, setProfile] = useState(() => ({
    ...user,
    displayName: user.name || user.displayName || '',
  }));
  const [profileForm, setProfileForm] = useState({ displayName: '', cpf: '', phone: '' });
  const [isProfileEditorVisible, setProfileEditorVisible] = useState(false);
  const [isSavingProfile, setSavingProfile] = useState(false);
  const [eventsNotificationsEnabled, setEventsNotificationsEnabled] = useState(
    user.notificationPreferences?.eventsAndTeam ?? true
  );
  const [isSavingNotificationPreference, setSavingNotificationPreference] = useState(false);

  // Estados do calendário da agenda mensal e gerenciamento de datas de indisponibilidade
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
  const [availabilityDialogContext, setAvailabilityDialogContext] = useState(null);

  // Estados para controle dos modais padronizados de feedback (sucesso e erro)
  const [modalSucessoVisivel, setModalSucessoVisivel] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState({ titulo: '', descricao: '' });
  const [modalErroVisivel, setModalErroVisivel] = useState(false);
  const [msgErro, setMsgErro] = useState({ titulo: '', descricao: '' });

  /**
   * Exibe o modal de confirmação/sucesso com mensagem e título customizados.
   */
  const mostrarSucesso = (descricao, titulo = 'Sucesso') => {
    setMsgSucesso({ titulo, descricao });
    setModalSucessoVisivel(true);
  };

  /**
   * Exibe o modal de alerta/erro com mensagem e título customizados.
   */
  const mostrarErro = (descricao, titulo = 'Atenção') => {
    setMsgErro({ titulo, descricao });
    setModalErroVisivel(true);
  };

  // --------------------------------------------------------------------------
  // 1. SINCRONIZAÇÃO DE ROTA, CONVOCAÇÕES E INDISPONIBILIDADES EM TEMPO REAL
  // --------------------------------------------------------------------------

  // Permite que outra tela (ex: TelaNotificacoes) solicite a abertura de uma aba específica
  useEffect(() => {
    if (route?.params?.abaInicial) {
      setActiveTab(route.params.abaInicial);
    }
  }, [route?.params?.abaInicial]);

  // Referência para identificar novos convites pendentes recebidos em tempo real
  const convitesAnterioresRef = useRef(null);

  // Escuta em tempo real as convocações (convites) do técnico no Firestore
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToTechnicianAssignments(
      user.uid,
      (nextAssignments) => {
        const lista = nextAssignments || [];
        if (convitesAnterioresRef.current !== null) {
          const idsAnteriores = new Set(
            convitesAnterioresRef.current.filter((a) => a.status === 'pending').map((a) => a.id)
          );
          const novosConvites = lista.filter((a) => a.status === 'pending' && !idsAnteriores.has(a.id));
          for (const novo of novosConvites) {
            const idEventoAlvo = novo.idEvento || novo.id;
            const idNotifNovo = `novo_evento_${idEventoAlvo}_${user.uid}`;
            const dataFmt = formatShortDate(novo.eventDate);
            dispararNotificacaoBarraCelular(
              'Novo evento lançado para você!',
              `Você foi escalado como ${novo.roleName || 'profissional'} no evento "${novo.eventTitle || 'Evento'}" (${dataFmt}).`,
              idNotifNovo
            );
          }
        }
        convitesAnterioresRef.current = lista;
        setAssignments(lista);
        setError('');
        setLoading(false);
      },
      () => {
        setError('Não foi possível carregar suas convocações. Tente novamente mais tarde.');
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [user.uid]);

  // Escuta em tempo real as datas marcadas como indisponíveis pelo técnico no Firestore
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
      }
    );
    return unsubscribe;
  }, [user.uid]);

  // --------------------------------------------------------------------------
  // 2. SISTEMA DE NOTIFICAÇÕES AUTOMÁTICAS E LEMBRETES DE PROXIMIDADE
  // --------------------------------------------------------------------------
  const [notificacoesSistema, setNotificacoesSistema] = useState([]);
  const notificacoesAnterioresRef = useRef(null);

  // Calcula o total de notificações não lidas para exibir no badge do sininho no cabeçalho
  const totalNaoLidas = useMemo(
    () => notificacoesSistema.filter((n) => !n.lida).length,
    [notificacoesSistema]
  );

  // Registra o token push do dispositivo e escuta a coleção 'notificacoes' em tempo real
  useEffect(() => {
    if (!user?.uid) return;

    inicializarNotificacoesDispositivo(user.uid);

    const cancelarAssinatura = assinarNotificacoesUsuario(
      user.uid,
      (lista) => {
        // Dispara o banner local no aparelho sempre que uma nova notificação não lida chega
        if (notificacoesAnterioresRef.current !== null) {
          const idsAnteriores = new Set(notificacoesAnterioresRef.current.map((n) => n.id));
          const novas = lista.filter((n) => !idsAnteriores.has(n.id) && !n.lida);
          for (const nova of novas) {
            dispararNotificacaoBarraCelular(nova.titulo, nova.mensagem, nova.id);
          }
        }
        notificacoesAnterioresRef.current = lista;
        setNotificacoesSistema(lista);
      },
      (erro) => console.log('Erro ao carregar notificações:', erro)
    );

    return () => {
      if (typeof cancelarAssinatura === 'function') cancelarAssinatura();
    };
  }, [user?.uid]);

  // Avalia automaticamente lembretes de 7 dias, 3 dias antes e no dia do evento ao atualizar a lista
  useEffect(() => {
    if (user?.uid && assignments?.length > 0 && eventsNotificationsEnabled) {
      const listaFormatada = assignments.map((a) => ({
        id: a.idEvento || a.eventId || a.id,
        idEvento: a.idEvento || a.eventId || a.id,
        nome: a.eventTitle || 'Evento',
        dataInicio: a.eventDate,
        statusConfirmacao: a.status,
      }));
      processarLembretesListaEventos(user.uid, listaFormatada);
    }
  }, [user?.uid, assignments, eventsNotificationsEnabled]);

  // --------------------------------------------------------------------------
  // 3. LISTAS DERIVADAS (MEMOIZED) PARA RESUMO E AGENDA
  // --------------------------------------------------------------------------

  // Convocações pendentes de resposta do técnico
  const pendingAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === 'pending'),
    [assignments]
  );

  // Convocações já aceitas/confirmadas pelo técnico
  const confirmedAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === 'accepted'),
    [assignments]
  );

  // Todos os eventos relevantes para exibição no calendário (aceitos e pendentes)
  const allAssignmentsForAgenda = useMemo(
    () => assignments.filter((a) => a.status === 'accepted' || a.status === 'pending'),
    [assignments]
  );

  // Dados filtrados para o dia atualmente selecionado no calendário da agenda
  const selectedAgendaDateKey = getLocalDateKey(selectedAgendaDay);
  const selectedDayAssignments = allAssignmentsForAgenda.filter((assignment) => {
    const date = toDate(assignment.eventDate);
    return date && getLocalDateKey(date) === selectedAgendaDateKey;
  });
  const selectedDateUnavailable = unavailableDates.some(
    (item) => item.dateKey === selectedAgendaDateKey
  );
  const availabilityDialogWasUnavailable =
    availabilityDialogContext?.wasUnavailable ?? selectedDateUnavailable;
  const availabilityDialogDate = availabilityDialogContext?.date || selectedAgendaDay;
  const hasAcceptedAssignmentOnSelectedDay = selectedDayAssignments.some(
    (a) => a.status === 'accepted'
  );
  const hasPendingAssignmentOnSelectedDay = selectedDayAssignments.some(
    (a) => a.status === 'pending'
  );
  const cannotMarkUnavailableOnSelectedDay =
    !selectedDateUnavailable && (hasAcceptedAssignmentOnSelectedDay || hasPendingAssignmentOnSelectedDay);

  // --------------------------------------------------------------------------
  // 4. AÇÕES DE PERFIL, PREFERÊNCIAS, SEGURANÇA E AGENDA
  // --------------------------------------------------------------------------

  /**
   * Preenche o formulário de edição com os dados atuais do técnico e abre o modal de perfil.
   */
  const openProfileEditor = () => {
    setProfileForm({
      displayName: profile.displayName || profile.name || '',
      cpf: formatCpf(profile.cpf),
      phone: formatPhone(profile.phone),
    });
    setProfileEditorVisible(true);
  };

  /**
   * Valida e salva as alterações de nome, CPF e telefone do perfil do técnico no Firestore.
   */
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

  /**
   * Atualiza a preferência de recebimento de notificações de eventos e equipe.
   */
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

  /**
   * Envia um e-mail de redefinição de senha via Firebase Auth para o endereço da conta logada.
   */
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

  /**
   * Navega entre os meses do calendário da agenda (+1 para próximo mês, -1 para mês anterior).
   */
  const changeAgendaMonth = (amount) => {
    const nextMonth = new Date(agendaMonth.getFullYear(), agendaMonth.getMonth() + amount, 1);
    setAgendaMonth(nextMonth);
    setSelectedAgendaDay(nextMonth);
    setAgendaDaySelected(false);
  };

  /**
   * Abre o modal de confirmação para adicionar ou remover indisponibilidade no dia selecionado,
   * bloqueando caso já exista um evento confirmado ou convite pendente naquela data.
   */
  const openAvailabilityDialog = () => {
    if (!selectedDateUnavailable && hasAcceptedAssignmentOnSelectedDay) {
      mostrarErro('Você tem um evento aceito neste dia.', 'Data com compromisso');
      return;
    }
    if (!selectedDateUnavailable && hasPendingAssignmentOnSelectedDay) {
      mostrarErro(
        'Você possui um convite pendente neste dia. Aceite ou recuse o convite antes de marcar indisponibilidade.',
        'Convite pendente na data'
      );
      return;
    }
    setAvailabilityDialogContext({
      wasUnavailable: selectedDateUnavailable,
      date: new Date(selectedAgendaDay),
    });
    setAvailabilityDialogVisible(true);
  };

  /**
   * Confirma a marcação ou remoção de indisponibilidade do técnico na data selecionada.
   */
  const confirmAvailabilityChange = async () => {
    if (!availabilityDialogWasUnavailable && (hasAcceptedAssignmentOnSelectedDay || hasPendingAssignmentOnSelectedDay)) {
      mostrarErro(
        hasAcceptedAssignmentOnSelectedDay
          ? 'Você tem um evento aceito neste dia.'
          : 'Você possui um convite pendente neste dia. Aceite ou recuse o convite antes de marcar indisponibilidade.',
        'Ação não permitida'
      );
      setAvailabilityDialogVisible(false);
      return;
    }
    setUpdatingAvailability(true);
    try {
      if (availabilityDialogWasUnavailable) {
        await removeTechnicianUnavailability(user.uid, availabilityDialogDate);
      } else {
        await markTechnicianUnavailable(user.uid, availabilityDialogDate);
      }
      setAvailabilityDialogVisible(false);
    } catch (changeError) {
      mostrarErro(changeError.message, 'Não foi possível atualizar a agenda');
    } finally {
      setUpdatingAvailability(false);
    }
  };

  /**
   * Serializa os campos de data da convocação e navega para a tela de detalhes do evento.
   */
  const openEventDetails = (assignment) => {
    const serializableAssignment = {
      ...assignment,
      eventDate: toDate(assignment.eventDate)?.toISOString() || null,
      inviteDate: toDate(assignment.inviteDate)?.toISOString() || null,
      respondedAt: toDate(assignment.respondedAt)?.toISOString() || null,
    };
    navigation.navigate('TechnicianEventDetails', { assignment: serializableAssignment });
  };

  // --------------------------------------------------------------------------
  // 5. FUNÇÕES DE RENDERIZAÇÃO DAS SEÇÕES E ABAS (INÍCIO, AGENDA, EVENTOS, PERFIL)
  // --------------------------------------------------------------------------

  /**
   * Renderiza o calendário mensal interativo da agenda do técnico, a legenda de cores,
   * o botão de controle de indisponibilidade e a lista de eventos do dia selecionado.
   */
  const renderAgenda = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(agendaMonth.getFullYear(), agendaMonth.getMonth(), 1);
    const daysInMonth = new Date(agendaMonth.getFullYear(), agendaMonth.getMonth() + 1, 0).getDate();
    const leadingDays = firstDayOfMonth.getDay();
    const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;

    // Monta as células da grade do calendário combinando dias do mês, eventos e indisponibilidades
    const calendarDays = Array.from({ length: totalCells }, (_, index) => {
      const date = new Date(agendaMonth.getFullYear(), agendaMonth.getMonth(), index - leadingDays + 1);
      const dateKey = getLocalDateKey(date);

      const dayAssignments = allAssignmentsForAgenda.filter((a) => {
        const evDate = toDate(a.eventDate);
        return evDate && getLocalDateKey(evDate) === dateKey;
      });

      return {
        date,
        dateKey,
        inCurrentMonth: date.getMonth() === agendaMonth.getMonth(),
        selected: dateKey === selectedAgendaDateKey,
        isToday: dateKey === getLocalDateKey(today),
        unavailable: unavailableDates.some((item) => item.dateKey === dateKey),
        hasConfirmed: dayAssignments.some((a) => a.status === 'accepted'),
        hasPending: dayAssignments.some((a) => a.status === 'pending'),
      };
    });

    const monthTitle = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
      agendaMonth
    );
    const monthTitleCapitalized = `${monthTitle.charAt(0).toLocaleUpperCase('pt-BR')}${monthTitle.slice(1)}`;

    return (
      <View style={styles.agendaSectionContainer}>
        <Text style={styles.sectionTitle}>Sua Agenda</Text>
        <View style={styles.agendaCalendarCard}>
          {/* Cabeçalho de navegação entre meses do calendário */}
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

          {/* Cabeçalho dos dias da semana */}
          <View style={styles.agendaWeekdays}>
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <Text key={day} style={styles.agendaWeekday}>
                {day}
              </Text>
            ))}
          </View>

          {/* Grade de dias do mês */}
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
                {/* Círculo indicador de status do dia (confirmado, pendente, indisponível ou selecionado) */}
                <View
                  style={[
                    styles.agendaDayCircle,
                    !day.inCurrentMonth && styles.agendaDayOutsideMonth,
                    day.isToday && styles.agendaDayToday,
                    day.unavailable && styles.agendaDayUnavailable,
                    day.hasPending && styles.agendaDayPending,
                    day.hasConfirmed && styles.agendaDayConfirmed,
                    day.selected && styles.agendaDaySelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.agendaDayNumber,
                      !day.inCurrentMonth && styles.agendaDayNumberOutside,
                      day.selected && styles.agendaDayNumberSelected,
                      (day.hasConfirmed || day.hasPending || day.unavailable) &&
                        styles.agendaDayNumberEvent,
                    ]}
                  >
                    {day.date.getDate()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Legenda visual de cores da agenda */}
          <View style={styles.agendaLegend}>
            <View style={[styles.agendaLegendDot, styles.agendaLegendEvent]} />
            <Text style={styles.agendaLegendText}>Confirmado</Text>
            <View style={[styles.agendaLegendDot, styles.agendaLegendPending]} />
            <Text style={styles.agendaLegendText}>Pendente</Text>
            <View style={[styles.agendaLegendDot, styles.agendaLegendUnavailable]} />
            <Text style={styles.agendaLegendText}>Indisponível</Text>
          </View>
        </View>

        {/* Botão para marcar ou remover indisponibilidade no dia selecionado */}
        <TouchableOpacity
          style={[
            styles.agendaAvailabilityButton,
            cannotMarkUnavailableOnSelectedDay && styles.agendaAvailabilityDisabled,
          ]}
          onPress={openAvailabilityDialog}
          disabled={cannotMarkUnavailableOnSelectedDay}
        >
          <Feather name={selectedDateUnavailable ? 'x-circle' : 'slash'} size={15} color={COLORS.textWhite} />
          <Text style={styles.agendaAvailabilityButtonText}>
            {selectedDateUnavailable ? 'Remover indisponibilidade' : 'Adicionar indisponibilidade'}
          </Text>
        </TouchableOpacity>

        {cannotMarkUnavailableOnSelectedDay && (
          <Text style={styles.agendaBlockedHint}>
            {hasAcceptedAssignmentOnSelectedDay
              ? 'Não é possível marcar indisponibilidade em dias com evento confirmado.'
              : 'Responda ao convite pendente deste dia antes de marcar indisponibilidade.'}
          </Text>
        )}

        {availabilityError ? <Text style={styles.errorText}>{availabilityError}</Text> : null}

        {/* Lista de eventos agendados na data clicada pelo técnico */}
        {isAgendaDaySelected && selectedDayAssignments.length > 0 && (
          <View style={styles.agendaDayEventsContainer}>
            <Text style={styles.agendaSectionTitle}>Eventos do dia</Text>
            <View style={styles.agendaEventList}>
              {selectedDayAssignments.map((assignment) => (
                <TouchableOpacity
                  key={assignment.id}
                  style={styles.agendaEventCard}
                  onPress={() => openEventDetails(assignment)}
                >
                  <View style={styles.agendaEventIcon}>
                    <Feather name="calendar" size={16} color={COLORS.textNavy} />
                  </View>
                  <View style={styles.agendaEventDetails}>
                    <Text style={styles.agendaEventTitle}>
                      {formatShortDate(assignment.eventDate)} • {assignment.eventTitle}
                    </Text>
                  </View>
                  <View
                    style={
                      assignment.status === 'accepted'
                        ? styles.agendaStatusBadgeVerde
                        : styles.agendaStatusBadgeLaranja
                    }
                  >
                    <Text
                      style={
                        assignment.status === 'accepted'
                          ? styles.agendaStatusTextoVerde
                          : styles.agendaStatusTextoLaranja
                      }
                    >
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

  /**
   * Renderiza a aba Início ('home'), composta pelos cartões de resumo rápido
   * (eventos pendentes e eventos aceitos) seguidos pelo calendário da agenda.
   */
  const renderHome = () => (
    <>
      <View style={styles.summaryRow}>
        <TouchableOpacity
          style={styles.summaryCard}
          onPress={() => {
            setEventFilter('pending');
            setActiveTab('events');
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.summaryNumber}>{pendingAssignments.length}</Text>
          <Text style={styles.summaryLabel}>Eventos pendentes de aprovação</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.summaryCard}
          onPress={() => {
            setEventFilter('mine');
            setActiveTab('events');
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.summaryNumber}>{confirmedAssignments.length}</Text>
          <Text style={styles.summaryLabel}>Seus eventos aceitos</Text>
        </TouchableOpacity>
      </View>
      {renderAgenda()}
    </>
  );

  /**
   * Renderiza a aba Eventos ('events') com barra de busca textual, filtro por intervalo
   * de datas, botão de ordenação cronológica e alternância entre aceitos e pendentes.
   */
  const renderEvents = () => {
    const eventFilters = [
      { key: 'mine', label: 'Seus eventos aceitos' },
      { key: 'pending', label: 'Pendentes' },
    ];
    const statusByFilter = { mine: 'accepted', pending: 'pending' };
    const searchTerms = normalizeSearch(eventSearch).split(/\s+/).filter(Boolean);

    // Filtra as convocações por status, período de datas e termos pesquisados, ordenando por data
    const visibleAssignments = assignments
      .filter((assignment) => assignment.status === statusByFilter[eventFilter])
      .filter((assignment) => {
        const eventDateKey = obterChaveDataLocal(assignment.eventDate);
        if (eventStartDate && (!eventDateKey || eventDateKey < eventStartDate)) return false;
        if (eventEndDate && (!eventDateKey || eventDateKey > eventEndDate)) return false;
        if (searchTerms.length === 0) return true;
        const combinedString = normalizeSearch(
          [
            assignment.eventTitle,
            assignment.clientName,
            assignment.eventTypeName,
            assignment.professionalTypeName,
          ]
            .filter(Boolean)
            .join(' ')
        );
        return searchTerms.every((term) => combinedString.includes(term));
      })
      .sort((first, second) => {
        const firstDate = obterChaveDataLocal(first.eventDate);
        const secondDate = obterChaveDataLocal(second.eventDate);
        if (!firstDate && !secondDate) return 0;
        if (!firstDate) return 1;
        if (!secondDate) return -1;
        const comparison = firstDate.localeCompare(secondDate);
        return eventSortAscending ? comparison : -comparison;
      });

    const monthLabel = visibleAssignments.length
      ? new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
          toDate(visibleAssignments[0].eventDate) || new Date()
        )
      : '';

    return (
      <>
        {/* Controles de busca por texto, filtro por período e ordenação */}
        <View style={styles.eventSearchControls}>
          <View style={styles.eventSearchBox}>
            <Feather name="search" size={18} color={COLORS.textMuted} />
            <SeparadorCampoIcone />
            <TextInput
              style={styles.eventSearchInput}
              value={eventSearch}
              onChangeText={setEventSearch}
              placeholder="Buscar evento"
              placeholderTextColor={COLORS.textMuted}
              returnKeyType="search"
            />
            {!!eventSearch && (
              <TouchableOpacity
                onPress={() => setEventSearch('')}
                accessibilityRole="button"
                accessibilityLabel="Limpar busca"
              >
                <Feather name="x-circle" size={17} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <FiltroIntervaloDatas
            dataInicial={eventStartDate}
            dataFinal={eventEndDate}
            aoMudarDataInicial={setEventStartDate}
            aoMudarDataFinal={setEventEndDate}
            aoLimpar={() => {
              setEventStartDate('');
              setEventEndDate('');
            }}
            ativo={Boolean(eventStartDate || eventEndDate)}
            tituloModal="Filtros dos eventos"
            subtituloModal="Defina o período dos eventos"
            mostrarLimpar
          />
          <TouchableOpacity
            style={styles.eventSortButton}
            onPress={() => setEventSortAscending((ascending) => !ascending)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={`Ordenar por data ${eventSortAscending ? 'decrescente' : 'crescente'}`}
          >
            <Feather name={eventSortAscending ? 'arrow-up' : 'arrow-down'} size={18} color={COLORS.textNavy} />
          </TouchableOpacity>
        </View>

        {/* Pílulas de filtro por categoria (Aceitos / Pendentes) */}
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

        {/* Listagem dos cartões de eventos ou estado vazio */}
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
              {eventSearch || eventStartDate || eventEndDate
                ? 'Nenhum evento encontrado'
                : eventFilter === 'pending'
                ? 'Nenhuma convocação pendente'
                : 'Você ainda não tem eventos aceitos'}
            </Text>
            <Text style={styles.emptyText}>
              {eventSearch || eventStartDate || eventEndDate
                ? 'Ajuste os termos de busca ou o intervalo de datas.'
                : 'Quando houver eventos nesta categoria, eles aparecerão aqui.'}
            </Text>
          </View>
        )}
      </>
    );
  };

  /**
   * Renderiza o cartão individual de um evento na listagem da aba Eventos.
   */
  const renderEventCard = (assignment) => {
    return (
      <Card
        key={assignment.id}
        style={styles.eventCardOrganizer}
        onPress={() => openEventDetails(assignment)}
      >
        <Card.Content style={styles.eventCardContentOrganizer}>
          <View style={styles.linhaTopo}>
            <Text style={styles.tipoBadge}>
              {assignment.eventTypeName || assignment.professionalTypeName || 'Evento'}
            </Text>
            <Text style={styles.dataTexto}>{formatShortDate(assignment.eventDate)}</Text>
          </View>

          <Text style={styles.tituloEvento}>{assignment.eventTitle || 'Evento sem título'}</Text>

          <View style={styles.linhaInfo}>
            <Feather name="video" size={16} color={COLORS.textMuted} />
            <Text style={styles.textoCliente}>
              Função: {assignment.roleName || assignment.professionalTypeName || 'Equipe'}
            </Text>
          </View>

          <View style={styles.linhaStatus}>
            <View
              style={[
                styles.statusBadge,
                assignment.status === 'accepted' ? styles.statusBadgeVerde : styles.statusBadgeAmarelo,
              ]}
            >
              <Text
                style={[
                  styles.statusTexto,
                  assignment.status === 'accepted' ? styles.statusTextoVerde : styles.statusTextoAmarelo,
                ]}
              >
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

  /**
   * Renderiza a aba Perfil ('profile') com informações pessoais do técnico,
   * chave de notificações, redefinição de senha, botão de teste de notificação e logout.
   */
  const renderProfile = () => (
    <>
      {/* Cartão de identificação e dados cadastrais do técnico */}
      <View style={styles.userProfileCard}>
        <View style={styles.userProfileHeading}>
          <View style={styles.userProfileAvatar}>
            <Text style={styles.userProfileInitials}>
              {getInitials(profile.displayName || profile.name || user.name)}
            </Text>
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

        <Text style={styles.userProfileDetail}>
          CPF: {profile.cpf ? formatCpf(profile.cpf) : 'Não informado'}
        </Text>
        <Text style={styles.userProfileDetail} numberOfLines={1}>
          {profile.email || 'E-mail não informado'}
        </Text>
        <Text style={styles.userProfileDetail} numberOfLines={1}>
          {profile.phone ? formatPhone(profile.phone) : 'Telefone não informado'}
        </Text>

        <TouchableOpacity style={styles.editProfileButton} onPress={openProfileEditor} activeOpacity={0.8}>
          <Feather name="edit-2" size={15} color={COLORS.textNavy} />
          <Text style={styles.editProfileButtonText}>Editar seus dados</Text>
        </TouchableOpacity>
      </View>

      {/* Preferências de Notificações */}
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

      {/* Configurações de segurança e teste de notificação */}
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

      {/* Botão de encerramento de sessão */}
      <TouchableOpacity style={styles.profileLogout} onPress={onLogout} activeOpacity={0.8}>
        <Feather name="log-out" size={16} color="#FFFFFF" />
        <Text style={styles.profileLogoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </>
  );

  // --------------------------------------------------------------------------
  // 6. RENDERIZAÇÃO PRINCIPAL DA TELA E MODAIS (JSX)
  // --------------------------------------------------------------------------
  return (
    <View style={styles.screen}>
      {/* CABEÇALHO SUPERIOR COM CONTADOR DE NOTIFICAÇÕES NÃO LIDAS */}
      <Cabecalho
        titulo={
          activeTab === 'home'
            ? `Olá, ${profile.displayName || profile.name || 'Técnico'}!`
            : { events: 'Eventos', profile: 'Perfil' }[activeTab]
        }
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

      {/* ÁREA CENTRAL DE CONTEÚDO DA ABA ATIVA */}
      <ScrollView
        style={styles.mainContent}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}
      >
        {activeTab === 'home' && renderHome()}
        {activeTab === 'events' && renderEvents()}
        {activeTab === 'profile' && renderProfile()}
      </ScrollView>

      {/* MODAL DE FEEDBACK: SUCESSO */}
      <Modal visible={modalSucessoVisivel} transparent animationType="fade">
        <View style={styles.feedbackModalOverlay}>
          <View style={styles.feedbackModalCard}>
            <View style={styles.feedbackSuccessIconCircle}>
              <Feather name="check" size={32} color="#10B981" />
            </View>
            <Text style={styles.feedbackModalTitle}>{msgSucesso.titulo}</Text>
            <Text style={styles.feedbackModalDescription}>{msgSucesso.descricao}</Text>
            <Button
              mode="contained"
              style={styles.feedbackModalButton}
              buttonColor={CORES.buttonGold}
              textColor={CORES.textNavy}
              onPress={() => setModalSucessoVisivel(false)}
            >
              Ok
            </Button>
          </View>
        </View>
      </Modal>

      {/* MODAL DE FEEDBACK: ERRO */}
      <Modal visible={modalErroVisivel} transparent animationType="fade">
        <View style={styles.feedbackModalOverlay}>
          <View style={styles.feedbackModalCard}>
            <View style={styles.feedbackErrorIconCircle}>
              <Feather name="alert-triangle" size={32} color="#EF4444" />
            </View>
            <Text style={styles.feedbackModalTitle}>{msgErro.titulo}</Text>
            <Text style={styles.feedbackModalDescription}>{msgErro.descricao}</Text>
            <Button
              mode="contained"
              style={styles.feedbackModalButton}
              buttonColor="#EF4444"
              textColor="#FFF"
              onPress={() => setModalErroVisivel(false)}
            >
              Ok, entendi
            </Button>
          </View>
        </View>
      </Modal>

      {/* MODAL DE EDIÇÃO DOS DADOS CADASTRAIS DO PERFIL */}
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
              <TouchableOpacity onPress={() => setProfileEditorVisible(false)}>
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
              onChangeText={(phone) =>
                setProfileForm((current) => ({ ...current, phone: formatPhone(phone) }))
              }
              placeholder="(00) 00000-0000"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
            />
            <Text style={styles.profileEmailNote}>
              O e-mail da conta não pode ser alterado por esta tela.
            </Text>
            <View style={styles.profileEditorActions}>
              <TouchableOpacity
                style={styles.profileCancelButton}
                onPress={() => setProfileEditorVisible(false)}
                disabled={isSavingProfile}
              >
                <Text style={styles.profileCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.profileSaveButton}
                onPress={saveProfile}
                disabled={isSavingProfile}
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

      {/* MODAL DE CONFIRMAÇÃO DE INDISPONIBILIDADE NA AGENDA */}
      <Modal
        visible={isAvailabilityDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAvailabilityDialogVisible(false)}
      >
        <View style={styles.profileModalOverlay}>
          <View style={styles.availabilityDialogCard}>
            <View style={styles.profileSecurityIcon}>
              <Feather
                name={availabilityDialogWasUnavailable ? 'calendar' : 'slash'}
                size={19}
                color={COLORS.textNavy}
              />
            </View>
            <Text style={styles.availabilityDialogTitle}>
              {availabilityDialogWasUnavailable ? 'Remover indisponibilidade?' : 'Adicionar indisponibilidade?'}
            </Text>
            <Text style={styles.availabilityDialogMessage}>
              {availabilityDialogWasUnavailable
                ? `Você ficará disponível em ${formatAgendaDate(availabilityDialogDate)}.`
                : `Você ficará indisponível em ${formatAgendaDate(availabilityDialogDate)}.`}
            </Text>
            <View style={styles.profileEditorActions}>
              <TouchableOpacity
                style={styles.profileCancelButton}
                onPress={() => setAvailabilityDialogVisible(false)}
                disabled={isUpdatingAvailability}
              >
                <Text style={styles.profileCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.profileSaveButton}
                onPress={confirmAvailabilityChange}
                disabled={isUpdatingAvailability}
              >
                {isUpdatingAvailability ? (
                  <ActivityIndicator size="small" color={COLORS.textNavy} />
                ) : (
                  <Text style={styles.profileSaveButtonText}>
                    {availabilityDialogWasUnavailable ? 'Remover' : 'Confirmar'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BarraInferior
        abaAtiva={activeTab}
        abas={[
          {
            chave: 'home',
            rotulo: 'Início',
            ComponenteIcone: Feather,
            icone: 'home',
            badge: pendingAssignments.length,
            aoSelecionar: () => setActiveTab('home'),
          },
          {
            chave: 'events',
            rotulo: 'Eventos',
            ComponenteIcone: Feather,
            icone: 'tag',
            aoSelecionar: () => setActiveTab('events'),
          },
          {
            chave: 'profile',
            rotulo: 'Perfil',
            ComponenteIcone: Feather,
            icone: 'user',
            aoSelecionar: () => setActiveTab('profile'),
          },
        ]}
      />
    </View>
  );
}
