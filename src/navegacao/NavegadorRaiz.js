import React from 'react';
import NavegadorAutenticacao from './NavegadorAutenticacao';
import NavegadorOrganizador from './NavegadorOrganizador';
import NavegadorTecnico from './NavegadorTecnico';

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

  if (currentUser.role === 'technician') {
    return <NavegadorTecnico user={currentUser} onLogout={onLogout} />;
  }

  // Padrão para organizador / administrador
  return <NavegadorOrganizador usuario={currentUser} onLogout={onLogout} />;
}

export const RootNavigator = NavegadorRaiz;
