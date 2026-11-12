import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { estilosAutenticacao, CORES_AUTENTICACAO } from '../../estilos/estilosAutenticacao';
import { registrarUsuario } from '../../servicos/servicoAutenticacao';

export default function TelaCadastro({ navigation, onRegisterSuccess }) {
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [tecladoVisivel, setTecladoVisivel] = useState(false);

  // Erros de validação inline (campos vazios ou inválidos)
  const [erroNome, setErroNome] = useState('');
  const [erroEmail, setErroEmail] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  const [erroConfirmarSenha, setErroConfirmarSenha] = useState('');
  const [erroGeral, setErroGeral] = useState('');

  useEffect(() => {
    const eventoMostrar = Keyboard.addListener('keyboardDidShow', () => setTecladoVisivel(true));
    const eventoOcultar = Keyboard.addListener('keyboardDidHide', () => setTecladoVisivel(false));
    return () => {
      eventoMostrar.remove();
      eventoOcultar.remove();
    };
  }, []);

  const validarCampos = () => {
    let valido = true;
    const nomeLimpo = nomeCompleto.trim().replace(/\s+/g, ' ');
    const emailLimpo = email.trim();
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    setErroGeral('');

    if (!nomeLimpo) {
      setErroNome('Informe seu nome completo.');
      valido = false;
    } else if (nomeLimpo.length < 3) {
      setErroNome('O nome deve ter pelo menos 3 caracteres.');
      valido = false;
    } else {
      setErroNome('');
    }

    if (!emailLimpo) {
      setErroEmail('Informe seu e-mail.');
      valido = false;
    } else if (!regexEmail.test(emailLimpo)) {
      setErroEmail('Formato de e-mail inválido (ex: seu@email.com).');
      valido = false;
    } else {
      setErroEmail('');
    }

    if (!senha) {
      setErroSenha('Informe sua senha.');
      valido = false;
    } else if (senha.length < 6) {
      setErroSenha('A senha deve ter no mínimo 6 caracteres.');
      valido = false;
    } else {
      setErroSenha('');
    }

    if (!confirmarSenha) {
      setErroConfirmarSenha('Confirme sua senha.');
      valido = false;
    } else if (senha !== confirmarSenha) {
      setErroConfirmarSenha('As senhas digitadas não coincidem.');
      valido = false;
    } else {
      setErroConfirmarSenha('');
    }

    return valido;
  };

  const lidarComCadastro = async () => {
    if (!validarCampos()) {
      Toast.show({
        type: 'error',
        text1: 'Campos obrigatórios',
        text2: 'Corrija os campos destacados para continuar.',
      });
      return;
    }

    try {
      setCarregando(true);
      setErroGeral('');
      const novoUsuario = await registrarUsuario({
        name: nomeCompleto,
        email,
        password: senha,
      });

      Toast.show({
        type: 'success',
        text1: 'Conta criada!',
        text2: 'Sua conta foi cadastrada com sucesso.',
      });

      if (onRegisterSuccess) onRegisterSuccess(novoUsuario);
    } catch (erro) {
      const mensagem = erro.message || 'Não foi possível concluir o cadastro.';
      setErroGeral(mensagem);
      Toast.show({
        type: 'error',
        text1: 'Erro no cadastro',
        text2: mensagem,
      });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={estilosAutenticacao.keyboardView}
    >
      <ScrollView
        contentContainerStyle={estilosAutenticacao.scrollContent}
        scrollEnabled={tecladoVisivel}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={estilosAutenticacao.contentWrapper}>
          {/* Cabeçalho da Marca Celebra */}
          <View style={estilosAutenticacao.brandHeader}>
            <View style={estilosAutenticacao.brandTitleRow}>
              <Text style={estilosAutenticacao.brandTitle}>Celebra</Text>
              <Text style={estilosAutenticacao.brandStar}>✦</Text>
            </View>
            <Text style={estilosAutenticacao.brandSubtitle}>
              Crie seu acesso e comece a gerenciar.
            </Text>
          </View>

          {/* Card Principal de Cadastro */}
          <View style={estilosAutenticacao.card}>
            <Text style={estilosAutenticacao.cardTitle}>Criar conta</Text>

            {/* Banner de erro geral */}
            {!!erroGeral && (
              <View style={estilosAutenticacao.alertaBanner}>
                <Feather name="alert-circle" size={16} color="#DC2626" />
                <Text style={estilosAutenticacao.alertaTexto}>{erroGeral}</Text>
              </View>
            )}

            {/* Campo Nome Completo */}
            <View style={estilosAutenticacao.fieldGroup}>
              <Text style={estilosAutenticacao.inputLabel}>Nome completo</Text>
              <View
                style={[
                  estilosAutenticacao.inputWrapper,
                  erroNome && estilosAutenticacao.inputWrapperErro,
                ]}
              >
                <Feather
                  name="user"
                  size={18}
                  color={erroNome ? CORES_AUTENTICACAO.bordaErro : CORES_AUTENTICACAO.placeholder}
                  style={estilosAutenticacao.inputIcon}
                />
                <TextInput
                  style={estilosAutenticacao.textInput}
                  placeholder="Seu nome e sobrenome"
                  placeholderTextColor={CORES_AUTENTICACAO.placeholder}
                  value={nomeCompleto}
                  onChangeText={(val) => {
                    setNomeCompleto(val);
                    if (erroNome) setErroNome('');
                    if (erroGeral) setErroGeral('');
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
              {!!erroNome && (
                <Text style={estilosAutenticacao.erroTexto}>{erroNome}</Text>
              )}
            </View>

            {/* Campo E-mail */}
            <View style={estilosAutenticacao.fieldGroup}>
              <Text style={estilosAutenticacao.inputLabel}>E-mail</Text>
              <View
                style={[
                  estilosAutenticacao.inputWrapper,
                  erroEmail && estilosAutenticacao.inputWrapperErro,
                ]}
              >
                <Feather
                  name="mail"
                  size={18}
                  color={erroEmail ? CORES_AUTENTICACAO.bordaErro : CORES_AUTENTICACAO.placeholder}
                  style={estilosAutenticacao.inputIcon}
                />
                <TextInput
                  style={estilosAutenticacao.textInput}
                  placeholder="seu@email.com"
                  placeholderTextColor={CORES_AUTENTICACAO.placeholder}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (erroEmail) setErroEmail('');
                    if (erroGeral) setErroGeral('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {!!erroEmail && (
                <Text style={estilosAutenticacao.erroTexto}>{erroEmail}</Text>
              )}
            </View>

            {/* Campo Senha */}
            <View style={estilosAutenticacao.fieldGroup}>
              <Text style={estilosAutenticacao.inputLabel}>Senha</Text>
              <View
                style={[
                  estilosAutenticacao.inputWrapper,
                  erroSenha && estilosAutenticacao.inputWrapperErro,
                ]}
              >
                <Feather
                  name="lock"
                  size={18}
                  color={erroSenha ? CORES_AUTENTICACAO.bordaErro : CORES_AUTENTICACAO.placeholder}
                  style={estilosAutenticacao.inputIcon}
                />
                <TextInput
                  style={estilosAutenticacao.textInput}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={CORES_AUTENTICACAO.placeholder}
                  value={senha}
                  onChangeText={(val) => {
                    setSenha(val);
                    if (erroSenha) setErroSenha('');
                    if (erroGeral) setErroGeral('');
                  }}
                  secureTextEntry={!mostrarSenha}
                />
                <TouchableOpacity
                  onPress={() => setMostrarSenha((prev) => !prev)}
                  style={estilosAutenticacao.eyeIcon}
                >
                  <Feather
                    name={mostrarSenha ? 'eye-off' : 'eye'}
                    size={18}
                    color={CORES_AUTENTICACAO.placeholder}
                  />
                </TouchableOpacity>
              </View>
              {!!erroSenha && (
                <Text style={estilosAutenticacao.erroTexto}>{erroSenha}</Text>
              )}
            </View>

            {/* Campo Confirmar Senha */}
            <View style={estilosAutenticacao.fieldGroup}>
              <Text style={estilosAutenticacao.inputLabel}>Confirmar senha</Text>
              <View
                style={[
                  estilosAutenticacao.inputWrapper,
                  erroConfirmarSenha && estilosAutenticacao.inputWrapperErro,
                ]}
              >
                <Feather
                  name="lock"
                  size={18}
                  color={erroConfirmarSenha ? CORES_AUTENTICACAO.bordaErro : CORES_AUTENTICACAO.placeholder}
                  style={estilosAutenticacao.inputIcon}
                />
                <TextInput
                  style={estilosAutenticacao.textInput}
                  placeholder="Repita sua senha"
                  placeholderTextColor={CORES_AUTENTICACAO.placeholder}
                  value={confirmarSenha}
                  onChangeText={(val) => {
                    setConfirmarSenha(val);
                    if (erroConfirmarSenha) setErroConfirmarSenha('');
                    if (erroGeral) setErroGeral('');
                  }}
                  secureTextEntry={!mostrarConfirmarSenha}
                />
                <TouchableOpacity
                  onPress={() => setMostrarConfirmarSenha((prev) => !prev)}
                  style={estilosAutenticacao.eyeIcon}
                >
                  <Feather
                    name={mostrarConfirmarSenha ? 'eye-off' : 'eye'}
                    size={18}
                    color={CORES_AUTENTICACAO.placeholder}
                  />
                </TouchableOpacity>
              </View>
              {!!erroConfirmarSenha && (
                <Text style={estilosAutenticacao.erroTexto}>{erroConfirmarSenha}</Text>
              )}
            </View>

            {/* Botão Finalizar Cadastro */}
            <TouchableOpacity
              style={estilosAutenticacao.submitButton}
              onPress={lidarComCadastro}
              disabled={carregando}
              activeOpacity={0.85}
            >
              {carregando ? (
                <ActivityIndicator color={CORES_AUTENTICACAO.textDark} />
              ) : (
                <Text style={estilosAutenticacao.submitButtonText}>Cadastrar</Text>
              )}
            </TouchableOpacity>

            {/* Rodapé: Voltar ao Login */}
            <View style={estilosAutenticacao.footerRow}>
              <Text style={estilosAutenticacao.footerText}>Já tem uma conta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={estilosAutenticacao.footerLink}>Fazer login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
