// ============================================================================
// src/telas/tecnico/TelaDetalhesEventoTecnico.js
// Tela responsável por exibir todas as informações detalhadas de um evento
// (data, horário, convidados, locais, equipe confirmada e notas de produção)
// e permitir que o técnico aceite ou recuse convocações pendentes.
// ============================================================================

import React, { useCallback, useState } from 'react';
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
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { CORES, FONTES } from '../../tema/cores';
import { estilosDetalhesEventoTecnico as styles } from '../../estilos/estilosDetalhesEventoTecnico';
import { respondToAssignment } from '../../servicos/servicoEscala';
import { repositorioEventos } from '../../servicos/repositorioEventos';
import CartaoLocal from '../../componentes/CartaoLocal';

// ============================================================================
// COMPONENTE PRINCIPAL DA TELA DE DETALHES DO EVENTO DO TÉCNICO
// ============================================================================

export default function TelaDetalhesEventoTecnico({ route, navigation }) {
  // Recupera o objeto de convocação (assignment) passado via parâmetros de navegação
  const { assignment } = route.params || {};

  // Estados de carregamento e dados complementares do evento buscados no Firestore
  const [respondendo, setRespondendo] = useState(false);
  const [eventoDetalhado, setEventoDetalhado] = useState(null);
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(true);

  // Estados para controle dos modais de feedback visual (sucesso e erro)
  const [modalSucessoVisivel, setModalSucessoVisivel] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState({ titulo: '', descricao: '' });
  const [modalErroVisivel, setModalErroVisivel] = useState(false);
  const [msgErro, setMsgErro] = useState('');

  // Identifica se a convocação já foi aceita pelo técnico e o nome da empresa organizadora
  const isAccepted = assignment?.status === 'accepted';
  const empresa = assignment?.nomeEmpresa || assignment?.companyName || 'O Organizador';

  // --------------------------------------------------------------------------
  // 1. CARREGAMENTO DOS DADOS COMPLEMENTARES DO EVENTO NO FIRESTORE
  // --------------------------------------------------------------------------

  /**
   * Busca os dados completos do evento (locais detalhados, equipe confirmada,
   * notas de produção e quantidade de convidados) pelo ID do evento.
   */
  const carregarEvento = useCallback(async () => {
    if (!assignment?.idEvento) return;
    try {
      const dados = await repositorioEventos.obterEvento(assignment.idEvento);
      setEventoDetalhado(dados);
    } catch (error) {
      mostrarErro('Não foi possível carregar os detalhes complementares do evento.');
    } finally {
      setCarregandoDetalhes(false);
    }
  }, [assignment?.idEvento]);

  // Recarrega os detalhes sempre que a tela recebe foco na navegação
  useFocusEffect(
    useCallback(() => {
      carregarEvento();
    }, [carregarEvento])
  );

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
      await respondToAssignment({
        assignmentId: assignment.id,
        technicianUid: assignment.idUsuario,
        status: status,
      });
      mostrarSucesso(
        'Sucesso',
        status === 'accepted'
          ? 'Convocação aceita! O evento foi para sua agenda.'
          : 'Convocação recusada.'
      );
    } catch (e) {
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
  let dataFormatada = 'Data a confirmar';
  if (eventoDetalhado?.dataInicio) {
    dataFormatada = eventoDetalhado.dataInicio;
  } else if (assignment?.eventDate) {
    const d = new Date(assignment.eventDate);
    dataFormatada = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  // Formata o horário de início do evento no padrão HH:MMh
  let horaFormatada = 'Horário a confirmar';
  if (eventoDetalhado?.horaInicio) {
    horaFormatada = eventoDetalhado.horaInicio;
  } else if (assignment?.eventDate) {
    const d = new Date(assignment.eventDate);
    horaFormatada = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}h`;
  }

  const notas =
    eventoDetalhado?.notasProducao ||
    assignment?.productionNotes ||
    'Nenhuma observação registrada.';

  // Prepara e ordena cronologicamente os locais do evento pelo horário
  const locaisBase =
    eventoDetalhado?.locais ||
    (assignment?.eventAddress
      ? [{ enderecoLocal: assignment.eventAddress, tipoLocal: 'Local Principal' }]
      : []);
  const locaisOrdenados = [...locaisBase].sort((a, b) =>
    (a.horaLocal || horaFormatada).localeCompare(b.horaLocal || horaFormatada)
  );

  // Filtra apenas os profissionais confirmados ou informativos para exibição na equipe
  const equipe = (eventoDetalhado?.equipe || []).filter(
    (p) =>
      p.statusConfirmacao === 'Confirmado' ||
      p.statusConfirmacao === 'Informativo' ||
      p.enviarConvite === false
  );
  const quantidadeConvidados = Number(eventoDetalhado?.numConvidados ?? 0);

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
            onPress={() => navigation.navigate('Notificacoes')}
          >
            <Feather name="bell" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {carregandoDetalhes ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={CORES.buttonGold} />
        </View>
      ) : (
        /* CONTEÚDO PRINCIPAL COM ROLAGEM (SCROLL) */
        <ScrollView
          style={styles.body}
          contentContainerStyle={[
            styles.scrollContent,
            assignment?.status === 'pending' && styles.scrollContentPending,
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
              <CartaoLocal key={index} local={local} fallbackHora={horaFormatada} />
            ))
          ) : (
            <Text style={styles.sectionHint}>Nenhum local cadastrado.</Text>
          )}

          {/* SEÇÃO: EQUIPE CONFIRMADA */}
          <Text style={styles.sectionTitle}>Equipe Confirmada</Text>
          {equipe.length > 0 ? (
            <Card style={styles.card}>
              <Card.Content>
                {equipe.map((pessoa, index) => (
                  <View
                    key={pessoa.id || index}
                    style={[
                      styles.personRow,
                      pessoa.idUsuario &&
                        pessoa.idUsuario === assignment?.idUsuario &&
                        styles.personRowSelf,
                    ]}
                  >
                    <View
                      style={[
                        styles.personIcon,
                        pessoa.idUsuario &&
                          pessoa.idUsuario === assignment?.idUsuario &&
                          styles.personIconSelf,
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
                        {pessoa.idUsuario && pessoa.idUsuario === assignment?.idUsuario
                          ? 'Você'
                          : pessoa.nomeProfissional}
                      </Text>
                      <Text style={styles.personMeta} numberOfLines={1}>
                        {pessoa.funcao}
                      </Text>
                    </View>
                  </View>
                ))}
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

      {/* BARRA INFERIOR FIXA PARA RESPONDER À CONVOCAÇÃO PENDENTE */}
      {assignment?.status === 'pending' && !carregandoDetalhes && (
        <View style={styles.bottomActionArea}>
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
