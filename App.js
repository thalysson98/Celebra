import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from './src/config/firebaseConfig';
import { AUTH_COLORS } from './src/styles/authStyles';
import { COLORS } from './src/theme/colors';
import { logoutUser } from './src/services/authService';
import { getUserProfile } from './src/services/userService';

// Telas de Autenticação
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// Navegação do Organizador (Figma)
import NavegacaoOrganizador from './src/screens/organizer/NavegacaoOrganizador';

const AuthStack = createStackNavigator();

const paperTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.buttonGold,
    background: COLORS.sheetBg,
    surface: COLORS.cardWhite,
  },
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    let authRevision = 0;

    // Escuta a sessão ativa do usuário no Firebase
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      const revision = ++authRevision;
      if (!authUser) {
        if (mounted) {
          setCurrentUser(null);
          setReady(true);
        }
        return;
      }

      try {
        const profile = await getUserProfile(authUser);
        if (mounted && revision === authRevision) setCurrentUser(profile);
      } catch (error) {
        if (mounted && revision === authRevision) {
          setCurrentUser({
            uid: authUser.uid,
            email: authUser.email,
            name: authUser.displayName || authUser.email?.split('@')[0] || 'Organizador',
            role: 'organizer',
            profileStatus: 'ready',
          });
        }
      } finally {
        if (mounted && revision === authRevision) setReady(true);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.buttonGold} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
          <StatusBar style="light" backgroundColor={COLORS.bgHeaderDark} />

          <NavigationContainer>
            {currentUser ? (
              /* Usuário autenticado: Abre a interface do Organizador (Figma) */
              <NavegacaoOrganizador onLogout={handleLogout} usuario={currentUser} />
            ) : (
              /* Usuário NÃO autenticado: Telas de Login e Cadastro */
              <AuthStack.Navigator
                initialRouteName="Login"
                screenOptions={{
                  headerShown: false,
                  cardStyle: { backgroundColor: AUTH_COLORS.backgroundDark || '#1e1e1e' },
                }}
              >
                <AuthStack.Screen name="Login">
                  {(props) => (
                    <LoginScreen
                      {...props}
                      onLoginSuccess={(user) => setCurrentUser(user)}
                    />
                  )}
                </AuthStack.Screen>

                <AuthStack.Screen name="Register">
                  {(props) => (
                    <RegisterScreen
                      {...props}
                      onRegisterSuccess={(user) => setCurrentUser(user)}
                    />
                  )}
                </AuthStack.Screen>
              </AuthStack.Navigator>
            )}
          </NavigationContainer>
        </SafeAreaView>
      </PaperProvider>
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
});
