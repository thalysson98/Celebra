import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { COLORS } from './src/theme/colors';
import { initUserDb } from './src/database/userDb';
import LoginScreen from './src/screens/LoginScreen';
import EmptyScreen from './src/screens/EmptyScreen';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [dbReady, setDbReady] = useState(false);
  const { width } = useWindowDimensions();

  // Inicializa o banco de dados com a tabela de usuários e contas padrão
  useEffect(() => {
    async function setupDb() {
      await initUserDb();
      setDbReady(true);
    }
    setupDb();
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const isLargeScreen = width > 768;

  if (!dbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.buttonGold} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="light" backgroundColor={COLORS.bgHeaderDark} />

        <View style={[styles.mainWrapper, isLargeScreen && styles.largeScreenWrapper]}>
          {/* Se estiver autenticado: leva para a Tela Vazia solicitada */}
          {currentUser ? (
            <EmptyScreen user={currentUser} onLogout={handleLogout} />
          ) : (
            /* Tela de Login idêntica à imagem com suporte a Cadastro e Banco de Dados */
            <LoginScreen onLoginSuccess={handleLoginSuccess} />
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgHeaderDark,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bgHeaderDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainWrapper: {
    flex: 1,
    backgroundColor: COLORS.bgHeaderDark,
    width: '100%',
  },
  largeScreenWrapper: {
    maxWidth: 480,
    alignSelf: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
  },
});
