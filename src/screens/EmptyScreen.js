import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { COLORS, FONTS } from '../theme/colors';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../database/userDb';

export default function EmptyScreen({ user, onLogout }) {
  const [crudModalVisible, setCrudModalVisible] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsersList(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenEdit = (targetUser) => {
    setEditingUser(targetUser);
    setEditName(targetUser.name);
    setEditUsername(targetUser.username);
    setEditPassword('');
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editUsername.trim()) {
      Alert.alert('Erro', 'Nome e usuário são obrigatórios.');
      return;
    }

    try {
      await updateUser(editingUser.id, editName, editUsername, editPassword);
      Alert.alert('Sucesso', 'Usuário atualizado no banco de dados!');
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      Alert.alert('Erro ao atualizar', error.message);
    }
  };

  const handleDelete = (targetUser) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente remover o usuário "${targetUser.name}" (${targetUser.username}) do banco?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(targetUser.id);
              Alert.alert('Removido', 'Usuário excluído do banco de dados.');
              loadUsers();
            } catch (error) {
              Alert.alert('Erro', error.message);
            }
          },
        },
      ]
    );
  };

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
          Conta ativa: {user?.username}
        </Text>
      </View>

      {/* 2. Sheet Curvo com Estado Vazio */}
      <View style={styles.sheetContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Card Principal: Estado Vazio */}
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

            {/* Ações disponíveis na tela vazia */}
            <View style={styles.actionsBox}>
              <TouchableOpacity
                style={styles.crudButton}
                onPress={() => {
                  loadUsers();
                  setCrudModalVisible(true);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.crudButtonIcon}>⚙️</Text>
                <Text style={styles.crudButtonText}>
                  Gerenciar Banco de Dados (CRUD Usuários)
                </Text>
              </TouchableOpacity>

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

      {/* Modal de Gestão do CRUD de Usuários */}
      <Modal
        visible={crudModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setEditingUser(null);
          setCrudModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Banco de Dados (SQLite)</Text>
                <Text style={styles.modalSubtitle}>CRUD completo de Usuários</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setEditingUser(null);
                  setCrudModalVisible(false);
                }}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Formulário de Edição (UPDATE) */}
            {editingUser ? (
              <View style={styles.editSection}>
                <Text style={styles.editSectionTitle}>
                  Editando Usuário #{editingUser.id}
                </Text>

                <TextInput
                  style={styles.crudInput}
                  placeholder="Nome"
                  value={editName}
                  onChangeText={setEditName}
                />
                <TextInput
                  style={styles.crudInput}
                  placeholder="Usuário / E-mail"
                  value={editUsername}
                  onChangeText={setEditUsername}
                  autoCapitalize="none"
                />
                <TextInput
                  style={styles.crudInput}
                  placeholder="Nova Senha (opcional)"
                  value={editPassword}
                  onChangeText={setEditPassword}
                  secureTextEntry
                />

                <View style={styles.editButtonsRow}>
                  <TouchableOpacity
                    style={styles.saveEditBtn}
                    onPress={handleSaveEdit}
                  >
                    <Text style={styles.saveEditText}>Salvar Alterações</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelEditBtn}
                    onPress={() => setEditingUser(null)}
                  >
                    <Text style={styles.cancelEditText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Lista de Usuários (READ & DELETE) */
              <ScrollView style={styles.usersScrollView}>
                <Text style={styles.listLabel}>
                  Total de Contas Cadastradas: {usersList.length}
                </Text>
                {usersList.map((item) => (
                  <View key={item.id} style={styles.userItemCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.userItemName}>{item.name}</Text>
                      <Text style={styles.userItemUsername}>@{item.username}</Text>
                      <Text style={styles.userItemId}>ID: #{item.id}</Text>
                    </View>

                    <View style={styles.userItemActions}>
                      <TouchableOpacity
                        style={styles.actionPillEdit}
                        onPress={() => handleOpenEdit(item)}
                      >
                        <Text style={styles.actionPillEditText}>Editar ✎</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionPillDelete}
                        onPress={() => handleDelete(item)}
                      >
                        <Text style={styles.actionPillDeleteText}>Excluir 🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.bgHeaderDark,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 22,
    backgroundColor: COLORS.bgHeaderDark,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerBrand: {
    fontFamily: FONTS.heading,
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  headerStar: {
    color: COLORS.buttonGold,
    fontSize: 22,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.buttonGold,
  },
  headerGreeting: {
    fontFamily: FONTS.heading,
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  headerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.headerSubtitle,
    marginTop: 2,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: COLORS.sheetBg,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCard: {
    backgroundColor: COLORS.cardWhite,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontFamily: FONTS.heading,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textNavy,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyDescription: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    width: '100%',
    marginVertical: 20,
  },
  actionsBox: {
    width: '100%',
    gap: 12,
  },
  crudButton: {
    backgroundColor: COLORS.buttonGold,
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  crudButtonIcon: {
    fontSize: 16,
  },
  crudButtonText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textNavy,
  },
  outlineLogoutBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineLogoutText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textNavy,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 24, 44, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.cardWhite,
    borderRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: FONTS.heading,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textNavy,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
  listLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  usersScrollView: {
    maxHeight: 340,
  },
  userItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textNavy,
  },
  userItemUsername: {
    fontSize: 12,
    color: COLORS.buttonGoldHover,
    marginTop: 2,
  },
  userItemId: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  userItemActions: {
    gap: 6,
  },
  actionPillEdit: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionPillEditText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  actionPillDelete: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionPillDeleteText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  editSection: {
    paddingVertical: 6,
  },
  editSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textNavy,
    marginBottom: 12,
  },
  crudInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    height: 46,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 10,
    color: COLORS.textNavy,
  },
  editButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  saveEditBtn: {
    flex: 1,
    backgroundColor: COLORS.buttonGold,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveEditText: {
    fontWeight: '700',
    color: COLORS.textNavy,
    fontSize: 13,
  },
  cancelEditBtn: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelEditText: {
    fontWeight: '600',
    color: COLORS.textNavy,
    fontSize: 13,
  },
});
