import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Modal,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { repositorioEventos } from '../servicos/repositorioEventos';

export default function TelaCriarEvento({ navigation }) {
  const [abaAtiva, setAbaAtiva] = useState('Geral');

  const [titulo, setTitulo] = useState('');
  const [tipoEvento, setTipoEvento] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  
  const [dataObj, setDataObj] = useState(new Date());
  const [horaObj, setHoraObj] = useState(new Date());
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [mostrarRelogio, setMostrarRelogio] = useState(false);

  const [numConvidados, setNumConvidados] = useState('');
  const [notasProducao, setNotasProducao] = useState('');

  // ABA LOCAIS DETALHADOS
  const [opcoesLocais, setOpcoesLocais] = useState([
    { id: '1', nome: 'Sítio Romagna', rua: 'Rua Alvorada', numero: '367', bairro: 'Presidente Vargas', cidade: 'Içara - SC' },
    { id: '2', nome: 'Complexo Let\'s Drop', rua: 'Avenida Lédio Lazzarin', numero: '450', bairro: 'Cricúma', cidade: 'Criciúma - SC' }
  ]);
  const [localObjSelecionado, setLocalObjSelecionado] = useState(null);
  const [tipoLocalInput, setTipoLocalInput] = useState('');
  const [horarioLocalInput, setHorarioLocalInput] = useState('');
  const [obsLocalInput, setObsLocalInput] = useState('');
  const [listaLocaisEvento, setListaLocaisEvento] = useState([]);

  // ABA EQUIPE
  const [listaEquipe, setListaEquipe] = useState([
    { id: '1', cargo: 'Cinegrafista principal', profissional: 'Ronald Cipriani' },
    { id: '2', cargo: 'Cinegrafista de apoio', profissional: 'Raquel da Boit' }
  ]);
  const [modalEdicaoEquipe, setModalEdicaoEquipe] = useState(false);
  const [itemEquipeEditando, setItemEquipeEditando] = useState(null);
  const [novoCargo, setNovoCargo] = useState('');
  const [novoProfissional, setNovoProfissional] = useState('');

  // ABA FINANCEIRO
  const [valorTotal, setValorTotal] = useState('');
  const [metodoPadrao, setMetodoPadrao] = useState('PIX');
  const [parcelas, setParcelas] = useState([]);

  // EDITAR / ADICIONAR PARCELA
  const [modalParcelaVisivel, setModalParcelaVisivel] = useState(false);
  const [idParcelaEditando, setIdParcelaEditando] = useState(null);
  const [descParcela, setDescParcela] = useState('');
  const [valorText, setValorText] = useState('');
  const [dataVencimentoParcela, setDataVencimentoParcela] = useState(new Date());

  // BOTTOM SHEET SELECTS
  const [sheetVisivel, setSheetVisivel] = useState(false);
  const [tipoSelectSheet, setTipoSelectSheet] = useState(''); 
  const [modalCriacaoVisivel, setModalCriacaoVisivel] = useState(false);
  const [nomeNovoItem, setNomeNovoItem] = useState('');

  const [opcoesTipos, setOpcoesTipos] = useState([]);
  const [opcoesClientes, setOpcoesClientes] = useState([]);

  useEffect(() => {
    carregarOpcoes();
  }, []);

  const carregarOpcoes = async () => {
    const tipos = await repositorioEventos.obterOpcoesSelect('tiposEvento');
    const clientes = await repositorioEventos.obterOpcoesSelect('clientes');
    if (tipos != null) setOpcoesTipos(tipos);
    if (clientes != null) setOpcoesClientes(clientes);
  };

  const formatarMoedaR$ = (texto) => {
    const numeros = texto.replace(/\D/g, '');
    if (!numeros) return '';
    const valorFloat = parseFloat(numeros) / 100;
    return valorFloat.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const parseMoedaParaFloat = (textoFormatado) => {
    if (!textoFormatado) return 0;
    const limpo = textoFormatado.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    return parseFloat(limpo) || 0;
  };

  const formatarData = (data) => {
    if (!data) return '';
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  const formatarHora = (data) => {
    if (!data) return '';
    const hora = String(data.getHours()).padStart(2, '0');
    const min = String(data.getMinutes()).padStart(2, '0');
    return `${hora}:${min}`;
  };

  // ADICIONAR OU SALVAR PARCELA
  const salvarParcela = () => {
    const valorFloat = parseMoedaParaFloat(valorText);
    if (valorFloat <= 0) {
      Toast.show({ type: 'error', text1: 'Atenção', text2: 'Informe um valor válido.' });
      return;
    }

    if (idParcelaEditando != null) {
      const atualizadas = [];
      for (let i = 0; i < parcelas.length; i++) {
        if (parcelas[i].id === idParcelaEditando) {
          atualizadas.push({
            ...parcelas[i],
            descricao: descParcela,
            valor: valorFloat,
            dataVencimento: formatarData(dataVencimentoParcela)
          });
        } else {
          atualizadas.push(parcelas[i]);
        }
      }
      setParcelas(atualizadas);
      Toast.show({ type: 'success', text1: 'Atualizado', text2: 'Parcela editada com sucesso.' });
    } else {
      const novaParcela = {
        id: String(Date.now()),
        descricao: descParcela || (parcelas.length + 1) + 'ª parcela',
        valor: valorFloat,
        dataVencimento: formatarData(dataVencimentoParcela),
        metodoPagamento: metodoPadrao,
        status: 'Pendente'
      };
      setParcelas([...parcelas, novaParcela]);
      Toast.show({ type: 'success', text1: 'Adicionado', text2: 'Nova parcela adicionada.' });
    }

    setDescParcela('');
    setValorText('');
    setIdParcelaEditando(null);
    setModalParcelaVisivel(false);
  };

  const excluirParcela = (idRemover) => {
    const filtradas = [];
    for (let i = 0; i < parcelas.length; i++) {
      if (parcelas[i].id !== idRemover) filtradas.push(parcelas[i]);
    }
    setParcelas(filtradas);
    Toast.show({ type: 'info', text1: 'Excluído', text2: 'Parcela removida.' });
  };

  const abrirEdicaoParcela = (p) => {
    setIdParcelaEditando(p.id);
    setDescParcela(p.descricao);
    setValorText(p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
    setModalParcelaVisivel(true);
  };

  // SALVAR NOVO ITEM SMART SELECT
  const salvarNovoItemMemoria = async () => {
    if (!nomeNovoItem.trim()) return;
    const itemCriado = await repositorioEventos.adicionarNovoItemSelect(tipoSelectSheet, { nome: nomeNovoItem });
    await carregarOpcoes();

    if (tipoSelectSheet === 'clientes') setClienteSelecionado(itemCriado.nome);
    if (tipoSelectSheet === 'tiposEvento') setTipoEvento(itemCriado.nome);

    setModalCriacaoVisivel(false);
    setNomeNovoItem('');
    Toast.show({ type: 'success', text1: 'Cadastrado!', text2: `Item "${itemCriado.nome}" salvo.` });
  };

  // ADICIONAR / EDITAR EQUIPE
  const salvarMembroEquipe = () => {
    if (!novoCargo.trim()) return;
    if (itemEquipeEditando != null) {
      const atualizados = [];
      for (let i = 0; i < listaEquipe.length; i++) {
        if (listaEquipe[i].id === itemEquipeEditando.id) {
          atualizados.push({ ...listaEquipe[i], cargo: novoCargo, profissional: novoProfissional || 'A atribuir' });
        } else {
          atualizados.push(listaEquipe[i]);
        }
      }
      setListaEquipe(atualizados);
    } else {
      setListaEquipe([...listaEquipe, { id: String(Date.now()), cargo: novoCargo, profissional: novoProfissional || 'A atribuir' }]);
    }
    setModalEdicaoEquipe(false);
    setNovoCargo('');
    setNovoProfissional('');
  };

  // SALVAR EVENTO COMPLETO
  const salvarEventoCompleto = async () => {
    if (!titulo || !tipoEvento || !clienteSelecionado) {
      Toast.show({ type: 'error', text1: 'Campos Obrigatórios', text2: 'Preencha Título, Cliente e Tipo!' });
      return;
    }

    const novoEvento = {
      titulo,
      tipoEvento,
      local: localObjSelecionado ? localObjSelecionado.nome : 'Local principal',
      dataInicio: formatarData(dataObj),
      horaInicio: formatarHora(horaObj),
      numConvidados: parseInt(numConvidados) || 0,
      notasProducao,
      cliente: { nome: clienteSelecionado },
      financeiro: {
        valorTotal: parseMoedaParaFloat(valorTotal),
        metodoPagamentoPadrao: metodoPadrao,
        parcelas
      },
      locaisDoEvento: listaLocaisEvento,
      equipaDeCampo: listaEquipe
    };

    const eventoCriado = await repositorioEventos.adicionarEvento(novoEvento);
    Toast.show({ type: 'success', text1: 'Sucesso!', text2: 'Evento cadastrado com sucesso!' });
    navigation.navigate('DetalheEvento', { idEvento: eventoCriado.id });
  };

  return (
    <KeyboardAvoidingView style={estilos.containerGeral} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* TOPO FIGMA */}
      <View style={estilos.headerFigma}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon source="arrow-left" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={estilos.tituloHeader}>Adicionando evento</Text>

        <View style={estilos.tabBarHeader}>
          {['Geral', 'Locais', 'Equipe', 'Financeiro'].map((aba) => (
            <TouchableOpacity 
              key={aba}
              style={[estilos.tabItemHeader, abaAtiva === aba && estilos.tabItemAtivoHeader]}
              onPress={() => setAbaAtiva(aba)}
            >
              <Text style={[estilos.textoTabHeader, abaAtiva === aba && estilos.textoTabAtivoHeader]}>{aba}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={estilos.conteudoScroll} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* ABA GERAL */}
        {abaAtiva === 'Geral' && (
          <View>
            <Text style={estilos.rotulo}>Clientes *</Text>
            <TouchableOpacity style={estilos.selectBox} onPress={() => { setTipoSelectSheet('clientes'); setSheetVisivel(true); }}>
              <Text style={clienteSelecionado ? estilos.textoSelecionado : estilos.textoPlaceholder}>
                👤 {clienteSelecionado || 'Selecionar cliente'}
              </Text>
              <Icon source="chevron-down" size={16} color="#666" />
            </TouchableOpacity>

            <Text style={estilos.rotulo}>Tipo de evento *</Text>
            <TouchableOpacity style={estilos.selectBox} onPress={() => { setTipoSelectSheet('tiposEvento'); setSheetVisivel(true); }}>
              <Text style={tipoEvento ? estilos.textoSelecionado : estilos.textoPlaceholder}>
                📁 {tipoEvento || 'Selecionar tipo'}
              </Text>
              <Icon source="chevron-down" size={16} color="#666" />
            </TouchableOpacity>

            <Text style={estilos.rotulo}>Título do Evento *</Text>
            <TextInput style={estilos.input} placeholder="Ex: Ana & Pedro" placeholderTextColor="#999" value={titulo} onChangeText={setTitulo} />

            <View style={estilos.linhaDupla}>
              <View style={estilos.coluna}>
                <Text style={estilos.rotulo}>Data</Text>
                <TouchableOpacity style={estilos.selectBox} onPress={() => setMostrarCalendario(true)}>
                  <Text style={estilos.textoSelecionado}>📅 {formatarData(dataObj)}</Text>
                </TouchableOpacity>
              </View>
              <View style={estilos.coluna}>
                <Text style={estilos.rotulo}>Hora</Text>
                <TouchableOpacity style={estilos.selectBox} onPress={() => setMostrarRelogio(true)}>
                  <Text style={estilos.textoSelecionado}>⏰ {formatarHora(horaObj)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {mostrarCalendario && <DateTimePicker value={dataObj} mode="date" display="default" onChange={(e, d) => { setMostrarCalendario(false); if(d) setDataObj(d); }} />}
            {mostrarRelogio && <DateTimePicker value={horaObj} mode="time" is24Hour={true} display="default" onChange={(e, h) => { setMostrarRelogio(false); if(h) setHoraObj(h); }} />}

            <Text style={estilos.rotulo}>Número de Convidados</Text>
            <TextInput style={estilos.input} placeholder="Ex: 180" placeholderTextColor="#999" keyboardType="numeric" value={numConvidados} onChangeText={setNumConvidados} />

            <Text style={estilos.rotulo}>Notas da produção</Text>
            <TextInput style={[estilos.input, { height: 70, textAlignVertical: 'top' }]} placeholder="Escrever notas..." placeholderTextColor="#999" multiline value={notasProducao} onChangeText={setNotasProducao} />
          </View>
        )}

        {/* ABA LOCAIS DETALHADOS */}
        {abaAtiva === 'Locais' && (
          <View>
            <Text style={estilos.tituloSecaoBloco}>Locais do evento</Text>

            <Text style={estilos.rotulo}>Selecione um Local Cadastrado *</Text>
            <TouchableOpacity style={estilos.selectBox} onPress={() => { setTipoSelectSheet('locais'); setSheetVisivel(true); }}>
              <Text style={localObjSelecionado ? estilos.textoSelecionado : estilos.textoPlaceholder}>
                📍 {localObjSelecionado ? localObjSelecionado.nome : 'Selecionar local'}
              </Text>
              <Icon source="chevron-down" size={16} color="#666" />
            </TouchableOpacity>

            {/* DETALHES DO LOCAL SELECIONADO */}
            {localObjSelecionado != null && (
              <View style={estilos.cardDetalhesLocal}>
                <Text style={estilos.tituloCardLocal}>{localObjSelecionado.nome}</Text>
                <Text style={estilos.textoEnderecoCard}>{localObjSelecionado.rua}, {localObjSelecionado.numero}</Text>
                <Text style={estilos.textoEnderecoCard}>{localObjSelecionado.bairro} - {localObjSelecionado.cidade}</Text>

                <TouchableOpacity 
                  style={estilos.botaoMapaVerde}
                  onPress={() => Toast.show({ type: 'info', text1: 'Mapa', text2: 'Abrindo Google Maps...' })}
                >
                  <Icon source="map-marker" size={16} color="#FFF" />
                  <Text style={estilos.textoBotaoMapa}>Abrir no Mapa</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={estilos.rotulo}>Tipo do local / Etapa *</Text>
            <TextInput style={estilos.input} placeholder="Ex: Cerimônia, Festa" placeholderTextColor="#999" value={tipoLocalInput} onChangeText={setTipoLocalInput} />

            <Text style={estilos.rotulo}>Horário da Etapa</Text>
            <TextInput style={estilos.input} placeholder="Ex: 16h - 18h" placeholderTextColor="#999" value={horarioLocalInput} onChangeText={setHorarioLocalInput} />

            <TouchableOpacity 
              style={estilos.botaoAmareloContorno} 
              onPress={() => {
                if (!localObjSelecionado) return;
                setListaLocaisEvento([...listaLocaisEvento, { ...localObjSelecionado, tipo: tipoLocalInput, horario: horarioLocalInput }]);
                Toast.show({ type: 'success', text1: 'Adicionado', text2: 'Local incluído no evento.' });
              }}
            >
              <Text style={estilos.textoBotaoAmareloContorno}>+ Adicionar local ao evento</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ABA EQUIPE */}
        {abaAtiva === 'Equipe' && (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={estilos.tituloSecaoBloco}>Equipe de campo</Text>
              <TouchableOpacity onPress={() => { setItemEquipeEditando(null); setNovoCargo(''); setNovoProfissional(''); setModalEdicaoEquipe(true); }}>
                <Text style={{ color: '#D99B00', fontWeight: 'bold' }}>+ Adicionar</Text>
              </TouchableOpacity>
            </View>

            {listaEquipe.map((item) => (
              <View key={item.id} style={estilos.cardEquipeFigma}>
                <Icon source="video" size={20} color="#0B2545" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={estilos.cargoEquipe}>{item.cargo}</Text>
                  <Text style={estilos.nomeProfissional}>{item.profissional}</Text>
                </View>
                <TouchableOpacity onPress={() => { setItemEquipeEditando(item); setNovoCargo(item.cargo); setNovoProfissional(item.profissional); setModalEdicaoEquipe(true); }}>
                  <Icon source="pencil" size={18} color="#0B2545" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ABA FINANCEIRO COM FORMATAÇÃO R$ E EDITAR/EXCLUIR */}
        {abaAtiva === 'Financeiro' && (
          <View>
            <Text style={estilos.tituloSecaoBloco}>Módulo Financeiro</Text>
            <Text style={estilos.rotulo}>Valor Total do Contrato</Text>
            <TextInput 
              style={estilos.input} 
              placeholder="R$ 0,00" 
              placeholderTextColor="#999" 
              keyboardType="numeric" 
              value={valorTotal} 
              onChangeText={(t) => setValorTotal(formatarMoedaR$(t))} 
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 }}>
              <Text style={estilos.rotulo}>Parcelas</Text>
              <TouchableOpacity onPress={() => { setIdParcelaEditando(null); setDescParcela(''); setValorText(''); setModalParcelaVisivel(true); }}>
                <Text style={{ color: '#D99B00', fontWeight: 'bold' }}>+ Add Parcela</Text>
              </TouchableOpacity>
            </View>

            {parcelas.map((p) => (
              <View key={p.id} style={estilos.cardParcelaFigma}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold', color: '#0B2545' }}>{p.descricao}</Text>
                  <Text style={{ color: '#D99B00', fontWeight: 'bold', marginTop: 2 }}>
                    {p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#777' }}>Vencimento: {p.dataVencimento}</Text>
                </View>

                {/* ÍCONES DE LÁPIS E LIXEIRA */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => abrirEdicaoParcela(p)} style={{ padding: 6 }}>
                    <Icon source="pencil" size={18} color="#0B2545" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => excluirParcela(p.id)} style={{ padding: 6, marginLeft: 4 }}>
                    <Icon source="trash-can-outline" size={18} color="#D9534F" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={estilos.botaoAmareloSolido} onPress={salvarEventoCompleto}>
          <Text style={estilos.textoBotaoAmareloSolido}>Salvar Evento Completo</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* BOTTOM SHEET SELECT REUTILIZÁVEL */}
      <BottomSheetModal
        isVisible={sheetVisivel}
        onClose={() => setSheetVisivel(false)}
        title={tipoSelectSheet === 'clientes' ? 'Selecionar Cliente' : tipoSelectSheet === 'tiposEvento' ? 'Tipo de Evento' : 'Selecionar Local'}
        data={tipoSelectSheet === 'clientes' ? opcoesClientes : tipoSelectSheet === 'tiposEvento' ? opcoesTipos : opcoesLocais}
        onSelect={(item) => {
          if (tipoSelectSheet === 'clientes') setClienteSelecionado(item.nome);
          if (tipoSelectSheet === 'tiposEvento') setTipoEvento(item.nome);
          if (tipoSelectSheet === 'locais') setLocalObjSelecionado(item);
        }}
        onAddNew={() => { setSheetVisivel(false); setModalCriacaoVisivel(true); }}
      />

      {/* MODAL CADASTRAR NOVO */}
      <Modal visible={modalCriacaoVisivel} animationType="fade" transparent={true}>
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            <Text style={estilos.modalTitulo}>Cadastrar Novo Item</Text>
            <TextInput style={estilos.input} placeholder="Nome do item..." placeholderTextColor="#999" value={nomeNovoItem} onChangeText={setNomeNovoItem} />
            <TouchableOpacity style={estilos.botaoAmareloSolido} onPress={salvarNovoItemMemoria}>
              <Text style={estilos.textoBotaoAmareloSolido}>Salvar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ padding: 10, alignItems: 'center', marginTop: 8 }} onPress={() => setModalCriacaoVisivel(false)}>
              <Text style={{ color: '#666' }}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL EDIÇÃO EQUIPE */}
      <Modal visible={modalEdicaoEquipe} animationType="slide" transparent={true}>
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            <Text style={estilos.modalTitulo}>{itemEquipeEditando ? 'Editar Equipe' : 'Novo Membro da Equipe'}</Text>
            <TextInput style={estilos.input} placeholder="Cargo (Ex: Fotógrafo)" value={novoCargo} onChangeText={setNovoCargo} />
            <TextInput style={estilos.input} placeholder="Profissional" value={novoProfissional} onChangeText={setNovoProfissional} />
            <TouchableOpacity style={estilos.botaoAmareloSolido} onPress={salvarMembroEquipe}>
              <Text style={estilos.textoBotaoAmareloSolido}>Salvar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ padding: 10, alignItems: 'center', marginTop: 8 }} onPress={() => setModalEdicaoEquipe(false)}>
              <Text style={{ color: '#666' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL PARCELA COM MASCARA MOEDA */}
      <Modal visible={modalParcelaVisivel} animationType="slide" transparent={true}>
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            <Text style={estilos.modalTitulo}>{idParcelaEditando ? 'Editar Parcela' : 'Nova Parcela'}</Text>
            <TextInput style={estilos.input} placeholder="Descrição (Ex: Entrada)" value={descParcela} onChangeText={setDescParcela} />
            <TextInput 
              style={estilos.input} 
              placeholder="R$ 0,00" 
              keyboardType="numeric" 
              value={valorText} 
              onChangeText={(t) => setValorText(formatarMoedaR$(t))} 
            />
            <TouchableOpacity style={estilos.botaoAmareloSolido} onPress={salvarParcela}>
              <Text style={estilos.textoBotaoAmareloSolido}>Salvar Parcela</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ padding: 10, alignItems: 'center', marginTop: 8 }} onPress={() => setModalParcelaVisivel(false)}>
              <Text style={{ color: '#666' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  containerGeral: { flex: 1, backgroundColor: '#F4F6F8' },
  headerFigma: { backgroundColor: '#0B2545', paddingTop: 45, paddingHorizontal: 20, paddingBottom: 10 },
  tituloHeader: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  tabBarHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  tabItemHeader: { paddingVertical: 8, paddingHorizontal: 12 },
  tabItemAtivoHeader: { borderBottomWidth: 3, borderBottomColor: '#FFC107' },
  textoTabHeader: { color: '#A0B2C6', fontSize: 14 },
  textoTabAtivoHeader: { color: '#FFC107', fontWeight: 'bold' },
  conteudoScroll: { flex: 1, padding: 20 },
  rotulo: { fontSize: 13, color: '#333', fontWeight: '600', marginTop: 12 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12, marginTop: 4, fontSize: 15, color: '#333' },
  selectBox: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12, marginTop: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  textoPlaceholder: { color: '#999', fontSize: 15 },
  textoSelecionado: { color: '#333', fontSize: 15, fontWeight: '500' },
  linhaDupla: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  coluna: { flex: 0.48 },
  tituloSecaoBloco: { fontSize: 16, fontWeight: 'bold', color: '#0B2545', marginTop: 10 },
  botaoAmareloContorno: { backgroundColor: '#FFE082', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  textoBotaoAmareloContorno: { color: '#0B2545', fontWeight: 'bold', fontSize: 14 },
  botaoAmareloSolido: { backgroundColor: '#FFC107', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 25 },
  textoBotaoAmareloSolido: { color: '#0B2545', fontSize: 16, fontWeight: 'bold' },
  cardDetalhesLocal: { backgroundColor: '#FFF', borderRadius: 10, padding: 14, marginTop: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  tituloCardLocal: { fontSize: 16, fontWeight: 'bold', color: '#0B2545' },
  textoEnderecoCard: { fontSize: 13, color: '#666', marginTop: 2 },
  botaoMapaVerde: { backgroundColor: '#2E7D32', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, flexDirection: 'row', alignItems: 'center', marginTop: 10, alignSelf: 'flex-start' },
  textoBotaoMapa: { color: '#FFF', fontWeight: 'bold', fontSize: 12, marginLeft: 6 },
  cardEquipeFigma: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', padding: 12, marginTop: 8, flexDirection: 'row', alignItems: 'center' },
  cargoEquipe: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  nomeProfissional: { fontSize: 13, color: '#666', marginTop: 2 },
  cardParcelaFigma: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', padding: 12, marginTop: 8, flexDirection: 'row', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 12, padding: 20 },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', color: '#0B2545', marginBottom: 15, textAlign: 'center' }
});