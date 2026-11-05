
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { CORES, FONTES } from '../../tema/cores';
import { styles } from '../../estilos/estilosCriarEventoOrganizador';
import { repositorioEventos } from '../../servicos/repositorioEventos';
import ModalAdicionarProfissional from '../../componentes/ModalAdicionarProfissional';
import ModalSelecao from '../../componentes/ModalSelecao';

const SECOES = ['Geral', 'Equipe', 'Financeiro'];

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
  const v = String(valor).replace(/\D/g, '');
  if (v.length <= 2) return v;
  if (v.length <= 6) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
  if (v.length <= 10) return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
  return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
}

export const formatarMoedaInput = (valor) => {
  if (!valor) return '';
  const numeros = valor.replace(/\D/g, '');
  if (!numeros) return '';
  const valorMonetario = (Number(numeros) / 100).toFixed(2);
  return 'R$ ' + valorMonetario.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

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

function SeletorDataHora({ modo, valor, aoMudar }) {
  const [visivel, setVisivel] = useState(false);
  const texto = modo === 'date' ? formatarData(valor) : valor;

  if (Platform.OS === 'web') {
    return React.createElement('input', {
      type: modo, value: valor, onChange: (evento) => aoMudar(evento.target.value),
      style: { width: '100%', boxSizing: 'border-box', backgroundColor: '#FFFFFF', border: '1px solid #D8E2EB', borderRadius: 11, padding: '12px 13px', minHeight: 48, color: '#102B46', fontSize: 14, fontFamily: FONTES.body },
    });
  }
  return (
    <>
      <TouchableOpacity accessibilityRole="button" onPress={() => setVisivel(true)} style={styles.datePickerButton}>
        <Text style={[styles.datePickerText, !texto && styles.placeholder]}>{texto || (modo === 'date' ? 'DD/MM/AAAA' : '16:00')}</Text>
        <MaterialCommunityIcons name={modo === 'date' ? 'calendar-month-outline' : 'clock-outline'} size={19} color="#71859A" />
      </TouchableOpacity>
      {visivel && DateTimePickerNativo && (
        <DateTimePickerNativo
          value={dataParaPicker(valor, modo)} mode={modo} display="default"
          onChange={(evento, selecionada) => {
            setVisivel(false);
            if (!selecionada || evento.type === 'dismissed') return;
            if (modo === 'date') {
              aoMudar(`${selecionada.getFullYear()}-${String(selecionada.getMonth() + 1).padStart(2, '0')}-${String(selecionada.getDate()).padStart(2, '0')}`);
            } else {
              aoMudar(`${String(selecionada.getHours()).padStart(2, '0')}:${String(selecionada.getMinutes()).padStart(2, '0')}`);
            }
          }}
        />
      )}
    </>
  );
}

const CampoInput = ({ label, valor, aoMudar, placeholder, teclado = 'default', multilinha = false, obrigatorio = false, icone }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}{obrigatorio ? ' *' : ''}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D8E2EB', borderRadius: 11, paddingHorizontal: 13, minHeight: 48 }}>
      {icone && <Feather name={icone} size={18} color="#94A3B8" style={{ marginRight: 10 }} />}
      <TextInput 
         value={valor} 
         onChangeText={aoMudar} 
         placeholder={placeholder} 
         placeholderTextColor={CORES.textSubtle} 
         keyboardType={teclado} 
         multiline={multilinha} 
         textAlign="left"
        style={{ flex: 1, fontFamily: FONTES.body, color: CORES.textNavy, fontSize: 14, minHeight: multilinha ? 88 : 48, textAlignVertical: multilinha ? 'top' : 'center', paddingTop: multilinha ? 12 : 0, outlineStyle: 'none' }} 
       />
    </View>
  </View>
)

const CampoSelecao = ({ label, campo, valor, placeholder, icone, compacto = false, onPress }) => (
  <View style={[styles.selectionCard, compacto && styles.selectionCardCompact]}>
    <Text style={styles.selectionLabel}>{label}</Text>
    <TouchableOpacity onPress={onPress} style={styles.selectionButton}>
      {!!icone && <MaterialCommunityIcons name={icone} size={19} color={CORES.textMuted} />}
      <Text style={[styles.selectionText, !valor && styles.selectionPlaceholder]} numberOfLines={1}>{valor || placeholder}</Text>
      <MaterialCommunityIcons name="chevron-down" size={20} color={CORES.textMuted} />
    </TouchableOpacity>
  </View>
)

export default function TelaCriarEvento({ navigation, usuario }) {
  const [secao, setSecao] = useState('Geral');
  const [locais, setLocais] = useState([{ idLocalTemp: 1, nomeDoLocal: '', enderecoLocal: '', tipoLocal: '', horaLocal: '', observacoesLocal: '' }]);
  const [formulario, setFormulario] = useState({
     titulo: '', tipoEvento: '', cliente: '', dataInicio: '', horaInicio: '',
     numConvidados: '', notasProducao: '', valorTotal: '', metodoPagamento: '', qtdParcelas: '', observacaoFinanceiro: '' 
   });
  const [parcelas, setParcelas] = useState([]);
  const [equipe, setEquipe] = useState([]);
  
  const [modalEquipeVisivel, setModalEquipeVisivel] = useState(false);
  const [selecaoVisivel, setSelecaoVisivel] = useState(false);
  const [tipoSelecao, setTipoSelecao] = useState('');
  const [opcoesSelecao, setOpcoesSelecao] = useState([]);
  const [carregandoOpcoes, setCarregandoOpcoes] = useState(false);
  
  const [modalLocalVisivel, setModalLocalVisivel] = useState(false);
  const [formNovoLocal, setFormNovoLocal] = useState({ nome: '', rua: '', numero: '', bairro: '', cidade: '', estado: '' });
  const [modalClienteVisivel, setModalClienteVisivel] = useState(false);
  const [formNovoCliente, setFormNovoCliente] = useState({ nome: '', documento: '', telefone: '', instagram: '' });
  
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
       const novasParcelas = Array.from({length: qtdSegura}).map((_, i) => parcelas[i] || { valor: '', observacao: '', status: 'pendente' });
       setParcelas(novasParcelas);
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

  const adicionarLocal = () => setLocais([...locais, { idLocalTemp: Date.now(), nomeDoLocal: '', enderecoLocal: '', tipoLocal: '', horaLocal: '', observacoesLocal: '' }]);
  const removerLocal = (index) => setLocais(locais.filter((_, i) => i !== index));

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
      setOpcoesSelecao([{ id: 'Pix', nome: 'Pix' }, { id: 'Dinheiro', nome: 'Dinheiro' }, { id: 'Cartão de Crédito', nome: 'Cartão de Crédito' }, { id: 'Boleto', nome: 'Boleto' }]);
      setSelecaoVisivel(true);
      return;
    }
    setSelecaoVisivel(true);
    carregarOpcoesSelect(campoInfo);
  };

  const escolherOpcao = async (item) => {
    if (tipoSelecao === 'metodoPagamento') {
      atualizar('metodoPagamento', item.nome);
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
      let tipoReal = tipoSelecao.startsWith('tipoLocal_') ? 'tiposLocal' : tipoSelecao === 'tipoEvento' ? 'tiposEvento' : tipoSelecao;
      const novo = await repositorioEventos.adicionarNovoItemSelect(tipoReal, { nome: novoNome.trim() }, usuario?.idEmpresa);
      escolherOpcao(novo);
    } catch (error) {
      console.log(error);
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
    if (!formNovoCliente.nome || !formNovoCliente.documento) { 
       mostrarErro("Preencha o nome e o CPF/CNPJ do cliente."); 
       return; 
    }
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

  const adicionarProfissional = (profissional) => {
    setEquipe((anterior) => [...anterior, profissional]);
    setModalEquipeVisivel(false);
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
    
    if (!formulario.titulo.trim() || !formulario.tipoEvento.trim() || !formulario.cliente.trim() || !formulario.dataInicio.trim()) {
      mostrarErro('Preencha título, tipo de evento, cliente e data obrigatória.');
      irParaSecao('Geral');
      return;
    }
    
    const locaisValidos = locais.filter(l => l.nomeDoLocal.trim() && l.tipoLocal.trim());
    if (locaisValidos.length === 0) {
      mostrarErro('Preencha corretamente as informações de pelo menos um local.');
      irParaSecao('Geral');
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
    if (nomeSecao === 'Geral') return (
      <>
        <Text style={styles.sectionHeading}>Informações do evento</Text>
        <Text style={styles.sectionHint}>Os campos com * são obrigatórios.</Text>

        <CampoInput label="Título do evento" valor={formulario.titulo} aoMudar={(v) => atualizar('titulo', v)} placeholder="Ex.: Ana & Pedro" obrigatorio />
        <CampoSelecao label="Cliente *" campo="cliente" valor={formulario.cliente} placeholder="Selecionar" icone="account-outline" onPress={() => abrirSelecao('cliente')} />
        <CampoSelecao label="Tipo de evento *" campo="tipoEvento" valor={formulario.tipoEvento} placeholder="Selecionar" onPress={() => abrirSelecao('tipoEvento')} />

        <View style={styles.row}>
          <View style={styles.column}>
            <View style={styles.field}><Text style={styles.label}>Data *</Text><SeletorDataHora modo="date" valor={formulario.dataInicio} aoMudar={(v) => atualizar('dataInicio', v)} /></View>
          </View>
          <View style={styles.column}>
            <View style={styles.field}><Text style={styles.label}>Horário</Text><SeletorDataHora modo="time" valor={formulario.horaInicio} aoMudar={(v) => atualizar('horaInicio', v)} /></View>
          </View>
        </View>

        <CampoInput label="Número de convidados" valor={formulario.numConvidados} aoMudar={(v) => atualizar('numConvidados', v)} placeholder="Ex.: 180" teclado="numeric" />
        
        <View style={{ marginTop: 20, borderTopWidth: 1, borderTopColor: '#DFE7EE', paddingTop: 20 }}>
          <Text style={styles.sectionHeading}>Locais do evento</Text>
          <Text style={styles.sectionHint}>Informe os espaços para a equipe.</Text>
          
          {locais.map((local, index) => (
            <View key={local.idLocalTemp} style={[styles.locationCard, { marginBottom: 15 }]}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
                <Text style={{fontWeight: 'bold', color: CORES.textNavy}}>Local {index + 1}</Text>
                {locais.length > 1 && <TouchableOpacity onPress={() => removerLocal(index)}><MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" /></TouchableOpacity>}
              </View>
              
              <CampoSelecao label="Tipo do local *" campo={`tipoLocal_${index}`} valor={local.tipoLocal} placeholder="Selecionar tipo" compacto onPress={() => abrirSelecao(`tipoLocal_${index}`)} />
              <CampoSelecao label="Local *" campo={`local_${index}`} valor={local.nomeDoLocal} placeholder="Selecionar o endereço" icone="map-marker-outline" compacto onPress={() => abrirSelecao(`local_${index}`)} />
              {!!local.enderecoLocal && <Text style={{fontSize: 12, color: '#64748B', marginBottom: 10, paddingHorizontal: 5}}>{local.enderecoLocal}</Text>}

              <View style={styles.row}>
                <View style={styles.column}>
                  <View style={styles.field}><Text style={styles.selectionLabel}>Horário</Text><SeletorDataHora modo="time" valor={local.horaLocal} aoMudar={(v) => atualizarLocal(index, 'horaLocal', v)} /></View>
                </View>
              </View>

              <View style={styles.field}>
                 <Text style={styles.selectionLabel}>Observações do local</Text>
                 <TextInput value={local.observacoesLocal} onChangeText={(v) => atualizarLocal(index, 'observacoesLocal', v)} placeholder="Observações do local" style={[styles.input, {minHeight: 60}]} multiline />
              </View>

            </View>
          ))}
          <Button mode="contained" icon="plus" onPress={adicionarLocal} textColor="#FFF" buttonColor="#F97316" style={{ borderRadius: 10, marginBottom: 20 }}>Adicionar mais um local</Button>

          <CampoInput label="Notas gerais da produção" valor={formulario.notasProducao} aoMudar={(v) => atualizar('notasProducao', v)} placeholder="Escrever notas importantes para toda a equipe..." multilinha />
        </View>
      </>
    );
    
    if (nomeSecao === 'Equipe') return (
      <>
        <Text style={styles.sectionHeading}>Equipe de campo</Text>
        <Text style={styles.sectionHint}>Adicione as funções e os profissionais previstos para o evento.</Text>
        <View style={styles.teamCard}>
          {equipe.map((pessoa) => <View key={pessoa.id} style={styles.personRow}><View style={styles.personIcon}><MaterialCommunityIcons name="account-outline" size={20} color={CORES.textNavy} /></View><View style={styles.personInfo}><Text style={{ fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 15, fontWeight: '700' }}>{pessoa.nomeProfissional}</Text><Text style={styles.personMeta}>{pessoa.funcao}</Text></View><TouchableOpacity onPress={() => setEquipe((lista) => lista.filter((item) => item.id !== pessoa.id))}><MaterialCommunityIcons name="close-circle-outline" size={21} color={CORES.textMuted} /></TouchableOpacity></View>)}
          {!equipe.length && <Text style={styles.emptyTeam}>Nenhum profissional adicionado.</Text>}
        </View>
        <Button mode="contained" icon="plus" onPress={() => setModalEquipeVisivel(true)} buttonColor={CORES.buttonGold} textColor={CORES.textNavy} style={styles.addTeamButton}>Adicionar profissional de campo</Button>
      </>
    );

    return (
      <>
        <Text style={styles.sectionHeading}>Financeiro</Text>
        <Text style={styles.sectionHint}>Registre os valores combinados para acompanhar o evento.</Text>
        
        <CampoInput icone="dollar-sign" label="Valor total do evento" valor={formulario.valorTotal} aoMudar={(v) => atualizar('valorTotal', formatarMoedaInput(v))} placeholder="R$ 0,00" teclado="decimal-pad" />
        <CampoSelecao label="Método de pagamento" campo="metodoPagamento" valor={formulario.metodoPagamento} placeholder="Ex.: Pix, Boleto, Cartão" icone="credit-card" onPress={() => abrirSelecao('metodoPagamento')} />
        
        <CampoInput icone="align-left" label="Observações do total do evento" valor={formulario.observacaoFinanceiro} aoMudar={(v) => atualizar('observacaoFinanceiro', v)} placeholder="Anotações extras..." multilinha />
        
        <CampoInput icone="layers" label="Quantidade de parcelas (Até 12x)" valor={formulario.qtdParcelas} aoMudar={(v) => atualizar('qtdParcelas', v)} placeholder="Ex.: 2" teclado="numeric" />
        
        {parcelas.length > 0 && parcelas.map((parc, i) => (
           <View key={i} style={{marginTop: 10, padding: 16, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#D8E2EB', marginBottom: 10}}>
              <Text style={[styles.label, {marginBottom: 10, color: CORES.textNavy, fontFamily: FONTES.bold}]}>Parcela {i + 1}</Text>
              <CampoInput label="Valor da parcela" valor={parc.valor} aoMudar={(v) => atualizarParcela(i, 'valor', formatarMoedaInput(v))} placeholder="R$ 0,00" teclado="decimal-pad" />
              <CampoInput label="Observações" valor={parc.observacao} aoMudar={(v) => atualizarParcela(i, 'observacao', v)} placeholder="Ex: Assinatura do contrato" />
           </View>
        ))}
      </>
    );
  };

  const tituloSelecao = {
    tipoEvento: 'Selecionar tipo de evento',
    cliente: 'Selecionar cliente',
    metodoPagamento: 'Método de Pagamento'
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
         onAdicionarNovo={tipoSelecao === 'metodoPagamento' ? null : salvarNovoItemNaSelecao}
      />

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
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
           <ScrollView style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 20, maxHeight: '90%' }}>
              <Text style={{ fontFamily: FONTES.bold, fontSize: 18, color: CORES.textNavy, marginBottom: 15 }}>Cadastrar Novo Cliente</Text>
              <CampoInput label="Nome Completo *" valor={formNovoCliente.nome} aoMudar={v => setFormNovoCliente({...formNovoCliente, nome: v})} placeholder="Ex: Ana Costa" />
              <CampoInput label="CPF ou CNPJ *" valor={formNovoCliente.documento} aoMudar={v => setFormNovoCliente({...formNovoCliente, documento: formatarCpfCnpj(v)})} placeholder="000.000.000-00" teclado="numeric" />
              <CampoInput label="Telefone (Opcional)" valor={formNovoCliente.telefone} aoMudar={v => setFormNovoCliente({...formNovoCliente, telefone: formatarTelefone(v)})} placeholder="(00) 00000-0000" teclado="phone-pad" />
              <CampoInput label="Instagram (Opcional)" valor={formNovoCliente.instagram} aoMudar={v => setFormNovoCliente({...formNovoCliente, instagram: v})} placeholder="@perfil" />
              
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 15, marginBottom: 30 }}>
                 <Button mode="outlined" style={{ flex: 1, borderRadius: 10 }} onPress={() => setModalClienteVisivel(false)} textColor={CORES.textNavy}>Cancelar</Button>
                 <Button mode="contained" style={{ flex: 1, borderRadius: 10 }} buttonColor={CORES.buttonGold} textColor={CORES.textNavy} onPress={salvarNovoClienteDetalhado}>Salvar</Button>
              </View>
           </ScrollView>
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

      <ModalAdicionarProfissional visible={modalEquipeVisivel} empresaId={usuario?.idEmpresa} equipeAtual={equipe} onClose={() => setModalEquipeVisivel(false)} onAdd={adicionarProfissional} />
    </View>
  );
}