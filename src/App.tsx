import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/common/components/AppLayout';
import ProtectedRoute from '@/common/components/ProtectedRoute';
import ErrorBoundary from '@/common/components/ErrorBoundary';
import UpdatePrompt from '@/common/components/UpdatePrompt';
import LoginPage from '@/features/auth/pages/LoginPage';
import HomePage from '@/features/home/pages/HomePage';
import ProspectFormPage from '@/features/prospect/pages/ProspectFormPage';
import MarchandFormPage from '@/features/marchand/pages/MarchandFormPage';
import HistoryPage from '@/features/history/pages/HistoryPage';
import EditSubmissionPage from '@/features/submissions/pages/EditSubmissionPage';
import MesSoumissionsPage from '@/features/submissions/pages/MesSoumissionsPage';
import ProfilePage from '@/features/profile/pages/ProfilePage';
// Supervisor pages
import SupervisorHomePage from '@/features/supervisor/pages/SupervisorHomePage';
import ValidationQueuePage from '@/features/supervisor/pages/ValidationQueuePage';
import SubmissionDetailPage from '@/features/supervisor/pages/SubmissionDetailPage';
import TeamPage from '@/features/supervisor/pages/TeamPage';
// Admin pages
import AdminLayout from '@/features/admin/components/AdminLayout';
import AdminDashboardPage from '@/features/admin/pages/AdminDashboardPage';
import UsersPage from '@/features/admin/pages/UsersPage';
import ZonesPage from '@/features/admin/pages/ZonesPage';
import SecteursPage from '@/features/admin/pages/SecteursPage';
import ValidationCoordinateurPage from '@/features/admin/pages/ValidationCoordinateurPage';
import { useAuthStore } from '@/common/stores/auth.store';

function RoleBasedHomePage() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === 'SUPERVISEUR') return <SupervisorHomePage />;
  return <HomePage />;
}

function RoleBasedRoot() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === 'ADMIN' || user?.role === 'COORDINATEUR') {
    return <Navigate to="/admin" replace />;
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

          {/* Admin / Coordinator desktop back-office */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="zones" element={<ZonesPage />} />
            <Route path="secteurs" element={<SecteursPage />} />
            <Route path="validations" element={<ValidationCoordinateurPage />} />
          </Route>

          {/* Mobile PWA routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RoleBasedRoot />} />
            {/* Commercial routes */}
            <Route path="prospect" element={<ProspectFormPage />} />
            <Route path="marchand" element={<MarchandFormPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="mes-soumissions" element={<MesSoumissionsPage />} />
            <Route path="submissions/:id/edit" element={<EditSubmissionPage />} />
            {/* Supervisor routes */}
            <Route path="validation" element={<ValidationQueuePage />} />
            <Route path="validation/:id" element={<SubmissionDetailPage />} />
            <Route path="team" element={<TeamPage />} />
            {/* Common routes */}
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
