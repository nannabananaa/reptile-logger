import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AddReptile from './pages/AddReptile';
import ReptileDetail from './pages/ReptileDetail';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import SetupProfilePage from './pages/SetupProfilePage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }) {
  const { session, profile } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  if (!profile?.display_name?.trim()) return <Navigate to="/setup-profile" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { session } = useAuth();
  if (session) return <Navigate to="/" replace />;
  return children;
}

function ProfileSetupRoute({ children }) {
  const { session, profile } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  if (profile?.display_name?.trim()) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { ready } = useAuth();

  // Block ALL route rendering until session + profile are fully resolved.
  // This prevents any flash of wrong pages during auth transitions.
  if (!ready) {
    return (
      <main className="auth-page">
        <div className="auth-loading">
          <div className="auth-logo">🦎</div>
        </div>
      </main>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />
      <Route path="/setup-profile" element={<ProfileSetupRoute><SetupProfilePage /></ProfileSetupRoute>} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<HomePage />} />
        <Route path="/add" element={<AddReptile />} />
        <Route path="/reptile/:id" element={<ReptileDetail />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
