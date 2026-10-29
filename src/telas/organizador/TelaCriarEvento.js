import React, { useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CORES, FONTES } from '../../tema/cores';
import { styles } from '../../estilos/estilosCriarEventoOrganizador';
import { repositorioEventos } from '../../servicos/repositorioEventos';
import ModalAdicionarProfissional from '../../componentes/ModalAdicionarProfissional';

const SECOES = ['Geral', 'Locais', 'Equipe', 'Financeiro'];

const DateTimePickerNativo = Platform.OS === 'web'
  ? null
  : require('@react-native-community/datetimepicker').default;

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

function SeletorDataHora({ modo, valor, aoMudar, styles }) {
  const [visivel, setVisivel] = useState(false);
  const texto = modo === 'date' ? formatarData(valor) : valor;

  if (Platform.OS === 'web') {
    return React.createElement('input', {
      type: modo,
      value: valor,
      onChange: (evento) => aoMudar(evento.target.value),
      'aria-label': modo === 'date' ? 'Selecionar data' : 'Selecionar horário',
      'aria-required': modo === 'date',
      style: {
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: '#FFFFFF',
        border: '1px solid #D8E2EB',
        borderRadius: 11,
        padding: '12px 13px',
        minHeight: 46,
        color: '#102B46',
        fontSize: 14,
        fontFamily: FONTES.body,
      },
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
          value={dataParaPicker(valor, modo)}
          mode={modo}
          display="default"
          onChange={(evento, selecionada) => {
            setVisivel(false);
            if (!selecionada || evento.type === 'dismissed') return;
            if (modo === 'date') {
              const ano = selecionada.getFullYear();
              const mes = String(selecionada.getMonth() + 1).padStart(2, '0');
              const dia = String(selecionada.getDate()).padStart(2, '0');
              aoMudar(`${ano}-${mes}-${dia}`);
            } else {
              aoMudar(`${String(selecionada.getHours()).padStart(2, '0')}:${String(selecionada.getMinutes()).padStart(2, '0')}`);
            }
          }}
        />
      )}
    </>
  );
}

export default function TelaCriarEvento({ navigation, usuario }) {
  const [secao, setSecao] = useState('Geral');
  const [formulario, setFormulario] = useState({ titulo: '', tipoEvento: '', cliente: '', dataInicio: '', horaInicio: '', numConvidados: '', notasProducao: '', local: '', enderecoLocal: '', tipoLocal: '', horaLocal: '', valorContrato: '', parcelas: '' });
  const [equipe, setEquipe] = useState([]);
  const [modalEquipeVisivel, setModalEquipeVisivel] = useState(false);
  const [selecaoVisivel, setSelecaoVisivel] = useState(false);
  const [tipoSelecao, setTipoSelecao] = useState('');
  const [opcoesSelecao, setOpcoesSelecao] = useState([]);
  const [buscaSelecao, setBuscaSelecao] = useState('');
  const [carregandoOpcoes, setCarregandoOpcoes] = useState(false);
  const [erroSelecao, setErroSelecao] = useState('');
  const [mensagemFormulario, setMensagemFormulario] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [posicoesSecao, setPosicoesSecao] = useState({});
  const scrollConteudo = useRef(null);

  const atualizar = (campo, valor) => {
    setMensagemFormulario('');
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  };

  const abrirSelecao = async (campo) => {
    setTipoSelecao(campo);
    setBuscaSelecao('');
    setErroSelecao('');
    setSelecaoVisivel(true);
    setCarregandoOpcoes(true);
    try {
      const tipoLista = {
        tipoEvento: 'tiposEvento',
        cliente: 'clientes',
        local: 'locaisSalvos',
        tipoLocal: 'tiposLocal',
      }[campo];
      const opcoes = await repositorioEventos.obterOpcoesSelect(tipoLista, usuario?.idEmpresa);
      setOpcoesSelecao(opcoes);
    } catch (erro) {
      setErroSelecao(erro?.message || 'Não foi possível carregar a lista.');
    } finally {
      setCarregandoOpcoes(false);
    }
  };

  const escolherOpcao = async (item) => {
    setMensagemFormulario('');
    if (tipoSelecao === 'local') {
      const tiposLocais = await repositorioEventos.obterOpcoesSelect('tiposLocal', usuario?.idEmpresa);
      const tipoLocal = tiposLocais.find((tipo) => tipo.id === item.id_tipo_local);
      setFormulario((atual) => ({
        ...atual,
        local: item.nome || '',
        enderecoLocal: item.endereco_completo || '',
        tipoLocal: tipoLocal?.nome || '',
      }));
    } else {
      atualizar(tipoSelecao, item.nome || '');
    }
    setSelecaoVisivel(false);
  };
  const adicionarProfissional = (profissional) => {
    setMensagemFormulario('');
    setEquipe((anterior) => [...anterior, profissional]);
    setModalEquipeVisivel(false);
  };

  const irParaSecao = (nomeSecao) => {
    setSecao(nomeSecao);
    const posicao = posicoesSecao[nomeSecao];
    if (typeof posicao === 'number') {
      requestAnimationFrame(() => scrollConteudo.current?.scrollTo({ y: Math.max(posicao - 8, 0), animated: true }));
    }
  };

  const salvarEvento = async () => {
    if (salvando) return;
    setMensagemFormulario('');
    if (!formulario.titulo.trim() || !formulario.tipoEvento.trim() || !formulario.cliente.trim() || !formulario.dataInicio.trim()) {
      setMensagemFormulario('Preencha título, tipo de evento, cliente e data obrigatória na seção Geral.');
      irParaSecao('Geral');
      return;
    }
    if (!formulario.local.trim() || !formulario.enderecoLocal.trim() || !formulario.tipoLocal.trim()) {
      setMensagemFormulario('Selecione o local do evento e confirme o tipo de local na seção Locais.');
      irParaSecao('Locais');
      return;
    }
    const novoEvento = {
      titulo: formulario.titulo.trim(),
      tipoEvento: formulario.tipoEvento.trim(),
      dataInicio: formulario.dataInicio.trim(),
      horaInicio: formulario.horaInicio.trim(),
      numConvidados: Number(formulario.numConvidados) || 0,
      statusTempo: 'futuros',
      statusEquipa: 'Equipa Pendente',
      notasProducao: formulario.notasProducao.trim(),
      cliente: { nome: formulario.cliente.trim() },
      local: {
        nomeDoLocal: formulario.local.trim(),
        endereco: formulario.enderecoLocal.trim(),
        tipoLocal: formulario.tipoLocal.trim(),
      },
      equipa: equipe,
      financeiro: { valorContrato: formulario.valorContrato.trim(), parcelas: Number(formulario.parcelas) || 0 },
    };
    setSalvando(true);
    try {
      const eventoCriado = await repositorioEventos.adicionarEvento(novoEvento);
      navigation.replace('DetalheEvento', { idEvento: eventoCriado.id, erroConvites: eventoCriado.erroConvites || '' });
    } catch (erro) {
      setMensagemFormulario(erro?.code === 'permission-denied'
        ? 'O Firebase bloqueou o cadastro. Publique as regras atualizadas do Firestore e tente novamente.'
        : erro?.message || 'Não foi possível salvar o evento. Verifique sua conexão e tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const Campo = ({ label, valor, aoMudar, placeholder, teclado = 'default', multilinha = false, obrigatorio = false }) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}{obrigatorio ? ' *' : ''}</Text>
      <TextInput value={valor} onChangeText={aoMudar} placeholder={placeholder} placeholderTextColor={CORES.textSubtle} keyboardType={teclado} multiline={multilinha} style={[styles.input, multilinha && styles.multiline]} />
    </View>
  );

  const CampoSelecao = ({ label, campo, placeholder, icone }) => (
    <View style={styles.selectionCard}>
      <Text style={styles.selectionLabel}>{label}</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formulario[campo] || placeholder}`}
        onPress={() => abrirSelecao(campo)}
        style={styles.selectionButton}
      >
        {!!icone && <MaterialCommunityIcons name={icone} size={19} color={CORES.textMuted} />}
        <Text style={[styles.selectionText, !formulario[campo] && styles.selectionPlaceholder]} numberOfLines={1}>
          {formulario[campo] || placeholder}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={CORES.textMuted} />
      </TouchableOpacity>
    </View>
  );

  const CampoDataHora = ({ label, campo, modo, placeholder }) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <SeletorDataHora
        modo={modo}
        valor={formulario[campo]}
        aoMudar={(valor) => atualizar(campo, valor)}
        styles={{ ...styles, placeholder: styles.datePickerPlaceholder }}
      />
    </View>
  );

  const conteudoSecao = (nomeSecao) => {
    if (nomeSecao === 'Geral') return (
      <>
        <Text style={styles.sectionHeading}>Informações do evento</Text>
        <Text style={styles.sectionHint}>Os campos com * são obrigatórios.</Text>
        <Campo label="Título do evento" valor={formulario.titulo} aoMudar={(v) => atualizar('titulo', v)} placeholder="Ex.: Ana & Pedro" obrigatorio />
        <CampoSelecao label="Tipo de evento *" campo="tipoEvento" placeholder="Selecionar" />
        <CampoSelecao label="Cliente *" campo="cliente" placeholder="Selecionar" icone="account-outline" />
        <View style={styles.row}>
          <View style={styles.column}><CampoDataHora label="Data *" campo="dataInicio" modo="date" placeholder="DD/MM/AAAA" /></View>
          <View style={styles.column}><CampoDataHora label="Horário" campo="horaInicio" modo="time" placeholder="16:00" /></View>
        </View>
        <Campo label="Número de convidados" valor={formulario.numConvidados} aoMudar={(v) => atualizar('numConvidados', v)} placeholder="Ex.: 180" teclado="numeric" />
      </>
    );
    if (nomeSecao === 'Locais') return (
      <>
        <Text style={styles.sectionHeading}>Locais do evento</Text>
        <Text style={styles.sectionHint}>Informe o espaço e os detalhes de chegada da equipe.</Text>
        <CampoSelecao label="Local *" campo="local" placeholder="Selecionar o endereço" icone="map-marker-outline" />
        <View style={styles.row}>
          <View style={styles.column}><CampoSelecao label="Tipo de local *" campo="tipoLocal" placeholder="Selecionar o tipo do local" /></View>
          <View style={styles.column}><CampoDataHora label="Horário" campo="horaLocal" modo="time" /></View>
        </View>
      </>
    );
    if (nomeSecao === 'Equipe') return (
      <>
        <Text style={styles.sectionHeading}>Equipe de campo</Text>
        <Text style={styles.sectionHint}>Adicione as funções e os profissionais previstos para o evento.</Text>
        {equipe.map((pessoa) => <View key={pessoa.id} style={styles.personRow}><View style={styles.personIcon}><MaterialCommunityIcons name="video-outline" size={20} color={CORES.textNavy} /></View><View style={styles.personInfo}><Text style={styles.personName}>{pessoa.funcao}</Text><Text style={styles.personMeta}>{pessoa.nomeProfissional} · {pessoa.enviarConvite ? 'Convite pendente' : 'Informativo'}</Text></View><TouchableOpacity accessibilityLabel={`Remover ${pessoa.nomeProfissional}`} onPress={() => setEquipe((lista) => lista.filter((item) => item.id !== pessoa.id))}><MaterialCommunityIcons name="close-circle-outline" size={21} color={CORES.textMuted} /></TouchableOpacity></View>)}
        <Button mode="contained" icon="plus" onPress={() => setModalEquipeVisivel(true)} buttonColor={CORES.buttonGold} textColor={CORES.textNavy} style={styles.addTeamButton}>Adicionar profissional de campo</Button>
      </>
    );
    return (
      <>
        <View style={styles.noteCard}>
          <Text style={styles.sectionHeading}>Notas da produção</Text>
          <Text style={styles.sectionHint}>Observações importantes para a equipe.</Text>
          <TextInput
            value={formulario.notasProducao}
            onChangeText={(valor) => atualizar('notasProducao', valor)}
            placeholder="Escrever notas..."
            placeholderTextColor={CORES.textSubtle}
            multiline
            style={[styles.input, styles.multiline]}
          />
        </View>
        <Text style={styles.sectionHeading}>Financeiro</Text>
        <Text style={styles.sectionHint}>Registre os valores combinados para acompanhar o evento.</Text>
        <Campo label="Valor do contrato" valor={formulario.valorContrato} aoMudar={(v) => atualizar('valorContrato', v)} placeholder="R$ 0,00" teclado="decimal-pad" />
        <Campo label="Quantidade de parcelas" valor={formulario.parcelas} aoMudar={(v) => atualizar('parcelas', v)} placeholder="Ex.: 3" teclado="numeric" />
        <Card style={styles.infoCard}><Card.Content style={styles.infoContent}><MaterialCommunityIcons name="information-outline" size={19} color={CORES.textMuted} /><Text style={styles.infoText}>Os dados financeiros ficarão disponíveis nos detalhes do evento.</Text></Card.Content></Card>
      </>
    );
  };

  const opcoesFiltradas = opcoesSelecao.filter((item) =>
    String(item.nome || '').toLocaleLowerCase('pt-BR').includes(buscaSelecao.trim().toLocaleLowerCase('pt-BR')),
  );
  const tituloSelecao = {
    tipoEvento: 'Selecionar tipo de evento',
    cliente: 'Selecionar cliente',
    local: 'Selecionar local',
    tipoLocal: 'Selecionar tipo de local',
  }[tipoSelecao] || 'Selecionar';
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
        {SECOES.map((nomeSecao) => <TouchableOpacity key={nomeSecao} onPress={() => irParaSecao(nomeSecao)} style={[styles.tab, secao === nomeSecao && styles.activeTab]}><Text style={[styles.tabText, secao === nomeSecao && styles.activeTabText]}>{nomeSecao}</Text></TouchableOpacity>)}
      </ScrollView>
      {!!mensagemFormulario && (
        <View accessibilityRole="alert" style={styles.formError}>
          <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#B42318" />
          <Text style={styles.formErrorText}>{mensagemFormulario}</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Fechar aviso" onPress={() => setMensagemFormulario('')}>
            <MaterialCommunityIcons name="close" size={19} color="#B42318" />
          </TouchableOpacity>
        </View>
      )}
      <ScrollView
        ref={scrollConteudo}
        style={styles.sheet}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        onScroll={(evento) => {
          const topoVisivel = evento.nativeEvent.contentOffset.y + 90;
          const secaoVisivel = [...SECOES].reverse().find((nomeSecao) =>
            typeof posicoesSecao[nomeSecao] === 'number' && posicoesSecao[nomeSecao] <= topoVisivel,
          );
          if (secaoVisivel && secaoVisivel !== secao) setSecao(secaoVisivel);
        }}
        scrollEventThrottle={16}
      >
        {SECOES.map((nomeSecao) => (
          <View
            key={nomeSecao}
            onLayout={(evento) => setPosicoesSecao((atual) => ({ ...atual, [nomeSecao]: evento.nativeEvent.layout.y }))}
          >
            {conteudoSecao(nomeSecao)}
          </View>
        ))}
        <View style={styles.actions}>
          <Button mode="contained" icon={salvando ? undefined : 'check'} onPress={salvarEvento} disabled={salvando} buttonColor={CORES.buttonGold} textColor={CORES.textNavy} style={styles.actionButton}>
            {salvando ? 'Salvando evento...' : 'Salvar evento'}
          </Button>
        </View>
      </ScrollView>

      <Modal visible={selecaoVisivel} transparent animationType="fade" onRequestClose={() => setSelecaoVisivel(false)}>
        <View style={styles.selectionOverlay}>
          <View style={styles.selectionModal}>
            <View style={styles.selectionModalHeader}>
              <Text style={styles.selectionModalTitle}>{tituloSelecao}</Text>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Fechar lista" onPress={() => setSelecaoVisivel(false)}>
                <MaterialCommunityIcons name="close" size={24} color={CORES.textMuted} />
              </TouchableOpacity>
            </View>
            <TextInput
              value={buscaSelecao}
              onChangeText={setBuscaSelecao}
              placeholder="Buscar"
              placeholderTextColor={CORES.textSubtle}
              style={styles.selectionSearch}
            />
            {carregandoOpcoes ? (
              <ActivityIndicator size="large" color={CORES.buttonGold} style={styles.selectionLoading} />
            ) : erroSelecao ? (
              <Text style={styles.selectionEmpty}>{erroSelecao}</Text>
            ) : opcoesFiltradas.length ? (
              <ScrollView style={styles.selectionList} keyboardShouldPersistTaps="handled">
                {opcoesFiltradas.map((item) => (
                  <TouchableOpacity key={item.id} accessibilityRole="button" onPress={() => escolherOpcao(item)} style={styles.selectionRow}>
                    <Text style={styles.selectionItemName}>{item.nome}</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={CORES.textMuted} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.selectionEmpty}>
                {buscaSelecao ? 'Nenhum resultado para essa busca.' : `Nenhum ${tituloSelecao.replace('Selecionar ', '').toLocaleLowerCase('pt-BR')} cadastrado. Adicione em Administrando.`}
              </Text>
            )}
          </View>
        </View>
      </Modal>
      <ModalAdicionarProfissional
        visible={modalEquipeVisivel}
        empresaId={usuario?.idEmpresa}
        equipeAtual={equipe}
        onClose={() => setModalEquipeVisivel(false)}
        onAdd={adicionarProfissional}
      />
    </View>
  );
}
