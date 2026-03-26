import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { fetchReptiles, fetchSharedReptiles, fetchPendingInvites, respondToInvite, deleteReptileById } from '../utils/db';
import { getLastLogDate, timeAgo } from '../utils/storage';

export default function HomePage() {
  const [reptiles, setReptiles] = useState([]);
  const [sharedReptiles, setSharedReptiles] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [ownData, sharedData, invites] = await Promise.all([
        fetchReptiles(),
        fetchSharedReptiles(),
        fetchPendingInvites(),
      ]);
      setReptiles(ownData);
      setSharedReptiles(sharedData);
      setPendingInvites(invites);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.message || 'Failed to load reptiles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, location]);

  async function handleDelete() {
    try {
      await deleteReptileById(deleteId);
      setDeleteId(null);
      setMenuId(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete reptile:', err);
    }
  }

  async function handleInviteResponse(shareId, accept) {
    try {
      await respondToInvite(shareId, accept);
      await loadData();
    } catch (err) {
      console.error('Failed to respond to invite:', err);
    }
  }

  if (loading) {
    return (
      <main className="page">
        <div className="empty-state">
          <div className="empty-state-icon">🦎</div>
          <p className="empty-state-text">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      {error ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <p className="empty-state-text">Failed to load data</p>
          <p className="empty-state-hint">{error}</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => { setLoading(true); loadData(); }}>
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Pending Invites */}
          {pendingInvites.length > 0 && (
            <div className="invites-section">
              <h3 className="section-title">Pending Invites</h3>
              <div className="invites-list">
                {pendingInvites.map((invite) => (
                  <div key={invite.id} className="invite-card">
                    <div className="invite-info">
                      <span className="invite-reptile">{invite.reptile?.name || 'Unknown reptile'}</span>
                      <span className="invite-from">Shared by {invite.owner?.display_name || 'Someone'}</span>
                    </div>
                    <div className="invite-actions">
                      <button className="btn btn-sm btn-secondary" onClick={() => handleInviteResponse(invite.id, false)}>
                        Decline
                      </button>
                      <button className="btn btn-sm btn-primary" onClick={() => handleInviteResponse(invite.id, true)}>
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Own Reptiles */}
          {reptiles.length === 0 && sharedReptiles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🦎</div>
              <p className="empty-state-text">No reptiles yet</p>
              <p className="empty-state-hint">Tap + to add your first reptile!</p>
            </div>
          ) : (
            <>
              {reptiles.length > 0 && (
                <div className="reptile-grid">
                  {reptiles.map((reptile) => {
                    const lastLog = getLastLogDate(reptile);
                    return (
                      <div key={reptile.id} className="reptile-card-wrap">
                        <Link to={`/reptile/${reptile.id}`} className="reptile-card">
                          {reptile.photo ? (
                            <img src={reptile.photo} alt={reptile.name} className="reptile-card-img" />
                          ) : (
                            <div className="reptile-card-placeholder">🦎</div>
                          )}
                          <div className="reptile-card-info">
                            <div className="reptile-card-name">{reptile.name}</div>
                            <div className="reptile-card-species">{reptile.species}</div>
                            <div className="reptile-card-lastlog">
                              {lastLog ? timeAgo(lastLog) : 'No logs yet'}
                            </div>
                          </div>
                        </Link>
                        <button
                          className="card-menu-btn"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuId(menuId === reptile.id ? null : reptile.id); }}
                          aria-label="More options"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                          </svg>
                        </button>
                        {menuId === reptile.id && (
                          <CardMenu
                            onEdit={() => { setMenuId(null); navigate(`/reptile/${reptile.id}?edit=1`); }}
                            onDelete={() => { setMenuId(null); setDeleteId(reptile.id); }}
                            onClose={() => setMenuId(null)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Shared Reptiles */}
              {sharedReptiles.length > 0 && (
                <>
                  <h3 className="section-title" style={{ marginTop: reptiles.length > 0 ? 24 : 0 }}>Shared with you</h3>
                  <div className="reptile-grid">
                    {sharedReptiles.map((share) => {
                      const reptile = share.reptile;
                      if (!reptile) return null;
                      const lastLog = getLastLogDate(reptile);
                      return (
                        <div key={share.id} className="reptile-card-wrap">
                          <Link to={`/reptile/${reptile.id}`} className="reptile-card">
                            {reptile.photo ? (
                              <img src={reptile.photo} alt={reptile.name} className="reptile-card-img" />
                            ) : (
                              <div className="reptile-card-placeholder">🦎</div>
                            )}
                            <div className="reptile-card-info">
                              <div className="reptile-card-name">{reptile.name}</div>
                              <div className="reptile-card-species">{reptile.species}</div>
                              <div className="shared-badge">
                                Shared by {share.owner?.display_name || 'Unknown'}
                              </div>
                              <div className="reptile-card-lastlog">
                                {lastLog ? timeAgo(lastLog) : 'No logs yet'}
                              </div>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      <button className="fab" onClick={() => navigate('/add')} aria-label="Add reptile">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {deleteId && (
        <ConfirmOverlay
          message={`Delete ${reptiles.find((r) => r.id === deleteId)?.name || 'this reptile'}?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </main>
  );
}

function CardMenu({ onEdit, onDelete, onClose }) {
  const ref = useRef();

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [onClose]);

  return (
    <div className="card-menu" ref={ref}>
      <button className="card-menu-item" onClick={onEdit}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
        Edit
      </button>
      <button className="card-menu-item card-menu-item-danger" onClick={onDelete}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        </svg>
        Delete
      </button>
    </div>
  );
}

function ConfirmOverlay({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <p className="confirm-message">{message}</p>
        <div className="form-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}
