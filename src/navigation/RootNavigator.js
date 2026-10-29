import React from 'react';
import AuthNavigator from './AuthNavigator';
import OrganizerNavigator from './OrganizerNavigator';
import TechnicianNavigator from './TechnicianNavigator';

/**
 * Navegador Raiz que orquestra a sessão do usuário:
 * 1. Sem usuário logado -> AuthNavigator (Login / Registro)
 * 2. Logado como técnico -> TechnicianNavigator
 * 3. Logado como organizador/admin -> OrganizerNavigator (Figma)
 */
export default function RootNavigator({ currentUser, setCurrentUser, onLogout }) {
  if (!currentUser) {
    return (
      <AuthNavigator
        onLoginSuccess={(user) => setCurrentUser(user)}
        onRegisterSuccess={(user) => setCurrentUser(user)}
      />
    );
  }

  if (currentUser.role === 'technician') {
    return <TechnicianNavigator user={currentUser} onLogout={onLogout} />;
  }

  // Padrão para organizador / administrador
  return <OrganizerNavigator usuario={currentUser} onLogout={onLogout} />;
}
