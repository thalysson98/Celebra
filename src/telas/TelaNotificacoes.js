// src/telas/TelaNotificacoes.js
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
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas,
} from '../servicos/servicoNotificacoes';

// Formata a data do Firestore para exibir no card
function formatarDataHoraNotificacao(timestamp) {
  if (!timestamp) return 'Agora mesmo';
  const data = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
  if (Number.isNaN(data.getTime())) return 'Agora mesmo';

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

export default function TelaNotificacoes({ navigation, route }) {
  // Estados das abas e da lista de notificações do banco
  const [abaAtiva, setAbaAtiva] = useState('nao_lidas');
  const [notificacoes, setNotificacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const idUsuario = route?.params?.idUsuario || autenticacao?.currentUser?.uid;

  // Escuta as notificações do técnico em tempo real no Firestore
  useEffect(() => {
    if (!idUsuario) {
      setCarregando(false);
      return;
    }

    const cancelar = assinarNotificacoesUsuario(
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

    return () => {
      if (typeof cancelar === 'function') cancelar();
    };
  }, [idUsuario]);

  // Separa as notificações entre a aba Não Lidas e Lidas
  const notificacoesFiltradas = useMemo(() => {
    return notificacoes.filter((item) =>
      abaAtiva === 'nao_lidas' ? !item.lida : Boolean(item.lida)
    );
  }, [notificacoes, abaAtiva]);

  // Marca todas como lidas, zera o sininho e muda para a aba Lidas
  const aoMarcarTodasComoLidas = async () => {
    try {
      await marcarTodasNotificacoesComoLidas(notificacoes);
      setAbaAtiva('lidas');
    } catch (e) {
      console.log('Erro ao marcar todas como lidas:', e);
    }
  };

  // Marca apenas a notificação clicada como lida
  const aoClicarEmNotificacao = async (notificacao) => {
    try {
      if (!notificacao.lida) {
        await marcarNotificacaoComoLida(notificacao.id);
      }
    } catch (e) {
      console.log('Erro ao marcar notificação como lida:', e);
    }
  };

  return (
    <View style={estilos.tela}>
      {/* Cabeçalho com botão voltar e botão Marcar lidas */}
      <View style={estilos.cabecalho}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botaoVoltar}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={estilos.tituloCabecalho}>Notificações</Text>

        <TouchableOpacity onPress={aoMarcarTodasComoLidas}>
          <Text style={estilos.textoMarcarLidas}>Marcar lidas</Text>
        </TouchableOpacity>
      </View>

      {/* Botões de filtro Não Lidas e Lidas */}
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

      {/* Lista de cards das notificações */}
      <ScrollView contentContainerStyle={estilos.listaContainer}>
        {carregando ? (
          <ActivityIndicator size="large" color={CORES.buttonGold} style={{ marginTop: 40 }} />
        ) : notificacoesFiltradas.length === 0 ? (
          <View style={estilos.vazioContainer}>
            <Feather name="bell-off" size={32} color="#94A3B8" />
            <Text style={estilos.vazioTexto}>
              {abaAtiva === 'nao_lidas'
                ? 'Você não possui notificações não lidas.'
                : 'Nenhuma notificação lida até o momento.'}
            </Text>
          </View>
        ) : (
          notificacoesFiltradas.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={estilos.card}
              activeOpacity={0.8}
              onPress={() => aoClicarEmNotificacao(item)}
            >
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
                <Text style={estilos.cardData}>{formatarDataHoraNotificacao(item.criado_em)}</Text>
              </View>

              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

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
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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