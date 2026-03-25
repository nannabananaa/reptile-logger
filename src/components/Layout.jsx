import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const isHome = location.pathname === '/';

  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  return (
    <>
      <header className="topbar">
        {!isHome && (
          <button className="topbar-back" onClick={() => navigate(-1)} aria-label="Go back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        <h1 className="topbar-title">
          Reptile <span className="accent">Logger</span>
        </h1>
        <button className="topbar-logout" onClick={handleLogout} aria-label="Log out">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </header>
      <Outlet />
    </>
  );
}
