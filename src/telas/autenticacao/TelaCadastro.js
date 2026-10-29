import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { estilosAutenticacao, CORES_AUTENTICACAO } from '../../estilos/estilosAutenticacao';
import { registrarUsuario } from '../../servicos/servicoAutenticacao';

export default function TelaCadastro({ navigation, onRegisterSuccess }) {
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [tecladoVisivel, setTecladoVisivel] = useState(false);

  useEffect(() => {
    const eventoMostrar = Keyboard.addListener('keyboardDidShow', () => setTecladoVisivel(true));
    const eventoOcultar = Keyboard.addListener('keyboardDidHide', () => setTecladoVisivel(false));
    return () => {
      eventoMostrar.remove();
      eventoOcultar.remove();
    };
  }, []);

  const lidarComCadastro = async () => {
    if (!nomeCompleto.trim() || !email.trim() || !senha || !confirmarSenha) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos.');
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Atenção', 'As senhas digitadas não coincidem.');
      return;
    }

    if (senha.length < 6) {
      Alert.alert('Atenção', 'A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    try {
      setCarregando(true);
      const novoUsuario = await registrarUsuario({
        nomeCompleto,
        email,
        password: senha,
      });

      // Não aguarda Alert.alert para avançar: no web ele pode não apresentar
      // a confirmação, deixando a conta criada parada nesta tela.
      onRegisterSuccess?.(novoUsuario);
    } catch (erro) {
      Alert.alert('Erro ao Cadastrar', erro.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={estilosAutenticacao.keyboardView}
    >
      <ScrollView
        contentContainerStyle={estilosAutenticacao.scrollContent}
        scrollEnabled={tecladoVisivel}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={estilosAutenticacao.contentWrapper}>
          {/* Cabeçalho da Marca Celebra */}
          <View style={estilosAutenticacao.brandHeader}>
            <View style={estilosAutenticacao.brandTitleRow}>
              <Text style={estilosAutenticacao.brandTitle}>Celebra</Text>
              <Text style={estilosAutenticacao.brandStar}>✦</Text>
            </View>
            <Text style={estilosAutenticacao.brandSubtitle}>
              Crie seu acesso e comece a gerenciar.
            </Text>
          </View>

          {/* Card Principal de Cadastro */}
          <View style={estilosAutenticacao.card}>
            <Text style={estilosAutenticacao.cardTitle}>Criar conta</Text>

            {/* Campo Nome completo */}
            <View style={estilosAutenticacao.fieldGroup}>
              <Text style={estilosAutenticacao.inputLabel}>Nome completo</Text>
              <View style={estilosAutenticacao.inputWrapper}>
                <Feather
                  name="user"
                  size={18}
                  color={CORES_AUTENTICACAO.placeholder}
                  style={estilosAutenticacao.inputIcon}
                />
                <TextInput
                  style={estilosAutenticacao.textInput}
                  placeholder="Ex: João Silva"
                  placeholderTextColor={CORES_AUTENTICACAO.placeholder}
                  value={nomeCompleto}
                  onChangeText={setNomeCompleto}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Campo E-mail */}
            <View style={estilosAutenticacao.fieldGroup}>
              <Text style={estilosAutenticacao.inputLabel}>E-mail</Text>
              <View style={estilosAutenticacao.inputWrapper}>
                <Feather
                  name="mail"
                  size={18}
                  color={CORES_AUTENTICACAO.placeholder}
                  style={estilosAutenticacao.inputIcon}
                />
                <TextInput
                  style={estilosAutenticacao.textInput}
                  placeholder="seu@email.com"
                  placeholderTextColor={CORES_AUTENTICACAO.placeholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Campo Senha */}
            <View style={estilosAutenticacao.fieldGroup}>
              <Text style={estilosAutenticacao.inputLabel}>Senha</Text>
              <View style={estilosAutenticacao.inputWrapper}>
                <Feather
                  name="lock"
                  size={18}
                  color={CORES_AUTENTICACAO.placeholder}
                  style={estilosAutenticacao.inputIcon}
                />
                <TextInput
                  style={estilosAutenticacao.textInput}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={CORES_AUTENTICACAO.placeholder}
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry={!mostrarSenha}
                />
                <TouchableOpacity
                  onPress={() => setMostrarSenha((prev) => !prev)}
                  style={estilosAutenticacao.eyeIcon}
                >
                  <Feather
                    name={mostrarSenha ? 'eye-off' : 'eye'}
                    size={18}
                    color={CORES_AUTENTICACAO.placeholder}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Campo Confirmar Senha */}
            <View style={estilosAutenticacao.fieldGroup}>
              <Text style={estilosAutenticacao.inputLabel}>Confirmar senha</Text>
              <View style={estilosAutenticacao.inputWrapper}>
                <Feather
                  name="lock"
                  size={18}
                  color={CORES_AUTENTICACAO.placeholder}
                  style={estilosAutenticacao.inputIcon}
                />
                <TextInput
                  style={estilosAutenticacao.textInput}
                  placeholder="Repita sua senha"
                  placeholderTextColor={CORES_AUTENTICACAO.placeholder}
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                  secureTextEntry={!mostrarConfirmarSenha}
                />
                <TouchableOpacity
                  onPress={() => setMostrarConfirmarSenha((prev) => !prev)}
                  style={estilosAutenticacao.eyeIcon}
                >
                  <Feather
                    name={mostrarConfirmarSenha ? 'eye-off' : 'eye'}
                    size={18}
                    color={CORES_AUTENTICACAO.placeholder}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Botão Finalizar Cadastro */}
            <TouchableOpacity
              style={estilosAutenticacao.submitButton}
              onPress={lidarComCadastro}
              disabled={carregando}
              activeOpacity={0.85}
            >
              {carregando ? (
                <ActivityIndicator color={CORES_AUTENTICACAO.textDark} />
              ) : (
                <Text style={estilosAutenticacao.submitButtonText}>Cadastrar</Text>
              )}
            </TouchableOpacity>

            {/* Rodapé: Voltar ao Login */}
            <View style={estilosAutenticacao.footerRow}>
              <Text style={estilosAutenticacao.footerText}>Já tem uma conta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={estilosAutenticacao.footerLink}>Fazer login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
