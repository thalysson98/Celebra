import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Card, Switch } from 'react-native-paper';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { COLORS } from '../../tema/cores';
import { styles } from '../../estilos/estilosPerfilOrganizador';

export default function TelaPerfilOrganizador({ navigation, onLogout, usuario }) {
  const [notifEventos, setNotifEventos] = useState(true);
  const [notifPagamentos, setNotifPagamentos] = useState(true);
  const [copiado, setCopiado] = useState(false);

  const nomeEmpresa = usuario?.companyName?.trim() || 'Minha produtora';
  const iniciaisEmpresa = nomeEmpresa.split(/\s+/).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();
  const localEmpresa = [usuario?.companyAddress?.cidade, usuario?.companyAddress?.estado].filter(Boolean).join(', ');
  const codigoVinculo = usuario?.codigoVinculo || usuario?.idEmpresa || usuario?.companyId || '';

  const copiarCodigo = async () => {
    if (!codigoVinculo) return;
    try {
      await Clipboard.setStringAsync(codigoVinculo);
      setCopiado(true);
      Toast.show({
        type: 'success',
        text1: 'Código copiado!',
        text2: 'O ID da empresa foi copiado para a área de transferência.',
      });
      setTimeout(() => setCopiado(false), 2500);
    } catch (e) {
      console.warn('Erro ao copiar código:', e);
    }
  };

  return (
    <View style={styles.container}>
      
      <View style={styles.header}>
        <Text style={styles.title}>Minha empresa</Text>
        <Text style={styles.subtitle}>Perfil e preferências do seu negócio</Text>
      </View>

      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent}>

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

            
            {!!codigoVinculo && (
              <View style={styles.codigoContainer}>
                <Text style={styles.codigoLabel}>Código / ID para vínculo da equipe</Text>
                <View style={styles.codigoRow}>
                  <Text selectable style={styles.codigoText} numberOfLines={1} ellipsizeMode="middle">
                    {codigoVinculo}
                  </Text>
                  <TouchableOpacity
                    style={[styles.botaoCopiar, copiado && styles.botaoCopiarCopiado]}
                    onPress={copiarCodigo}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={copiado ? 'check' : 'copy'}
                      size={14}
                      color={copiado ? '#059669' : COLORS.textNavy}
                    />
                    <Text style={[styles.botaoCopiarTexto, copiado && styles.botaoCopiarTextoCopiado]}>
                      {copiado ? 'Copiado!' : 'Copiar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.editButton} activeOpacity={0.8} onPress={() => navigation.navigate('EditarEmpresa')}>
              <Feather name="edit-2" size={16} color={COLORS.textNavy} style={styles.iconWithGap} />
              <Text style={styles.editButtonText}>Editar dados da empresa</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>


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

       
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.8}>
          <Feather name="log-out" size={18} color="#FFFFFF" style={styles.iconWithGap} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}
