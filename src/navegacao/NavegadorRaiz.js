import React from 'react';
import NavegadorAutenticacao from './NavegadorAutenticacao';
import NavegadorOrganizador from './NavegadorOrganizador';
import NavegadorTecnico from './NavegadorTecnico';
import TelaVinculoEmpresa from '../telas/autenticacao/TelaVinculoEmpresa';

/**
 * Navegador Raiz que orquestra a sessão do usuário:
 * 1. Sem usuário conectado -> NavegadorAutenticacao (Login / Registro)
 * 2. Conectado como técnico -> NavegadorTecnico
 * 3. Conectado como organizador / administrador -> NavegadorOrganizador (Figma)
 */
export default function NavegadorRaiz({ currentUser, setCurrentUser, onLogout }) {
  if (!currentUser) {
    return (
      <NavegadorAutenticacao
        onLoginSuccess={(usuario) => setCurrentUser(usuario)}
        onRegisterSuccess={(usuario) => setCurrentUser(usuario)}
      />
    );
  }

  if (!currentUser.idEmpresa) {
    return (
      <TelaVinculoEmpresa
        user={currentUser}
        onLogout={onLogout}
        onVinculoConcluido={setCurrentUser}
      />
    );
  }

  if (currentUser.papel !== true) {
    return <NavegadorTecnico user={currentUser} onLogout={onLogout} />;
  }

  // Padrão para organizador / administrador
  return <NavegadorOrganizador usuario={currentUser} setCurrentUser={setCurrentUser} onLogout={onLogout} />;
}

export const RootNavigator = NavegadorRaiz;
