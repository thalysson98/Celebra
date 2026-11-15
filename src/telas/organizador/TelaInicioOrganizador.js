
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Modal,
  ActivityIndicator
} from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, FONTES } from '../../tema/cores';
import { repositorioEventos } from '../../servicos/repositorioEventos';
import Cabecalho from '../../componentes/Cabecalho';
import FiltroIntervaloDatas from '../../compartilhado/FiltroIntervaloDatas';

const parseMoeda = (valor) => {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
  const texto = String(valor || '').trim().replace(/[^\d,.-]/g, '');
  if (!texto) return 0;
  const normalizado = texto.includes(',')
    ? texto.replace(/\./g, '').replace(',', '.')
    : texto;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : 0;
}

const formatarMonetario = (num) => {
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function TelaInicioOrganizador({ navigation, usuario }) {
  const [eventos, setEventos] = useState([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [diasFiltro, setDiasFiltro] = useState(15); 
  const [periodoFiltro, setPeriodoFiltro] = useState('esteMes');
  const [valoresVisiveis, setValoresVisiveis] = useState(true);
  const [tipoDetalhamento, setTipoDetalhamento] = useState(null);
  const [profissionalSelecionado, setProfissionalSelecionado] = useState(null);
  const [seletorProfissionalVisivel, setSeletorProfissionalVisivel] = useState(false);
  const [filtroRapidoPendente, setFiltroRapidoPendente] = useState(null);
  const [dataInicioPersonalizada, setDataInicioPersonalizada] = useState('');
  const [dataFimPersonalizada, setDataFimPersonalizada] = useState('');
  const [periodoPersonalizado, setPeriodoPersonalizado] = useState(null);

  useFocusEffect(
    useCallback(() => {
      carregarDadosDashboard();
    }, [])
  );

  const carregarDadosDashboard = async (mostrarCarregamento = true) => {
    if (mostrarCarregamento) setCarregandoDados(true);
    try {
      const lista = await repositorioEventos.listarEventos();
      setEventos(lista || []);
    } catch (error) {
      console.log('Erro ao carregar eventos no dashboard:', error);
    } finally {
      if (mostrarCarregamento) setCarregandoDados(false);
    }
  };

  const onRefresh = async () => {
    setAtualizando(true);
    try {
      await carregarDadosDashboard(false);
    } finally {
      setAtualizando(false);
    }
  };

  const converterStringParaData = (dataStr) => {
    if (!dataStr) return null;
    const texto = String(dataStr).trim();
    const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
      const [, anoTexto, mesTexto, diaTexto] = iso;
      const ano = Number(anoTexto);
      const mes = Number(mesTexto) - 1;
      const dia = Number(diaTexto);
      const data = new Date(ano, mes, dia);
      if (data.getFullYear() !== ano || data.getMonth() !== mes || data.getDate() !== dia) return null;
      return data;
    }
    const mesMap = { jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11 };
    const [dia, mesTexto, ano] = dataStr.split('/');
    if (dia && mesTexto && ano) {
      return new Date(ano, mesTexto - 1, dia); 
    }
    const [d, mT, a] = dataStr.split(' ');
    if (d && mT && a) return new Date(a, mesMap[mT.toLowerCase()], d);
    return new Date();
  };

  const eventosDoPeriodo = useMemo(() => {
    const hoje = new Date();
    return eventos.filter((ev) => {
      const dataEv = ev.dataInicio ? converterStringParaData(ev.dataInicio) : null;
      if (!dataEv) return true;

      if (periodoFiltro === 'esteMes') {
        return (
          dataEv.getMonth() === hoje.getMonth() &&
          dataEv.getFullYear() === hoje.getFullYear()
        );
      }

      if (periodoFiltro === 'proximosTresMeses') {
        const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 3, 0, 23, 59, 59, 999);
        return dataEv >= inicio && dataEv <= fim;
      }

      if (periodoFiltro === 'anoAtual') {
        return dataEv.getFullYear() === hoje.getFullYear();
      }

      if (periodoFiltro === 'personalizado' && periodoPersonalizado?.inicio && periodoPersonalizado?.fim) {
        return dataEv >= periodoPersonalizado.inicio && dataEv <= periodoPersonalizado.fim;
      }

      return true;
    });
  }, [eventos, periodoFiltro, periodoPersonalizado]);

  const {
    totalBruto,
    pendenteReceber,
    valorRealizado,
    despesasEquipe,
    parcelasPagas,
    parcelasPendentes,
    faturamentoTipos,
    despesasTipos,
    despesasCategorias,
    taxaConfirmacao,
    profissionaisConfirmados,
    profissionaisConvocados,
  } = useMemo(() => {
    let tBruto = 0;
    let pReceber = 0;
    let valorRealizado = 0;
    let parcelasPagas = 0;
    let parcelasPendentes = 0;
    let totalDespesasEquipe = 0;
    let profissionaisConfirmados = 0;
    let profissionaisConvocados = 0;
    const faturamentoPorTipo = Object.create(null);
    const despesasPorTipo = Object.create(null);
    const despesasPorCategoria = Object.create(null);

    eventosDoPeriodo.forEach(ev => {
      tBruto += parseMoeda(ev.financeiro?.valorTotal);
      (ev.financeiro?.parcelasDetalhadas || []).forEach(p => {
        if (p.status === 'paga') {
          parcelasPagas += 1;
          valorRealizado += parseMoeda(p.valor);
        } else {
          parcelasPendentes += 1;
          const valorParcela = parseMoeda(p.valor);
          pReceber += valorParcela;
        }
      });
      const tipo = ev.tipoEvento || 'Outros';
      faturamentoPorTipo[tipo] = (faturamentoPorTipo[tipo] || 0) + parseMoeda(ev.financeiro?.valorTotal);
      (ev.equipe || []).forEach((profissional) => {
        (profissional.despesas || []).forEach((despesa) => {
          const valorDespesa = parseMoeda(despesa.valor);
          totalDespesasEquipe += valorDespesa;
          despesasPorTipo[tipo] = (despesasPorTipo[tipo] || 0) + valorDespesa;
          const categoria = despesa.tipo || 'Sem categoria';
          despesasPorCategoria[categoria] = (despesasPorCategoria[categoria] || 0) + valorDespesa;
        });
        if (profissional.statusConfirmacao === 'Informativo' || profissional.statusConfirmacao === 'Cancelado') return;
        profissionaisConvocados += 1;
        if (profissional.statusConfirmacao === 'Confirmado') profissionaisConfirmados += 1;
      });
    });

    const totalTipos = Object.values(faturamentoPorTipo).reduce((total, valor) => total + valor, 0);
    const faturamentoTipos = Object.entries(faturamentoPorTipo)
      .map(([tipo, valor]) => ({ tipo, valor, percentual: totalTipos ? (valor / totalTipos) * 100 : 0 }))
      .sort((a, b) => b.valor - a.valor);
    const totalDespesas = Object.values(despesasPorTipo).reduce((total, valor) => total + valor, 0);
    const despesasTipos = Object.entries(despesasPorTipo)
      .map(([tipo, valor]) => ({ tipo, valor, percentual: totalDespesas ? (valor / totalDespesas) * 100 : 0 }))
      .sort((a, b) => b.valor - a.valor);
    const totalDespesasCategorias = Object.values(despesasPorCategoria).reduce((total, valor) => total + valor, 0);
    const despesasCategorias = Object.entries(despesasPorCategoria)
      .map(([tipo, valor]) => ({ tipo, valor, percentual: totalDespesasCategorias ? (valor / totalDespesasCategorias) * 100 : 0 }))
      .sort((a, b) => b.valor - a.valor);
    const taxaConfirmacao = profissionaisConvocados
      ? Math.round((profissionaisConfirmados / profissionaisConvocados) * 100)
      : 0;

    return {
      totalBruto: formatarMonetario(tBruto),
      pendenteReceber: formatarMonetario(pReceber),
      valorRealizado: formatarMonetario(valorRealizado),
      despesasEquipe: formatarMonetario(totalDespesasEquipe),
      parcelasPagas,
      parcelasPendentes,
      faturamentoTipos,
      despesasTipos,
      despesasCategorias,
      taxaConfirmacao,
      profissionaisConfirmados,
      profissionaisConvocados,
    };
  }, [eventosDoPeriodo]);

  const parcelasDetalhadas = useMemo(() => {
    if (!['pagas', 'pendentes'].includes(tipoDetalhamento)) return [];
    const statusAlvo = tipoDetalhamento === 'pagas' ? 'paga' : null;
    return eventosDoPeriodo.flatMap((evento) => (
      (evento.financeiro?.parcelasDetalhadas || [])
        .map((parcela, index) => ({ evento, parcela, numeroParcela: index + 1 }))
        .filter(({ parcela }) => statusAlvo ? parcela.status === statusAlvo : parcela.status !== 'paga')
    )).sort((a, b) => {
      const dataA = converterStringParaData(a.parcela.vencimento)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const dataB = converterStringParaData(b.parcela.vencimento)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return dataA - dataB;
    });
  }, [eventosDoPeriodo, tipoDetalhamento]);

  const parcelasPorEvento = useMemo(() => {
    const grupos = new Map();
    parcelasDetalhadas.forEach((item, index) => {
      const { evento } = item;
      const chave = String(evento.idEvento || evento.id || `${evento.titulo || 'evento'}_${evento.dataInicio || index}`);
      if (!grupos.has(chave)) grupos.set(chave, { evento, parcelas: [] });
      grupos.get(chave).parcelas.push(item);
    });
    return Array.from(grupos.values());
  }, [parcelasDetalhadas]);

  const equipeDetalhada = useMemo(() => (
    tipoDetalhamento === 'equipe'
      ? eventosDoPeriodo.reduce((grupos, evento) => {
        (evento.equipe || [])
          .filter((profissional) => profissional.statusConfirmacao === 'Pendente')
          .forEach((profissional) => {
            const nomeNormalizado = (profissional.nomeProfissional || 'Profissional')
              .trim()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLocaleLowerCase('pt-BR');
            const chave = profissional.idUsuario || `${nomeNormalizado}_${profissional.funcao || ''}`;
            let grupo = grupos.find((item) => item.chave === chave);

            if (!grupo) {
              grupo = { chave, profissional, eventos: [] };
              grupos.push(grupo);
            }

            const idEvento = evento.idEvento || evento.id;
            if (!grupo.eventos.some((item) => (item.idEvento || item.id) === idEvento)) {
              grupo.eventos.push(evento);
            }
          });
        return grupos.map((grupo) => ({
          ...grupo,
          eventos: [...grupo.eventos].sort((a, b) => {
            const dataA = converterStringParaData(a.dataInicio)?.getTime() ?? Number.MAX_SAFE_INTEGER;
            const dataB = converterStringParaData(b.dataInicio)?.getTime() ?? Number.MAX_SAFE_INTEGER;
            return dataA - dataB;
          }),
        }));
      }, [])
      : []
  ), [eventosDoPeriodo, tipoDetalhamento]);

  const equipeFiltrada = useMemo(() => (
    profissionalSelecionado
      ? equipeDetalhada.filter(({ chave }) => chave === profissionalSelecionado)
      : equipeDetalhada
  ), [equipeDetalhada, profissionalSelecionado]);

  const abrirDetalhamentoEquipe = () => {
    setProfissionalSelecionado(null);
    setSeletorProfissionalVisivel(false);
    setTipoDetalhamento('equipe');
  };

  const fecharDetalhamento = () => {
    setTipoDetalhamento(null);
    setProfissionalSelecionado(null);
    setSeletorProfissionalVisivel(false);
  };

  const abrirDetalheEvento = (idEvento) => {
    setTipoDetalhamento(null);
    navigation.navigate('Eventos', {
      screen: 'DetalheEvento',
      params: { idEvento },
    });
  };

  const abrirFinanceiroEvento = (idEvento) => {
    setTipoDetalhamento(null);
    navigation.navigate('Eventos', {
      screen: 'DetalheEvento',
      params: { idEvento, abaInicial: 'Financeiro' },
    });
  };

  const opcoesPeriodo = [
    ['esteMes', 'Este Mês'],
    ['proximosTresMeses', 'Próx. 3 Meses'],
    ['anoAtual', 'Ano Atual'],
  ];

  const validarPeriodoPersonalizado = (inicio, fim) => {
    if (!inicio || !fim) return 'Informe as datas inicial e final.';
    return '';
  };

  const aplicarPeriodoPersonalizado = (inicioTexto, fimTexto) => {
    const inicio = converterStringParaData(inicioTexto);
    const fim = converterStringParaData(fimTexto);
    if (!inicio || !fim) return;
    inicio.setHours(0, 0, 0, 0);
    fim.setHours(23, 59, 59, 999);
    setPeriodoPersonalizado({ inicio, fim });
    setPeriodoFiltro('personalizado');
  };

  const formatarDataPeriodo = (valor) => {
    const data = converterStringParaData(valor);
    return data ? new Intl.DateTimeFormat('pt-BR').format(data) : '';
  };

  const selecionarPeriodoRapido = (chave) => {
    if (periodoFiltro === 'personalizado' && chave !== 'personalizado') {
      setFiltroRapidoPendente(chave);
      return;
    }
    setPeriodoFiltro(chave);
  };

  const confirmarPeriodoRapido = () => {
    if (!filtroRapidoPendente) return;
    setPeriodoFiltro(filtroRapidoPendente);
    setDataInicioPersonalizada('');
    setDataFimPersonalizada('');
    setPeriodoPersonalizado(null);
    setFiltroRapidoPendente(null);
  };

  const periodoRapidoPendenteNome = opcoesPeriodo.find(([chave]) => chave === filtroRapidoPendente)?.[1];

  const eventosProximos = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    const limiteData = new Date(hoje);
    limiteData.setDate(limiteData.getDate() + diasFiltro);
    return eventos.filter(e => {
      if (e.statusTempo !== 'futuros') return false;
      const dataEv = e.dataInicio ? converterStringParaData(e.dataInicio) : null;
      if (!dataEv) return false;
      return dataEv >= hoje && dataEv <= limiteData;
    }).sort((a, b) => {
        const da = converterStringParaData(a.dataInicio);
        const db = converterStringParaData(b.dataInicio);
        return (da?.getTime() || 0) - (db?.getTime() || 0); 
    });
  }, [eventos, diasFiltro]);

  const obterDataFormatada = () => {
    try {
      const hoje = new Date();
      const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      return `${dias[hoje.getDay()]}, ${hoje.getDate()} ${meses[hoje.getMonth()]}`;
    } catch {
      return 'Hoje';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerGreeting}>
            Olá, {usuario?.name ? usuario.name.split(' ')[0] : 'Organizador'}!
          </Text>
          <Text style={styles.headerCompany}>
            {usuario?.companyName || 'Sua produtora'} • {obterDataFormatada()}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => setValoresVisiveis((visiveis) => !visiveis)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={valoresVisiveis ? 'Ocultar valores financeiros' : 'Mostrar valores financeiros'}
          >
            <Feather name={valoresVisiveis ? 'eye' : 'eye-off'} size={20} color={COLORS.textWhite} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bellButton} onPress={() => navigation.navigate('Notificacoes')} activeOpacity={0.7}>
            <Feather name="bell" size={20} color={COLORS.textWhite} />
          </TouchableOpacity>
        </View>
      </View>

      {carregandoDados ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.buttonGold} />
          <Text style={styles.loadingText}>Carregando dados do dashboard...</Text>
        </View>
      ) : (
      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={atualizando} onRefresh={onRefresh} colors={[COLORS.buttonGold]} tintColor={COLORS.buttonGold} />}>
        
  
        <View style={styles.periodSection}>
          <Text style={styles.periodTitle}>Período</Text>
          <View style={styles.periodRow}>
            {opcoesPeriodo.map(([chave, rotulo]) => {
              const selecionado = periodoFiltro === chave;
              return (
                <TouchableOpacity
                  key={chave}
                  style={[styles.periodChip, selecionado && styles.periodChipSelected]}
                  onPress={() => selecionarPeriodoRapido(chave)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.periodChipText, selecionado && styles.periodChipTextSelected]}>
                    {rotulo}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <FiltroIntervaloDatas
            dataInicial={dataInicioPersonalizada}
            dataFinal={dataFimPersonalizada}
            aoMudarDataInicial={setDataInicioPersonalizada}
            aoMudarDataFinal={setDataFimPersonalizada}
            aoLimpar={() => {
              setDataInicioPersonalizada('');
              setDataFimPersonalizada('');
              setPeriodoPersonalizado(null);
              setPeriodoFiltro('esteMes');
            }}
            aoAplicar={aplicarPeriodoPersonalizado}
            validarAoAplicar={validarPeriodoPersonalizado}
            ativo={periodoFiltro === 'personalizado'}
            rotuloBotao={periodoFiltro === 'personalizado' && periodoPersonalizado
              ? `${formatarDataPeriodo(dataInicioPersonalizada)} até ${formatarDataPeriodo(dataFimPersonalizada)}`
              : 'Personalizado'}
            iconeBotao="calendar"
            iconeFinal="chevron-right"
            estiloBotao={styles.customPeriodButton}
            estiloBotaoAtivo={styles.customPeriodButtonSelected}
            estiloTextoBotao={styles.customPeriodButtonText}
            estiloTextoBotaoAtivo={styles.customPeriodButtonTextSelected}
          />
          {periodoFiltro === 'personalizado' && periodoPersonalizado && (
            <View style={styles.customPeriodNotice}>
              <Feather name="info" size={14} color={COLORS.textMuted} />
              <Text style={styles.customPeriodNoticeText}>
                Todos os dados demonstrados correspondem ao período informado no filtro.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.interactionHint}>
          <Feather name="info" size={15} color={COLORS.textMuted} />
          <Text style={styles.interactionHintText}>Itens com “Ver detalhes” abrem uma lista ao tocar.</Text>
        </View>

        <View style={styles.dashboardSection}>
          <View style={styles.dashboardSectionHeading}>
            <Feather name="trending-up" size={18} color={COLORS.textNavy} />
            <Text style={styles.dashboardSectionTitle}>Faturamento</Text>
          </View>

          <View style={styles.metricCards}>
            <Card style={styles.dashboardCard}>
              <Card.Content style={styles.summaryMetricContent}>
                <View style={styles.summaryMetricIcon}>
                  <Feather name="dollar-sign" size={19} color={COLORS.textNavy} />
                </View>
                <View style={styles.summaryMetricText}>
                  <Text style={styles.summaryMetricLabel}>Total bruto</Text>
                  <Text style={styles.summaryMetricValue}>{valoresVisiveis ? totalBruto : 'R$ ••••••'}</Text>
                </View>
              </Card.Content>
            </Card>
            <Card style={styles.dashboardCard}>
              <Card.Content style={styles.summaryMetricContent}>
                <View style={[styles.summaryMetricIcon, styles.pendingMetricIcon]}>
                  <Feather name="clock" size={19} color="#B45309" />
                </View>
                <View style={styles.summaryMetricText}>
                  <Text style={styles.summaryMetricLabel}>Pendente a receber</Text>
                  <Text style={styles.summaryMetricValue}>{valoresVisiveis ? pendenteReceber : 'R$ ••••••'}</Text>
                </View>
              </Card.Content>
            </Card>
            <Card style={styles.dashboardCard}>
              <Card.Content style={styles.summaryMetricContent}>
                <View style={[styles.summaryMetricIcon, styles.paidMetricIcon]}>
                  <Feather name="check-circle" size={19} color="#047857" />
                </View>
                <View style={styles.summaryMetricText}>
                  <Text style={styles.summaryMetricLabel}>Valor pago</Text>
                  <Text style={styles.summaryMetricValue}>{valoresVisiveis ? valorRealizado : 'R$ ••••••'}</Text>
                </View>
              </Card.Content>
            </Card>
          </View>

          <View style={styles.paymentStatusSection}>
            <Text style={[styles.dashboardCardTitle, styles.paymentStatusTitle]}>Status de pagamentos</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setTipoDetalhamento('pagas')}
              accessibilityRole="button"
              accessibilityLabel={`Ver ${parcelasPagas} parcelas pagas`}
            >
              <Card style={styles.dashboardCard}>
                <Card.Content style={styles.summaryMetricContent}>
                  <View style={[styles.summaryMetricIcon, styles.paidMetricIcon]}>
                    <Feather name="check-circle" size={19} color="#047857" />
                  </View>
                  <View style={styles.summaryMetricText}>
                    <View style={styles.paymentStatusMetricHeader}>
                      <Text style={styles.paymentStatusLabel}>Parcelas pagas</Text>
                      <Text style={styles.summaryMetricValue}>{parcelasPagas}</Text>
                    </View>
                    <View style={styles.cardActionHint}>
                      <Text style={styles.cardActionHintText}>Ver detalhes</Text>
                      <Feather name="chevron-right" size={17} color={COLORS.textNavy} />
                    </View>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setTipoDetalhamento('pendentes')}
              accessibilityRole="button"
              accessibilityLabel={`Ver ${parcelasPendentes} parcelas pendentes`}
            >
              <Card style={styles.dashboardCard}>
                <Card.Content style={styles.summaryMetricContent}>
                  <View style={[styles.summaryMetricIcon, styles.pendingMetricIcon]}>
                    <Feather name="clock" size={19} color="#B45309" />
                  </View>
                  <View style={styles.summaryMetricText}>
                    <View style={styles.paymentStatusMetricHeader}>
                      <Text style={styles.paymentStatusLabel}>Parcelas pendentes</Text>
                      <Text style={styles.summaryMetricValue}>{parcelasPendentes}</Text>
                    </View>
                    <View style={styles.cardActionHint}>
                      <Text style={styles.cardActionHintText}>Ver detalhes</Text>
                      <Feather name="chevron-right" size={17} color={COLORS.textNavy} />
                    </View>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          </View>

          <Card style={styles.dashboardCard}>
            <Card.Content style={styles.dashboardCardContent}>
              <Text style={styles.dashboardCardTitle}>Faturamento por tipo de evento</Text>
              {faturamentoTipos.length ? faturamentoTipos.map(({ tipo, valor, percentual }) => (
                <View key={tipo} style={styles.typeRevenueItem}>
                  <View style={styles.typeRevenueHeader}>
                    <Text style={styles.typeRevenueName} numberOfLines={1}>{tipo}</Text>
                    <Text style={styles.typeRevenueValue}>
                      {valoresVisiveis ? `${formatarMonetario(valor)} · ${Math.round(percentual)}%` : 'R$ ••••••'}
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    {valoresVisiveis && <View style={[styles.progressFill, { width: `${percentual}%` }]} />}
                  </View>
                </View>
              )) : <Text style={styles.dashboardEmptyText}>Nenhum evento neste período.</Text>}
            </Card.Content>
          </Card>
        </View>

        <View style={styles.dashboardSection}>
          <View style={styles.dashboardSectionHeading}>
            <Feather name="credit-card" size={18} color="#047857" />
            <Text style={styles.dashboardSectionTitle}>Despesas</Text>
          </View>

          <Card style={styles.dashboardCard}>
            <Card.Content style={styles.summaryMetricContent}>
              <View style={[styles.summaryMetricIcon, styles.paidMetricIcon]}>
                <Feather name="dollar-sign" size={19} color="#047857" />
              </View>
              <View style={styles.summaryMetricText}>
                <Text style={styles.summaryMetricLabel}>Despesas pagas à equipe</Text>
                <Text style={styles.summaryMetricValue}>{valoresVisiveis ? despesasEquipe : 'R$ ••••••'}</Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.dashboardCard}>
            <Card.Content style={styles.dashboardCardContent}>
              <Text style={styles.dashboardCardTitle}>Despesas pagas por categoria</Text>
              {despesasCategorias.length ? despesasCategorias.map(({ tipo, valor, percentual }) => (
                <View key={tipo} style={styles.typeRevenueItem}>
                  <View style={styles.typeRevenueHeader}>
                    <Text style={styles.typeRevenueName} numberOfLines={1}>{tipo}</Text>
                    <Text style={styles.typeRevenueValue}>
                      {valoresVisiveis ? `${formatarMonetario(valor)} · ${Math.round(percentual)}%` : 'R$ ••••••'}
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    {valoresVisiveis && <View style={[styles.expenseProgressFill, { width: `${percentual}%` }]} />}
                  </View>
                </View>
              )) : <Text style={styles.dashboardEmptyText}>Nenhuma despesa neste período.</Text>}
            </Card.Content>
          </Card>

          <Card style={styles.dashboardCard}>
            <Card.Content style={styles.dashboardCardContent}>
              <Text style={styles.dashboardCardTitle}>Despesas pagas por tipo de evento</Text>
              {despesasTipos.length ? despesasTipos.map(({ tipo, valor, percentual }) => (
                <View key={tipo} style={styles.typeRevenueItem}>
                  <View style={styles.typeRevenueHeader}>
                    <Text style={styles.typeRevenueName} numberOfLines={1}>{tipo}</Text>
                    <Text style={styles.typeRevenueValue}>
                      {valoresVisiveis ? `${formatarMonetario(valor)} · ${Math.round(percentual)}%` : 'R$ ••••••'}
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    {valoresVisiveis && <View style={[styles.expenseProgressFill, { width: `${percentual}%` }]} />}
                  </View>
                </View>
              )) : <Text style={styles.dashboardEmptyText}>Nenhuma despesa neste período.</Text>}
            </Card.Content>
          </Card>
        </View>

        <View style={styles.dashboardSection}>
          <View style={styles.dashboardSectionHeading}>
            <Feather name="users" size={18} color={COLORS.textNavy} />
            <Text style={styles.dashboardSectionTitle}>Equipe</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={abrirDetalhamentoEquipe}
            accessibilityRole="button"
            accessibilityLabel="Ver detalhes da confirmação da equipe"
          >
            <Card style={styles.dashboardCard}>
              <Card.Content style={styles.dashboardCardContent}>
                <View style={styles.teamConfirmationHeader}>
                  <Text style={styles.dashboardCardTitle}>Confirmação da equipe</Text>
                  <Text style={styles.teamConfirmationPercent}>{taxaConfirmacao}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${taxaConfirmacao}%` }]} />
                </View>
                <Text style={styles.teamConfirmationText}>
                  {profissionaisConfirmados} de {profissionaisConvocados} profissionais confirmados
                </Text>
                <View style={styles.teamConfirmationAction}>
                  <Text style={styles.cardActionHintText}>Ver convites pendentes</Text>
                  <Feather name="chevron-right" size={17} color={COLORS.textNavy} />
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximos eventos</Text>
          <View style={styles.filterDaysRow}>
            {[7, 15, 20, 30].map((dias) => (
              <TouchableOpacity key={dias} style={[styles.filterDayChip, diasFiltro === dias && styles.filterDayChipSelected]} onPress={() => setDiasFiltro(dias)}>
                <Text style={[styles.filterDayText, diasFiltro === dias && styles.filterDayTextSelected]}>
                  {dias} dias
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {eventosProximos.length > 0 ? (
          <View style={styles.subsequentEventsBox}>
            {eventosProximos.map((ev, index) => (
              <React.Fragment key={ev.id || index}>
                <TouchableOpacity
                  style={styles.eventListItem}
                  onPress={() => navigation.navigate('Eventos', { screen: 'DetalheEvento', params: { idEvento: ev.id } })}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir detalhes do evento ${ev.titulo}`}
                >
                  <View style={styles.eventListIconBox}>
                    <MaterialCommunityIcons name="calendar-blank-outline" size={20} color={COLORS.textNavy} />
                  </View>
                  <View style={styles.eventListTextContainer}>
                    <Text style={styles.eventListTitle} numberOfLines={1}>
                      {ev.dataInicio || 'Data a definir'} • {ev.titulo}
                    </Text>
                    <Text style={styles.eventListSubtitle} numberOfLines={1}>
                      {ev.horaInicio || 'Horário a definir'}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={COLORS.textSubtle} />
                </TouchableOpacity>
                {index < eventosProximos.length - 1 && <View style={styles.eventListDivider} />}
              </React.Fragment>
            ))}
          </View>
        ) : (
          <View style={styles.noUpcomingBox}>
            <Text style={styles.noUpcomingText}>Nenhum evento programado para os próximos {diasFiltro} dias.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Eventos')} activeOpacity={0.7}>
              <Text style={styles.noUpcomingAction}>Ver todos os eventos</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
      )}

      <Modal
        visible={tipoDetalhamento !== null}
        transparent
        animationType="fade"
        onRequestClose={fecharDetalhamento}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {tipoDetalhamento === 'equipe'
                  ? 'Confirmação da equipe'
                  : tipoDetalhamento === 'pagas'
                    ? 'Parcelas pagas'
                    : 'Parcelas pendentes'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={fecharDetalhamento}
                accessibilityRole="button"
                accessibilityLabel="Fechar detalhes"
              >
                <Feather name="x" size={22} color={COLORS.textNavy} />
              </TouchableOpacity>
            </View>
            {tipoDetalhamento === 'equipe' && (
              <TouchableOpacity
                style={styles.professionalSelect}
                onPress={() => setSeletorProfissionalVisivel((visible) => !visible)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Selecionar profissional"
                accessibilityState={{ expanded: seletorProfissionalVisivel }}
              >
                <Feather name="user" size={17} color={COLORS.textMuted} />
                <Text style={[styles.professionalSelectText, !profissionalSelecionado && styles.professionalSelectPlaceholder]}>
                  {equipeDetalhada.find(({ chave }) => chave === profissionalSelecionado)?.profissional.nomeProfissional || 'Selecionar profissional'}
                </Text>
                <Feather name={seletorProfissionalVisivel ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
            <ScrollView
              style={styles.modalList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {tipoDetalhamento === 'equipe' && seletorProfissionalVisivel ? (
                <View style={styles.professionalOptions}>
                  <TouchableOpacity
                    style={styles.professionalOption}
                    onPress={() => {
                      setProfissionalSelecionado(null);
                      setSeletorProfissionalVisivel(false);
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                  >
                    <Text style={styles.professionalOptionText}>Todos os profissionais</Text>
                    {!profissionalSelecionado && <Feather name="check" size={18} color={COLORS.textNavy} />}
                  </TouchableOpacity>
                  {equipeDetalhada.map(({ profissional, eventos, chave }) => (
                    <TouchableOpacity
                      key={chave}
                      style={styles.professionalOption}
                      onPress={() => {
                        setProfissionalSelecionado(chave);
                        setSeletorProfissionalVisivel(false);
                      }}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                    >
                      <View style={styles.professionalOptionDetails}>
                        <Text style={styles.professionalOptionText}>{profissional.nomeProfissional || 'Profissional'}</Text>
                        <Text style={styles.professionalOptionMeta}>
                          {eventos.length} {eventos.length === 1 ? 'evento pendente' : 'eventos pendentes'}
                        </Text>
                      </View>
                      {profissionalSelecionado === chave && <Feather name="check" size={18} color={COLORS.textNavy} />}
                    </TouchableOpacity>
                  ))}
                </View>
              ) : tipoDetalhamento === 'equipe' ? (
                equipeFiltrada.length ? equipeFiltrada.map(({ profissional, eventos, chave }) => (
                  <View key={chave} style={styles.detailItem}>
                    <View style={styles.detailItemText}>
                      <Text style={styles.detailItemTitle}>{profissional.nomeProfissional || 'Profissional'}</Text>
                      <View style={styles.pendingInvitationDetails}>
                        <View style={styles.pendingInvitationBadge}>
                          <Feather name="clock" size={12} color="#92400E" />
                          <Text style={styles.pendingInvitationBadgeText}>Pendente</Text>
                        </View>
                      </View>
                      <Text style={styles.detailItemDescription}>Eventos:</Text>
                      {eventos.map((evento) => (
                        <TouchableOpacity
                          key={evento.idEvento || evento.id}
                          style={styles.pendingTeamEvent}
                          onPress={() => abrirDetalheEvento(evento.idEvento || evento.id)}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityLabel={`Abrir evento ${evento.titulo || 'Evento'}`}
                        >
                          <Text style={styles.pendingTeamEventText}>
                            {evento.titulo || 'Evento'} · {evento.dataInicio || 'Data a definir'}
                          </Text>
                          <Feather name="chevron-right" size={17} color={COLORS.textNavy} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )) : <Text style={styles.modalEmptyText}>
                  {profissionalSelecionado
                    ? 'Nenhum evento pendente para este profissional no período selecionado.'
                    : 'Nenhum convite pendente neste período.'}
                </Text>
              ) : (
                parcelasPorEvento.length ? parcelasPorEvento.map(({ evento, parcelas }) => (
                  <View
                    key={evento.idEvento || evento.id || `${evento.titulo}_${evento.dataInicio}`}
                    style={styles.paymentEventGroup}
                  >
                    <View style={styles.paymentEventHeader}>
                      <View style={styles.paymentEventHeading}>
                        <Text style={styles.detailItemTitle}>{evento.titulo || 'Evento'}</Text>
                        <Text style={styles.detailItemDescription}>
                          {evento.cliente?.nome || 'Cliente não informado'} · {evento.dataInicio || 'Data a definir'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.paymentEventAction}
                        onPress={() => abrirFinanceiroEvento(evento.idEvento || evento.id)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Ir até o financeiro do evento ${evento.titulo || 'Evento'}`}
                      >
                        <Feather name="arrow-up-right" size={16} color={COLORS.textNavy} />
                        <Text style={styles.paymentEventActionText}>Ir até o evento</Text>
                      </TouchableOpacity>
                    </View>
                    {parcelas.map(({ parcela, numeroParcela }, index) => (
                      <View
                        key={`${evento.idEvento || evento.id}_parcela_${numeroParcela}_${index}`}
                        style={[styles.paymentInstallment, index === 0 && styles.paymentInstallmentFirst]}
                      >
                        <View style={styles.detailItemText}>
                          <Text style={styles.detailItemMeta}>Parcela {numeroParcela}</Text>
                          <Text style={styles.detailItemMeta}>
                            Vencimento: {parcela.vencimento || 'Não informado'}
                          </Text>
                        </View>
                        <Text style={styles.detailItemAmount}>
                          {valoresVisiveis ? formatarMonetario(parseMoeda(parcela.valor)) : 'R$ ••••••'}
                        </Text>
                      </View>
                    ))}
                  </View>
                )) : <Text style={styles.modalEmptyText}>Nenhuma parcela neste status para o período selecionado.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={filtroRapidoPendente !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setFiltroRapidoPendente(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.quickFilterConfirmModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alterar período?</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setFiltroRapidoPendente(null)}
                accessibilityRole="button"
                accessibilityLabel="Fechar confirmação"
              >
                <Feather name="x" size={22} color={COLORS.textNavy} />
              </TouchableOpacity>
            </View>
            <Text style={styles.quickFilterConfirmText}>
              Tem certeza de que deseja limpar o período personalizado e selecionar o filtro rápido
              {periodoRapidoPendenteNome ? ` “${periodoRapidoPendenteNome}”` : ''}?
            </Text>
            <View style={styles.quickFilterConfirmActions}>
              <TouchableOpacity
                style={styles.quickFilterCancel}
                onPress={() => setFiltroRapidoPendente(null)}
                accessibilityRole="button"
              >
                <Text style={styles.quickFilterCancelText}>Não</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickFilterApply}
                onPress={confirmarPeriodoRapido}
                accessibilityRole="button"
              >
                <Text style={styles.quickFilterApplyText}>Sim</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgHeaderDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 22, backgroundColor: COLORS.bgHeaderDark },
  headerTextContainer: { flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerGreeting: { fontSize: 26, fontWeight: '700', color: COLORS.textWhite, fontFamily: FONTS.heading },
  headerCompany: { fontFamily: FONTES.body, fontSize: 14, color: COLORS.headerSubtitle, marginTop: 4 },
  bellButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)' },
  sheet: { flex: 1, backgroundColor: COLORS.sheetBg, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  sheetContent: { paddingHorizontal: 16, paddingTop: 20 },
  loadingContainer: { flex: 1, backgroundColor: COLORS.sheetBg, borderTopLeftRadius: 28, borderTopRightRadius: 28, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontFamily: FONTES.medium, color: COLORS.textMuted, fontSize: 13 },
  periodSection: { marginBottom: 16 },
  periodTitle: { fontFamily: FONTES.semibold, fontSize: 14, color: COLORS.textNavy, marginBottom: 9 },
  periodRow: { flexDirection: 'row', gap: 8 },
  periodChip: { flex: 1, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 9, borderRadius: 18, backgroundColor: '#DFE7EE' },
  periodChipSelected: { backgroundColor: COLORS.textNavy },
  periodChipText: { fontFamily: FONTES.semibold, fontSize: 12, color: COLORS.textMuted },
  periodChipTextSelected: { color: COLORS.textWhite },
  customPeriodButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 12, marginTop: 9, backgroundColor: COLORS.cardWhite, borderWidth: 1, borderColor: '#DFE7EE', borderRadius: 12 },
  customPeriodButtonSelected: { backgroundColor: COLORS.textNavy, borderColor: COLORS.textNavy },
  customPeriodButtonText: { flex: 1, fontFamily: FONTES.semibold, fontSize: 12, color: COLORS.textNavy },
  customPeriodButtonTextSelected: { color: COLORS.textWhite },
  customPeriodNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginTop: 9, padding: 10, borderRadius: 10, backgroundColor: '#EAF3F7' },
  customPeriodNoticeText: { flex: 1, fontFamily: FONTES.body, color: COLORS.textMuted, fontSize: 11, lineHeight: 16 },
  quickFilterConfirmModal: { width: '100%', maxWidth: 430, backgroundColor: COLORS.cardWhite, borderRadius: 18, padding: 20 },
  quickFilterConfirmText: { fontFamily: FONTES.body, color: COLORS.textMuted, fontSize: 14, lineHeight: 21, marginBottom: 20 },
  quickFilterConfirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  quickFilterCancel: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 20, borderRadius: 10, backgroundColor: COLORS.sheetBg },
  quickFilterCancelText: { fontFamily: FONTES.semibold, color: COLORS.textNavy, fontSize: 13 },
  quickFilterApply: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 20, borderRadius: 10, backgroundColor: COLORS.buttonGold },
  quickFilterApplyText: { fontFamily: FONTES.bold, color: COLORS.textNavy, fontSize: 13, fontWeight: '700' },
  interactionHint: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10, paddingHorizontal: 2 },
  interactionHintText: { fontFamily: FONTES.body, color: COLORS.textMuted, fontSize: 11 },
  dashboardSection: { marginBottom: 6 },
  dashboardSectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 12, paddingHorizontal: 2 },
  dashboardSectionTitle: { fontFamily: FONTES.bold, fontSize: 17, fontWeight: '700', color: COLORS.textNavy },
  metricCards: { flexDirection: 'column', gap: 0 },
  dashboardCard: { backgroundColor: COLORS.cardWhite, borderRadius: 18, marginBottom: 14, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  dashboardCardContent: { padding: 16 },
  dashboardCardTitle: { fontFamily: FONTES.bold, fontSize: 15, fontWeight: '700', color: COLORS.textNavy },
  summaryMetricContent: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  summaryMetricIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.cardLightBlue, alignItems: 'center', justifyContent: 'center' },
  pendingMetricIcon: { backgroundColor: '#FEF3D6' },
  paidMetricIcon: { backgroundColor: '#D1FAE5' },
  summaryMetricText: { flex: 1 },
  summaryMetricLabel: { fontFamily: FONTES.body, fontSize: 12, color: COLORS.textMuted },
  summaryMetricValue: { fontFamily: FONTES.bold, fontSize: 18, fontWeight: '700', color: COLORS.textNavy, marginTop: 3 },
  dashboardEmptyText: { fontFamily: FONTES.body, fontSize: 13, color: COLORS.textMuted, marginTop: 12 },
  paymentStatusSection: { marginBottom: 8 },
  paymentStatusTitle: { marginBottom: 12 },
  paymentStatusLabel: { fontFamily: FONTES.semibold, fontSize: 14, color: COLORS.textNavy },
  paymentStatusMetricHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 5 },
  cardActionHint: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  cardActionHintText: { fontFamily: FONTES.semibold, fontSize: 11, color: COLORS.textNavy },
  typeRevenueItem: { marginTop: 14 },
  typeRevenueHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 7 },
  typeRevenueName: { flex: 1, fontFamily: FONTES.semibold, fontSize: 13, color: COLORS.textNavy },
  typeRevenueValue: { fontFamily: FONTES.body, fontSize: 12, color: COLORS.textMuted },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: '#DFE7EE', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: COLORS.buttonGold },
  expenseProgressFill: { height: '100%', borderRadius: 4, backgroundColor: '#059669' },
  teamConfirmationHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  teamConfirmationPercent: { fontFamily: FONTES.bold, fontSize: 20, fontWeight: '700', color: COLORS.textNavy },
  teamConfirmationText: { fontFamily: FONTES.body, fontSize: 12, color: COLORS.textMuted, marginTop: 8 },
  teamConfirmationAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  detailModal: { maxHeight: '80%', backgroundColor: COLORS.cardWhite, borderRadius: 18, padding: 18 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  modalTitle: { flex: 1, fontFamily: FONTES.bold, color: COLORS.textNavy, fontSize: 18, fontWeight: '700' },
  modalCloseButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.sheetBg },
  professionalSelect: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, marginBottom: 10, borderWidth: 1, borderColor: '#D8E2EB', borderRadius: 12, backgroundColor: '#F8FAFC' },
  professionalSelectText: { flex: 1, fontFamily: FONTES.semibold, fontSize: 14, color: COLORS.textNavy },
  professionalSelectPlaceholder: { fontFamily: FONTES.body, color: COLORS.textMuted },
  professionalOptions: { marginBottom: 8, borderWidth: 1, borderColor: '#D8E2EB', borderRadius: 12, backgroundColor: COLORS.cardWhite },
  professionalOption: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.cardDivider },
  professionalOptionDetails: { flex: 1 },
  professionalOptionText: { fontFamily: FONTES.semibold, fontSize: 13, color: COLORS.textNavy },
  professionalOptionMeta: { fontFamily: FONTES.body, fontSize: 11, color: COLORS.textMuted, marginTop: 3 },
  modalList: { flexGrow: 0, flexShrink: 1 },
  detailItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.cardDivider },
  detailItemText: { flex: 1 },
  detailItemTitle: { fontFamily: FONTES.bold, color: COLORS.textNavy, fontSize: 14, fontWeight: '700' },
  detailItemDescription: { fontFamily: FONTES.body, color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  detailItemMeta: { fontFamily: FONTES.semibold, color: COLORS.textMuted, fontSize: 11, marginTop: 4 },
  paymentEventGroup: { marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#94A3B8', borderLeftWidth: 4, borderLeftColor: COLORS.textNavy, borderRadius: 12, backgroundColor: COLORS.cardWhite },
  paymentEventHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: 12, backgroundColor: '#E8EEF3' },
  paymentEventHeading: { flex: 1 },
  paymentEventAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 8, borderRadius: 9, backgroundColor: COLORS.cardWhite, borderWidth: 1, borderColor: '#CBD5E1' },
  paymentEventActionText: { fontFamily: FONTES.semibold, color: COLORS.textNavy, fontSize: 11 },
  paymentInstallment: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.cardDivider },
  paymentInstallmentFirst: { borderTopWidth: 0 },
  pendingInvitationDetails: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  pendingInvitationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: '#FEF3D6' },
  pendingInvitationBadgeText: { fontFamily: FONTES.bold, color: '#92400E', fontSize: 11, fontWeight: '700' },
  pendingTeamEvent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 8, paddingHorizontal: 10, marginTop: 6, backgroundColor: COLORS.sheetBg, borderRadius: 10 },
  pendingTeamEventText: { flex: 1, fontFamily: FONTES.semibold, color: COLORS.textNavy, fontSize: 12 },
  detailItemAmount: { fontFamily: FONTES.bold, color: COLORS.textNavy, fontSize: 13, fontWeight: '700' },
  modalEmptyText: { fontFamily: FONTES.body, color: COLORS.textMuted, fontSize: 13, lineHeight: 19, paddingVertical: 18 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  sectionHeader: { marginBottom: 10, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textNavy, fontFamily: FONTS.heading },
  filterDaysRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  filterDayChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#DFE7EE' },
  filterDayChipSelected: { backgroundColor: COLORS.textNavy },
  filterDayText: { fontFamily: FONTES.semibold, fontSize: 12, color: COLORS.textMuted },
  filterDayTextSelected: { color: COLORS.textWhite },
  subsequentEventsBox: { backgroundColor: COLORS.cardWhite, borderRadius: 18, paddingVertical: 6, elevation: 1 },
  eventListItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  eventListIconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.cardLightBlue, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  eventListTextContainer: { flex: 1 },
  eventListTitle: { fontFamily: FONTES.bold, fontSize: 14, fontWeight: '700', color: COLORS.textNavy },
  eventListSubtitle: { fontFamily: FONTES.body, fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  eventListDivider: { height: 1, backgroundColor: COLORS.cardDivider, marginHorizontal: 16 },
  noUpcomingBox: { backgroundColor: COLORS.cardWhite, borderRadius: 18, padding: 16, gap: 10 },
  noUpcomingText: { fontFamily: FONTES.body, color: COLORS.textMuted, fontSize: 13, lineHeight: 19 },
  noUpcomingAction: { fontFamily: FONTES.bold, color: COLORS.textNavy, fontSize: 13, fontWeight: '700' },
  bottomSpacer: { height: 28 }
});
