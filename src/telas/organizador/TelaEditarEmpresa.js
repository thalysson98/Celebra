import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { obterDadosEmpresa, atualizarDadosEmpresa } from '../../servicos/servicoEmpresa';
import { estilosEditarEmpresa as styles } from '../../estilos/estilosEditarEmpresa';
import { CORES } from '../../tema/cores';

const ENDERECO_VAZIO = {
  rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '',
};

export default function TelaEditarEmpresa({ navigation, usuario, setCurrentUser }) {
  const [dados, setDados] = useState({
    nome_fantasia: '', razao_social: '', cnpj: '', email: '', telefone: '', endereco: ENDERECO_VAZIO,
  });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');

  useEffect(() => {
    let ativo = true;
    obterDadosEmpresa(usuario?.idEmpresa)
      .then((empresa) => {
        if (!ativo) return;
        setDados({
          nome_fantasia: empresa.nome_fantasia || '',
          razao_social: empresa.razao_social || '',
          cnpj: empresa.cnpj || '',
          email: empresa.email || '',
          telefone: empresa.telefone || '',
          endereco: { ...ENDERECO_VAZIO, ...(empresa.endereco || {}) },
        });
      })
      .catch((erro) => {
        if (ativo) setMensagemErro(erro?.message || 'Não foi possível carregar os dados da empresa.');
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => { ativo = false; };
  }, [usuario?.idEmpresa]);

  const atualizarCampo = (campo, valor) => setDados((atual) => ({ ...atual, [campo]: valor }));
  const atualizarEndereco = (campo, valor) => setDados((atual) => ({
    ...atual,
    endereco: { ...atual.endereco, [campo]: valor },
  }));

  const salvar = async () => {
    setMensagemErro('');
    setSalvando(true);
    try {
      const perfilAtualizado = await atualizarDadosEmpresa(usuario.idEmpresa, dados);
      setCurrentUser?.(perfilAtualizado);
      navigation.goBack();
    } catch (erro) {
      setMensagemErro(erro?.message || 'Não foi possível salvar os dados da empresa.');
    } finally {
      setSalvando(false);
    }
  };

  const Campo = ({ label, campo, placeholder = '', endereco = false, teclado = 'default' }) => (
    <View style={styles.grupo}>
      <Text style={styles.rotulo}>{label}</Text>
      <TextInput
        value={endereco ? dados.endereco[campo] : dados[campo]}
        onChangeText={(valor) => (endereco ? atualizarEndereco(campo, valor) : atualizarCampo(campo, valor))}
        placeholder={placeholder || label}
        placeholderTextColor={CORES.textSubtle}
        keyboardType={teclado}
        autoCapitalize={teclado === 'email-address' ? 'none' : 'sentences'}
        style={styles.campo}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.tela} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.cabecalho}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => navigation.goBack()} style={styles.voltar}>
          <Feather name="arrow-left" size={23} color={CORES.textWhite} />
        </TouchableOpacity>
        <View>
          <Text style={styles.tituloCabecalho}>Editar dados da empresa</Text>
          <Text style={styles.subtituloCabecalho}>Mantenha os dados do negócio atualizados</Text>
        </View>
      </View>

      {carregando ? (
        <View style={styles.carregando}><ActivityIndicator size="large" color={CORES.buttonGold} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
          <View style={styles.cartao}>
            <Text style={styles.tituloSecao}>Dados da empresa</Text>
            <Campo label="Nome fantasia *" campo="nome_fantasia" />
            <Campo label="Razão social" campo="razao_social" />
            <Campo label="CNPJ" campo="cnpj" teclado="numeric" />
            <Campo label="E-mail comercial" campo="email" teclado="email-address" />
            <Campo label="Telefone comercial" campo="telefone" teclado="phone-pad" />
          </View>

          <View style={styles.cartao}>
            <Text style={styles.tituloSecao}>Endereço</Text>
            <Campo label="Rua" campo="rua" endereco />
            <View style={styles.linha}>
              <View style={styles.flex}><Campo label="Número" campo="numero" endereco /></View>
              <View style={styles.flex}><Campo label="Complemento" campo="complemento" endereco /></View>
            </View>
            <Campo label="Bairro" campo="bairro" endereco />
            <View style={styles.linha}>
              <View style={styles.flex}><Campo label="Cidade" campo="cidade" endereco /></View>
              <View style={styles.flex}><Campo label="Estado" campo="estado" endereco /></View>
            </View>
            <Campo label="CEP" campo="cep" endereco teclado="numeric" />
          </View>

          {!!mensagemErro && <Text accessibilityRole="alert" style={styles.erro}>{mensagemErro}</Text>}

          <TouchableOpacity accessibilityRole="button" onPress={salvar} disabled={salvando} style={[styles.acao, salvando && styles.acaoDesativada]}>
            {salvando ? <ActivityIndicator color={CORES.textNavy} /> : <Text style={styles.textoAcao}>Salvar alterações</Text>}
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.cancelar}>
            <Text style={styles.textoCancelar}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}
