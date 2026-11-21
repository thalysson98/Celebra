import { notificarNovoEventoParaTecnico, notificarRemocaoConvocacao } from '../../servicos/servicoNotificacoes';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, Modal } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { CORES, FONTES } from '../../tema/cores';
import { styles } from '../../estilos/estilosDetalheEventoOrganizador';
import { repositorioEventos } from '../../servicos/repositorioEventos';
import { reenviarConvite, removerConvite, removerProfissionalInformativo, atualizarFuncaoConvite } from '../../servicos/servicoEscala';
import ModalAdicionarProfissional from '../../componentes/ModalAdicionarProfissional';
import ModalSelecao from '../../componentes/ModalSelecao';
import CartaoLocal from '../../componentes/CartaoLocal'; 
import { exportarEventoParaPdf } from '../../servicos/servicoExportacaoEvento';
import {
  formatarCpfCnpj,
  formatarTelefone,
  formatarMoedaInput,
  formatarDataParcelaInput,
  OPCOES_PAGAMENTO,
  OPCOES_QTD_PARCELAS,
} from './TelaCriarEvento';
import SeparadorCampoIcone from '../../compartilhado/SeparadorCampoIcone';

const ABAS = ['Geral', 'Equipe', 'Financeiro'];

const SECOES_EQUIPE = [
  { chave: 'confirmado', titulo: 'Confirmados' },
  { chave: 'recusado', titulo: 'Recusados' },
  { chave: 'pendente', titulo: 'Pendentes' },
  { chave: 'cancelado', titulo: 'Cancelados' },
  { chave: 'informativo', titulo: 'Informativos' },
];

const STATUS_EQUIPE_CONHECIDOS = new Set(SECOES_EQUIPE.map(({ chave }) => chave));

const normalizarStatusEquipe = (status) =>
  String(status || '').trim().toLocaleLowerCase('pt-BR');

const convitePendente = (status) =>
  String(status || '').toLocaleLowerCase('pt-BR').includes('pendente');

const converterValorMonetario = (valor) => {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
  const texto = String(valor || '').trim().replace(/[^\d,.-]/g, '');
  if (!texto) return 0;
  const numero = texto.includes(',')
    ? Number(texto.replace(/\./g, '').replace(',', '.'))
    : Number(texto.replace(/\D/g, '')) / 100 * (texto.startsWith('-') ? -1 : 1);
  return Number.isFinite(numero) ? numero : 0;
};

const formatarMonetario = (valor) => converterValorMonetario(valor).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dataParcelaValida = (valor) => {
  const correspondencia = String(valor || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!correspondencia) return false;
  const [, diaTexto, mesTexto, anoTexto] = correspondencia;
  const data = new Date(Number(anoTexto), Number(mesTexto) - 1, Number(diaTexto));
  return data.getFullYear() === Number(anoTexto) &&
    data.getMonth() === Number(mesTexto) - 1 &&
    data.getDate() === Number(diaTexto);
};

const DateTimePickerNativo = Platform.OS === 'web' ? null : require('@react-native-community/datetimepicker').default;

function CampoDataHora({ modo, valor, aoMudar }) {
  const [pickerVisivel, setPickerVisivel] = useState(false);
  let stringFormatada = valor;
  if(modo === 'date' && valor && valor.includes('-')) { stringFormatada = valor.split('-').reverse().join('/'); }
  
  if (Platform.OS === 'web') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, minHeight: 48 }}>
        <Feather name={modo === 'date' ? 'calendar' : 'clock'} size={18} color="#94A3B8" />
        <SeparadorCampoIcone />
        {React.createElement('input', {
          type: modo,
          value: modo === 'date' && valor && valor.includes('/') ? valor.split('/').reverse().join('-') : valor,
          onChange: (evento) => {
            const data = evento.target.value;
            aoMudar(modo === 'date' && data ? data.split('-').reverse().join('/') : data);
          },
          style: { flex: 1, minWidth: 0, boxSizing: 'border-box', minHeight: 46, border: 'none', outline: 'none', backgroundColor: 'transparent', color: CORES.textNavy, fontSize: 14, fontFamily: FONTES.body, textAlign: 'left' },
        })}
      </View>
    );
  }
  
  let dataPicker = new Date();
  if (modo === 'date' && valor) {
    if(valor.includes('/')){ const [d, m, y] = valor.split('/'); dataPicker = new Date(`${y}-${m}-${d}T12:00:00`);
    } else { dataPicker = new Date(`${valor}T12:00:00`); }
  } else if (modo === 'time' && valor) {
    const [h, m] = String(valor || '16:00').split(':').map(Number); dataPicker.setHours(h || 0, m || 0, 0, 0); 
  }

  return (
    <>
      <TouchableOpacity accessibilityRole="button" onPress={() => setPickerVisivel(true)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, minHeight: 48 }}>
        <Feather name={modo === 'date' ? 'calendar' : 'clock'} size={18} color="#94A3B8" />
        <SeparadorCampoIcone />
        <Text style={{ flex: 1, fontFamily: FONTES.body, color: CORES.textNavy, fontSize: 14, textAlign: 'left' }}>{stringFormatada || (modo === 'date' ? 'DD/MM/AAAA' : '16:00')}</Text>
      </TouchableOpacity>
      {pickerVisivel && DateTimePickerNativo && <DateTimePickerNativo value={dataPicker} mode={modo} display="default" onChange={(e, s) => { setPickerVisivel(false); if (!s || e.type === 'dismissed') return; if (modo === 'date') aoMudar(`${String(s.getDate()).padStart(2, '0')}/${String(s.getMonth() + 1).padStart(2, '0')}/${s.getFullYear()}`); else aoMudar(`${String(s.getHours()).padStart(2, '0')}:${String(s.getMinutes()).padStart(2, '0')}`); }} />}
    </>
  );
}

function CampoEdicao({ label, valor, aoMudar, placeholder, multiline = false, icone, teclado="default", alinharTextoAoMeio = false, compacto = false, erro }) {
  return (
    <View style={{ marginBottom: compacto ? 8 : 15 }}>
      <Text style={{ fontFamily: FONTES.semibold, color: CORES.textNavy, fontSize: 13, marginBottom: compacto ? 4 : 6 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, minHeight: compacto ? 44 : 48 }}>
        {icone && <Feather name={icone} size={18} color="#94A3B8" />}
        {icone && <SeparadorCampoIcone />}
        <TextInput
          value={valor} onChangeText={aoMudar} placeholder={placeholder || label} placeholderTextColor="#94A3B8" multiline={multiline} keyboardType={teclado} textAlign="left"
          style={{ flex: 1, fontFamily: FONTES.body, color: CORES.textNavy, fontSize: 14, minHeight: multiline ? 76 : compacto ? 42 : 48, textAlignVertical: alinharTextoAoMeio ? 'center' : multiline ? 'top' : 'center', paddingTop: multiline && !alinharTextoAoMeio ? 12 : 0, outlineStyle: 'none' }}
        />
      </View>
      <ErroCampo>{erro}</ErroCampo>
    </View>
  );
}

function ErroCampo({ children }) {
  if (!children) return null;
  return (
    <Text accessibilityRole="alert" style={styles.inlineFieldError}>
      {children}
    </Text>
  );
}

function CampoSelecaoDetalhes({ label, campo, valor, placeholder, icone, aoClicar, erro }) {
  return (
    <View style={{ marginBottom: 15 }}>
      <Text style={{ fontFamily: FONTES.semibold, color: CORES.textNavy, fontSize: 13, marginBottom: 6 }}>{label}</Text>
      <TouchableOpacity onPress={() => aoClicar(campo)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, minHeight: 48, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {icone && <Feather name={icone} size={18} color="#94A3B8" />}
          {icone && <SeparadorCampoIcone />}
          <Text style={{ flex: 1, fontFamily: FONTES.body, color: valor ? CORES.textNavy : '#94A3B8', fontSize: 14, textAlign: 'left' }} numberOfLines={1}>{valor || placeholder}</Text>
        </View>
        <Feather name="chevron-down" size={18} color="#94A3B8" />
      </TouchableOpacity>
      <ErroCampo>{erro}</ErroCampo>
    </View>
  );
}

export default function TelaDetalheEvento({ route, navigation, usuario }) {
  const { idEvento } = route.params || {};
  const [evento, setEvento] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [exportandoPdf, setExportandoPdf] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState(
    route.params?.abaInicial === 'Financeiro'
      ? 'Financeiro'
      : route.params?.erroConvites
        ? 'Equipe'
        : 'Geral'
  );
  const [editando, setEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  
  const [modalEquipeVisivel, setModalEquipeVisivel] = useState(false);
  const [selecaoVisivel, setSelecaoVisivel] = useState(false);
  const [opcoesSelecao, setOpcoesSelecao] = useState([]);
  const [tipoSelecao, setTipoSelecao] = useState('');
  const [carregandoOpcoes, setCarregandoOpcoes] = useState(false);
  
  const [modalExcluirVisivel, setModalExcluirVisivel] = useState(false);
  const [modalConcluirVisivel, setModalConcluirVisivel] = useState(false);
  const [modalReabrirVisivel, setModalReabrirVisivel] = useState(false);
  const [modalSucessoVisivel, setModalSucessoVisivel] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState({ titulo: '', descricao: '' });
  
  const [modalErroVisivel, setModalErroVisivel] = useState(false);
  const [msgErro, setMsgErro] = useState('');
  const [errosEdicao, setErrosEdicao] = useState({});

  const [profissionalAlvo, setProfissionalAlvo] = useState(null);
  const [modalDespesasVisivel, setModalDespesasVisivel] = useState(false);
  const [profissionalDespesas, setProfissionalDespesas] = useState(null);
  const [mostrarSeletorDespesa, setMostrarSeletorDespesa] = useState(false);
  const [buscaTipoDespesa, setBuscaTipoDespesa] = useState('');
  const [tipoDespesa, setTipoDespesa] = useState('');
  const [idTipoDespesa, setIdTipoDespesa] = useState('');
  const [valorDespesa, setValorDespesa] = useState('');
  const [idDespesaEditando, setIdDespesaEditando] = useState(null);
  const [idDespesaExcluindo, setIdDespesaExcluindo] = useState(null);
  const [parcelaRapida, setParcelaRapida] = useState(null);
  const [salvandoAcaoRapida, setSalvandoAcaoRapida] = useState(false);
  
  const [modalLocalVisivel, setModalLocalVisivel] = useState(false);
  const [formNovoLocal, setFormNovoLocal] = useState({ nome: '', rua: '', numero: '', bairro: '', cidade: '', estado: '' });
  const [modalClienteVisivel, setModalClienteVisivel] = useState(false);
  const [formNovoCliente, setFormNovoCliente] = useState({ nome: '', documento: '', telefone: '', instagram: '' });
  
  const [locais, setLocais] = useState([]);
  const [localExpandidoId, setLocalExpandidoId] = useState(null);
  const [formulario, setFormulario] = useState({
     titulo: '', tipoEvento: '', cliente: '', dataInicio: '', horaInicio: '', numConvidados: '', notasProducao: '',
     metodoPagamento: '', valorTotal: '', observacaoFinanceiro: '', qtdParcelas: '', parcelasDetalhadas: []
  });

  useEffect(() => {
    if (route.params?.abaInicial !== 'Financeiro') return;
    setAbaAtiva('Financeiro');
    setEditando(null);
    navigation.setParams({ abaInicial: undefined });
  }, [navigation, route.params?.abaInicial]);

  const mostrarSucesso = (titulo, descricao) => {
    setMsgSucesso({ titulo, descricao });
    setModalSucessoVisivel(true);
  };

  const mostrarErro = (mensagem) => {
    setMsgErro(mensagem);
    setModalErroVisivel(true);
  };

  useEffect(() => {
    const erroConvites = route.params?.erroConvites;
    if (!erroConvites) return;
    mostrarErro(erroConvites);
    navigation.setParams({ erroConvites: undefined });
  }, [navigation, route.params?.erroConvites]);

  const limparErroCampo = (campo) => {
    setErrosEdicao((atuais) => {
      if (!atuais[campo]) return atuais;
      const atualizados = { ...atuais };
      delete atualizados[campo];
      return atualizados;
    });
  };

  const preencherFormulario = (dados) => {
    setFormulario({
      titulo: dados?.titulo || '', tipoEvento: dados?.tipoEvento || '', cliente: dados?.cliente?.nome || '',
      dataInicio: dados?.dataInicio || '', horaInicio: dados?.horaInicio || '',
      numConvidados: dados?.numConvidados ? String(dados.numConvidados) : '', notasProducao: dados?.notasProducao || '',
      metodoPagamento: dados?.financeiro?.metodoPagamento || '', valorTotal: dados?.financeiro?.valorTotal || '',
      observacaoFinanceiro: dados?.financeiro?.observacaoFinanceiro || '',
      qtdParcelas: String(dados?.financeiro?.qtdParcelas ?? ''),
      parcelasDetalhadas: dados?.financeiro?.parcelasDetalhadas || []
    });
    if (dados?.locais && dados.locais.length > 0) {
        const locaisCarregados = dados.locais.map((l, i) => ({ ...l, idLocalTemp: l.idLocalTemp ?? i }));
        setLocais(locaisCarregados);
        setLocalExpandidoId(locaisCarregados[0].idLocalTemp);
    } else {
        const localInicial = { idLocalTemp: 1, nomeDoLocal: '', enderecoLocal: '', tipoLocal: '', horaLocal: '', observacoesLocal: '' };
        setLocais([localInicial]);
        setLocalExpandidoId(localInicial.idLocalTemp);
    }
    setErrosEdicao({});
  };

  const carregarEvento = useCallback(async () => {
    setCarregando(true);
    try {
      const dados = await repositorioEventos.obterEvento(idEvento);
      setEvento(dados);
      preencherFormulario(dados);
    } catch (error) { console.log(error); } finally { setCarregando(false); }
  }, [idEvento]);

  useFocusEffect(useCallback(() => { carregarEvento(); }, [carregarEvento]));

  const eventoConcluido = evento?.statusTempo === 'concluidos';

  const atualizarCampo = (campo, valor) => {
    limparErroCampo(campo);
    setFormulario((atual) => {
      const novo = { ...atual, [campo]: valor };
      if (campo === 'qtdParcelas') {
        if (String(valor).trim() === '') return novo;
        const qtd = Number(valor) || 0;
        const qtdSegura = Math.min(qtd, 12);
        novo.parcelasDetalhadas = Array.from({ length: qtdSegura }, (_, i) => (
          atual.parcelasDetalhadas[i] || { valor: '', observacao: '', status: 'pendente', vencimento: '' }
        ));
        if (qtdSegura === 1) {
          novo.parcelasDetalhadas[0] = {
            ...novo.parcelasDetalhadas[0],
            valor: formatarMoedaInput(String(atual.valorTotal || '')),
          };
        }
      } else if (campo === 'valorTotal' && Number(atual.qtdParcelas) === 1) {
        const parcelaUnica = atual.parcelasDetalhadas[0] || {
          observacao: '',
          status: 'pendente',
          vencimento: '',
        };
        novo.parcelasDetalhadas = [{
          ...parcelaUnica,
          valor: formatarMoedaInput(String(valor || '')),
        }];
      }
      return novo;
    });
  };

  const atualizarParcela = (index, campo, valor) => {
      const arr = [...formulario.parcelasDetalhadas];
      arr[index][campo] = valor;
      setFormulario({...formulario, parcelasDetalhadas: arr});
      limparErroCampo(campo === 'vencimento' ? `parcela_${index}_vencimento` : 'somaParcelas');
  };

  const atualizarValorParcela = (index, valor) => {
    if (String(valor).includes('-')) {
      mostrarErro('O valor da parcela não pode ser negativo.');
      return;
    }
    atualizarParcela(index, 'valor', formatarMoedaInput(valor));
  };

  const alternarStatusParcela = (index) => {
      const arr = [...formulario.parcelasDetalhadas];
      arr[index].status = arr[index].status === 'paga' ? 'pendente' : 'paga';
      setFormulario({...formulario, parcelasDetalhadas: arr});
  };

  const abrirDespesasProfissional = (pessoa) => {
    setProfissionalDespesas(pessoa);
    setTipoDespesa('');
    setIdTipoDespesa('');
    setValorDespesa('');
    setIdDespesaEditando(null);
    setIdDespesaExcluindo(null);
    setModalDespesasVisivel(true);
  };

  const editarDespesaProfissional = (despesa) => {
    setIdDespesaEditando(despesa.id);
    setTipoDespesa(despesa.tipo || '');
    setIdTipoDespesa(despesa.id_tipo_despesa || '');
    setValorDespesa(despesa.valor || '');
  };

  const persistirDespesasProfissional = async (despesas) => {
    const chaveProfissional = profissionalDespesas.idConvite || profissionalDespesas.idUsuario || profissionalDespesas.id;
    await repositorioEventos.atualizarDespesasEquipe(idEvento, chaveProfissional, despesas);
    setProfissionalDespesas((atual) => ({ ...atual, despesas }));
    setEvento((atual) => ({
      ...atual,
      equipe: atual.equipe.map((pessoa) => {
        const chave = pessoa.idConvite || pessoa.idUsuario || pessoa.id;
        return chave === chaveProfissional ? { ...pessoa, despesas } : pessoa;
      }),
    }));
  };

  const salvarDespesaProfissional = async () => {
    if (convitePendente(profissionalDespesas?.statusConfirmacao) && !idDespesaEditando) {
      mostrarErro('Não é possível adicionar despesas para um profissional com convite pendente.');
      return;
    }
    if (profissionalDespesas?.statusConfirmacao === 'Cancelado' && !idDespesaEditando) {
      mostrarErro('Não é possível adicionar despesas para um profissional com convite cancelado.');
      return;
    }
    const tipo = tipoDespesa.trim();
    const valor = converterValorMonetario(valorDespesa);
    if (!tipo || !idTipoDespesa || valor <= 0) {
      mostrarErro('Informe o tipo da despesa e um valor maior que zero.');
      return;
    }

    const despesaAtualizada = {
      id: idDespesaEditando || String(Date.now()),
      id_tipo_despesa: idTipoDespesa,
      tipo,
      valor: formatarMoedaInput(valorDespesa),
    };
    const despesas = idDespesaEditando
      ? (profissionalDespesas.despesas || []).map((despesa) => despesa.id === idDespesaEditando ? despesaAtualizada : despesa)
      : [...(profissionalDespesas.despesas || []), despesaAtualizada];
    setSalvandoAcaoRapida(true);
    try {
      await persistirDespesasProfissional(despesas);
      setTipoDespesa('');
      setIdTipoDespesa('');
      setValorDespesa('');
      setIdDespesaEditando(null);
    } catch (error) {
      mostrarErro(error?.message || 'Não foi possível salvar a despesa.');
    } finally {
      setSalvandoAcaoRapida(false);
    }
  };

  const excluirDespesaProfissional = (despesa) => {
    setIdDespesaExcluindo(despesa.id);
  };

  const confirmarExclusaoDespesa = async () => {
    setSalvandoAcaoRapida(true);
    try {
      const despesas = (profissionalDespesas?.despesas || []).filter((item) => item.id !== idDespesaExcluindo);
      await persistirDespesasProfissional(despesas);
      if (idDespesaEditando === idDespesaExcluindo) {
        setIdDespesaEditando(null);
        setTipoDespesa('');
        setIdTipoDespesa('');
        setValorDespesa('');
      }
      setIdDespesaExcluindo(null);
    } catch (error) {
      mostrarErro(error?.message || 'Não foi possível excluir a despesa.');
    } finally {
      setSalvandoAcaoRapida(false);
    }
  };

  const abrirEdicaoRapidaParcela = (parcela, index) => {
    setParcelaRapida({
      index,
      status: parcela.status === 'paga' ? 'pendente' : 'paga',
      observacao: parcela.observacao || '',
      vencimento: parcela.vencimento || '',
    });
  };

  const salvarEdicaoRapidaParcela = async () => {
    if (!parcelaRapida) return;
    if (parcelaRapida.vencimento && !dataParcelaValida(parcelaRapida.vencimento)) {
      mostrarErro('Informe um vencimento válido no formato DD/MM/AAAA.');
      return;
    }
    const parcelas = [...(evento.financeiro?.parcelasDetalhadas || [])];
    parcelas[parcelaRapida.index] = {
      ...parcelas[parcelaRapida.index],
      status: parcelaRapida.status,
      observacao: parcelaRapida.observacao.trim(),
      vencimento: parcelaRapida.vencimento,
    };
    setSalvandoAcaoRapida(true);
    try {
      await repositorioEventos.atualizarParcelasEvento(idEvento, parcelas);
      setEvento((atual) => ({ ...atual, financeiro: { ...atual.financeiro, parcelasDetalhadas: parcelas } }));
      setFormulario((atual) => ({ ...atual, parcelasDetalhadas: parcelas }));
      setParcelaRapida(null);
    } catch (error) {
      mostrarErro(error?.message || 'Não foi possível atualizar a parcela.');
    } finally {
      setSalvandoAcaoRapida(false);
    }
  };

  const atualizarLocal = (index, campo, valor) => {
    const novosLocais = [...locais];
    novosLocais[index][campo] = valor;
    setLocais(novosLocais);
    limparErroCampo(`local_${index}_${campo}`);
  };

  const adicionarLocal = () => {
    const novoLocal = { idLocalTemp: Date.now(), nomeDoLocal: '', enderecoLocal: '', tipoLocal: '', horaLocal: '', observacoesLocal: '' };
    setLocais((atuais) => [...atuais, novoLocal]);
    setLocalExpandidoId(novoLocal.idLocalTemp);
  };
  const removerLocal = (index) => {
    const restantes = locais.filter((_, i) => i !== index);
    setLocais(restantes);
    if (locais[index]?.idLocalTemp === localExpandidoId) {
      setLocalExpandidoId(restantes[0]?.idLocalTemp ?? null);
    }
  };

  const cancelarEdicao = () => {
    preencherFormulario(evento);
    setEditando(null);
  };

const salvarEdicao = async () => {
  const novosErros = {};
  if (editando === 'geral') {
    if (!formulario.titulo.trim()) novosErros.titulo = 'Informe o título do evento.';
    if (!formulario.tipoEvento.trim()) novosErros.tipoEvento = 'Selecione o tipo de evento.';
    if (!formulario.cliente.trim()) novosErros.cliente = 'Selecione o cliente.';
    if (!formulario.dataInicio.trim()) novosErros.dataInicio = 'Selecione a data do evento.';

    locais.forEach((local, index) => {
      if (!local.tipoLocal.trim()) novosErros[`local_${index}_tipoLocal`] = 'Selecione o tipo do local.';
      if (!local.nomeDoLocal.trim()) novosErros[`local_${index}_nomeDoLocal`] = 'Selecione o endereço.';
    });
    if (Object.keys(novosErros).length) {
      setErrosEdicao(novosErros);
      const primeiroLocalComErro = locais.findIndex((_, index) =>
        novosErros[`local_${index}_tipoLocal`] || novosErros[`local_${index}_nomeDoLocal`]
      );
      if (primeiroLocalComErro >= 0) setLocalExpandidoId(locais[primeiroLocalComErro].idLocalTemp);
      mostrarErro('Revise os campos destacados antes de salvar os dados gerais.');
      return;
    }
  }

  if (editando === 'financeiro') {
    const parcelas = formulario.parcelasDetalhadas || [];
    parcelas.forEach((parcela, index) => {
      if (parcela.vencimento && !dataParcelaValida(parcela.vencimento)) {
        novosErros[`parcela_${index}_vencimento`] = 'Informe uma data válida no formato DD/MM/AAAA.';
      }
    });

    const valorTotal = converterValorMonetario(formulario.valorTotal);
    const somaParcelas = parcelas.reduce((soma, parcela) => soma + converterValorMonetario(parcela.valor), 0);
    const diferencaParcelas = Math.abs(somaParcelas - valorTotal);
    if ((valorTotal > 0 || somaParcelas > 0) && diferencaParcelas > 0.05) {
      novosErros.somaParcelas = `A soma das parcelas (${formatarMonetario(somaParcelas)}) não corresponde ao total do evento (${formatarMonetario(valorTotal)}).`;
    }

    if (Object.keys(novosErros).length) {
      setErrosEdicao(novosErros);
      const mensagem = novosErros.somaParcelas || 'Revise os vencimentos destacados. Informe datas válidas no formato DD/MM/AAAA.';
      mostrarErro(mensagem);
      return;
    }
  }
  setErrosEdicao({});

  setSalvando(true);
  try {
    let dataFormatadaFirebase = formulario.dataInicio;
    if (formulario.dataInicio && formulario.dataInicio.includes('/')) {
      const [d, m, y] = formulario.dataInicio.split('/');
      dataFormatadaFirebase = `${y}-${m}-${d}`;
    }
    const payloadFinanceiro = {
      valorTotal: formulario.valorTotal,
      metodoPagamento: formulario.metodoPagamento,
      observacaoFinanceiro: formulario.observacaoFinanceiro,
      qtdParcelas: Number(formulario.qtdParcelas) || 0,
      parcelasDetalhadas: formulario.parcelasDetalhadas
    };
    const locaisValidos = locais.filter(l => l.nomeDoLocal.trim() && l.tipoLocal.trim());
    
    await repositorioEventos.atualizarEvento(idEvento, { 
      ...formulario, 
      dataInicio: dataFormatadaFirebase, 
      financeiro: payloadFinanceiro, 
      cliente: { nome: formulario.cliente }, 
      locaisArray: locaisValidos 
    });
    
    await carregarEvento();
    setEditando(null);
    mostrarSucesso("Sucesso!", "Dados do evento atualizados.");
  } catch (error) { 
    mostrarErro("Não foi possível salvar as alterações."); 
  } finally { 
    setSalvando(false); 
  }
};

  const tentarConcluirEvento = () => {
    const fn = evento.financeiro || {};
    const valTotalStr = fn.valorTotal ? String(fn.valorTotal).replace(/\D/g, '') : '0';
    const valTotal = Number(valTotalStr) / 100;

    if (valTotal <= 0) {
      mostrarErro('Preencha o valor financeiro total antes de concluir o evento.');
      return;
    }

    const parcelas = fn.parcelasDetalhadas || [];
    if (parcelas.length === 0) {
       mostrarErro('Adicione as parcelas equivalentes ao valor total do evento.');
       return;
    }

    let somaTodasParcelas = 0;
    let temPendente = false;

    parcelas.forEach(p => {
       const valorParcela = (Number(String(p.valor || '0').replace(/\D/g, '')) / 100);
       somaTodasParcelas += valorParcela;
       
       if (p.status !== 'paga') {
          temPendente = true;
       }
    });

    if (temPendente) {
       mostrarErro('Todas as parcelas devem estar PAGAS para concluir o evento.');
       return;
    }

    if (Math.abs(somaTodasParcelas - valTotal) > 0.05) { 
       mostrarErro('A soma das parcelas pagas não bate com o valor total do evento.');
       return;
    }

    setModalConcluirVisivel(true);
  };

  const confirmarConclusao = async () => {
    setModalConcluirVisivel(false); 
    setCarregando(true);
    try {
      await repositorioEventos.concluirEvento(idEvento);
      await carregarEvento(); 
      mostrarSucesso("Evento Concluído", "O evento foi encerrado e não pode mais ser editado.");
    } catch (error) {
      setCarregando(false);
      mostrarErro("Não foi possível concluir. Verifique sua conexão.");
    }
  };

  const confirmarReabertura = async () => {
    setModalReabrirVisivel(false);
    setCarregando(true);
    try {
      await repositorioEventos.reabrirEvento(idEvento);
      await carregarEvento();
      mostrarSucesso("Evento Reaberto", "O evento retornou para a categoria de futuros e pode ser editado novamente.");
    } catch (error) {
      setCarregando(false);
      mostrarErro("Não foi possível reabrir o evento.");
    }
  };

  const clickReenviar = async (idConvite) => {
    try {
      await reenviarConvite(idConvite);
      await carregarEvento();
      mostrarSucesso("Convite Reenviado", "O profissional receberá a notificação novamente.");
    } catch (error) {
      mostrarErro(error?.message || "Não foi possível reenviar o convite.");
    }
  };

  const abrirModalExcluir = (pessoa) => {
    setProfissionalAlvo(pessoa);
    setModalExcluirVisivel(true);
  };

    const confirmarExclusaoTecnico = async () => {
    const alvo = profissionalAlvo;
    setModalExcluirVisivel(false);

    setTimeout(async () => {
      setCarregando(true);
      try {
        if (alvo.statusConfirmacao === 'Informativo') {
          await removerProfissionalInformativo(idEvento, alvo.idUsuario);
        } else {
          await removerConvite(alvo.idConvite, idEvento, alvo.idUsuario);
          try {
            await notificarRemocaoConvocacao({
              idUsuario: alvo.idUsuario,
              idEvento,
              nomeEvento: evento?.nome || evento?.titulo,
              dataEvento: evento?.dataInicio,
              funcao: alvo.funcao,
            });
          } catch (erroNotificacao) {
            console.log('Erro ao notificar remoção da convocação:', erroNotificacao?.message);
          }
        }
        await carregarEvento();
        mostrarSucesso("Sucesso", "O Profissional foi removido da equipe.");
      } catch (e) {
        setCarregando(false);
        mostrarErro("Não foi possível remover este profissional.");
      }
    }, 300);
  };

  const abrirSelecao = async (campoInfo) => {
    setTipoSelecao(campoInfo);
    if (campoInfo === 'tipoDespesa') {
      setBuscaTipoDespesa('');
      setMostrarSeletorDespesa(true);
      setCarregandoOpcoes(true);
      try {
        const opcoes = await repositorioEventos.obterOpcoesSelect('tiposDespesa', usuario?.idEmpresa || usuario?.companyId);
        setOpcoesSelecao(opcoes);
      } catch (error) {
        mostrarErro('Não foi possível carregar os tipos de despesa.');
      } finally {
        setCarregandoOpcoes(false);
      }
      return;
    }
    if (campoInfo === 'metodoPagamento') {
      setOpcoesSelecao(OPCOES_PAGAMENTO);
      setSelecaoVisivel(true);
      return;
    }
    if (campoInfo === 'qtdParcelas') {
      setOpcoesSelecao(OPCOES_QTD_PARCELAS);
      setSelecaoVisivel(true);
      return;
    }
    setSelecaoVisivel(true);
    setCarregandoOpcoes(true);
    try {
      const tipoReal = campoInfo.startsWith('local_') ? 'locaisSalvos'
        : campoInfo.startsWith('tipoLocal_') ? 'tiposLocal'
          : campoInfo === 'cliente' ? 'clientes'
            : campoInfo === 'editarProfissional' ? 'tiposProfissional'
              : campoInfo === 'tipoDespesa' ? 'tiposDespesa' : 'tiposEvento';
      const opcoes = await repositorioEventos.obterOpcoesSelect(tipoReal, usuario?.idEmpresa || usuario?.companyId);
      setOpcoesSelecao(opcoes);
    } catch (erro) {} finally { setCarregandoOpcoes(false); }
  };

  const escolherOpcao = async (item) => {
    if (tipoSelecao === 'editarProfissional') {
       await atualizarFuncaoConvite(profissionalAlvo.idConvite, item.id, item.nome);
       carregarEvento();
       mostrarSucesso("Atualizado", "A função do técnico foi alterada.");
    } else if (tipoSelecao === 'metodoPagamento') {
       atualizarCampo('metodoPagamento', item.nome);
    } else if (tipoSelecao === 'qtdParcelas') {
       atualizarCampo('qtdParcelas', item.id);
    } else if (tipoSelecao === 'tipoDespesa') {
       setTipoDespesa(item.nome || '');
       setIdTipoDespesa(item.id || '');
    } else if (tipoSelecao.startsWith('local_')) {
      const index = parseInt(tipoSelecao.split('_')[1], 10);
      const tiposLocais = await repositorioEventos.obterOpcoesSelect('tiposLocal', usuario?.idEmpresa);
      const tipoLocal = tiposLocais.find((tipo) => tipo.id === item.id_tipo_local);
      atualizarLocal(index, 'nomeDoLocal', item.nome || '');
      atualizarLocal(index, 'enderecoLocal', item.endereco_completo || '');
      if(tipoLocal?.nome) { atualizarLocal(index, 'tipoLocal', tipoLocal.nome); }
    } else if (tipoSelecao.startsWith('tipoLocal_')) {
      const index = parseInt(tipoSelecao.split('_')[1], 10);
      atualizarLocal(index, 'tipoLocal', item.nome || '');
    } else {
      atualizarCampo(tipoSelecao, item.nome || '');
    }
    setSelecaoVisivel(false);
  };

  const salvarNovoItemNaSelecao = async (novoNome) => {
    if (!novoNome.trim()) return;
    if (tipoSelecao.startsWith('local_')) {
      setFormNovoLocal({ ...formNovoLocal, nome: novoNome.trim() });
      setSelecaoVisivel(false);
      setModalLocalVisivel(true);
      return;
    }
    if (tipoSelecao === 'cliente') {
      setFormNovoCliente({ ...formNovoCliente, nome: novoNome.trim() });
      setSelecaoVisivel(false);
      setModalClienteVisivel(true);
      return;
    }
    setCarregandoOpcoes(true);
    try {
      const tipoReal = tipoSelecao.startsWith('tipoLocal_') ? 'tiposLocal'
        : tipoSelecao === 'editarProfissional' ? 'tiposProfissional'
          : tipoSelecao === 'tipoDespesa' ? 'tiposDespesa' : 'tiposEvento';
      const empresaId = usuario?.idEmpresa || usuario?.companyId || evento?.id_empresa;
      const novo = await repositorioEventos.adicionarNovoItemSelect(tipoReal, { nome: novoNome.trim() }, empresaId);
      await escolherOpcao(novo);
    } catch (error) {
      mostrarErro(error?.message || 'Não foi possível adicionar o cadastro.');
    } finally { setCarregandoOpcoes(false); }
  };

  const salvarNovoLocalDetalhado = async () => {
    if (!formNovoLocal.nome || !formNovoLocal.rua) { mostrarErro("Preencha o nome e rua do local."); return; }
    setCarregandoOpcoes(true);
    try {
      const enderecoFormatado = `${formNovoLocal.rua}, ${formNovoLocal.numero} - ${formNovoLocal.bairro}, ${formNovoLocal.cidade} - ${formNovoLocal.estado}`;
      const novo = await repositorioEventos.adicionarNovoItemSelect('locaisSalvos', { nome: formNovoLocal.nome.trim(), endereco_completo: enderecoFormatado, rua: formNovoLocal.rua, bairro: formNovoLocal.bairro, cidade: formNovoLocal.cidade, estado: formNovoLocal.estado }, usuario?.idEmpresa);
      setModalLocalVisivel(false);
      setFormNovoLocal({ nome: '', rua: '', numero: '', bairro: '', cidade: '', estado: '' });
      escolherOpcao(novo);
    } catch (e) {} finally { setCarregandoOpcoes(false); }
  };

  const salvarNovoClienteDetalhado = async () => {
    if (!formNovoCliente.nome || !formNovoCliente.documento) { mostrarErro("Preencha o nome e CPF/CNPJ."); return; }
    setCarregandoOpcoes(true);
    try {
      const novo = await repositorioEventos.adicionarNovoItemSelect('clientes', {
          nome: formNovoCliente.nome.trim(),
          documento: formNovoCliente.documento.trim(),
         telefone: formNovoCliente.telefone.trim(),
         instagram: formNovoCliente.instagram.trim()
      }, usuario?.idEmpresa);
      setModalClienteVisivel(false);
      setFormNovoCliente({ nome: '', documento: '', telefone: '', instagram: '' });
      escolherOpcao(novo);
    } catch (e) {} finally { setCarregandoOpcoes(false); }
  };

  if (carregando) return <View style={styles.center}><ActivityIndicator size="large" color={CORES.buttonGold} /></View>;
  if (!evento) return <View style={styles.center}><Text>Evento não encontrado.</Text></View>;

  const equipe = evento.equipe || [];
  const secoesEquipe = [
    ...SECOES_EQUIPE.map((secao) => ({
      ...secao,
      membros: equipe.filter((pessoa) => normalizarStatusEquipe(pessoa.statusConfirmacao) === secao.chave),
    })),
    {
      chave: 'outros',
      titulo: 'Outros',
      membros: equipe.filter((pessoa) => !STATUS_EQUIPE_CONHECIDOS.has(normalizarStatusEquipe(pessoa.statusConfirmacao))),
    },
  ].filter((secao) => secao.membros.length > 0);
  const financeiro = evento.financeiro || {};
  const despesasPorCategoria = equipe.reduce((totais, pessoa) => {
    (pessoa.despesas || []).forEach((despesa) => {
      const categoria = despesa.tipo || 'Sem categoria';
      totais[categoria] = (totais[categoria] || 0) + converterValorMonetario(despesa.valor);
    });
    return totais;
  }, {});
  const categoriasDespesas = Object.entries(despesasPorCategoria).sort(([categoriaA], [categoriaB]) => categoriaA.localeCompare(categoriaB, 'pt-BR'));
  const totalDespesasEquipe = categoriasDespesas.reduce((total, [, valor]) => total + valor, 0);
  const valorLiquidoEvento = converterValorMonetario(financeiro.valorTotal) - totalDespesasEquipe;
  const somaParcelasEditando = (formulario.parcelasDetalhadas || []).reduce(
    (soma, parcela) => soma + converterValorMonetario(parcela.valor),
    0
  );
  const totalEditando = converterValorMonetario(formulario.valorTotal);
  const parcelasDivergentes = (totalEditando > 0 || somaParcelasEditando > 0) &&
    Math.abs(somaParcelasEditando - totalEditando) > 0.05;
  
  const locaisOrdenados = [...(evento.locais || [])].sort((a, b) => (a.horaLocal || '').localeCompare(b.horaLocal || ''));

  const exportarPdf = async () => {
    setExportandoPdf(true);
    try {
      await exportarEventoParaPdf({
        titulo: evento.titulo,
        tipo: evento.tipoEvento,
        data: evento.dataInicio,
        horario: evento.horaInicio,
        cliente: evento.cliente?.nome,
        quantidade_convidados:
          evento.quantidade_convidados ??
          evento.quantidadeConvidados ??
          evento.num_convidados ??
          evento.numConvidados ??
          evento.guestCount ??
          0,
        locais: locaisOrdenados,
        equipe,
        notas: evento.notasProducao,
      });
    } catch (error) {
      mostrarErro(error.message || 'Não foi possível exportar o PDF do evento.');
    } finally {
      setExportandoPdf(false);
    }
  };

  let tituloSelecaoUI = 'Selecionar';
  if(tipoSelecao==='cliente') tituloSelecaoUI = 'Selecionar cliente';
  if(tipoSelecao==='tipoEvento') tituloSelecaoUI = 'Selecionar tipo de evento';
  if(tipoSelecao.startsWith('local_')) tituloSelecaoUI = 'Selecionar local';
  if(tipoSelecao.startsWith('tipoLocal_')) tituloSelecaoUI = 'Selecionar tipo do local';
  if(tipoSelecao==='metodoPagamento') tituloSelecaoUI = 'Método de Pagamento';
  if(tipoSelecao==='qtdParcelas') tituloSelecaoUI = 'Quantidade de parcelas';
  if(tipoSelecao==='editarProfissional') tituloSelecaoUI = 'Nova função do profissional';
  if(tipoSelecao==='tipoDespesa') tituloSelecaoUI = 'Selecionar tipo de despesa';

  return (
    <View style={styles.container}>
      {!editando && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
          {ABAS.map((aba) => (
            <TouchableOpacity key={aba} onPress={() => setAbaAtiva(aba)} style={[styles.tab, abaAtiva === aba && styles.tabActive]}>
              <Text style={[styles.tabText, abaAtiva === aba && styles.tabTextActive]}>{aba}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView style={styles.sheet} contentContainerStyle={styles.content}>
        {abaAtiva === 'Geral' && !editando && (
          <Card style={{ backgroundColor: CORES.cardWhite, borderRadius: 16, padding: 0, marginBottom: 20, elevation: 1 }}>
            <Card.Content style={{ padding: 20 }}>
              <Text style={styles.eventTitle}>{evento.titulo}</Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                 <Feather name="user" size={20} color={CORES.buttonGold} style={{ marginRight: 8 }} />
                 <Text style={{ fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 18 }}>
                    Cliente: {evento.cliente?.nome || 'Não informado'}
                 </Text>
              </View>

              <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10}}>
                <View style={{backgroundColor: '#EAF3F7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10}}>
                   <Text style={{color: '#2F80A8', fontFamily: FONTES.bold, fontSize: 13}}>{evento.tipoEvento}</Text>
                </View>
                {!!evento.numConvidados && (
                  <View style={{backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0'}}>
                     <Text style={{color: '#64748B', fontFamily: FONTES.semibold, fontSize: 13}}>{evento.numConvidados} Convidados</Text>
                  </View>
                )}
              </View>

              <View style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                   <View style={{width: 32, height: 32, borderRadius: 8, backgroundColor: '#EAF3F7', alignItems: 'center', justifyContent: 'center', marginRight: 12}}>
                      <Feather name="calendar" size={16} color={CORES.textNavy} />
                   </View>
                   <View>
                      <Text style={{ fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 12 }}>Data do evento</Text>
                      <Text style={{ fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 15 }}>{evento.dataInicio || 'Não informada'}</Text>
                   </View>
                 </View>
                 <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                   <View style={{width: 32, height: 32, borderRadius: 8, backgroundColor: '#EAF3F7', alignItems: 'center', justifyContent: 'center', marginRight: 12}}>
                      <Feather name="clock" size={16} color={CORES.textNavy} />
                   </View>
                   <View>
                      <Text style={{ fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 12 }}>Horário</Text>
                      <Text style={{ fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 15 }}>{evento.horaInicio || 'Não informado'}</Text>
                   </View>
                 </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {abaAtiva === 'Geral' && (editando === 'geral' ? <>
          <Text style={styles.sectionTitle}>Editar dados do evento</Text>
          <Card style={styles.card}><Card.Content>
            <View style={styles.editSectionBlock}>
              <Text style={styles.editSectionTitle}>Dados principais</Text>
              <CampoEdicao label="Título do evento *" valor={formulario.titulo} erro={errosEdicao.titulo} aoMudar={(valor) => atualizarCampo('titulo', valor)} />
              <CampoSelecaoDetalhes label="Tipo de evento *" campo="tipoEvento" valor={formulario.tipoEvento} erro={errosEdicao.tipoEvento} placeholder="Selecionar tipo" aoClicar={abrirSelecao} />
              <CampoSelecaoDetalhes label="Cliente *" campo="cliente" valor={formulario.cliente} erro={errosEdicao.cliente} placeholder="Selecionar cliente" icone="user" aoClicar={abrirSelecao} />
            </View>
            
            <View style={styles.editSectionBlock}>
              <Text style={styles.editSectionTitle}>Data e capacidade</Text>
              <View style={styles.editRow}>
                <View style={styles.editColumn}>
                   <Text style={styles.editLabel}>Data *</Text>
                   <CampoDataHora modo="date" valor={formulario.dataInicio} aoMudar={(valor) => atualizarCampo('dataInicio', valor)} />
                   <ErroCampo>{errosEdicao.dataInicio}</ErroCampo>
                </View>
                <View style={styles.editColumn}>
                   <Text style={styles.editLabel}>Horário</Text>
                   <CampoDataHora modo="time" valor={formulario.horaInicio} aoMudar={(valor) => atualizarCampo('horaInicio', valor)} />
                </View>
              </View>
              <CampoEdicao label="Número de convidados" valor={formulario.numConvidados} aoMudar={(v) => atualizarCampo('numConvidados', v)} placeholder="Ex.: 180" teclado="numeric" />
            </View>

            <View style={styles.editSectionBlock}>
              <View style={styles.editSectionHeading}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.editSectionTitle}>Locais do evento</Text>
                  <Text style={styles.editSectionHint}>Toque em um local para editar seus detalhes.</Text>
                </View>
                <View style={styles.editCountBadge}>
                  <Text style={styles.editCountBadgeText}>{locais.length}</Text>
                </View>
              </View>
              {locais.map((local, index) => (
                <View key={local.idLocalTemp ?? index} style={styles.editLocationCard}>
                  <View style={styles.editLocationHeader}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`${localExpandidoId === local.idLocalTemp ? 'Recolher' : 'Expandir'} local ${index + 1}`}
                      accessibilityState={{ expanded: localExpandidoId === local.idLocalTemp }}
                      onPress={() => setLocalExpandidoId((atual) => atual === local.idLocalTemp ? null : local.idLocalTemp)}
                      style={styles.editLocationToggle}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.editLocationTitle}>Local {index + 1}</Text>
                        <Text style={styles.editLocationSummary} numberOfLines={1}>
                          {[local.tipoLocal, local.nomeDoLocal].filter(Boolean).join(' · ') || 'Tipo e endereço não definidos'}
                        </Text>
                      </View>
                      <MaterialCommunityIcons name={localExpandidoId === local.idLocalTemp ? 'chevron-up' : 'chevron-down'} size={22} color={CORES.textMuted} />
                    </TouchableOpacity>
                    {locais.length > 1 && (
                      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Remover local ${index + 1}`} onPress={() => removerLocal(index)} style={styles.editLocationRemove}>
                        <MaterialCommunityIcons name="trash-can-outline" size={19} color="#B42318" />
                      </TouchableOpacity>
                    )}
                  </View>
                  {localExpandidoId === local.idLocalTemp && (
                    <View style={styles.editLocationFields}>
                      <CampoSelecaoDetalhes
                        label="Tipo do local *"
                        campo={`tipoLocal_${index}`}
                        valor={local.tipoLocal}
                        erro={errosEdicao[`local_${index}_tipoLocal`]}
                        placeholder="Selecionar tipo"
                        aoClicar={abrirSelecao}
                      />
                      <CampoSelecaoDetalhes
                        label="Endereço *"
                        campo={`local_${index}`}
                        valor={local.nomeDoLocal}
                        erro={errosEdicao[`local_${index}_nomeDoLocal`]}
                        placeholder="Selecionar endereço"
                        icone="map-pin"
                        aoClicar={abrirSelecao}
                      />
                      {!!local.enderecoLocal && <Text style={styles.editLocationAddress}>{local.enderecoLocal}</Text>}
                      <View style={styles.editRow}>
                        <View style={styles.editColumn}>
                          <Text style={styles.editLabel}>Horário</Text>
                          <CampoDataHora modo="time" valor={local.horaLocal} aoMudar={(v) => atualizarLocal(index, 'horaLocal', v)} />
                        </View>
                      </View>
                      <CampoEdicao label="Observações do local" valor={local.observacoesLocal} aoMudar={(v) => atualizarLocal(index, 'observacoesLocal', v)} placeholder="Detalhes de chegada..." multiline />
                    </View>
                  )}
                </View>
              ))}
              <Button mode="outlined" icon="plus" onPress={adicionarLocal} textColor={CORES.textNavy} style={{ borderRadius: 10, marginBottom: 8 }}>Adicionar local</Button>
            </View>

            <View style={styles.editSectionBlock}>
              <Text style={styles.editSectionTitle}>Notas da produção</Text>
              <CampoEdicao label="Observações para a equipe (opcional)" valor={formulario.notasProducao} aoMudar={(v) => atualizarCampo('notasProducao', v)} placeholder="Escrever notas importantes..." multiline />
            </View>
          </Card.Content></Card>
        </> : <>
          
          <Text style={styles.sectionTitle}>Locais do Evento</Text>
          {locaisOrdenados.length > 0 ? locaisOrdenados.map((local, index) => (
             <CartaoLocal key={index} local={local} />
          )) : <Text style={styles.sectionHint}>Nenhum local cadastrado.</Text>}
          
          <Card style={styles.productionNotesCard}>
            <Card.Content style={styles.productionNotesContent}>
              <View style={styles.productionNotesHeading}>
                <View style={styles.productionNotesIcon}>
                  <Feather name="file-text" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.productionNotesHeadingText}>
                  <Text style={styles.productionNotesTitle}>Notas da produção</Text>
                  <Text style={styles.productionNotesSubtitle}>Informações importantes para a equipe</Text>
                </View>
              </View>
              <View style={styles.productionNotesDivider} />
              <Text style={styles.productionNotesText}>{evento.notasProducao || 'Nenhuma observação registrada.'}</Text>
            </Card.Content>
          </Card>
          
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Exportar evento em PDF"
            onPress={exportarPdf}
            disabled={exportandoPdf}
            style={[
              styles.editPrimaryButton,
              { backgroundColor: '#e2953d', marginBottom: 10, opacity: exportandoPdf ? 0.65 : 1 },
            ]}
          >
            {exportandoPdf ? (
              <ActivityIndicator size="small" color={CORES.textNavy} />
            ) : (
              <Feather name="share" size={16} color={CORES.textNavy} />
            )}
            <Text style={styles.editPrimaryText}>
              {exportandoPdf ? 'Gerando PDF...' : 'Exportar PDF'}
            </Text>
          </TouchableOpacity>

          {!eventoConcluido && (
             <TouchableOpacity onPress={() => setEditando('geral')} style={styles.editPrimaryButton}>
               <Text style={styles.editPrimaryText}>Editar dados gerais e locais</Text>
             </TouchableOpacity>
          )}

          {!eventoConcluido ? (
            <TouchableOpacity onPress={tentarConcluirEvento} style={styles.btnConcluir}>
              <Text style={[styles.editPrimaryText, {color: '#FFF'}]}>Concluir Evento</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setModalReabrirVisivel(true)} style={[styles.editPrimaryButton, { backgroundColor: '#EAF3F7', marginTop: 15 }]}>
              <Feather name="rotate-ccw" size={16} color="#2F80A8" style={{ marginRight: 8 }} />
              <Text style={[styles.editPrimaryText, {color: '#2F80A8'}]}>Reabrir Evento</Text>
            </TouchableOpacity>
          )}
        </>)}

        {abaAtiva === 'Equipe' && <>
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionTitle}>Equipe de campo</Text>
          </View>
          {!eventoConcluido && (
             <TouchableOpacity onPress={() => setModalEquipeVisivel(true)} style={styles.addTeamButton}>
               <Text style={styles.addTeamButtonText}>Adicionar profissional</Text>
             </TouchableOpacity>
          )}

          {equipe.length ? (
            <Card style={styles.card}><Card.Content>
              {secoesEquipe.map((secao) => (
                <View key={secao.chave}>
                  <View style={styles.teamStatusSectionHeading}>
                    <Text style={styles.teamStatusSectionTitle}>{secao.titulo}</Text>
                    <View style={styles.teamStatusSectionCount}>
                      <Text style={styles.teamStatusSectionCountText}>{secao.membros.length}</Text>
                    </View>
                  </View>
                  {secao.membros.map((pessoa, index) => (
                    <View key={pessoa.id || index} style={styles.personRow}>
                      <View style={styles.personIcon}><MaterialCommunityIcons name="account-outline" size={24} color={CORES.textNavy} /></View>
                      <View style={styles.personInfo}>
                        <Text style={{ fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 16, fontWeight: '700' }} numberOfLines={1}>{pessoa.nomeProfissional}</Text>
                        <Text style={[styles.personMeta, { marginTop: 2, fontSize: 13, color: '#334155' }]} numberOfLines={1}>{pessoa.funcao}</Text>

                        {pessoa.statusConfirmacao !== 'Informativo' && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                            <Text style={[styles.personMeta, { marginTop: 0, fontSize: 12 }]}>Situação do convite: </Text>
                            <Text style={[
                              pessoa.statusConfirmacao === 'Confirmado' ? styles.confirmedText :
                                pessoa.statusConfirmacao === 'Cancelado' ? { color: '#EF4444', fontWeight: 'bold' } :
                                  pessoa.statusConfirmacao === 'Recusado' ? styles.rejectedText :
                                    styles.pendingText
                            ]}>
                              {pessoa.statusConfirmacao}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.personExpenseTotal}>
                          Total de despesas: {formatarMonetario((pessoa.despesas || []).reduce((total, despesa) => total + converterValorMonetario(despesa.valor), 0))}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.expenseIconButton}
                        onPress={() => abrirDespesasProfissional(pessoa)}
                        accessibilityRole="button"
                        accessibilityLabel={`Gerenciar despesas de ${pessoa.nomeProfissional}`}
                      >
                        <Feather name="dollar-sign" size={18} color="#059669" />
                      </TouchableOpacity>
                      {!eventoConcluido && (
                        <View style={styles.actionIconsRow}>
                          <TouchableOpacity style={styles.iconBtn} onPress={() => { setProfissionalAlvo(pessoa); abrirSelecao('editarProfissional'); }}>
                            <MaterialCommunityIcons name="pencil-outline" size={20} color={CORES.textNavy} />
                          </TouchableOpacity>
                          {pessoa.statusConfirmacao === 'Recusado' && (
                            <TouchableOpacity style={styles.iconBtn} onPress={() => clickReenviar(pessoa.idConvite)}>
                              <MaterialCommunityIcons name="refresh" size={20} color={CORES.buttonGold} />
                            </TouchableOpacity>
                          )}
                          {pessoa.statusConfirmacao !== 'Cancelado' && (
                            <TouchableOpacity style={styles.iconBtnRed} onPress={() => abrirModalExcluir(pessoa)}>
                              <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </Card.Content></Card>
          ) : <Text style={styles.sectionHint}>Nenhum profissional adicionado.</Text>}

          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.expenseSummaryTitle}>Despesas pagas por categoria</Text>
              {categoriasDespesas.length ? categoriasDespesas.map(([categoria, valor]) => (
                <View key={categoria} style={styles.expenseSummaryRow}>
                  <Text style={styles.expenseSummaryLabel}>{categoria}</Text>
                  <Text style={styles.expenseSummaryValue}>{formatarMonetario(valor)}</Text>
                </View>
              )) : <Text style={styles.sectionHint}>Ainda não há despesas registradas para este evento.</Text>}
              <View style={[styles.expenseSummaryRow, styles.expenseSummaryTotal]}>
                <Text style={styles.expenseSummaryTotalLabel}>Total de despesas</Text>
                <Text style={styles.expenseSummaryTotalValue}>{formatarMonetario(totalDespesasEquipe)}</Text>
              </View>
            </Card.Content>
          </Card>
        </>}

        {abaAtiva === 'Financeiro' && (editando === 'financeiro' ? <>
          <Text style={styles.sectionTitle}>Editar financeiro</Text>
          <Card style={styles.card}><Card.Content>
            <View style={styles.editSectionBlock}>
              <Text style={styles.editSectionTitle}>Condições de pagamento</Text>
              <Text style={styles.editSectionHint}>Defina o valor contratado e como ele será pago.</Text>
              <CampoEdicao icone="dollar-sign" label="Valor total do evento" valor={formulario.valorTotal} erro={errosEdicao.valorTotal} aoMudar={(valor) => atualizarCampo('valorTotal', formatarMoedaInput(valor))} placeholder="R$ 0,00" teclado="decimal-pad" alinharTextoAoMeio />
              <CampoSelecaoDetalhes label="Método de pagamento" campo="metodoPagamento" valor={formulario.metodoPagamento} placeholder="Selecionar pagamento" icone="credit-card" aoClicar={abrirSelecao} />
              <CampoSelecaoDetalhes
                label="Quantidade de parcelas (Até 12x)"
                campo="qtdParcelas"
                valor={OPCOES_QTD_PARCELAS.find((opcao) => opcao.id === String(formulario.qtdParcelas))?.nome || ''}
                placeholder="Selecionar quantidade"
                icone="layers"
                aoClicar={abrirSelecao}
              />
              <CampoEdicao icone="align-left" label="Observação do total do evento" valor={formulario.observacaoFinanceiro} aoMudar={(valor) => atualizarCampo('observacaoFinanceiro', valor)} placeholder="Anotações extras..." multiline={true} />
            </View>

            <View style={styles.editSectionBlock}>
              <View style={styles.editSectionHeading}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.editSectionTitle}>Parcelas</Text>
                  <Text style={styles.editSectionHint}>Acompanhe valores, vencimentos e situação de cada parcela.</Text>
                </View>
                <Text style={styles.editCountBadgeText}>{(formulario.parcelasDetalhadas || []).length}</Text>
              </View>
              <View style={[styles.parcelasTotalSummary, parcelasDivergentes && styles.parcelasTotalSummaryError]}>
                <View>
                  <Text style={styles.parcelasTotalLabel}>Soma das parcelas</Text>
                  <Text style={styles.parcelasTotalValue}>{formatarMonetario(somaParcelasEditando)}</Text>
                </View>
                <Feather name={parcelasDivergentes ? 'alert-circle' : 'check-circle'} size={20} color={parcelasDivergentes ? '#B42318' : '#15803D'} />
                <View style={styles.parcelasTotalTarget}>
                  <Text style={styles.parcelasTotalLabel}>Total do evento</Text>
                  <Text style={styles.parcelasTotalValue}>{formatarMonetario(totalEditando)}</Text>
                </View>
              </View>
              <ErroCampo>{errosEdicao.somaParcelas}</ErroCampo>
              {parcelasDivergentes && !errosEdicao.somaParcelas && (
                <Text style={styles.parcelasMismatchHint}>A soma das parcelas deve corresponder ao valor total do evento.</Text>
              )}
            </View>

            {(formulario.parcelasDetalhadas || []).map((parc, i) => (
              <View key={i} style={styles.editInstallmentCard}>
                  <View style={styles.editInstallmentHeader}>
                    <View>
                      <Text style={styles.editInstallmentTitle}>Parcela {i + 1}</Text>
                      <Text style={styles.editInstallmentDue}>Vencimento: {parc.vencimento || 'Não definido'}</Text>
                    </View>
                    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Marcar parcela ${i + 1} como ${parc.status === 'paga' ? 'pendente' : 'paga'}`} onPress={() => alternarStatusParcela(i)} style={[styles.installmentStatus, parc.status === 'paga' ? styles.installmentStatusPaid : styles.installmentStatusPending]}>
                      <Text style={[styles.installmentStatusText, parc.status === 'paga' ? styles.installmentStatusPaidText : styles.installmentStatusPendingText]}>{parc.status === 'paga' ? 'Paga' : 'Pendente'}</Text>
                    </TouchableOpacity>
                  </View>
                  <CampoEdicao label="Valor da parcela" valor={parc.valor} aoMudar={(v) => atualizarValorParcela(i, v)} placeholder="R$ 0,00" teclado="decimal-pad" alinharTextoAoMeio />
                  <View style={{ marginBottom: 15 }}>
                    <Text style={styles.editLabel}>Vencimento</Text>
                    <CampoDataHora
                      modo="date"
                      valor={parc.vencimento || ''}
                      aoMudar={(valor) => atualizarParcela(i, 'vencimento', valor)}
                    />
                    <ErroCampo>{errosEdicao[`parcela_${i}_vencimento`]}</ErroCampo>
                  </View>
                  <CampoEdicao label="Observações" valor={parc.observacao} aoMudar={(v) => atualizarParcela(i, 'observacao', v)} placeholder="Ex: Assinatura do contrato" />
              </View>
            ))}
          </Card.Content></Card>
        </> : <>
          <Text style={styles.sectionTitle}>Resumo Financeiro</Text>
          <Card style={styles.card}>
            <Card.Content>
               <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                 <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#EAF3F7', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                   <Feather name="dollar-sign" size={20} color={CORES.textNavy} />
                 </View>
                 <View>
                   <Text style={{ fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 12 }}>Valor Total</Text>
                   <Text style={{ fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 18 }}>{financeiro.valorTotal || 'Não informado'}</Text>
                 </View>
               </View>

               <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                 <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#EAF3F7', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                   <Feather name="credit-card" size={20} color={CORES.textNavy} />
                 </View>
                 <View>
                   <Text style={{ fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 12 }}>Método de Pagamento</Text>
                   <Text style={{ fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 15 }}>{financeiro.metodoPagamento || 'Não informado'}</Text>
                 </View>
               </View>

               {!!financeiro.observacaoFinanceiro && (
                 <View style={{ marginBottom: 16, padding: 12, backgroundColor: '#FFFBEB', borderRadius: 8, borderWidth: 1, borderColor: '#FDE68A' }}>
                    <Text style={{ fontFamily: FONTES.bold, color: '#92400E', fontSize: 12 }}>Observação Financeira:</Text>
                    <Text style={{ fontFamily: FONTES.body, color: '#92400E', fontSize: 13, marginTop: 4 }}>{financeiro.observacaoFinanceiro}</Text>
                 </View>
               )}
               
               {financeiro.parcelasDetalhadas && financeiro.parcelasDetalhadas.length > 0 && (
                 <View style={{marginTop: 10}}>
                    <Text style={{ fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 15, marginBottom: 10 }}>Parcelas</Text>
                    {financeiro.parcelasDetalhadas.map((parc, index) => (
                       <TouchableOpacity key={index} onPress={() => abrirEdicaoRapidaParcela(parc, index)} style={styles.quickParcelRow} accessibilityRole="button" accessibilityLabel={`Atualizar parcela ${index + 1}, atualmente ${parc.status === 'paga' ? 'paga' : 'pendente'}`}>
                          <View>
                            <Text style={{ fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 14 }}>Parcela {index + 1}: {parc.valor || 'R$ 0,00'}</Text>
                            <Text style={{ fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 12, marginTop: 4 }}>
                              Vencimento: {parc.vencimento || 'Não informado'}
                            </Text>
                            {!!parc.observacao && <Text style={{ fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 13, marginTop: 4 }}>{parc.observacao}</Text>}
                          </View>
                          <View style={{backgroundColor: parc.status === 'paga' ? '#E6F8F0' : '#FFF7E6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8}}>
                             <Text style={{color: parc.status === 'paga' ? '#059669' : '#D97706', fontWeight: 'bold', fontSize: 11}}>{parc.status === 'paga' ? 'Paga' : 'Pendente'}</Text>
                          </View>
                       </TouchableOpacity>
                    ))}
                 </View>
               )}
            </Card.Content>
          </Card>
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.expenseSummaryTitle}>Despesas da equipe</Text>
              <Text style={styles.financeExpenseFormula}>Valor total do evento: {formatarMonetario(financeiro.valorTotal)}</Text>
              {categoriasDespesas.length ? categoriasDespesas.map(([categoria, valor]) => (
                <View key={categoria} style={styles.expenseSummaryRow}>
                  <Text style={styles.expenseSummaryLabel}>Despesas com "{categoria}"</Text>
                  <Text style={styles.expenseSummaryValue}>{formatarMonetario(valor)}</Text>
                </View>
              )) : <Text style={styles.sectionHint}>Ainda não há despesas registradas para este evento.</Text>}
              <View style={[styles.expenseSummaryRow, styles.expenseSummaryTotal]}>
                <Text style={styles.expenseSummaryTotalLabel}>Total de despesas dos profissionais</Text>
                <Text style={styles.expenseSummaryTotalValue}>{formatarMonetario(totalDespesasEquipe)}</Text>
              </View>
              <View style={[styles.expenseSummaryRow, styles.expenseNetRow]}>
                <Text style={styles.expenseNetLabel}>Valor Líquido</Text>
                <Text style={styles.expenseNetValue}>{formatarMonetario(valorLiquidoEvento)}</Text>
              </View>
            </Card.Content>
          </Card>
          {!eventoConcluido && (
            <TouchableOpacity onPress={() => setEditando('financeiro')} style={styles.editPrimaryButton}>
              <Text style={styles.editPrimaryText}>Editar Financeiro</Text>
            </TouchableOpacity>
          )}
        </>)}

      </ScrollView>

      {!!editando && (
        <View style={styles.editActionBar}>
          <Button
            mode="outlined"
            onPress={cancelarEdicao}
            disabled={salvando}
            textColor={CORES.textNavy}
            style={styles.editCancelButton}
          >
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={salvarEdicao}
            loading={salvando}
            disabled={salvando}
            buttonColor={CORES.buttonGold}
            textColor={CORES.textNavy}
            style={styles.editSaveButton}
          >
            Salvar alterações
          </Button>
        </View>
      )}

      <Modal visible={modalDespesasVisivel} transparent animationType="fade" onRequestClose={() => setModalDespesasVisivel(false)}>
        <View style={styles.quickModalOverlay}>
          <View style={styles.expenseModalCard}>
            <ScrollView style={styles.quickModalScroll} contentContainerStyle={styles.quickModalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.quickModalHeader}>
              <Text style={styles.quickModalTitle}>
                {mostrarSeletorDespesa ? 'Selecionar tipo de despesa' : `Despesas de ${profissionalDespesas?.nomeProfissional || 'profissional'}`}
              </Text>
              <TouchableOpacity
                style={styles.quickModalClose}
                onPress={() => mostrarSeletorDespesa ? setMostrarSeletorDespesa(false) : setModalDespesasVisivel(false)}
              >
                <MaterialCommunityIcons name="close" size={21} color={CORES.textMuted} />
              </TouchableOpacity>
            </View>
            {mostrarSeletorDespesa ? (
              <>
                <View style={styles.expenseTypeSearch}>
                  <Feather name="search" size={17} color={CORES.textMuted} />
                  <SeparadorCampoIcone />
                  <TextInput
                    value={buscaTipoDespesa}
                    onChangeText={setBuscaTipoDespesa}
                    placeholder="Buscar tipo de despesa"
                    placeholderTextColor={CORES.textMuted}
                    autoFocus
                    style={styles.expenseTypeSearchInput}
                  />
                </View>
                {carregandoOpcoes ? (
                  <ActivityIndicator size="large" color={CORES.buttonGold} style={{ marginVertical: 24 }} />
                ) : opcoesSelecao.filter((item) => item.nome?.toLocaleLowerCase('pt-BR').includes(buscaTipoDespesa.trim().toLocaleLowerCase('pt-BR'))).length ? (
                  opcoesSelecao
                    .filter((item) => item.nome?.toLocaleLowerCase('pt-BR').includes(buscaTipoDespesa.trim().toLocaleLowerCase('pt-BR')))
                    .map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.expenseTypeOption}
                        onPress={() => {
                          setTipoDespesa(item.nome || '');
                          setIdTipoDespesa(item.id || '');
                          setMostrarSeletorDespesa(false);
                        }}
                      >
                        <Text style={styles.expenseTypeOptionText}>{item.nome}</Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={CORES.textMuted} />
                      </TouchableOpacity>
                    ))
                ) : (
                  <Text style={styles.quickModalHint}>Nenhum tipo de despesa encontrado. Cadastre tipos na tela Administrando.</Text>
                )}
              </>
            ) : (
              <>
                {(profissionalDespesas?.despesas || []).map((despesa, index) => (
                  <View key={despesa.id || index} style={styles.expenseItem}>
                    <View style={styles.expenseItemInfo}>
                      <Text style={styles.expenseItemName}>{despesa.tipo}</Text>
                      <Text style={styles.expenseItemValue}>{despesa.valor}</Text>
                    </View>
                    <View style={styles.expenseItemActions}>
                      <TouchableOpacity style={styles.iconBtn} onPress={() => editarDespesaProfissional(despesa)} accessibilityRole="button" accessibilityLabel={`Editar despesa ${despesa.tipo}`}>
                        <MaterialCommunityIcons name="pencil-outline" size={18} color={CORES.textNavy} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.iconBtnRed} onPress={() => excluirDespesaProfissional(despesa)} disabled={salvandoAcaoRapida} accessibilityRole="button" accessibilityLabel={`Excluir despesa ${despesa.tipo}`}>
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                {!profissionalDespesas?.despesas?.length && profissionalDespesas?.statusConfirmacao !== 'Cancelado' && (
                  <Text style={styles.quickModalHint}>Ainda não há despesas registradas para este profissional.</Text>
                )}
                {profissionalDespesas?.statusConfirmacao === 'Cancelado' && (
                  <Text style={styles.quickModalHint}>O convite foi cancelado. Não é possível adicionar novas despesas.</Text>
                )}
                {convitePendente(profissionalDespesas?.statusConfirmacao) && !idDespesaEditando && (
                  <Text style={styles.quickModalHint}>
                    Confirme o convite antes de adicionar despesas para este profissional.
                  </Text>
                )}
                {!!idDespesaExcluindo && (
                  <View style={styles.expenseDeleteConfirmation}>
                    <Text style={styles.quickModalHint}>Confirmar exclusão desta despesa?</Text>
                    <View style={styles.quickModalActions}>
                      <Button mode="text" onPress={() => setIdDespesaExcluindo(null)} disabled={salvandoAcaoRapida} textColor={CORES.textMuted}>Cancelar</Button>
                      <Button mode="contained" onPress={confirmarExclusaoDespesa} loading={salvandoAcaoRapida} disabled={salvandoAcaoRapida} buttonColor="#EF4444" textColor="#FFFFFF">Excluir</Button>
                    </View>
                  </View>
                )}
                {(!convitePendente(profissionalDespesas?.statusConfirmacao) || idDespesaEditando) && (
                  <>
                    <CampoSelecaoDetalhes label="Tipo da despesa" campo="tipoDespesa" valor={tipoDespesa} placeholder="Selecione o tipo de despesa" icone="tag" aoClicar={abrirSelecao} />
                    <CampoEdicao label="Valor" valor={valorDespesa} aoMudar={(valor) => setValorDespesa(formatarMoedaInput(valor))} placeholder="R$ 0,00" teclado="numeric" />
                  </>
                )}
                <Button
                  mode="contained"
                  onPress={salvarDespesaProfissional}
                  loading={salvandoAcaoRapida}
                  disabled={
                    salvandoAcaoRapida ||
                    (convitePendente(profissionalDespesas?.statusConfirmacao) && !idDespesaEditando) ||
                    (profissionalDespesas?.statusConfirmacao === 'Cancelado' && !idDespesaEditando)
                  }
                  buttonColor={CORES.buttonGold}
                  textColor={CORES.textNavy}
                  style={styles.quickModalAction}
                >
                  {idDespesaEditando
                    ? 'Salvar alterações'
                    : convitePendente(profissionalDespesas?.statusConfirmacao)
                      ? 'Convite pendente'
                      : profissionalDespesas?.statusConfirmacao === 'Cancelado'
                        ? 'Convite cancelado'
                        : 'Adicionar despesa'}
                </Button>
                {!!idDespesaEditando && (
                  <Button
                    mode="text"
                    onPress={() => { setIdDespesaEditando(null); setTipoDespesa(''); setIdTipoDespesa(''); setValorDespesa(''); }}
                    disabled={salvandoAcaoRapida}
                    textColor={CORES.textMuted}
                  >
                    Cancelar edição
                  </Button>
                )}
              </>
            )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={!!parcelaRapida} transparent animationType="fade" onRequestClose={() => setParcelaRapida(null)}>
        <View style={styles.quickModalOverlay}>
          <View style={styles.quickModalCard}>
            <View style={styles.quickModalHeader}>
              <Text style={styles.quickModalTitle}>Atualizar parcela {parcelaRapida ? parcelaRapida.index + 1 : ''}</Text>
              <TouchableOpacity style={styles.quickModalClose} onPress={() => setParcelaRapida(null)}>
                <MaterialCommunityIcons name="close" size={21} color={CORES.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.quickModalHint}>Confirme o novo status e atualize a observação da parcela.</Text>
            <Text style={styles.editLabel}>Status</Text>
            <TouchableOpacity
              onPress={() => setParcelaRapida((atual) => ({ ...atual, status: atual.status === 'paga' ? 'pendente' : 'paga' }))}
              style={[styles.quickStatusButton, parcelaRapida?.status === 'paga' && styles.quickStatusPaid]}
            >
              <Text style={[styles.quickStatusText, parcelaRapida?.status === 'paga' && styles.quickStatusPaidText]}>
                {parcelaRapida?.status === 'paga' ? 'Paga · toque para marcar pendente' : 'Pendente · toque para marcar paga'}
              </Text>
            </TouchableOpacity>
            <CampoEdicao
              label="Vencimento"
              valor={parcelaRapida?.vencimento || ''}
              aoMudar={(vencimento) => setParcelaRapida((atual) => ({ ...atual, vencimento: formatarDataParcelaInput(vencimento) }))}
              placeholder="DD/MM/AAAA"
              teclado="numeric"
            />
            <CampoEdicao label="Observação da parcela" valor={parcelaRapida?.observacao || ''} aoMudar={(observacao) => setParcelaRapida((atual) => ({ ...atual, observacao }))} placeholder="Ex.: Pagamento recebido via Pix" multiline />
            <View style={styles.quickModalActions}>
              <Button mode="outlined" onPress={() => setParcelaRapida(null)} textColor={CORES.textNavy} disabled={salvandoAcaoRapida}>Cancelar</Button>
              <Button mode="contained" onPress={salvarEdicaoRapidaParcela} loading={salvandoAcaoRapida} disabled={salvandoAcaoRapida} buttonColor={CORES.buttonGold} textColor={CORES.textNavy}>Confirmar</Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAIS CUSTOMIZADOS DE AÇÕES */}
      <Modal visible={modalConcluirVisivel} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center' }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#E6F8F0', justifyContent: 'center', alignItems: 'center', marginBottom: 15 }}>
              <Feather name="check-circle" size={30} color="#10B981" />
            </View>
            <Text style={{ fontFamily: FONTES.bold, fontSize: 18, color: CORES.textNavy, marginBottom: 8, textAlign: 'center' }}>Concluir Evento?</Text>
            <Text style={{ fontFamily: FONTES.body, fontSize: 14, color: CORES.textMuted, textAlign: 'center', marginBottom: 20 }}>
              Após concluir, o evento não poderá mais ser editado.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <Button mode="outlined" style={{ flex: 1, borderRadius: 10 }} textColor={CORES.textNavy} onPress={() => setModalConcluirVisivel(false)} disabled={carregando}>Cancelar</Button>
              <Button mode="contained" style={{ flex: 1, borderRadius: 10 }} buttonColor="#10B981" textColor="#FFF" onPress={confirmarConclusao} loading={carregando}>Sim, concluir</Button>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalReabrirVisivel} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center' }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#EAF3F7', justifyContent: 'center', alignItems: 'center', marginBottom: 15 }}>
              <Feather name="rotate-ccw" size={30} color="#2F80A8" />
            </View>
            <Text style={{ fontFamily: FONTES.bold, fontSize: 18, color: CORES.textNavy, marginBottom: 8, textAlign: 'center' }}>Reabrir Evento?</Text>
            <Text style={{ fontFamily: FONTES.body, fontSize: 14, color: CORES.textMuted, textAlign: 'center', marginBottom: 20 }}>
              O evento voltará para a aba de futuros e poderá ser editado novamente.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <Button mode="outlined" style={{ flex: 1, borderRadius: 10 }} textColor={CORES.textNavy} onPress={() => setModalReabrirVisivel(false)} disabled={carregando}>Cancelar</Button>
              <Button mode="contained" style={{ flex: 1, borderRadius: 10 }} buttonColor="#2F80A8" textColor="#FFF" onPress={confirmarReabertura} loading={carregando}>Sim, reabrir</Button>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalExcluirVisivel} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center' }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 15 }}>
              <Feather name="trash-2" size={30} color="#EF4444" />
            </View>
            <Text style={{ fontFamily: FONTES.bold, fontSize: 18, color: CORES.textNavy, marginBottom: 8, textAlign: 'center' }}>Remover Técnico?</Text>
            <Text style={{ fontFamily: FONTES.body, fontSize: 14, color: CORES.textMuted, textAlign: 'center', marginBottom: 20 }}>
              Deseja realmente remover <Text style={{fontWeight: 'bold'}}>{profissionalAlvo?.nomeProfissional}</Text> deste evento?
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <Button mode="outlined" style={{ flex: 1, borderRadius: 10 }} textColor={CORES.textNavy} onPress={() => setModalExcluirVisivel(false)}>Cancelar</Button>
              <Button mode="contained" style={{ flex: 1, borderRadius: 10 }} buttonColor="#EF4444" textColor="#FFF" onPress={confirmarExclusaoTecnico}>Sim, remover</Button>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalSucessoVisivel} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center' }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#E6F8F0', justifyContent: 'center', alignItems: 'center', marginBottom: 15 }}>
              <Feather name="check" size={32} color="#10B981" />
            </View>
            <Text style={{ fontFamily: FONTES.bold, fontSize: 18, color: CORES.textNavy, marginBottom: 8, textAlign: 'center' }}>{msgSucesso.titulo}</Text>
            <Text style={{ fontFamily: FONTES.body, fontSize: 14, color: CORES.textMuted, textAlign: 'center', marginBottom: 20 }}>{msgSucesso.descricao}</Text>
            <Button mode="contained" style={{ width: '100%', borderRadius: 10 }} buttonColor={CORES.buttonGold} textColor={CORES.textNavy} onPress={() => setModalSucessoVisivel(false)}>Ok, entendi</Button>
          </View>
        </View>
      </Modal>


      <Modal visible={modalErroVisivel} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center' }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 15 }}>
              <Feather name="alert-triangle" size={32} color="#EF4444" />
            </View>
            <Text style={{ fontFamily: FONTES.bold, fontSize: 18, color: CORES.textNavy, marginBottom: 8, textAlign: 'center' }}>
              Atenção
            </Text>
            <Text style={{ fontFamily: FONTES.body, fontSize: 14, color: CORES.textMuted, textAlign: 'center', marginBottom: 20 }}>
              {msgErro}
            </Text>
            <Button mode="contained" style={{ width: '100%', borderRadius: 10 }} buttonColor="#EF4444" textColor="#FFF" onPress={() => setModalErroVisivel(false)}>
              Ok, entendi
            </Button>
          </View>
        </View>
      </Modal>

      <Modal visible={modalLocalVisivel} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
           <ScrollView style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 20, maxHeight: '90%' }}>
              <Text style={{ fontFamily: FONTES.bold, fontSize: 18, color: CORES.textNavy, marginBottom: 15 }}>Cadastrar Novo Local</Text>
              <CampoEdicao label="Nome do Local *" valor={formNovoLocal.nome} aoMudar={v => setFormNovoLocal({...formNovoLocal, nome: v})} placeholder="Ex: Sítio Romagna" />
              <CampoEdicao label="Rua / Endereço *" valor={formNovoLocal.rua} aoMudar={v => setFormNovoLocal({...formNovoLocal, rua: v})} placeholder="Rua..." />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}><CampoEdicao label="Número" valor={formNovoLocal.numero} aoMudar={v => setFormNovoLocal({...formNovoLocal, numero: v})} placeholder="123" /></View>
                <View style={{ flex: 2 }}><CampoEdicao label="Bairro" valor={formNovoLocal.bairro} aoMudar={v => setFormNovoLocal({...formNovoLocal, bairro: v})} placeholder="Centro" /></View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 2 }}><CampoEdicao label="Cidade" valor={formNovoLocal.cidade} aoMudar={v => setFormNovoLocal({...formNovoLocal, cidade: v})} placeholder="Cidade" /></View>
                <View style={{ flex: 1 }}><CampoEdicao label="Estado" valor={formNovoLocal.estado} aoMudar={v => setFormNovoLocal({...formNovoLocal, estado: v})} placeholder="SP" /></View>
              </View>
              
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 15, marginBottom: 30 }}>
                 <Button mode="outlined" style={{ flex: 1, borderRadius: 10 }} onPress={() => setModalLocalVisivel(false)} textColor={CORES.textNavy} disabled={carregandoOpcoes}>Cancelar</Button>
                 <Button mode="contained" style={{ flex: 1, borderRadius: 10 }} buttonColor={CORES.buttonGold} textColor={CORES.textNavy} onPress={salvarNovoLocalDetalhado} loading={carregandoOpcoes}>Salvar</Button>
              </View>
           </ScrollView>
        </View>
      </Modal>

      <Modal visible={modalClienteVisivel} transparent animationType="fade">
        <View style={styles.clientModalOverlay}>
           <ScrollView
             style={styles.clientModalCard}
             contentContainerStyle={styles.clientModalContent}
             keyboardShouldPersistTaps="handled"
           >
              <Text style={{ fontFamily: FONTES.bold, fontSize: 18, color: CORES.textNavy, marginBottom: 15 }}>Cadastrar Novo Cliente</Text>
              <CampoEdicao compacto label="Nome completo *" valor={formNovoCliente.nome} aoMudar={v => setFormNovoCliente({...formNovoCliente, nome: v})} placeholder="Ex.: Ana Costa" />
              <CampoEdicao compacto label="CPF ou CNPJ *" valor={formNovoCliente.documento} aoMudar={v => setFormNovoCliente({...formNovoCliente, documento: formatarCpfCnpj(v)})} placeholder="000.000.000-00" teclado="numeric" />
              <CampoEdicao compacto label="Telefone (opcional)" valor={formNovoCliente.telefone} aoMudar={v => setFormNovoCliente({...formNovoCliente, telefone: formatarTelefone(v)})} placeholder="(00) 00000-0000" teclado="phone-pad" />
              <CampoEdicao compacto label="Instagram (opcional)" valor={formNovoCliente.instagram} aoMudar={v => setFormNovoCliente({...formNovoCliente, instagram: v})} placeholder="@perfil" />
              
              <View style={styles.clientModalActions}>
                 <Button mode="outlined" style={{ flex: 1, borderRadius: 10 }} onPress={() => setModalClienteVisivel(false)} textColor={CORES.textNavy} disabled={carregandoOpcoes}>Cancelar</Button>
                 <Button mode="contained" style={{ flex: 1, borderRadius: 10 }} buttonColor={CORES.buttonGold} textColor={CORES.textNavy} onPress={salvarNovoClienteDetalhado} loading={carregandoOpcoes}>Salvar</Button>
              </View>
           </ScrollView>
        </View>
      </Modal>

      <ModalSelecao 
         visible={selecaoVisivel}
         onClose={() => setSelecaoVisivel(false)}
         titulo={tituloSelecaoUI}
         opcoes={opcoesSelecao}
         carregando={carregandoOpcoes}
         onSelecionar={escolherOpcao}
         onAdicionarNovo={tipoSelecao === 'metodoPagamento' || tipoSelecao === 'qtdParcelas' || tipoSelecao === 'tipoDespesa' ? null : salvarNovoItemNaSelecao}
      />

      <ModalAdicionarProfissional
        visible={modalEquipeVisivel}
        empresaId={usuario?.idEmpresa || evento?.id_empresa}
        dataEvento={evento.dataInicio}
        equipeAtual={equipe}
        onClose={() => setModalEquipeVisivel(false)}
        onAdd={async (p) => {
          // 1. Salva o profissional na equipe do evento no Firestore
          await repositorioEventos.adicionarProfissionaisEvento(idEvento, [p]);

          // 2. Se for um convite real, dispara a notificação de Novo Evento e checa a regra de 7 e 3 dias
          if (p.enviarConvite) {
            await notificarNovoEventoParaTecnico({
              idUsuario: p.idUsuario || p.id,
              idEvento: idEvento,
              nomeEvento: evento.nome || evento.titulo,
              dataEvento: evento.dataInicio,
              funcao: p.funcao,
            });
          }

          // 3. Atualiza a tela, fecha o modal e mostra mensagem de confirmação
          carregarEvento();
          setModalEquipeVisivel(false);
          mostrarSucesso(
            'Profissional adicionado',
            p.enviarConvite ? 'Convite enviado com sucesso!' : 'Profissional adicionado à equipe.'
          );
        }}
      />
      </View>
  );
}