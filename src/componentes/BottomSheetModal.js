import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  FlatList, 
  TextInput, 
  StyleSheet 
} from 'react-native';
import { Icon } from 'react-native-paper';

export default function BottomSheetModal({ 
  isVisible, 
  onClose, 
  title, 
  data = [], 
  onSelect, 
  selectedItem,
  onAddNew 
}) {
  const [busca, setBusca] = useState('');

  // Filtragem simples para busca
  const dadosFiltrados = [];
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const termo = busca.toLowerCase();
    const nome = (item.nome || item.titulo || '').toLowerCase();
    if (nome.includes(termo)) {
      dadosFiltrados.push(item);
    }
  }

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={estilos.overlay}>
        <TouchableOpacity style={estilos.areaFecharScrim} activeOpacity={1} onPress={onClose} />
        
        <View style={estilos.sheetContainer}>
          {/* DRAG HANDLE */}
          <View style={estilos.dragHandle} />

          {/* CABEÇALHO */}
          <View style={estilos.header}>
            <View>
              <Text style={estilos.titulo}>{title || 'Selecionar Opção'}</Text>
              <Text style={estilos.subtitulo}>Escolha uma opção abaixo</Text>
            </View>
            <TouchableOpacity style={estilos.botaoFechar} onPress={onClose}>
              <Icon source="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* CAMPO DE BUSCA */}
          <View style={estilos.containerBusca}>
            <Icon source="magnify" size={18} color="#888" />
            <TextInput
              style={estilos.inputBusca}
              placeholder="Buscar opção..."
              placeholderTextColor="#999"
              value={busca}
              onChangeText={setBusca}
            />
          </View>

          {/* LISTA DE OPÇÕES */}
          <FlatList
            data={dadosFiltrados}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => {
              const estaSelecionado = selectedItem === item.nome;
              return (
                <TouchableOpacity 
                  style={[estilos.itemLista, estaSelecionado && estilos.itemSelecionado]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <View style={estilos.avatarItem}>
                    <Icon source="format-list-bulleted" size={18} color="#0B2545" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={estilos.textoItemPrincipal}>{item.nome || item.titulo}</Text>
                    {item.descricao != null && <Text style={estilos.textoItemSecundario}>{item.descricao}</Text>}
                  </View>
                  {estaSelecionado && <Icon source="check-circle" size={20} color="#FFC107" />}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={estilos.textoVazio}>Nenhum item encontrado.</Text>
            }
          />

          {/* BOTÃO CADASTRAR NOVO EM DESTAQUE */}
          {onAddNew != null && (
            <TouchableOpacity style={estilos.botaoCadastrarNovoDestaque} onPress={onAddNew}>
              <Icon source="plus-circle" size={20} color="#0B2545" />
              <Text style={estilos.textoCadastrarNovoDestaque}>+ Cadastrar Novo Item</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  areaFecharScrim: { flex: 1 },
  sheetContainer: { 
    backgroundColor: '#FFF', 
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28, 
    paddingHorizontal: 20, 
    paddingTop: 12, 
    paddingBottom: 30, 
    maxHeight: '80%' 
  },
  dragHandle: { width: 40, height: 5, backgroundColor: '#DDD', borderRadius: 3, alignSelf: 'center', marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  titulo: { fontSize: 18, fontWeight: 'bold', color: '#0B2545' },
  subtitulo: { fontSize: 12, color: '#777', marginTop: 2 },
  botaoFechar: { backgroundColor: '#F0F0F0', padding: 6, borderRadius: 20 },
  containerBusca: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 12, marginBottom: 15 },
  inputBusca: { flex: 1, paddingVertical: 10, paddingLeft: 8, fontSize: 14, color: '#333' },
  itemLista: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', borderRadius: 8, paddingHorizontal: 8 },
  itemSelecionado: { backgroundColor: '#FFF9E6', borderColor: '#FFC107', borderWidth: 1 },
  avatarItem: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' },
  textoItemPrincipal: { fontSize: 15, fontWeight: '600', color: '#333' },
  textoItemSecundario: { fontSize: 12, color: '#777' },
  textoVazio: { textAlign: 'center', color: '#999', marginVertical: 20 },
  botaoCadastrarNovoDestaque: { backgroundColor: '#FFC107', padding: 14, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  textoCadastrarNovoDestaque: { color: '#0B2545', fontWeight: 'bold', fontSize: 15, marginLeft: 8 }
});