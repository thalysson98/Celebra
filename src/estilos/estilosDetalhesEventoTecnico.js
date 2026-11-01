

import { StyleSheet } from 'react-native';
import { CORES, FONTES } from '../tema/cores';

export const estilosDetalhesEventoTecnico = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F5F8',
  },
  header: {
    backgroundColor: '#102B46',
    paddingHorizontal: 20,
    paddingTop: 45, 
    paddingBottom: 25,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  headerTitle: {
    color: CORES.textWhite,
    fontFamily: FONTES.body,
    fontSize: 20,
  },
  notificationBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 150, 
  },
  subtitleText: {
    color: '#334155',
    fontFamily: FONTES.body,
    fontSize: 14,
    marginBottom: 15,
  },
  boldText: {
    fontFamily: FONTES.bold,
    fontWeight: '700',
  },
  eventCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  eventCover: {
    width: '100%',
    height: 140,
  },
  eventInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  eventTitle: {
    fontFamily: FONTES.body,
    fontSize: 18,
    color: '#0F172A',
    marginBottom: 6,
  },
  eventDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventDateText: {
    fontFamily: FONTES.body,
    fontSize: 12,
    color: '#64748B',
  },
  locationSection: {
    padding: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  locationTitle: {
    fontFamily: FONTES.body,
    fontSize: 15,
    color: '#334155',
  },
  routeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeText: {
    fontFamily: FONTES.bold,
    fontSize: 12,
    color: '#0F172A',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  locationIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2', 
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationTextColumn: {
    flex: 1,
  },
  locationSubtitle: {
    fontFamily: FONTES.body,
    fontSize: 11,
    color: '#94A3B8',
  },
  locationName: {
    fontFamily: FONTES.bold,
    fontSize: 14,
    color: '#1E293B',
    marginTop: 2,
  },
  locationTime: {
    fontFamily: FONTES.bold,
    fontSize: 14,
    color: '#1E293B',
  },
  notesCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notesTitle: {
    fontFamily: FONTES.body,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 8,
  },
  notesText: {
    fontFamily: FONTES.body,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
  },
  bottomActionArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 25,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  btnAccept: {
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnAcceptText: {
    fontFamily: FONTES.body,
    fontSize: 15,
    color: '#FFF',
  },
  btnReject: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnRejectText: {
    fontFamily: FONTES.body,
    fontSize: 15,
    color: '#FFF',
  },
  disclaimer: {
    fontFamily: FONTES.body,
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
  }
});