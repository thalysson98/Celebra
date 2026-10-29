import { StyleSheet } from 'react-native';
import { CORES, FONTES } from '../tema/cores';

export const estilosAcessoPendente = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.bgHeaderDark,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    padding: 24,
    borderRadius: 24,
    backgroundColor: CORES.cardWhite,
  },
  brand: {
    color: CORES.textNavy,
    fontFamily: FONTES.heading,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
  },
  title: {
    color: CORES.textNavy,
    fontFamily: FONTES.heading,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
  },
  description: {
    color: CORES.textMuted,
    fontFamily: FONTES.body,
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    height: 48,
    marginTop: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CORES.buttonGold,
  },
  buttonText: {
    color: CORES.textNavy,
    fontFamily: FONTES.bold,
    fontSize: 14,
    fontWeight: '700',
  },
});

export const styles = estilosAcessoPendente;
