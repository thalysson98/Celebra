import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Keyboard, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Card } from 'react-native-paper';
import { CORES } from '../../tema/cores';
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
  if (categoria.chave === 'locaisSalvos') return item.endereco_completo || [item.cidade, item.estado].filter(Boolean).join(' • ') || item.rua || 'Local cadastrado';
  return 'Disponível em novos eventos';
};

export default function TelaAdministrandoOrganizador({ usuario }) {
  const [categoriaAtiva, setCategoriaAtiva] = useState(CATEGORIAS[0]);
  const [itens, setItens] = useState([]);
  const [busca, setBusca] = useState('');
  const [mostrarArquivados, setMostrarArquivados] = useState(false);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);
  const [nome, setNome] = useState('');
  const [dadosComplementares, setDadosComplementares] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [tiposLocal, setTiposLocal] = useState([]);
  const empresaId = usuario?.idEmpresa || usuario?.companyId;

  const carregarItens = useCallback(async () => {
    if (!empresaId) {
      setItens([]);
      setErro('Esta conta ainda não está vinculada a uma empresa.');
      return;
    }
    setCarregando(true);
    setErro('');
    try {
      const lista = await repositorioEventos.obterOpcoesSelect(categoriaAtiva.chave, empresaId, mostrarArquivados);
      setItens(lista || []);
    } catch (error) {
      setItens([]);
      setErro(error?.code === 'permission-denied'
        ? 'O Firebase bloqueou este acesso. Confirme se as regras do Firestore foram publicadas.'
        : 'Não foi possível carregar os cadastros. Verifique sua conexão e tente novamente.');
    } finally {
      setCarregando(false);
    }
  }, [categoriaAtiva, empresaId, mostrarArquivados]);

  useFocusEffect(useCallback(() => { carregarItens(); }, [carregarItens]));

  const abrirCadastro = (item = null) => {
    setItemEditando(item);
    setNome(item ? obterNome(item) : '');
    setDadosComplementares({
      documento: item?.documento || '',
      email: item?.email || '',
      telefone: item?.telefone || '',
      observacoes: item?.observacoes || item?.descricao || '',
      endereco_completo: item?.endereco_completo || '',
      id_tipo_local: item?.id_tipo_local || '',
      capacidade: item?.capacidade ? String(item.capacidade) : '',
    });
    if (categoriaAtiva.chave === 'locaisSalvos') {
      repositorioEventos.obterOpcoesSelect('tiposLocal', empresaId)
        .then(setTiposLocal)
        .catch(() => setTiposLocal([]));
    }
    setModalVisivel(true);
  };

  const salvar = async () => {
    const valor = nome.trim();
    if (!valor) return;
    if (categoriaAtiva.chave === 'locaisSalvos' && !dadosComplementares.endereco_completo.trim()) {
      Alert.alert('Endereço obrigatório', 'Informe o endereço completo do local.');
      return;
    }
    if (categoriaAtiva.chave === 'locaisSalvos' && !dadosComplementares.id_tipo_local) {
      Alert.alert('Tipo de local obrigatório', tiposLocal.length
        ? 'Selecione uma categoria para este local.'
        : 'Cadastre um tipo de local antes de adicionar um local.');
      return;
    }
    setSalvando(true);
    try {
      const dados = {
        nome: valor,
        ...(categoriaAtiva.chave === 'clientes' && {
          documento: dadosComplementares.documento.trim(),
          email: dadosComplementares.email.trim(),
          telefone: dadosComplementares.telefone.trim(),
          observacoes: dadosComplementares.observacoes.trim(),
        }),
        ...(['tiposEvento', 'tiposProfissional', 'tiposLocal'].includes(categoriaAtiva.chave) && { descricao: dadosComplementares.observacoes.trim() }),
        ...(categoriaAtiva.chave === 'locaisSalvos' && { endereco_completo: dadosComplementares.endereco_completo.trim() }),
        ...(categoriaAtiva.chave === 'locaisSalvos' && {
          id_tipo_local: dadosComplementares.id_tipo_local,
          capacidade: Number(dadosComplementares.capacidade) || 0,
          observacoes: dadosComplementares.observacoes.trim(),
        }),
      };
      if (itemEditando) await repositorioEventos.atualizarItemSelect(categoriaAtiva.chave, itemEditando.id, dados, empresaId);
      else await repositorioEventos.adicionarNovoItemSelect(categoriaAtiva.chave, dados, empresaId);
      setModalVisivel(false);
      setNome('');
      await carregarItens();
    } catch (error) {
      Alert.alert('Não foi possível salvar', error?.code === 'permission-denied'
        ? 'O Firebase bloqueou a gravação. Confirme se as regras do Firestore foram publicadas.'
        : 'Verifique sua conexão e tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const arquivar = (item) => {
    Alert.alert(
      `Arquivar ${categoriaAtiva.singular}`,
      `“${obterNome(item)}” deixará de aparecer nos cadastros ativos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Arquivar',
          style: 'destructive',
          onPress: async () => {
            try {
              await repositorioEventos.arquivarItemSelect(categoriaAtiva.chave, item.id, empresaId);
              await carregarItens();
            } catch (error) {
              Alert.alert('Não foi possível arquivar', error?.code === 'permission-denied'
                ? 'O Firebase bloqueou esta alteração. Confirme se as regras do Firestore foram publicadas.'
                : 'Verifique sua conexão e tente novamente.');
            }
          },
        },
      ],
    );
  };

  const reativar = async (item) => {
    try {
      await repositorioEventos.reativarItemSelect(categoriaAtiva.chave, item.id, empresaId);
      await carregarItens();
    } catch (error) {
      Alert.alert('Não foi possível reativar', error?.code === 'permission-denied'
        ? 'O Firebase bloqueou esta alteração. Confirme se as regras do Firestore foram publicadas.'
        : 'Verifique sua conexão e tente novamente.');
    }
  };

  const itensFiltrados = itens.filter((item) => obterNome(item).toLocaleLowerCase('pt-BR').includes(busca.trim().toLocaleLowerCase('pt-BR')));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Minha empresa</Text>
          <Text style={styles.subtitle}>Administrando seu negócio</Text>
        </View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Notificações" style={styles.notificationButton}>
          <Feather name="bell" size={19} color={CORES.textWhite} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
        {CATEGORIAS.map((categoria) => {
          const ativo = categoriaAtiva.chave === categoria.chave;
          return (
            <TouchableOpacity key={categoria.chave} onPress={() => { setCategoriaAtiva(categoria); setBusca(''); setMostrarArquivados(false); }} style={[styles.tab, ativo && styles.tabAtiva]}>
              <Text style={[styles.tabText, ativo && styles.tabTextAtiva]}>{categoria.titulo}</Text>
            </TouchableOpacity>
          );
        })}
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
              <Text style={styles.listTitle}>{categoriaAtiva.titulo}</Text>
              <Card style={styles.listCard}>
                <Card.Content style={styles.cardContent}>
                  <View style={styles.searchRow}>
                    <View style={styles.searchBox}>
                      <Feather name="search" size={17} color={CORES.textMuted} />
                      <TextInput value={busca} onChangeText={setBusca} placeholder={`Buscar ${categoriaAtiva.titulo.toLowerCase()}`} placeholderTextColor={CORES.textSubtle} style={styles.searchInput} returnKeyType="search" />
                    </View>
                    <Button mode="contained" onPress={Keyboard.dismiss} buttonColor={CORES.buttonGold} textColor={CORES.textNavy} style={styles.searchButton} contentStyle={styles.searchButtonContent}>Buscar</Button>
                  </View>
                  <View style={styles.listActions}>
                    {!mostrarArquivados && <Button mode="contained" icon="plus" onPress={() => abrirCadastro()} buttonColor={CORES.buttonGold} textColor={CORES.textNavy} style={styles.addButton} contentStyle={styles.addButtonContent}>
                      Adicionar {categoriaAtiva.singular}
                    </Button>}
                    <Button mode="text" icon={mostrarArquivados ? 'archive-arrow-up' : 'archive-outline'} onPress={() => setMostrarArquivados((atual) => !atual)} textColor={CORES.textNavy} style={styles.archiveToggle}>
                      {mostrarArquivados ? 'Ver ativos' : 'Ver arquivados'}
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </>
          )}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <View style={styles.itemText}>
                <Text style={styles.itemName}>{obterNome(item)}</Text>
                <Text style={styles.itemDetail}>{obterDetalhe(categoriaAtiva, item)}</Text>
              </View>
              {mostrarArquivados ? (
                <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Reativar ${obterNome(item)}`} style={styles.editButton} onPress={() => reativar(item)}>
                  <MaterialCommunityIcons name="archive-arrow-up-outline" size={19} color={CORES.textMuted} />
                </TouchableOpacity>
              ) : <>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Editar ${obterNome(item)}`} style={styles.editButton} onPress={() => abrirCadastro(item)}>
                  <MaterialCommunityIcons name="pencil-outline" size={19} color={CORES.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Arquivar ${obterNome(item)}`} style={styles.editButton} onPress={() => arquivar(item)}>
                  <MaterialCommunityIcons name="archive-outline" size={19} color={CORES.textMuted} />
                </TouchableOpacity>
              </>}
            </View>
          )}
          ListEmptyComponent={<View style={styles.empty}>{carregando ? <Text style={styles.emptyText}>Carregando cadastros...</Text> : erro ? <><MaterialCommunityIcons name="alert-circle-outline" size={30} color={CORES.textSubtle} /><Text style={styles.emptyText}>{erro}</Text><Button mode="text" onPress={carregarItens} textColor={CORES.textNavy}>Tentar novamente</Button></> : <><MaterialCommunityIcons name="text-search" size={30} color={CORES.textSubtle} /><Text style={styles.emptyText}>{busca ? 'Nenhum cadastro encontrado.' : mostrarArquivados ? 'Não há cadastros arquivados nesta categoria.' : 'Ainda não há cadastros nesta categoria.'}</Text></>}</View>}
        />
      </View>

      <Modal visible={modalVisivel} transparent animationType="fade" onRequestClose={() => setModalVisivel(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalCard} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>{itemEditando ? 'Editar' : 'Adicionar'} {categoriaAtiva.singular}</Text>
            <Text style={styles.inputLabel}>Nome</Text>
            <TextInput autoFocus value={nome} onChangeText={setNome} placeholder={`Nome do ${categoriaAtiva.singular}`} style={styles.modalInput} returnKeyType="next" />
            {categoriaAtiva.chave === 'clientes' && <>
              <Text style={styles.inputLabel}>CPF ou CNPJ</Text>
              <TextInput value={dadosComplementares.documento} onChangeText={(v) => setDadosComplementares((atual) => ({ ...atual, documento: v }))} style={styles.modalInput} keyboardType="numeric" />
              <Text style={styles.inputLabel}>E-mail</Text>
              <TextInput value={dadosComplementares.email} onChangeText={(v) => setDadosComplementares((atual) => ({ ...atual, email: v }))} style={styles.modalInput} keyboardType="email-address" autoCapitalize="none" />
              <Text style={styles.inputLabel}>Telefone</Text>
              <TextInput value={dadosComplementares.telefone} onChangeText={(v) => setDadosComplementares((atual) => ({ ...atual, telefone: v }))} style={styles.modalInput} keyboardType="phone-pad" />
              <Text style={styles.inputLabel}>Observações</Text>
              <TextInput value={dadosComplementares.observacoes} onChangeText={(v) => setDadosComplementares((atual) => ({ ...atual, observacoes: v }))} style={[styles.modalInput, styles.multilineInput]} multiline />
            </>}
            {['tiposEvento', 'tiposProfissional', 'tiposLocal'].includes(categoriaAtiva.chave) && <>
              <Text style={styles.inputLabel}>Descrição (opcional)</Text>
              <TextInput value={dadosComplementares.observacoes} onChangeText={(v) => setDadosComplementares((atual) => ({ ...atual, observacoes: v }))} style={[styles.modalInput, styles.multilineInput]} multiline />
            </>}
            {categoriaAtiva.chave === 'locaisSalvos' && <>
              <Text style={styles.inputLabel}>Tipo de local</Text>
              {tiposLocal.length ? <View style={styles.typeChoices}>{tiposLocal.map((tipo) => {
                const selecionado = dadosComplementares.id_tipo_local === tipo.id;
                return <TouchableOpacity key={tipo.id} onPress={() => setDadosComplementares((atual) => ({ ...atual, id_tipo_local: tipo.id }))} style={[styles.typeChoice, selecionado && styles.typeChoiceSelected]}><Text style={[styles.typeChoiceText, selecionado && styles.typeChoiceTextSelected]}>{obterNome(tipo)}</Text></TouchableOpacity>;
              })}</View> : <Text style={styles.helperText}>Cadastre um tipo de local antes de vinculá-lo.</Text>}
              <Text style={styles.inputLabel}>Endereço completo *</Text>
              <TextInput value={dadosComplementares.endereco_completo} onChangeText={(v) => setDadosComplementares((atual) => ({ ...atual, endereco_completo: v }))} style={styles.modalInput} multiline />
              <Text style={styles.inputLabel}>Capacidade</Text>
              <TextInput value={dadosComplementares.capacidade} onChangeText={(v) => setDadosComplementares((atual) => ({ ...atual, capacidade: v }))} style={styles.modalInput} keyboardType="numeric" />
              <Text style={styles.inputLabel}>Observações</Text>
              <TextInput value={dadosComplementares.observacoes} onChangeText={(v) => setDadosComplementares((atual) => ({ ...atual, observacoes: v }))} style={[styles.modalInput, styles.multilineInput]} multiline />
            </>}
            <View style={styles.modalActions}>
              <Button onPress={() => setModalVisivel(false)} textColor={CORES.textMuted}>Cancelar</Button>
              <Button mode="contained" onPress={salvar} loading={salvando} disabled={!nome.trim() || salvando || !empresaId} buttonColor={CORES.buttonGold} textColor={CORES.textNavy}>Salvar</Button>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
