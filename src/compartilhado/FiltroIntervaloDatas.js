import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from 'react-native-paper';
import Feather from '@expo/vector-icons/Feather';
import { CORES, FONTES } from '../tema/cores';
import {
  FUSO_HORARIO_BRASILIA,
  criarDataBrasilia,
  formatarDataBrasilia,
  formatarDataIsoBrasilia,
} from './dataHoraBrasilia';

const DateTimePickerNativo = Platform.OS === 'web'
  ? null
  : require('@react-native-community/datetimepicker').default;

function dataDoValor(valor) {
  if (!valor) return null;
  if (typeof valor.toDate === 'function') {
    const data = valor.toDate();
    return data instanceof Date && !Number.isNaN(data.getTime()) ? data : null;
  }
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;
  if (typeof valor === 'string') {
    const texto = valor.trim();
    const chaveData = formatarDataIsoBrasilia(texto);
    if (chaveData) {
      return criarDataBrasilia(chaveData, '12:00');
    }
  }

  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

function chaveData(data) {
  return formatarDataIsoBrasilia(data);
}

export function obterChaveDataLocal(valor) {
  const data = dataDoValor(valor);
  return data ? chaveData(data) : '';
}

function formatarData(valor) {
  return formatarDataBrasilia(valor);
}

export default function FiltroIntervaloDatas({
  dataInicial,
  dataFinal,
  aoMudarDataInicial,
  aoMudarDataFinal,
  aoLimpar,
  aoAplicar,
  validarAoAplicar,
  ativo,
  rotuloBotao,
  iconeBotao = 'filter',
  iconeFinal,
  estiloBotao,
  estiloBotaoAtivo,
  estiloTextoBotao,
  estiloTextoBotaoAtivo,
  conteudoAdicional,
  tituloModal = 'Filtrar por período',
  subtituloModal = 'Escolha as datas dos eventos',
  aoAbrir,
  aoAplicarConteudoAdicional,
  limparAoAplicar = false,
  mostrarLimpar = false,
}) {
  const [modalVisivel, setModalVisivel] = useState(false);
  const [dataInicialRascunho, setDataInicialRascunho] = useState(dataInicial || '');
  const [dataFinalRascunho, setDataFinalRascunho] = useState(dataFinal || '');
  const [campoAtivo, setCampoAtivo] = useState(null);
  const [erro, setErro] = useState('');
  const filtroAtivo = ativo ?? Boolean(dataInicial || dataFinal);

  useEffect(() => {
    if (modalVisivel) {
      setDataInicialRascunho(dataInicial || '');
      setDataFinalRascunho(dataFinal || '');
      setErro('');
    }
  }, [modalVisivel, dataInicial, dataFinal]);

  const confirmarFiltro = () => {
    if (dataInicialRascunho && dataFinalRascunho && dataInicialRascunho > dataFinalRascunho) {
      setErro('A data inicial não pode ser posterior à data final.');
      return;
    }
    const erroValidacao = validarAoAplicar?.(dataInicialRascunho, dataFinalRascunho);
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }
    aoMudarDataInicial(dataInicialRascunho);
    aoMudarDataFinal(dataFinalRascunho);
    aoAplicar?.(dataInicialRascunho, dataFinalRascunho);
    aoAplicarConteudoAdicional?.();
    setModalVisivel(false);
  };

  const limparFiltro = () => {
    setDataInicialRascunho('');
    setDataFinalRascunho('');
    setErro('');
    aoLimpar?.();
    if (!limparAoAplicar) setModalVisivel(false);
  };

  const valorAtivo = campoAtivo === 'inicial' ? dataInicialRascunho : dataFinalRascunho;
  const setValorAtivo = campoAtivo === 'inicial' ? setDataInicialRascunho : setDataFinalRascunho;

  const renderizarCampoData = (titulo, valor, chave, setValor) => (
    <View style={styles.campo} key={chave}>
      <Text style={styles.rotulo}>{titulo}</Text>
      {Platform.OS === 'web' ? (
        React.createElement('input', {
          type: 'date',
          value: valor || '',
          'aria-label': titulo,
          onChange: (evento) => {
            setValor(evento.target.value);
            setErro('');
          },
          style: {
            boxSizing: 'border-box',
            width: '100%',
            minHeight: 46,
            border: '1px solid #D8E2EB',
            borderRadius: 11,
            padding: '10px 12px',
            backgroundColor: '#F8FAFC',
            color: CORES.textNavy,
            fontSize: 14,
            fontFamily: 'inherit',
          },
        })
      ) : (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`${titulo}: ${valor ? formatarData(valor) : 'Selecionar data'}`}
          onPress={() => {
            setCampoAtivo(chave);
            setErro('');
          }}
          style={styles.botaoData}
        >
          <Text style={[styles.textoData, !valor && styles.placeholder]}>
            {valor ? formatarData(valor) : 'Selecionar data'}
          </Text>
          <Feather name="calendar" size={17} color={CORES.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={rotuloBotao || (filtroAtivo ? 'Alterar filtro de período' : 'Filtrar por período')}
        accessibilityState={{ selected: filtroAtivo }}
        onPress={() => {
          aoAbrir?.();
          setModalVisivel(true);
        }}
        style={[
          rotuloBotao ? styles.botaoRotulado : styles.botaoFiltro,
          filtroAtivo && styles.botaoFiltroAtivo,
          estiloBotao,
          filtroAtivo && estiloBotaoAtivo,
        ]}
      >
        <Feather name={iconeBotao} size={18} color={filtroAtivo ? '#FFFFFF' : CORES.textNavy} />
        {!!rotuloBotao && (
          <Text style={[
            styles.textoBotao,
            filtroAtivo && styles.textoBotaoAtivo,
            estiloTextoBotao,
            filtroAtivo && estiloTextoBotaoAtivo,
          ]}>
            {rotuloBotao}
          </Text>
        )}
        {iconeFinal && <Feather name={iconeFinal} size={16} color={filtroAtivo ? '#FFFFFF' : CORES.textSubtle} />}
        {!rotuloBotao && filtroAtivo && <View style={styles.indicadorAtivo} />}
      </TouchableOpacity>

      <Modal
        visible={modalVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setCampoAtivo(null);
          setModalVisivel(false);
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.cartao}>
            <View style={styles.cabecalho}>
              <View style={styles.tituloLinha}>
                <View style={styles.iconeTitulo}>
                  <Feather name="calendar" size={19} color={CORES.textNavy} />
                </View>
                <View style={styles.tituloConteudo}>
                  <Text style={styles.titulo}>{tituloModal}</Text>
                  <Text style={styles.subtitulo}>{subtituloModal}</Text>
                </View>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Fechar filtro de período"
                onPress={() => {
                  setCampoAtivo(null);
                  setModalVisivel(false);
                }}
                style={styles.fechar}
              >
                <Feather name="x" size={21} color={CORES.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.campos}>
              {renderizarCampoData('Data inicial', dataInicialRascunho, 'inicial', setDataInicialRascunho)}
              {renderizarCampoData('Data final', dataFinalRascunho, 'final', setDataFinalRascunho)}
            </View>

            {conteudoAdicional}

            {campoAtivo && DateTimePickerNativo && (
              <DateTimePickerNativo
                value={
                  dataDoValor(valorAtivo) ||
                  criarDataBrasilia(formatarDataIsoBrasilia(new Date()), '12:00')
                }
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                timeZoneName={FUSO_HORARIO_BRASILIA}
                locale={Platform.OS === 'ios' ? 'pt-BR' : undefined}
                onChange={(evento, dataSelecionada) => {
                  if (evento.type === 'dismissed') {
                    setCampoAtivo(null);
                    return;
                  }
                  if (dataSelecionada) {
                    setValorAtivo(chaveData(dataSelecionada));
                    setErro('');
                  }
                  if (Platform.OS !== 'ios') setCampoAtivo(null);
                }}
              />
            )}

            {!!erro && <Text style={styles.erro}>{erro}</Text>}

            <View style={styles.acoes}>
              {(filtroAtivo || mostrarLimpar) && (
                <Button mode="text" onPress={limparFiltro} textColor={CORES.textMuted}>
                  Limpar
                </Button>
              )}
              <View style={styles.acoesDireita}>
                <Button
                  mode="outlined"
                  onPress={() => setModalVisivel(false)}
                  textColor={CORES.textNavy}
                  style={styles.botaoAcao}
                >
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={confirmarFiltro}
                  buttonColor={CORES.buttonGold}
                  textColor={CORES.textNavy}
                  style={styles.botaoAcao}
                >
                  Aplicar
                </Button>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  botaoFiltro: {
    width: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#D6E2EB',
    backgroundColor: CORES.cardWhite,
  },
  botaoRotulado: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D6E2EB',
    backgroundColor: CORES.cardWhite,
  },
  botaoFiltroAtivo: { backgroundColor: CORES.bgHeaderDark, borderColor: CORES.bgHeaderDark },
  textoBotao: { flex: 1, fontFamily: FONTES.semibold, fontSize: 12, color: CORES.textNavy },
  textoBotaoAtivo: { color: '#FFFFFF' },
  indicadorAtivo: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: CORES.buttonGold,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(5, 20, 35, 0.55)',
  },
  cartao: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 20,
    padding: 20,
    backgroundColor: CORES.sheetBg,
    elevation: 12,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  tituloLinha: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconeTitulo: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#DDF0F8',
  },
  tituloConteudo: { flex: 1 },
  titulo: { fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 17 },
  subtitulo: { fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 12, marginTop: 3 },
  fechar: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderRadius: 18,
    backgroundColor: '#EDF2F6',
  },
  campos: { gap: 14 },
  campo: { minWidth: 0 },
  rotulo: { fontFamily: FONTES.semibold, color: CORES.textNavy, fontSize: 12, marginBottom: 7 },
  botaoData: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#D8E2EB',
    backgroundColor: '#F8FAFC',
  },
  textoData: { fontFamily: FONTES.body, color: CORES.textNavy, fontSize: 14 },
  placeholder: { color: CORES.textSubtle },
  erro: { fontFamily: FONTES.body, color: '#B42318', fontSize: 12, lineHeight: 17, marginTop: 12 },
  acoes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    gap: 8,
  },
  acoesDireita: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 'auto' },
  botaoAcao: { borderRadius: 10 },
});
