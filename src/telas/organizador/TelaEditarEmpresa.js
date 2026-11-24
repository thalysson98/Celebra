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
import Feather from '@expo/vector-icons/Feather';
import { obterDadosEmpresa, atualizarDadosEmpresa } from '../../servicos/servicoEmpresa';
import { estilosEditarEmpresa as styles } from '../../estilos/estilosEditarEmpresa';
import { CORES } from '../../tema/cores';

const ENDERECO_VAZIO = {
  rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '',
};

function Campo({ label, value, onChangeText, placeholder = '', teclado = 'default' }) {
  return (
    <View style={styles.grupo}>
      <Text style={styles.rotulo}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor={CORES.textSubtle}
        keyboardType={teclado}
        autoCapitalize={teclado === 'email-address' ? 'none' : 'sentences'}
        style={styles.campo}
      />
    </View>
  );
}

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
            <Campo label="Nome fantasia *" value={dados.nome_fantasia} onChangeText={(valor) => atualizarCampo('nome_fantasia', valor)} />
            <Campo label="Razão social" value={dados.razao_social} onChangeText={(valor) => atualizarCampo('razao_social', valor)} />
            <Campo label="CNPJ" value={dados.cnpj} onChangeText={(valor) => atualizarCampo('cnpj', valor)} teclado="numeric" />
            <Campo label="E-mail comercial" value={dados.email} onChangeText={(valor) => atualizarCampo('email', valor)} teclado="email-address" />
            <Campo label="Telefone comercial" value={dados.telefone} onChangeText={(valor) => atualizarCampo('telefone', valor)} teclado="phone-pad" />
          </View>

          <View style={styles.cartao}>
            <Text style={styles.tituloSecao}>Endereço</Text>
            <Campo label="Rua" value={dados.endereco.rua} onChangeText={(valor) => atualizarEndereco('rua', valor)} />
            <View style={styles.linha}>
              <View style={styles.flex}><Campo label="Número" value={dados.endereco.numero} onChangeText={(valor) => atualizarEndereco('numero', valor)} /></View>
              <View style={styles.flex}><Campo label="Complemento" value={dados.endereco.complemento} onChangeText={(valor) => atualizarEndereco('complemento', valor)} /></View>
            </View>
            <Campo label="Bairro" value={dados.endereco.bairro} onChangeText={(valor) => atualizarEndereco('bairro', valor)} />
            <View style={styles.linha}>
              <View style={styles.flex}><Campo label="Cidade" value={dados.endereco.cidade} onChangeText={(valor) => atualizarEndereco('cidade', valor)} /></View>
              <View style={styles.flex}><Campo label="Estado" value={dados.endereco.estado} onChangeText={(valor) => atualizarEndereco('estado', valor)} /></View>
            </View>
            <Campo label="CEP" value={dados.endereco.cep} onChangeText={(valor) => atualizarEndereco('cep', valor)} teclado="numeric" />
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
