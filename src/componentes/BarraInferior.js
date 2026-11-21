import React from 'react';
import { Animated, Platform, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CORES } from '../tema/cores';
import { estilosNavegacao, obterEstiloHotbar } from '../estilos/estilosNavegacao';

function BotaoAbaInferior({ aba, selecionada }) {
  const escala = React.useRef(new Animated.Value(1)).current;
  const usarDriverNativo = Platform.OS !== 'web';
  const Icone = aba.ComponenteIcone;

  const selecionarAba = () => {
    escala.stopAnimation();
    Animated.sequence([
      Animated.timing(escala, {
        toValue: 0.82,
        duration: 80,
        useNativeDriver: usarDriverNativo,
      }),
      Animated.spring(escala, {
        toValue: 1,
        speed: 18,
        bounciness: 14,
        useNativeDriver: usarDriverNativo,
      }),
    ]).start();
    aba.aoSelecionar();
  };

  return (
    <TouchableOpacity
      style={estilosNavegacao.tabButton}
      activeOpacity={0.8}
      accessibilityRole="tab"
      accessibilityLabel={aba.rotulo}
      accessibilityState={{ selected: selecionada }}
      onPress={selecionarAba}
      onLongPress={aba.aoPressionarLongo}
    >
      <View style={estilosNavegacao.tabContainer}>
        <Animated.View
          style={[
            selecionada
              ? estilosNavegacao.pilulaIconeAtivo
              : estilosNavegacao.pilulaIconeInativo,
            { transform: [{ scale: escala }] },
          ]}
        >
          <Icone
            name={
              selecionada
                ? aba.iconeAtivo || aba.icone
                : aba.iconeInativo || aba.icone
            }
            size={24}
            color={selecionada ? CORES.textNavy : CORES.textSubtle}
          />
          {aba.badge > 0 && (
            <View style={estilosNavegacao.badge}>
              <Text style={estilosNavegacao.badgeText}>{aba.badge}</Text>
            </View>
          )}
        </Animated.View>
        <Text
          style={[
            estilosNavegacao.tabLabel,
            { color: selecionada ? CORES.textNavy : CORES.textSubtle },
          ]}
        >
          {aba.rotulo}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function BarraInferior({ abas, abaAtiva }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={obterEstiloHotbar(insets.bottom)}>
      {abas.map((aba) => {
        const selecionada = aba.chave === abaAtiva;
        return (
          <BotaoAbaInferior
            key={aba.chave}
            aba={aba}
            selecionada={selecionada}
          />
        );
      })}
    </View>
  );
}
