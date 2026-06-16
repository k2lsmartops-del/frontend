import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/common/stores/auth.store';
import type { Role } from '@/common/types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Role[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Vérification de rôle si des rôles sont spécifiés
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Rediriger vers la page appropriée selon le rôle
    if (user.role === 'CLIENT') {
      return <Navigate to="/client" replace />;
    }
    if (user.role === 'ADMIN' || user.role === 'COORDINATEUR') {
      return <Navigate to="/admin" replace />;
    }
    // COMMERCIAL et SUPERVISEUR vers la page d'accueil mobile
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
