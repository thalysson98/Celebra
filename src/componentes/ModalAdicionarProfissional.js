// src/componentes/ModalAdicionarProfissional.js
import { verificarIndisponibilidadeTecnicoNaData } from '../servicos/servicoIndisponibilidade';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Button } from 'react-native-paper';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { CORES } from '../tema/cores';
import { repositorioEventos } from '../servicos/repositorioEventos';
import { listarTecnicosDaEmpresa } from '../servicos/servicoEscala';
import { estilosModalAdicionarProfissional as styles } from '../estilos/estilosModalAdicionarProfissional';
import ModalSelecao from './ModalSelecao';

export default function ModalAdicionarProfissional({ visible, empresaId, dataEvento, equipeAtual = [], onClose, onAdd, esconderOpcaoConvite = false }) {
  const [tipos, setTipos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [tipoSelecionado, setTipoSelecionado] = useState(null);
  const [tecnicoSelecionado, setTecnicoSelecionado] = useState(null);
  const [selecaoVisivel, setSelecaoVisivel] = useState(false);
  const [campoSelecao, setCampoSelecao] = useState(''); // 'tipo' ou 'tecnico'
  const [enviarConvite, setEnviarConvite] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [modalErroVisivel, setModalErroVisivel] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');

  const mostrarErro = (mensagem) => {
    setMensagemErro(mensagem);
    setModalErroVisivel(true);
  };

  useEffect(() => {
    if (!visible) {
      setModalErroVisivel(false);
      return undefined;
    }
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
      console.error('Erro ao carregar dados para adicionar profissional:', e);
      mostrarErro('Não foi possível carregar os dados. Tente novamente.');
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
      console.error('Erro ao criar registro para adicionar profissional:', error);
      setSelecaoVisivel(false);
      mostrarErro('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const salvar = async () => {
    if (!tipoSelecionado || !tecnicoSelecionado) {
      mostrarErro('Selecione o tipo e o profissional.');
      return;
    }
    if (idsJaAdicionados.has(tecnicoSelecionado.id)) {
      mostrarErro('Esta pessoa já foi adicionada.');
      return;
    }

    setSalvando(true);
    try {
      if (dataEvento) {
        const indisponivel = await verificarIndisponibilidadeTecnicoNaData(tecnicoSelecionado.id, dataEvento);
        if (indisponivel) {
          mostrarErro(`O profissional ${tecnicoSelecionado.nome} marcou indisponibilidade na agenda para a data deste evento (${dataEvento}).`);
          setSalvando(false);
          return;
        }
      }

      await onAdd({
        id: tecnicoSelecionado.id, idUsuario: tecnicoSelecionado.id, nomeProfissional: tecnicoSelecionado.nome,
        idTipoProfissional: tipoSelecionado.id, funcao: tipoSelecionado.nome,
        enviarConvite: esconderOpcaoConvite ? true : enviarConvite, statusConfirmacao: 'Convite pendente',
      });
    } catch (error) {
      console.error('Erro ao adicionar profissional ao evento:', error);
      mostrarErro(error?.message || 'Ocorreu um erro inesperado. Tente novamente.');
    } finally { setSalvando(false); }
  };

  return (
    <>
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
    <Modal
      visible={modalErroVisivel}
      transparent
      animationType="fade"
      onRequestClose={() => setModalErroVisivel(false)}
    >
      <View style={styles.errorOverlay}>
        <View style={styles.errorCard}>
          <View style={styles.errorIcon}>
            <Feather name="alert-triangle" size={30} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>Atenção</Text>
          <Text style={styles.errorMessage}>{mensagemErro}</Text>
          <Button
            mode="contained"
            style={styles.errorButton}
            buttonColor="#EF4444"
            textColor="#FFFFFF"
            onPress={() => setModalErroVisivel(false)}
          >
            Ok, entendi
          </Button>
        </View>
      </View>
    </Modal>
    </>
  );
}