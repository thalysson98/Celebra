import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, useNavigation } from '@react-navigation/native'; // 1. Importe o useNavigation
import { createStackNavigator } from '@react-navigation/stack';
import { Icon } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from './src/config/firebaseConfig';
import { logoutUser } from './src/services/authService';
import { getUserProfile } from './src/services/userService';

import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

import TelaDashboard from './src/telas/TelaDashboard'; // Certifique-se de importar a TelaDashboard se já a criou
import TelaListaEventos from './src/telas/TelaListaEventos';
import TelaCriarEvento from './src/telas/TelaCriarEvento';
import TelaDetalheEvento from './src/telas/TelaDetalheEvento';
import TelaNotificacoes from './src/telas/TelaNotificacoes';

const AuthStack = createStackNavigator();
const EventosStack = createStackNavigator();

// HOTBAR INFERIOR COM O HOOK useNavigation
function HotbarInferior() {
  const navigation = useNavigation(); // 2. Instancia o hook de navegação aqui

  return (
    <View style={estilos.hotbarContainer}>
      <TouchableOpacity style={estilos.hotbarItem} onPress={() => navigation.navigate('Dashboard')}>
        <Icon source="home" size={22} color="#666" />
        <Text style={estilos.hotbarTexto}>Início</Text>
      </TouchableOpacity>

      <TouchableOpacity style={estilos.hotbarItem} onPress={() => navigation.navigate('ListaEventos')}>
        <Icon source="calendar" size={22} color="#D99B00" />
        <Text style={[estilos.hotbarTexto, { color: '#D99B00', fontWeight: 'bold' }]}>Eventos</Text>
      </TouchableOpacity>

      <TouchableOpacity style={estilos.hotbarItem} onPress={() => Toast.show({ type: 'info', text1: 'Administrando', text2: 'Módulo de cadastros.' })}>
        <Icon source="cog-outline" size={22} color="#666" />
        <Text style={estilos.hotbarTexto}>Administrando</Text>
      </TouchableOpacity>

      <TouchableOpacity style={estilos.hotbarItem} onPress={() => Toast.show({ type: 'info', text1: 'Perfil', text2: 'Dados da conta.' })}>
        <Icon source="account-outline" size={22} color="#666" />
        <Text style={estilos.hotbarTexto}>Perfil</Text>
      </TouchableOpacity>
    </View>
  );
}

function NavegacaoEventos() {
  return (
    <View style={{ flex: 1 }}>
      <EventosStack.Navigator initialRouteName="Dashboard" screenOptions={{ headerShown: false }}>
        <EventosStack.Screen name="Dashboard" component={TelaDashboard} />
        <EventosStack.Screen name="ListaEventos" component={TelaListaEventos} />
        <EventosStack.Screen name="CriarEvento" component={TelaCriarEvento} />
        <EventosStack.Screen name="DetalheEvento" component={TelaDetalheEvento} />
        <EventosStack.Screen name="Notificacoes" component={TelaNotificacoes} />
      </EventosStack.Navigator>
      <HotbarInferior />
    </View>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (!authUser) {
        setCurrentUser(null);
        setReady(true);
        return;
      }
      try {
        const profile = await getUserProfile(authUser);
        setCurrentUser(profile);
      } catch (error) {
        setCurrentUser({ uid: authUser.uid, email: authUser.email, name: 'Organizador' });
      } finally {
        setReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  if (!ready) {
    return (
      <View style={estilos.loadingContainer}>
        <ActivityIndicator size="large" color="#FFC107" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={estilos.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <NavigationContainer>
          {currentUser != null ? (
            <NavegacaoEventos />
          ) : (
            <AuthStack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
              <AuthStack.Screen name="Login">
                {(props) => <LoginScreen {...props} onLoginSuccess={(u) => setCurrentUser(u)} />}
              </AuthStack.Screen>
              <AuthStack.Screen name="Register">
                {(props) => <RegisterScreen {...props} onRegisterSuccess={(u) => setCurrentUser(u)} />}
              </AuthStack.Screen>
            </AuthStack.Navigator>
          )}
        </NavigationContainer>

        <Toast position="top" topOffset={300} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const estilos = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B2545' },
  loadingContainer: { flex: 1, backgroundColor: '#0B2545', justifyContent: 'center', alignItems: 'center' },
  hotbarContainer: { flexDirection: 'row', backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E0E0E0', height: 60, justifyContent: 'space-around', alignItems: 'center' },
  hotbarItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  hotbarTexto: { fontSize: 11, color: '#666', marginTop: 2 }
});