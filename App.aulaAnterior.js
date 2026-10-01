import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { PaperProvider } from "react-native-paper";
import Home from "./src/views/Home";
import Movies from "./src/views/Movies";
import Produtos from "./src/views/Produtos";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Tab.Navigator initialRouteName="Home">
          <Tab.Screen
            name="Produtos"
            component={Produtos}
            options={{ title: "Produtos" }}
          />
          <Tab.Screen
            name="Home"
            component={Home}
            options={{ title: "Início" }}
          />
          <Tab.Screen
            name="Movies"
            component={Movies}
            options={{ title: "Filmes" }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

