import React from 'react';
import { AuthView } from '@/domains/auth/components/AuthView';
export { useAuth, AuthProvider } from '@/domains/auth/shared/hooks/useAuth';
export { AuthProtectedRoute as ProtectedRoute } from '@/domains/auth/components/AuthProtectedRoute';
export { AuthForm } from '@/domains/auth/components/AuthForm';
export { AuthDevBanner as DevAuthBanner } from '@/domains/auth/components/AuthDevBanner';

/**
 * AuthOrchestrator: Entry point tunggal domain Otentikasi & Sesi
 */
export const AuthOrchestrator: React.FC = () => {
  return <AuthView />;
};

export default AuthOrchestrator;
