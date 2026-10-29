import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ImageBackground, Linking, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { CORES, FONTES } from '../../tema/cores';
import { styles } from '../../estilos/estilosDetalheEventoOrganizador';
import { repositorioEventos } from '../../servicos/repositorioEventos';
import ModalAdicionarProfissional from '../../componentes/ModalAdicionarProfissional';

const ABAS = ['Geral', 'Locais', 'Equipe', 'Financeiro'];
const DateTimePickerNativo = Platform.OS === 'web'
  ? null
  : require('@react-native-community/datetimepicker').default;

function valorDataHora(evento, modo) {
  const data = evento?.data_inicio?.toDate?.();
  if (!data) return '';
  if (modo === 'date') {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  }
  return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
}

function CampoDataHora({ modo, valor, aoMudar, styles }) {
  const [pickerVisivel, setPickerVisivel] = useState(false);
  if (Platform.OS === 'web') {
    return React.createElement('input', {
      type: modo,
      value: valor,
      onChange: (evento) => aoMudar(evento.target.value),
      'aria-label': modo === 'date' ? 'Data do evento' : 'Horário do evento',
      style: {
        width: '100%', boxSizing: 'border-box', minHeight: 46, border: '1px solid #D8E2EB',
        borderRadius: 10, padding: '11px 12px', backgroundColor: '#FFFFFF', color: CORES.textNavy,
        fontSize: 14, fontFamily: FONTES.body,
      },
    });
  }
  const dataPicker = modo === 'date' && valor
    ? new Date(`${valor}T12:00:00`)
    : (() => {
      const data = new Date();
      const [horas, minutos] = String(valor || '16:00').split(':').map(Number);
      data.setHours(horas || 0, minutos || 0, 0, 0);
      return data;
    })();
  return (
    <>
      <TouchableOpacity accessibilityRole="button" onPress={() => setPickerVisivel(true)} style={styles.editInput}>
        <Text style={styles.editInputText}>{modo === 'date' ? (valor ? valor.split('-').reverse().join('/') : 'DD/MM/AAAA') : valor || '16:00'}</Text>
        <MaterialCommunityIcons name={modo === 'date' ? 'calendar-month-outline' : 'clock-outline'} size={18} color={CORES.textMuted} />
      </TouchableOpacity>
      {pickerVisivel && DateTimePickerNativo && <DateTimePickerNativo
        value={dataPicker}
        mode={modo}
        display="default"
        onChange={(evento, selecionada) => {
          setPickerVisivel(false);
          if (!selecionada || evento.type === 'dismissed') return;
          if (modo === 'date') {
            aoMudar(`${selecionada.getFullYear()}-${String(selecionada.getMonth() + 1).padStart(2, '0')}-${String(selecionada.getDate()).padStart(2, '0')}`);
          } else {
            aoMudar(`${String(selecionada.getHours()).padStart(2, '0')}:${String(selecionada.getMinutes()).padStart(2, '0')}`);
          }
        }}
      />}
    </>
  );
}

function CampoEdicao({ label, valor, aoMudar, placeholder, multiline = false, styles }) {
  return (
    <View style={styles.editField}>
      <Text style={styles.editLabel}>{label}</Text>
      <TextInput
        value={valor}
        onChangeText={aoMudar}
        placeholder={placeholder || label}
        placeholderTextColor={CORES.textSubtle}
        multiline={multiline}
        style={[styles.editInput, multiline && styles.editInputMultiline]}
      />
    </View>
  );
}

function Linha({ icone, titulo, valor }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}><MaterialCommunityIcons name={icone} size={18} color={CORES.textNavy} /></View>
      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>{titulo}</Text>
        <Text style={styles.detailValue}>{valor || 'Não informado'}</Text>
      </View>
    </View>
  );
}

function EmptyState({ texto }) {
  return (
    <Card style={styles.emptyCard}>
      <Card.Content style={styles.emptyContent}>
        <MaterialCommunityIcons name="text-box-outline" size={28} color={CORES.textSubtle} />
        <Text style={styles.emptyText}>{texto}</Text>
      </Card.Content>
    </Card>
  );
}

function formatarMoeda(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return null;
  return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function TelaDetalheEvento({ route, usuario }) {
  const { idEvento } = route.params || {};
  const [evento, setEvento] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [abaAtiva, setAbaAtiva] = useState(route.params?.erroConvites ? 'Equipe' : 'Geral');
  const [editando, setEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erroEdicao, setErroEdicao] = useState('');
  const [modalEquipeVisivel, setModalEquipeVisivel] = useState(false);
  const [erroConvites, setErroConvites] = useState(route.params?.erroConvites || '');
  const [formulario, setFormulario] = useState({
    titulo: '', tipoEvento: '', cliente: '', dataInicio: '', horaInicio: '', numConvidados: '',
    notasProducao: '', nomeDoLocal: '', enderecoLocal: '', tipoLocal: '',
  });

  const preencherFormulario = (dados) => {
    const localEvento = dados?.locais?.[0] || dados?.locaisDoEvento?.[0] || {};
    setFormulario({
      titulo: dados?.titulo || '',
      tipoEvento: dados?.tipoEvento || '',
      cliente: dados?.cliente?.nome || '',
      dataInicio: valorDataHora(dados, 'date'),
      horaInicio: valorDataHora(dados, 'time'),
      numConvidados: dados?.numConvidados ? String(dados.numConvidados) : '',
      notasProducao: dados?.notasProducao || '',
      nomeDoLocal: localEvento.nomeDoLocal || localEvento.nomeEstabelecimento || localEvento.nome || '',
      enderecoLocal: localEvento.endereco || localEvento.endereco_completo || '',
      tipoLocal: localEvento.tipoLocal || '',
    });
  };

  const carregarEvento = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const dados = await repositorioEventos.obterEvento(idEvento);
      setEvento(dados);
      preencherFormulario(dados);
    } catch (error) {
      setErro(error?.code === 'permission-denied'
        ? 'Sem permissão para consultar este evento. Confira as regras do Firestore.'
        : 'Não foi possível carregar os dados do evento. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }, [idEvento]);

  useFocusEffect(useCallback(() => { carregarEvento(); }, [carregarEvento]));

  const iniciarEdicao = (secao) => {
    preencherFormulario(evento);
    setErroEdicao('');
    setEditando(secao);
  };

  const atualizarCampo = (campo, valor) => {
    setErroEdicao('');
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  };

  const cancelarEdicao = () => {
    preencherFormulario(evento);
    setErroEdicao('');
    setEditando(null);
  };

  const salvarEdicao = async () => {
    setSalvando(true);
    setErroEdicao('');
    try {
      const atualizado = await repositorioEventos.atualizarEvento(idEvento, {
        ...formulario,
        cliente: { nome: formulario.cliente },
        local: {
          nomeDoLocal: formulario.nomeDoLocal,
          endereco: formulario.enderecoLocal,
          tipoLocal: formulario.tipoLocal,
        },
      });
      setEvento(atualizado);
      preencherFormulario(atualizado);
      setEditando(null);
    } catch (error) {
      setErroEdicao(error?.code === 'permission-denied'
        ? 'O Firebase bloqueou a alteração. Publique as regras atualizadas do Firestore.'
        : error?.message || 'Não foi possível salvar as alterações.');
    } finally {
      setSalvando(false);
    }
  };

  const adicionarProfissional = async (profissional) => {
    const atualizado = await repositorioEventos.adicionarProfissionaisEvento(idEvento, [profissional]);
    setEvento(atualizado);
    preencherFormulario(atualizado);
    setModalEquipeVisivel(false);
    setErroConvites('');
  };

  if (carregando) return <View style={styles.center}><ActivityIndicator size="large" color={CORES.buttonGold} /><Text style={styles.loadingText}>Carregando evento...</Text></View>;
  if (erro || !evento) return <View style={styles.center}><MaterialCommunityIcons name="calendar-remove-outline" size={38} color={CORES.textMuted} /><Text style={styles.notFound}>{erro || 'Evento não encontrado.'}</Text></View>;

  const local = evento.locais?.[0] || evento.locaisDoEvento?.[0] || null;
  const equipe = evento.equipa || evento.equipaDeCampo || [];
  const financeiro = evento.financeiro || {};
  const cliente = evento.cliente || {};
  const imagemCapa = evento.imagemUrl || evento.imagem_url || evento.coverUrl
    || (String(evento.tipoEvento || '').toLocaleLowerCase('pt-BR').includes('casamento')
      ? 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80'
      : null);
  const convidados = (editando === 'geral' ? formulario.numConvidados : evento.numConvidados)
    ? `${editando === 'geral' ? formulario.numConvidados : evento.numConvidados} convidados`
    : 'Convidados não informados';
  const dataResumo = editando === 'geral' && formulario.dataInicio
    ? formulario.dataInicio.split('-').reverse().join('/')
    : evento.dataInicio;
  const horarioResumo = editando === 'geral' ? formulario.horaInicio : evento.horaInicio;
  const tituloResumo = editando === 'geral' ? formulario.titulo : evento.titulo;
  const resumoData = [dataResumo, horarioResumo, convidados].filter(Boolean).join(' • ');
  const valoresFinanceiros = [
    ['Valor total do evento', formatarMoeda(financeiro.valorContrato || financeiro.valorTotal)],
    ['Valor pago', formatarMoeda(financeiro.valorPago)],
    ['Saldo a receber', formatarMoeda(financeiro.saldoAReceber)],
  ].filter(([, valor]) => valor);

  const abrirMapa = () => {
    const endereco = local?.endereco || local?.endereco_completo || '';
    if (!endereco) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
        {ABAS.map((aba) => (
          <TouchableOpacity key={aba} accessibilityRole="tab" accessibilityState={{ selected: abaAtiva === aba }} onPress={() => setAbaAtiva(aba)} style={[styles.tab, abaAtiva === aba && styles.tabActive]}>
            <Text style={[styles.tabText, abaAtiva === aba && styles.tabTextActive]}>{aba}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {abaAtiva === 'Geral' && (imagemCapa ? (
        <ImageBackground source={{ uri: imagemCapa }} style={styles.eventCover} imageStyle={styles.coverImage}>
          <View style={styles.coverScrim}>
            <Text style={styles.coverTitle}>{tituloResumo}</Text>
            <Text style={styles.coverSummary}>{resumoData}</Text>
          </View>
        </ImageBackground>
      ) : (
        <View style={[styles.eventCover, styles.eventCoverFallback]}>
          <Text style={styles.coverTitle}>{tituloResumo}</Text>
          <Text style={styles.coverSummary}>{resumoData}</Text>
        </View>
      ))}

      <ScrollView style={styles.sheet} contentContainerStyle={styles.content}>
        {abaAtiva === 'Geral' && (editando === 'geral' ? <>
          <Text style={styles.sectionTitle}>Editar dados do evento</Text>
          <Card style={styles.card}><Card.Content>
            <CampoEdicao styles={styles} label="Título do evento *" valor={formulario.titulo} aoMudar={(valor) => atualizarCampo('titulo', valor)} />
            <CampoEdicao styles={styles} label="Tipo de evento *" valor={formulario.tipoEvento} aoMudar={(valor) => atualizarCampo('tipoEvento', valor)} />
            <CampoEdicao styles={styles} label="Cliente *" valor={formulario.cliente} aoMudar={(valor) => atualizarCampo('cliente', valor)} />
            <View style={styles.editRow}>
              <View style={styles.editColumn}><Text style={styles.editLabel}>Data *</Text><CampoDataHora styles={styles} modo="date" valor={formulario.dataInicio} aoMudar={(valor) => atualizarCampo('dataInicio', valor)} /></View>
              <View style={styles.editColumn}><Text style={styles.editLabel}>Horário</Text><CampoDataHora styles={styles} modo="time" valor={formulario.horaInicio} aoMudar={(valor) => atualizarCampo('horaInicio', valor)} /></View>
            </View>
            <CampoEdicao styles={styles} label="Número de convidados" valor={formulario.numConvidados} aoMudar={(valor) => atualizarCampo('numConvidados', valor)} placeholder="Ex.: 180" />
            <CampoEdicao styles={styles} label="Notas da produção" valor={formulario.notasProducao} aoMudar={(valor) => atualizarCampo('notasProducao', valor)} multiline placeholder="Observações importantes para a equipe" />
            {!!erroEdicao && <Text accessibilityRole="alert" style={styles.editError}>{erroEdicao}</Text>}
            <View style={styles.editActions}>
              <Button mode="outlined" onPress={cancelarEdicao} disabled={salvando} textColor={CORES.textNavy}>Cancelar</Button>
              <Button mode="contained" onPress={salvarEdicao} loading={salvando} disabled={salvando} buttonColor={CORES.buttonGold} textColor={CORES.textNavy}>Salvar alterações</Button>
            </View>
          </Card.Content></Card>
        </> : <>
          <Text style={styles.sectionTitle}>Clientes</Text>
          <Card style={styles.card}><Card.Content>
            <View style={styles.clientRow}>
              <View style={styles.clientIcon}><MaterialCommunityIcons name="account-outline" size={20} color={CORES.textNavy} /></View>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{cliente.nome || 'Cliente não informado'}</Text>
                <Text style={styles.clientContact}>{cliente.email || 'E-mail não informado'}{cliente.telefone ? ` • ${cliente.telefone}` : ''}</Text>
              </View>
            </View>
            <View style={[styles.clientBadge, cliente.email && cliente.telefone ? styles.clientBadgeComplete : styles.clientBadgeBasic]}>
              <Text style={[styles.clientBadgeText, cliente.email && cliente.telefone ? styles.clientBadgeTextComplete : styles.clientBadgeTextBasic]}>
                {cliente.email && cliente.telefone ? 'Cadastro completo' : 'Cadastro básico'}
              </Text>
            </View>
          </Card.Content></Card>
          <Text style={styles.sectionTitle}>Notas da produção</Text>
          <Card style={styles.card}><Card.Content><Text style={styles.noteText}>{evento.notasProducao || 'Nenhuma observação registrada.'}</Text></Card.Content></Card>
          <TouchableOpacity accessibilityRole="button" onPress={() => iniciarEdicao('geral')} style={styles.editPrimaryButton}>
            <MaterialCommunityIcons name="pencil-outline" size={18} color={CORES.textNavy} />
            <Text style={styles.editPrimaryText}>Editar dados</Text>
          </TouchableOpacity>
        </>)}

        {abaAtiva === 'Locais' && <>
          <Text style={styles.sectionTitle}>Locais do evento</Text>
          <Text style={styles.sectionHint}>Confira o endereço e os dados do espaço reservado.</Text>
          {editando === 'local' ? (
            <Card style={styles.card}><Card.Content>
              <CampoEdicao styles={styles} label="Nome do local *" valor={formulario.nomeDoLocal} aoMudar={(valor) => atualizarCampo('nomeDoLocal', valor)} />
              <CampoEdicao styles={styles} label="Endereço completo *" valor={formulario.enderecoLocal} aoMudar={(valor) => atualizarCampo('enderecoLocal', valor)} />
              <CampoEdicao styles={styles} label="Tipo de local *" valor={formulario.tipoLocal} aoMudar={(valor) => atualizarCampo('tipoLocal', valor)} />
              {!!erroEdicao && <Text accessibilityRole="alert" style={styles.editError}>{erroEdicao}</Text>}
              <View style={styles.editActions}>
                <Button mode="outlined" onPress={cancelarEdicao} disabled={salvando} textColor={CORES.textNavy}>Cancelar</Button>
                <Button mode="contained" onPress={salvarEdicao} loading={salvando} disabled={salvando} buttonColor={CORES.buttonGold} textColor={CORES.textNavy}>Salvar alterações</Button>
              </View>
            </Card.Content></Card>
          ) : local ? (
            <Card style={styles.card}><Card.Content>
              <View style={styles.placeTitleRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={21} color={CORES.statusDanger || '#E5484D'} />
                <Text style={styles.placeName}>{local.nomeDoLocal || local.nomeEstabelecimento || local.nome || 'Local do evento'}</Text>
              </View>
              <Text style={styles.placeAddress}>{local.endereco || local.endereco_completo || [local.rua, local.numero, local.cidade, local.estado].filter(Boolean).join(', ') || 'Endereço não informado'}</Text>
              <Text style={styles.placeMeta}>{local.tipoLocal || 'Tipo de local não informado'}</Text>
              <View style={styles.placeFooter}>
                <Text style={styles.placeTime}>{evento.horaInicio || 'Horário não informado'}</Text>
                {!!(local.endereco || local.endereco_completo) && <TouchableOpacity accessibilityRole="link" onPress={abrirMapa} style={styles.mapLink}><Text style={styles.mapLinkText}>Abrir mapa</Text><MaterialCommunityIcons name="open-in-new" size={15} color={CORES.textNavy} /></TouchableOpacity>}
              </View>
            </Card.Content></Card>
          ) : <EmptyState texto="Nenhum local foi incluído neste evento." />}
          {local && editando !== 'local' && <TouchableOpacity accessibilityRole="button" onPress={() => iniciarEdicao('local')} style={styles.editPrimaryButton}>
            <MaterialCommunityIcons name="pencil-outline" size={18} color={CORES.textNavy} />
            <Text style={styles.editPrimaryText}>Editar local</Text>
          </TouchableOpacity>}
        </>}

        {abaAtiva === 'Equipe' && <>
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionTitle}>Equipe de campo</Text>
            <Text style={styles.teamCount}>{equipe.length} atribuídos</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setModalEquipeVisivel(true)}
            style={styles.addTeamButton}
          >
            <MaterialCommunityIcons name="plus" size={19} color={CORES.textNavy} />
            <Text style={styles.addTeamButtonText}>Adicionar profissional de campo</Text>
          </TouchableOpacity>
          {!!erroConvites && <Text accessibilityRole="alert" style={styles.editError}>{erroConvites}</Text>}
          {equipe.length ? (
            <Card style={styles.card}><Card.Content>
              {equipe.map((pessoa, index) => (
                <View key={pessoa.id || index} style={styles.personRow}>
                  <View style={styles.personIcon}><MaterialCommunityIcons name="video-outline" size={19} color={CORES.textNavy} /></View>
                  <View style={styles.personInfo}>
                    <Text style={styles.personName}>{pessoa.funcao || pessoa.tipoProfissional || 'Profissional'}</Text>
                    <Text style={styles.personMeta}>{pessoa.nomeProfissional || pessoa.nome || 'Nome pendente'} · <Text style={pessoa.statusConfirmacao === 'Confirmado' ? styles.confirmedText : styles.pendingText}>{pessoa.statusConfirmacao || 'Pendente'}</Text></Text>
                  </View>
                </View>
              ))}
            </Card.Content></Card>
          ) : <EmptyState texto="Nenhum profissional foi adicionado à equipe deste evento." />}
        </>}

        {abaAtiva === 'Financeiro' && <>
          {valoresFinanceiros.length ? (
            <>
              <View style={styles.financeCard}>
                <Text style={styles.financeLabel}>Valor total do evento</Text>
                <Text style={styles.financeTotal}>{valoresFinanceiros[0][1]}</Text>
                <View style={styles.financeDivider} />
                <View style={styles.financeSummaryRow}>
                  {valoresFinanceiros.slice(1).map(([label, valor]) => <View key={label} style={styles.financeSummaryItem}><Text style={styles.financeLabel}>{label}</Text><Text style={styles.financeAmount}>{valor}</Text></View>)}
                </View>
              </View>
              {financeiro.parcelas ? <Card style={styles.card}><Card.Content><Linha icone="calendar-month-outline" titulo="Parcelas" valor={String(financeiro.parcelas)} /></Card.Content></Card> : null}
            </>
          ) : <>
            <Text style={styles.sectionTitle}>Resumo financeiro</Text>
            <EmptyState texto="Os dados financeiros deste evento ainda não foram registrados." />
          </>}
        </>}
      </ScrollView>
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
