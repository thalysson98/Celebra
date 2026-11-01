// src/componentes/ModalAdicionarProfissional.js

import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Switch, Text, TouchableOpacity, View, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CORES } from '../tema/cores';
import { repositorioEventos } from '../servicos/repositorioEventos';
import { listarTecnicosDaEmpresa } from '../servicos/servicoEscala';
import { estilosModalAdicionarProfissional as styles } from '../estilos/estilosModalAdicionarProfissional';
import ModalSelecao from './ModalSelecao';

export default function ModalAdicionarProfissional({ visible, empresaId, equipeAtual = [], onClose, onAdd, esconderOpcaoConvite = false }) {
  const [tipos, setTipos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  
  const [tipoSelecionado, setTipoSelecionado] = useState(null);
  const [tecnicoSelecionado, setTecnicoSelecionado] = useState(null);
  
  const [selecaoVisivel, setSelecaoVisivel] = useState(false);
  const [campoSelecao, setCampoSelecao] = useState(''); // 'tipo' ou 'tecnico'
  
  const [enviarConvite, setEnviarConvite] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!visible) return undefined;
    carregarDados();
  }, [visible, empresaId]);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      const [tiposEmpresa, equipeEmpresa] = await Promise.all([
        repositorioEventos.obterOpcoesSelect('tiposProfissional', empresaId),
        listarTecnicosDaEmpresa(empresaId),
      ]);
      setTipos(tiposEmpresa);
      setTecnicos(equipeEmpresa);
    } catch (e) {
      setErro('Não foi possível carregar os dados.');
    } finally {
      setCarregando(false);
    }
  };

  const idsJaAdicionados = useMemo(() => new Set(equipeAtual.map((item) => item.idUsuario || item.id_usuario || item.id).filter(Boolean)), [equipeAtual]);

  const abrirSelecao = (campo) => {
    setCampoSelecao(campo);
    setSelecaoVisivel(true);
  };

  const lidarComSelecao = (item) => {
    if (campoSelecao === 'tipo') setTipoSelecionado(item);
    else setTecnicoSelecionado(item);
    setSelecaoVisivel(false);
  };

  const criarNovoItem = async (nome) => {
    setCarregando(true);
    try {
      if (campoSelecao === 'tipo') {
        const novo = await repositorioEventos.adicionarNovoItemSelect('tiposProfissional', { nome }, empresaId);
        setTipoSelecionado(novo);
      } else {
        // Criando profissional (fantasma) em usuarios
        const novo = await repositorioEventos.criarUsuarioTecnicoFantasma(nome, empresaId);
        setTecnicoSelecionado(novo);
      }
      setSelecaoVisivel(false);
      carregarDados();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível criar o registro.");
    } finally {
      setCarregando(false);
    }
  };

  const salvar = async () => {
    if (!tipoSelecionado || !tecnicoSelecionado) { setErro('Selecione o tipo e o profissional.'); return; }
    if (idsJaAdicionados.has(tecnicoSelecionado.id)) { setErro('Esta pessoa já foi adicionada.'); return; }
    
    setSalvando(true);
    setErro('');
    try {
      await onAdd({
        id: tecnicoSelecionado.id, idUsuario: tecnicoSelecionado.id, nomeProfissional: tecnicoSelecionado.nome,
        idTipoProfissional: tipoSelecionado.id, funcao: tipoSelecionado.nome,
        enviarConvite: esconderOpcaoConvite ? true : enviarConvite, statusConfirmacao: 'Convite pendente',
      });
      if (!esconderOpcaoConvite) Alert.alert("Sucesso", enviarConvite ? "Convite enviado com sucesso!" : "Profissional adicionado ao evento.");
    } catch (error) {
      setErro(error?.message || 'Erro ao adicionar.');
    } finally { setSalvando(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Adicionar profissional</Text>
            <TouchableOpacity onPress={onClose}><MaterialCommunityIcons name="close" size={21} color={CORES.textNavy} /></TouchableOpacity>
          </View>
          
          {carregando ? <ActivityIndicator size="large" color={CORES.buttonGold} style={styles.loading} /> : (
            <>
              <Text style={styles.label}>Tipo de profissional *</Text>
              <TouchableOpacity style={styles.selectButton} onPress={() => abrirSelecao('tipo')}>
                <Text style={[styles.selectText, !tipoSelecionado && styles.placeholder]}>{tipoSelecionado?.nome || 'Selecionar tipo'}</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={CORES.textMuted} />
              </TouchableOpacity>

              <Text style={[styles.label, styles.secondLabel]}>Profissional de campo *</Text>
              <TouchableOpacity style={styles.selectButton} onPress={() => abrirSelecao('tecnico')}>
                <Text style={[styles.selectText, !tecnicoSelecionado && styles.placeholder]} numberOfLines={1}>{tecnicoSelecionado?.nome || 'Buscar nome...'}</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={CORES.textMuted} />
              </TouchableOpacity>

              {!esconderOpcaoConvite && (
                <View style={styles.inviteCard}>
                  <View style={styles.inviteCopy}>
                    <Text style={styles.inviteTitle}>Enviar convite para o aplicativo?</Text>
                    <Text style={styles.inviteDescription}>Desative para cadastros apenas informativos.</Text>
                  </View>
                  <Switch value={enviarConvite} onValueChange={setEnviarConvite} trackColor={{ false: '#CAD5E2', true: CORES.buttonGold }} thumbColor="#FFFFFF" />
                </View>
              )}
            </>
          )}
          {!!erro && <Text style={styles.error}>{erro}</Text>}
          
          <TouchableOpacity onPress={salvar} disabled={carregando || salvando} style={[styles.primaryButton, (carregando || salvando) && styles.buttonDisabled]}>
            {salvando ? <ActivityIndicator color={CORES.textNavy} /> : <Text style={styles.primaryButtonText}>{esconderOpcaoConvite ? 'Adicionar Profissional' : (enviarConvite ? 'Salvar e enviar convite' : 'Salvar cadastro')}</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} disabled={salvando} style={styles.cancelButton}><Text style={styles.cancelButtonText}>Cancelar</Text></TouchableOpacity>
        </View>
      </View>

      <ModalSelecao 
         visible={selecaoVisivel}
         onClose={() => setSelecaoVisivel(false)}
         titulo={campoSelecao === 'tipo' ? 'Selecionar tipo de profissional' : 'Selecionar técnico'}
         opcoes={campoSelecao === 'tipo' ? tipos : tecnicos.filter(t => !idsJaAdicionados.has(t.id))}
         carregando={false}
         onSelecionar={lidarComSelecao}
         onAdicionarNovo={criarNovoItem}
      />
    </Modal>
  );
}