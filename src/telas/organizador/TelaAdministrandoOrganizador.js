
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Keyboard, Modal, ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Card } from 'react-native-paper';

import { CORES, FONTES } from '../../tema/cores';
import { styles } from '../../estilos/estilosAdministrandoOrganizador';
import { repositorioEventos } from '../../servicos/repositorioEventos';
import SeparadorCampoIcone from '../../compartilhado/SeparadorCampoIcone';
import { ESTADOS_BRASIL } from '../../compartilhado/estadosBrasil';

const CATEGORIAS = [
  { chave: 'tiposEvento', titulo: 'Tipos de evento', singular: 'tipo de evento', descricao: 'Personalize os tipos usados em todos os eventos.' },
  { chave: 'tiposProfissional', titulo: 'Tipos de profissional', singular: 'tipo de profissional', descricao: 'Organize as funções da equipe de campo.' },
  { chave: 'tiposLocal', titulo: 'Tipos de local', singular: 'tipo de local', descricao: 'Classifique os locais usados nos eventos.' },
  { chave: 'tiposDespesa', titulo: 'Tipos de despesa', singular: 'tipo de despesa', descricao: 'Padronize as despesas registradas para a equipe.' },
  { chave: 'locaisSalvos', titulo: 'Locais', singular: 'local', descricao: 'Gerencie os espaços utilizados pela empresa.' },
  { chave: 'clientes', titulo: 'Clientes', singular: 'cliente', descricao: 'Consulte e mantenha os dados dos clientes.' },
];

const obterNome = (item) => item.nome || item.nomeDoLocal || '';
const obterDetalhe = (categoria, item) => {
  if (categoria.chave === 'clientes') {
    const documento = item.documento || item.cpf_cnpj || item.cpf;
    const documentoFormatado = formatarCpfCnpj(documento || '');
    return `CPF: ${documentoFormatado || 'Não informado'}`;
  }
  if (categoria.chave === 'locaisSalvos') return item.endereco_completo || [item.cidade, item.estado].filter(Boolean).join(' - ') || item.rua || 'Local cadastrado';
  return '';
};

const formatarCpfCnpj = (valor) => {
  const v = String(valor).replace(/\D/g, '').slice(0, 14);
  if (v.length <= 11) {
    return v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    return v.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
};

const obterDigitosTelefoneBrasil = (valor) => {
  const texto = String(valor || '');
  let digitos = texto.replace(/\D/g, '');
  if (/^\s*\+55/.test(texto) || (digitos.startsWith('55') && digitos.length >= 12)) {
    digitos = digitos.slice(2);
  }
  return digitos.slice(0, 11);
};

const formatarTelefoneBrasil = (valor) => {
  const digitos = obterDigitosTelefoneBrasil(valor);
  if (!digitos) return '';

  const ddd = digitos.slice(0, 2);
  if (digitos.length <= 2) return `+55 (${ddd}`;

  const numero = digitos.slice(2);
  const tamanhoPrefixo = numero.startsWith('9') ? 5 : 4;
  const parteInicial = numero.slice(0, tamanhoPrefixo);
  const parteFinal = numero.slice(tamanhoPrefixo, tamanhoPrefixo + 4);
  return `+55 (${ddd}) ${parteInicial}${parteFinal ? `-${parteFinal}` : ''}`;
};

const CampoModal = ({ label, icone, editable = true, style, containerStyle, onFocus, onBlur, ...props }) => {
  const [focado, setFocado] = useState(false);

  return (
    <View style={[styles.modalField, style]}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <View
        style={[
          styles.modalInputContainer,
          focado && styles.modalInputContainerFocused,
          !editable && styles.readOnlyInput,
          containerStyle,
        ]}
        pointerEvents="box-none"
      >
        {icone ? (
          <>
            <Feather name={icone} size={17} color={focado ? CORES.textNavy : CORES.textMuted} pointerEvents="none" />
            <SeparadorCampoIcone />
          </>
        ) : null}
        <TextInput
          {...props}
          editable={editable}
          pointerEvents="auto"
          placeholderTextColor={CORES.textSubtle}
          onFocus={(e) => {
            setFocado(true);
            onFocus && onFocus(e);
          }}
          onBlur={(e) => {
            setFocado(false);
            onBlur && onBlur(e);
          }}
          style={styles.modalInput}
        />
      </View>
    </View>
  );
};

export default function TelaAdministrandoOrganizador({ usuario, navigation, totalNaoLidas = 0 }) {
  const [categoriaAtiva, setCategoriaAtiva] = useState(CATEGORIAS[0]);
  const [itens, setItens] = useState([]);
  const [inativos, setInativos] = useState([]);
  const [busca, setBusca] = useState('');

  const [modalInativosVisivel, setModalInativosVisivel] = useState(false);
  const [modalCadastroVisivel, setModalCadastroVisivel] = useState(false);
  const [modalInativarVisivel, setModalInativarVisivel] = useState(false);
  

  const [modalSucessoVisivel, setModalSucessoVisivel] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState({ titulo: '', descricao: '' });
  const [modalErroVisivel, setModalErroVisivel] = useState(false);
  const [msgErro, setMsgErro] = useState('');

  const [itemParaInativar, setItemParaInativar] = useState(null);
  const [modoLeitura, setModoLeitura] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);
  const [nome, setNome] = useState('');
  const [dadosComplementares, setDadosComplementares] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [tiposLocal, setTiposLocal] = useState([]);
  const [seletorEstadoVisivel, setSeletorEstadoVisivel] = useState(false);
  const [buscaEstado, setBuscaEstado] = useState('');

  const estadosFiltrados = useMemo(() => {
    const termo = buscaEstado.trim().toLowerCase();
    if (!termo) return ESTADOS_BRASIL;
    return ESTADOS_BRASIL.filter(
      (e) => e.sigla.toLowerCase().includes(termo) || e.nome.toLowerCase().includes(termo)
    );
  }, [buscaEstado]);

  const empresaId = usuario?.idEmpresa || usuario?.companyId;

  const mostrarSucesso = (titulo, descricao) => {
    setMsgSucesso({ titulo, descricao });
    setModalSucessoVisivel(true);
  };

  const mostrarErro = (mensagem) => {
    setMsgErro(mensagem);
    setModalErroVisivel(true);
  };

  const carregarItens = useCallback(async () => {
    if (!empresaId) { setItens([]); setCarregando(false); return; }
    setCarregando(true);
    try {
      const listaAtivos = await repositorioEventos.obterOpcoesSelect(categoriaAtiva.chave, empresaId, false);
      setItens(listaAtivos || []);
    } catch (error) {
      mostrarErro('Não foi possível carregar os cadastros.');
    } finally { setCarregando(false); }
  }, [categoriaAtiva, empresaId]);

  const carregarInativos = async () => {
    setModalInativosVisivel(true);
    setCarregando(true);
    try {
      const listaGeral = await repositorioEventos.obterOpcoesSelect(categoriaAtiva.chave, empresaId, true);
      const listaInativos = listaGeral.filter(i => i.ativo === false);
      setInativos(listaInativos || []);
    } catch (error) {
      setModalInativosVisivel(false);
      mostrarErro('Não foi possível carregar inativos.');
    } finally { setCarregando(false); }
  };

  useFocusEffect(useCallback(() => { carregarItens(); }, [carregarItens]));

  const abrirCadastro = (item = null, somenteLeitura = false) => {
    setItemEditando(item);
    setModoLeitura(somenteLeitura);
    setNome(item ? obterNome(item) : '');
    setSeletorEstadoVisivel(false);
    setBuscaEstado('');
    setDadosComplementares({
      documento: item?.documento || item?.cpf_cnpj || item?.cpf || '',
      email: item?.email || '',
      telefone: item?.telefone || '',
      observacoes: item?.observacoes || item?.descricao || '',
      rua: item?.rua || '',
      numero: item?.numero || '',
      bairro: item?.bairro || '',
      cidade: item?.cidade || '',
      estado: item?.estado || '',
    });
    if (categoriaAtiva.chave === 'locaisSalvos') {
      repositorioEventos.obterOpcoesSelect('tiposLocal', empresaId).then(setTiposLocal).catch(() => setTiposLocal([]));
    }
    setModalCadastroVisivel(true);
  };

  const salvar = async () => {
    const valor = nome.trim();
    if (!valor) {
      if (categoriaAtiva.chave === 'clientes') mostrarErro('Nome do cliente é obrigatório.');
      else if (categoriaAtiva.chave === 'locaisSalvos') mostrarErro('Nome do local é obrigatório.');
      else mostrarErro(`Nome do ${categoriaAtiva.singular} é obrigatório.`);
      return;
    }

    if (categoriaAtiva.chave === 'clientes' && !String(dadosComplementares.documento || '').replace(/\D/g, '')) {
      mostrarErro('CPF ou CNPJ é obrigatório.');
      return;
    }

    if (categoriaAtiva.chave === 'clientes' && dadosComplementares.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dadosComplementares.email.trim())) {
      mostrarErro('Informe um e-mail válido, como nome@dominio.com.');
      return;
    }

    const digitosTelefone = obterDigitosTelefoneBrasil(dadosComplementares.telefone);
    if (categoriaAtiva.chave === 'clientes' && digitosTelefone && digitosTelefone.length !== 10 && digitosTelefone.length !== 11) {
      mostrarErro('Informe um telefone com DDD e número completo.');
      return;
    }

    setSalvando(true);
    try {
      const enderecoCompleto = categoriaAtiva.chave === 'locaisSalvos'
        ? `${dadosComplementares.rua}, ${dadosComplementares.numero} - ${dadosComplementares.bairro}, ${dadosComplementares.cidade} - ${dadosComplementares.estado}`
        : '';

      const dados = {
        nome: valor,
        ...(categoriaAtiva.chave === 'clientes' && {
          documento: formatarCpfCnpj(dadosComplementares.documento),
          email: dadosComplementares.email ? dadosComplementares.email.trim() : '',
          telefone: formatarTelefoneBrasil(dadosComplementares.telefone),
          instagram: dadosComplementares.instagram ? dadosComplementares.instagram.trim() : '',
          observacoes: dadosComplementares.observacoes ? dadosComplementares.observacoes.trim() : '',
        }),
        ...(['tiposEvento', 'tiposProfissional', 'tiposLocal', 'tiposDespesa'].includes(categoriaAtiva.chave) && {
          descricao: dadosComplementares.observacoes ? dadosComplementares.observacoes.trim() : '',
        }),
        ...(categoriaAtiva.chave === 'locaisSalvos' && {
          endereco_completo: enderecoCompleto,
          rua: dadosComplementares.rua,
          numero: dadosComplementares.numero,
          bairro: dadosComplementares.bairro,
          cidade: dadosComplementares.cidade,
          estado: dadosComplementares.estado,
          observacoes: dadosComplementares.observacoes ? dadosComplementares.observacoes.trim() : '',
        }),
      };

      if (itemEditando) await repositorioEventos.atualizarItemSelect(categoriaAtiva.chave, itemEditando.id, dados, empresaId);
      else await repositorioEventos.adicionarNovoItemSelect(categoriaAtiva.chave, dados, empresaId);

      setModalCadastroVisivel(false);
      setNome('');
      await carregarItens();
      mostrarSucesso("Sucesso", "Salvo com sucesso!");
    } catch (error) { mostrarErro(error?.message || "Verifique sua conexão e tente novamente."); } finally { setSalvando(false); }
  };

  const inativar = (item) => {
    setItemParaInativar(item);
    setModalInativarVisivel(true);
  };

  const confirmarInativacao = async () => {
    setModalInativarVisivel(false);
    try {
      const podeInativarComHistorico = [
        'tiposEvento',
        'tiposProfissional',
        'tiposLocal',
        'tiposDespesa',
        'locaisSalvos',
      ].includes(categoriaAtiva.chave);

      if (!podeInativarComHistorico) {
        const emUso = await repositorioEventos.verificarUsoEmEvento(
          categoriaAtiva.chave,
          itemParaInativar.id,
          empresaId
        );
        if (emUso) {
          mostrarErro("Este registro está em uso e não pode ser inativado.");
          return;
        }
      }

      await repositorioEventos.arquivarItemSelect(categoriaAtiva.chave, itemParaInativar.id, empresaId);
      await carregarItens();
      mostrarSucesso("Sucesso", "Cadastro inativado.");
    } catch (e) {
      mostrarErro("Ocorreu um erro ao inativar o cadastro.");
    }
  };

  const reativar = async (item) => {
    try {
      await repositorioEventos.reativarItemSelect(categoriaAtiva.chave, item.id, empresaId);
      const listaAtualizada = inativos.filter(i => i.id !== item.id);
      setInativos(listaAtualizada);
      if (listaAtualizada.length === 0) setModalInativosVisivel(false);
      carregarItens();
      mostrarSucesso("Sucesso", "Cadastro reativado.");
    } catch (error) { mostrarErro("Verifique sua conexão e tente novamente."); }
  };

  const itensFiltrados = itens.filter((item) => obterNome(item).toLocaleLowerCase('pt-BR').includes(busca.trim().toLocaleLowerCase('pt-BR')));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Minha empresa</Text>
          <Text style={styles.subtitle}>Administrando seu negócio</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation?.navigate('Notificacoes')}
          accessibilityRole="button"
          accessibilityLabel="Abrir notificações"
        >
          <Feather name="bell" size={19} color={CORES.textWhite} />
          {totalNaoLidas > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {totalNaoLidas > 99 ? '99+' : totalNaoLidas}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
        {CATEGORIAS.map((categoria) => (
          <TouchableOpacity key={categoria.chave} onPress={() => { setCategoriaAtiva(categoria); setBusca(''); }} style={[styles.tab, categoriaAtiva.chave === categoria.chave && styles.tabAtiva]}>
            <Text style={[styles.tabText, categoriaAtiva.chave === categoria.chave && styles.tabTextAtiva]}>{categoria.titulo}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.sheet}>
        <FlatList
          data={itensFiltrados}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.conteudo}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={(
            <>
              <Text style={styles.sectionTitle}>Cadastros da empresa</Text>
              <Text style={styles.sectionSubtitle}>{categoriaAtiva.descricao}</Text>

              <Card style={styles.listCard}>
                <Card.Content style={styles.cardContent}>
                  <View style={styles.searchRow}>
                    <View style={styles.searchBox}>
                      <Feather name="search" size={17} color={CORES.textMuted} />
                      <SeparadorCampoIcone />
                      <TextInput value={busca} onChangeText={setBusca} placeholder={`Buscar ${categoriaAtiva.titulo.toLowerCase()}`} placeholderTextColor={CORES.textSubtle} style={styles.searchInput} />
                    </View>
                  </View>
                  <View style={styles.listActions}>
                    <Button mode="contained" icon="plus" onPress={() => abrirCadastro()} buttonColor={CORES.buttonGold} textColor={CORES.textNavy} style={styles.addButton}>
                      Adicionar {categoriaAtiva.singular}
                    </Button>
                    <Button mode="text" icon="archive-outline" onPress={carregarInativos} textColor={CORES.textNavy} style={styles.archiveToggle}>
                      Ver inativos
                    </Button>
                  </View>
                </Card.Content>
              </Card>
              {carregando && itensFiltrados.length > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 12 }}>
                  <ActivityIndicator size="small" color={CORES.buttonGold} />
                  <Text style={styles.emptyText}>Atualizando cadastros...</Text>
                </View>
              )}
            </>
          )}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => abrirCadastro(item, true)} style={styles.itemText}>
                <Text style={styles.itemName}>{obterNome(item)}</Text>
                {!!obterDetalhe(categoriaAtiva, item) && (
                  <Text style={styles.itemDetail}>{obterDetalhe(categoriaAtiva, item)}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.editButton} onPress={() => abrirCadastro(item)} accessibilityRole="button" accessibilityLabel={`Editar ${obterNome(item)}`}>
                <MaterialCommunityIcons name="pencil-outline" size={19} color={CORES.textNavy} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.editButton} onPress={() => inativar(item)} accessibilityRole="button" accessibilityLabel={`Inativar ${obterNome(item)}`}>
                <MaterialCommunityIcons name="archive-arrow-down-outline" size={19} color="#B45309" />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={(
            <View style={styles.empty}>
              {carregando ? (
                <>
                  <ActivityIndicator size="large" color={CORES.buttonGold} />
                  <Text style={styles.emptyText}>Carregando cadastros...</Text>
                </>
              ) : <Text style={styles.emptyText}>Nenhum cadastro ativo.</Text>}
            </View>
          )}
        />
      </View>

      <Modal
        visible={modalCadastroVisivel}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setModalCadastroVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            style={styles.modalCard}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
            nestedScrollEnabled
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modoLeitura ? `Detalhes` : `${itemEditando ? 'Editar' : 'Adicionar'} ${categoriaAtiva.singular}`}</Text>
              <TouchableOpacity
                onPress={() => setModalCadastroVisivel(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={21} color={CORES.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Campo Nome (presente em todas as abas/categorias) */}
            <CampoModal
              label={
                categoriaAtiva.chave === 'clientes'
                  ? 'Nome do cliente *'
                  : categoriaAtiva.chave === 'locaisSalvos'
                  ? 'Nome do local *'
                  : `Nome do ${categoriaAtiva.singular} *`
              }
              icone={
                categoriaAtiva.chave === 'clientes'
                  ? 'user'
                  : categoriaAtiva.chave === 'locaisSalvos'
                  ? 'map-pin'
                  : categoriaAtiva.chave === 'tiposEvento'
                  ? 'calendar'
                  : categoriaAtiva.chave === 'tiposProfissional'
                  ? 'briefcase'
                  : categoriaAtiva.chave === 'tiposDespesa'
                  ? 'dollar-sign'
                  : 'tag'
              }
              editable={!modoLeitura}
              value={nome}
              onChangeText={setNome}
              placeholder={
                categoriaAtiva.chave === 'clientes'
                  ? 'Ex: Maria Silva'
                  : categoriaAtiva.chave === 'locaisSalvos'
                  ? 'Ex: Espaço Celebrar'
                  : categoriaAtiva.chave === 'tiposEvento'
                  ? 'Ex: Casamento, Aniversário, Corporativo...'
                  : categoriaAtiva.chave === 'tiposProfissional'
                  ? 'Ex: Técnico de Som, Iluminador, DJ...'
                  : categoriaAtiva.chave === 'tiposLocal'
                  ? 'Ex: Salão de Festas, Buffet, Chácara...'
                  : categoriaAtiva.chave === 'tiposDespesa'
                  ? 'Ex: Alimentação, Transporte, Hospedagem...'
                  : `Digite o nome do ${categoriaAtiva.singular}`
              }
            />

            {/* Campos específicos da aba Locais */}
            {categoriaAtiva.chave === 'locaisSalvos' && (
              <>
                <CampoModal
                  label="Rua / Endereço"
                  icone="map-pin"
                  editable={!modoLeitura}
                  value={dadosComplementares.rua}
                  onChangeText={(v) => setDadosComplementares((a) => ({ ...a, rua: v }))}
                  placeholder="Ex: Av. Paulista ou Rua das Flores"
                />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <CampoModal
                    style={{ flex: 1 }}
                    label="Número"
                    icone="hash"
                    editable={!modoLeitura}
                    value={dadosComplementares.numero}
                    onChangeText={(v) => setDadosComplementares((a) => ({ ...a, numero: v }))}
                    placeholder="123"
                  />
                  <CampoModal
                    style={{ flex: 2 }}
                    label="Bairro"
                    icone="map"
                    editable={!modoLeitura}
                    value={dadosComplementares.bairro}
                    onChangeText={(v) => setDadosComplementares((a) => ({ ...a, bairro: v }))}
                    placeholder="Centro"
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <CampoModal
                    style={{ flex: 2 }}
                    label="Cidade"
                    icone="globe"
                    editable={!modoLeitura}
                    value={dadosComplementares.cidade}
                    onChangeText={(v) => setDadosComplementares((a) => ({ ...a, cidade: v }))}
                    placeholder="São Paulo"
                  />
                  <View style={{ flex: 1, marginBottom: 14 }}>
                    <Text style={styles.inputLabel}>Estado</Text>
                    <TouchableOpacity
                      activeOpacity={modoLeitura ? 1 : 0.7}
                      onPress={() => {
                        if (!modoLeitura) {
                          Keyboard.dismiss();
                          setSeletorEstadoVisivel(true);
                        }
                      }}
                      style={[
                        styles.modalInputContainer,
                        seletorEstadoVisivel && styles.modalInputContainerFocused,
                        modoLeitura && styles.readOnlyInput,
                        { justifyContent: 'space-between', paddingRight: 10 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Selecionar Estado"
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Feather name="flag" size={17} color={CORES.textMuted} />
                        <SeparadorCampoIcone />
                        <Text
                          style={[
                            styles.modalInputText,
                            !dadosComplementares.estado && { color: CORES.textSubtle },
                          ]}
                          numberOfLines={1}
                        >
                          {dadosComplementares.estado || 'UF'}
                        </Text>
                      </View>
                      {!modoLeitura && (
                        <Feather name="chevron-down" size={16} color={CORES.textMuted} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {/* Campos específicos da aba Clientes */}
            {categoriaAtiva.chave === 'clientes' && (
              <>
                <CampoModal
                  label="CPF ou CNPJ *"
                  icone="file-text"
                  editable={!modoLeitura}
                  value={dadosComplementares.documento}
                  onChangeText={(v) => setDadosComplementares((a) => ({ ...a, documento: formatarCpfCnpj(v) }))}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  keyboardType="numeric"
                />
                <CampoModal
                  label="E-mail"
                  icone="mail"
                  editable={!modoLeitura}
                  value={dadosComplementares.email}
                  onChangeText={(v) => setDadosComplementares((a) => ({ ...a, email: v }))}
                  placeholder="cliente@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <CampoModal
                  label="Telefone / WhatsApp"
                  icone="phone"
                  editable={!modoLeitura}
                  value={dadosComplementares.telefone}
                  onChangeText={(v) => setDadosComplementares((a) => ({ ...a, telefone: formatarTelefoneBrasil(v) }))}
                  placeholder="+55 (00) 00000-0000"
                  keyboardType="phone-pad"
                />
              </>
            )}

            <View style={styles.modalActions}>
              <Button onPress={() => setModalCadastroVisivel(false)} textColor={CORES.textMuted}>Cancelar</Button>
              {!modoLeitura && <Button mode="contained" onPress={salvar} loading={salvando} buttonColor={CORES.buttonGold} textColor={CORES.textNavy}>Salvar</Button>}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal Seletor de Estados do Brasil (por cima de tudo) */}
      <Modal
        visible={seletorEstadoVisivel}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          setSeletorEstadoVisivel(false);
          setBuscaEstado('');
        }}
      >
        <View style={styles.seletorOverlay}>
          <View style={styles.seletorCard}>
            <View style={styles.seletorHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="map-pin" size={19} color={CORES.buttonGold} />
                <Text style={styles.seletorTitle}>Selecione o Estado</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSeletorEstadoVisivel(false);
                  setBuscaEstado('');
                }}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Fechar seleção de estado"
              >
                <MaterialCommunityIcons name="close" size={22} color={CORES.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.seletorSearchBox}>
              <Feather name="search" size={16} color={CORES.textMuted} />
              <SeparadorCampoIcone />
              <TextInput
                value={buscaEstado}
                onChangeText={setBuscaEstado}
                placeholder="Buscar estado ou sigla..."
                placeholderTextColor={CORES.textSubtle}
                style={styles.seletorSearchInput}
                autoCapitalize="words"
              />
              {buscaEstado.length > 0 && (
                <TouchableOpacity onPress={() => setBuscaEstado('')}>
                  <MaterialCommunityIcons name="close-circle" size={16} color={CORES.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={estadosFiltrados}
              keyExtractor={(item) => item.sigla}
              style={styles.seletorList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const selecionado = dadosComplementares.estado === item.sigla;
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.estadoItem, selecionado && styles.estadoItemSelecionado]}
                    onPress={() => {
                      setDadosComplementares((a) => ({ ...a, estado: item.sigla }));
                      setSeletorEstadoVisivel(false);
                      setBuscaEstado('');
                    }}
                  >
                    <View style={[styles.estadoSiglaBadge, selecionado && styles.estadoSiglaBadgeSelecionado]}>
                      <Text style={[styles.estadoSiglaTexto, selecionado && styles.estadoSiglaTextoSelecionado]}>
                        {item.sigla}
                      </Text>
                    </View>
                    <Text style={[styles.estadoNomeTexto, selecionado && styles.estadoNomeTextoSelecionado]}>
                      {item.nome}
                    </Text>
                    {selecionado && (
                      <Feather name="check" size={18} color={CORES.buttonGold} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Text style={{ fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 13 }}>
                    Nenhum estado encontrado.
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      <Modal visible={modalInativarVisivel} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center' }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#F0F6FA', justifyContent: 'center', alignItems: 'center', marginBottom: 15 }}>
              <MaterialCommunityIcons name="archive-arrow-down-outline" size={30} color={CORES.textNavy} />
            </View>
            <Text style={{ fontFamily: FONTES.bold, fontSize: 18, color: CORES.textNavy, marginBottom: 8, textAlign: 'center' }}>Inativar Cadastro?</Text>
            <Text style={{ fontFamily: FONTES.body, fontSize: 14, color: CORES.textMuted, textAlign: 'center', marginBottom: 20, lineHeight: 20 }}>
              Deseja realmente inativar <Text style={{ fontWeight: 'bold' }}>{itemParaInativar?.nome}</Text>?
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <Button mode="outlined" style={{ flex: 1, borderRadius: 10 }} textColor={CORES.textNavy} onPress={() => setModalInativarVisivel(false)}>Cancelar</Button>
              <Button mode="contained" style={{ flex: 1, borderRadius: 10 }} buttonColor="#10B981" textColor="#FFF" onPress={confirmarInativacao}>Inativar</Button>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalInativosVisivel} transparent animationType="slide" onRequestClose={() => setModalInativosVisivel(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '70%', padding: 0 }]}>
            <View style={[styles.modalHeader, { padding: 20, marginBottom: 0, borderBottomWidth: 1, borderColor: '#EEE' }]}>
              <Text style={styles.modalTitle}>Cadastros Inativos</Text>
              <TouchableOpacity onPress={() => setModalInativosVisivel(false)}>
                <MaterialCommunityIcons name="close" size={24} color={CORES.textMuted} />
              </TouchableOpacity>
            </View>
            {carregando ? (
              <View style={{ padding: 30, alignItems: 'center', gap: 12 }}>
                <ActivityIndicator size="large" color={CORES.buttonGold} />
                <Text style={styles.emptyText}>Carregando cadastros inativos...</Text>
              </View>
            ) : inativos.length === 0 ? (
              <View style={{ padding: 30, alignItems: 'center' }}><Text>Nenhum registro inativo.</Text></View>
            ) : (
              <FlatList
                data={inativos}
                keyExtractor={i => i.id}
                renderItem={({ item }) => (
                  <View style={[styles.itemRow, { paddingRight: 16 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{obterNome(item)}</Text>
                    </View>
                    <Button mode="contained" onPress={() => reativar(item)} buttonColor="#10B981" textColor="#FFF" compact>Reativar</Button>
                  </View>
                )}
              />
            )}
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

    </View>
  );
}