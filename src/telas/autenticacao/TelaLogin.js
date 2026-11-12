import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { estilosAutenticacao, CORES_AUTENTICACAO } from '../../estilos/estilosAutenticacao';
import { autenticarUsuario } from '../../servicos/servicoAutenticacao';

export default function TelaLogin({ navigation, onLoginSuccess }) {
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrarSenha, setLembrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [tecladoVisivel, setTecladoVisivel] = useState(false);

  // Erros de validação inline (campos vazios ou inválidos)
  const [erroEmail, setErroEmail] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  const [erroGeral, setErroGeral] = useState('');

  useEffect(() => {
    const eventoMostrar = Keyboard.addListener('keyboardDidShow', () => setTecladoVisivel(true));
    const eventoOcultar = Keyboard.addListener('keyboardDidHide', () => setTecladoVisivel(false));
    return () => {
      eventoMostrar.remove();
      eventoOcultar.remove();
    };
  }, []);

  const validarCampos = () => {
    let valido = true;
    const emailLimpo = identificador.trim();
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    setErroGeral('');

    if (!emailLimpo) {
      setErroEmail('Informe seu e-mail.');
      valido = false;
    } else if (!regexEmail.test(emailLimpo)) {
      setErroEmail('Formato de e-mail inválido (ex: seu@email.com).');
      valido = false;
    } else {
      setErroEmail('');
    }

    if (!senha) {
      setErroSenha('Informe sua senha.');
      valido = false;
    } else if (senha.length < 6) {
      setErroSenha('A senha deve ter pelo menos 6 caracteres.');
      valido = false;
    } else {
      setErroSenha('');
    }

    return valido;
  };

  const lidarComLogin = async () => {
    if (!validarCampos()) {
      Toast.show({
        type: 'error',
        text1: 'Campos obrigatórios',
        text2: 'Preencha seu e-mail e senha corretamente.',
      });
      return;
    }

    try {
      setCarregando(true);
      setErroGeral('');
      const perfilUsuario = await autenticarUsuario({
        identifier: identificador,
        password: senha,
      });

      Toast.show({
        type: 'success',
        text1: 'Bem-vindo(a)!',
        text2: `Olá, ${perfilUsuario.name || 'usuário'}!`,
      });

      if (onLoginSuccess) {
        onLoginSuccess(perfilUsuario);
      }
    } catch (erro) {
      const mensagem = erro.message || 'E-mail ou senha incorretos.';
      setErroGeral(mensagem);
      Toast.show({
        type: 'error',
        text1: 'Falha no login',
        text2: mensagem,
      });
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
          {/* Cabeçalho da marca ("Celebra ✦") */}
          <View style={estilosAutenticacao.brandHeader}>
            <View style={estilosAutenticacao.brandTitleRow}>
              <Text style={estilosAutenticacao.brandTitle}>Celebra</Text>
              <Text style={estilosAutenticacao.brandStar}>✦</Text>
            </View>
            <Text style={estilosAutenticacao.brandSubtitle}>
              Planeje seu evento, gerencie seus técnicos.
            </Text>
          </View>

          {/* Card Principal de Login */}
          <View style={estilosAutenticacao.card}>
            <Text style={estilosAutenticacao.cardTitle}>Acesse sua conta</Text>

            {/* Banner de erro geral caso ocorra falha de autenticação */}
            {!!erroGeral && (
              <View style={estilosAutenticacao.alertaBanner}>
                <Feather name="alert-circle" size={16} color="#DC2626" />
                <Text style={estilosAutenticacao.alertaTexto}>{erroGeral}</Text>
              </View>
            )}

            {/* Campo E-mail */}
            <View style={estilosAutenticacao.fieldGroup}>
              <Text style={estilosAutenticacao.inputLabel}>E-mail</Text>
              <View
                style={[
                  estilosAutenticacao.inputWrapper,
                  erroEmail && estilosAutenticacao.inputWrapperErro,
                ]}
              >
                <Feather
                  name="mail"
                  size={18}
                  color={erroEmail ? CORES_AUTENTICACAO.bordaErro : CORES_AUTENTICACAO.placeholder}
                  style={estilosAutenticacao.inputIcon}
                />
                <TextInput
                  style={estilosAutenticacao.textInput}
                  placeholder="seu@email.com"
                  placeholderTextColor={CORES_AUTENTICACAO.placeholder}
                  value={identificador}
                  onChangeText={(val) => {
                    setIdentificador(val);
                    if (erroEmail) setErroEmail('');
                    if (erroGeral) setErroGeral('');
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>
              {!!erroEmail && (
                <Text style={estilosAutenticacao.erroTexto}>{erroEmail}</Text>
              )}
            </View>

            {/* Campo Senha */}
            <View style={estilosAutenticacao.fieldGroup}>
              <Text style={estilosAutenticacao.inputLabel}>Senha</Text>
              <View
                style={[
                  estilosAutenticacao.inputWrapper,
                  erroSenha && estilosAutenticacao.inputWrapperErro,
                ]}
              >
                <Feather
                  name="lock"
                  size={18}
                  color={erroSenha ? CORES_AUTENTICACAO.bordaErro : CORES_AUTENTICACAO.placeholder}
                  style={estilosAutenticacao.inputIcon}
                />
                <TextInput
                  style={estilosAutenticacao.textInput}
                  placeholder="Sua senha"
                  placeholderTextColor={CORES_AUTENTICACAO.placeholder}
                  value={senha}
                  onChangeText={(val) => {
                    setSenha(val);
                    if (erroSenha) setErroSenha('');
                    if (erroGeral) setErroGeral('');
                  }}
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
              {!!erroSenha && (
                <Text style={estilosAutenticacao.erroTexto}>{erroSenha}</Text>
              )}
            </View>

            {/* Lembrar senha / Esqueci a senha */}
            <View style={estilosAutenticacao.rowBetween}>
              <Pressable
                onPress={() => setLembrarSenha((prev) => !prev)}
                style={estilosAutenticacao.checkboxContainer}
              >
                <View
                  style={[
                    estilosAutenticacao.checkbox,
                    lembrarSenha && estilosAutenticacao.checkboxChecked,
                  ]}
                >
                  {lembrarSenha && <Feather name="check" size={12} color="#0A192F" />}
                </View>
                <Text style={estilosAutenticacao.checkboxLabel}>Lembrar senha</Text>
              </Pressable>

              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    'Recuperação de Senha',
                    'Para redefinir sua senha, solicite suporte ou entre em contato com o administrador da sua empresa.'
                  )
                }
              >
                <Text style={estilosAutenticacao.forgotPasswordText}>Esqueci a senha</Text>
              </TouchableOpacity>
            </View>

            {/* Botão Acessar Conta */}
            <TouchableOpacity
              style={estilosAutenticacao.submitButton}
              onPress={lidarComLogin}
              disabled={carregando}
              activeOpacity={0.85}
            >
              {carregando ? (
                <ActivityIndicator color={CORES_AUTENTICACAO.textDark} />
              ) : (
                <Text style={estilosAutenticacao.submitButtonText}>Acessar minha conta</Text>
              )}
            </TouchableOpacity>

            {/* Rodapé: Troca para Cadastro */}
            <View style={estilosAutenticacao.footerRow}>
              <Text style={estilosAutenticacao.footerText}>Não possui conta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={estilosAutenticacao.footerLink}>Cadastre-se</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
