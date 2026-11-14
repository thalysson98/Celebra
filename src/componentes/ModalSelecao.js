// src/componentes/ModalSelecao.js

import React, { useState, useMemo } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { CORES, FONTES } from '../tema/cores';

export default function ModalSelecao({ visible, onClose, titulo, opcoes = [], onSelecionar, onAdicionarNovo, onEditar, carregando }) {
  const [busca, setBusca] = useState('');

  const opcoesFiltradas = useMemo(() => {
    return opcoes.filter(item => 
      String(item.nome || '').toLocaleLowerCase('pt-BR').includes(busca.trim().toLocaleLowerCase('pt-BR'))
    );
  }, [opcoes, busca]);

  const handleCriarNovo = () => {
    if (busca.trim() && onAdicionarNovo) {
      onAdicionarNovo(busca.trim());
      setBusca('');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <Text style={styles.title}>{titulo}</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button">
              <MaterialCommunityIcons name="close" size={24} color={CORES.textMuted} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <Feather name="search" size={18} color={CORES.textMuted} style={styles.searchIcon} />
            <TextInput 
              value={busca} 
              onChangeText={setBusca} 
              placeholder="Digite para buscar ou criar novo..." 
              placeholderTextColor={CORES.textSubtle} 
              style={styles.searchInput} 
            />
          </View>
          
          {busca.trim().length > 0 && onAdicionarNovo && !opcoesFiltradas.some(op => op.nome.toLowerCase() === busca.trim().toLowerCase()) && (
            <TouchableOpacity style={styles.btnNovo} onPress={handleCriarNovo}>
              <Feather name="plus-circle" size={18} color="#10B981" style={{marginRight: 8}} />
              <Text style={styles.textoNovo}>Criar novo: "{busca.trim()}"</Text>
            </TouchableOpacity>
          )}

          {carregando ? (
            <ActivityIndicator size="large" color={CORES.buttonGold} style={{ marginVertical: 30 }} />
          ) : opcoesFiltradas.length > 0 ? (
            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
              {opcoesFiltradas.map((item) => (
                <View key={item.id} style={styles.row}>
                  <TouchableOpacity onPress={() => { setBusca(''); onSelecionar(item); }} style={styles.option}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={styles.itemText}>{item.nome}</Text>
                      {!!(item.endereco_completo || item.descricao) && (
                        <Text style={styles.itemSubText} numberOfLines={1}>
                          {item.endereco_completo || item.descricao}
                        </Text>
                      )}
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={CORES.textMuted} />
                  </TouchableOpacity>
                  <View style={styles.rowActions}>
                    {onEditar && (
                      <TouchableOpacity
                        onPress={() => onEditar(item)}
                        accessibilityRole="button"
                        accessibilityLabel={`Editar ${item.nome}`}
                        style={styles.editButton}
                      >
                        <MaterialCommunityIcons name="pencil-outline" size={18} color={CORES.textNavy} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.empty}>Nenhum cadastro encontrado.</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%', elevation: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 18 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, marginBottom: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontFamily: FONTES.body, minHeight: 48, color: CORES.textNavy, fontSize: 15 },
  btnNovo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#A7F3D0' },
  textoNovo: { color: '#047857', fontFamily: FONTES.bold, fontSize: 15 },
  list: { maxHeight: 350 },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingVertical: 8 },
  option: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editButton: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  itemText: { fontFamily: FONTES.body, color: CORES.textNavy, fontSize: 15 },
  itemSubText: { fontFamily: FONTES.body, color: '#64748B', fontSize: 12, marginTop: 2 },
  empty: { fontFamily: FONTES.body, paddingVertical: 24, color: CORES.textMuted, fontSize: 14, textAlign: 'center' }
});