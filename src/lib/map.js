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

// Free base maps that need no API key.
export const BASE_MAPS = {
  grey: {
    label: 'מפה אפורה',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: `${TILE_ATTRIBUTION} &copy; <a href="https://carto.com/attributions">CARTO</a>`,
  },
  streets: { label: 'מפת רחובות', url: TILE_URL, attribution: TILE_ATTRIBUTION },
  aerial: {
    label: 'תצלום אוויר',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics',
  },
};
export const baseMapOf = (key) => BASE_MAPS[key] || BASE_MAPS.grey;

export const AMENITY_LABELS = {
  restaurant: 'מסעדה', cafe: 'בית קפה', fast_food: 'מזנון', bar: 'בר', pub: 'פאב', ice_cream: 'גלידריה',
};

// Food venues in Ashdod from OpenStreetMap: a bundled snapshot, refreshable live from Overpass.
const OVERPASS_QUERY = '[out:json][timeout:60];nwr(31.74,34.60,31.86,34.708)[amenity~"^(restaurant|cafe|fast_food|bar|pub|ice_cream)$"];out center;';
const OSM_CACHE_KEY = 'ashdod-closure:osm-venues';

export async function loadOsmVenues() {
  try {
    const cached = JSON.parse(localStorage.getItem(OSM_CACHE_KEY) || 'null');
    if (cached?.venues?.length) return cached;
  } catch { /* ignore */ }
  const res = await fetch(`${import.meta.env.BASE_URL}data/osm-venues.json`);
  if (!res.ok) throw new Error('שכבת OSM לא נטענה');
  return res.json();
}

export async function refreshOsmVenues() {
  const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(OVERPASS_QUERY)}`);
  if (!res.ok) throw new Error('שרת OSM עמוס כרגע, נסו שוב בעוד דקה');
  const json = await res.json();
  const venues = json.elements.map(e => ({
    id: `${e.type[0]}${e.id}`,
    lat: e.lat ?? e.center?.lat,
    lng: e.lon ?? e.center?.lon,
    name: e.tags?.['name:he'] || e.tags?.name || null,
    amenity: e.tags?.amenity,
    outdoor: e.tags?.outdoor_seating === 'yes',
    address: [e.tags?.['addr:street'], e.tags?.['addr:housenumber']].filter(Boolean).join(' ') || null,
  })).filter(v => Number.isFinite(v.lat) && Number.isFinite(v.lng));
  const data = { source: 'OpenStreetMap (Overpass API), ODbL', fetched: new Date().toISOString().slice(0, 10), venues };
  try { localStorage.setItem(OSM_CACHE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
  return data;
}

export const osmIcon = (outdoor) => L.divIcon({
  className: '',
  html: `<div class="osm-dot" style="background:${outdoor ? '#0f766e' : '#7d8796'}"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  popupAnchor: [0, -8],
});

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
export function statusIcon(status, approximate = false, type = 'type1') {
  const key = `${status}|${approximate}|${type}`;
  if (!iconCache.has(key)) {
    const color = STATUS_PIN_COLORS[status] || '#6b7280';
    const style = approximate
      ? `background:${color};opacity:.45;border:2px dashed #fff`
      : `background:${color};border:3px solid #fff`;
    iconCache.set(key, L.divIcon({
      className: '',
      html: `<div style="${style};width:22px;height:22px;border-radius:${type === 'type2' ? '5px' : '50%'};box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      popupAnchor: [0, -12],
    }));
  }
  return iconCache.get(key);
}
