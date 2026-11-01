// src/telas/organizador/TelaDetalheEvento.js

import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, Alert, Modal } from 'react-native';
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
import { formatarCpfCnpj, formatarTelefone, formatarMoedaInput } from './TelaCriarEvento'; // Reutilizando funções do arquivo irmão

const ABAS = ['Geral', 'Equipe', 'Financeiro'];
const OPCOES_PAGAMENTO = [
  { id: 'Pix', nome: 'Pix' }, { id: 'Dinheiro', nome: 'Dinheiro' }, 
  { id: 'Cartão de Crédito', nome: 'Cartão de Crédito' }, { id: 'Cartão de Débito', nome: 'Cartão de Débito' }, { id: 'Boleto', nome: 'Boleto' }
];

const DateTimePickerNativo = Platform.OS === 'web' ? null : require('@react-native-community/datetimepicker').default;

function CampoDataHora({ modo, valor, aoMudar }) {
  const [pickerVisivel, setPickerVisivel] = useState(false);
  let stringFormatada = valor;
  if(modo === 'date' && valor && valor.includes('-')) { stringFormatada = valor.split('-').reverse().join('/'); }
  if (Platform.OS === 'web') return React.createElement('input', { type: modo, value: valor, onChange: (e) => aoMudar(e.target.value), style: { width: '100%', boxSizing: 'border-box', minHeight: 48, border: '1px solid #E2E8F0', borderRadius: 12, padding: '11px 12px', backgroundColor: '#F8FAFC', color: CORES.textNavy, fontSize: 14, fontFamily: FONTES.body, textAlign: 'left' } });
  
  let dataPicker = new Date();
  if (modo === 'date' && valor) {
    if(valor.includes('/')){ const [d, m, y] = valor.split('/'); dataPicker = new Date(`${y}-${m}-${d}T12:00:00`);
    } else { dataPicker = new Date(`${valor}T12:00:00`); }
  } else if (modo === 'time' && valor) {
    const [h, m] = String(valor || '16:00').split(':').map(Number); dataPicker.setHours(h || 0, m || 0, 0, 0); 
  }
  return (
    <>
      <TouchableOpacity onPress={() => setPickerVisivel(true)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, minHeight: 48, justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: FONTES.body, color: CORES.textNavy, fontSize: 14, textAlign: 'left' }}>{stringFormatada || (modo === 'date' ? 'DD/MM/AAAA' : '16:00')}</Text>
        <Feather name={modo === 'date' ? 'calendar' : 'clock'} size={18} color="#94A3B8" />
      </TouchableOpacity>
      {pickerVisivel && DateTimePickerNativo && <DateTimePickerNativo value={dataPicker} mode={modo} display="default" onChange={(e, s) => { setPickerVisivel(false); if (!s || e.type === 'dismissed') return; if (modo === 'date') aoMudar(`${String(s.getDate()).padStart(2, '0')}/${String(s.getMonth() + 1).padStart(2, '0')}/${s.getFullYear()}`); else aoMudar(`${String(s.getHours()).padStart(2, '0')}:${String(s.getMinutes()).padStart(2, '0')}`); }} />}
    </>
  );
}

function CampoEdicao({ label, valor, aoMudar, placeholder, multiline = false, icone, teclado="default" }) {
  return (
    <View style={{ marginBottom: 15 }}>
      <Text style={{ fontFamily: FONTES.semibold, color: CORES.textNavy, fontSize: 13, marginBottom: 6 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, minHeight: 48 }}>
        {icone && <Feather name={icone} size={18} color="#94A3B8" style={{ marginRight: 10 }} />}
        <TextInput
          value={valor} onChangeText={aoMudar} placeholder={placeholder || label} placeholderTextColor="#94A3B8" multiline={multiline} keyboardType={teclado} textAlign="left"
          style={{ flex: 1, fontFamily: FONTES.body, color: CORES.textNavy, fontSize: 14, minHeight: multiline ? 88 : 48, textAlignVertical: multiline ? 'top' : 'center', paddingTop: multiline ? 12 : 0, outlineStyle: 'none' }}
        />
      </View>
    </View>
  );
}

function CampoSelecaoDetalhes({ label, campo, valor, placeholder, icone, aoClicar }) {
  return (
    <View style={{ marginBottom: 15 }}>
      <Text style={{ fontFamily: FONTES.semibold, color: CORES.textNavy, fontSize: 13, marginBottom: 6 }}>{label}</Text>
      <TouchableOpacity onPress={() => aoClicar(campo)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, minHeight: 48, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {icone && <Feather name={icone} size={18} color="#94A3B8" style={{ marginRight: 10 }} />}
          <Text style={{ flex: 1, fontFamily: FONTES.body, color: valor ? CORES.textNavy : '#94A3B8', fontSize: 14, textAlign: 'left' }} numberOfLines={1}>{valor || placeholder}</Text>
        </View>
        <Feather name="chevron-down" size={18} color="#94A3B8" />
      </TouchableOpacity>
    </View>
  );
}

export default function TelaDetalheEvento({ route, navigation, usuario }) {
  const { idEvento } = route.params || {};
  const [evento, setEvento] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState(route.params?.erroConvites ? 'Equipe' : 'Geral');
  const [editando, setEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erroEdicao, setErroEdicao] = useState('');
  
  const [modalEquipeVisivel, setModalEquipeVisivel] = useState(false);
  const [selecaoVisivel, setSelecaoVisivel] = useState(false);
  const [opcoesSelecao, setOpcoesSelecao] = useState([]);
  const [tipoSelecao, setTipoSelecao] = useState('');
  const [carregandoOpcoes, setCarregandoOpcoes] = useState(false);

  const [modalExcluirVisivel, setModalExcluirVisivel] = useState(false);
  const [modalConcluirVisivel, setModalConcluirVisivel] = useState(false);
  const [modalSucessoVisivel, setModalSucessoVisivel] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState({ titulo: '', descricao: '' });
  
  const [profissionalAlvo, setProfissionalAlvo] = useState(null);

  const [modalLocalVisivel, setModalLocalVisivel] = useState(false);
  const [formNovoLocal, setFormNovoLocal] = useState({ nome: '', rua: '', numero: '', bairro: '', cidade: '', estado: '' });

  const [modalClienteVisivel, setModalClienteVisivel] = useState(false);
  const [formNovoCliente, setFormNovoCliente] = useState({ nome: '', documento: '', telefone: '', instagram: '' });

  const [locais, setLocais] = useState([]);
  const [formulario, setFormulario] = useState({ 
    titulo: '', tipoEvento: '', cliente: '', dataInicio: '', horaInicio: '', numConvidados: '', notasProducao: '', 
    metodoPagamento: '', valorTotal: '', observacaoFinanceiro: '', qtdParcelas: '', parcelasDetalhadas: []
  });

  const mostrarSucesso = (titulo, descricao) => {
    setMsgSucesso({ titulo, descricao });
    setModalSucessoVisivel(true);
  };

  const preencherFormulario = (dados) => {
    setFormulario({
      titulo: dados?.titulo || '', tipoEvento: dados?.tipoEvento || '', cliente: dados?.cliente?.nome || '',
      dataInicio: dados?.dataInicio || '', horaInicio: dados?.horaInicio || '',
      numConvidados: dados?.numConvidados ? String(dados.numConvidados) : '', notasProducao: dados?.notasProducao || '',
      metodoPagamento: dados?.financeiro?.metodoPagamento || '', valorTotal: dados?.financeiro?.valorTotal || '',
      observacaoFinanceiro: dados?.financeiro?.observacaoFinanceiro || '',
      qtdParcelas: dados?.financeiro?.qtdParcelas ? String(dados.financeiro.qtdParcelas) : '',
      parcelasDetalhadas: dados?.financeiro?.parcelasDetalhadas || []
    });
    if (dados?.locais && dados.locais.length > 0) {
        setLocais(dados.locais.map((l, i) => ({ idLocalTemp: i, ...l })));
    } else {
        setLocais([{ idLocalTemp: 1, nomeDoLocal: '', enderecoLocal: '', tipoLocal: '', horaLocal: '', observacoesLocal: '' }]);
    }
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
    setErroEdicao('');
    setFormulario((atual) => {
      const novo = { ...atual, [campo]: valor };
      if (campo === 'qtdParcelas') {
        const qtd = Number(valor) || 0;
        const qtdSegura = Math.min(qtd, 12);
        novo.parcelasDetalhadas = Array.from({length: qtdSegura}).map((_, i) => atual.parcelasDetalhadas[i] || { valor: '', observacao: '', status: 'pendente' });
      }
      return novo;
    });
  };

  const atualizarParcela = (index, campo, valor) => {
      const arr = [...formulario.parcelasDetalhadas];
      arr[index][campo] = valor;
      setFormulario({...formulario, parcelasDetalhadas: arr});
  };
  
  const alternarStatusParcela = (index) => {
      const arr = [...formulario.parcelasDetalhadas];
      arr[index].status = arr[index].status === 'paga' ? 'pendente' : 'paga';
      setFormulario({...formulario, parcelasDetalhadas: arr});
  };

  const atualizarLocal = (index, campo, valor) => {
    const novosLocais = [...locais];
    novosLocais[index][campo] = valor;
    setLocais(novosLocais);
  };
  const adicionarLocal = () => setLocais([...locais, { idLocalTemp: Date.now(), nomeDoLocal: '', enderecoLocal: '', tipoLocal: '', horaLocal: '', observacoesLocal: '' }]);
  const removerLocal = (index) => setLocais(locais.filter((_, i) => i !== index));

  const cancelarEdicao = () => {
    preencherFormulario(evento);
    setErroEdicao('');
    setEditando(null);
  };

  const salvarEdicao = async () => {
    setSalvando(true);
    try {
      let dataFormatadaFirebase = formulario.dataInicio;
      if (formulario.dataInicio && formulario.dataInicio.includes('/')) {
         const [d, m, y] = formulario.dataInicio.split('/');
         dataFormatadaFirebase = `${y}-${m}-${d}`;
      }

      const payloadFinanceiro = {
          valorTotal: formulario.valorTotal, metodoPagamento: formulario.metodoPagamento, observacaoFinanceiro: formulario.observacaoFinanceiro,
          qtdParcelas: Number(formulario.qtdParcelas) || 0, parcelasDetalhadas: formulario.parcelasDetalhadas
      };
      const locaisValidos = locais.filter(l => l.nomeDoLocal.trim() && l.tipoLocal.trim());
      
      await repositorioEventos.atualizarEvento(idEvento, { ...formulario, dataInicio: dataFormatadaFirebase, financeiro: payloadFinanceiro, cliente: { nome: formulario.cliente }, locaisArray: locaisValidos });
      await carregarEvento();
      setEditando(null);
      mostrarSucesso("Sucesso!", "Dados do evento atualizados.");
    } catch (error) { Toast.show({ type: 'error', text1: 'Erro', text2: 'Erro ao salvar.' }); } finally { setSalvando(false); }
  };

  const confirmarConclusao = async () => {
    setModalConcluirVisivel(false);
    setCarregando(true);
    await repositorioEventos.concluirEvento(idEvento);
    await carregarEvento();
    mostrarSucesso("Evento Concluído", "O evento foi encerrado e não pode mais ser editado.");
  };

  const tentarConcluirEvento = () => {
    const fn = evento.financeiro;
    const valTotalStr = fn?.valorTotal ? String(fn.valorTotal).replace(/\D/g, '') : '0';
    const valTotal = Number(valTotalStr) / 100;

    if (valTotal <= 0) {
      Toast.show({ type: 'error', text1: 'Atenção', text2: 'Preencha o valor financeiro total antes de concluir.' });
      return;
    }

    let somaPagas = 0;
    let temPendente = false;

    (fn?.parcelasDetalhadas || []).forEach(p => {
       if (p.status === 'paga') {
          somaPagas += (Number(String(p.valor || '0').replace(/\D/g, '')) / 100);
       } else {
          temPendente = true;
       }
    });

    if (temPendente || somaPagas < (valTotal - 0.05)) { // margem de erro pequena por segurança
       Toast.show({ type: 'error', text1: 'Financeiro Pendente', text2: 'Todas as parcelas devem estar PAGAS e bater o valor total.' });
       return;
    }

    setModalConcluirVisivel(true);
  };

  const clickReenviar = async (idConvite) => {
    await reenviarConvite(idConvite);
    carregarEvento();
    mostrarSucesso("Convite Reenviado", "O profissional receberá a notificação novamente.");
  };

  const abrirModalExcluir = (pessoa) => {
    setProfissionalAlvo(pessoa);
    setModalExcluirVisivel(true);
  };

  const confirmarExclusaoTecnico = async () => {
    const alvo = profissionalAlvo; // Isolar objeto antes de fechar modal
    setModalExcluirVisivel(false);
    
    // Pequeno timeout para dar tempo da animação do modal acabar, evitando crash visual
    setTimeout(async () => {
      setCarregando(true);
      try {
        if (alvo.statusConfirmacao === 'Informativo') {
          await removerProfissionalInformativo(idEvento, alvo.idUsuario);
        } else {
          await removerConvite(alvo.idConvite, idEvento, alvo.idUsuario);
        }
        await carregarEvento();
        mostrarSucesso("Sucesso", "O Profissional foi removido da equipe.");
      } catch(e) {
        setCarregando(false);
        Toast.show({ type: 'error', text1: 'Erro', text2: 'Não foi possível remover.' });
      }
    }, 300);
  };

  const abrirSelecao = async (campoInfo) => {
    setTipoSelecao(campoInfo);
    if (campoInfo === 'metodoPagamento') {
      setOpcoesSelecao(OPCOES_PAGAMENTO);
      setSelecaoVisivel(true);
      return;
    }
    setSelecaoVisivel(true);
    setCarregandoOpcoes(true);
    try {
      const tipoReal = campoInfo.startsWith('local_') ? 'locaisSalvos' : campoInfo.startsWith('tipoLocal_') ? 'tiposLocal' : campoInfo === 'cliente' ? 'clientes' : campoInfo === 'editarProfissional' ? 'tiposProfissional' : 'tiposEvento';
      const opcoes = await repositorioEventos.obterOpcoesSelect(tipoReal, usuario?.idEmpresa);
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
      const tipoReal = tipoSelecao.startsWith('tipoLocal_') ? 'tiposLocal' : tipoSelecao === 'editarProfissional' ? 'tiposProfissional' : 'tiposEvento';
      const novo = await repositorioEventos.adicionarNovoItemSelect(tipoReal, { nome: novoNome.trim() }, usuario?.idEmpresa);
      escolherOpcao(novo);
    } catch (error) {} finally { setCarregandoOpcoes(false); }
  };

  const salvarNovoLocalDetalhado = async () => {
    if (!formNovoLocal.nome || !formNovoLocal.rua) { Toast.show({ type: 'error', text1: 'Preencha o nome e rua do local.' }); return; }
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
    if (!formNovoCliente.nome || !formNovoCliente.documento) { Toast.show({ type: 'error', text1: 'Preencha o nome e CPF/CNPJ.' }); return; }
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

  const equipe = evento.equipa || [];
  const financeiro = evento.financeiro || {};
  
  let tituloSelecaoUI = 'Selecionar';
  if(tipoSelecao==='cliente') tituloSelecaoUI = 'Selecionar cliente';
  if(tipoSelecao==='tipoEvento') tituloSelecaoUI = 'Selecionar tipo de evento';
  if(tipoSelecao.startsWith('local_')) tituloSelecaoUI = 'Selecionar local';
  if(tipoSelecao.startsWith('tipoLocal_')) tituloSelecaoUI = 'Selecionar tipo do local';
  if(tipoSelecao==='metodoPagamento') tituloSelecaoUI = 'Método de Pagamento';
  if(tipoSelecao==='editarProfissional') tituloSelecaoUI = 'Nova função';

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
        {ABAS.map((aba) => (
          <TouchableOpacity key={aba} onPress={() => setAbaAtiva(aba)} style={[styles.tab, abaAtiva === aba && styles.tabActive]}>
            <Text style={[styles.tabText, abaAtiva === aba && styles.tabTextActive]}>{aba}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.sheet} contentContainerStyle={styles.content}>
        
        {/* CARD GERAL MINIMALISTA (SEM BLOCO AZUL) */}
        {abaAtiva === 'Geral' && !editando && (
          <Card style={{ backgroundColor: CORES.cardWhite, borderRadius: 16, padding: 0, marginBottom: 20, elevation: 1 }}>
            <Card.Content style={{ padding: 20 }}>
              <Text style={{ fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 24, fontWeight: '700', marginBottom: 16 }}>{evento.titulo}</Text>
              
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

                 <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                   <View style={{width: 32, height: 32, borderRadius: 8, backgroundColor: '#EAF3F7', alignItems: 'center', justifyContent: 'center', marginRight: 12}}>
                      <Feather name="clock" size={16} color={CORES.textNavy} />
                   </View>
                   <View>
                      <Text style={{ fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 12 }}>Horário</Text>
                      <Text style={{ fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 15 }}>{evento.horaInicio || 'Não informado'}</Text>
                   </View>
                 </View>

                 <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                   <View style={{width: 32, height: 32, borderRadius: 8, backgroundColor: '#FFFBEB', alignItems: 'center', justifyContent: 'center', marginRight: 12}}>
                      <Feather name="user" size={16} color={CORES.buttonGold} />
                   </View>
                   <View>
                      <Text style={{ fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 12 }}>Cliente Principal</Text>
                      <Text style={{ fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 15 }}>{evento.cliente?.nome || 'Não informado'}</Text>
                   </View>
                 </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {abaAtiva === 'Geral' && (editando === 'geral' ? <>
          <Text style={styles.sectionTitle}>Editar dados do evento</Text>
          <Card style={styles.card}><Card.Content>
            <CampoEdicao label="Título do evento *" valor={formulario.titulo} aoMudar={(valor) => atualizarCampo('titulo', valor)} />
            <CampoSelecaoDetalhes label="Tipo de evento *" campo="tipoEvento" valor={formulario.tipoEvento} placeholder="Selecionar tipo" aoClicar={abrirSelecao} />
            <CampoSelecaoDetalhes label="Cliente *" campo="cliente" valor={formulario.cliente} placeholder="Selecionar cliente" icone="user" aoClicar={abrirSelecao} />
            
            <View style={styles.editRow}>
              <View style={styles.editColumn}>
                 <Text style={{ fontFamily: FONTES.semibold, color: CORES.textNavy, fontSize: 13, marginBottom: 6 }}>Data *</Text>
                 <CampoDataHora modo="date" valor={formulario.dataInicio} aoMudar={(valor) => atualizarCampo('dataInicio', valor)} />
              </View>
              <View style={styles.editColumn}>
                 <Text style={{ fontFamily: FONTES.semibold, color: CORES.textNavy, fontSize: 13, marginBottom: 6 }}>Horário</Text>
                 <CampoDataHora modo="time" valor={formulario.horaInicio} aoMudar={(valor) => atualizarCampo('horaInicio', valor)} />
              </View>
            </View>
            <CampoEdicao label="Número de convidados" valor={formulario.numConvidados} aoMudar={(v) => atualizarCampo('numConvidados', v)} placeholder="Ex.: 180" teclado="numeric" />

            <View style={{ marginTop: 20, borderTopWidth: 1, borderTopColor: '#DFE7EE', paddingTop: 20 }}>
              <Text style={styles.sectionTitle}>Locais do Evento</Text>
              {locais.map((local, index) => (
                <View key={local.idLocalTemp || index} style={{ marginBottom: 15, padding: 15, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
                    <Text style={{fontWeight: 'bold', color: CORES.textNavy}}>Local {index + 1}</Text>
                    {locais.length > 1 && <TouchableOpacity onPress={() => removerLocal(index)}><MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" /></TouchableOpacity>}
                  </View>
                  <CampoSelecaoDetalhes label="Tipo do local *" campo={`tipoLocal_${index}`} valor={local.tipoLocal} placeholder="Selecionar tipo" aoClicar={abrirSelecao} />
                  <CampoSelecaoDetalhes label="Local *" campo={`local_${index}`} valor={local.nomeDoLocal} placeholder="Selecionar o endereço" icone="map-pin" aoClicar={abrirSelecao} />
                  {!!local.enderecoLocal && <Text style={{fontSize: 12, color: '#64748B', marginBottom: 10, paddingHorizontal: 5}}>{local.enderecoLocal}</Text>}
                  
                  <View style={styles.editRow}>
                    <View style={styles.editColumn}>
                      <Text style={{ fontFamily: FONTES.semibold, color: CORES.textNavy, fontSize: 13, marginBottom: 6 }}>Horário</Text>
                      <CampoDataHora modo="time" valor={local.horaLocal} aoMudar={(v) => atualizarLocal(index, 'horaLocal', v)} />
                    </View>
                  </View>
                  <CampoEdicao label="Observações do local" valor={local.observacoesLocal} aoMudar={(v) => atualizarLocal(index, 'observacoesLocal', v)} placeholder="Detalhes de chegada..." multiline />
                </View>
              ))}
              <Button mode="contained" icon="plus" onPress={adicionarLocal} textColor={CORES.textNavy} buttonColor={CORES.buttonGold} style={{ borderRadius: 10, marginBottom: 20 }}>Adicionar mais um local</Button>
            </View>

            <CampoEdicao label="Notas gerais da produção" valor={formulario.notasProducao} aoMudar={(v) => atualizarCampo('notasProducao', v)} placeholder="Escrever notas importantes..." multiline />
            <View style={styles.editActions}>
              <Button mode="outlined" onPress={cancelarEdicao} textColor={CORES.textNavy}>Cancelar</Button>
              <Button mode="contained" onPress={salvarEdicao} loading={salvando} buttonColor={CORES.buttonGold} textColor={CORES.textNavy}>Salvar alterações</Button>
            </View>
          </Card.Content></Card>
        </> : <>
          <Text style={styles.sectionTitle}>Locais do Evento</Text>
          {evento.locais.length > 0 ? evento.locais.map((local, index) => (
             <Card key={index} style={styles.card}><Card.Content>
               <View style={styles.placeTitleRow}>
                 <MaterialCommunityIcons name="map-marker-outline" size={24} color={CORES.statusDanger || '#E5484D'} />
                 <Text style={styles.placeName}>{local.nomeDoLocal || local.nomeEstabelecimento || local.nome || 'Local'}</Text>
               </View>
               <Text style={styles.placeAddress}>{local.enderecoLocal || local.endereco || local.endereco_completo || 'Endereço não informado'}</Text>
               <Text style={styles.placeMeta}>{local.tipoLocal || 'Tipo não informado'}</Text>
               <View style={styles.placeFooter}>
                 <Text style={styles.placeTime}>{local.horaLocal || evento.horaInicio}</Text>
               </View>
             </Card.Content></Card>
          )) : <Text style={styles.sectionHint}>Nenhum local cadastrado.</Text>}
          
          <Text style={styles.sectionTitle}>Notas da produção</Text>
          <Card style={styles.card}><Card.Content><Text style={styles.noteText}>{evento.notasProducao || 'Nenhuma observação registrada.'}</Text></Card.Content></Card>

          {!eventoConcluido && (
             <TouchableOpacity onPress={() => setEditando('geral')} style={styles.editPrimaryButton}>
               <Text style={styles.editPrimaryText}>Editar dados gerais e locais</Text>
             </TouchableOpacity>
          )}
          {!eventoConcluido && (
            <TouchableOpacity onPress={tentarConcluirEvento} style={styles.btnConcluir}>
              <Text style={[styles.editPrimaryText, {color: '#FFF'}]}>Concluir Evento</Text>
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
              {equipe.map((pessoa, index) => (
                <View key={pessoa.id || index} style={styles.personRow}>
                  <View style={styles.personIcon}><MaterialCommunityIcons name="account-outline" size={24} color={CORES.textNavy} /></View>
                  <View style={styles.personInfo}>
                    <Text style={{ fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 16, fontWeight: '700' }} numberOfLines={1}>{pessoa.nomeProfissional}</Text>
                    <Text style={[styles.personMeta, { marginTop: 2, fontSize: 13, color: '#334155' }]} numberOfLines={1}>{pessoa.funcao}</Text>
                    
                    {pessoa.statusConfirmacao !== 'Informativo' && (
                       <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                         <Text style={[styles.personMeta, {marginTop: 0, fontSize: 12}]}>Situação do convite: </Text>
                         <Text style={pessoa.statusConfirmacao === 'Confirmado' ? styles.confirmedText : pessoa.statusConfirmacao === 'Recusado' || pessoa.statusConfirmacao === 'Cancelado' ? styles.canceledText : styles.pendingText}>
                           {pessoa.statusConfirmacao}
                         </Text>
                       </View>
                    )}
                  </View>
                  
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
            </Card.Content></Card>
          ) : <Text style={styles.sectionHint}>Nenhum profissional adicionado.</Text>}
        </>}

        {abaAtiva === 'Financeiro' && (editando === 'financeiro' ? <>
          <Text style={styles.sectionTitle}>Editar financeiro</Text>
          <Card style={styles.card}><Card.Content>
            
            <CampoEdicao icone="dollar-sign" label="Valor total do evento" valor={formulario.valorTotal} aoMudar={(valor) => atualizarCampo('valorTotal', formatarMoedaInput(valor))} placeholder="R$ 0,00" teclado="numeric" />
            <CampoSelecaoDetalhes label="Método de pagamento" campo="metodoPagamento" valor={formulario.metodoPagamento} placeholder="Selecionar pagamento" icone="credit-card" aoClicar={abrirSelecao} />
            <CampoEdicao icone="align-left" label="Observação do total do evento" valor={formulario.observacaoFinanceiro} aoMudar={(valor) => atualizarCampo('observacaoFinanceiro', valor)} placeholder="Anotações extras..." multiline={true} />
            <CampoEdicao icone="layers" label="Quantidade de parcelas (Até 12x)" valor={formulario.qtdParcelas} aoMudar={(valor) => atualizarCampo('qtdParcelas', valor)} placeholder="Ex: 2" teclado="numeric" />
            
            {formulario.parcelasDetalhadas.length > 0 && formulario.parcelasDetalhadas.map((parc, i) => (
              <View key={i} style={{marginTop: 10, padding: 16, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0'}}>
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
                    <Text style={{ fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 14 }}>Parcela {i + 1}</Text>
                    <TouchableOpacity onPress={() => alternarStatusParcela(i)} style={{backgroundColor: parc.status === 'paga' ? '#10B981' : '#E2E8F0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10}}>
                      <Text style={{color: parc.status === 'paga' ? '#FFF' : '#64748B', fontWeight: 'bold', fontSize: 12}}>{parc.status === 'paga' ? 'Paga' : 'Pendente'}</Text>
                    </TouchableOpacity>
                  </View>
                  <CampoEdicao label="Valor da parcela" valor={parc.valor} aoMudar={(v) => atualizarParcela(i, 'valor', formatarMoedaInput(v))} placeholder="R$ 0,00" teclado="numeric" />
                  <CampoEdicao label="Observações" valor={parc.observacao} aoMudar={(v) => atualizarParcela(i, 'observacao', v)} placeholder="Ex: Assinatura do contrato" />
              </View>
            ))}

            <View style={[styles.editActions, {marginTop: 20}]}>
              <Button mode="outlined" onPress={() => setEditando(null)} textColor={CORES.textNavy}>Cancelar</Button>
              <Button mode="contained" onPress={salvarEdicao} loading={salvando} buttonColor={CORES.buttonGold} textColor={CORES.textNavy}>Salvar financeiro</Button>
            </View>
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
                       <View key={index} style={{ marginBottom: 10, padding: 14, backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View>
                            <Text style={{ fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 14 }}>Parcela {index + 1}: {parc.valor || 'R$ 0,00'}</Text>
                            {!!parc.observacao && <Text style={{ fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 13, marginTop: 4 }}>{parc.observacao}</Text>}
                          </View>
                          <View style={{backgroundColor: parc.status === 'paga' ? '#E6F8F0' : '#FFF7E6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8}}>
                             <Text style={{color: parc.status === 'paga' ? '#059669' : '#D97706', fontWeight: 'bold', fontSize: 11}}>{parc.status === 'paga' ? 'Paga' : 'Pendente'}</Text>
                          </View>
                       </View>
                    ))}
                 </View>
               )}
            </Card.Content>
          </Card>
          {!eventoConcluido && (
            <TouchableOpacity onPress={() => setEditando('financeiro')} style={styles.editPrimaryButton}>
              <Text style={styles.editPrimaryText}>Editar Financeiro</Text>
            </TouchableOpacity>
          )}
        </>)}
      </ScrollView>

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
              <Button mode="outlined" style={{ flex: 1, borderRadius: 10 }} textColor={CORES.textNavy} onPress={() => setModalConcluirVisivel(false)}>Cancelar</Button>
              <Button mode="contained" style={{ flex: 1, borderRadius: 10 }} buttonColor="#10B981" textColor="#FFF" onPress={confirmarConclusao}>Sim, concluir</Button>
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
                 <Button mode="outlined" style={{ flex: 1, borderRadius: 10 }} onPress={() => setModalLocalVisivel(false)} textColor={CORES.textNavy}>Cancelar</Button>
                 <Button mode="contained" style={{ flex: 1, borderRadius: 10 }} buttonColor={CORES.buttonGold} textColor={CORES.textNavy} onPress={salvarNovoLocalDetalhado}>Salvar</Button>
              </View>
           </ScrollView>
        </View>
      </Modal>

      <Modal visible={modalClienteVisivel} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
           <ScrollView style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 20, maxHeight: '90%' }}>
              <Text style={{ fontFamily: FONTES.bold, fontSize: 18, color: CORES.textNavy, marginBottom: 15 }}>Cadastrar Novo Cliente</Text>
              <CampoEdicao label="Nome Completo *" valor={formNovoCliente.nome} aoMudar={v => setFormNovoCliente({...formNovoCliente, nome: v})} placeholder="Ex: Ana Costa" />
              <CampoEdicao label="CPF ou CNPJ *" valor={formNovoCliente.documento} aoMudar={v => setFormNovoCliente({...formNovoCliente, documento: formatarCpfCnpj(v)})} placeholder="000.000.000-00" teclado="numeric" />
              <CampoEdicao label="Telefone (Opcional)" valor={formNovoCliente.telefone} aoMudar={v => setFormNovoCliente({...formNovoCliente, telefone: formatarTelefone(v)})} placeholder="(00) 00000-0000" teclado="phone-pad" />
              <CampoEdicao label="Instagram (Opcional)" valor={formNovoCliente.instagram} aoMudar={v => setFormNovoCliente({...formNovoCliente, instagram: v})} placeholder="@perfil" />
              
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 15, marginBottom: 30 }}>
                 <Button mode="outlined" style={{ flex: 1, borderRadius: 10 }} onPress={() => setModalClienteVisivel(false)} textColor={CORES.textNavy}>Cancelar</Button>
                 <Button mode="contained" style={{ flex: 1, borderRadius: 10 }} buttonColor={CORES.buttonGold} textColor={CORES.textNavy} onPress={salvarNovoClienteDetalhado}>Salvar</Button>
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
         onAdicionarNovo={tipoSelecao === 'metodoPagamento' ? null : salvarNovoItemNaSelecao}
      />

      <ModalAdicionarProfissional 
         visible={modalEquipeVisivel} 
         empresaId={usuario?.idEmpresa} 
         equipeAtual={equipe} 
         onClose={() => setModalEquipeVisivel(false)} 
         onAdd={async (p) => { 
            await repositorioEventos.adicionarProfissionaisEvento(idEvento, [p]); 
            carregarEvento(); 
            setModalEquipeVisivel(false); 
            mostrarSucesso('Profissional adicionado', p.enviarConvite ? 'Convite enviado com sucesso!' : 'Profissional adicionado à equipe.'); 
         }} 
      />
    </View>
  );
}