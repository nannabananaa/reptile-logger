import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { updateProfile, fetchReptiles, fetchLogs, deleteAccount } from '../utils/db';
import {
  getVitamins, saveVitamins,
  getTempUnit, setTempUnit,
  getWeightUnit, setWeightUnit,
  displayTemp, displayWeight,
} from '../utils/storage';
import { getCategoryLabel } from '../utils/categoryFields';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { profile, refreshProfile, signOut } = useAuth();

  return (
    <main className="page">
      <div className="settings-list">
        <DisplayNameSection profile={profile} refreshProfile={refreshProfile} />
        <ChangePasswordSection />
        <TempUnitSection />
        <WeightUnitSection />
        <ExportSection />
        <VitaminSection />
        <DeleteAccountSection navigate={navigate} />
        <LogoutSection signOut={signOut} navigate={navigate} />
      </div>
    </main>
  );
}

/* ── Display Name ── */
function DisplayNameSection({ profile, refreshProfile }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.display_name || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSave() {
    if (!name.trim() || saving) return;
    setSaving(true);
    setMessage('');
    try {
      await updateProfile({ display_name: name.trim() });
      await refreshProfile();
      setEditing(false);
      setMessage('Saved');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setMessage(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="settings-section">
        <h3 className="settings-section-title">Display Name</h3>
        <input
          className="form-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <div className="settings-row-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(false); setName(profile?.display_name || ''); }}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
        {message && <p className="settings-message">{message}</p>}
      </div>
    );
  }

  return (
    <button className="settings-item" onClick={() => setEditing(true)}>
      <div className="settings-item-content">
        <span className="settings-item-label">Display Name</span>
        <span className="settings-item-value">{profile?.display_name || '—'}</span>
      </div>
      <span className="settings-item-arrow">›</span>
    </button>
  );
}

/* ── Change Password ── */
function ChangePasswordSection() {
  const [editing, setEditing] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  async function handleSave() {
    setMessage('');
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters');
      setMessageType('error');
      return;
    }
    if (password !== confirm) {
      setMessage('Passwords do not match');
      setMessageType('error');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage('Password updated');
      setMessageType('success');
      setPassword('');
      setConfirm('');
      setTimeout(() => { setEditing(false); setMessage(''); }, 1500);
    } catch (err) {
      setMessage(err.message || 'Failed to update password');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="settings-section">
        <h3 className="settings-section-title">Change Password</h3>
        <input className="form-input" type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input className="form-input" type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={{ marginTop: 8 }} />
        <div className="settings-row-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(false); setPassword(''); setConfirm(''); setMessage(''); }}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Update'}
          </button>
        </div>
        {message && <p className={`settings-message ${messageType === 'error' ? 'settings-message-error' : ''}`}>{message}</p>}
      </div>
    );
  }

  return (
    <button className="settings-item" onClick={() => setEditing(true)}>
      <div className="settings-item-content">
        <span className="settings-item-label">Change Password</span>
      </div>
      <span className="settings-item-arrow">›</span>
    </button>
  );
}

/* ── Temperature Unit ── */
function TempUnitSection() {
  const [unit, setUnit] = useState(getTempUnit());

  function toggle() {
    const next = unit === 'F' ? 'C' : 'F';
    setTempUnit(next);
    setUnit(next);
  }

  return (
    <button className="settings-item" onClick={toggle}>
      <div className="settings-item-content">
        <span className="settings-item-label">Temperature Unit</span>
        <span className="settings-item-value">{unit === 'F' ? 'Fahrenheit (°F)' : 'Celsius (°C)'}</span>
      </div>
      <span className="settings-item-toggle">{unit === 'F' ? '°F' : '°C'}</span>
    </button>
  );
}

/* ── Weight Unit ── */
function WeightUnitSection() {
  const [unit, setUnit] = useState(getWeightUnit());

  function toggle() {
    const next = unit === 'g' ? 'oz' : 'g';
    setWeightUnit(next);
    setUnit(next);
  }

  return (
    <button className="settings-item" onClick={toggle}>
      <div className="settings-item-content">
        <span className="settings-item-label">Weight Unit</span>
        <span className="settings-item-value">{unit === 'g' ? 'Grams (g)' : 'Ounces (oz)'}</span>
      </div>
      <span className="settings-item-toggle">{unit}</span>
    </button>
  );
}

/* ── Export Logs ── */
function ExportSection() {
  const [expanded, setExpanded] = useState(false);
  const [reptiles, setReptiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(null);

  async function loadReptiles() {
    setLoading(true);
    try {
      const data = await fetchReptiles();
      setReptiles(data);
    } catch (err) {
      console.error('Failed to load reptiles:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleExpand() {
    if (!expanded) loadReptiles();
    setExpanded(!expanded);
  }

  async function handleExport(reptile) {
    setExporting(reptile.id);
    try {
      const logs = await fetchLogs(reptile.id);
      const rows = [['Date', 'Time', 'Logged By', 'Temperature', 'Humidity', 'Weight', 'Fed', 'Vitamins', 'Food Type', 'Shed Date', 'Notes']];
      for (const log of logs) {
        const d = new Date(log.created_at);
        const cf = log.category_fields || {};
        rows.push([
          d.toLocaleDateString(),
          d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          log.profile?.display_name || '',
          log.temperature ?? '',
          log.humidity ?? '',
          log.weight ?? '',
          log.fed ? 'Yes' : 'No',
          (log.vitamins || []).join('; '),
          cf.food_type || '',
          cf.shed_date || '',
          (log.notes || '').replace(/\n/g, ' '),
        ]);
      }
      const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reptile.name.replace(/[^a-zA-Z0-9]/g, '_')}_logs.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(null);
    }
  }

  return (
    <div>
      <button className="settings-item" onClick={handleExpand}>
        <div className="settings-item-content">
          <span className="settings-item-label">Export Reptile Logs</span>
          <span className="settings-item-value">Download as CSV</span>
        </div>
        <span className="settings-item-arrow">{expanded ? '‹' : '›'}</span>
      </button>
      {expanded && (
        <div className="settings-sub-list">
          {loading ? (
            <p className="settings-sub-empty">Loading...</p>
          ) : reptiles.length === 0 ? (
            <p className="settings-sub-empty">No reptiles to export</p>
          ) : (
            reptiles.map((r) => (
              <button key={r.id} className="settings-sub-item" onClick={() => handleExport(r)} disabled={exporting === r.id}>
                <span>{r.name}</span>
                <span className="settings-sub-action">{exporting === r.id ? 'Exporting...' : 'Download'}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ── Vitamin List ── */
function VitaminSection() {
  const [expanded, setExpanded] = useState(false);
  const [vitamins, setVitamins] = useState(getVitamins());
  const [newVitamin, setNewVitamin] = useState('');

  function handleAdd() {
    const name = newVitamin.trim();
    if (!name || vitamins.includes(name)) return;
    const updated = [...vitamins, name];
    setVitamins(updated);
    saveVitamins(updated);
    setNewVitamin('');
  }

  function handleRemove(v) {
    const updated = vitamins.filter((x) => x !== v);
    setVitamins(updated);
    saveVitamins(updated);
  }

  return (
    <div>
      <button className="settings-item" onClick={() => setExpanded(!expanded)}>
        <div className="settings-item-content">
          <span className="settings-item-label">Manage Vitamin List</span>
          <span className="settings-item-value">{vitamins.length} vitamin{vitamins.length !== 1 ? 's' : ''}</span>
        </div>
        <span className="settings-item-arrow">{expanded ? '‹' : '›'}</span>
      </button>
      {expanded && (
        <div className="settings-sub-list">
          {vitamins.map((v) => (
            <div key={v} className="settings-sub-item">
              <span>{v}</span>
              <button className="icon-btn icon-btn-sm icon-btn-danger" onClick={() => handleRemove(v)} aria-label={`Remove ${v}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          <div className="settings-add-row">
            <input
              className="form-input"
              type="text"
              placeholder="New vitamin..."
              value={newVitamin}
              onChange={(e) => setNewVitamin(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
            />
            <button className="btn btn-primary btn-sm" onClick={handleAdd}>Add</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Delete Account ── */
function DeleteAccountSection({ navigate }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteAccount();
      navigate('/login');
    } catch (err) {
      console.error('Failed to delete account:', err);
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="settings-section settings-section-danger">
        <p className="settings-danger-text">Are you sure? This will delete your account and all your data.</p>
        <div className="settings-row-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => setConfirming(false)} disabled={deleting}>Cancel</button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Everything'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button className="settings-item settings-item-danger" onClick={() => setConfirming(true)}>
      <div className="settings-item-content">
        <span className="settings-item-label">Delete Account</span>
      </div>
    </button>
  );
}

/* ── Logout ── */
function LogoutSection({ signOut, navigate }) {
  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  return (
    <button className="settings-item settings-item-logout" onClick={handleLogout}>
      <div className="settings-item-content">
        <span className="settings-item-label">Log Out</span>
      </div>
    </button>
  );
}
