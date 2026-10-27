import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../styles/pendingAccessStyles';

export default function PendingAccessScreen({ user, onLogout }) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.brand}>Celebra ✦</Text>
        <Text style={styles.title}>Acesso aguardando configuração</Text>
        <Text style={styles.description}>
          {user?.email || 'Esta conta'} ainda não possui um perfil ativo de organizador ou técnico.
          Peça ao responsável pela empresa para configurar seu acesso.
        </Text>
        <TouchableOpacity style={styles.button} onPress={onLogout} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

