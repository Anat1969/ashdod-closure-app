// Local storage layer (IndexedDB) that replaces the Base44 backend.
// All data lives in the viewer's browser; use exportBackup/importBackup to move it.

const DB_NAME = 'ashdod-closure';
const DB_VERSION = 1;

let dbPromise = null;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('records')) {
          db.createObjectStore('records', { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function tx(mode, fn) {
  return openDb().then(db => new Promise((resolve, reject) => {
    const t = db.transaction('records', mode);
    const store = t.objectStore('records');
    let result;
    Promise.resolve(fn(store)).then(r => { result = r; });
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function getAllRecords() {
  return tx('readonly', store => reqToPromise(store.getAll()));
}

export function putRecords(records) {
  return tx('readwrite', store => { records.forEach(r => store.put(r)); });
}

export function deleteRecord(id) {
  return tx('readwrite', store => { store.delete(id); });
}

export function clearRecords() {
  return tx('readwrite', store => { store.clear(); });
}

export function newId() {
  if (crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '').slice(0, 24);
  return Date.now().toString(16) + Math.random().toString(16).slice(2, 10);
}

export async function exportBackup() {
  const records = await getAllRecords();
  return { app: 'ashdod-closure', version: 1, exported_at: new Date().toISOString(), records };
}

// mode: 'merge' keeps existing records and overwrites ones with the same id; 'replace' wipes first.
export async function importBackup(data, mode = 'merge') {
  const records = Array.isArray(data) ? data : data?.records;
  if (!Array.isArray(records)) throw new Error('קובץ הגיבוי אינו תקין');
  const valid = records.filter(r => r && typeof r === 'object').map(r => ({
    ...r,
    _entity: r._entity || 'ClosureApplication',
    id: r.id || newId(),
  }));
  if (mode === 'replace') await clearRecords();
  await putRecords(valid);
  return valid.length;
}
