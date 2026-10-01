import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useState } from 'react';

export default function Count() {
  
  const [count, setCount] = useState(0)

  function diminuir() {
    if (count > 0) {
      setCount(count - 1)
    }
  }

  return (
    <View style={styles.container}>

      <Text>{count}</Text>
      <Button onPress={() => setCount(count + 1)}>
        +
      </Button>
      
      <Button onPress={diminuir}> 
        -
      </Button>
 

      <StatusBar style="auto" />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#b99f9fff',
    alignItems: 'center',
    justifyContent: 'space-around',
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