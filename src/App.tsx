import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from '@/common/components/AppLayout';
import ProtectedRoute from '@/common/components/ProtectedRoute';
import LoginPage from '@/features/auth/pages/LoginPage';
import HomePage from '@/features/home/pages/HomePage';
import ProspectFormPage from '@/features/prospect/pages/ProspectFormPage';
import MarchandFormPage from '@/features/marchand/pages/MarchandFormPage';
import HistoryPage from '@/features/history/pages/HistoryPage';
import EditSubmissionPage from '@/features/submissions/pages/EditSubmissionPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="prospect" element={<ProspectFormPage />} />
          <Route path="marchand" element={<MarchandFormPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="submissions/:id/edit" element={<EditSubmissionPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
