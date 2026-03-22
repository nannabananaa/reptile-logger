import { Outlet, useLocation, useNavigate } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

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
      </header>
      <Outlet />
    </>
  );
}
