import React, { useState } from 'react';
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
import { vincularFuncionario } from '../../servicos/servicoEmpresa';
import { estilosVinculoEmpresa as styles } from '../../estilos/estilosVinculoEmpresa';

export default function TelaVinculoEmpresa({ user, onLogout, onVinculoConcluido }) {
  const [codigo, setCodigo] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const concluir = async () => {
    if (!codigo.trim()) {
      setMensagemErro('Digite o código fornecido pelo administrador da empresa.');
      return;
    }

    setMensagemErro('');
    setSalvando(true);
    try {
      const perfil = await vincularFuncionario(codigo);
      onVinculoConcluido(perfil);
    } catch (erro) {
      const semPermissao = ['permission-denied', 'firestore/permission-denied'].includes(erro?.code);
      setMensagemErro(semPermissao
        ? 'Não foi possível validar esse ID. Confira com o administrador e confirme se as regras atualizadas do Firebase foram publicadas.'
        : erro?.message || 'Não foi possível vincular à empresa. Confira o ID e tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.tela}
    >
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <View style={styles.cabecalho}>
          <Text style={styles.marca}>Celebra ✦</Text>
          <Text style={styles.titulo}>Vincule sua empresa</Text>
          <Text style={styles.subtitulo}>Olá, {user?.name || 'colaborador'}. Digite o ID da empresa fornecido pelo administrador.</Text>
        </View>

        <View style={styles.cartao}>
          <Text style={styles.tituloCartao}>Vínculo com a empresa</Text>
          <Text style={styles.ajuda}>O código é o ID do documento da empresa no Firebase. Ao confirmar, sua conta será associada como funcionário.</Text>
          <View style={styles.grupoCampo}>
            <Text style={styles.rotulo}>ID da empresa</Text>
            <TextInput
              value={codigo}
              onChangeText={(valor) => {
                setCodigo(valor.replace(/\s/g, ''));
                if (mensagemErro) setMensagemErro('');
              }}
              placeholder="Ex.: kQXkMPQavUAzQmPxzisU"
              style={styles.campoCodigo}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
          </View>

          {!!mensagemErro && <Text accessibilityRole="alert" style={styles.erro}>{mensagemErro}</Text>}

          <TouchableOpacity
            accessibilityRole="button"
            onPress={concluir}
            disabled={salvando}
            style={[styles.botao, salvando && styles.botaoDesativado]}
          >
            {salvando
              ? <ActivityIndicator color="#07182C" />
              : <Text style={styles.textoBotao}>Vincular à empresa</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={onLogout} style={styles.botaoSair}>
            <Text style={styles.textoSair}>Sair da conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
