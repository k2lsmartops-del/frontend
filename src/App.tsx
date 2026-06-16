import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/common/components/AppLayout';
import ProtectedRoute from '@/common/components/ProtectedRoute';
import ErrorBoundary from '@/common/components/ErrorBoundary';
import UpdatePrompt from '@/common/components/UpdatePrompt';
import LoginPage from '@/features/auth/pages/LoginPage';
import HomePage from '@/features/home/pages/HomePage';
import ProspectFormPage from '@/features/prospect/pages/ProspectFormPage';
import MarchandFormPage from '@/features/marchand/pages/MarchandFormPage';
import EditSubmissionPage from '@/features/submissions/pages/EditSubmissionPage';
import MesSoumissionsPage from '@/features/submissions/pages/MesSoumissionsPage';
import ProfilePage from '@/features/profile/pages/ProfilePage';
// Supervisor pages
import SupervisorHomePage from '@/features/supervisor/pages/SupervisorHomePage';
import TeamPage from '@/features/supervisor/pages/TeamPage';
import UserDetailPage from '@/features/supervisor/pages/UserDetailPage';
// Admin pages
import AdminLayout from '@/features/admin/components/AdminLayout';
import AdminDashboardPage from '@/features/admin/pages/AdminDashboardPage';
import AdminProfilePage from '@/features/admin/pages/AdminProfilePage';
import UsersPage from '@/features/admin/pages/UsersPage';
import ClustersPage from '@/features/admin/pages/ClustersPage';
import ValidationCoordinateurPage from '@/features/admin/pages/ValidationCoordinateurPage';
import ValidationHistoryPage from '@/features/admin/pages/ValidationHistoryPage';
import ValidationMapPage from '@/features/admin/pages/ValidationMapPage';
// Client pages
import ClientLayout from '@/features/client/components/ClientLayout';
import ClientDashboardPage from '@/features/client/pages/ClientDashboardPage';
import ClientProfilePage from '@/features/client/pages/ClientProfilePage';
import ClientSubmissionsPage from '@/features/client/pages/ClientSubmissionsPage';
import ClientMapPage from '@/features/client/pages/ClientMapPage';
import ClientReportsPage from '@/features/client/pages/ClientReportsPage';
import { useAuthStore } from '@/common/stores/auth.store';

function RoleBasedHomePage() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === 'SUPERVISEUR') return <SupervisorHomePage />;
  return <HomePage />;
}

function RoleBasedRoot() {
  const user = useAuthStore((s) => s.user);
  const location = window.location.pathname;
  
  // Permettre aux admins/coordinateurs d'accéder à /profile pour modifier leurs infos
  if ((user?.role === 'ADMIN' || user?.role === 'COORDINATEUR') && location === '/') {
    return <Navigate to="/admin" replace />;
  }
  if (user?.role === 'CLIENT') {
    return <Navigate to="/client" replace />;
  }
  return <RoleBasedHomePage />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <UpdatePrompt />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Client portal (desktop web) */}
          <Route
            path="/client"
            element={
              <ProtectedRoute allowedRoles={['CLIENT']}>
                <ClientLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ClientDashboardPage />} />
            <Route path="profile" element={<ClientProfilePage />} />
            <Route path="submissions" element={<ClientSubmissionsPage />} />
            <Route path="map" element={<ClientMapPage />} />
            <Route path="reports" element={<ClientReportsPage />} />
          </Route>

          {/* Admin / Coordinator desktop back-office */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'COORDINATEUR']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="profile" element={<AdminProfilePage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="clusters" element={<ClustersPage />} />
            <Route path="validations" element={<ValidationCoordinateurPage />} />
            <Route path="validation-history" element={<ValidationHistoryPage />} />
            <Route path="validation-map" element={<ValidationMapPage />} />
          </Route>

          {/* Mobile PWA routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['COMMERCIAL', 'SUPERVISEUR']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RoleBasedRoot />} />
            {/* Commercial routes */}
            <Route path="prospect" element={<ProspectFormPage />} />
            <Route path="marchand" element={<MarchandFormPage />} />
            <Route path="history" element={<Navigate to="/mes-soumissions" replace />} />
            <Route path="mes-soumissions" element={<MesSoumissionsPage />} />
            <Route path="submissions/:id/edit" element={<EditSubmissionPage />} />
            {/* Supervisor routes */}
            <Route path="team" element={<TeamPage />} />
            <Route path="team/:userId" element={<UserDetailPage />} />
            {/* Common routes */}
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
