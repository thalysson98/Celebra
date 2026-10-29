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
import { estilosAutenticacao, CORES_AUTENTICACAO } from '../../estilos/estilosAutenticacao';
import { autenticarUsuario } from '../../servicos/servicoAutenticacao';

export default function TelaLogin({ navigation, onLoginSuccess }) {
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrarSenha, setLembrarSenha] = useState(false);
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

  const lidarComLogin = async () => {
    if (!identificador.trim() || !senha.trim()) {
      Alert.alert('Atenção', 'Preencha seu e-mail e sua senha.');
      return;
    }

    try {
      setCarregando(true);
      const perfilUsuario = await autenticarUsuario({
        identifier: identificador,
        password: senha,
      });

      if (onLoginSuccess) {
        onLoginSuccess(perfilUsuario);
      }
    } catch (erro) {
      Alert.alert('Falha no Login', erro.message);
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
              Planeje seu evento, gerencie seus técnicos.
            </Text>
          </View>

          {/* Card Principal de Login */}
          <View style={estilosAutenticacao.card}>
            <Text style={estilosAutenticacao.cardTitle}>Acesse sua conta</Text>

            {/* Campo E-mail */}
            <View style={estilosAutenticacao.fieldGroup}>
              <Text style={estilosAutenticacao.inputLabel}>E-mail</Text>
              <View style={estilosAutenticacao.inputWrapper}>
                <Feather
                  name="user"
                  size={18}
                  color={CORES_AUTENTICACAO.placeholder}
                  style={estilosAutenticacao.inputIcon}
                />
                <TextInput
                  style={estilosAutenticacao.textInput}
                  placeholder="seu@email.com"
                  placeholderTextColor={CORES_AUTENTICACAO.placeholder}
                  value={identificador}
                  onChangeText={setIdentificador}
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
                  placeholder="Sua senha"
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
