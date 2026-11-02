// src/componentes/Cabecalho.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CORES, FONTES } from '../tema/cores';

export default function Cabecalho({ titulo, subtitulo, mostrarVoltar = false, aoVoltar, mostrarSino = true, aoClicarSino }) {
  return (
    <View style={estilos.header}>
      <View style={estilos.row}>
        {mostrarVoltar && (
          <TouchableOpacity style={estilos.backBtn} onPress={aoVoltar}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <View style={estilos.textContainer}>
          <Text style={estilos.titulo} numberOfLines={1}>{titulo}</Text>
          {!!subtitulo && <Text style={estilos.subtitulo} numberOfLines={1}>{subtitulo}</Text>}
        </View>
      </View>
      {mostrarSino && (
        <TouchableOpacity style={estilos.sinoBtn} onPress={aoClicarSino}>
          <Feather name="bell" size={19} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  header: {
    backgroundColor: CORES.bgHeaderDark, // <-- AJUSTE AQUI: Puxando o azul escuro padrão do app
    paddingHorizontal: 20,
    paddingTop: 16, 
    paddingBottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 96,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  titulo: {
    color: CORES.textWhite,
    fontFamily: FONTES.bold,
    fontSize: 22,
  },
  subtitulo: {
    color: '#8CA0B3',
    fontFamily: FONTES.body,
    fontSize: 13,
    marginTop: 4,
  },
  sinoBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});