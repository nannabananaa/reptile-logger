import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  fetchReptileById, fetchLogs, updateReptileById,
  deleteReptileById, createLog, deleteLogById,
  lookupProfileByEmail, shareReptile, fetchSharesForReptile, removeShare,
} from '../utils/db';
import { useAuth } from '../contexts/AuthContext';
import { getVitamins, saveVitamins, calculateAge } from '../utils/storage';

const CHART_COLORS = {
  temperature: '#c4a44a',
  humidity: '#5b9a6b',
  weight: '#a67c52',
};

export default function ReptileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const [reptile, setReptile] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('logs');
  const [filter, setFilter] = useState('all');
  const [showLogForm, setShowLogForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(!!searchParams.get('edit'));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLogId, setDeleteLogId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const isOwner = reptile && session && reptile.user_id === session.user.id;

  const reload = useCallback(async () => {
    try {
      const [reptileData, logsData] = await Promise.all([
        fetchReptileById(id),
        fetchLogs(id),
      ]);
      setReptile(reptileData);
      setLogs(logsData);
    } catch (err) {
      console.error('Failed to load reptile:', err);
      setReptile(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  const filteredLogs = useMemo(() => {
    const sorted = [...logs].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    if (filter === 'all') return sorted;
    const days = filter === '7d' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return sorted.filter((l) => new Date(l.created_at) >= cutoff);
  }, [logs, filter]);

  const summary = useMemo(() => {
    const fedCount = filteredLogs.filter((l) => l.fed).length;
    const vitaminCounts = {};
    filteredLogs.forEach((l) => {
      (l.vitamins || []).forEach((v) => {
        vitaminCounts[v] = (vitaminCounts[v] || 0) + 1;
      });
    });
    return { fedCount, vitaminCounts, total: filteredLogs.length };
  }, [filteredLogs]);

  const chartData = useMemo(() => {
    return [...logs]
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((l) => ({
        date: new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        temperature: l.temperature,
        humidity: l.humidity,
        weight: l.weight,
      }));
  }, [logs]);

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

  if (!reptile) {
    return (
      <main className="page">
        <div className="detail-placeholder">
          <div className="detail-placeholder-icon">🔍</div>
          <h2>Not Found</h2>
          <p>This reptile doesn't exist.</p>
        </div>
      </main>
    );
  }

  const age = calculateAge(reptile.dob);
  const hasChartData = chartData.length >= 2;

  async function handleDeleteReptile() {
    try {
      await deleteReptileById(id);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete reptile:', err);
    }
  }

  async function handleDeleteLog(logId) {
    try {
      await deleteLogById(logId);
      setDeleteLogId(null);
      await reload();
    } catch (err) {
      console.error('Failed to delete log:', err);
    }
  }

  return (
    <main className="page detail-page">
      {/* Hero */}
      <div className="detail-hero">
        {reptile.photo ? (
          <img src={reptile.photo} alt={reptile.name} className="detail-hero-img" />
        ) : (
          <div className="detail-hero-placeholder">🦎</div>
        )}
      </div>

      {/* Info */}
      <div className="detail-info">
        <div className="detail-info-header">
          <div>
            <h2 className="detail-name">{reptile.name}</h2>
            {reptile.species && <p className="detail-species">{reptile.species}</p>}
            {age && <p className="detail-age">{age} old</p>}
          </div>
          <div className="detail-actions">
            {isOwner && (
              <button className="icon-btn" onClick={() => setShowShareModal(true)} aria-label="Share">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </button>
            )}
            {isOwner && (
              <button className="icon-btn" onClick={() => setShowEditForm(true)} aria-label="Edit">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </button>
            )}
            {isOwner && (
              <button className="icon-btn icon-btn-danger" onClick={() => setShowDeleteConfirm(true)} aria-label="Delete">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <button className="btn btn-primary btn-full" onClick={() => setShowLogForm(true)}>
        + New Log
      </button>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'logs' ? 'tab-active' : ''}`} onClick={() => setActiveTab('logs')}>
          Logs
        </button>
        <button className={`tab ${activeTab === 'charts' ? 'tab-active' : ''}`} onClick={() => setActiveTab('charts')}>
          Charts
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'logs' ? (
        <div className="log-section">
          {/* Filter */}
          <div className="log-filters">
            {['all', '7d', '30d'].map((f) => (
              <button
                key={f}
                className={`filter-chip ${filter === f ? 'filter-chip-active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>

          {/* Summary */}
          {filteredLogs.length > 0 && (
            <div className="log-summary">
              <div className="log-summary-stat">
                <span className="log-summary-value">{summary.fedCount}</span>
                <span className="log-summary-label">Fed</span>
              </div>
              <div className="log-summary-divider" />
              <div className="log-summary-stat">
                <span className="log-summary-value">{Object.keys(summary.vitaminCounts).length}</span>
                <span className="log-summary-label">Vitamins</span>
              </div>
              <div className="log-summary-divider" />
              <div className="log-summary-stat">
                <span className="log-summary-value">{summary.total}</span>
                <span className="log-summary-label">Logs</span>
              </div>
            </div>
          )}

          {filteredLogs.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon" style={{ fontSize: 48 }}>📋</div>
              <p className="empty-state-text">No logs yet</p>
              <p className="empty-state-hint">Add your first one!</p>
            </div>
          ) : (
            <div className="log-list">
              {filteredLogs.map((log) => (
                <LogCard key={log.id} log={log} onDelete={() => setDeleteLogId(log.id)} isOwner={isOwner} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="charts-section">
          {!hasChartData ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon" style={{ fontSize: 48 }}>📈</div>
              <p className="empty-state-text">Need at least 2 logs to show trends</p>
              <p className="empty-state-hint">Keep logging to see your charts!</p>
            </div>
          ) : (
            <>
              <ChartCard title="Temperature (°F)" dataKey="temperature" color={CHART_COLORS.temperature} data={chartData} unit="°F" />
              <ChartCard title="Humidity (%)" dataKey="humidity" color={CHART_COLORS.humidity} data={chartData} unit="%" />
              <ChartCard title="Weight (g)" dataKey="weight" color={CHART_COLORS.weight} data={chartData} unit="g" />
            </>
          )}
        </div>
      )}

      {/* Modals */}
      {showLogForm && (
        <LogFormModal
          reptileId={id}
          onClose={() => setShowLogForm(false)}
          onSave={() => { setShowLogForm(false); reload(); }}
        />
      )}
      {showEditForm && (
        <EditReptileModal
          reptile={reptile}
          onClose={() => setShowEditForm(false)}
          onSave={() => { setShowEditForm(false); reload(); }}
        />
      )}
      {showShareModal && (
        <ShareModal
          reptileId={id}
          onClose={() => setShowShareModal(false)}
        />
      )}
      {showDeleteConfirm && (
        <ConfirmModal
          message={`Delete ${reptile.name} and all their logs?`}
          confirmLabel="Delete"
          onConfirm={handleDeleteReptile}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
      {deleteLogId && (
        <ConfirmModal
          message="Delete this log entry?"
          confirmLabel="Delete"
          onConfirm={() => handleDeleteLog(deleteLogId)}
          onCancel={() => setDeleteLogId(null)}
        />
      )}
    </main>
  );
}

/* ── Chart Card ── */
function ChartCard({ title, dataKey, color, data, unit }) {
  const filtered = data.filter((d) => d[dataKey] != null);
  if (filtered.length < 2) {
    return (
      <div className="chart-card">
        <h4 className="chart-title">{title}</h4>
        <p className="chart-nodata">Not enough data</p>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <h4 className="chart-title">{title}</h4>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={filtered} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#a8a090', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            />
            <YAxis
              tick={{ fill: '#a8a090', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={45}
            />
            <Tooltip
              contentStyle={{
                background: '#1a2e1a',
                border: '1px solid #2a4a2e',
                borderRadius: 10,
                fontSize: 13,
                color: '#e8e4dc',
              }}
              formatter={(value) => [`${value}${unit}`, title.split(' ')[0]]}
              labelStyle={{ color: '#a8a090' }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2.5}
              dot={{ fill: color, r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: color, stroke: '#121a12', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── Log Card ── */
function LogCard({ log, onDelete, isOwner }) {
  const date = new Date(log.created_at);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const loggedBy = log.profile?.display_name;

  return (
    <div className="log-card">
      <div className="log-card-header">
        <div className="log-card-date">
          <span className="log-date-primary">{dateStr}</span>
          <span className="log-date-time">{timeStr}</span>
          {loggedBy && <span className="log-logged-by">Logged by {loggedBy}</span>}
        </div>
        {isOwner && (
          <button className="icon-btn icon-btn-sm icon-btn-danger" onClick={onDelete} aria-label="Delete log">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>
      <div className="log-card-stats">
        {log.temperature != null && (
          <div className="log-stat">
            <span className="log-stat-icon">🌡️</span>
            <span>{log.temperature}°F</span>
          </div>
        )}
        {log.humidity != null && (
          <div className="log-stat">
            <span className="log-stat-icon">💧</span>
            <span>{log.humidity}%</span>
          </div>
        )}
        {log.weight != null && (
          <div className="log-stat">
            <span className="log-stat-icon">⚖️</span>
            <span>{log.weight}g</span>
          </div>
        )}
        <div className="log-stat">
          <span className="log-stat-icon">🍽️</span>
          <span className={log.fed ? 'log-fed-yes' : 'log-fed-no'}>{log.fed ? 'Fed' : 'Not fed'}</span>
        </div>
      </div>
      {log.vitamins && log.vitamins.length > 0 && (
        <div className="log-card-vitamins">
          {log.vitamins.map((v) => (
            <span key={v} className="vitamin-tag">{v}</span>
          ))}
        </div>
      )}
      {log.notes && <p className="log-card-notes">{log.notes}</p>}
    </div>
  );
}

/* ── Share Modal ── */
function ShareModal({ reptileId, onClose }) {
  const [email, setEmail] = useState('');
  const [shares, setShares] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingShares, setLoadingShares] = useState(true);

  useEffect(() => {
    loadShares();
  }, [reptileId]);

  async function loadShares() {
    try {
      const data = await fetchSharesForReptile(reptileId);
      setShares(data);
    } catch (err) {
      console.error('Failed to load shares:', err);
    } finally {
      setLoadingShares(false);
    }
  }

  async function handleShare(e) {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    setMessage('');

    try {
      const profile = await lookupProfileByEmail(email.trim());
      if (!profile) {
        setMessage('No account found with that email');
        setMessageType('error');
        setLoading(false);
        return;
      }

      await shareReptile(reptileId, profile.id);
      setEmail('');
      setMessage('Invite sent!');
      setMessageType('success');
      await loadShares();
    } catch (err) {
      setMessage(err.message || 'Failed to share');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveShare(shareId) {
    try {
      await removeShare(shareId);
      await loadShares();
    } catch (err) {
      console.error('Failed to remove share:', err);
    }
  }

  const statusLabel = (status) => {
    if (status === 'pending') return 'Pending';
    if (status === 'accepted') return 'Accepted';
    return status;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Share Reptile</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <form className="form" onSubmit={handleShare}>
            {message && (
              <div className={messageType === 'error' ? 'auth-error' : 'auth-success'}>
                {message}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Sending...' : 'Send Invite'}
            </button>
          </form>

          {/* Shared with list */}
          {!loadingShares && shares.length > 0 && (
            <div className="share-list">
              <h4 className="share-list-title">Shared with</h4>
              {shares.map((share) => (
                <div key={share.id} className="share-item">
                  <div className="share-item-info">
                    <span className="share-item-name">
                      {share.shared_with?.display_name || share.shared_with?.email || 'Unknown'}
                    </span>
                    <span className={`share-status share-status-${share.status}`}>
                      {statusLabel(share.status)}
                    </span>
                  </div>
                  <button className="icon-btn icon-btn-sm icon-btn-danger" onClick={() => handleRemoveShare(share.id)} aria-label="Remove">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Log Form Modal ── */
function LogFormModal({ reptileId, onClose, onSave }) {
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');
  const [weight, setWeight] = useState('');
  const [fed, setFed] = useState(false);
  const [selectedVitamins, setSelectedVitamins] = useState([]);
  const [notes, setNotes] = useState('');
  const [vitaminList, setVitaminList] = useState(getVitamins());
  const [showVitaminEditor, setShowVitaminEditor] = useState(false);
  const [newVitamin, setNewVitamin] = useState('');
  const [saving, setSaving] = useState(false);

  function toggleVitamin(v) {
    setSelectedVitamins((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  }

  function handleAddVitamin() {
    const name = newVitamin.trim();
    if (!name || vitaminList.includes(name)) return;
    const updated = [...vitaminList, name];
    setVitaminList(updated);
    saveVitamins(updated);
    setNewVitamin('');
  }

  function handleRemoveVitamin(v) {
    const updated = vitaminList.filter((x) => x !== v);
    setVitaminList(updated);
    saveVitamins(updated);
    setSelectedVitamins((prev) => prev.filter((x) => x !== v));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    try {
      await createLog(reptileId, {
        temperature: temperature ? Number(temperature) : null,
        humidity: humidity ? Number(humidity) : null,
        weight: weight ? Number(weight) : null,
        fed,
        vitamins: selectedVitamins,
        notes: notes.trim() || null,
      });
      onSave();
    } catch (err) {
      console.error('Failed to save log:', err);
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>New Log</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form className="form modal-body" onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Temp (°F)</label>
              <input className="form-input" type="number" step="0.1" placeholder="95" value={temperature} onChange={(e) => setTemperature(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Humidity (%)</label>
              <input className="form-input" type="number" step="1" placeholder="60" value={humidity} onChange={(e) => setHumidity(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Weight (g)</label>
              <input className="form-input" type="number" step="0.1" placeholder="350" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Fed</label>
              <button type="button" className={`toggle ${fed ? 'toggle-on' : ''}`} onClick={() => setFed(!fed)}>
                <span className="toggle-knob" />
                <span className="toggle-label">{fed ? 'Yes' : 'No'}</span>
              </button>
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label">Vitamins</label>
              <button type="button" className="text-btn" onClick={() => setShowVitaminEditor(!showVitaminEditor)}>
                {showVitaminEditor ? 'Done' : 'Edit List'}
              </button>
            </div>
            {showVitaminEditor ? (
              <div className="vitamin-editor">
                <div className="vitamin-editor-list">
                  {vitaminList.map((v) => (
                    <div key={v} className="vitamin-editor-item">
                      <span>{v}</span>
                      <button type="button" className="icon-btn icon-btn-sm icon-btn-danger" onClick={() => handleRemoveVitamin(v)} aria-label={`Remove ${v}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="vitamin-add-row">
                  <input
                    className="form-input"
                    type="text"
                    placeholder="New vitamin..."
                    value={newVitamin}
                    onChange={(e) => setNewVitamin(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddVitamin(); } }}
                  />
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleAddVitamin}>Add</button>
                </div>
              </div>
            ) : (
              <div className="vitamin-chips">
                {vitaminList.map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`vitamin-chip ${selectedVitamins.includes(v) ? 'vitamin-chip-selected' : ''}`}
                    onClick={() => toggleVitamin(v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input form-textarea" placeholder="Any observations..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Edit Reptile Modal ── */
function EditReptileModal({ reptile, onClose, onSave }) {
  const [name, setName] = useState(reptile.name);
  const [species, setSpecies] = useState(reptile.species || '');
  const [dob, setDob] = useState(reptile.dob || '');
  const [photo, setPhoto] = useState(reptile.photo);
  const [saving, setSaving] = useState(false);

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);

    try {
      await updateReptileById(reptile.id, {
        name: name.trim(),
        species: species.trim(),
        dob: dob || null,
        photo,
      });
      onSave();
    } catch (err) {
      console.error('Failed to update reptile:', err);
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Reptile</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form className="form modal-body" onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Photo</label>
            <div className="photo-upload photo-upload-sm">
              {photo ? (
                <img src={photo} alt="Preview" className="photo-upload-preview" />
              ) : (
                <div className="photo-upload-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <span>Tap to change</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handlePhoto} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Species / Morph</label>
            <input className="form-input" type="text" value={species} onChange={(e) => setSpecies(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Date of Birth</label>
            <input className="form-input" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Confirm Modal ── */
function ConfirmModal({ message, confirmLabel, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <p className="confirm-message">{message}</p>
        <div className="form-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
