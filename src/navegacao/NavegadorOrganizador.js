import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { CORES } from '../tema/cores';

// Telas das 4 Abas Principais do Organizador (Figma)
import TelaInicioOrganizador from '../telas/organizador/TelaInicioOrganizador';
import TelaListaEventos from '../telas/organizador/TelaListaEventos';
import TelaAdministrandoOrganizador from '../telas/organizador/TelaAdministrandoOrganizador';
import TelaPerfilOrganizador from '../telas/organizador/TelaPerfilOrganizador';

// Telas de Pilha (Criação e Detalhes)
import TelaCriarEvento from '../telas/organizador/TelaCriarEvento';
import TelaDetalheEvento from '../telas/organizador/TelaDetalheEvento';
import TelaEditarEmpresa from '../telas/organizador/TelaEditarEmpresa';

const Aba = createBottomTabNavigator();
const Pilha = createStackNavigator();

function NavegadorEventos({ onLogout, usuario }) {
  return (
    <Pilha.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: CORES.bgHeaderDark },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Pilha.Screen name="ListaEventos" options={{ headerShown: false }}>
        {(props) => <TelaListaEventos {...props} onLogout={onLogout} />}
      </Pilha.Screen>
      <Pilha.Screen name="CriarEvento" options={{ title: 'Criar Novo Evento' }}>
        {(props) => <TelaCriarEvento {...props} usuario={usuario} />}
      </Pilha.Screen>
      <Pilha.Screen name="DetalheEvento" component={TelaDetalheEvento} options={{ title: 'Detalhes do evento', headerTitleStyle: { fontSize: 22, fontWeight: '400' } }} />
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

/**
 * As 4 Abas Inferiores do Organizador (Figma)
 */
function AbasOrganizador({ onLogout, usuario, setCurrentUser }) {
  return (
    <Aba.Navigator
      initialRouteName="Inicio"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: CORES.textNavy,
        tabBarInactiveTintColor: CORES.textSubtle,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: CORES.cardDivider,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 76,
          paddingBottom: Platform.OS === 'ios' ? 24 : 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          lineHeight: 14,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: 1,
        },
      }}
    >
      <Aba.Screen
        name="Inicio"
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? estilos.pilulaIconeAtivo : null}>
              <MaterialCommunityIcons
                name={focused ? 'home' : 'home-outline'}
                size={24}
                color={focused ? CORES.textNavy : color}
              />
            </View>
          ),
        }}
      >
        {(props) => <TelaInicioOrganizador {...props} usuario={usuario} />}
      </Aba.Screen>

      <Aba.Screen
        name="Eventos"
        options={{
          tabBarLabel: 'Eventos',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? estilos.pilulaIconeAtivo : null}>
              <MaterialCommunityIcons
                name={focused ? 'calendar-month' : 'calendar-month-outline'}
                size={23}
                color={focused ? CORES.textNavy : color}
              />
            </View>
          ),
        }}
      >
        {() => <NavegadorEventos onLogout={onLogout} usuario={usuario} />}
      </Aba.Screen>

      <Aba.Screen
        name="Administrando"
        options={{
          tabBarLabel: 'Administrando',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? estilos.pilulaIconeAtivo : null}>
              <MaterialCommunityIcons
                name={focused ? 'cog' : 'cog-outline'}
                size={23}
                color={focused ? CORES.textNavy : color}
              />
            </View>
          ),
        }}
      >
        {() => <TelaAdministrandoOrganizador usuario={usuario} />}
      </Aba.Screen>

      <Aba.Screen
        name="Perfil"
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? estilos.pilulaIconeAtivo : null}>
              <MaterialCommunityIcons
                name="domain"
                size={23}
                color={focused ? CORES.textNavy : color}
              />
            </View>
          ),
        }}
      >
        {() => <NavegadorPerfil onLogout={onLogout} usuario={usuario} setCurrentUser={setCurrentUser} />}
      </Aba.Screen>
    </Aba.Navigator>
  );
}

/**
 * Pilha de navegação do Organizador
 */
export default function NavegadorOrganizador({ onLogout, usuario, setCurrentUser }) {
  return (
    <Pilha.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: CORES.bgHeaderDark },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Pilha.Screen
        name="AbasPrincipais"
        options={{ headerShown: false }}
      >
        {(props) => <AbasOrganizador {...props} onLogout={onLogout} usuario={usuario} setCurrentUser={setCurrentUser} />}
      </Pilha.Screen>

    </Pilha.Navigator>
  );
}

export const OrganizerNavigator = NavegadorOrganizador;

const estilos = StyleSheet.create({
  pilulaIconeAtivo: {
    backgroundColor: CORES.tabActiveGold,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 14,
  },
});
