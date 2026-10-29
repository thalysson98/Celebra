import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Alert,
  Modal,
  FlatList 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { repositorioEventos } from '../../services/repositorioEventos';

export default function TelaCriarEvento({ navigation }) {
  // Campos do Evento
  const [titulo, setTitulo] = useState('');
  const [tipoEvento, setTipoEvento] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  
  // Estados de Data e Hora reais (Objetos Date do JavaScript)
  const [dataObj, setDataObj] = useState(new Date());
  const [horaObj, setHoraObj] = useState(new Date());
  
  // Controladores de visibilidade para os pickers nativos
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [mostrarRelogio, setMostrarRelogio] = useState(false);

  const [numConvidados, setNumConvidados] = useState('');
  const [notasProducao, setNotasProducao] = useState('');
  const [valorTotal, setValorTotal] = useState('');

  // Listas vindas da memória (Aba Administrando)
  const [opcoesTiposEvento, setOpcoesTiposEvento] = useState([]);
  const [opcoesClientes, setOpcoesClientes] = useState([]);

  // Estados dos Modais do Smart Select
  const [modalSelecaoVisivel, setModalSelecaoVisivel] = useState(false);
  const [modalCriacaoVisivel, setModalCriacaoVisivel] = useState(false);
  const [tipoAtivo, setTipoAtivo] = useState(''); // 'tiposEvento' ou 'clientes'
  const [nomeNovoItem, setNomeNovoItem] = useState('');

  useEffect(() => {
    carregarOpcoes();
  }, []);

  const carregarOpcoes = async () => {
    const tipos = await repositorioEventos.obterOpcoesSelect('tiposEvento');
    const clientesList = await repositorioEventos.obterOpcoesSelect('clientes');
    setOpcoesTiposEvento(tipos);
    setOpcoesClientes(clientesList);
  };

  const abrirModalSelecao = (tipo) => {
    setTipoAtivo(tipo);
    setModalSelecaoVisivel(true);
  };

  const abrirModalCriacao = () => {
    setModalSelecaoVisivel(false);
    setNomeNovoItem('');
    setModalCriacaoVisivel(true);
  };

  const salvarNovoItemMemoria = async () => {
    if (!nomeNovoItem.trim()) {
      Alert.alert('Atenção', 'O nome não pode estar vazio.');
      return;
    }

    try {
      const itemCriado = await repositorioEventos.adicionarNovoItemSelect(tipoAtivo, { nome: nomeNovoItem });
      await carregarOpcoes();

      if (tipoAtivo === 'tiposEvento') setTipoEvento(itemCriado.nome);
      if (tipoAtivo === 'clientes') setClienteSelecionado(itemCriado.nome);

      setModalCriacaoVisivel(false);
      Alert.alert('Sucesso', `"${itemCriado.nome}" criado e selecionado!`);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar o item.');
    }
  };

  // Formatadores visuais para exibir na interface
  const formatarDataVisual = (date) => {
    const opcoes = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('pt-BR', opcoes).replace('.', ''); // Ex: "17 out 2026"
  };

  const formatarHoraVisual = (date) => {
    const horas = date.getHours().toString().padStart(2, '0');
    return `${horas}h`; // Ex: "16h"
  };

  const aoMudarData = (event, selectedDate) => {
    setMostrarCalendario(false);
    if (selectedDate) {
      setDataObj(selectedDate);
    }
  };

  const aoMudarHora = (event, selectedTime) => {
    setMostrarRelogio(false);
    if (selectedTime) {
      setHoraObj(selectedTime);
    }
  };

  const salvarEventoCompleto = async () => {
    if (!titulo || !tipoEvento || !clienteSelecionado) {
      Alert.alert('Atenção', 'Preencha os campos obrigatórios (Título, Tipo de Evento e Cliente)!');
      return;
    }

    const novoEvento = {
      titulo,
      tipoEvento,
      local: 'Local principal',
      dataInicio: formatarDataVisual(dataObj),
      horaInicio: formatarHoraVisual(horaObj),
      numConvidados: Number(numConvidados) || 0,
      statusTempo: 'futuros',
      statusEquipa: 'Equipa Pendente',
      notasProducao: notasProducao || 'Nenhuma nota informada.',
      cliente: {
        nome: clienteSelecionado,
        email: 'contato@cliente.com',
        telefone: '(00) 00000-0000',
        status: 'Cadastro completo'
      },
      financeiro: {
        valorTotal: Number(valorTotal) || 0,
        valorPago: 0,
        saldoAReceber: Number(valorTotal) || 0,
        parcelas: []
      },
      locaisDoEvento: [],
      equipaDeCampo: []
    };

    const eventoCriado = await repositorioEventos.adicionarEvento(novoEvento);
    Alert.alert('Sucesso', 'Evento criado com sucesso!');
    navigation.navigate('DetalheEvento', { idEvento: eventoCriado.id });
  };

  return (
    <ScrollView style={estilos.container}>
      <Text style={estilos.secaoTitulo}>Dados Gerais do Evento</Text>

      {/* Select de Clientes */}
      <Text style={estilos.rotulo}>Cliente *</Text>
      <TouchableOpacity style={estilos.selectBox} onPress={() => abrirModalSelecao('clientes')}>
        <Text style={clienteSelecionado ? estilos.textoSelecionado : estilos.textoPlaceholder}>
          {clienteSelecionado || 'Selecione ou adicione um cliente...'}
        </Text>
      </TouchableOpacity>

      {/* Select de Tipo de Evento */}
      <Text style={estilos.rotulo}>Tipo de Evento *</Text>
      <TouchableOpacity style={estilos.selectBox} onPress={() => abrirModalSelecao('tiposEvento')}>
        <Text style={tipoEvento ? estilos.textoSelecionado : estilos.textoPlaceholder}>
          {tipoEvento || 'Selecione ou adicione um tipo de evento...'}
        </Text>
      </TouchableOpacity>

      <Text style={estilos.rotulo}>Título do Evento *</Text>
      <TextInput
        style={estilos.input}
        placeholder="Ex: Ana & Pedro"
        value={titulo}
        onChangeText={setTitulo}
      />

      {/* Linha com Seletores Nativos de Data e Hora */}
      <View style={estilos.linhaDupla}>
        <View style={estilos.coluna}>
          <Text style={estilos.rotulo}>Data</Text>
          <TouchableOpacity style={estilos.selectBox} onPress={() => setMostrarCalendario(true)}>
            <Text style={estilos.textoSelecionado}>📅 {formatarDataVisual(dataObj)}</Text>
          </TouchableOpacity>
        </View>

        <View style={estilos.coluna}>
          <Text style={estilos.rotulo}>Hora</Text>
          <TouchableOpacity style={estilos.selectBox} onPress={() => setMostrarRelogio(true)}>
            <Text style={estilos.textoSelecionado}>⏰ {formatarHoraVisual(horaObj)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Componentes nativos do DateTimePicker */}
      {mostrarCalendario && (
        <DateTimePicker
          value={dataObj}
          mode="date"
          display="default"
          onChange={aoMudarData}
        />
      )}

      {mostrarRelogio && (
        <DateTimePicker
          value={horaObj}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={aoMudarHora}
        />
      )}

      <Text style={estilos.rotulo}>Número de Convidados</Text>
      <TextInput
        style={estilos.input}
        placeholder="Ex: 180"
        keyboardType="numeric"
        value={numConvidados}
        onChangeText={setNumConvidados}
      />

      <Text style={estilos.rotulo}>Notas da Produção</Text>
      <TextInput
        style={[estilos.input, { height: 80, textAlignVertical: 'top' }]}
        placeholder="Escreva notas e observações..."
        multiline
        value={notasProducao}
        onChangeText={setNotasProducao}
      />

      <Text style={estilos.secaoTitulo}>Financeiro</Text>
      <Text style={estilos.rotulo}>Valor Total (R$)</Text>
      <TextInput
        style={estilos.input}
        placeholder="Ex: 6000.00"
        keyboardType="numeric"
        value={valorTotal}
        onChangeText={setValorTotal}
      />

      <TouchableOpacity style={estilos.botaoSalvar} onPress={salvarEventoCompleto}>
        <Text style={estilos.textoBotaoSalvar}>Salvar Evento</Text>
      </TouchableOpacity>

      {/* MODAL 1: Lista de Opções (Smart Select) */}
      <Modal visible={modalSelecaoVisivel} animationType="slide" transparent={true}>
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            <Text style={estilos.modalTitulo}>
              Selecionar {tipoAtivo === 'tiposEvento' ? 'Tipo de Evento' : 'Cliente'}
            </Text>

            <FlatList
              data={tipoAtivo === 'tiposEvento' ? opcoesTiposEvento : opcoesClientes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={estilos.itemListaModal}
                  onPress={() => {
                    if (tipoAtivo === 'tiposEvento') setTipoEvento(item.nome);
                    if (tipoAtivo === 'clientes') setClienteSelecionado(item.nome);
                    setModalSelecaoVisivel(false);
                  }}
                >
                  <Text style={estilos.textoItemModal}>{item.nome}</Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity style={estilos.botaoAdicionarNovo} onPress={abrirModalCriacao}>
              <Text style={estilos.textoBotaoAdicionarNovo}>+ Adicionar Novo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={estilos.botaoCancelarModal} onPress={() => setModalSelecaoVisivel(false)}>
              <Text style={estilos.textoCancelarModal}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Criação Rápida de Novo Item */}
      <Modal visible={modalCriacaoVisivel} animationType="fade" transparent={true}>
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            <Text style={estilos.modalTitulo}>
              Cadastrar Novo {tipoAtivo === 'tiposEvento' ? 'Tipo de Evento' : 'Cliente'}
            </Text>

            <TextInput
              style={estilos.input}
              placeholder="Digite o nome..."
              value={nomeNovoItem}
              onChangeText={setNomeNovoItem}
            />

            <TouchableOpacity style={estilos.botaoSalvarModal} onPress={salvarNovoItemMemoria}>
              <Text style={estilos.textoBotaoSalvar}>Salvar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={estilos.botaoCancelarModal} onPress={() => setModalCriacaoVisivel(false)}>
              <Text style={estilos.textoCancelarModal}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  secaoTitulo: { fontSize: 18, fontWeight: 'bold', color: '#1e1e1e', marginTop: 15, marginBottom: 10 },
  rotulo: { fontSize: 14, color: '#444', fontWeight: '600', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginTop: 4, fontSize: 16 },
  selectBox: { borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', padding: 14, borderRadius: 8, marginTop: 4, justifyContent: 'center' },
  textoPlaceholder: { color: '#888', fontSize: 16 },
  textoSelecionado: { color: '#1e1e1e', fontSize: 16, fontWeight: '500' },
  linhaDupla: { flexDirection: 'row', justifyContent: 'space-between' },
  coluna: { flex: 0.48 },
  botaoSalvar: { backgroundColor: '#fbc02d', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 25, marginBottom: 40 },
  textoBotaoSalvar: { color: '#1e1e1e', fontSize: 16, fontWeight: 'bold' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, maxHeight: '80%' },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#1e1e1e', textAlign: 'center' },
  itemListaModal: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  textoItemModal: { fontSize: 16, color: '#333' },
  botaoAdicionarNovo: { backgroundColor: '#e0e0e0', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  textoBotaoAdicionarNovo: { color: '#1e1e1e', fontWeight: 'bold', fontSize: 15 },
  botaoSalvarModal: { backgroundColor: '#fbc02d', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  botaoCancelarModal: { padding: 10, alignItems: 'center', marginTop: 5 },
  textoCancelarModal: { color: '#666', fontSize: 14 }
});