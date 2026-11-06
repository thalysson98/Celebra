// src/telas/organizador/TelaAdministrandoOrganizador.js
import React, { useCallback, useState } from 'react';
import { FlatList, Keyboard, Modal, ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Card } from 'react-native-paper';

import { CORES, FONTES } from '../../tema/cores';
import { styles } from '../../estilos/estilosAdministrandoOrganizador';
import { repositorioEventos } from '../../servicos/repositorioEventos';

const CATEGORIAS = [
  { chave: 'tiposEvento', titulo: 'Tipos de evento', singular: 'tipo de evento', descricao: 'Personalize os tipos usados em todos os eventos.' },
  { chave: 'tiposProfissional', titulo: 'Tipos de profissional', singular: 'tipo de profissional', descricao: 'Organize as funções da equipe de campo.' },
  { chave: 'tiposLocal', titulo: 'Tipos de local', singular: 'tipo de local', descricao: 'Classifique os locais usados nos eventos.' },
  { chave: 'locaisSalvos', titulo: 'Locais', singular: 'local', descricao: 'Gerencie os espaços utilizados pela empresa.' },
  { chave: 'clientes', titulo: 'Clientes', singular: 'cliente', descricao: 'Consulte e mantenha os dados dos clientes.' },
];

const obterNome = (item) => item.nome || item.nomeDoLocal || '';
const obterDetalhe = (categoria, item) => {
  if (categoria.chave === 'clientes') return item.telefone || item.email || 'Cadastro de cliente';
  if (categoria.chave === 'locaisSalvos') return item.endereco_completo || [item.cidade, item.estado].filter(Boolean).join(' - ') || item.rua || 'Local cadastrado';
  return 'Disponível em novos eventos';
};

const formatarCpfCnpj = (valor) => {
  const v = String(valor).replace(/\D/g, '');
  if (v.length <= 11) {
    return v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    return v.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
};

export default function TelaAdministrandoOrganizador({ usuario, navigation }) {
  const [categoriaAtiva, setCategoriaAtiva] = useState(CATEGORIAS[0]);
  const [itens, setItens] = useState([]);
  const [inativos, setInativos] = useState([]);
  const [busca, setBusca] = useState('');

  const [modalInativosVisivel, setModalInativosVisivel] = useState(false);
  const [modalCadastroVisivel, setModalCadastroVisivel] = useState(false);
  const [modalInativarVisivel, setModalInativarVisivel] = useState(false);
  
  // Modais Padronizados
  const [modalSucessoVisivel, setModalSucessoVisivel] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState({ titulo: '', descricao: '' });
  const [modalErroVisivel, setModalErroVisivel] = useState(false);
  const [msgErro, setMsgErro] = useState('');

  const [itemParaInativar, setItemParaInativar] = useState(null);
  const [modoLeitura, setModoLeitura] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);
  const [nome, setNome] = useState('');
  const [dadosComplementares, setDadosComplementares] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [tiposLocal, setTiposLocal] = useState([]);

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
    if (!empresaId) { setItens([]); return; }
    setCarregando(true);
    try {
      const listaAtivos = await repositorioEventos.obterOpcoesSelect(categoriaAtiva.chave, empresaId, false);
      setItens(listaAtivos || []);
    } catch (error) {
      mostrarErro('Não foi possível carregar os cadastros.');
    } finally { setCarregando(false); }
  }, [categoriaAtiva, empresaId]);

  const carregarInativos = async () => {
    setCarregando(true);
    try {
      const listaGeral = await repositorioEventos.obterOpcoesSelect(categoriaAtiva.chave, empresaId, true);
      const listaInativos = listaGeral.filter(i => i.ativo === false);
      setInativos(listaInativos || []);
      setModalInativosVisivel(true);
    } catch (error) {
      mostrarErro('Não foi possível carregar inativos.');
    } finally { setCarregando(false); }
  };

  useFocusEffect(useCallback(() => { carregarItens(); }, [carregarItens]));

  const abrirCadastro = (item = null, somenteLeitura = false) => {
    setItemEditando(item);
    setModoLeitura(somenteLeitura);
    setNome(item ? obterNome(item) : '');
    setDadosComplementares({
      documento: item?.documento || '', email: item?.email || '', telefone: item?.telefone || '',
      observacoes: item?.observacoes || item?.descricao || '',
      rua: item?.rua || '', numero: item?.numero || '', bairro: item?.bairro || '', cidade: item?.cidade || '', estado: item?.estado || '',
    });
    if (categoriaAtiva.chave === 'locaisSalvos') {
      repositorioEventos.obterOpcoesSelect('tiposLocal', empresaId).then(setTiposLocal).catch(() => setTiposLocal([]));
    }
    setModalCadastroVisivel(true);
  };

  const salvar = async () => {
    const valor = nome.trim();
    if (!valor) return;

    if (categoriaAtiva.chave === 'clientes' && !dadosComplementares.documento?.trim()) {
      mostrarErro('CPF ou CNPJ é obrigatório.');
      return;
    }

    setSalvando(true);
    try {
      const enderecoCompleto = categoriaAtiva.chave === 'locaisSalvos'
        ? `${dadosComplementares.rua}, ${dadosComplementares.numero} - ${dadosComplementares.bairro}, ${dadosComplementares.cidade} - ${dadosComplementares.estado}`
        : '';

      const dados = {
        nome: valor,
        ...(categoriaAtiva.chave === 'clientes' && { documento: dadosComplementares.documento.trim(), email: dadosComplementares.email.trim(), telefone: dadosComplementares.telefone.trim(), observacoes: dadosComplementares.observacoes.trim() }),
        ...(['tiposEvento', 'tiposProfissional', 'tiposLocal'].includes(categoriaAtiva.chave) && { descricao: dadosComplementares.observacoes.trim() }),
        ...(categoriaAtiva.chave === 'locaisSalvos' && {
          endereco_completo: enderecoCompleto,
          rua: dadosComplementares.rua, numero: dadosComplementares.numero, bairro: dadosComplementares.bairro, cidade: dadosComplementares.cidade, estado: dadosComplementares.estado,
          observacoes: dadosComplementares.observacoes.trim()
        }),
      };

      if (itemEditando) await repositorioEventos.atualizarItemSelect(categoriaAtiva.chave, itemEditando.id, dados, empresaId);
      else await repositorioEventos.adicionarNovoItemSelect(categoriaAtiva.chave, dados, empresaId);

      setModalCadastroVisivel(false);
      setNome('');
      await carregarItens();
      mostrarSucesso("Sucesso", "Salvo com sucesso!");
    } catch (error) { mostrarErro("Verifique sua conexão e tente novamente."); } finally { setSalvando(false); }
  };

  const inativar = (item) => {
    setItemParaInativar(item);
    setModalInativarVisivel(true);
  };

  const confirmarInativacao = async () => {
    setModalInativarVisivel(false);
    try {
      const emUso = await repositorioEventos.verificarUsoEmEvento(categoriaAtiva.chave, itemParaInativar.id, empresaId);
      if (emUso) {
        mostrarErro("Este registro está em uso e não pode ser inativado.");
        return;
      }
      await repositorioEventos.arquivarItemSelect(categoriaAtiva.chave, itemParaInativar.id, empresaId);
      carregarItens();
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
        <TouchableOpacity style={styles.notificationButton} onPress={() => navigation?.navigate('Notificacoes')}>
          <Feather name="bell" size={19} color={CORES.textWhite} />
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
            </>
          )}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => abrirCadastro(item, true)} style={styles.itemText}>
                <Text style={styles.itemName}>{obterNome(item)}</Text>
                <Text style={styles.itemDetail}>{obterDetalhe(categoriaAtiva, item)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editButton} onPress={() => abrirCadastro(item)}>
                <MaterialCommunityIcons name="pencil-outline" size={19} color={CORES.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.editButton} onPress={() => inativar(item)}>
                <MaterialCommunityIcons name="archive-arrow-down-outline" size={19} color="#8A99A8" />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>{carregando ? 'Carregando...' : 'Nenhum cadastro ativo.'}</Text></View>}
        />
      </View>

      <Modal visible={modalCadastroVisivel} transparent animationType="fade" onRequestClose={() => setModalCadastroVisivel(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalCard} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modoLeitura ? `Detalhes` : `${itemEditando ? 'Editar' : 'Adicionar'} ${categoriaAtiva.singular}`}</Text>
              <TouchableOpacity onPress={() => setModalCadastroVisivel(false)} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={21} color={CORES.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nome</Text>
            <TextInput editable={!modoLeitura} value={nome} onChangeText={setNome} style={[styles.modalInput, modoLeitura && styles.readOnlyInput]} />

            {categoriaAtiva.chave === 'locaisSalvos' && <>
              <Text style={styles.inputLabel}>Rua / Endereço</Text>
              <TextInput editable={!modoLeitura} value={dadosComplementares.rua} onChangeText={(v) => setDadosComplementares((a) => ({ ...a, rua: v }))} style={[styles.modalInput, modoLeitura && styles.readOnlyInput]} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}><Text style={styles.inputLabel}>Número</Text><TextInput editable={!modoLeitura} value={dadosComplementares.numero} onChangeText={(v) => setDadosComplementares((a) => ({ ...a, numero: v }))} style={[styles.modalInput, modoLeitura && styles.readOnlyInput]} /></View>
                <View style={{ flex: 2 }}><Text style={styles.inputLabel}>Bairro</Text><TextInput editable={!modoLeitura} value={dadosComplementares.bairro} onChangeText={(v) => setDadosComplementares((a) => ({ ...a, bairro: v }))} style={[styles.modalInput, modoLeitura && styles.readOnlyInput]} /></View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 2 }}><Text style={styles.inputLabel}>Cidade</Text><TextInput editable={!modoLeitura} value={dadosComplementares.cidade} onChangeText={(v) => setDadosComplementares((a) => ({ ...a, cidade: v }))} style={[styles.modalInput, modoLeitura && styles.readOnlyInput]} /></View>
                <View style={{ flex: 1 }}><Text style={styles.inputLabel}>Estado</Text><TextInput editable={!modoLeitura} value={dadosComplementares.estado} onChangeText={(v) => setDadosComplementares((a) => ({ ...a, estado: v }))} style={[styles.modalInput, modoLeitura && styles.readOnlyInput]} /></View>
              </View>
            </>}

            {categoriaAtiva.chave === 'clientes' && <>
              <Text style={styles.inputLabel}>CPF ou CNPJ *</Text>
              <TextInput editable={!modoLeitura} value={dadosComplementares.documento} onChangeText={(v) => setDadosComplementares((a) => ({ ...a, documento: formatarCpfCnpj(v) }))} style={[styles.modalInput, modoLeitura && styles.readOnlyInput]} keyboardType="numeric" />
            </>}

            {categoriaAtiva.chave === 'clientes' && <>
              <Text style={styles.inputLabel}> E-mail</Text>
              <TextInput editable={!modoLeitura} value={dadosComplementares.email} onChangeText={(v) => setDadosComplementares((a) => ({ ...a }))} style={[styles.modalInput, modoLeitura && styles.readOnlyInput]} keyboardType="email" />
            </>}

            <View style={styles.modalActions}>
              <Button onPress={() => setModalCadastroVisivel(false)} textColor={CORES.textMuted}>Cancelar</Button>
              {!modoLeitura && <Button mode="contained" onPress={salvar} loading={salvando} buttonColor={CORES.buttonGold} textColor={CORES.textNavy}>Salvar</Button>}
            </View>
          </ScrollView>
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
            {inativos.length === 0 ? (
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

      {/* MODAL SUCESSO E ERRO GERAIS */}
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