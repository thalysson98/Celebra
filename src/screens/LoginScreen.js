import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../theme/colors';
import { styles } from '../styles/loginStyles';
import { authenticateUser } from '../database/userDb';

export default function LoginScreen({ onLoginSuccess }) {
  // Estados do Login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
          'Usuário ou senha incorretos. Verifique suas credenciais.'
        );
      }
    } catch (error) {
      console.error('Erro no login:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao processar seu login. Tente novamente.');
    } finally {
      setLoading(false);
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
        </View>

        {/* Dica para teste rápido de credenciais */}
        <View style={styles.credentialsTip}>
          <Text style={styles.tipText}>
            💡 Conta padrão no banco: <Text style={styles.tipBold}>admin</Text> | Senha: <Text style={styles.tipBold}>admin123</Text>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}