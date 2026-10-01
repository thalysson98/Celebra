import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, Button } from 'react-native';

export default function Aula() {
  return (
    <View style={styles.container}>

     <Text style={styles.txt}>
        Fernando
      </Text>

      <Text style={styles.txt}>
        Login
      </Text>

      <TextInput
        style={styles.txt_input}
        placeholder="Seu usuário"
        placeholderTextColor="#b98989"
      />

      <Text style={styles.txt}>
        Senha
      </Text>

      <TextInput
        style={styles.txt_input}
        placeholder="Sua senha"
        placeholderTextColor="#b98989"
        secureTextEntry
      />

      <View style={styles.btn}>
        <Button
          title="Entrar"
          onPress={() => {
            console.log('Botão clicado!');
          }}
        />
      </View>

      <StatusBar style="auto" />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#362020',
    alignItems: 'center',
    justifyContent: 'center',
  },

  txt: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 5,
  },

  txt_input: {
    borderWidth: 1,
    borderColor: '#b98989',
    borderRadius: 6,
    padding: 10,
    color: '#fff',
    outlineStyle: 'none',
    width: 250,
    marginBottom: 15,
  },

  btn: {
    marginTop: 10,
    width: 250,
    backgroundColor: '#7a4747ff',
  },
});