// src/telas/tecnico/TelaDetalhesEventoTecnico.js

import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CORES, FONTES } from '../../tema/cores';
import { estilosDetalhesEventoTecnico as styles } from '../../estilos/estilosDetalhesEventoTecnico';
import { respondToAssignment } from '../../servicos/servicoEscala';

function formatarDataHoraFigma(dataTexto) {
  if (!dataTexto) return 'Data a confirmar';
  const data = typeof dataTexto.toDate === 'function' ? dataTexto.toDate() : new Date(dataTexto);
  if (Number.isNaN(data.getTime())) return 'Data a confirmar';
  
  const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  
  const diaSemana = dias[data.getDay()];
  const diaMes = data.getDate();
  const mes = meses[data.getMonth()];
  const hora = String(data.getHours()).padStart(2, '0');
  const minutos = String(data.getMinutes()).padStart(2, '0');
  
  return `${diaSemana}, Outubro ${diaMes} • ${hora}:${minutos}h`;
}

export default function TelaDetalhesEventoTecnico({ route, navigation }) {
  const { assignment } = route.params || {};
  const [respondendo, setRespondendo] = useState(false);

  // Usa o nome da empresa (organizador) que vem do Firebase, ou um fallback padrão
  const empresa = assignment?.nomeEmpresa || assignment?.companyName || "O Organizador";
  const titulo = assignment?.eventTitle || 'Evento Sem Título';
  const dataFormatada = formatarDataHoraFigma(assignment?.eventDate);
  const notas = assignment?.productionNotes || 'Nenhuma observação registrada.';
  const local = assignment?.locationName || assignment?.eventAddress || 'Local a confirmar';
  
  const imagemCapa = assignment?.coverUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80';

  const responderConvite = async (status) => {
    setRespondendo(true);
    try {
      await respondToAssignment({
        assignmentId: assignment.id,
        technicianUid: assignment.idUsuario,
        status: status
      });
      Alert.alert(
        "Sucesso", 
        status === 'accepted' ? "Convocação aceita! O evento foi para sua agenda." : "Convocação recusada."
      );
      navigation.goBack();
    } catch (e) {
      Alert.alert("Erro", e.message || "Não foi possível processar sua resposta.");
    } finally {
      setRespondendo(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Convocação</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationBtn} onPress={() => navigation.navigate('Notificacoes')}>
            <Feather name="bell" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitleText}>
          <Text style={styles.boldText}>{empresa}</Text> convocou você para trabalhar neste evento
        </Text>

        <View style={styles.eventCard}>
          <Image source={{ uri: imagemCapa }} style={styles.eventCover} />
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{titulo}</Text>
            <View style={styles.eventDateRow}>
              <Feather name="calendar" size={14} color="#64748B" />
              <Text style={styles.eventDateText}>{dataFormatada}</Text>
            </View>
          </View>
          
          <View style={styles.locationSection}>
            <View style={styles.locationHeader}>
              <Text style={styles.locationTitle}>Locais</Text>
              <TouchableOpacity style={styles.routeLink}>
                <Text style={styles.routeText}>Abrir rotas</Text>
                <Feather name="arrow-up-right" size={14} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.locationItem}>
              <View style={styles.locationIconBox}>
                <Feather name="map-pin" size={16} color="#EF4444" />
              </View>
              <View style={styles.locationTextColumn}>
                <Text style={styles.locationSubtitle}>Principal</Text>
                <Text style={styles.locationName}>{local}</Text>
              </View>
              <Text style={styles.locationTime}>{assignment?.eventDate ? `${new Date(assignment.eventDate).getHours()}h` : '16:00h'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>Notas da produção</Text>
          <Text style={styles.notesText}>{notas}</Text>
        </View>
      </ScrollView>

      {assignment?.status === 'pending' && (
        <View style={styles.bottomActionArea}>
          {respondendo ? (
            <ActivityIndicator size="large" color="#22C55E" style={{ marginBottom: 20 }} />
          ) : (
            <>
              <TouchableOpacity 
                style={styles.btnAccept} 
                onPress={() => responderConvite('accepted')}
              >
                <Text style={styles.btnAcceptText}>Aceitar convocação</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.btnReject} 
                onPress={() => responderConvite('declined')}
              >
                <Text style={styles.btnRejectText}>Recusar convocação</Text>
              </TouchableOpacity>
              
              <Text style={styles.disclaimer}>
                Ao aceitar, este evento será adicionado automaticamente à sua agenda.
              </Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}