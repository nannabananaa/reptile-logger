import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { upsertProfile } from '../utils/db';

export default function SetupProfilePage() {
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { session, refreshProfile } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await upsertProfile({
        display_name: displayName.trim(),
        email: session.user.email,
      });
      await refreshProfile();
    } catch (err) {
      setError(err.message || 'Failed to create profile');
      setLoading(false);
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
          <p className="auth-subtitle">Set up your profile</p>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Display Name</label>
            <input
              className="form-input"
              type="text"
              placeholder="What should others call you?"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <button type="submit" className="btn btn-primary btn-auth" disabled={loading}>
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </main>
  );
}
