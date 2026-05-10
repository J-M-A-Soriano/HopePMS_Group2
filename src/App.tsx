import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserRightsProvider, useUserRights } from './context/UserRightsContext';
import { ThemeProvider } from './context/ThemeProvider';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Products } from './pages/Products';
import { PriceHistory } from './pages/PriceHistory';
import { Reports } from './pages/Reports';
import { Users } from './pages/Users';
import { AccessDenied } from './pages/AccessDenied';
import { Settings } from './pages/Settings';
import { Archive } from './pages/Archive';
import { AuditLogs } from './pages/AuditLogs';
import { RolePermissions } from './pages/RolePermissions';
import { BackupRestore } from './pages/BackupRestore';
import { Profile } from './pages/Profile';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen w-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <UserRightsProvider>{children}</UserRightsProvider>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { canViewAdminPanel } = useUserRights();
  if (!canViewAdminPanel) return <Navigate to="/" />;
  return <>{children}</>;
}

function ReportsRoute({ children }: { children: React.ReactNode }) {
  const { canViewReports } = useUserRights();
  if (!canViewReports) return <Navigate to="/" />;
  return <>{children}</>;
}

function SystemConfigRoute({ children }: { children: React.ReactNode }) {
  const { canViewSystemConfig } = useUserRights();
  if (!canViewSystemConfig) return <Navigate to="/" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="hopepms-theme">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/access-denied" element={<AccessDenied />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Products />} />
              <Route path="price-history" element={<PriceHistory />} />
              <Route path="reports" element={<ReportsRoute><Reports /></ReportsRoute>} />
              <Route path="users" element={<AdminRoute><Users /></AdminRoute>} />
              <Route path="archive" element={<AdminRoute><Archive /></AdminRoute>} />
              <Route path="settings" element={<SystemConfigRoute><Settings /></SystemConfigRoute>} />
              <Route path="audit-logs" element={<SystemConfigRoute><AuditLogs /></SystemConfigRoute>} />
              <Route path="role-permissions" element={<SystemConfigRoute><RolePermissions /></SystemConfigRoute>} />
              <Route path="backup-restore" element={<SystemConfigRoute><BackupRestore /></SystemConfigRoute>} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
