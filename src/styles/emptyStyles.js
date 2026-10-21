import { StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../theme/colors';

export const styles = StyleSheet.create({
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
});