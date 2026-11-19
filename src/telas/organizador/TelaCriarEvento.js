
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { CORES, FONTES } from '../../tema/cores';
import { styles } from '../../estilos/estilosCriarEventoOrganizador';
import { repositorioEventos } from '../../servicos/repositorioEventos';
import ModalAdicionarProfissional from '../../componentes/ModalAdicionarProfissional';
import ModalSelecao from '../../componentes/ModalSelecao';
import SeparadorCampoIcone from '../../compartilhado/SeparadorCampoIcone';

const SECOES = ['Geral', 'Equipe', 'Financeiro'];

export const OPCOES_PAGAMENTO = [
  { id: 'Pix', nome: 'Pix' },
  { id: 'Dinheiro', nome: 'Dinheiro' },
  { id: 'Cartão de Crédito', nome: 'Cartão de Crédito' },
  { id: 'Cartão de Débito', nome: 'Cartão de Débito' },
  { id: 'Boleto', nome: 'Boleto' },
];

export const OPCOES_QTD_PARCELAS = [
  { id: '0', nome: 'Sem parcelas' },
  ...Array.from({ length: 12 }, (_, indice) => {
    const quantidade = indice + 1;
    return { id: String(quantidade), nome: quantidade === 1 ? '1 parcela' : `${quantidade} parcelas` };
  }),
];

const DateTimePickerNativo = Platform.OS === 'web' ? null : require('@react-native-community/datetimepicker').default;

export const formatarCpfCnpj = (valor) => {
  const v = String(valor).replace(/\D/g, '');
  if (v.length <= 11) {
    return v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    return v.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
}

export const formatarTelefone = (valor) => {
  const texto = String(valor || '');
  let digitos = texto.replace(/\D/g, '');
  if (/^\s*\+55/.test(texto) || (digitos.startsWith('55') && digitos.length >= 12)) digitos = digitos.slice(2);
  digitos = digitos.slice(0, 11);
  if (!digitos) return '';
  const ddd = digitos.slice(0, 2);
  if (digitos.length <= 2) return `+55 (${ddd}`;
  const numero = digitos.slice(2);
  const tamanhoPrefixo = numero.startsWith('9') ? 5 : 4;
  const parteInicial = numero.slice(0, tamanhoPrefixo);
  const parteFinal = numero.slice(tamanhoPrefixo, tamanhoPrefixo + 4);
  return `+55 (${ddd}) ${parteInicial}${parteFinal ? `-${parteFinal}` : ''}`;
}

export const formatarMoedaInput = (valor) => {
  if (!valor) return '';
  const numeros = valor.replace(/\D/g, '');
  if (!numeros) return '';
  const valorMonetario = (Number(numeros) / 100).toFixed(2);
  return 'R$ ' + valorMonetario.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export const formatarDataParcelaInput = (valor) => {
  const digitos = String(valor || '').replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
};

const dataParcelaValida = (valor) => {
  const correspondencia = String(valor || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!correspondencia) return false;
  const [, diaTexto, mesTexto, anoTexto] = correspondencia;
  const data = new Date(Number(anoTexto), Number(mesTexto) - 1, Number(diaTexto));
  return data.getFullYear() === Number(anoTexto) &&
    data.getMonth() === Number(mesTexto) - 1 &&
    data.getDate() === Number(diaTexto);
};

const converterValorMonetario = (valor) => {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
  const texto = String(valor || '').trim().replace(/[^\d,.-]/g, '');
  if (!texto) return 0;
  const numero = texto.includes(',')
    ? Number(texto.replace(/\./g, '').replace(',', '.'))
    : Number(texto.replace(/\D/g, '')) / 100;
  return Number.isFinite(numero) ? numero : 0;
};

function formatarData(data) {
  if (!data) return '';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

function dataParaPicker(valor, modo) {
  if (modo === 'date' && valor) return new Date(`${valor}T12:00:00`);
  if (modo === 'time' && valor) {
    const [horas, minutos] = valor.split(':').map(Number);
    const data = new Date();
    data.setHours(horas || 0, minutos || 0, 0, 0);
    return data;
  }
  return new Date();
}

function SeletorDataHora({ modo, valor, aoMudar, formatoBrasileiro = false }) {
  const [visivel, setVisivel] = useState(false);
  const valorPicker = modo === 'date' && formatoBrasileiro && valor
    ? valor.split('/').reverse().join('-')
    : valor;
  const texto = modo === 'date'
    ? (formatoBrasileiro ? valor : formatarData(valor))
    : valor;
  const icone = modo === 'date' ? 'calendar-month-outline' : 'clock-outline';

  if (Platform.OS === 'web') {
    return (
      <View style={styles.control}>
        <MaterialCommunityIcons name={icone} size={19} color={CORES.textMuted} />
        <SeparadorCampoIcone />
        {React.createElement('input', {
          type: modo,
          value: valorPicker,
          onChange: (evento) => {
            const data = evento.target.value;
            aoMudar(formatoBrasileiro && data ? data.split('-').reverse().join('/') : data);
          },
          style: { flex: 1, minWidth: 0, boxSizing: 'border-box', border: 'none', outline: 'none', backgroundColor: 'transparent', minHeight: 46, color: CORES.textNavy, fontSize: 14, fontFamily: FONTES.body },
        })}
      </View>
    );
  }
  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={modo === 'date' ? 'Selecionar data' : 'Selecionar horário'}
        onPress={() => setVisivel(true)}
        style={styles.control}
      >
        <MaterialCommunityIcons name={icone} size={19} color={CORES.textMuted} />
        <SeparadorCampoIcone />
        <Text style={[styles.datePickerText, !texto && styles.datePickerPlaceholder]}>{texto || (modo === 'date' ? 'DD/MM/AAAA' : '16:00')}</Text>
      </TouchableOpacity>
      {visivel && DateTimePickerNativo && (
        <DateTimePickerNativo
          value={dataParaPicker(valorPicker, modo)} mode={modo} display="default"
          onChange={(evento, selecionada) => {
            setVisivel(false);
            if (!selecionada || evento.type === 'dismissed') return;
            if (modo === 'date') {
              const ano = selecionada.getFullYear();
              const mes = String(selecionada.getMonth() + 1).padStart(2, '0');
              const dia = String(selecionada.getDate()).padStart(2, '0');
              aoMudar(formatoBrasileiro ? `${dia}/${mes}/${ano}` : `${ano}-${mes}-${dia}`);
            } else {
              aoMudar(`${String(selecionada.getHours()).padStart(2, '0')}:${String(selecionada.getMinutes()).padStart(2, '0')}`);
            }
          }}
        />
      )}
    </>
  );
}

const CampoInput = ({ label, valor, aoMudar, placeholder, teclado = 'default', multilinha = false, obrigatorio = false, icone, compacto = false }) => {
  const [focado, setFocado] = useState(false);

  return (
    <View style={[styles.field, compacto && styles.fieldCompact]}>
      <Text style={styles.label}>{label}{obrigatorio ? ' *' : ''}</Text>
      <View style={[styles.control, multilinha && styles.multilineControl, focado && styles.controlFocused]}>
        {icone && <Feather name={icone} size={18} color={focado ? CORES.textNavy : CORES.textMuted} />}
        {icone && <SeparadorCampoIcone />}
        <TextInput
          value={valor}
          onChangeText={aoMudar}
          onFocus={() => setFocado(true)}
          onBlur={() => setFocado(false)}
          placeholder={placeholder}
          placeholderTextColor={CORES.textSubtle}
          keyboardType={teclado}
          multiline={multilinha}
          textAlign="left"
          style={[styles.controlInput, multilinha && styles.multilineInput]}
        />
      </View>
    </View>
  );
};

const CampoSelecao = ({ label, valor, placeholder, icone, onPress }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${valor || placeholder}`}
      onPress={onPress}
      style={styles.control}
    >
      {!!icone && <MaterialCommunityIcons name={icone} size={19} color={CORES.textMuted} />}
      {!!icone && <SeparadorCampoIcone />}
      <Text style={[styles.controlValue, !valor && styles.selectionPlaceholder]} numberOfLines={1}>{valor || placeholder}</Text>
      <MaterialCommunityIcons name="chevron-down" size={20} color={CORES.textMuted} />
    </TouchableOpacity>
  </View>
);

export default function TelaCriarEvento({ navigation, usuario }) {
  const [secao, setSecao] = useState('Geral');
  const [locais, setLocais] = useState([{ idLocalTemp: 1, nomeDoLocal: '', enderecoLocal: '', tipoLocal: '', horaLocal: '', observacoesLocal: '' }]);
  const [localExpandidoId, setLocalExpandidoId] = useState(1);
  const [formulario, setFormulario] = useState({
     titulo: '', tipoEvento: '', cliente: '', dataInicio: '', horaInicio: '',
     numConvidados: '', notasProducao: '', valorTotal: '', metodoPagamento: '', qtdParcelas: '', observacaoFinanceiro: '' 
   });
  const [parcelas, setParcelas] = useState([]);
  const [equipe, setEquipe] = useState([]);
  
  const [modalEquipeVisivel, setModalEquipeVisivel] = useState(false);
  const [modalDespesasVisivel, setModalDespesasVisivel] = useState(false);
  const [profissionalDespesas, setProfissionalDespesas] = useState(null);
  const [mostrarSeletorDespesa, setMostrarSeletorDespesa] = useState(false);
  const [opcoesTiposDespesa, setOpcoesTiposDespesa] = useState([]);
  const [carregandoTiposDespesa, setCarregandoTiposDespesa] = useState(false);
  const [buscaTipoDespesa, setBuscaTipoDespesa] = useState('');
  const [tipoDespesa, setTipoDespesa] = useState('');
  const [idTipoDespesa, setIdTipoDespesa] = useState('');
  const [valorDespesa, setValorDespesa] = useState('');
  const [idDespesaEditando, setIdDespesaEditando] = useState(null);
  const [idDespesaExcluindo, setIdDespesaExcluindo] = useState(null);
  const [selecaoVisivel, setSelecaoVisivel] = useState(false);
  const [tipoSelecao, setTipoSelecao] = useState('');
  const [opcoesSelecao, setOpcoesSelecao] = useState([]);
  const [carregandoOpcoes, setCarregandoOpcoes] = useState(false);
  
  const [modalLocalVisivel, setModalLocalVisivel] = useState(false);
  const [formNovoLocal, setFormNovoLocal] = useState({ nome: '', rua: '', numero: '', bairro: '', cidade: '', estado: '' });
  const [modalClienteVisivel, setModalClienteVisivel] = useState(false);
  const [formNovoCliente, setFormNovoCliente] = useState({ nome: '', documento: '', telefone: '', email: '', instagram: '' });
  const [itemEditandoSelecao, setItemEditandoSelecao] = useState(null);
  const [modalTipoEventoVisivel, setModalTipoEventoVisivel] = useState(false);
  const [formNovoTipoEvento, setFormNovoTipoEvento] = useState({ nome: '', descricao: '' });
  
  const [modalErroVisivel, setModalErroVisivel] = useState(false);
  const [msgErro, setMsgErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  
  const [posicoesSecao, setPosicoesSecao] = useState({});
  const scrollConteudo = useRef(null);
  const isAutoScrolling = useRef(false);

  const mostrarErro = (mensagem) => {
    setMsgErro(mensagem);
    setModalErroVisivel(true);
  };

  const atualizar = (campo, valor) => {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
    if (campo === 'qtdParcelas') {
       const qtd = Number(valor) || 0;
       const qtdSegura = Math.min(qtd, 12);
       setParcelas((anteriores) => {
         const novasParcelas = Array.from({ length: qtdSegura }, (_, i) => (
           anteriores[i] || { valor: '', observacao: '', status: 'pendente', vencimento: '' }
         ));
         if (qtdSegura === 1) {
           novasParcelas[0] = {
             ...novasParcelas[0],
             valor: formatarMoedaInput(String(formulario.valorTotal || '')),
           };
         }
         return novasParcelas;
       });
    } else if (campo === 'valorTotal' && Number(formulario.qtdParcelas) === 1) {
      setParcelas((anteriores) => [{
        ...(anteriores[0] || { observacao: '', status: 'pendente', vencimento: '' }),
        valor: formatarMoedaInput(String(valor || '')),
      }]);
    }
  };

  const atualizarParcela = (index, campo, valor) => {
      const arr = [...parcelas];
      arr[index][campo] = valor;
      setParcelas(arr);
  };

  const atualizarLocal = (index, campo, valor) => {
    const novosLocais = [...locais];
    novosLocais[index][campo] = valor;
    setLocais(novosLocais);
  };

  const adicionarLocal = () => {
    const novoLocal = { idLocalTemp: Date.now(), nomeDoLocal: '', enderecoLocal: '', tipoLocal: '', horaLocal: '', observacoesLocal: '' };
    setLocais((anteriores) => [...anteriores, novoLocal]);
    setLocalExpandidoId(novoLocal.idLocalTemp);
  };
  const removerLocal = (index) => {
    const locaisRestantes = locais.filter((_, i) => i !== index);
    setLocais(locaisRestantes);
    if (locais[index]?.idLocalTemp === localExpandidoId) {
      setLocalExpandidoId(locaisRestantes[0]?.idLocalTemp ?? null);
    }
  };

  const carregarOpcoesSelect = async (campoInfo) => {
    setCarregandoOpcoes(true);
    try {
      let tipoReal = campoInfo;
      if (campoInfo.startsWith('local_')) tipoReal = 'locaisSalvos';
      else if (campoInfo.startsWith('tipoLocal_')) tipoReal = 'tiposLocal';
      else if (campoInfo === 'cliente') tipoReal = 'clientes';
      else if (campoInfo === 'tipoEvento') tipoReal = 'tiposEvento';
      const opcoes = await repositorioEventos.obterOpcoesSelect(tipoReal, usuario?.idEmpresa);
      setOpcoesSelecao(opcoes);
    } catch (erro) {
      console.log(erro);
    } finally {
      setCarregandoOpcoes(false);
    }
  };

  const abrirSelecao = (campoInfo) => {
    setTipoSelecao(campoInfo);
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
    carregarOpcoesSelect(campoInfo);
  };

  const escolherOpcao = async (item) => {
    if (tipoSelecao === 'metodoPagamento') {
      atualizar('metodoPagamento', item.nome);
    } else if (tipoSelecao === 'qtdParcelas') {
      atualizar('qtdParcelas', item.id);
    } else if (tipoSelecao.startsWith('local_')) {
      const index = parseInt(tipoSelecao.split('_')[1], 10);
      const tiposLocais = await repositorioEventos.obterOpcoesSelect('tiposLocal', usuario?.idEmpresa);
      const tipoLocal = tiposLocais.find((tipo) => tipo.id === item.id_tipo_local);
      atualizarLocal(index, 'nomeDoLocal', item.nome || '');
      atualizarLocal(index, 'enderecoLocal', item.endereco_completo || '');
      if (tipoLocal?.nome) { atualizarLocal(index, 'tipoLocal', tipoLocal.nome); }
    } else if (tipoSelecao.startsWith('tipoLocal_')) {
      const index = parseInt(tipoSelecao.split('_')[1], 10);
      atualizarLocal(index, 'tipoLocal', item.nome || '');
    } else {
      atualizar(tipoSelecao, item.nome || '');
    }
    setSelecaoVisivel(false);
  };

  const editarOpcaoSelecao = (item) => {
    setItemEditandoSelecao({ tipo: tipoSelecao, item });
    setSelecaoVisivel(false);
    if (tipoSelecao === 'cliente') {
      setFormNovoCliente({
        nome: item.nome || '',
        documento: item.documento || item.cpf_cnpj || item.cpf || '',
        telefone: formatarTelefone(item.telefone || ''),
        email: item.email || '',
        instagram: item.instagram || '',
      });
      setModalClienteVisivel(true);
    } else {
      setFormNovoTipoEvento({ nome: item.nome || '', descricao: item.descricao || '' });
      setModalTipoEventoVisivel(true);
    }
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
      setItemEditandoSelecao(null);
      setFormNovoCliente({ nome: novoNome.trim(), documento: '', telefone: '', email: '', instagram: '' });
      setSelecaoVisivel(false);
      setModalClienteVisivel(true);
      return;
    }
    if (tipoSelecao === 'tipoEvento') {
      setItemEditandoSelecao(null);
      setFormNovoTipoEvento({ nome: novoNome.trim(), descricao: '' });
      setSelecaoVisivel(false);
      setModalTipoEventoVisivel(true);
      return;
    }
    setCarregandoOpcoes(true);
    try {
      let tipoReal = tipoSelecao.startsWith('tipoLocal_') ? 'tiposLocal' : tipoSelecao === 'tipoEvento' ? 'tiposEvento' : tipoSelecao;
      const novo = await repositorioEventos.adicionarNovoItemSelect(tipoReal, { nome: novoNome.trim() }, usuario?.idEmpresa);
      escolherOpcao(novo);
    } catch (error) {
      mostrarErro(error?.message || 'Não foi possível adicionar o cadastro.');
    } finally {
      setCarregandoOpcoes(false);
    }
  };

  const salvarNovoLocalDetalhado = async () => {
    if (!formNovoLocal.nome || !formNovoLocal.rua) {
      mostrarErro("Preencha pelo menos o nome e a rua do local.");
      return;
    }
    setCarregandoOpcoes(true);
    try {
      const enderecoFormatado = `${formNovoLocal.rua}, ${formNovoLocal.numero} - ${formNovoLocal.bairro}, ${formNovoLocal.cidade} - ${formNovoLocal.estado}`;
      const novo = await repositorioEventos.adicionarNovoItemSelect('locaisSalvos', { 
         nome: formNovoLocal.nome.trim(), 
         endereco_completo: enderecoFormatado,
        rua: formNovoLocal.rua,
        bairro: formNovoLocal.bairro,
        cidade: formNovoLocal.cidade,
        estado: formNovoLocal.estado
      }, usuario?.idEmpresa);
      
      setModalLocalVisivel(false);
      setFormNovoLocal({ nome: '', rua: '', numero: '', bairro: '', cidade: '', estado: '' });
      escolherOpcao(novo);
    } catch (e) {
      console.log(e);
    } finally {
      setCarregandoOpcoes(false);
    }
  };

  const salvarNovoClienteDetalhado = async () => {
    if (!formNovoCliente.nome.trim() || !formNovoCliente.documento.trim()) {
       mostrarErro('Preencha o nome e o CPF/CNPJ do cliente.');
       return;
    }
    if (formNovoCliente.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formNovoCliente.email.trim())) {
      mostrarErro('Informe um e-mail válido, como nome@dominio.com.');
      return;
    }
    const textoTelefone = formNovoCliente.telefone;
    let digitosTelefone = textoTelefone.replace(/\D/g, '');
    if (/^\s*\+55/.test(textoTelefone) || (digitosTelefone.startsWith('55') && digitosTelefone.length >= 12)) {
      digitosTelefone = digitosTelefone.slice(2);
    }
    if (digitosTelefone && digitosTelefone.length !== 10 && digitosTelefone.length !== 11) {
      mostrarErro('Informe um telefone com DDD e número completo.');
      return;
    }
    setCarregandoOpcoes(true);
    try {
      const dadosCliente = {
        nome: formNovoCliente.nome.trim(),
        documento: formNovoCliente.documento.trim(),
        telefone: formatarTelefone(formNovoCliente.telefone),
        email: formNovoCliente.email.trim(),
        instagram: formNovoCliente.instagram.trim(),
      };
      if (itemEditandoSelecao?.tipo === 'cliente') {
        await repositorioEventos.atualizarItemSelect('clientes', itemEditandoSelecao.item.id, dadosCliente, usuario?.idEmpresa || usuario?.companyId);
        if (formulario.cliente === itemEditandoSelecao.item.nome) atualizar('cliente', dadosCliente.nome);
        setModalClienteVisivel(false);
        setItemEditandoSelecao(null);
        await carregarOpcoesSelect('cliente');
        setSelecaoVisivel(true);
        return;
      }
      const novo = await repositorioEventos.adicionarNovoItemSelect('clientes', dadosCliente, usuario?.idEmpresa || usuario?.companyId);
      setModalClienteVisivel(false);
      setFormNovoCliente({ nome: '', documento: '', telefone: '', email: '', instagram: '' });
      escolherOpcao(novo);
    } catch (error) {
      mostrarErro(error?.message || 'Não foi possível salvar o cliente.');
    } finally { setCarregandoOpcoes(false); }
  };

  const salvarTipoEvento = async () => {
    if (!formNovoTipoEvento.nome.trim()) {
      mostrarErro('Informe o nome do tipo de evento.');
      return;
    }
    setCarregandoOpcoes(true);
    try {
      const dados = { nome: formNovoTipoEvento.nome.trim(), descricao: formNovoTipoEvento.descricao.trim() };
      if (itemEditandoSelecao?.tipo === 'tipoEvento') {
        await repositorioEventos.atualizarItemSelect('tiposEvento', itemEditandoSelecao.item.id, dados, usuario?.idEmpresa || usuario?.companyId);
        if (formulario.tipoEvento === itemEditandoSelecao.item.nome) atualizar('tipoEvento', dados.nome);
        setModalTipoEventoVisivel(false);
        setItemEditandoSelecao(null);
        await carregarOpcoesSelect('tipoEvento');
        setSelecaoVisivel(true);
        return;
      }
      const novo = await repositorioEventos.adicionarNovoItemSelect('tiposEvento', dados, usuario?.idEmpresa || usuario?.companyId);
      setModalTipoEventoVisivel(false);
      setFormNovoTipoEvento({ nome: '', descricao: '' });
      await escolherOpcao(novo);
    } catch (error) {
      mostrarErro(error?.message || 'Não foi possível salvar o tipo de evento.');
    } finally {
      setCarregandoOpcoes(false);
    }
  };

  const adicionarProfissional = (profissional) => {
    setEquipe((anterior) => [...anterior, profissional]);
    setModalEquipeVisivel(false);
  };

  const abrirDespesasProfissional = async (profissional) => {
    setProfissionalDespesas(profissional);
    setTipoDespesa('');
    setIdTipoDespesa('');
    setValorDespesa('');
    setIdDespesaEditando(null);
    setIdDespesaExcluindo(null);
    setMostrarSeletorDespesa(false);
    setBuscaTipoDespesa('');
    setModalDespesasVisivel(true);
    setCarregandoTiposDespesa(true);
    try {
      const opcoes = await repositorioEventos.obterOpcoesSelect('tiposDespesa', usuario?.idEmpresa || usuario?.companyId);
      setOpcoesTiposDespesa(opcoes);
    } catch (error) {
      mostrarErro(error?.message || 'Não foi possível carregar os tipos de despesa.');
    } finally {
      setCarregandoTiposDespesa(false);
    }
  };

  const atualizarDespesasLocaisProfissional = (despesas) => {
    const chaveProfissional = profissionalDespesas.idUsuario || profissionalDespesas.id;
    setEquipe((atual) => atual.map((pessoa) => (
      (pessoa.idUsuario || pessoa.id) === chaveProfissional ? { ...pessoa, despesas } : pessoa
    )));
    setProfissionalDespesas((atual) => ({ ...atual, despesas }));
  };

  const editarDespesaProfissional = (despesa) => {
    setIdDespesaEditando(despesa.id);
    setTipoDespesa(despesa.tipo || '');
    setIdTipoDespesa(despesa.id_tipo_despesa || '');
    setValorDespesa(despesa.valor || '');
  };

  const salvarDespesaProfissional = () => {
    const tipo = tipoDespesa.trim();
    if (!tipo || !idTipoDespesa || converterValorMonetario(valorDespesa) <= 0) {
      mostrarErro('Selecione o tipo da despesa e informe um valor maior que zero.');
      return;
    }
    const novaDespesa = {
      id: idDespesaEditando || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      id_tipo_despesa: idTipoDespesa,
      tipo,
      valor: formatarMoedaInput(valorDespesa),
    };
    const despesas = idDespesaEditando
      ? (profissionalDespesas.despesas || []).map((despesa) => despesa.id === idDespesaEditando ? novaDespesa : despesa)
      : [...(profissionalDespesas.despesas || []), novaDespesa];
    atualizarDespesasLocaisProfissional(despesas);
    setTipoDespesa('');
    setIdTipoDespesa('');
    setValorDespesa('');
    setIdDespesaEditando(null);
  };

  const excluirDespesaProfissional = (despesa) => {
    setIdDespesaExcluindo(despesa.id);
  };

  const confirmarExclusaoDespesa = () => {
    atualizarDespesasLocaisProfissional((profissionalDespesas.despesas || []).filter((item) => item.id !== idDespesaExcluindo));
    if (idDespesaEditando === idDespesaExcluindo) {
      setIdDespesaEditando(null);
      setTipoDespesa('');
      setIdTipoDespesa('');
      setValorDespesa('');
    }
    setIdDespesaExcluindo(null);
  };

  const irParaSecao = (nomeSecao) => {
    setSecao(nomeSecao);
    isAutoScrolling.current = true;
    const posicao = posicoesSecao[nomeSecao];
    if (typeof posicao === 'number') {
      requestAnimationFrame(() => {
        scrollConteudo.current?.scrollTo({ y: Math.max(posicao - 8, 0), animated: true });
        setTimeout(() => { isAutoScrolling.current = false; }, 500);
      });
    } else {
      isAutoScrolling.current = false;
    }
  };

  const salvarEvento = async () => {
    if (salvando) return;
    
    if (!formulario.tipoEvento.trim() || !formulario.titulo.trim() || !formulario.cliente.trim() || !formulario.dataInicio.trim()) {
      mostrarErro('Preencha tipo de evento, título, cliente e data obrigatória.');
      irParaSecao('Geral');
      return;
    }
    
    const locaisValidos = locais.filter(l => l.nomeDoLocal.trim() && l.tipoLocal.trim());
    if (locaisValidos.length === 0) {
      mostrarErro('Preencha corretamente as informações de pelo menos um local.');
      irParaSecao('Geral');
      return;
    }

    const parcelaComVencimentoInvalido = parcelas.findIndex((parcela) => parcela.vencimento && !dataParcelaValida(parcela.vencimento));
    if (parcelaComVencimentoInvalido !== -1) {
      mostrarErro(`Informe um vencimento válido para a parcela ${parcelaComVencimentoInvalido + 1} no formato DD/MM/AAAA.`);
      irParaSecao('Financeiro');
      return;
    }

    const novoEvento = {
      titulo: formulario.titulo.trim(), tipoEvento: formulario.tipoEvento.trim(),
      dataInicio: formulario.dataInicio.trim(), horaInicio: formulario.horaInicio.trim(),
      numConvidados: Number(formulario.numConvidados) || 0,
      notasProducao: formulario.notasProducao.trim(),
      cliente: { nome: formulario.cliente.trim() },
      locaisArray: locaisValidos,
      equipe: equipe,
      financeiro: {
           valorTotal: formulario.valorTotal.trim(),
           metodoPagamento: formulario.metodoPagamento.trim(),
          observacaoFinanceiro: formulario.observacaoFinanceiro.trim(),
          qtdParcelas: Number(formulario.qtdParcelas) || 0,
          parcelasDetalhadas: parcelas
      },
    };
    
    setSalvando(true);
    try {
      const eventoCriado = await repositorioEventos.adicionarEvento(novoEvento);
      navigation.replace('DetalheEvento', { idEvento: eventoCriado.id, erroConvites: eventoCriado.erroConvites || '' });
    } catch (erro) {
      mostrarErro(erro?.message || 'Não foi possível salvar o evento.');
    } finally {
      setSalvando(false);
    }
  };

  const conteudoSecao = (nomeSecao) => {
    const quantidadeFuncoes = new Set(equipe.map((pessoa) => pessoa.funcao).filter(Boolean)).size;

    if (nomeSecao === 'Geral') return (
      <>
        <View style={styles.formBlock}>
          <Text style={styles.sectionHeading}>Dados do evento</Text>
          <Text style={styles.sectionHint}>Os campos com * são obrigatórios.</Text>

          <CampoSelecao label="Tipo de evento *" valor={formulario.tipoEvento} placeholder="Selecionar tipo" icone="party-popper" onPress={() => abrirSelecao('tipoEvento')} />
          <CampoInput label="Título do evento" valor={formulario.titulo} aoMudar={(v) => atualizar('titulo', v)} placeholder="Ex.: Ana & Pedro" obrigatorio />
          <CampoSelecao label="Cliente *" valor={formulario.cliente} placeholder="Selecionar cliente" icone="account-outline" onPress={() => abrirSelecao('cliente')} />

          <View style={styles.row}>
            <View style={styles.column}>
              <View style={styles.field}><Text style={styles.label}>Data *</Text><SeletorDataHora modo="date" valor={formulario.dataInicio} aoMudar={(v) => atualizar('dataInicio', v)} /></View>
            </View>
            <View style={styles.column}>
              <View style={styles.field}><Text style={styles.label}>Horário</Text><SeletorDataHora modo="time" valor={formulario.horaInicio} aoMudar={(v) => atualizar('horaInicio', v)} /></View>
            </View>
          </View>

          <CampoInput label="Número de convidados" valor={formulario.numConvidados} aoMudar={(v) => atualizar('numConvidados', v)} placeholder="Ex.: 180" teclado="numeric" icone="users" />
        </View>

        <View style={styles.formBlock}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionTitleText}>
              <Text style={styles.sectionHeading}>Locais</Text>
              <Text style={[styles.sectionHint, styles.sectionHintCompact]}>Adicione os espaços onde o evento acontecerá.</Text>
            </View>
            <View style={styles.countBadge}><Text style={styles.countBadgeText}>{locais.length}</Text></View>
          </View>

          {locais.map((local, index) => (
            <View key={local.idLocalTemp} style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`${localExpandidoId === local.idLocalTemp ? 'Recolher' : 'Expandir'} local ${index + 1}`}
                  accessibilityState={{ expanded: localExpandidoId === local.idLocalTemp }}
                  onPress={() => setLocalExpandidoId((atual) => atual === local.idLocalTemp ? null : local.idLocalTemp)}
                  style={styles.locationHeaderToggle}
                >
                  <View style={styles.locationHeaderInfo}>
                    <Text style={styles.locationTitle}>Local {index + 1}</Text>
                    <Text style={styles.locationSummary} numberOfLines={1}>
                      {local.nomeDoLocal || local.tipoLocal
                        ? [local.tipoLocal, local.nomeDoLocal].filter(Boolean).join(' · ')
                        : 'Defina o tipo e o endereço'}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name={localExpandidoId === local.idLocalTemp ? 'chevron-up' : 'chevron-down'} size={22} color={CORES.textMuted} />
                </TouchableOpacity>
                {locais.length > 1 && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Remover local ${index + 1}`}
                    onPress={() => removerLocal(index)}
                    style={styles.removeLocationButton}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={19} color="#B42318" />
                  </TouchableOpacity>
                )}
              </View>

              {localExpandidoId === local.idLocalTemp && (
                <View style={styles.locationFields}>
                  <CampoSelecao label="Tipo do local *" valor={local.tipoLocal} placeholder="Selecionar tipo" icone="map-marker-radius-outline" onPress={() => abrirSelecao(`tipoLocal_${index}`)} />
                  <CampoSelecao label="Endereço *" valor={local.nomeDoLocal} placeholder="Selecionar endereço" icone="map-marker-outline" onPress={() => abrirSelecao(`local_${index}`)} />
                  {!!local.enderecoLocal && <Text style={styles.locationAddress}>{local.enderecoLocal}</Text>}

                  <View style={styles.field}>
                    <Text style={styles.label}>Horário neste local</Text>
                    <SeletorDataHora modo="time" valor={local.horaLocal} aoMudar={(v) => atualizarLocal(index, 'horaLocal', v)} />
                  </View>

                  <CampoInput label="Observações do local" valor={local.observacoesLocal} aoMudar={(v) => atualizarLocal(index, 'observacoesLocal', v)} placeholder="Ex.: entrada pela lateral" multilinha icone="align-left" />
                </View>
              )}
            </View>
          ))}
          <Button mode="outlined" icon="plus" onPress={adicionarLocal} textColor={CORES.textNavy} style={styles.addLocationButton}>Adicionar local</Button>

          <CampoInput label="Notas gerais da produção" valor={formulario.notasProducao} aoMudar={(v) => atualizar('notasProducao', v)} placeholder="Informações importantes para toda a equipe..." multilinha icone="file-text" />
        </View>
      </>
    );
    
    if (nomeSecao === 'Equipe') return (
      <>
        <Text style={styles.sectionHeading}>Equipe de campo</Text>
        <Text style={styles.sectionHint}>Opcional. Monte a equipe agora ou adicione profissionais mais tarde.</Text>
        {equipe.length > 0 ? (
          <View style={styles.teamSummary}>
            <View style={styles.teamSummaryIcon}><MaterialCommunityIcons name="account-group-outline" size={22} color={CORES.textNavy} /></View>
            <View style={styles.teamSummaryInfo}>
              <Text style={styles.teamSummaryCount}>{equipe.length} {equipe.length === 1 ? 'profissional' : 'profissionais'} adicionado{equipe.length === 1 ? '' : 's'}</Text>
              <Text style={styles.teamSummaryMeta}>{quantidadeFuncoes} {quantidadeFuncoes === 1 ? 'função' : 'funções'} na equipe</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyTeamCard}>
            <View style={styles.emptyTeamIcon}><MaterialCommunityIcons name="account-group-outline" size={24} color={CORES.textMuted} /></View>
            <Text style={styles.emptyTeamTitle}>Equipe ainda não definida</Text>
            <Text style={styles.emptyTeamDescription}>Você pode convidar profissionais agora ou completar a equipe depois.</Text>
          </View>
        )}
        {equipe.length > 0 && (
          <View style={styles.teamCard}>
            {equipe.map((pessoa) => (
              <View key={pessoa.id} style={styles.personRow}>
                <View style={styles.personIcon}><MaterialCommunityIcons name="account-outline" size={20} color={CORES.textNavy} /></View>
                <View style={styles.personInfo}>
                  <Text style={{ fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 15, fontWeight: '700' }}>{pessoa.nomeProfissional}</Text>
                  <Text style={styles.personMeta}>{pessoa.funcao}</Text>
                  {!!pessoa.despesas?.length && <Text style={styles.personExpenseCount}>{pessoa.despesas.length} {pessoa.despesas.length === 1 ? 'despesa' : 'despesas'}</Text>}
                </View>
                <TouchableOpacity style={styles.expenseIconButton} onPress={() => abrirDespesasProfissional(pessoa)} accessibilityRole="button" accessibilityLabel={`Gerenciar despesas de ${pessoa.nomeProfissional}`}>
                  <Feather name="dollar-sign" size={18} color={CORES.statusConfirmado} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEquipe((lista) => lista.filter((item) => item.id !== pessoa.id))} accessibilityRole="button" accessibilityLabel={`Remover ${pessoa.nomeProfissional} do evento`}>
                  <MaterialCommunityIcons name="close-circle-outline" size={21} color={CORES.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        <Button mode={equipe.length > 0 ? 'outlined' : 'contained'} icon="plus" onPress={() => setModalEquipeVisivel(true)} buttonColor={equipe.length > 0 ? undefined : CORES.buttonGold} textColor={CORES.textNavy} style={styles.addTeamButton}>
          {equipe.length > 0 ? 'Adicionar outro profissional' : 'Adicionar profissionais'}
        </Button>
      </>
    );

    return (
      <>
        <Text style={styles.sectionHeading}>Financeiro</Text>
        <Text style={styles.sectionHint}>Opcional. Preencha somente os valores que já foram combinados.</Text>
        
        <CampoInput icone="dollar-sign" label="Valor total (opcional)" valor={formulario.valorTotal} aoMudar={(v) => atualizar('valorTotal', formatarMoedaInput(v))} placeholder="R$ 0,00" teclado="decimal-pad" />
        <CampoSelecao label="Método de pagamento (opcional)" valor={formulario.metodoPagamento} placeholder="Selecionar método" icone="credit-card-outline" onPress={() => abrirSelecao('metodoPagamento')} />
        
        <CampoSelecao
          label="Parcelamento (opcional)"
          valor={OPCOES_QTD_PARCELAS.find((opcao) => opcao.id === String(formulario.qtdParcelas))?.nome || ''}
          placeholder="Selecionar quantidade"
          icone="layers-outline"
          onPress={() => abrirSelecao('qtdParcelas')}
        />

        <CampoInput icone="align-left" label="Observações financeiras (opcional)" valor={formulario.observacaoFinanceiro} aoMudar={(v) => atualizar('observacaoFinanceiro', v)} placeholder="Anotações sobre o pagamento..." multilinha />
        
        {parcelas.length > 0 && parcelas.map((parc, i) => (
           <View key={i} style={styles.installmentCard}>
              <View style={styles.installmentHeader}>
                <View style={styles.installmentNumber}><Text style={styles.installmentNumberText}>{i + 1}</Text></View>
                <Text style={styles.installmentTitle}>Parcela {i + 1}</Text>
              </View>
              <CampoInput icone="dollar-sign" label="Valor da parcela" valor={parc.valor} aoMudar={(v) => atualizarParcela(i, 'valor', formatarMoedaInput(v))} placeholder="R$ 0,00" teclado="decimal-pad" />
              <View style={styles.field}>
                <Text style={styles.label}>Vencimento</Text>
                <SeletorDataHora
                  modo="date"
                  valor={parc.vencimento || ''}
                  aoMudar={(valor) => atualizarParcela(i, 'vencimento', valor)}
                  formatoBrasileiro
                />
              </View>
              <CampoInput icone="align-left" label="Observações (opcional)" valor={parc.observacao} aoMudar={(v) => atualizarParcela(i, 'observacao', v)} placeholder="Ex.: Assinatura do contrato" />
           </View>
        ))}
      </>
    );
  };

  const tituloSelecao = {
    tipoEvento: 'Selecionar tipo de evento',
    cliente: 'Selecionar cliente',
    metodoPagamento: 'Método de Pagamento',
    qtdParcelas: 'Quantidade de parcelas',
  }[tipoSelecao] || 'Selecionar';

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
        {SECOES.map((nomeSecao) => <TouchableOpacity key={nomeSecao} onPress={() => irParaSecao(nomeSecao)} style={[styles.tab, secao === nomeSecao && styles.activeTab]}><Text style={[styles.tabText, secao === nomeSecao && styles.activeTabText]}>{nomeSecao}</Text></TouchableOpacity>)}
      </ScrollView>

      <ScrollView
        ref={scrollConteudo} style={styles.sheet} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"
        onScroll={(evento) => {
          if (isAutoScrolling.current) return;
          const topoVisivel = evento.nativeEvent.contentOffset.y + 90;
          const secaoVisivel = [...SECOES].reverse().find((nomeSecao) => typeof posicoesSecao[nomeSecao] === 'number' && posicoesSecao[nomeSecao] <= topoVisivel);
          if (secaoVisivel && secaoVisivel !== secao) setSecao(secaoVisivel);
        }}
        scrollEventThrottle={16}
      >
        {SECOES.map((nomeSecao) => (
          <View key={nomeSecao} onLayout={(evento) => setPosicoesSecao((atual) => ({ ...atual, [nomeSecao]: evento.nativeEvent.layout.y }))}>
            {conteudoSecao(nomeSecao)}
          </View>
        ))}
        
        <View style={styles.actions}>
          <Button 
             mode="contained" 
             icon={salvando ? undefined : (equipe.length > 0 ? 'send' : 'check')} 
             onPress={salvarEvento} 
             disabled={salvando} 
             buttonColor={equipe.length > 0 ? '#10B981' : CORES.buttonGold} 
             textColor={equipe.length > 0 ? '#FFF' : CORES.textNavy} 
             style={styles.actionButton}
          >
            {salvando ? 'Salvando...' : (equipe.length > 0 ? 'Salvar evento e enviar convites' : 'Salvar evento')}
          </Button>
        </View>
      </ScrollView>
      
      <ModalSelecao 
         visible={selecaoVisivel}
         onClose={() => setSelecaoVisivel(false)}
         titulo={tituloSelecao}
         opcoes={opcoesSelecao}
         carregando={carregandoOpcoes}
         onSelecionar={escolherOpcao}
         onAdicionarNovo={tipoSelecao === 'metodoPagamento' || tipoSelecao === 'qtdParcelas' ? null : salvarNovoItemNaSelecao}
      />

      <Modal visible={modalDespesasVisivel} transparent animationType="fade" onRequestClose={() => setModalDespesasVisivel(false)}>
        <View style={styles.expenseModalOverlay}>
          <View style={styles.expenseModalCard}>
            <ScrollView style={styles.expenseModalScroll} contentContainerStyle={styles.expenseModalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.expenseModalHeader}>
              <Text style={styles.expenseModalTitle}>
                {mostrarSeletorDespesa ? 'Selecionar tipo de despesa' : `Despesas de ${profissionalDespesas?.nomeProfissional || 'profissional'}`}
              </Text>
              <TouchableOpacity onPress={() => mostrarSeletorDespesa ? setMostrarSeletorDespesa(false) : setModalDespesasVisivel(false)} accessibilityRole="button" accessibilityLabel="Fechar despesas">
                <MaterialCommunityIcons name="close" size={23} color={CORES.textMuted} />
              </TouchableOpacity>
            </View>
            {mostrarSeletorDespesa ? (
              <>
                <View style={styles.expenseModalSearch}>
                  <Feather name="search" size={17} color={CORES.textMuted} />
                  <SeparadorCampoIcone />
                  <TextInput value={buscaTipoDespesa} onChangeText={setBuscaTipoDespesa} placeholder="Buscar tipo de despesa" placeholderTextColor={CORES.textMuted} style={styles.expenseModalSearchInput} />
                </View>
                {carregandoTiposDespesa ? (
                  <ActivityIndicator size="large" color={CORES.buttonGold} style={{ marginVertical: 24 }} />
                ) : opcoesTiposDespesa.filter((item) => item.nome?.toLocaleLowerCase('pt-BR').includes(buscaTipoDespesa.trim().toLocaleLowerCase('pt-BR'))).length ? (
                  opcoesTiposDespesa
                    .filter((item) => item.nome?.toLocaleLowerCase('pt-BR').includes(buscaTipoDespesa.trim().toLocaleLowerCase('pt-BR')))
                    .map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => {
                          setTipoDespesa(item.nome || '');
                          setIdTipoDespesa(item.id || '');
                          setBuscaTipoDespesa('');
                          setMostrarSeletorDespesa(false);
                        }}
                        style={styles.expenseModalOption}
                      >
                        <Text style={styles.expenseModalOptionText}>{item.nome}</Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={CORES.textMuted} />
                      </TouchableOpacity>
                    ))
                ) : (
                  <Text style={styles.expenseModalHint}>
                    Nenhum tipo de despesa encontrado. Cadastre tipos na tela Administrando.
                  </Text>
                )}
              </>
            ) : (
              <>
                {(profissionalDespesas?.despesas || []).map((despesa, index) => (
                  <View key={despesa.id || index} style={styles.expenseModalItem}>
                    <View style={styles.expenseModalItemInfo}>
                      <Text style={styles.expenseModalItemName}>{despesa.tipo}</Text>
                      <Text style={styles.expenseModalItemValue}>{despesa.valor}</Text>
                    </View>
                    <TouchableOpacity onPress={() => editarDespesaProfissional(despesa)} style={styles.expenseModalItemAction} accessibilityRole="button" accessibilityLabel={`Editar despesa ${despesa.tipo}`}>
                      <MaterialCommunityIcons name="pencil-outline" size={19} color={CORES.textNavy} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => excluirDespesaProfissional(despesa)} style={styles.expenseModalItemAction} accessibilityRole="button" accessibilityLabel={`Excluir despesa ${despesa.tipo}`}>
                      <MaterialCommunityIcons name="trash-can-outline" size={19} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
                {!profissionalDespesas?.despesas?.length && <Text style={styles.expenseModalEmptyHint}>Ainda não há despesas registradas para este profissional.</Text>}
                {!!idDespesaExcluindo && (
                  <View style={styles.expenseDeleteConfirmation}>
                    <Text style={styles.expenseDeleteText}>Confirmar exclusão desta despesa?</Text>
                    <View style={styles.expenseDeleteActions}>
                      <Button mode="text" onPress={() => setIdDespesaExcluindo(null)} textColor={CORES.textMuted}>Cancelar</Button>
                      <Button mode="contained" onPress={confirmarExclusaoDespesa} buttonColor="#EF4444" textColor="#FFFFFF">Excluir</Button>
                    </View>
                  </View>
                )}
                <CampoSelecao label="Tipo da despesa" valor={tipoDespesa} placeholder="Selecione o tipo de despesa" icone="tag-outline" onPress={() => { setBuscaTipoDespesa(''); setMostrarSeletorDespesa(true); }} />
                <CampoInput label="Valor" valor={valorDespesa} aoMudar={(valor) => setValorDespesa(formatarMoedaInput(valor))} placeholder="R$ 0,00" teclado="decimal-pad" icone="dollar-sign" />
                <View style={styles.expenseModalActions}>
                  <Button mode="contained" onPress={salvarDespesaProfissional} buttonColor={CORES.buttonGold} textColor={CORES.textNavy} style={styles.expenseSaveButton}>
                    {idDespesaEditando ? 'Salvar alterações' : 'Adicionar despesa'}
                  </Button>
                  {!!idDespesaEditando && (
                    <Button mode="outlined" onPress={() => { setIdDespesaEditando(null); setTipoDespesa(''); setIdTipoDespesa(''); setValorDespesa(''); }} textColor={CORES.textNavy} style={{ borderRadius: 10 }}>
                      Cancelar
                    </Button>
                  )}
                </View>
              </>
            )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={modalLocalVisivel} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
           <ScrollView style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 20, maxHeight: '90%' }}>
              <Text style={{ fontFamily: FONTES.bold, fontSize: 18, color: CORES.textNavy, marginBottom: 15 }}>Cadastrar Novo Local</Text>
              <CampoInput label="Nome do Local *" valor={formNovoLocal.nome} aoMudar={v => setFormNovoLocal({...formNovoLocal, nome: v})} placeholder="Ex: Sítio Romagna" />
              <CampoInput label="Rua / Endereço *" valor={formNovoLocal.rua} aoMudar={v => setFormNovoLocal({...formNovoLocal, rua: v})} placeholder="Rua..." />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}><CampoInput label="Número" valor={formNovoLocal.numero} aoMudar={v => setFormNovoLocal({...formNovoLocal, numero: v})} placeholder="123" /></View>
                <View style={{ flex: 2 }}><CampoInput label="Bairro" valor={formNovoLocal.bairro} aoMudar={v => setFormNovoLocal({...formNovoLocal, bairro: v})} placeholder="Centro" /></View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 2 }}><CampoInput label="Cidade" valor={formNovoLocal.cidade} aoMudar={v => setFormNovoLocal({...formNovoLocal, cidade: v})} placeholder="Cidade" /></View>
                <View style={{ flex: 1 }}><CampoInput label="Estado" valor={formNovoLocal.estado} aoMudar={v => setFormNovoLocal({...formNovoLocal, estado: v})} placeholder="SP" /></View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 15, marginBottom: 30 }}>
                 <Button mode="outlined" style={{ flex: 1, borderRadius: 10 }} onPress={() => setModalLocalVisivel(false)} textColor={CORES.textNavy}>Cancelar</Button>
                 <Button mode="contained" style={{ flex: 1, borderRadius: 10 }} buttonColor={CORES.buttonGold} textColor={CORES.textNavy} onPress={salvarNovoLocalDetalhado}>Salvar</Button>
              </View>
           </ScrollView>
        </View>
      </Modal>

      <Modal visible={modalClienteVisivel} transparent animationType="fade">
        <View style={styles.formModalOverlay}>
           <ScrollView
             style={styles.clientModalCard}
             contentContainerStyle={styles.clientModalContent}
             keyboardShouldPersistTaps="handled"
           >
              <Text style={{ fontFamily: FONTES.bold, fontSize: 18, color: CORES.textNavy, marginBottom: 15 }}>
                {itemEditandoSelecao?.tipo === 'cliente' ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
              </Text>
              <CampoInput compacto label="Nome completo *" valor={formNovoCliente.nome} aoMudar={v => setFormNovoCliente({...formNovoCliente, nome: v})} placeholder="Ex.: Ana Costa" />
              <CampoInput compacto label="CPF ou CNPJ *" valor={formNovoCliente.documento} aoMudar={v => setFormNovoCliente({...formNovoCliente, documento: formatarCpfCnpj(v)})} placeholder="000.000.000-00" teclado="numeric" />
              <CampoInput compacto label="Telefone (opcional)" valor={formNovoCliente.telefone} aoMudar={v => setFormNovoCliente({...formNovoCliente, telefone: formatarTelefone(v)})} placeholder="+55 (00) 00000-0000" teclado="phone-pad" />
              <CampoInput compacto label="E-mail (opcional)" valor={formNovoCliente.email} aoMudar={v => setFormNovoCliente({...formNovoCliente, email: v})} placeholder="nome@dominio.com" teclado="email-address" />
              <CampoInput compacto label="Instagram (opcional)" valor={formNovoCliente.instagram} aoMudar={v => setFormNovoCliente({...formNovoCliente, instagram: v})} placeholder="@perfil" />
              
              <View style={styles.formModalActions}>
                 <Button mode="outlined" style={{ flex: 1, borderRadius: 10 }} onPress={() => { setModalClienteVisivel(false); setItemEditandoSelecao(null); }} textColor={CORES.textNavy}>Cancelar</Button>
                 <Button mode="contained" style={{ flex: 1, borderRadius: 10 }} buttonColor={CORES.buttonGold} textColor={CORES.textNavy} onPress={salvarNovoClienteDetalhado}>Salvar</Button>
              </View>
           </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={modalTipoEventoVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setModalTipoEventoVisivel(false);
          setItemEditandoSelecao(null);
        }}
      >
        <View style={styles.formModalOverlay}>
          <View style={styles.formModalCard}>
            <Text style={styles.formModalTitle}>
              {itemEditandoSelecao?.tipo === 'tipoEvento' ? 'Editar tipo de evento' : 'Novo tipo de evento'}
            </Text>
            <Text style={styles.formModalHint}>Informe um nome para identificar este tipo de evento.</Text>
            <CampoInput
              compacto
              label="Nome do tipo *"
              valor={formNovoTipoEvento.nome}
              aoMudar={(nome) => setFormNovoTipoEvento((atual) => ({ ...atual, nome }))}
              placeholder="Ex.: Casamento"
            />
            <CampoInput
              compacto
              label="Descrição (opcional)"
              valor={formNovoTipoEvento.descricao}
              aoMudar={(descricao) => setFormNovoTipoEvento((atual) => ({ ...atual, descricao }))}
              placeholder="Detalhes sobre este tipo"
              multilinha
            />
            <View style={styles.formModalActions}>
              <Button
                mode="outlined"
                style={{ flex: 1, borderRadius: 10 }}
                onPress={() => {
                  setModalTipoEventoVisivel(false);
                  setItemEditandoSelecao(null);
                }}
                textColor={CORES.textNavy}
                disabled={carregandoOpcoes}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                style={{ flex: 1, borderRadius: 10 }}
                buttonColor={CORES.buttonGold}
                textColor={CORES.textNavy}
                onPress={salvarTipoEvento}
                loading={carregandoOpcoes}
                disabled={carregandoOpcoes}
              >
                Salvar tipo
              </Button>
            </View>
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

      <ModalAdicionarProfissional visible={modalEquipeVisivel} empresaId={usuario?.idEmpresa} dataEvento={formulario.dataInicio} equipeAtual={equipe} onClose={() => setModalEquipeVisivel(false)} onAdd={adicionarProfissional} />
    </View>
  );
}