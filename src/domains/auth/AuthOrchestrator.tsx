import React from 'react';
import { AuthView } from './components/AuthView';
export { useAuth, AuthProvider } from './shared/hooks/useAuth';
export { AuthProtectedRoute as ProtectedRoute } from './components/AuthProtectedRoute';
export { AuthForm } from './components/AuthForm';
export { AuthDevBanner as DevAuthBanner } from './components/AuthDevBanner';

/**
 * AuthOrchestrator: Entry point tunggal domain Otentikasi & Sesi
 */
export const AuthOrchestrator: React.FC = () => {
  return <AuthView />;
};

export default AuthOrchestrator;
