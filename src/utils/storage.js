const REPTILES_KEY = 'reptiles';
const VITAMINS_KEY = 'vitamins';
const DEFAULT_VITAMINS = ['Calcium', 'D3', 'Multivitamin'];

export function getReptiles() {
  try {
    const data = localStorage.getItem(REPTILES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveReptiles(reptiles) {
  localStorage.setItem(REPTILES_KEY, JSON.stringify(reptiles));
}

export function addReptile(reptile) {
  const reptiles = getReptiles();
  reptiles.push(reptile);
  saveReptiles(reptiles);
  return reptiles;
}

export function getReptileById(id) {
  return getReptiles().find((r) => r.id === id) || null;
}

export function updateReptile(id, updates) {
  const reptiles = getReptiles();
  const idx = reptiles.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  reptiles[idx] = { ...reptiles[idx], ...updates };
  saveReptiles(reptiles);
  return reptiles[idx];
}

export function deleteReptile(id) {
  const reptiles = getReptiles().filter((r) => r.id !== id);
  saveReptiles(reptiles);
  return reptiles;
}

export function addLog(reptileId, log) {
  const reptiles = getReptiles();
  const reptile = reptiles.find((r) => r.id === reptileId);
  if (!reptile) return null;
  reptile.logs.push(log);
  saveReptiles(reptiles);
  return reptile;
}

export function deleteLog(reptileId, logId) {
  const reptiles = getReptiles();
  const reptile = reptiles.find((r) => r.id === reptileId);
  if (!reptile) return null;
  reptile.logs = reptile.logs.filter((l) => l.id !== logId);
  saveReptiles(reptiles);
  return reptile;
}

export function getVitamins() {
  try {
    const data = localStorage.getItem(VITAMINS_KEY);
    return data ? JSON.parse(data) : DEFAULT_VITAMINS;
  } catch {
    return DEFAULT_VITAMINS;
  }
}

export function saveVitamins(vitamins) {
  localStorage.setItem(VITAMINS_KEY, JSON.stringify(vitamins));
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function calculateAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (now.getDate() < birth.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }
  if (years > 0) return `${years}y ${months}m`;
  if (months > 0) return `${months}m`;
  const days = Math.floor((now - birth) / (1000 * 60 * 60 * 24));
  return `${days}d`;
}

export function timeAgo(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getLastLogDate(reptile) {
  const logs = reptile.logs || [];
  if (logs.length === 0) return null;
  return logs.reduce((latest, log) => {
    const d = new Date(log.timestamp);
    return d > latest ? d : latest;
  }, new Date(0)).toISOString();
}
