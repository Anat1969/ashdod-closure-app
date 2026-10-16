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

// Chrome install prompt, captured once for the whole app.
let deferredPrompt = null;
const installListeners = new Set();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installListeners.forEach(l => l());
  });
  window.addEventListener('appinstalled', () => { deferredPrompt = null; installListeners.forEach(l => l()); });
}
export function useInstallPrompt() {
  const canInstall = useSyncExternalStore(cb => { installListeners.add(cb); return () => installListeners.delete(cb); }, () => !!deferredPrompt);
  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => {});
    deferredPrompt = null;
    installListeners.forEach(l => l());
  };
  return { canInstall, install };
}

export const DEV_CHAT_URL = 'https://claude.ai/code/session_01UfKVjwp9nrKouMWriPsTEn';
