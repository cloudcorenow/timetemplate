import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import LoginPage from './pages/LoginPage';
import EnhancedDashboardPage from './pages/EnhancedDashboardPage';
import CalendarPage from './pages/CalendarPage';
import RequestFormPage from './pages/RequestFormPage';
import TeamOverviewPage from './pages/TeamOverviewPage';
import EmployeeManagementPage from './pages/EmployeeManagementPage';
import LogsPage from './pages/LogsPage';

// Mobile Pages
import MobileDashboard from './components/mobile/MobileDashboard';
import MobileRequestFormPage from './components/mobile/MobileRequestFormPage';
import MobileCalendar from './components/mobile/MobileCalendar';
import MobileTeamView from './components/mobile/MobileTeamView';
import MobileEmployeeManagement from './components/mobile/MobileEmployeeManagement';

// Components
import ResponsiveLayout from './components/layout/ResponsiveLayout';
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
  const { isNative } = useCapacitor();

  // Determine if we should use mobile layout
  const isMobile = window.innerWidth < 768 || isNative;

  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <ResponsiveLayout />
              </ProtectedRoute>
            }
          >
            {/* Conditionally render mobile or desktop components */}
            <Route index element={isMobile ? <MobileDashboard /> : <EnhancedDashboardPage />} />
            <Route path="calendar" element={isMobile ? <MobileCalendar /> : <CalendarPage />} />
            <Route path="request" element={isMobile ? <MobileRequestFormPage /> : <RequestFormPage />} />
            <Route path="team" element={isMobile ? <MobileTeamView /> : <TeamOverviewPage />} />
            <Route path="employees" element={isMobile ? <MobileEmployeeManagement /> : <EmployeeManagementPage />} />
            <Route path="logs" element={<LogsPage />} />
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