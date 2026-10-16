import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { COLORS, FONTS } from '../theme/colors';
import { authenticateUser, createUser } from '../database/userDb';

export default function LoginScreen({ onLoginSuccess }) {
  // Estados do Login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados do Modal de Cadastro
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Campos obrigatórios', 'Por favor, informe seu usuário/e-mail e senha.');
      return;
    }

    setLoading(true);
    try {
      const user = await authenticateUser(username, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        Alert.alert(
          'Acesso Negado',
          'Usuário ou senha incorretos. Verifique suas credenciais ou crie um novo cadastro.'
        );
      }
    } catch (error) {
      console.error('Erro no login:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao processar seu login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regName.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor, informe seu nome completo.');
      return;
    }

    if (!regUsername.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor, informe um usuário ou e-mail.');
      return;
    }

    if (!regPassword || regPassword.length < 4) {
      Alert.alert('Senha muito curta', 'A senha deve conter no mínimo 4 caracteres.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      Alert.alert('Senhas não coincidem', 'A confirmação de senha deve ser idêntica à senha informada.');
      return;
    }

    setRegLoading(true);
    try {
      const newUser = await createUser(regName, regUsername, regPassword);
      Alert.alert(
        'Cadastro Realizado!',
        `Usuário "${newUser.name}" registrado com sucesso no banco de dados Celebra.`,
        [
          {
            text: 'Entrar Agora',
            onPress: () => {
              setRegisterModalVisible(false);
              onLoginSuccess(newUser);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erro no Cadastro', error.message || 'Falha ao registrar usuário.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Recuperação de Senha',
      'Conta padrão de acesso no banco de dados: admin | Senha: admin123'
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        {/* 1. Header com Logo e Subtítulo */}
        <View style={styles.brandHeader}>
          <Text style={styles.brandTitle}>
            Celebra <Text style={styles.brandStar}>✦</Text>
          </Text>
          <Text style={styles.brandSubtitle}>
            Planeje seu evento com tranquilidade
          </Text>
        </View>

        {/* 2. Card Branco do Figma */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bem-vindo!</Text>

          {/* Campo: Usuário */}
          <Text style={styles.fieldLabel}>Usuário</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Seu e-mail ou usuário"
              placeholderTextColor="#8A9BB0"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Campo: Senha */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Senha</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Digite sua senha"
              placeholderTextColor="#8A9BB0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
              activeOpacity={0.7}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Link: Esqueci minha senha */}
          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={handleForgotPassword}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
          </TouchableOpacity>

          {/* Botão Primário Dourado: Acessar minha conta */}
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textNavy} />
            ) : (
              <>
                <Text style={styles.buttonArrow}>→</Text>
                <Text style={styles.buttonText}>Acessar minha conta</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Link para Cadastro */}
          <View style={styles.registerLinkRow}>
            <Text style={styles.registerPromptText}>Não tem uma conta? </Text>
            <TouchableOpacity
              onPress={() => setRegisterModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.registerLinkText}>Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dica para teste rápido de credenciais */}
        <View style={styles.credentialsTip}>
          <Text style={styles.tipText}>
            💡 Conta padrão no banco: <Text style={styles.tipBold}>admin</Text> | Senha: <Text style={styles.tipBold}>admin123</Text>
          </Text>
        </View>
      </View>

      {/* Modal de Cadastro Integrado ao Banco de Dados */}
      <Modal
        visible={registerModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRegisterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Criar Conta</Text>
                <Text style={styles.modalSubtitle}>Cadastre-se no banco de dados Celebra</Text>
              </View>
              <TouchableOpacity
                onPress={() => setRegisterModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Nome */}
              <Text style={styles.fieldLabel}>Nome Completo</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLeftIcon}>👤</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Seu nome completo"
                  placeholderTextColor="#8A9BB0"
                  value={regName}
                  onChangeText={setRegName}
                />
              </View>

              {/* Usuário / E-mail */}
              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Usuário ou E-mail</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLeftIcon}>✉️</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="usuario@celebra.com"
                  placeholderTextColor="#8A9BB0"
                  value={regUsername}
                  onChangeText={setRegUsername}
                  autoCapitalize="none"
                />
              </View>

              {/* Senha */}
              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Senha</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLeftIcon}>🔒</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Crie uma senha (mín. 4 caracteres)"
                  placeholderTextColor="#8A9BB0"
                  value={regPassword}
                  onChangeText={setRegPassword}
                  secureTextEntry={!regShowPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setRegShowPassword(!regShowPassword)}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeIcon}>{regShowPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>

              {/* Confirmar Senha */}
              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Confirmar Senha</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLeftIcon}>🔒</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Repita a senha digitada"
                  placeholderTextColor="#8A9BB0"
                  value={regConfirmPassword}
                  onChangeText={setRegConfirmPassword}
                  secureTextEntry={!regShowPassword}
                  autoCapitalize="none"
                />
              </View>

              {/* Botão de Cadastro */}
              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 20 }]}
                activeOpacity={0.85}
                onPress={handleRegister}
                disabled={regLoading}
              >
                {regLoading ? (
                  <ActivityIndicator color={COLORS.textNavy} />
                ) : (
                  <>
                    <Text style={styles.buttonArrow}>→</Text>
                    <Text style={styles.buttonText}>Cadastrar minha conta</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgHeaderDark,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandTitle: {
    fontFamily: FONTS.heading,
    fontSize: 38,
    fontWeight: '700',
    color: COLORS.textWhite,
    letterSpacing: 0.5,
  },
  brandStar: {
    color: COLORS.buttonGold,
    fontSize: 32,
  },
  brandSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.headerSubtitle,
    marginTop: 6,
    letterSpacing: 0.2,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.cardWhite,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8,
  },
  cardTitle: {
    fontFamily: FONTS.body,
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textNavy,
    marginBottom: 18,
    letterSpacing: 0.2,
  },
  fieldLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textNavy,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 14,
  },
  inputLeftIcon: {
    fontSize: 15,
    marginRight: 10,
    opacity: 0.7,
  },
  textInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textNavy,
    height: '100%',
  },
  eyeButton: {
    padding: 6,
  },
  eyeIcon: {
    fontSize: 16,
    opacity: 0.7,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: 12,
    marginBottom: 18,
  },
  forgotPasswordText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textNavy,
  },
  primaryButton: {
    backgroundColor: COLORS.buttonGold,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.buttonGoldShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonArrow: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textNavy,
  },
  buttonText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textNavy,
  },
  registerLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  registerPromptText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  registerLinkText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.buttonGoldHover,
  },
  credentialsTip: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tipText: {
    fontSize: 11,
    color: COLORS.headerSubtitle,
    textAlign: 'center',
  },
  tipBold: {
    fontWeight: 'bold',
    color: COLORS.buttonGold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 24, 44, 0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.cardWhite,
    borderRadius: 24,
    padding: 22,
    maxHeight: '90%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: FONTS.heading,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textNavy,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseBtnText: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
});
