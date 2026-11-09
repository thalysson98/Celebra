// src/telas/tecnico/TelaDetalhesEventoTecnico.js
import React, { useCallback, useState } from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Card, Button } from 'react-native-paper';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { CORES, FONTES } from '../../tema/cores';
import { estilosDetalhesEventoTecnico as styles } from '../../estilos/estilosDetalhesEventoTecnico';
import { respondToAssignment } from '../../servicos/servicoEscala';
import { repositorioEventos } from '../../servicos/repositorioEventos';
import CartaoLocal from '../../componentes/CartaoLocal';

export default function TelaDetalhesEventoTecnico({ route, navigation }) {
  const { assignment } = route.params || {};
  const [respondendo, setRespondendo] = useState(false);
  const [eventoDetalhado, setEventoDetalhado] = useState(null);
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(true);

  const [modalSucessoVisivel, setModalSucessoVisivel] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState({ titulo: '', descricao: '' });
  const [modalErroVisivel, setModalErroVisivel] = useState(false);
  const [msgErro, setMsgErro] = useState('');
  
  const isAccepted = assignment?.status === 'accepted';
  const empresa = assignment?.nomeEmpresa || assignment?.companyName || "O Organizador";

  const carregarEvento = useCallback(async () => {
    if (!assignment?.idEvento) return;
    try {
      const dados = await repositorioEventos.obterEvento(assignment.idEvento);
      setEventoDetalhado(dados);
    } catch (error) {
      mostrarErro('Não foi possível carregar os detalhes complementares do evento.');
    } finally {
      setCarregandoDetalhes(false);
    }
  }, [assignment?.idEvento]);

  useFocusEffect(useCallback(() => { carregarEvento(); }, [carregarEvento]));

  const mostrarSucesso = (titulo, descricao) => {
    setMsgSucesso({ titulo, descricao });
    setModalSucessoVisivel(true);
  };

  const mostrarErro = (mensagem) => {
    setMsgErro(mensagem);
    setModalErroVisivel(true);
  };

  const responderConvite = async (status) => {
    setRespondendo(true);
    try {
      await respondToAssignment({
        assignmentId: assignment.id,
        technicianUid: assignment.idUsuario,
        status: status
      });
      mostrarSucesso(
        "Sucesso", 
        status === 'accepted' ? "Convocação aceita! O evento foi para sua agenda." : "Convocação recusada."
      );
    } catch (e) {
      mostrarErro(e.message || "Não foi possível processar sua resposta.");
      setRespondendo(false);
    }
  };

  const fecharComSucesso = () => {
    setModalSucessoVisivel(false);
    navigation.goBack();
  };

  const titulo = eventoDetalhado?.titulo || assignment?.eventTitle || 'Evento Sem Título';
  
  let dataFormatada = 'Data a confirmar';
  if (eventoDetalhado?.dataInicio) {
    dataFormatada = eventoDetalhado.dataInicio;
  } else if (assignment?.eventDate) {
    const d = new Date(assignment.eventDate);
    dataFormatada = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  let horaFormatada = 'Horário a confirmar';
  if (eventoDetalhado?.horaInicio) {
    horaFormatada = eventoDetalhado.horaInicio;
  } else if (assignment?.eventDate) {
    const d = new Date(assignment.eventDate);
    horaFormatada = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}h`;
  }
  
  const notas = eventoDetalhado?.notasProducao || assignment?.productionNotes || 'Nenhuma observação registrada.';
  
  const locaisBase = eventoDetalhado?.locais || (assignment?.eventAddress ? [{ enderecoLocal: assignment.eventAddress, tipoLocal: 'Local Principal' }] : []);
  const locaisOrdenados = [...locaisBase].sort((a, b) => (a.horaLocal || horaFormatada).localeCompare(b.horaLocal || horaFormatada));
  
  const equipe = (eventoDetalhado?.equipe || []).filter(p => p.statusConfirmacao === 'Confirmado' || p.statusConfirmacao === 'Informativo' || p.enviarConvite === false);
  const quantidadeConvidados = Number(eventoDetalhado?.numConvidados ?? 0);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
            <Text style={styles.headerTitle}>{isAccepted ? 'Detalhes do Evento' : 'Convocação'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationBtn} onPress={() => navigation.navigate('Notificacoes')}>
            <Feather name="bell" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {carregandoDetalhes ? (
        <View style={styles.center}><ActivityIndicator size="large" color={CORES.buttonGold} /></View>
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {isAccepted ? (
             <Text style={styles.subtitleText}>
               Você está confirmado na equipe de <Text style={styles.boldText}>{empresa}</Text> para este evento.
             </Text>
          ) : (
             <Text style={styles.subtitleText}>
               <Text style={styles.boldText}>{empresa}</Text> convocou você para trabalhar neste evento.
             </Text>
          )}

          <Card style={[styles.card, { padding: 0, marginBottom: 20 }]}>
            <Card.Content style={{ padding: 20 }}>
              
              <Text style={styles.tipoBadgeDetalhe}>
                {(eventoDetalhado?.tipoEvento || assignment?.eventTypeName || 'EVENTO').toUpperCase()}
              </Text>
              
              <Text style={styles.tituloEventoDetalhe}>{titulo}</Text>
              
              <Text style={styles.funcaoDetalhe}>
                Sua função: {assignment?.roleName || 'Equipe'}
              </Text>

              <View style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                   <View style={{width: 32, height: 32, borderRadius: 8, backgroundColor: '#EAF3F7', alignItems: 'center', justifyContent: 'center', marginRight: 12}}>
                      <Feather name="calendar" size={16} color={CORES.textNavy} />
                   </View>
                   <View>
                      <Text style={{ fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 12 }}>Data do evento</Text>
                      <Text style={{ fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 15 }}>{dataFormatada}</Text>
                   </View>
                 </View>
                 <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                   <View style={{width: 32, height: 32, borderRadius: 8, backgroundColor: '#EAF3F7', alignItems: 'center', justifyContent: 'center', marginRight: 12}}>
                      <Feather name="clock" size={16} color={CORES.textNavy} />
                   </View>
                   <View>
                      <Text style={{ fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 12 }}>Horário</Text>
                      <Text style={{ fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 15 }}>{horaFormatada}</Text>
                   </View>
                 </View>
                 <View
                   accessible
                   accessibilityLabel={`Quantidade de convidados: ${quantidadeConvidados}`}
                   style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}
                 >
                   <View style={{width: 32, height: 32, borderRadius: 8, backgroundColor: '#EAF3F7', alignItems: 'center', justifyContent: 'center', marginRight: 12}}>
                     <Feather name="users" size={16} color={CORES.textNavy} />
                   </View>
                   <View>
                     <Text style={{ fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 12 }}>Convidados</Text>
                     <Text style={{ fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 15 }}>{quantidadeConvidados}</Text>
                   </View>
                 </View>
              </View>
            </Card.Content>
          </Card>

          <Text style={styles.sectionTitle}>Locais do Evento</Text>
          {locaisOrdenados.length > 0 ? locaisOrdenados.map((local, index) => (
             <CartaoLocal key={index} local={local} fallbackHora={horaFormatada} />
          )) : <Text style={styles.sectionHint}>Nenhum local cadastrado.</Text>}

          <Text style={styles.sectionTitle}>Equipe Confirmada</Text>
          {equipe.length > 0 ? (
            <Card style={styles.card}><Card.Content>
              {equipe.map((pessoa, index) => (
                <View key={pessoa.id || index} style={styles.personRow}>
                  <View style={styles.personIcon}><MaterialCommunityIcons name="account-outline" size={24} color={CORES.textNavy} /></View>
                  <View style={styles.personInfo}>
                    <Text style={styles.personName} numberOfLines={1}>{pessoa.nomeProfissional}</Text>
                    <Text style={styles.personMeta} numberOfLines={1}>{pessoa.funcao}</Text>
                  </View>
                </View>
              ))}
            </Card.Content></Card>
          ) : (
            <Text style={styles.sectionHint}>Nenhum outro profissional confirmado ainda.</Text>
          )}

          <Text style={styles.sectionTitle}>Notas da produção</Text>
          <Card style={styles.card}><Card.Content>
            <Text style={styles.noteText}>{notas}</Text>
          </Card.Content></Card>

        </ScrollView>
      )}

      {assignment?.status === 'pending' && !carregandoDetalhes && (
        <View style={styles.bottomActionArea}>
          {respondendo ? (
            <ActivityIndicator size="large" color="#10B981" style={{ marginBottom: 20 }} />
          ) : (
            <>
              <TouchableOpacity style={styles.btnAccept} onPress={() => responderConvite('accepted')}>
                <Text style={styles.btnAcceptText}>Aceitar convocação</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.btnReject} onPress={() => responderConvite('declined')}>
                <Text style={styles.btnRejectText}>Recusar convocação</Text>
              </TouchableOpacity>
              
              <Text style={styles.disclaimer}>Ao aceitar, este evento será adicionado automaticamente à sua agenda.</Text>
            </>
          )}
        </View>
      )}

      {/* MODAIS GERAIS */}
      <Modal visible={modalSucessoVisivel} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center' }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#E6F8F0', justifyContent: 'center', alignItems: 'center', marginBottom: 15 }}>
              <Feather name="check" size={32} color="#10B981" />
            </View>
            <Text style={{ fontFamily: FONTES.bold, fontSize: 18, color: CORES.textNavy, marginBottom: 8, textAlign: 'center' }}>{msgSucesso.titulo}</Text>
            <Text style={{ fontFamily: FONTES.body, fontSize: 14, color: CORES.textMuted, textAlign: 'center', marginBottom: 20 }}>{msgSucesso.descricao}</Text>
            <Button mode="contained" style={{ width: '100%', borderRadius: 10 }} buttonColor={CORES.buttonGold} textColor={CORES.textNavy} onPress={fecharComSucesso}>Ok</Button>
          </View>
        </View>
      </Modal>

      <Modal visible={modalErroVisivel} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center' }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 15 }}>
              <Feather name="alert-triangle" size={32} color="#EF4444" />
            </View>
            <Text style={{ fontFamily: FONTES.bold, fontSize: 18, color: CORES.textNavy, marginBottom: 8, textAlign: 'center' }}>Atenção</Text>
            <Text style={{ fontFamily: FONTES.body, fontSize: 14, color: CORES.textMuted, textAlign: 'center', marginBottom: 20 }}>{msgErro}</Text>
            <Button mode="contained" style={{ width: '100%', borderRadius: 10 }} buttonColor="#EF4444" textColor="#FFF" onPress={() => setModalErroVisivel(false)}>Ok, entendi</Button>
          </View>
        </View>
      </Modal>

    </View>
  );
}