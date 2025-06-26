import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import LoginPage from './pages/LoginPage';
import EnhancedDashboardPage from './pages/EnhancedDashboardPage';
import CalendarPage from './pages/CalendarPage';
import RequestFormPage from './pages/RequestFormPage';
import TeamOverviewPage from './pages/TeamOverviewPage';
import EmployeeManagementPage from './pages/EmployeeManagementPage';

// Components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MobileOptimizations from './components/mobile/MobileOptimizations';
import ToastContainer from './components/ui/ToastContainer';

// Context
import { AuthProvider } from './context/AuthContext';

// Hooks
import { useCapacitor } from './hooks/useCapacitor';
import { useToast } from './hooks/useToast';

function AppContent() {
  const { toasts, removeToast } = useToast();

  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<EnhancedDashboardPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="request" element={<RequestFormPage />} />
            <Route path="team" element={<TeamOverviewPage />} />
            <Route path="employees" element={<EmployeeManagementPage />} />
          </Route>
        </Routes>
      </Router>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}

function App() {
  const { isNative, platform } = useCapacitor();

  React.useEffect(() => {
    if (isNative) {
      console.log(`📱 TimeOff Manager running natively on ${platform}`);
    } else {
      console.log('🌐 TimeOff Manager running in web browser');
    }
  }, [isNative, platform]);

  return (
    <AuthProvider>
      <MobileOptimizations>
        <AppContent />
      </MobileOptimizations>
    </AuthProvider>
  );
}

export default App;