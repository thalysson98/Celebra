import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { CORES_AUTENTICACAO } from '../estilos/estilosAutenticacao';
import TelaLogin from '../telas/autenticacao/TelaLogin';
import TelaCadastro from '../telas/autenticacao/TelaCadastro';

const Pilha = createStackNavigator();

export default function NavegadorAutenticacao({ onLoginSuccess, onRegisterSuccess }) {
  return (
    <Pilha.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: CORES_AUTENTICACAO.backgroundDark || '#102B46' },
      }}
    >
      <Pilha.Screen name="Login">
        {(props) => <TelaLogin {...props} onLoginSuccess={onLoginSuccess} />}
      </Pilha.Screen>
      <Pilha.Screen name="Register">
        {(props) => <TelaCadastro {...props} onRegisterSuccess={onRegisterSuccess} />}
      </Pilha.Screen>
    </Pilha.Navigator>
  );
}

export const AuthNavigator = NavegadorAutenticacao;
