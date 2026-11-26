// ============================================================================
// src/telas/TelaNotificacoes.js
// Tela responsável por listar, filtrar, alternar status (lida/não lida)
// e redirecionar o usuário para a tela relacionada à notificação.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { autenticacao } from '../configuracao/configuracaoFirebase';
import { CORES, FONTES } from '../tema/cores';
import {
  formatarDataBrasilia,
  formatarHoraBrasilia,
} from '../compartilhado/dataHoraBrasilia';
import { subscribeToTechnicianAssignments } from '../servicos/servicoEscala';
import {
  assinarNotificacoesUsuario,
  alterarStatusLeituraNotificacao,
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas,
} from '../servicos/servicoNotificacoes';

// ============================================================================
// FUNÇÕES AUXILIARES DE FORMATAÇÃO E CONVERSÃO DE DATAS
// ============================================================================

/**
 * Converte valores de data do Firestore (Timestamp, String ou Date) para objeto Date válido.
 */
function converterParaData(valor) {
  if (!valor) return null;
  const data = typeof valor.toDate === 'function' ? valor.toDate() : new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

/**
 * Formata a data/hora da notificação para exibição amigável no card (ex: "Hoje, 14:30").
 */
function formatarDataHoraNotificacao(timestamp) {
  const data = converterParaData(timestamp);
  if (!data) return 'Agora mesmo';

  const dataFormatada = formatarDataBrasilia(data);
  const horaFormatada = formatarHoraBrasilia(data);
  if (dataFormatada === formatarDataBrasilia(new Date())) return `Hoje, ${horaFormatada}`;
  return `${dataFormatada}, ${horaFormatada}`;
}

// ============================================================================
// COMPONENTE PRINCIPAL DA TELA DE NOTIFICAÇÕES
// ============================================================================

export default function TelaNotificacoes({ navigation, route }) {
  // Margem inferior segura para o final da lista não ficar atrás da barra do celular
  const insets = useSafeAreaInsets();

  // Estados para controlar abas, notificações, loading inicial e loading ao clicar em um evento
  const [abaAtiva, setAbaAtiva] = useState('nao_lidas');
  const [notificacoes, setNotificacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [abrindoNotificacaoId, setAbrindoNotificacaoId] = useState(null);
  const [avisoIndisponivelVisivel, setAvisoIndisponivelVisivel] = useState(false);

  // Recupera o ID do usuário e a lista inicial de eventos recebida pela navegação
  const idUsuario = route?.params?.idUsuario || autenticacao?.currentUser?.uid;
  const assignmentsIniciais = route?.params?.assignments || [];
  const [assignments, setAssignments] = useState(assignmentsIniciais);
  const [carregandoConvocacoes, setCarregandoConvocacoes] = useState(
    assignmentsIniciais.length === 0
  );

  useEffect(() => navigation.addListener('focus', () => setAbrindoNotificacaoId(null)), [navigation]);

  // Mantém a lista de convocações atualizada em tempo real para abrir o evento correto ao clicar
  useEffect(() => {
    if (!idUsuario) {
      setCarregandoConvocacoes(false);
      return;
    }

    const cancelarConvocacoes = subscribeToTechnicianAssignments(
      idUsuario,
      (lista) => {
        setAssignments(lista || []);
        setCarregandoConvocacoes(false);
      },
      () => {
        setCarregandoConvocacoes(false);
      }
    );

    return () => {
      if (typeof cancelarConvocacoes === 'function') cancelarConvocacoes();
    };
  }, [idUsuario]);

  // --------------------------------------------------------------------------
  // 1. ESCUTA EM TEMPO REAL DAS NOTIFICAÇÕES NO FIRESTORE
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!idUsuario) {
      setCarregando(false);
      return;
    }

    const cancelarAssinatura = assinarNotificacoesUsuario(
      idUsuario,
      (lista) => {
        setNotificacoes(lista);
        setCarregando(false);
      },
      (erro) => {
        console.log('Erro ao buscar notificações:', erro);
        setCarregando(false);
      }
    );

    // Encerra a escuta ao desmontar a tela para evitar consumo de memória
    return () => {
      if (typeof cancelarAssinatura === 'function') cancelarAssinatura();
    };
  }, [idUsuario]);

  // --------------------------------------------------------------------------
  // 2. FILTRAGEM ENTRE AS ABAS "NÃO LIDAS" E "LIDAS"
  // --------------------------------------------------------------------------
  const notificacoesFiltradas = useMemo(() => {
    return notificacoes.filter((item) =>
      abaAtiva === 'nao_lidas' ? !item.lida : Boolean(item.lida)
    );
  }, [notificacoes, abaAtiva]);

  // --------------------------------------------------------------------------
  // 3. LOCALIZAÇÃO E NAVEGAÇÃO PARA O EVENTO DA NOTIFICAÇÃO
  // --------------------------------------------------------------------------

  /**
   * Procura na lista de convocações (assignments) do técnico qual é o evento
   * vinculado à notificação clicada (busca por ID ou pelo título do evento).
   */
  const encontrarEventoDaNotificacao = (notificacao) => {
    if (!assignments || assignments.length === 0) return null;

    // Notificações de convocação removida ou evento cancelado não devem abrir nenhum evento
    if (
      notificacao.tipo === 'convocacao_removida' ||
      notificacao.tipo === 'evento_cancelado'
    ) {
      return null;
    }

    // Captura possíveis nomes de campos que guardam o ID do evento na notificação
    const idEventoAlvo =
      notificacao.eventoId ||
      notificacao.eventId ||
      notificacao.id_evento ||
      notificacao.assignmentId ||
      notificacao.idEvento;

    // 1ª Tentativa: Se a notificação tem ID do evento, busca apenas por esse ID exato
    if (idEventoAlvo) {
      return (
        assignments.find(
          (a) =>
            a.id === idEventoAlvo ||
            a.idEvento === idEventoAlvo ||
            a.eventId === idEventoAlvo
        ) || null
      );
    }

    // 2ª Tentativa (apenas para notificações antigas sem ID): busca pelo nome do evento
    const textoNotificacao = `${notificacao.titulo || ''} ${notificacao.mensagem || ''}`.toLowerCase();
    return assignments.find(
      (a) => a.eventTitle && textoNotificacao.includes(a.eventTitle.toLowerCase())
    );
  };

  /**
   * Ação executada ao clicar em cima do card da notificação:
   * 1. Ativa o loading para evitar cliques repetidos.
   * 2. Marca a notificação como lida no Firestore (vai para a aba "Lidas").
   * 3. Abre a tela de detalhes do evento correspondente ou avisa se não estiver mais ativo.
   */
  const aoClicarEmNotificacao = async (notificacao) => {
    if (abrindoNotificacaoId) return;

    const inicioCarregamento = Date.now();
    let navegouParaEvento = false;
    setAbrindoNotificacaoId(notificacao.id);
    try {
      // Se ainda não estiver lida, atualiza para lida (true) no banco
      if (!notificacao.lida) {
        await marcarNotificacaoComoLida(notificacao.id);
      }

      if (notificacao.tipo === 'convocacao_recusada' && notificacao.id_evento) {
        const tempoRestante = 220 - (Date.now() - inicioCarregamento);
        if (tempoRestante > 0) {
          await new Promise((resolve) => setTimeout(resolve, tempoRestante));
        }
        navigation.navigate('AbasPrincipais', {
          screen: 'Eventos',
          params: {
            screen: 'DetalheEvento',
            params: { idEvento: notificacao.id_evento, abaInicial: 'Equipe' },
          },
        });
        navegouParaEvento = true;
        return;
      }

      // Localiza os dados do evento para abrir a tela de detalhes
      const eventoEncontrado = encontrarEventoDaNotificacao(notificacao);

      if (
        eventoEncontrado &&
        (eventoEncontrado.status === 'pending' || eventoEncontrado.status === 'accepted')
      ) {
        // Serializa as datas (mesmo padrão utilizado na TelaPainelTecnico)
        const assignmentSerializado = {
          ...eventoEncontrado,
          eventDate: converterParaData(eventoEncontrado.eventDate)?.toISOString() || null,
          inviteDate: converterParaData(eventoEncontrado.inviteDate)?.toISOString() || null,
          respondedAt: converterParaData(eventoEncontrado.respondedAt)?.toISOString() || null,
        };

        // Navega diretamente para a tela de detalhes do evento do técnico
        const tempoRestante = 220 - (Date.now() - inicioCarregamento);
        if (tempoRestante > 0) {
          await new Promise((resolve) => setTimeout(resolve, tempoRestante));
        }
        navigation.navigate('TechnicianEventDetails', {
          assignment: assignmentSerializado,
        });
        navegouParaEvento = true;
      } else {
        // Convites recusados, cancelados ou removidos nunca devem abrir detalhes
        setAvisoIndisponivelVisivel(true);
      }
    } catch (erro) {
      console.log('Erro ao processar clique na notificação:', erro);
    } finally {
      if (!navegouParaEvento) setAbrindoNotificacaoId(null);
    }
  };

  // --------------------------------------------------------------------------
  // 4. AÇÕES DE ALTERNAR STATUS (BOTÃO INDIVIDUAL E BOTÃO MARCAR TODAS)
  // --------------------------------------------------------------------------

  /**
   * Ação do botão no canto inferior direito do card:
   * Se estiver em "Não Lidas", marca como Lida (true).
   * Se estiver em "Lidas", volta para Não Lida (false).
   */
  const aoAlternarLeituraManual = async (notificacao) => {
    try {
      const novoStatus = !notificacao.lida;
      await alterarStatusLeituraNotificacao(notificacao.id, novoStatus);
    } catch (erro) {
      console.log('Erro ao alternar status de leitura da notificação:', erro);
    }
  };

  /**
   * Marca todas as notificações como lidas de uma só vez e muda para a aba "Lidas".
   */
  const aoMarcarTodasComoLidas = async () => {
    try {
      await marcarTodasNotificacoesComoLidas(notificacoes);
      setAbaAtiva('lidas');
    } catch (erro) {
      console.log('Erro ao marcar todas como lidas:', erro);
    }
  };

  // --------------------------------------------------------------------------
  // 5. RENDERIZAÇÃO DA INTERFACE (JSX)
  // --------------------------------------------------------------------------
  return (
    <View style={estilos.tela}>
      {/* CABEÇALHO SUPERIOR */}
      <View style={estilos.cabecalho}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botaoVoltar}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={estilos.tituloCabecalho}>Notificações</Text>

        <TouchableOpacity onPress={aoMarcarTodasComoLidas}>
          <Text style={estilos.textoMarcarLidas}>Marcar lidas</Text>
        </TouchableOpacity>
      </View>

      {/* BARRA DE ABAS (NÃO LIDAS / LIDAS) */}
      <View style={estilos.barraAbas}>
        <TouchableOpacity
          style={[estilos.pilulaAba, abaAtiva === 'nao_lidas' && estilos.pilulaAbaAtiva]}
          onPress={() => setAbaAtiva('nao_lidas')}
        >
          <Text style={[estilos.textoAba, abaAtiva === 'nao_lidas' && estilos.textoAbaAtiva]}>
            Não Lidas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[estilos.pilulaAba, abaAtiva === 'lidas' && estilos.pilulaAbaAtiva]}
          onPress={() => setAbaAtiva('lidas')}
        >
          <Text style={[estilos.textoAba, abaAtiva === 'lidas' && estilos.textoAbaAtiva]}>
            Lidas
          </Text>
        </TouchableOpacity>
      </View>

      {/* LISTA DE CARDS DAS NOTIFICAÇÕES */}
      <ScrollView
        style={estilos.listaScroll}
        contentContainerStyle={[
          estilos.listaContainer,
          { paddingBottom: 40 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
      >
        {carregando || carregandoConvocacoes ? (
          <ActivityIndicator size="large" color={CORES.buttonGold} style={{ marginTop: 40 }} />
        ) : notificacoesFiltradas.length === 0 ? (
          <View style={estilos.vazioContainer}>
            <Feather name="bell-off" size={32} color="#94A3B8" />
            <Text style={estilos.vazioTexto}>
              {abaAtiva === 'nao_lidas'
                ? 'Você não possui notificações não lidas.'
                : 'Nenhuma notificação foi lida até o momento.'}
            </Text>
          </View>
        ) : (
          notificacoesFiltradas.map((item) => {
            const estaAbrindo = abrindoNotificacaoId === item.id;
            return (
              /* CARD DA NOTIFICAÇÃO (Clicar no corpo abre o evento e marca como lida) */
              <TouchableOpacity
                key={item.id}
                style={[estilos.card, estaAbrindo && estilos.cardAbrindo]}
                activeOpacity={0.85}
                disabled={Boolean(abrindoNotificacaoId)}
                onPress={() => aoClicarEmNotificacao(item)}
              >
                {/* Parte superior do Card: Ícone + Textos + Seta/Loading indicativo */}
                <View style={estilos.cardLinhaSuperior}>
                  <View style={estilos.iconeCirculo}>
                    <Feather
                      name={
                        item.tipo === 'evento_cancelado'
                          ? 'x-circle'
                          : item.tipo === 'convocacao_removida' || item.tipo === 'convocacao_recusada'
                            ? 'user-x'
                            : 'bell'
                      }
                      size={20}
                      color={CORES.textNavy}
                    />
                  </View>

                  <View style={estilos.cardConteudo}>
                    <Text style={estilos.cardTitulo}>{item.titulo}</Text>
                    <Text style={estilos.cardMensagem}>{item.mensagem}</Text>
                    <Text style={estilos.cardData}>
                      {formatarDataHoraNotificacao(item.criado_em || item.createdAt)}
                    </Text>
                  </View>

                  {estaAbrindo ? (
                    <ActivityIndicator size="small" color={CORES.buttonGold} />
                  ) : (
                    <Feather name="chevron-right" size={18} color="#94A3B8" />
                  )}
                </View>

                {/* Rodapé no canto inferior direito: Botão para alternar entre Lida e Não Lida */}
                <View style={estilos.cardRodapeDireito}>
                  <TouchableOpacity
                    style={[
                      estilos.botaoStatusLeitura,
                      item.lida ? estilos.botaoStatusNaoLida : estilos.botaoStatusLida,
                    ]}
                    activeOpacity={0.75}
                    disabled={Boolean(abrindoNotificacaoId)}
                    onPress={(evento) => {
                      // Impede que o clique no botão dispare o clique do card inteiro na Web/Mobile
                      if (evento?.stopPropagation) evento.stopPropagation();
                      aoAlternarLeituraManual(item);
                    }}
                  >
                    <Feather
                      name={item.lida ? 'rotate-ccw' : 'check'}
                      size={13}
                      color={item.lida ? '#475569' : CORES.textNavy}
                    />
                    <Text
                      style={[
                        estilos.textoBotaoStatus,
                        item.lida ? estilos.textoBotaoNaoLida : estilos.textoBotaoLida,
                      ]}
                    >
                      {item.lida ? 'Marcar como não lida' : 'Marcar como lida'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* OVERLAY DE LOADING AO ABRIR UMA NOTIFICAÇÃO DE EVENTO */}
      <Modal
        visible={Boolean(abrindoNotificacaoId)}
        transparent
        animationType="fade"
        statusBarTranslucent={Platform.OS === 'android'}
        presentationStyle="overFullScreen"
        onRequestClose={() => {}}
      >
        <View style={estilos.overlayCarregandoEvento}>
          <View style={estilos.cardCarregandoEvento}>
            <ActivityIndicator size="large" color={CORES.buttonGold} />
            <Text style={estilos.textoCarregandoEvento}>Indo para o evento...</Text>
          </View>
        </View>
      </Modal>

      {/* MODAL DE AVISO PARA EVENTO INDISPONÍVEL */}
      <Modal
        visible={avisoIndisponivelVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setAvisoIndisponivelVisivel(false)}
      >
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalCard}>
            <View style={estilos.modalIconeCirculo}>
              <Feather name="lock" size={26} color="#EF4444" />
            </View>
            <Text style={estilos.modalTitulo}>Evento indisponível</Text>
            <Text style={estilos.modalDescricao}>
              Esta convocação não está mais ativa. Os detalhes do evento não estão disponíveis.
            </Text>
            <TouchableOpacity
              style={estilos.modalBotao}
              activeOpacity={0.85}
              onPress={() => setAvisoIndisponivelVisivel(false)}
            >
              <Text style={estilos.modalBotaoTexto}>Ok, entendi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================================
// FOLHA DE ESTILOS PADRONIZADA
// ============================================================================
const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#F8FAFC',
    ...(Platform.OS === 'web'
      ? { height: '100vh', maxHeight: '100vh', overflow: 'hidden' }
      : {}),
  },
  cabecalho: {
    backgroundColor: CORES.bgHeaderDark,
    paddingHorizontal: 20,
    paddingTop: 44,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  botaoVoltar: {
    padding: 4,
  },
  tituloCabecalho: {
    color: '#FFFFFF',
    fontFamily: FONTES.bold,
    fontSize: 20,
  },
  textoMarcarLidas: {
    color: CORES.buttonGold,
    fontFamily: FONTES.bold,
    fontSize: 13,
  },
  barraAbas: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pilulaAba: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  pilulaAbaAtiva: {
    backgroundColor: CORES.bgHeaderDark,
  },
  textoAba: {
    fontFamily: FONTES.bold,
    fontSize: 13,
    color: '#64748B',
  },
  textoAbaAtiva: {
    color: '#FFFFFF',
  },
  listaScroll: {
    flex: 1,
    minHeight: 0,
  },
  listaContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  // Destaque suave no card enquanto o evento da notificação está sendo aberto
  cardAbrindo: {
    opacity: 0.72,
    borderColor: CORES.buttonGold,
  },
  cardLinhaSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconeCirculo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardConteudo: {
    flex: 1,
  },
  cardTitulo: {
    fontFamily: FONTES.bold,
    fontSize: 15,
    color: CORES.textNavy,
    marginBottom: 4,
  },
  cardMensagem: {
    fontFamily: FONTES.body,
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  cardData: {
    fontFamily: FONTES.body,
    fontSize: 11,
    color: '#94A3B8',
  },
  // Estilos do rodapé e do botão no canto inferior direito do card
  cardRodapeDireito: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  botaoStatusLeitura: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  botaoStatusLida: {
    backgroundColor: '#FEF3C7', // Fundo dourado claro para destacar ação de marcar como lida
  },
  botaoStatusNaoLida: {
    backgroundColor: '#E2E8F0', // Fundo cinza suave para devolver para não lida
  },
  textoBotaoStatus: {
    fontFamily: FONTES.bold,
    fontSize: 12,
  },
  textoBotaoLida: {
    color: CORES.textNavy,
  },
  textoBotaoNaoLida: {
    color: '#475569',
  },
  vazioContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: 10,
  },
  vazioTexto: {
    fontFamily: FONTES.body,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  // Estilos do overlay de loading ao abrir evento e do modal de aviso de indisponibilidade
  overlayCarregandoEvento: {
    flex: 1,
    backgroundColor: 'rgba(16, 43, 70, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  cardCarregandoEvento: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  textoCarregandoEvento: {
    fontFamily: FONTES.semibold,
    fontSize: 14,
    color: CORES.textNavy,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  modalIconeCirculo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitulo: {
    fontFamily: FONTES.bold,
    fontSize: 18,
    color: CORES.textNavy,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescricao: {
    fontFamily: FONTES.body,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalBotao: {
    width: '100%',
    backgroundColor: CORES.buttonGold,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBotaoTexto: {
    fontFamily: FONTES.bold,
    fontSize: 14,
    color: CORES.textNavy,
  },
});