export const STORAGE_KEY = "studygram_v2_state";

export const defaultState = {
  sharedDecks: {},
  myCards: [],
  progress: {},
  settings: {
    dark: true,
    enabledSharedDecks: {},
    myEnabled: true,
    mode: "smart",
    strictness: 0.70,
    dailyGoal: 30
  },
  stats: {
    totalReviews: 0,
    xp: 0,
    streak: 0,
    bestStreak: 0,
    lastStudyDate: "",
    history: {}
  },
  sync: {
    lastSyncedAt: "",
    lastMessage: "未同期"
  }
};

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    return migrate(JSON.parse(raw));
  } catch {
    return structuredClone(defaultState);
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function migrate(data) {
  return {
    ...structuredClone(defaultState),
    ...data,
    settings: { ...defaultState.settings, ...(data.settings || {}) },
    stats: { ...defaultState.stats, ...(data.stats || {}) },
    sync: { ...defaultState.sync, ...(data.sync || {}) },
    sharedDecks: data.sharedDecks || {},
    myCards: Array.isArray(data.myCards) ? data.myCards : [],
    progress: data.progress || {}
  };
}

export function exportState(state) {
  return {
    version: "2.0.0",
    exportedAt: new Date().toISOString(),
    myCards: state.myCards,
    progress: state.progress,
    settings: state.settings,
    stats: state.stats
  };
}

export function importState(currentState, backup) {
  if (!backup || !Array.isArray(backup.myCards) || !backup.progress) {
    throw new Error("Invalid backup");
  }

  return {
    ...currentState,
    myCards: backup.myCards,
    progress: backup.progress,
    settings: { ...currentState.settings, ...(backup.settings || {}) },
    stats: { ...currentState.stats, ...(backup.stats || {}) }
  };
}
