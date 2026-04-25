/**
 * localStorage utilities for multi-countdown persistence
 */

const STORAGE_KEY = 'ultimate_countdown_saves';

export function getSavedCountdowns() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCountdown(config) {
  try {
    const saves = getSavedCountdowns();
    const existing = saves.findIndex(s => s.id === config.id);

    if (existing >= 0) {
      saves[existing] = { ...config, updatedAt: Date.now() };
    } else {
      saves.unshift({
        ...config,
        id: config.id || `cd_${Date.now()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Keep max 10 countdowns
    const trimmed = saves.slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    return trimmed;
  } catch {
    return [];
  }
}

export function deleteCountdown(id) {
  try {
    const saves = getSavedCountdowns().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
    return saves;
  } catch {
    return [];
  }
}

export function formatDateForDisplay(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}
