import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { onAuthStateChanged } from 'firebase/auth';

import { autenticacao } from './src/configuracao/configuracaoFirebase';
import { CORES } from './src/tema/cores';
import { desconectarUsuario } from './src/servicos/servicoAutenticacao';
import { obterPerfilUsuario } from './src/servicos/servicoUsuario';
import NavegadorRaiz from './src/navegacao/NavegadorRaiz';

const paperTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: CORES.buttonGold,
    background: CORES.sheetBg,
    surface: CORES.cardWhite,
  },
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    let authRevision = 0;

    // Escuta a sessão ativa do usuário no Firebase
    const unsubscribe = onAuthStateChanged(autenticacao, async (authUser) => {
      const revision = ++authRevision;
      if (!authUser) {
        if (mounted) {
          setCurrentUser(null);
          setReady(true);
        }
        return;
      }

      try {
        const profile = await obterPerfilUsuario(authUser);
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
    await desconectarUsuario();
    setCurrentUser(null);
  };

  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={CORES.buttonGold} />
      </View>
    );
  }

  const isTechnician = currentUser?.role === 'technician';

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <SafeAreaView
          style={[styles.safeArea, isTechnician && styles.technicianSafeArea]}
          edges={isTechnician ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']}
        >
          <StatusBar style="light" backgroundColor={CORES.bgHeaderDark} />

          <NavigationContainer>
            <NavegadorRaiz
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              onLogout={handleLogout}
            />
          </NavigationContainer>
        </SafeAreaView>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CORES.bgHeaderDark,
  },
  technicianSafeArea: {
    backgroundColor: '#F8FAFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: CORES.bgHeaderDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
