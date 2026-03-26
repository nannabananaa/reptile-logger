import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AddReptile from './pages/AddReptile';
import ReptileDetail from './pages/ReptileDetail';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import SetupProfilePage from './pages/SetupProfilePage';

function ProtectedRoute({ children }) {
  const { session, loading, profile, profileLoading } = useAuth();

  if (loading || profileLoading) {
    return (
      <main className="auth-page">
        <div className="auth-loading">
          <div className="auth-logo">🦎</div>
        </div>
      </main>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  // Existing user without a profile — prompt to set display name
  if (!profile) return <Navigate to="/setup-profile" replace />;

  return children;
}

function PublicRoute({ children }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/" replace />;
  return children;
}

function ProfileSetupRoute({ children }) {
  const { session, loading, profile, profileLoading } = useAuth();
  if (loading || profileLoading) return null;
  if (!session) return <Navigate to="/login" replace />;
  if (profile) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />
      <Route path="/setup-profile" element={<ProfileSetupRoute><SetupProfilePage /></ProfileSetupRoute>} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<HomePage />} />
        <Route path="/add" element={<AddReptile />} />
        <Route path="/reptile/:id" element={<ReptileDetail />} />
      </Route>
    </Routes>
  );
}
