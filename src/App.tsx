import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import ProfilePage from '@/features/profile/pages/ProfilePage';
// Supervisor pages
import SupervisorHomePage from '@/features/supervisor/pages/SupervisorHomePage';
import ValidationQueuePage from '@/features/supervisor/pages/ValidationQueuePage';
import TeamPage from '@/features/supervisor/pages/TeamPage';
import { useAuthStore } from '@/common/stores/auth.store';

function RoleBasedHomePage() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === 'SUPERVISEUR') return <SupervisorHomePage />;
  return <HomePage />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <UpdatePrompt />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RoleBasedHomePage />} />
            {/* Commercial routes */}
            <Route path="prospect" element={<ProspectFormPage />} />
            <Route path="marchand" element={<MarchandFormPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="submissions/:id/edit" element={<EditSubmissionPage />} />
            {/* Supervisor routes */}
            <Route path="validation" element={<ValidationQueuePage />} />
            <Route path="validation/:id" element={<ValidationQueuePage />} />
            <Route path="team" element={<TeamPage />} />
            {/* Common routes */}
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
