import { useState, useEffect } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
  Appbar,
  Button,
  List,
  PaperProvider,
  Switch,
  Text,
  MD3LightTheme as DefaultTheme,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

import myColors from "./assets/colors.json";
import myColorsDark from "./assets/colorsDark.json";
import { insertLocation, getLocations } from "./src/database/locationDb";

const DARK_MODE_STORAGE_KEY = "@myLocation:darkMode";

export default function App() {
  const [isSwitchOn, setIsSwitchOn] = useState(false); // variável para controle do darkMode
  const [isLoading, setIsLoading] = useState(false); // variável para controle do loading do button
  const [locations, setLocations] = useState([]); // variável para armazenar as localizações

  // Carrega tema default da lib RN PAPER com customização das cores.
  const [theme, setTheme] = useState({
    ...DefaultTheme,
    myOwnProperty: true,
    colors: myColors.colors,
  });

  // 1. Carrega a preferência de darkMode salva no AsyncStorage
  async function loadDarkMode() {
    try {
      const savedMode = await AsyncStorage.getItem(DARK_MODE_STORAGE_KEY);
      if (savedMode !== null) {
        setIsSwitchOn(JSON.parse(savedMode));
      }
    } catch (error) {
      console.error("Erro ao carregar darkMode do AsyncStorage:", error);
    }
  }

  // 2. Evento ao alternar o switch do darkMode e persistir no AsyncStorage
  async function onToggleSwitch() {
    try {
      const nextValue = !isSwitchOn;
      setIsSwitchOn(nextValue);
      await AsyncStorage.setItem(
        DARK_MODE_STORAGE_KEY,
        JSON.stringify(nextValue)
      );
    } catch (error) {
      console.error("Erro ao salvar darkMode no AsyncStorage:", error);
    }
  }

  // 3. Captura a localização atual do usuário com expo-location e salva no SQLite
  async function getLocation() {
    setIsLoading(true);
    try {
      // Solicita permissão de acesso à localização
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permissão de acesso à localização foi negada!");
        setIsLoading(false);
        return;
      }

      // Obtém as coordenadas reais do dispositivo
      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Salva no banco SQLite
      await insertLocation(coords.latitude, coords.longitude);

      // Recarrega a lista para exibir na tela imediatamente
      await loadLocations();
    } catch (error) {
      console.error("Erro ao obter localização:", error);
      alert("Não foi possível obter a localização do dispositivo.");
    } finally {
      setIsLoading(false);
    }
  }

  // 4. Carrega as localizações salvas no SQLite
  async function loadLocations() {
    setIsLoading(true);
    try {
      const dbLocations = await getLocations();
      setLocations(dbLocations || []);
    } catch (error) {
      console.error("Erro ao carregar localizações do SQLite:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Carrega o darkMode e as localizações salvas ao inicializar o app
  useEffect(() => {
    loadDarkMode();
    loadLocations();
  }, []);

  // Efetiva a alteração de cores do tema quando isSwitchOn mudar
  useEffect(() => {
    if (isSwitchOn) {
      setTheme((prevTheme) => ({
        ...prevTheme,
        colors: myColorsDark.colors,
      }));
    } else {
      setTheme((prevTheme) => ({
        ...prevTheme,
        colors: myColors.colors,
      }));
    }
  }, [isSwitchOn]);

  return (
    <PaperProvider theme={theme}>
      <Appbar.Header>
        <Appbar.Content title="My Location BASE" />
      </Appbar.Header>
      <View
        style={[
          styles.mainContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={styles.containerDarkMode}>
          <Text variant="titleMedium">Dark Mode</Text>
          <Switch value={isSwitchOn} onValueChange={onToggleSwitch} />
        </View>

        <Button
          style={styles.containerButton}
          icon="map-marker"
          mode="contained"
          loading={isLoading}
          disabled={isLoading}
          onPress={() => getLocation()}
        >
          Capturar localização
        </Button>

        <FlatList
          style={styles.containerList}
          data={locations}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            !isLoading && (
              <Text style={styles.emptyText}>
                Nenhuma localização capturada ainda.
              </Text>
            )
          }
          renderItem={({ item }) => (
            <List.Item
              title={`Localização #${item.id}`}
              description={`Latitude: ${item.latitude} | Longitude: ${item.longitude}`}
              left={(props) => <List.Icon {...props} icon="map-marker-radius" />}
            />
          )}
        />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  containerDarkMode: {
    margin: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  containerButton: {
    marginHorizontal: 15,
    marginVertical: 10,
  },
  containerList: {
    margin: 15,
    flex: 1,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
    opacity: 0.6,
  },
});
