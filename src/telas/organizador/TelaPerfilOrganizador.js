import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Card, Switch } from 'react-native-paper';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../tema/cores';
import { styles } from '../../estilos/estilosPerfilOrganizador';

export default function TelaPerfilOrganizador({ navigation, onLogout, usuario }) {
  const [notifEventos, setNotifEventos] = React.useState(true);
  const [notifPagamentos, setNotifPagamentos] = React.useState(true);
  const nomeEmpresa = usuario?.companyName?.trim() || 'Minha produtora';
  const iniciaisEmpresa = nomeEmpresa.split(/\s+/).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();
  const localEmpresa = [usuario?.companyAddress?.cidade, usuario?.companyAddress?.estado].filter(Boolean).join(', ');

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
                <Text style={styles.avatarText}>{iniciaisEmpresa}</Text>
              </View>
              <View style={styles.companyTitleWrap}>
                <Text style={styles.companyName}>{nomeEmpresa}</Text>
                <Text style={styles.companySlogan}>Empresa vinculada à sua conta</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {!!usuario?.companyCnpj && <Text style={styles.companyInfo}>CNPJ: {usuario.companyCnpj}</Text>}
            {!!(usuario?.companyEmail || usuario?.email) && <Text style={styles.companyInfo}>{usuario.companyEmail || usuario.email}</Text>}
            {!!(localEmpresa || usuario?.companyPhone || usuario?.telefone) && (
              <Text style={styles.companyInfo}>{[localEmpresa, usuario?.companyPhone || usuario?.telefone].filter(Boolean).join(' • ')}</Text>
            )}
            {!!usuario?.codigoVinculo && <Text selectable style={styles.companyInfo}>Código/ID para vínculo da equipe: {usuario.codigoVinculo}</Text>}

            <TouchableOpacity style={styles.editButton} activeOpacity={0.8} onPress={() => navigation.navigate('EditarEmpresa')}>
              <Feather name="edit-2" size={16} color={COLORS.textNavy} style={styles.iconWithGap} />
              <Text style={styles.editButtonText}>Editar dados da empresa</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Notificações */}
        <Text style={styles.sectionTitle}>Notificações</Text>
        <Card style={styles.notificationCard}>
          <Card.Content style={styles.notifContent}>
            <View style={styles.switchRow}>
              <View style={styles.flexColumn}>
                <Text style={styles.switchTitle}>Eventos e equipe</Text>
                <Text style={styles.switchSubtitle}>Pendências e eventos</Text>
              </View>
              <Switch value={notifEventos} onValueChange={setNotifEventos} color={COLORS.buttonGold} />
            </View>

            <View style={styles.divider} />

            <View style={styles.switchRow}>
              <View style={styles.flexColumn}>
                <Text style={styles.switchTitle}>Pagamentos de clientes</Text>
                <Text style={styles.switchSubtitle}>Lembretes de vencimentos</Text>
              </View>
              <Switch value={notifPagamentos} onValueChange={setNotifPagamentos} color={COLORS.buttonGold} />
            </View>
          </Card.Content>
        </Card>

        {/* Botão Sair da Conta */}
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.8}>
          <Feather name="log-out" size={18} color="#FFFFFF" style={styles.iconWithGap} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}
