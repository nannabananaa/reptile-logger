import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Code-split every page. The initial bundle becomes auth + router + AuthContext;
// charts (recharts), settings, detail views etc. load on demand.
const Layout = lazy(() => import('./components/Layout'));
const HomePage = lazy(() => import('./pages/HomePage'));
const AddReptile = lazy(() => import('./pages/AddReptile'));
const ReptileDetail = lazy(() => import('./pages/ReptileDetail'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const SetupProfilePage = lazy(() => import('./pages/SetupProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function LoadingScreen() {
  return (
    <main className="auth-page">
      <div className="auth-loading">
        <div className="auth-logo">🦎</div>
      </div>
    </main>
  );
}

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
  if (!ready) return <LoadingScreen />;

  return (
    <Suspense fallback={<LoadingScreen />}>
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
    </Suspense>
  );
}
