import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { estilosAcessoPendente } from '../../estilos/estilosAcessoPendente';

export default function TelaAcessoPendente({ user, onLogout }) {
  return (
    <View style={estilosAcessoPendente.container}>
      <View style={estilosAcessoPendente.card}>
        <Text style={estilosAcessoPendente.brand}>Celebra ✦</Text>
        <Text style={estilosAcessoPendente.title}>Acesso aguardando configuração</Text>
        <Text style={estilosAcessoPendente.description}>
          {user?.email || 'Esta conta'} ainda não possui um perfil ativo de organizador ou técnico.
          Peça ao responsável pela empresa para configurar seu acesso.
        </Text>
        <TouchableOpacity style={estilosAcessoPendente.button} onPress={onLogout} activeOpacity={0.85}>
          <Text style={estilosAcessoPendente.buttonText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
