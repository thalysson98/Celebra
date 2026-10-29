import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import { COLORS } from '../../tema/cores';

export default function TelaAdministrandoOrganizador() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Minha empresa</Text>
        <Text style={styles.subtitle}>Administrando seu negÃ³cio</Text>
      </View>
      <View style={styles.sheet}>
        <Text style={styles.placeholder}>Ãrea de Cadastros e CatÃ¡logos (Tipos de evento, profissional, locais e clientes)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgHeaderDark },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.textWhite },
  subtitle: { fontSize: 13, color: COLORS.headerSubtitle, marginTop: 4 },
  sheet: { flex: 1, backgroundColor: COLORS.sheetBg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, justifyContent: 'center', alignItems: 'center' },
  placeholder: { textAlign: 'center', color: COLORS.textMuted, fontSize: 15 },
});

