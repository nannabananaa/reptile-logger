const REPTILES_KEY = 'reptiles';

function readReptiles() {
  try {
    const data = localStorage.getItem(REPTILES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function writeReptiles(reptiles) {
  localStorage.setItem(REPTILES_KEY, JSON.stringify(reptiles));
}

function generateId() {
  return crypto.randomUUID();
}

export async function fetchReptiles() {
  return readReptiles();
}

export async function fetchReptileById(id) {
  return readReptiles().find((r) => r.id === id) || null;
}

export async function fetchLogs(reptileId) {
  const reptile = readReptiles().find((r) => r.id === reptileId);
  return reptile ? (reptile.logs || []) : [];
}

export async function createReptile({ name, species, dob, photo }) {
  const reptiles = readReptiles();
  const newReptile = {
    id: generateId(),
    name,
    species: species || '',
    dob: dob || null,
    photo: photo || null,
    logs: [],
    created_at: new Date().toISOString(),
  };
  reptiles.push(newReptile);
  writeReptiles(reptiles);
  console.log('Reptile saved. Total reptiles:', reptiles.length);
  return newReptile;
}

export async function updateReptileById(id, updates) {
  const reptiles = readReptiles();
  const idx = reptiles.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error('Reptile not found');
  reptiles[idx] = { ...reptiles[idx], ...updates };
  writeReptiles(reptiles);
  return reptiles[idx];
}

export async function deleteReptileById(id) {
  const reptiles = readReptiles().filter((r) => r.id !== id);
  writeReptiles(reptiles);
}

export async function createLog(reptileId, log) {
  const reptiles = readReptiles();
  const reptile = reptiles.find((r) => r.id === reptileId);
  if (!reptile) throw new Error('Reptile not found');
  const newLog = { id: generateId(), created_at: new Date().toISOString(), ...log };
  reptile.logs.push(newLog);
  writeReptiles(reptiles);
  return newLog;
}

export async function deleteLogById(logId) {
  const reptiles = readReptiles();
  for (const reptile of reptiles) {
    const before = reptile.logs.length;
    reptile.logs = (reptile.logs || []).filter((l) => l.id !== logId);
    if (reptile.logs.length < before) {
      writeReptiles(reptiles);
      return;
    }
  }
}
