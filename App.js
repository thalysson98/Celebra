import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from './src/config/firebaseConfig';
import { AUTH_COLORS } from './src/styles/authStyles';
import { logoutUser } from './src/services/authService';
import { getUserProfile } from './src/services/userService';

// Telas de Autenticação
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// Novas telas de gestão de eventos (em português)
import TelaListaEventos from './src/telas/TelaListaEventos';
import TelaCriarEvento from './src/telas/TelaCriarEvento';
import TelaDetalheEvento from './src/telas/TelaDetalheEvento';

const AuthStack = createStackNavigator();
const EventosStack = createStackNavigator();

/**
 * Pilha de navegação para as telas do Celebra após o login
 */
function NavegacaoEventos({ onLogout }) {
  return (
    <EventosStack.Navigator
      initialRouteName="ListaEventos"
      screenOptions={{
        headerStyle: { backgroundColor: '#1e1e1e' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <EventosStack.Screen 
        name="ListaEventos" 
        options={{ title: 'Meus Eventos' }}
      >
        {(props) => <TelaListaEventos {...props} onLogout={onLogout} />}
      </EventosStack.Screen>

      <EventosStack.Screen 
        name="CriarEvento" 
        component={TelaCriarEvento} 
        options={{ title: 'Criar Novo Evento' }} 
      />

      <EventosStack.Screen 
        name="DetalheEvento" 
        component={TelaDetalheEvento} 
        options={{ title: 'Detalhes do Evento' }} 
      />
    </EventosStack.Navigator>
  );
}

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
        setCurrentUser(null);
        setReady(true);
        return;
      }
      try {
        const profile = await getUserProfile(authUser);
        if (mounted && revision === authRevision) setCurrentUser(profile);
      } catch (error) {
        setCurrentUser({ uid: authUser.uid, email: authUser.email, name: 'Organizador' });
      } finally {
        setReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AUTH_COLORS.buttonYellow || '#6200ee'} />
      </View>
    );
  }

  const isTechnician = currentUser?.role === 'technician';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="light" backgroundColor={AUTH_COLORS.backgroundDark || '#1e1e1e'} />

        <NavigationContainer>
          {currentUser ? (
            /* Usuário autenticado: Abre as telas de eventos em português */
            <NavegacaoEventos onLogout={handleLogout} />
          ) : (
            /* Utilizador NÃO autenticado: Telas de Login e Registo */
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
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AUTH_COLORS.backgroundDark || '#1e1e1e',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: AUTH_COLORS.backgroundDark || '#1e1e1e',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
