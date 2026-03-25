import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      navigate('/');
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">🦎</div>
          <h1 className="auth-title">
            Reptile <span className="accent">Logger</span>
          </h1>
          <p className="auth-subtitle">Welcome back</p>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          {successMessage && <div className="auth-success">{successMessage}</div>}
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-auth" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup" className="auth-link">Sign up</Link>
        </p>
      </div>
    </main>
  );
}
