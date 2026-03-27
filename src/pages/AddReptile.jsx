import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createReptile } from '../utils/db';
import { CATEGORIES } from '../utils/categoryFields';

function compressPhoto(dataUrl, maxWidth = 600) {
  return new Promise((resolve) => {
    if (!dataUrl) { resolve(null); return; }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export default function AddReptile() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('other');
  const [species, setSpecies] = useState('');
  const [dob, setDob] = useState('');
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim() || saving) return;

    setSaving(true);
    setError('');

    try {
      const compressed = await compressPhoto(photo);
      await createReptile({
        name: name.trim(),
        species: species.trim(),
        dob: dob || null,
        photo: compressed,
        category,
      });
      navigate('/');
    } catch (err) {
      console.error('Failed to save reptile:', err);
      setError(`Failed to save: ${err.message}`);
      setSaving(false);
    }
  }

  return (
    <main className="page">
      <form className="form" onSubmit={handleSave}>
        {error && <div className="auth-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">Photo</label>
          <div className="photo-upload">
            {photo ? (
              <img src={photo} alt="Preview" className="photo-upload-preview" />
            ) : (
              <div className="photo-upload-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <span>Tap to add photo</span>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handlePhoto} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Name</label>
          <input
            className="form-input"
            type="text"
            placeholder="e.g. Noodle"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Species / Morph</label>
          <input
            className="form-input"
            type="text"
            placeholder="e.g. Ball Python, Banana Pastel"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Date of Birth</label>
          <input
            className="form-input"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </main>
  );
}
