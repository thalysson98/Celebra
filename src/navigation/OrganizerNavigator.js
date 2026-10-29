import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS } from '../theme/colors';

// Telas das Abas do Organizador
import TelaInicioOrganizador from '../screens/organizer/TelaInicioOrganizador';
import TelaListaEventos from '../screens/organizer/TelaListaEventos';
import TelaAdministrandoOrganizador from '../screens/organizer/TelaAdministrandoOrganizador';
import TelaPerfilOrganizador from '../screens/organizer/TelaPerfilOrganizador';

// Subtelas da Pilha (Criação e Detalhes)
import TelaCriarEvento from '../screens/organizer/TelaCriarEvento';
import TelaDetalheEvento from '../screens/organizer/TelaDetalheEvento';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

/**
 * As 4 Abas Inferiores do Organizador (Figma)
 */
function OrganizerTabs({ onLogout, usuario }) {
  return (
    <Tab.Navigator
      initialRouteName="Inicio"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.textNavy,
        tabBarInactiveTintColor: COLORS.textSubtle,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: COLORS.cardDivider,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Inicio"
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconPill : null}>
              <MaterialCommunityIcons
                name={focused ? 'home' : 'home-outline'}
                size={24}
                color={focused ? COLORS.textNavy : color}
              />
            </View>
          ),
        }}
      >
        {(props) => <TelaInicioOrganizador {...props} usuario={usuario} />}
      </Tab.Screen>

      <Tab.Screen
        name="Eventos"
        options={{
          tabBarLabel: 'Eventos',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconPill : null}>
              <MaterialCommunityIcons
                name={focused ? 'calendar-month' : 'calendar-month-outline'}
                size={23}
                color={focused ? COLORS.textNavy : color}
              />
            </View>
          ),
        }}
      >
        {(props) => <TelaListaEventos {...props} onLogout={onLogout} />}
      </Tab.Screen>

      <Tab.Screen
        name="Administrando"
        component={TelaAdministrandoOrganizador}
        options={{
          tabBarLabel: 'Administrando',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconPill : null}>
              <MaterialCommunityIcons
                name={focused ? 'cog' : 'cog-outline'}
                size={23}
                color={focused ? COLORS.textNavy : color}
              />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Perfil"
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconPill : null}>
              <MaterialCommunityIcons
                name="domain"
                size={23}
                color={focused ? COLORS.textNavy : color}
              />
            </View>
          ),
        }}
      >
        {(props) => <TelaPerfilOrganizador {...props} onLogout={onLogout} usuario={usuario} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

/**
 * Pilha de navegação do Organizador contendo as abas e telas filhas
 */
export default function OrganizerNavigator({ onLogout, usuario }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.bgHeaderDark },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="AbasPrincipais"
        options={{ headerShown: false }}
      >
        {(props) => <OrganizerTabs {...props} onLogout={onLogout} usuario={usuario} />}
      </Stack.Screen>

      <Stack.Screen
        name="CriarEvento"
        component={TelaCriarEvento}
        options={{ title: 'Criar Novo Evento' }}
      />

      <Stack.Screen
        name="DetalheEvento"
        component={TelaDetalheEvento}
        options={{ title: 'Detalhes do Evento' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  activeIconPill: {
    backgroundColor: COLORS.tabActiveGold,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 14,
  },
});
