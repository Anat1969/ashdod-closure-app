// Tiny persisted settings store (per browser), shared across pages.
import { useSyncExternalStore } from 'react';

const KEY = 'ashdod-closure:settings-v3';
const DEFAULTS = { baseMap: 'streets', showOsm: false, showApps: true, showStreets: true };
const listeners = new Set();

function read() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...DEFAULTS }; }
}
let state = read();

export function setSettings(patch) {
  state = { ...state, ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
  listeners.forEach(l => l());
}

export function useSettings() {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb); }, () => state);
}

export const DEV_CHAT_URL = 'https://claude.ai/code/session_01UfKVjwp9nrKouMWriPsTEn';
