import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { CORES } from '../tema/cores';
import { repositorioEventos } from '../servicos/repositorioEventos';
import { listarTecnicosDaEmpresa } from '../servicos/servicoEscala';
import { estilosModalAdicionarProfissional as styles } from '../estilos/estilosModalAdicionarProfissional';

export default function ModalAdicionarProfissional({
  visible,
  empresaId,
  equipeAtual = [],
  onClose,
  onAdd,
}) {
  const [tipos, setTipos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [tipoSelecionado, setTipoSelecionado] = useState(null);
  const [tecnicoSelecionado, setTecnicoSelecionado] = useState(null);
  const [menuAberto, setMenuAberto] = useState('');
  const [buscaTecnico, setBuscaTecnico] = useState('');
  const [enviarConvite, setEnviarConvite] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!visible) return undefined;
    let ativo = true;
    setTipos([]);
    setTecnicos([]);
    setTipoSelecionado(null);
    setTecnicoSelecionado(null);
    setMenuAberto('');
    setBuscaTecnico('');
    setEnviarConvite(true);
    setErro('');
    setCarregando(true);

    Promise.all([
      repositorioEventos.obterOpcoesSelect('tiposProfissional', empresaId),
      listarTecnicosDaEmpresa(empresaId),
    ]).then(([tiposEmpresa, equipeEmpresa]) => {
      if (!ativo) return;
      setTipos(tiposEmpresa);
      setTecnicos(equipeEmpresa);
    }).catch((error) => {
      if (ativo) setErro(error?.message || 'Não foi possível carregar a equipe da empresa.');
    }).finally(() => {
      if (ativo) setCarregando(false);
    });

    return () => { ativo = false; };
  }, [visible, empresaId]);

  const idsJaAdicionados = useMemo(() => new Set(
    equipeAtual.map((item) => item.idUsuario || item.id_usuario || item.id).filter(Boolean),
  ), [equipeAtual]);
  const tecnicosFiltrados = useMemo(() => tecnicos.filter((tecnico) => {
    const texto = tecnico.nome.toLocaleLowerCase('pt-BR');
    return texto.includes(buscaTecnico.trim().toLocaleLowerCase('pt-BR'));
  }), [tecnicos, buscaTecnico]);

  const salvar = async () => {
    if (!tipoSelecionado || !tecnicoSelecionado) {
      setErro('Selecione o tipo de profissional e uma pessoa da equipe.');
      return;
    }
    if (idsJaAdicionados.has(tecnicoSelecionado.id)) {
      setErro('Esta pessoa já foi adicionada à equipe deste evento.');
      return;
    }

    setSalvando(true);
    setErro('');
    try {
      await onAdd({
        id: tecnicoSelecionado.id,
        idUsuario: tecnicoSelecionado.id,
        nomeProfissional: tecnicoSelecionado.nome,
        emailProfissional: tecnicoSelecionado.email,
        idTipoProfissional: tipoSelecionado.id,
        funcao: tipoSelecionado.nome,
        enviarConvite,
        statusConfirmacao: enviarConvite ? 'Convite pendente' : 'Informativo',
      });
    } catch (error) {
      setErro(error?.message || 'Não foi possível adicionar este profissional.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Adicionar profissional de campo</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Fechar" onPress={onClose}>
              <MaterialCommunityIcons name="close" size={21} color={CORES.textNavy} />
            </TouchableOpacity>
          </View>

          {carregando ? (
            <ActivityIndicator size="large" color={CORES.buttonGold} style={styles.loading} />
          ) : (
            <>
              <Text style={styles.label}>Tipo de profissional *</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Tipo de profissional: ${tipoSelecionado?.nome || 'Selecionar'}`}
                style={styles.selectButton}
                onPress={() => setMenuAberto(menuAberto === 'tipo' ? '' : 'tipo')}
              >
                <Text style={[styles.selectText, !tipoSelecionado && styles.placeholder]}>
                  {tipoSelecionado?.nome || 'Selecionar tipo de profissional'}
                </Text>
                <MaterialCommunityIcons name={menuAberto === 'tipo' ? 'chevron-up' : 'chevron-down'} size={20} color={CORES.textMuted} />
              </TouchableOpacity>
              {menuAberto === 'tipo' && (
                <ScrollView style={styles.optionsList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  {tipos.length ? tipos.map((tipo) => (
                    <TouchableOpacity key={tipo.id} style={styles.optionRow} onPress={() => { setTipoSelecionado(tipo); setMenuAberto(''); }}>
                      <Text style={styles.optionText}>{tipo.nome}</Text>
                      {tipoSelecionado?.id === tipo.id && <MaterialCommunityIcons name="check" size={18} color={CORES.textNavy} />}
                    </TouchableOpacity>
                  )) : <Text style={styles.emptyText}>Nenhum tipo de profissional cadastrado.</Text>}
                </ScrollView>
              )}

              <Text style={[styles.label, styles.secondLabel]}>Profissional de campo *</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Profissional de campo: ${tecnicoSelecionado?.nome || 'Selecionar'}`}
                style={styles.selectButton}
                onPress={() => setMenuAberto(menuAberto === 'tecnico' ? '' : 'tecnico')}
              >
                <Text style={[styles.selectText, !tecnicoSelecionado && styles.placeholder]} numberOfLines={1}>
                  {tecnicoSelecionado?.nome || 'Selecione ou digite o nome...'}
                </Text>
                <MaterialCommunityIcons name={menuAberto === 'tecnico' ? 'chevron-up' : 'chevron-down'} size={20} color={CORES.textMuted} />
              </TouchableOpacity>
              {menuAberto === 'tecnico' && (
                <View style={styles.optionsContainer}>
                  <TextInput
                    value={buscaTecnico}
                    onChangeText={setBuscaTecnico}
                    placeholder="Buscar na equipe"
                    placeholderTextColor={CORES.textSubtle}
                    style={styles.searchInput}
                    accessibilityLabel="Buscar profissional da equipe"
                  />
                  <ScrollView style={styles.optionsList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {tecnicosFiltrados.filter((tecnico) => !idsJaAdicionados.has(tecnico.id)).length ? (
                      tecnicosFiltrados.filter((tecnico) => !idsJaAdicionados.has(tecnico.id)).map((tecnico) => (
                        <TouchableOpacity key={tecnico.id} style={styles.optionRow} onPress={() => { setTecnicoSelecionado(tecnico); setMenuAberto(''); }}>
                          <View style={styles.optionCopy}>
                            <Text style={styles.optionText}>{tecnico.nome}</Text>
                          </View>
                          {tecnicoSelecionado?.id === tecnico.id && <MaterialCommunityIcons name="check" size={18} color={CORES.textNavy} />}
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>{tecnicos.length ? 'Nenhum profissional disponível para este evento.' : 'Nenhum técnico ativo está vinculado a esta empresa.'}</Text>
                    )}
                  </ScrollView>
                </View>
              )}

              <View style={styles.inviteCard}>
                <View style={styles.inviteCopy}>
                  <Text style={styles.inviteTitle}>Enviar convite para o aplicativo?</Text>
                  <Text style={styles.inviteDescription}>Desative para cadastros apenas informativos (ex.: cerimonialista ou profissional externo).</Text>
                </View>
                <Switch
                  value={enviarConvite}
                  onValueChange={setEnviarConvite}
                  trackColor={{ false: '#CAD5E2', true: CORES.buttonGold }}
                  thumbColor="#FFFFFF"
                  accessibilityLabel="Enviar convite para o aplicativo"
                />
              </View>

              <View style={styles.notice}>
                <MaterialCommunityIcons name="information-outline" size={17} color={CORES.textMuted} />
                <Text style={styles.noticeText}>
                  {enviarConvite
                    ? 'O profissional receberá o convite para confirmar presença na agenda.'
                    : 'O profissional será registrado na equipe sem receber um convite no aplicativo.'}
                </Text>
              </View>
            </>
          )}

          {!!erro && <Text accessibilityRole="alert" style={styles.error}>{erro}</Text>}

          <TouchableOpacity
            accessibilityRole="button"
            onPress={salvar}
            disabled={carregando || salvando}
            activeOpacity={0.8}
            style={[styles.primaryButton, (carregando || salvando) && styles.buttonDisabled]}
          >
            {salvando ? <ActivityIndicator color={CORES.textNavy} /> : (
              <Text style={styles.primaryButtonText}>{enviarConvite ? 'Salvar e enviar convite' : 'Salvar cadastro'}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={onClose} disabled={salvando} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
