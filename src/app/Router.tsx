import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppLayout from '@/common/components/AppLayout';
import ProtectedRoute from '@/common/components/ProtectedRoute';
import LoginPage from '@/features/auth/pages/LoginPage';
import HomePage from '@/features/home/pages/HomePage';
import ProspectFormPage from '@/features/prospect/pages/ProspectFormPage';
import MarchandFormPage from '@/features/marchand/pages/MarchandFormPage';
import HistoryPage from '@/features/history/pages/HistoryPage';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'prospect', element: <ProspectFormPage /> },
      { path: 'marchand', element: <MarchandFormPage /> },
      { path: 'history', element: <HistoryPage /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
