import React from 'react';
import {
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { styles } from '../styles/technicianEventDetailsStyles';

const SECTIONS = [
  { key: 'general', label: 'Geral' },
  { key: 'locations', label: 'Locais' },
  { key: 'team', label: 'Equipe' },
];

function toDate(value) {
  if (!value) return null;
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatEventDate(value) {
  const date = toDate(value);
  if (!date) return 'Data a confirmar';
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatEventTime(value) {
  const date = toDate(value);
  if (!date) return 'Horário a confirmar';
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);
}

function getLocations(assignment) {
  const locations = assignment.eventLocations || assignment.locations;
  if (Array.isArray(locations) && locations.length) return locations;
  if (assignment.eventAddress) return [{ name: 'Local principal', address: assignment.eventAddress }];
  return [];
}

function getTeamMembers(assignment, profile) {
  if (Array.isArray(assignment.teamMembers) && assignment.teamMembers.length) {
    return assignment.teamMembers;
  }
  return [{
    name: profile.displayName || profile.name || 'Técnico',
    role: assignment.roleName || assignment.professionalTypeName || 'Equipe do evento',
    status: assignment.status,
    isCurrentTechnician: true,
  }];
}

function CoverIllustration() {
  return (
    <View pointerEvents="none" style={styles.coverIllustration}>
      <View style={styles.coverSun} />
      <View style={[styles.coverFoliage, styles.coverFoliageLeft]} />
      <View style={[styles.coverFoliage, styles.coverFoliageRight]} />
      <View style={styles.coverGround} />
      <View style={styles.coverCouple}>
        <View style={styles.coverPerson}>
          <View style={styles.coverHead} />
          <View style={styles.coverBody} />
        </View>
        <View style={[styles.coverPerson, styles.coverPersonSecond]}>
          <View style={styles.coverHead} />
          <View style={[styles.coverBody, styles.coverBodyGold]} />
        </View>
      </View>
    </View>
  );
}

export default function TechnicianEventDetailsScreen({
  assignment,
  profile,
  section,
  onSectionChange,
  onBack,
}) {
  const eventTitle = assignment.eventTitle || 'Evento sem título';
  const eventType = assignment.eventTypeName || assignment.professionalTypeName || 'Evento';
  const locations = getLocations(assignment);
  const teamMembers = getTeamMembers(assignment, profile);

  const renderGeneral = () => (
    <View style={styles.sectionContent}>
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Clientes</Text>
        <View style={styles.infoRow}>
          <View style={styles.infoIcon}><Feather name="user" size={17} color={COLORS.textNavy} /></View>
          <View style={styles.infoCopy}>
            <Text style={styles.infoTitle}>{assignment.clientName || 'Cliente não informado'}</Text>
            {!!assignment.clientEmail && <Text style={styles.infoSubtitle}>{assignment.clientEmail}</Text>}
            {!!assignment.clientPhone && <Text style={styles.infoSubtitle}>{assignment.clientPhone}</Text>}
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Notas da produção</Text>
        <Text style={styles.notesText}>
          {assignment.productionNotes || assignment.notes || 'A produção não adicionou observações para este evento.'}
        </Text>
      </View>

      <View style={styles.eventSummaryCard}>
        <View style={styles.summaryItem}>
          <Feather name="clock" size={16} color={COLORS.textMuted} />
          <Text style={styles.summaryLabel}>{formatEventTime(assignment.eventDate)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Feather name="video" size={16} color={COLORS.textMuted} />
          <Text style={styles.summaryLabel}>{assignment.roleName || assignment.professionalTypeName || 'Função a confirmar'}</Text>
        </View>
        {assignment.guestCount != null && (
          <View style={styles.summaryItem}>
            <Feather name="users" size={16} color={COLORS.textMuted} />
            <Text style={styles.summaryLabel}>{assignment.guestCount} convidados</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderLocations = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionIntro}>Locais previstos para este evento</Text>
      {locations.length ? locations.map((location, index) => (
        <View key={location.id || `${location.name || 'local'}-${index}`} style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, styles.locationIcon]}>
              <Feather name="map-pin" size={17} color="#E5464D" />
            </View>
            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>{location.name || `Local ${index + 1}`}</Text>
              <Text style={styles.infoSubtitle}>{location.address || location.eventAddress || 'Endereço a confirmar'}</Text>
              {!!location.startAt && <Text style={styles.infoSubtitle}>Início: {formatEventTime(location.startAt)}</Text>}
              {!!location.notes && <Text style={styles.notesText}>{location.notes}</Text>}
            </View>
          </View>
        </View>
      )) : (
        <View style={styles.emptyCard}>
          <Feather name="map" size={22} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Local ainda não informado</Text>
          <Text style={styles.emptyText}>Os endereços aparecerão aqui quando a produção os adicionar.</Text>
        </View>
      )}
    </View>
  );

  const renderTeam = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionIntro}>Profissionais associados a este evento</Text>
      {teamMembers.map((member, index) => (
        <View key={member.uid || member.id || `${member.name || 'profissional'}-${index}`} style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.teamAvatar}>
              <Feather name="user" size={17} color={COLORS.textNavy} />
            </View>
            <View style={styles.infoCopy}>
              <View style={styles.teamNameRow}>
                <Text style={styles.infoTitle}>{member.name || member.technicianName || 'Profissional'}</Text>
                {member.isCurrentTechnician && <Text style={styles.youBadge}>Você</Text>}
              </View>
              <Text style={styles.infoSubtitle}>{member.role || member.roleName || member.professionalTypeName || 'Função não informada'}</Text>
            </View>
            {!!member.status && (
              <Text style={styles.teamStatus}>
                {{ accepted: 'Confirmado', pending: 'Pendente', declined: 'Recusado' }[member.status] || 'Status indisponível'}
              </Text>
            )}
          </View>
        </View>
      ))}
      {!assignment.teamMembers?.length && (
        <Text style={styles.teamAvailabilityNote}>
          Esta convocação mostra sua participação. Outros integrantes não estão disponíveis neste registro.
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Voltar para a tela anterior"
          >
            <Feather name="arrow-left" size={21} color={COLORS.textWhite} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes do evento</Text>
        </View>
        <View style={styles.sectionTabs}>
          {SECTIONS.map((item) => {
            const selected = section === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={styles.sectionTab}
                onPress={() => onSectionChange(item.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.sectionTabText, selected && styles.sectionTabTextSelected]}>{item.label}</Text>
                {selected && <View style={styles.sectionTabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {assignment.coverImageUrl ? (
            <ImageBackground source={{ uri: assignment.coverImageUrl }} style={styles.coverImage} resizeMode="cover">
              <View style={styles.heroScrim} />
            </ImageBackground>
          ) : <CoverIllustration />}
          <View style={styles.heroCopy}>
            <Text style={styles.eventType}>{eventType}</Text>
            <Text style={styles.heroTitle} numberOfLines={2}>{eventTitle}</Text>
            <Text style={styles.heroMeta}>
              {formatEventDate(assignment.eventDate)} • {formatEventTime(assignment.eventDate)}
              {assignment.guestCount != null ? ` • ${assignment.guestCount} convidados` : ''}
            </Text>
          </View>
        </View>

        {section === 'general' && renderGeneral()}
        {section === 'locations' && renderLocations()}
        {section === 'team' && renderTeam()}
      </ScrollView>
    </View>
  );
}
