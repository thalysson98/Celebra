import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { PaperProvider, MD3LightTheme as DefaultTheme, configureFonts } from 'react-native-paper';
import { onAuthStateChanged } from 'firebase/auth';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { autenticacao } from './src/configuracao/configuracaoFirebase';
import { CORES, FONTES } from './src/tema/cores';
import { desconectarUsuario } from './src/servicos/servicoAutenticacao';
import { obterPerfilUsuario } from './src/servicos/servicoUsuario';
import NavegadorRaiz from './src/navegacao/NavegadorRaiz';

const paperTheme = {
  ...DefaultTheme,
  fonts: configureFonts({ config: { fontFamily: FONTES.body } }),
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
  const [fontesCarregadas, erroFontes] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

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
        let profile = await obterPerfilUsuario(authUser);
        // No cadastro, o evento do Auth pode chegar antes de o documento
        // usuarios terminar de ser gravado no Firestore. Aguarda essa gravação
        // antes de tratar a conta como inválida e desconectá-la.
        for (let tentativa = 0; profile.profileStatus === 'perfil_nao_cadastrado' && tentativa < 5; tentativa += 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          if (!mounted || revision !== authRevision || autenticacao.currentUser?.uid !== authUser.uid) return;
          profile = await obterPerfilUsuario(authUser);
        }
        if (['perfil_nao_cadastrado', 'bloqueado'].includes(profile.profileStatus) || profile.ativo !== true) {
          await desconectarUsuario();
          if (mounted && revision === authRevision) setCurrentUser(null);
          return;
        }
        if (mounted && revision === authRevision) setCurrentUser(profile);
      } catch (error) {
        await desconectarUsuario();
        if (mounted && revision === authRevision) {
          setCurrentUser(null);
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

  if (!ready || (!fontesCarregadas && !erroFontes)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={CORES.buttonGold} />
      </View>
    );
  }

  const isTechnician = currentUser?.papel === false;

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
