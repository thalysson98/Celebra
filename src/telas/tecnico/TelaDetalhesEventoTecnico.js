import React from 'react';
import {
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { CORES } from '../../tema/cores';
import { estilosDetalhesEventoTecnico } from '../../estilos/estilosDetalhesEventoTecnico';

const SECOES = [
  { key: 'general', label: 'Geral' },
  { key: 'locations', label: 'Locais' },
  { key: 'team', label: 'Equipe' },
];

function converterParaData(valor) {
  if (!valor) return null;
  const data = typeof valor.toDate === 'function' ? valor.toDate() : new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

function formatarDataEvento(valor) {
  const data = converterParaData(valor);
  if (!data) return 'Data a confirmar';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(data);
}

export default function TelaDetalhesEventoTecnico({ route, navigation }) {
  const { assignment } = route.params || {};
  const [secaoAtiva, setSecaoAtiva] = React.useState('general');

  const titulo = assignment?.eventTitle || 'Evento Sem Título';
  const tipo = assignment?.eventTypeName || assignment?.eventType || 'Evento';
  const papel = assignment?.roleName || 'Técnico';
  const local = assignment?.locationName || assignment?.eventAddress || 'Local a confirmar';
  const endereco = assignment?.locationAddress || assignment?.eventAddress || 'Endereço não informado.';
  const dataFormatada = formatarDataEvento(assignment?.eventDate);

  return (
    <View style={estilosDetalhesEventoTecnico.screen}>
      <View style={estilosDetalhesEventoTecnico.header}>
        <View style={estilosDetalhesEventoTecnico.headerRow}>
          <TouchableOpacity
            style={estilosDetalhesEventoTecnico.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={estilosDetalhesEventoTecnico.headerTitle}>Detalhes do Evento</Text>
        </View>

        <View style={estilosDetalhesEventoTecnico.sectionTabs}>
          {SECOES.map((secao) => (
            <TouchableOpacity
              key={secao.key}
              style={estilosDetalhesEventoTecnico.sectionTab}
              onPress={() => setSecaoAtiva(secao.key)}
            >
              <Text
                style={[
                  estilosDetalhesEventoTecnico.sectionTabText,
                  secaoAtiva === secao.key && estilosDetalhesEventoTecnico.sectionTabTextSelected,
                ]}
              >
                {secao.label}
              </Text>
              {secaoAtiva === secao.key && (
                <View style={estilosDetalhesEventoTecnico.sectionTabIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={estilosDetalhesEventoTecnico.body} contentContainerStyle={{ paddingBottom: 40 }}>
        {assignment?.coverUrl ? (
          <ImageBackground source={{ uri: assignment.coverUrl }} style={estilosDetalhesEventoTecnico.banner}>
            <View style={estilosDetalhesEventoTecnico.bannerOverlay}>
              <Text style={estilosDetalhesEventoTecnico.bannerEventName}>{titulo}</Text>
              <Text style={estilosDetalhesEventoTecnico.bannerEventType}>{tipo}</Text>
            </View>
          </ImageBackground>
        ) : (
          <View style={[estilosDetalhesEventoTecnico.banner, estilosDetalhesEventoTecnico.bannerFallback]}>
            <Feather name="calendar" size={32} color={CORES.buttonGold} />
            <Text style={estilosDetalhesEventoTecnico.bannerEventName}>{titulo}</Text>
            <Text style={estilosDetalhesEventoTecnico.bannerEventType}>{tipo}</Text>
          </View>
        )}

        <View style={estilosDetalhesEventoTecnico.contentCard}>
          {secaoAtiva === 'general' && (
            <View>
              <Text style={estilosDetalhesEventoTecnico.blockTitle}>Informações Principais</Text>
              <View style={estilosDetalhesEventoTecnico.detailRow}>
                <Text style={estilosDetalhesEventoTecnico.detailLabel}>Função convocada:</Text>
                <Text style={estilosDetalhesEventoTecnico.detailValue}>{papel}</Text>
              </View>
              <View style={estilosDetalhesEventoTecnico.detailRow}>
                <Text style={estilosDetalhesEventoTecnico.detailLabel}>Data:</Text>
                <Text style={estilosDetalhesEventoTecnico.detailValue}>{dataFormatada}</Text>
              </View>
              <View style={estilosDetalhesEventoTecnico.detailRow}>
                <Text style={estilosDetalhesEventoTecnico.detailLabel}>Status:</Text>
                <Text style={estilosDetalhesEventoTecnico.detailValue}>
                  {assignment?.status === 'accepted' ? 'Confirmado' : 'Aguardando sua resposta'}
                </Text>
              </View>

              <Text style={estilosDetalhesEventoTecnico.blockTitle}>Observações de Produção</Text>
              <Text style={estilosDetalhesEventoTecnico.blockText}>
                {assignment?.productionNotes ||
                  'Nenhuma observação registrada.'}
              </Text>
            </View>
          )}

          {secaoAtiva === 'locations' && (
            <View>
              <Text style={estilosDetalhesEventoTecnico.blockTitle}>Local do Evento</Text>
              <Text style={estilosDetalhesEventoTecnico.blockText}>{local}</Text>
              <Text style={[estilosDetalhesEventoTecnico.blockText, { marginTop: 6 }]}>
                {endereco}
              </Text>
            </View>
          )}

          {secaoAtiva === 'team' && (
            <View>
              <Text style={estilosDetalhesEventoTecnico.blockTitle}>Sua Equipe</Text>
              <Text style={estilosDetalhesEventoTecnico.blockText}>
                {assignment?.teamMembers?.length
                  ? assignment.teamMembers.join(', ')
                  : `Você foi convocado como ${papel}. A equipe completa não está disponível nesta convocação.`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
