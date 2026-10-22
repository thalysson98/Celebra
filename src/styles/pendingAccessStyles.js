import { StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../theme/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgHeaderDark,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    padding: 24,
    borderRadius: 24,
    backgroundColor: COLORS.cardWhite,
  },
  brand: {
    color: COLORS.textNavy,
    fontFamily: FONTS.heading,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
  },
  title: {
    color: COLORS.textNavy,
    fontFamily: FONTS.heading,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
  },
  description: {
    color: COLORS.textMuted,
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    height: 48,
    marginTop: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.buttonGold,
  },
  buttonText: {
    color: COLORS.textNavy,
    fontFamily: FONTS.body,
    fontSize: 14,
    fontWeight: '700',
  },
});
