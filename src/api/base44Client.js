// Standalone replacement for the Base44 SDK client.
// Keeps the same API surface the app uses (entities / auth / integrations),
// backed by the browser's IndexedDB instead of Base44 servers.
import { getAllRecords, putRecords, deleteRecord, newId } from './localDb';

export const LOCAL_USER = {
  id: 'local-user',
  email: 'local@device',
  full_name: 'משתמש',
  role: 'admin',
};

function sortRecords(records, sort) {
  if (!sort) return records;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return [...records].sort((a, b) => {
    const av = a[field] ?? '';
    const bv = b[field] ?? '';
    if (av < bv) return desc ? 1 : -1;
    if (av > bv) return desc ? -1 : 1;
    return 0;
  });
}

function matches(record, query) {
  return Object.entries(query || {}).every(([k, v]) => record[k] === v);
}

function createEntity(name) {
  const all = async () => (await getAllRecords()).filter(r => r._entity === name);

  const stamp = (data) => {
    const now = new Date().toISOString();
    return {
      ...data,
      _entity: name,
      id: newId(),
      created_date: now,
      updated_date: now,
      created_by: LOCAL_USER.email,
    };
  };

  return {
    async list(sort, limit) {
      const records = sortRecords(await all(), sort);
      return limit ? records.slice(0, limit) : records;
    },
    async filter(query, sort, limit) {
      const records = sortRecords((await all()).filter(r => matches(r, query)), sort);
      return limit ? records.slice(0, limit) : records;
    },
    async get(id) {
      return (await all()).find(r => r.id === id) || null;
    },
    async create(data) {
      const record = stamp(data);
      await putRecords([record]);
      return record;
    },
    async bulkCreate(items) {
      const records = items.map(stamp);
      await putRecords(records);
      return records;
    },
    async update(id, data) {
      const existing = (await all()).find(r => r.id === id);
      if (!existing) throw new Error('הרשומה לא נמצאה');
      const record = { ...existing, ...data, id, _entity: name, updated_date: new Date().toISOString() };
      await putRecords([record]);
      return record;
    },
    async delete(id) {
      await deleteRecord(id);
    },
  };
}

function readAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Shrinks large photos so the browser storage doesn't fill up.
async function compressImage(file, maxSize = 2400, quality = 0.85) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    if (scale === 1 && file.size < 500 * 1024) return readAsDataUrl(file);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    // White background so transparent PNG plans don't turn black as JPEG
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function uploadFile({ file }) {
  const isRaster = /^image\/(jpeg|png|webp|bmp)$/.test(file.type);
  const file_url = isRaster ? await compressImage(file) : await readAsDataUrl(file);
  return { file_url };
}

// Header aliases for spreadsheet import (Hebrew and English).
const COLUMN_ALIASES = {
  business: ['שם העסק', 'שם עסק', 'עסק', 'business', 'name'],
  address: ['כתובת', 'הכתובת', 'address'],
  business_type: ['סוג העסק', 'סוג עסק', 'business_type', 'type of business'],
  closure_type: ['סוג הסגירה', 'סוג סגירה', 'closure_type', 'type'],
};

function pickColumn(row, aliases) {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const key = keys.find(k => k.trim().toLowerCase() === alias.toLowerCase());
    if (key && row[key] !== '') return String(row[key]).trim();
  }
  return '';
}

function normalizeClosureType(value) {
  if (!value) return 'type1';
  if (value === 'type1' || value === 'type2') return value;
  // type2 = seasonal closure (סגירה עונתית), type1 = winter closure / screen (פרגוד)
  if (/עונתי|קבוע|type2|^\s*2\s*$/.test(value)) return 'type2';
  return 'type1';
}

// Replaces the Base44 AI extraction: parses Excel/CSV files locally.
async function extractDataFromUploadedFile({ file_url }) {
  const mime = file_url.slice(5, file_url.indexOf(';'));
  const isSheet = /sheet|excel|csv|text\/plain|octet-stream/.test(mime);
  if (!isSheet) {
    return {
      status: 'error',
      details: 'בגרסה העצמאית ניתן לייבא רק קובצי Excel או CSV עם העמודות: שם העסק, כתובת, סוג העסק, סוג הסגירה',
    };
  }
  const XLSX = await import('xlsx');
  const buffer = await (await fetch(file_url)).arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', codepage: 65001 });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const businesses = rows
    .map(row => ({
      business: pickColumn(row, COLUMN_ALIASES.business),
      address: pickColumn(row, COLUMN_ALIASES.address),
      business_type: pickColumn(row, COLUMN_ALIASES.business_type),
      closure_type: normalizeClosureType(pickColumn(row, COLUMN_ALIASES.closure_type)),
    }))
    .filter(b => b.business || b.address);
  if (businesses.length === 0) {
    return { status: 'error', details: 'לא נמצאו שורות עם העמודות "שם העסק" ו"כתובת"' };
  }
  return { status: 'success', output: { businesses } };
}

// Replaces server-side email: opens the user's mail program with the message filled in.
async function sendEmail({ to, subject, body }) {
  const maxBody = 1800;
  const text = body.length > maxBody
    ? body.slice(0, maxBody) + '\n...\n(ההודעה קוצרה — הדוח המלא הועתק ללוח, אפשר להדביק אותו כאן)'
    : body;
  const href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  window.location.href = href;
  return { ok: true };
}

export const base44 = {
  entities: {
    ClosureApplication: createEntity('ClosureApplication'),
  },
  auth: {
    async me() { return LOCAL_USER; },
    logout() {},
    redirectToLogin() {},
  },
  integrations: {
    Core: {
      UploadFile: uploadFile,
      ExtractDataFromUploadedFile: extractDataFromUploadedFile,
      SendEmail: sendEmail,
    },
  },
};
