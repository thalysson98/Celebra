import { doc, getDoc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { autenticacao, bancoDados } from '../configuracao/configuracaoFirebase';
import { obterPerfilUsuario } from './servicoUsuario';

export async function vincularFuncionario(codigoEmpresa) {
  const usuario = autenticacao.currentUser;
  if (!usuario) throw new Error('Sua sessão expirou. Entre novamente.');

  const codigo = String(codigoEmpresa || '').trim();
  if (!/^[A-Za-z0-9]{20}$/.test(codigo)) {
    throw new Error('Digite o ID da empresa, com 20 caracteres, fornecido pelo administrador.');
  }

  const perfilAtual = await obterPerfilUsuario(usuario);
  if (perfilAtual.ativo !== true) throw new Error('Esta conta não está ativa.');
  if (perfilAtual.idEmpresa) throw new Error('Esta conta já está vinculada a uma empresa.');
  if (perfilAtual.papel !== false) throw new Error('Somente funcionários podem se vincular por código.');

  const idEmpresa = codigo;
  const idMembro = `${idEmpresa}_${usuario.uid}`;
  const refUsuario = doc(bancoDados, 'usuarios', usuario.uid);
  const refMembro = doc(bancoDados, 'membros', idMembro);
  const lote = writeBatch(bancoDados);

  lote.update(refUsuario, { id_empresa: idEmpresa });
  lote.set(refMembro, {
    id_membro: idMembro,
    id_empresa: idEmpresa,
    id_usuario: usuario.uid,
    tipo_acesso: 'funcionario',
    situacao: 'ativo',
    data_vinculo: serverTimestamp(),
  });

  await lote.commit();
  return obterPerfilUsuario(usuario);
}

export async function obterDadosEmpresa(idEmpresa) {
  const usuario = autenticacao.currentUser;
  if (!usuario) throw new Error('Sua sessão expirou. Entre novamente.');
  const perfil = await obterPerfilUsuario(usuario);
  if (perfil.papel !== true || perfil.idEmpresa !== idEmpresa) {
    throw new Error('Você não tem permissão para editar esta empresa.');
  }

  const snapshot = await getDoc(doc(bancoDados, 'empresas', idEmpresa));
  if (!snapshot.exists()) throw new Error('Não encontramos os dados da empresa.');
  return { id: snapshot.id, ...snapshot.data() };
}

export async function atualizarDadosEmpresa(idEmpresa, dadosEmpresa) {
  const usuario = autenticacao.currentUser;
  if (!usuario) throw new Error('Sua sessão expirou. Entre novamente.');
  const perfil = await obterPerfilUsuario(usuario);
  if (perfil.papel !== true || perfil.idEmpresa !== idEmpresa) {
    throw new Error('Você não tem permissão para editar esta empresa.');
  }

  const nomeFantasia = String(dadosEmpresa.nome_fantasia || '').trim();
  if (nomeFantasia.length < 2) throw new Error('Informe o nome da empresa.');

  const endereco = Object.fromEntries(
    Object.entries(dadosEmpresa.endereco || {}).map(([campo, valor]) => [campo, String(valor || '').trim()]),
  );
  await updateDoc(doc(bancoDados, 'empresas', idEmpresa), {
    nome_fantasia: nomeFantasia,
    razao_social: String(dadosEmpresa.razao_social || '').trim(),
    cnpj: String(dadosEmpresa.cnpj || '').trim(),
    email: String(dadosEmpresa.email || '').trim(),
    telefone: String(dadosEmpresa.telefone || '').trim(),
    endereco,
  });
  return obterPerfilUsuario(usuario);
}
