// src/navegacao/NavegadorOrganizador.js
import React from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CORES, FONTES } from '../tema/cores';
import { estilosNavegacao, obterEstiloHotbar } from '../estilos/estilosNavegacao';
import TelaInicioOrganizador from '../telas/organizador/TelaInicioOrganizador';
import TelaListaEventos from '../telas/organizador/TelaListaEventos';
import TelaAdministrandoOrganizador from '../telas/organizador/TelaAdministrandoOrganizador';
import TelaPerfilOrganizador from '../telas/organizador/TelaPerfilOrganizador';
import TelaCriarEvento from '../telas/organizador/TelaCriarEvento';
import TelaDetalheEvento from '../telas/organizador/TelaDetalheEvento';
import TelaEditarEmpresa from '../telas/organizador/TelaEditarEmpresa';
import TelaNotificacoes from '../telas/TelaNotificacoes';

const Aba = createBottomTabNavigator();
const Pilha = createStackNavigator();

function NavegadorEventos({ onLogout, usuario }) {
  return (
    <Pilha.Navigator screenOptions={{ headerStyle: { backgroundColor: CORES.bgHeaderDark }, headerTintColor: '#FFFFFF', headerTitleStyle: { fontFamily: FONTES.heading, fontWeight: '700' } }}>
      <Pilha.Screen name="ListaEventos" options={{ headerShown: false }}>
        {(props) => <TelaListaEventos {...props} onLogout={onLogout} />}
      </Pilha.Screen>
      <Pilha.Screen name="CriarEvento" options={{ title: 'Adicionando evento' }}>
        {(props) => <TelaCriarEvento {...props} usuario={usuario} />}
      </Pilha.Screen>
      <Pilha.Screen name="DetalheEvento" options={{ title: 'Detalhes do evento', headerTitleStyle: { fontFamily: FONTES.body, fontSize: 20, fontWeight: '400' } }}>
        {(props) => <TelaDetalheEvento {...props} usuario={usuario} />}
      </Pilha.Screen>
    </Pilha.Navigator>
  );
}

function NavegadorPerfil({ onLogout, usuario, setCurrentUser }) {
  return (
    <Pilha.Navigator screenOptions={{ headerShown: false }}>
      <Pilha.Screen name="PerfilEmpresa">
        {(props) => <TelaPerfilOrganizador {...props} onLogout={onLogout} usuario={usuario} />}
      </Pilha.Screen>
      <Pilha.Screen name="EditarEmpresa">
        {(props) => <TelaEditarEmpresa {...props} usuario={usuario} setCurrentUser={setCurrentUser} />}
      </Pilha.Screen>
    </Pilha.Navigator>
  );
}

function AbasOrganizador({ onLogout, usuario, setCurrentUser }) {
  const insets = useSafeAreaInsets();
  
  return (
    <Aba.Navigator
      initialRouteName="Inicio"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: CORES.textNavy,
        tabBarInactiveTintColor: CORES.textSubtle,
        tabBarStyle: obterEstiloHotbar(insets.bottom),
        tabBarShowLabel: false,
      }}
    >
      <Aba.Screen name="Inicio" options={{ tabBarIcon: ({ color, focused }) => (<View style={estilosNavegacao.tabContainer}><View style={focused ? estilosNavegacao.pilulaIconeAtivo : estilosNavegacao.pilulaIconeInativo}><MaterialCommunityIcons name={focused ? 'home' : 'home-outline'} size={24} color={focused ? CORES.textNavy : color}/></View><Text style={[estilosNavegacao.tabLabel, { color: focused ? CORES.textNavy : color }]}>Início</Text></View>) }}>
        {(props) => <TelaInicioOrganizador {...props} usuario={usuario} />}
      </Aba.Screen>
      <Aba.Screen name="Eventos" options={{ tabBarIcon: ({ color, focused }) => (<View style={estilosNavegacao.tabContainer}><View style={focused ? estilosNavegacao.pilulaIconeAtivo : estilosNavegacao.pilulaIconeInativo}><MaterialCommunityIcons name={focused ? 'calendar-month' : 'calendar-month-outline'} size={24} color={focused ? CORES.textNavy : color}/></View><Text style={[estilosNavegacao.tabLabel, { color: focused ? CORES.textNavy : color }]}>Eventos</Text></View>) }}>
        {() => <NavegadorEventos onLogout={onLogout} usuario={usuario} />}
      </Aba.Screen>
      <Aba.Screen name="Administrando" options={{ tabBarIcon: ({ color, focused }) => (<View style={estilosNavegacao.tabContainer}><View style={focused ? estilosNavegacao.pilulaIconeAtivo : estilosNavegacao.pilulaIconeInativo}><MaterialCommunityIcons name={focused ? 'cog' : 'cog-outline'} size={24} color={focused ? CORES.textNavy : color}/></View><Text style={[estilosNavegacao.tabLabel, { color: focused ? CORES.textNavy : color }]}>Gestão</Text></View>) }}>
        {(props) => <TelaAdministrandoOrganizador {...props} usuario={usuario} />}
      </Aba.Screen>
      <Aba.Screen name="Perfil" options={{ tabBarIcon: ({ color, focused }) => (<View style={estilosNavegacao.tabContainer}><View style={focused ? estilosNavegacao.pilulaIconeAtivo : estilosNavegacao.pilulaIconeInativo}><MaterialCommunityIcons name="domain" size={24} color={focused ? CORES.textNavy : color}/></View><Text style={[estilosNavegacao.tabLabel, { color: focused ? CORES.textNavy : color }]}>Perfil</Text></View>) }}>
        {() => <NavegadorPerfil onLogout={onLogout} usuario={usuario} setCurrentUser={setCurrentUser} />}
      </Aba.Screen>
    </Aba.Navigator>
  );
}

export default function NavegadorOrganizador({ onLogout, usuario, setCurrentUser }) {
  return (
    <Pilha.Navigator screenOptions={{ headerStyle: { backgroundColor: CORES.bgHeaderDark }, headerTintColor: '#FFFFFF', headerTitleStyle: { fontFamily: FONTES.heading, fontWeight: '700' } }}>
      <Pilha.Screen name="AbasPrincipais" options={{ headerShown: false }}>
        {(props) => <AbasOrganizador {...props} onLogout={onLogout} usuario={usuario} setCurrentUser={setCurrentUser} />}
      </Pilha.Screen>
      <Pilha.Screen name="Notificacoes" component={TelaNotificacoes} options={{ headerShown: false }} />
    </Pilha.Navigator>
  );
}

export const OrganizerNavigator = NavegadorOrganizador;