import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { CORES } from '../../tema/cores';
import { styles } from '../../estilos/estilosDetalheEventoOrganizador';
import { repositorioEventos } from '../../servicos/repositorioEventos';

const ABAS = ['Geral', 'Locais', 'Equipe', 'Financeiro'];
const Linha = ({ icone, titulo, valor }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIcon}><MaterialCommunityIcons name={icone} size={18} color={CORES.textNavy} /></View>
    <View style={styles.detailText}><Text style={styles.detailLabel}>{titulo}</Text><Text style={styles.detailValue}>{valor || 'Não informado'}</Text></View>
  </View>
);

export default function TelaDetalheEvento({ route }) {
  const { idEvento } = route.params || {};
  const [evento, setEvento] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('Geral');

  const carregarEvento = useCallback(async () => {
    setCarregando(true);
    try {
      setEvento(await repositorioEventos.obterEvento(idEvento));
    } finally {
      setCarregando(false);
    }
  }, [idEvento]);

  useFocusEffect(useCallback(() => { carregarEvento(); }, [carregarEvento]));

  if (carregando) return <View style={styles.center}><ActivityIndicator size="large" color={CORES.buttonGold} /><Text style={styles.loadingText}>Carregando evento...</Text></View>;
  if (!evento) return <View style={styles.center}><MaterialCommunityIcons name="calendar-remove-outline" size={38} color={CORES.textMuted} /><Text style={styles.notFound}>Evento não encontrado.</Text></View>;

  const local = evento.locais?.[0] || evento.locaisDoEvento?.[0] || null;
  const equipe = evento.equipa || evento.equipaDeCampo || [];
  const financeiro = evento.financeiro || {};

  return (
    <View style={styles.container}>
      <View style={styles.eventHeader}>
        <View style={styles.headerType}><Text style={styles.typeText}>{evento.tipoEvento || 'Evento'}</Text></View>
        <Text style={styles.title}>{evento.titulo}</Text>
        <Text style={styles.subtitle}>{evento.cliente?.nome || 'Cliente não informado'}</Text>
        <View style={styles.status}><View style={styles.statusDot} /><Text style={styles.statusText}>{evento.statusEquipa || 'Equipe pendente'}</Text></View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
        {ABAS.map((aba) => <Button key={aba} mode={abaAtiva === aba ? 'contained' : 'text'} onPress={() => setAbaAtiva(aba)} buttonColor={abaAtiva === aba ? CORES.tabActiveGold : 'transparent'} textColor={CORES.textNavy} compact style={styles.tabButton}>{aba}</Button>)}
      </ScrollView>
      <ScrollView style={styles.sheet} contentContainerStyle={styles.content}>
        {abaAtiva === 'Geral' && <>
          <Text style={styles.sectionTitle}>Informações gerais</Text>
          <Card style={styles.card}><Card.Content>
            <Linha icone="calendar-month-outline" titulo="Data" valor={evento.dataInicio} />
            <Linha icone="clock-outline" titulo="Horário" valor={evento.horaInicio} />
            <Linha icone="account-group-outline" titulo="Convidados" valor={evento.numConvidados ? String(evento.numConvidados) : null} />
            <Linha icone="account-outline" titulo="Cliente" valor={evento.cliente?.nome} />
          </Card.Content></Card>
          <Text style={styles.sectionTitle}>Notas da produção</Text>
          <Card style={styles.card}><Card.Content><Text style={styles.noteText}>{evento.notasProducao || 'Nenhuma observação registrada.'}</Text></Card.Content></Card>
        </>}
        {abaAtiva === 'Locais' && <>
          <Text style={styles.sectionTitle}>Locais do evento</Text>
          {local ? <Card style={styles.card}><Card.Content>
            <Linha icone="map-marker-outline" titulo="Local" valor={local.nomeDoLocal || local.nomeEstabelecimento || evento.local} />
            <Linha icone="map-outline" titulo="Endereço" valor={local.endereco || [local.rua, local.numero, local.cidade, local.estado].filter(Boolean).join(', ')} />
            <Linha icone="shape-outline" titulo="Tipo de local" valor={local.tipoLocal} />
            <Linha icone="clock-outline" titulo="Horário previsto" valor={local.horaPrevista} />
          </Card.Content></Card> : <EmptyState texto="Nenhum local foi incluído neste evento." />}
        </>}
        {abaAtiva === 'Equipe' && <>
          <Text style={styles.sectionTitle}>Equipe escalada</Text>
          {equipe.length ? <Card style={styles.card}><Card.Content>{equipe.map((pessoa, index) => <View key={pessoa.id || index} style={styles.personRow}><View style={styles.personIcon}><MaterialCommunityIcons name="account-outline" size={20} color={CORES.textNavy} /></View><View style={styles.personInfo}><Text style={styles.personName}>{pessoa.nomeProfissional || pessoa.nome || 'Profissional'}</Text><Text style={styles.detailLabel}>{pessoa.funcao || pessoa.tipoProfissional || 'Função não informada'}</Text></View><Text style={styles.pendingLabel}>{pessoa.statusConfirmacao || 'Pendente'}</Text></View>)}</Card.Content></Card> : <EmptyState texto="Nenhum profissional foi adicionado à equipe." />}
        </>}
        {abaAtiva === 'Financeiro' && <>
          <Text style={styles.sectionTitle}>Resumo financeiro</Text>
          <Card style={styles.card}><Card.Content>
            <Linha icone="cash-multiple" titulo="Valor do contrato" valor={financeiro.valorContrato || financeiro.valorTotal} />
            <Linha icone="cash-check" titulo="Valor recebido" valor={financeiro.valorPago} />
            <Linha icone="calendar-month-outline" titulo="Parcelas" valor={financeiro.parcelas ? String(financeiro.parcelas) : null} />
          </Card.Content></Card>
          <Text style={styles.financialNote}>Os valores são exibidos conforme registrados no evento.</Text>
        </>}
      </ScrollView>
    </View>
  );
}

function EmptyState({ texto }) {
  return <Card style={styles.emptyCard}><Card.Content><MaterialCommunityIcons name="text-box-outline" size={28} color={CORES.textSubtle} /><Text style={styles.emptyText}>{texto}</Text></Card.Content></Card>;
}
