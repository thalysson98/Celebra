// ============================================================================
// src/telas/tecnico/TelaDetalhesEventoTecnico.js
// Tela responsável por exibir todas as informações detalhadas de um evento
// (data, horário, convidados, locais, equipe confirmada e notas de produção)
// e permitir que o técnico aceite ou recuse convocações pendentes.
// ============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Card, Button } from 'react-native-paper';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { autenticacao } from '../../configuracao/configuracaoFirebase';
import { CORES, FONTES } from '../../tema/cores';
import { estilosDetalhesEventoTecnico as styles } from '../../estilos/estilosDetalhesEventoTecnico';
import {
  formatarDataBrasilia,
  formatarHoraBrasilia,
} from '../../compartilhado/dataHoraBrasilia';
import {
  respondToAssignment,
  subscribeToTechnicianAssignmentStatus,
} from '../../servicos/servicoEscala';
import { marcarNotificacoesEventoComoLidas } from '../../servicos/servicoNotificacoes';
import { repositorioEventos } from '../../servicos/repositorioEventos';
import { exportarEventoParaPdf } from '../../servicos/servicoExportacaoEvento';
import CartaoLocal from '../../componentes/CartaoLocal';

function converterParaData(valor) {
  if (!valor) return null;
  const data = typeof valor.toDate === 'function' ? valor.toDate() : new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

// ============================================================================
// COMPONENTE PRINCIPAL DA TELA DE DETALHES DO EVENTO DO TÉCNICO
// ============================================================================

export default function TelaDetalhesEventoTecnico({ route, navigation }) {
  // Calcula o espaço seguro da parte inferior do celular para não esconder o fim do convite
  const insets = useSafeAreaInsets();
  const espacoInferior = Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 32);

  // Recupera o objeto de convocação (assignment) passado via parâmetros de navegação
  const { assignment } = route.params || {};

  // Estados de carregamento e dados complementares do evento buscados no Firestore
  const [respondendo, setRespondendo] = useState(false);
  const [eventoDetalhado, setEventoDetalhado] = useState(null);
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(true);
  const [exportandoPdf, setExportandoPdf] = useState(false);
  const [statusConvite, setStatusConvite] = useState('checking');

  // Estados para controle dos modais de feedback visual (sucesso e erro)
  const [modalSucessoVisivel, setModalSucessoVisivel] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState({ titulo: '', descricao: '' });
  const [modalErroVisivel, setModalErroVisivel] = useState(false);
  const [msgErro, setMsgErro] = useState('');

  // Identifica se a convocação já foi aceita pelo técnico e o nome da empresa organizadora
  const isAccepted = statusConvite === 'accepted';
  const canExportPdf = isAccepted && assignment?.status === 'accepted';
  const isPending = statusConvite === 'pending';
  const empresa = assignment?.nomeEmpresa || assignment?.companyName || 'O Organizador';
  const idEvento = assignment?.idEvento || assignment?.eventId;
  const idUsuario = assignment?.idUsuario || autenticacao?.currentUser?.uid;
  const idConvite = idEvento && idUsuario ? `${idEvento}_${idUsuario}` : null;
  const acessoPermitido = isAccepted || isPending;

  // --------------------------------------------------------------------------
  // 1. CARREGAMENTO DOS DADOS COMPLEMENTARES DO EVENTO NO FIRESTORE
  // --------------------------------------------------------------------------

  /**
   * Busca os dados completos do evento (locais detalhados, equipe confirmada,
   * notas de produção e quantidade de convidados) pelo ID do evento.
   */
  const carregarEvento = useCallback(async () => {
    if (!idEvento) {
      setEventoDetalhado(null);
      setCarregandoDetalhes(false);
      return;
    }

    setCarregandoDetalhes(true);
    try {
      const dados = await repositorioEventos.obterEvento(idEvento);
      setEventoDetalhado(dados);
    } catch (error) {
      mostrarErro('Não foi possível carregar os detalhes complementares do evento.');
    } finally {
      setCarregandoDetalhes(false);
    }
  }, [idEvento]);

  // Verifica o convite atual antes de carregar qualquer dado do evento.
  useFocusEffect(
    useCallback(() => {
      setEventoDetalhado(null);
      setCarregandoDetalhes(true);
      setStatusConvite('checking');
      if (!idConvite) {
        setStatusConvite('unavailable');
        setCarregandoDetalhes(false);
        return undefined;
      }

      return subscribeToTechnicianAssignmentStatus(
        idConvite,
        (status) => setStatusConvite(status || 'unavailable'),
        () => {
          setStatusConvite('unavailable');
          setCarregandoDetalhes(false);
          mostrarErro('Não foi possível verificar o status atual do convite.');
        }
      );
    }, [idConvite])
  );

  useEffect(() => {
    if (acessoPermitido) {
      carregarEvento();
    } else if (statusConvite !== 'checking') {
      setEventoDetalhado(null);
      setCarregandoDetalhes(false);
    }
  }, [acessoPermitido, carregarEvento, statusConvite]);

  // --------------------------------------------------------------------------
  // 2. FUNÇÕES AUXILIARES DE FEEDBACK E RESPOSTA À CONVOCAÇÃO
  // --------------------------------------------------------------------------

  /**
   * Exibe o modal de sucesso com título e descrição personalizados.
   */
  const mostrarSucesso = (titulo, descricao) => {
    setMsgSucesso({ titulo, descricao });
    setModalSucessoVisivel(true);
  };

  /**
   * Exibe o modal de erro com a mensagem informada.
   */
  const mostrarErro = (mensagem) => {
    setMsgErro(mensagem);
    setModalErroVisivel(true);
  };

  /**
   * Registra a resposta do técnico ao convite ('accepted' para aceitar ou 'declined' para recusar),
   * atualizando a convocação e a lista de membros escalados do evento no Firestore.
   */
  const responderConvite = async (status) => {
    setRespondendo(true);
    try {
      if (status === 'declined') {
        console.log('[convocacao][recusa][tela] botão acionado', {
          idConvite,
          tecnicoIdentificado: Boolean(idUsuario),
        });
      }
      await respondToAssignment({
        assignmentId: idConvite,
        technicianUid: idUsuario,
        status: status,
      });
      if (status === 'declined') {
        console.log('[convocacao][recusa][tela] serviço concluído', { idConvite });
      }
      // Ao recusar o evento, marca como lidas as notificações/lembretes dele e cancela alarmes locais
      if (status === 'declined' && idUsuario && idEvento) {
        await marcarNotificacoesEventoComoLidas(idUsuario, idEvento);
      }
      mostrarSucesso(
        'Sucesso',
        status === 'accepted'
          ? 'Convocação aceita! O evento foi para sua agenda.'
          : 'Convocação recusada.'
      );
    } catch (e) {
      if (status === 'declined') {
        console.error('[convocacao][recusa][tela] falha ao responder', {
          idConvite,
          mensagem: e?.message || String(e),
        });
      }
      mostrarErro(e.message || 'Não foi possível processar sua resposta.');
      setRespondendo(false);
    }
  };

  /**
   * Fecha o modal de sucesso e retorna para a tela anterior após responder à convocação.
   */
  const fecharComSucesso = () => {
    setModalSucessoVisivel(false);
    navigation.goBack();
  };

  // --------------------------------------------------------------------------
  // 3. PREPARAÇÃO E FORMATAÇÃO DOS DADOS PARA EXIBIÇÃO
  // --------------------------------------------------------------------------

  const titulo = eventoDetalhado?.titulo || assignment?.eventTitle || 'Evento Sem Título';

  // Formata a data de início do evento no padrão DD/MM/AAAA
  const dataInicioEventoAtual = converterParaData(eventoDetalhado?.data_inicio);
  const dataInicioEvento =
    dataInicioEventoAtual || converterParaData(assignment?.eventDate);
  let dataFormatada = 'Data a confirmar';
  if (eventoDetalhado?.dataInicio) {
    dataFormatada = eventoDetalhado.dataInicio;
  } else if (dataInicioEvento) {
    dataFormatada = formatarDataBrasilia(dataInicioEvento);
  }

  // Formata o horário de início do evento no padrão HH:MMh
  const horaFonte =
    eventoDetalhado?.hora_inicio ||
    eventoDetalhado?.horaInicioLocal ||
    eventoDetalhado?.horaInicio ||
    assignment?.eventTime ||
    dataInicioEvento;
  const horaFormatada = formatarHoraBrasilia(horaFonte) || 'Horário a confirmar';

  const notas =
    eventoDetalhado?.notasProducao ||
    assignment?.productionNotes ||
    'Nenhuma observação registrada.';

  // Prepara e ordena cronologicamente os locais do evento pelo horário
  let locaisBase = [];
  if (eventoDetalhado) {
    locaisBase =
      eventoDetalhado.locais?.length > 0
        ? eventoDetalhado.locais
        : eventoDetalhado.locais_detalhados || [];
  } else if (assignment?.eventLocations?.length > 0) {
    locaisBase = assignment.eventLocations;
  } else if (assignment?.eventAddress) {
    locaisBase = [{ enderecoLocal: assignment.eventAddress, tipoLocal: 'Local Principal' }];
  }
  const locaisOrdenados = [...locaisBase].sort((a, b) =>
    (a.horaLocal || '').localeCompare(b.horaLocal || '')
  );

  // Filtra apenas os profissionais confirmados ou informativos para exibição na equipe
  // e garante que o técnico logado ("Você") apareça sempre como primeiro membro da lista
  const equipe = (eventoDetalhado?.equipe || [])
    .filter(
      (p) =>
        p.statusConfirmacao === 'Confirmado' ||
        p.statusConfirmacao === 'Informativo' ||
        p.enviarConvite === false
    )
    .sort((a, b) => {
      const aEhVoce = Boolean(a.idUsuario && a.idUsuario === idUsuario);
      const bEhVoce = Boolean(b.idUsuario && b.idUsuario === idUsuario);
      if (aEhVoce && !bEhVoce) return -1;
      if (!aEhVoce && bEhVoce) return 1;
      return 0;
    });
  const quantidadeConvidados = Number(
    eventoDetalhado?.quantidade_convidados ??
    eventoDetalhado?.quantidadeConvidados ??
    eventoDetalhado?.num_convidados ??
    eventoDetalhado?.numConvidados ??
    eventoDetalhado?.guestCount ??
    assignment?.guestCount ??
    0
  );

  const exportarPdf = async () => {
    setExportandoPdf(true);
    try {
      await exportarEventoParaPdf({
        titulo,
        tipo: eventoDetalhado?.tipoEvento || assignment?.eventTypeName,
        data: dataFormatada,
        horario: horaFormatada,
        cliente: eventoDetalhado?.cliente?.nome || assignment?.clientName,
        quantidade_convidados: quantidadeConvidados,
        funcao: assignment?.roleName,
        organizador: empresa,
        locais: locaisOrdenados,
        equipe,
        notas,
      });
    } catch (error) {
      mostrarErro(error.message || 'Não foi possível exportar o PDF do evento.');
    } finally {
      setExportandoPdf(false);
    }
  };

  // --------------------------------------------------------------------------
  // 4. RENDERIZAÇÃO DA INTERFACE (JSX)
  // --------------------------------------------------------------------------
  return (
    <View style={styles.screen}>
      {/* CABEÇALHO SUPERIOR */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
            <Text style={styles.headerTitle}>
              {isAccepted ? 'Detalhes do Evento' : 'Convocação'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => navigation.navigate('Notificacoes', { idUsuario })}
          >
            <Feather name="bell" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {statusConvite === 'checking' || (acessoPermitido && carregandoDetalhes) ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={CORES.buttonGold} />
        </View>
      ) : !acessoPermitido ? (
        <View style={styles.center}>
          <Feather name="lock" size={34} color={CORES.textMuted} />
          <Text style={[styles.sectionTitle, { textAlign: 'center', marginTop: 16 }]}>
            Evento indisponível
          </Text>
          <Text style={[styles.sectionHint, { textAlign: 'center' }]}>
            {statusConvite === 'declined'
              ? 'Você recusou esta convocação. Os detalhes do evento não estão mais disponíveis.'
              : statusConvite === 'cancelled'
                ? 'Esta convocação foi cancelada e os detalhes do evento não estão mais disponíveis.'
                : 'Não foi possível confirmar uma convocação ativa para este evento.'}
          </Text>
          <Button mode="contained" onPress={() => navigation.goBack()}>
            Voltar
          </Button>
        </View>
      ) : (
        /* CONTEÚDO PRINCIPAL COM ROLAGEM (SCROLL) */
        <ScrollView
          style={styles.body}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: isPending ? 28 : espacoInferior + 32 },
          ]}
          showsVerticalScrollIndicator={Platform.OS === 'web'}
        >
          {/* SUBTÍTULO DE STATUS DA CONVOCAÇÃO */}
          {isAccepted ? (
            <Text style={styles.subtitleText}>
              Você está confirmado na equipe de <Text style={styles.boldText}>{empresa}</Text> para
              este evento.
            </Text>
          ) : (
            <Text style={styles.subtitleText}>
              <Text style={styles.boldText}>{empresa}</Text> convocou você para trabalhar neste
              evento.
            </Text>
          )}

          {canExportPdf && (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={exportarPdf}
              disabled={exportandoPdf}
              style={{
                minHeight: 46,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: CORES.buttonGold,
                borderRadius: 11,
                marginBottom: 18,
                opacity: exportandoPdf ? 0.65 : 1,
              }}
            >
              {exportandoPdf ? (
                <ActivityIndicator size="small" color={CORES.textNavy} />
              ) : (
                <Feather name="share" size={16} color={CORES.textNavy} />
              )}
              <Text style={{ color: CORES.textNavy, fontFamily: FONTES.bold, fontSize: 14 }}>
                {exportandoPdf ? 'Gerando PDF...' : 'Exportar PDF'}
              </Text>
            </TouchableOpacity>
          )}

          {/* CARTÃO PRINCIPAL: RESUMO DO EVENTO (TIPO, TÍTULO, FUNÇÃO, DATA, HORÁRIO E CONVIDADOS) */}
          <Card style={[styles.card, styles.mainEventCard]}>
            <Card.Content style={styles.mainEventCardContent}>
              <Text style={styles.tipoBadgeDetalhe}>
                {(
                  eventoDetalhado?.tipoEvento ||
                  assignment?.eventTypeName ||
                  'EVENTO'
                ).toUpperCase()}
              </Text>

              <Text style={styles.tituloEventoDetalhe}>{titulo}</Text>

              <Text style={styles.funcaoDetalhe}>
                Sua função: {assignment?.roleName || 'Equipe'}
              </Text>

              <View style={styles.infoBox}>
                {/* Linha: Data do evento */}
                <View style={styles.infoRowWithBottomMargin}>
                  <View style={styles.infoIconBox}>
                    <Feather name="calendar" size={16} color={CORES.textNavy} />
                  </View>
                  <View>
                    <Text style={styles.infoLabel}>Data do evento</Text>
                    <Text style={styles.infoValue}>{dataFormatada}</Text>
                  </View>
                </View>

                {/* Linha: Horário do evento */}
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBox}>
                    <Feather name="clock" size={16} color={CORES.textNavy} />
                  </View>
                  <View>
                    <Text style={styles.infoLabel}>Horário</Text>
                    <Text style={styles.infoValue}>{horaFormatada}</Text>
                  </View>
                </View>

                {/* Linha: Quantidade de convidados */}
                <View
                  accessible
                  accessibilityLabel={`Quantidade de convidados: ${quantidadeConvidados}`}
                  style={styles.infoRowWithTopMargin}
                >
                  <View style={styles.infoIconBox}>
                    <Feather name="users" size={16} color={CORES.textNavy} />
                  </View>
                  <View>
                    <Text style={styles.infoLabel}>Convidados</Text>
                    <Text style={styles.infoValue}>{quantidadeConvidados}</Text>
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* SEÇÃO: LOCAIS DO EVENTO */}
          <Text style={styles.sectionTitle}>Locais do Evento</Text>
          {locaisOrdenados.length > 0 ? (
            locaisOrdenados.map((local, index) => (
              <CartaoLocal key={index} local={local} />
            ))
          ) : (
            <Text style={styles.sectionHint}>Nenhum local cadastrado.</Text>
          )}

          {/* SEÇÃO: EQUIPE CONFIRMADA */}
          <Text style={styles.sectionTitle}>Equipe Confirmada</Text>
          {equipe.length > 0 ? (
            <Card style={styles.card}>
              <Card.Content>
                {equipe.map((pessoa, index) => {
                  const ehVoce = Boolean(pessoa.idUsuario && pessoa.idUsuario === idUsuario);
                  return (
                    <View
                      key={pessoa.id || index}
                      style={[
                        styles.personRow,
                        ehVoce && styles.personRowSelf,
                      ]}
                    >
                      <View
                        style={[
                          styles.personIcon,
                          ehVoce && styles.personIconSelf,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="account-outline"
                          size={24}
                          color={CORES.textNavy}
                        />
                      </View>
                      <View style={styles.personInfo}>
                        <Text style={styles.personName} numberOfLines={1}>
                          {ehVoce ? 'Você' : pessoa.nomeProfissional}
                        </Text>
                        <Text style={styles.personMeta} numberOfLines={1}>
                          {pessoa.funcao}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </Card.Content>
            </Card>
          ) : (
            <Text style={styles.sectionHint}>Nenhum outro profissional confirmado ainda.</Text>
          )}

          {/* CARTÃO: NOTAS DA PRODUÇÃO */}
          <Card style={styles.productionNotesCard}>
            <Card.Content style={styles.productionNotesContent}>
              <View style={styles.productionNotesHeading}>
                <View style={styles.productionNotesIcon}>
                  <Feather name="file-text" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.productionNotesHeadingText}>
                  <Text style={styles.productionNotesTitle}>Notas da produção</Text>
                  <Text style={styles.productionNotesSubtitle}>
                    Informações importantes para a equipe
                  </Text>
                </View>
              </View>
              <View style={styles.productionNotesDivider} />
              <Text style={styles.productionNotesText}>{notas}</Text>
            </Card.Content>
          </Card>
        </ScrollView>
      )}

      {/* BARRA INFERIOR PARA RESPONDER À CONVOCAÇÃO PENDENTE (EM FLUXO FLEX PARA NÃO ESCONDER O CONTEÚDO) */}
      {isPending && !carregandoDetalhes && (
        <View style={[styles.bottomActionArea, { paddingBottom: espacoInferior + 16 }]}>
          {respondendo ? (
            <ActivityIndicator size="large" color="#10B981" style={styles.respondingLoader} />
          ) : (
            <>
              <TouchableOpacity
                style={styles.btnAccept}
                onPress={() => responderConvite('accepted')}
              >
                <Text style={styles.btnAcceptText}>Aceitar convocação</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnReject}
                onPress={() => responderConvite('declined')}
              >
                <Text style={styles.btnRejectText}>Recusar convocação</Text>
              </TouchableOpacity>

              <Text style={styles.disclaimer}>
                Ao aceitar, este evento será adicionado automaticamente à sua agenda.
              </Text>
            </>
          )}
        </View>
      )}

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
              onPress={fecharComSucesso}
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
            <Text style={styles.feedbackModalTitle}>Atenção</Text>
            <Text style={styles.feedbackModalDescription}>{msgErro}</Text>
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
    </View>
  );
}
