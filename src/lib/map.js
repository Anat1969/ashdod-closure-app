// Shared Leaflet setup and location helpers.
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

export const ASHDOD_CENTER = [31.8014, 34.6436];

export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export const hasCoords = (app) => Number.isFinite(Number(app?.lat)) && Number.isFinite(Number(app?.lng)) && app.lat !== null && app.lng !== null && app.lat !== '' && app.lng !== '';

// Approximate position for applications without a marked location
// (deterministic, so the marker doesn't jump between renders).
export function approxCoords(address) {
  if (!address) return ASHDOD_CENTER;
  const hash = [...address].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) % 100000, 7);
  return [
    ASHDOD_CENTER[0] + ((hash % 40) - 20) * 0.0008,
    ASHDOD_CENTER[1] + ((Math.floor(hash / 40) % 30) - 15) * 0.0008,
  ];
}

export const coordsOf = (app) => (hasCoords(app) ? [Number(app.lat), Number(app.lng)] : approxCoords(app?.address));

// Free-text address search via OpenStreetMap Nominatim, limited to Ashdod.
export async function geocodeAddress(address) {
  const q = /אשדוד|ashdod/i.test(address) ? address : `${address}, אשדוד`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=il&accept-language=he&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('שירות החיפוש אינו זמין כרגע');
  const [hit] = await res.json();
  if (!hit) return null;
  return [Number(hit.lat), Number(hit.lon)];
}

const STATUS_PIN_COLORS = {
  approved: '#16a34a',
  pending_review: '#d97706',
  pending_owner: '#2563eb',
  rejected: '#dc2626',
};

const iconCache = new Map();

// Round colored pin per status; approximate (unmarked) locations are drawn faded and dashed.
export function statusIcon(status, approximate = false) {
  const key = `${status}|${approximate}`;
  if (!iconCache.has(key)) {
    const color = STATUS_PIN_COLORS[status] || '#6b7280';
    const style = approximate
      ? `background:${color};opacity:.45;border:2px dashed #fff`
      : `background:${color};border:3px solid #fff`;
    iconCache.set(key, L.divIcon({
      className: '',
      html: `<div style="${style};width:22px;height:22px;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      popupAnchor: [0, -12],
    }));
  }
  return iconCache.get(key);
}
