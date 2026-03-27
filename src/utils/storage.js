const VITAMINS_KEY = 'vitamins';
const DEFAULT_VITAMINS = ['Calcium', 'D3', 'Multivitamin'];
const TEMP_UNIT_KEY = 'tempUnit';
const WEIGHT_UNIT_KEY = 'weightUnit';

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

/* ── Unit preferences ── */

export function getTempUnit() {
  return localStorage.getItem(TEMP_UNIT_KEY) || 'F';
}

export function setTempUnit(unit) {
  localStorage.setItem(TEMP_UNIT_KEY, unit);
}

export function getWeightUnit() {
  return localStorage.getItem(WEIGHT_UNIT_KEY) || 'g';
}

export function setWeightUnit(unit) {
  localStorage.setItem(WEIGHT_UNIT_KEY, unit);
}

// Stored values are always F and g. Convert for display only.
export function displayTemp(fahrenheit) {
  if (fahrenheit == null) return null;
  const unit = getTempUnit();
  if (unit === 'C') {
    const c = ((fahrenheit - 32) * 5) / 9;
    return `${Math.round(c * 10) / 10}°C`;
  }
  return `${fahrenheit}°F`;
}

export function displayWeight(grams) {
  if (grams == null) return null;
  const unit = getWeightUnit();
  if (unit === 'oz') {
    const oz = grams / 28.3495;
    return `${Math.round(oz * 100) / 100} oz`;
  }
  return `${grams}g`;
}

export function tempUnitLabel() {
  return getTempUnit() === 'C' ? '°C' : '°F';
}

export function weightUnitLabel() {
  return getWeightUnit() === 'oz' ? 'oz' : 'g';
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
    const d = new Date(log.created_at);
    return d > latest ? d : latest;
  }, new Date(0)).toISOString();
}
