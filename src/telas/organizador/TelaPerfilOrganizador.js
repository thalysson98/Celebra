import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Card, Switch } from 'react-native-paper';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../tema/cores';

export default function TelaPerfilOrganizador({ onLogout, usuario }) {
  const [notifEventos, setNotifEventos] = React.useState(true);
  const [notifPagamentos, setNotifPagamentos] = React.useState(true);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Minha empresa</Text>
        <Text style={styles.subtitle}>Perfil e preferências do seu negócio</Text>
      </View>

      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent}>
        {/* Card da Empresa */}
        <Card style={styles.companyCard}>
          <Card.Content style={styles.companyContent}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>BP</Text>
              </View>
              <View style={styles.companyTitleWrap}>
                <Text style={styles.companyName}>Bella Produzione Vídeos</Text>
                <Text style={styles.companySlogan}>Vídeos que contam histórias.</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.companyInfo}>CNPJ: 12.345.678/0001-90</Text>
            <Text style={styles.companyInfo}>contato@bellaproduzione.com.br</Text>
            <Text style={styles.companyInfo}>Jundiaí, SP • (11) 99999-0456</Text>

            <TouchableOpacity style={styles.editButton} activeOpacity={0.8}>
              <Feather name="edit-2" size={16} color={COLORS.textNavy} style={{ marginRight: 8 }} />
              <Text style={styles.editButtonText}>Editar dados da empresa</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Notificações */}
        <Text style={styles.sectionTitle}>Notificações</Text>
        <Card style={styles.notificationCard}>
          <Card.Content style={styles.notifContent}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Eventos e equipe</Text>
                <Text style={styles.switchSubtitle}>Pendências e eventos</Text>
              </View>
              <Switch value={notifEventos} onValueChange={setNotifEventos} color={COLORS.buttonGold} />
            </View>

            <View style={styles.divider} />

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Pagamentos de clientes</Text>
                <Text style={styles.switchSubtitle}>Lembretes de vencimentos</Text>
              </View>
              <Switch value={notifPagamentos} onValueChange={setNotifPagamentos} color={COLORS.buttonGold} />
            </View>
          </Card.Content>
        </Card>

        {/* Botão Sair da Conta */}
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.8}>
          <Feather name="log-out" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgHeaderDark },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.textWhite },
  subtitle: { fontSize: 13, color: COLORS.headerSubtitle, marginTop: 4 },
  sheet: { flex: 1, backgroundColor: COLORS.sheetBg, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  sheetContent: { padding: 16 },
  companyCard: { backgroundColor: COLORS.cardWhite, borderRadius: 18, marginBottom: 20 },
  companyContent: { padding: 16 },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.bgHeaderDark, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  avatarText: { color: COLORS.buttonGold, fontSize: 18, fontWeight: '700' },
  companyTitleWrap: { flex: 1 },
  companyName: { fontSize: 17, fontWeight: '700', color: COLORS.textNavy },
  companySlogan: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.cardDivider, marginVertical: 12 },
  companyInfo: { fontSize: 13, color: COLORS.textMuted, marginBottom: 4 },
  editButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.buttonGold, borderRadius: 12, paddingVertical: 12, marginTop: 14 },
  editButtonText: { fontSize: 14, fontWeight: '700', color: COLORS.textNavy },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textNavy, marginBottom: 10, marginTop: 4 },
  notificationCard: { backgroundColor: COLORS.cardWhite, borderRadius: 18, marginBottom: 24 },
  notifContent: { padding: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  switchTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textNavy },
  switchSubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  logoutButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#EF4444', borderRadius: 14, paddingVertical: 14 },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
