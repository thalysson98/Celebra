import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { styles } from '../styles/emptyStyles';

export default function EmptyScreen({ user, onLogout }) {
  return (
    <View style={styles.screenContainer}>
      {/* 1. Header Dark Blue do Celebra */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerBrand}>
            Celebra <Text style={styles.headerStar}>✦</Text>
          </Text>
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.headerGreeting}>
          Olá, {user?.name || 'Usuário'}!
        </Text>
        <Text style={styles.headerSubtitle}>
          Conta ativa: {user?.email || user?.username}
        </Text>
      </View>

      {/* 2. Sheet Curvo com Estado Vazio */}
      <View style={styles.sheetContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>📂</Text>
            </View>

            <Text style={styles.emptyTitle}>Sua área de trabalho está vazia</Text>
            <Text style={styles.emptyDescription}>
              Você ainda não possui eventos criados ou convites atribuídos.
              Quando você criar uma proposta ou receber uma escala de equipe, tudo aparecerá aqui.
            </Text>

            <View style={styles.divider} />

            <View style={styles.actionsBox}>
              <TouchableOpacity
                style={styles.outlineLogoutBtn}
                onPress={onLogout}
                activeOpacity={0.85}
              >
                <Text style={styles.outlineLogoutText}>Desconectar e Voltar ao Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}