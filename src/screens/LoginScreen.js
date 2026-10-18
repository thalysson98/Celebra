import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles, AUTH_COLORS } from '../styles/authStyles';
import { loginUser } from '../services/authService';

export default function LoginScreen({ navigation, onLoginSuccess }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Preencha seu usuário/e-mail e sua senha.');
      return;
    }

    setLoading(true);
    try {
      const user = await loginUser({ identifier, password });
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (error) {
      Alert.alert('Erro no acesso', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Cabeçalho Superior: Logo Celebra ✦ */}
          <View style={styles.brandHeader}>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandTitle}>Celebra</Text>
              <Text style={styles.brandStar}>✦</Text>
            </View>
            <Text style={styles.brandSubtitle}>
              Planeje seu evento com tranquilidade
            </Text>
          </View>

          {/* Card Branco de Login */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bem-vindo!</Text>

            {/* Campo: Usuário */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Usuário</Text>
              <View style={styles.inputContainer}>
                <Feather
                  name="user"
                  size={18}
                  color={AUTH_COLORS.placeholder}
                  style={styles.leftIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Seu e-mail ou usuário"
                  placeholderTextColor={AUTH_COLORS.placeholder}
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Campo: Senha */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Senha</Text>
              <View style={styles.inputContainer}>
                <Feather
                  name="lock"
                  size={18}
                  color={AUTH_COLORS.placeholder}
                  style={styles.leftIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Digite sua senha"
                  placeholderTextColor={AUTH_COLORS.placeholder}
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
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color={AUTH_COLORS.placeholder}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Botão "Criar conta ->" que navega para a tela da direita (RegisterScreen) */}
            <TouchableOpacity
              style={styles.createAccountButton}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.7}
            >
              <Text style={styles.createAccountText}>Criar conta</Text>
              <Feather name="arrow-right" size={16} color={AUTH_COLORS.textDark} />
            </TouchableOpacity>

            {/* Botão Principal Amarelo: Acessar minha conta */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={AUTH_COLORS.textDark} />
              ) : (
                <Text style={styles.primaryButtonText}>Acessar minha conta</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}