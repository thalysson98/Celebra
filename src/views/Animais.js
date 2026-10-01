import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Button } from 'react-native-paper';
import { useState } from 'react';

import Count from './src/views/components/count';
import CardComponent from './src/views/components/CardComponent';

export default function Animais() {


  return (
    <ScrollView style={styles.container}>
      {/* <Count/> */}
      <CardComponent
      img = "https://hortifrutibr.vtexassets.com/arquivos/ids/173269/batata-inglesa-unidade.jpg?v=638887886306900000"
      title = "Tababa"
      text = "Uma batata"
      />
      <CardComponent
      img = "https://hiperideal.vtexassets.com/arquivos/ids/167688/47058.jpg?v=636615816233100000"
      title = "Necoura"
      text = "Uma cenoura"
      />
      <CardComponent
      img = "https://hortifrutibr.vtexassets.com/arquivos/ids/173069/140279---2116390000006---alface-crespa-verde-hidrop-un.png?v=638889862302330000"
      title = "Afalce"
      text = "Um alface"
      />
    
      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#b99f9fff',
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