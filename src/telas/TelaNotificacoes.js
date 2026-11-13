// ============================================================================
// src/telas/TelaNotificacoes.js
// Tela responsável por listar, filtrar, alternar status (lida/não lida)
// e redirecionar o técnico diretamente para a tela do evento da notificação.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { autenticacao } from '../configuracao/configuracaoFirebase';
import { CORES, FONTES } from '../tema/cores';
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

  const hoje = new Date();
  const ehHoje =
    data.getDate() === hoje.getDate() &&
    data.getMonth() === hoje.getMonth() &&
    data.getFullYear() === hoje.getFullYear();

  const hora = String(data.getHours()).padStart(2, '0');
  const min = String(data.getMinutes()).padStart(2, '0');

  if (ehHoje) return `Hoje, ${hora}:${min}`;

  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${data.getFullYear()}, ${hora}:${min}`;
}

// ============================================================================
// COMPONENTE PRINCIPAL DA TELA DE NOTIFICAÇÕES
// ============================================================================

export default function TelaNotificacoes({ navigation, route }) {
  // Estados para controle da aba ativa ('nao_lidas' ou 'lidas'), lista e carregamento
  const [abaAtiva, setAbaAtiva] = useState('nao_lidas');
  const [notificacoes, setNotificacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Recupera o ID do usuário e a lista de eventos (assignments) enviados pela TelaPainelTecnico
  const idUsuario = route?.params?.idUsuario || autenticacao?.currentUser?.uid;
  const assignments = route?.params?.assignments || [];

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

    // Captura possíveis nomes de campos que guardam o ID do evento na notificação
    const idEventoAlvo =
      notificacao.eventoId ||
      notificacao.eventId ||
      notificacao.assignmentId ||
      notificacao.idEvento;

    // 1ª Tentativa: Busca exata pelo ID do evento ou da convocação
    if (idEventoAlvo) {
      const encontradoPorId = assignments.find(
        (a) => a.id === idEventoAlvo || a.eventId === idEventoAlvo
      );
      if (encontradoPorId) return encontradoPorId;
    }

    // 2ª Tentativa: Busca pelo nome do evento contido no título ou mensagem da notificação
    const textoNotificacao = `${notificacao.titulo || ''} ${notificacao.mensagem || ''}`.toLowerCase();
    return assignments.find(
      (a) => a.eventTitle && textoNotificacao.includes(a.eventTitle.toLowerCase())
    );
  };

  /**
   * Ação executada ao clicar em cima do card da notificação:
   * 1. Marca automaticamente como lida no Firestore (vai para o campo "Lidas").
   * 2. Direciona o técnico para a tela de detalhes do evento correspondente.
   */
  const aoClicarEmNotificacao = async (notificacao) => {
    try {
      // Se ainda não estiver lida, atualiza para lida (true) no banco
      if (!notificacao.lida) {
        await marcarNotificacaoComoLida(notificacao.id);
      }

      // Localiza os dados do evento para abrir a tela de detalhes
      const eventoEncontrado = encontrarEventoDaNotificacao(notificacao);

      if (eventoEncontrado) {
        // Serializa as datas (mesmo padrão utilizado na TelaPainelTecnico)
        const assignmentSerializado = {
          ...eventoEncontrado,
          eventDate: converterParaData(eventoEncontrado.eventDate)?.toISOString() || null,
          inviteDate: converterParaData(eventoEncontrado.inviteDate)?.toISOString() || null,
          respondedAt: converterParaData(eventoEncontrado.respondedAt)?.toISOString() || null,
        };

        // Navega diretamente para a tela de detalhes do evento do técnico
        navigation.navigate('TechnicianEventDetails', {
          assignment: assignmentSerializado,
        });
      } else if (notificacao.eventoId || notificacao.eventId) {
        // Caso o evento não esteja na lista pré-carregada, envia os dados básicos da notificação
        navigation.navigate('TechnicianEventDetails', {
          assignment: {
            id: notificacao.assignmentId || notificacao.eventoId || notificacao.eventId,
            eventId: notificacao.eventoId || notificacao.eventId,
            eventTitle: notificacao.titulo || 'Detalhes do Evento',
          },
        });
      } else {
        // Caso seja um aviso geral sem um único evento específico, volta ao painel de eventos
        navigation.goBack();
      }
    } catch (erro) {
      console.log('Erro ao processar clique na notificação:', erro);
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
      <ScrollView contentContainerStyle={estilos.listaContainer}>
        {carregando ? (
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
          notificacoesFiltradas.map((item) => (
            /* CARD DA NOTIFICAÇÃO (Clicar no corpo abre o evento e marca como lida) */
            <TouchableOpacity
              key={item.id}
              style={estilos.card}
              activeOpacity={0.85}
              onPress={() => aoClicarEmNotificacao(item)}
            >
              {/* Parte superior do Card: Ícone + Textos + Seta indicativa */}
              <View style={estilos.cardLinhaSuperior}>
                <View style={estilos.iconeCirculo}>
                  <Feather
                    name={item.tipo === 'evento_cancelado' ? 'x-circle' : 'bell'}
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

                <Feather name="chevron-right" size={18} color="#94A3B8" />
              </View>

              {/* Rodapé no canto inferior direito: Botão para alternar entre Lida e Não Lida */}
              <View style={estilos.cardRodapeDireito}>
                <TouchableOpacity
                  style={[
                    estilos.botaoStatusLeitura,
                    item.lida ? estilos.botaoStatusNaoLida : estilos.botaoStatusLida,
                  ]}
                  activeOpacity={0.75}
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
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// FOLHA DE ESTILOS PADRONIZADA
// ============================================================================
const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  listaContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
});