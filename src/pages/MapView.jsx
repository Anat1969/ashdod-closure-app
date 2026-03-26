import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Building2, Phone, CheckCircle } from 'lucide-react';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const ASHDOD_CENTER = [31.8014, 34.6436];

// Known Ashdod neighborhood coordinates for geocoding by address keywords
const ADDRESS_COORDS = {
  'לכיש': [31.8100, 34.6400],
  'שד': [31.7980, 34.6500],
  'הרצל': [31.8050, 34.6450],
  'ירושלים': [31.8020, 34.6480],
  'השחר': [31.7950, 34.6550],
  'רמב"ם': [31.8080, 34.6350],
  'אברמוביץ': [31.8150, 34.6420],
  'ויצמן': [31.7960, 34.6460],
  'רוגוזין': [31.8200, 34.6380],
  'יד מרדכי': [31.8120, 34.6500],
};

function guessCoords(address) {
  if (!address) return ASHDOD_CENTER;
  for (const [key, coords] of Object.entries(ADDRESS_COORDS)) {
    if (address.includes(key)) return coords;
  }
  // Deterministic offset based on address string so each business gets unique spot
  const hash = [...address].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return [
    ASHDOD_CENTER[0] + ((hash % 40) - 20) * 0.001,
    ASHDOD_CENTER[1] + ((hash % 30) - 15) * 0.001,
  ];
}

function FlyTo({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 16, { duration: 1.2 });
  }, [coords]);
  return null;
}

const STATUS_COLOR = {
  approved: 'bg-green-100 text-green-700 border-green-200',
  pending_review: 'bg-amber-100 text-amber-700 border-amber-200',
  pending_owner: 'bg-blue-100 text-blue-700 border-blue-200',
  rejected: 'bg-red-100 text-red-600 border-red-200',
};

const STATUS_LABEL = {
  approved: 'מאושר',
  pending_review: 'בבדיקה',
  pending_owner: 'ממתין',
  rejected: 'נדחה',
};

export default function MapView() {
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [flyTo, setFlyTo] = useState(null);
  const [editingApp, setEditingApp] = useState(null);
  const [tempCoords, setTempCoords] = useState(null);
  const markerRefs = useRef({});

  useEffect(() => {
    base44.entities.ClosureApplication.list('-created_date', 200)
      .then(data => { setApps(data); setLoading(false); });
  }, []);

  const filtered = apps;

  const handleSelect = (app) => {
    setSelected(app.id);
    const coords = app.lat && app.lng ? [app.lat, app.lng] : guessCoords(app.address);
    setFlyTo(coords);
    setTimeout(() => {
      markerRefs.current[app.id]?.openPopup();
    }, 1300);
  };

  const handleMapClick = async (e) => {
    if (!editingApp) return;
    const { lat, lng } = e.latlng;
    setTempCoords([lat, lng]);
  };

  const handleSaveLocation = async () => {
    if (!editingApp || !tempCoords) return;
    try {
      await base44.entities.ClosureApplication.update(editingApp.id, {
        lat: tempCoords[0],
        lng: tempCoords[1],
      });
      setApps(prev => prev.map(a => a.id === editingApp.id ? { ...a, lat: tempCoords[0], lng: tempCoords[1] } : a));
      setEditingApp(null);
      setTempCoords(null);
      alert('המיקום נשמר בהצלחה!');
    } catch (err) {
      alert('שגיאה בשמירת המיקום: ' + err.message);
    }
  };

  const handleCancelLocation = () => {
    setEditingApp(null);
    setTempCoords(null);
  };

  return (
    <div dir="rtl" className="flex h-screen flex-col">
      {/* Header */}
      <header className="bg-blue-900 text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <MapPin className="w-5 h-5" />
        <h1 className="font-bold text-lg">מפת סגירות — עיריית אשדוד</h1>
        {editingApp && (
          <div className="mr-auto flex gap-2 items-center bg-white/10 rounded-lg px-3 py-1">
            <span className="text-sm">מצב עריכת מיקום: {editingApp.business}</span>
            <button onClick={handleSaveLocation} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-medium">שמור</button>
            <button onClick={handleCancelLocation} className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm">ביטול</button>
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
          {loading ? (
            <div className="text-center py-12 text-gray-400">טוען...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">אין עסקים להצגה</div>
          ) : (
            <div className="p-2 space-y-1">
              <p className="text-xs text-gray-400 px-2 py-1">{filtered.length} עסקים</p>
              {filtered.map(app => (
                <button
                  key={app.id}
                  onClick={() => handleSelect(app)}
                  className={`w-full text-right p-3 rounded-xl border transition-all hover:shadow-sm ${
                    selected === app.id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-100 hover:border-blue-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-gray-800 text-sm leading-tight">{app.business}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border flex-shrink-0 ${STATUS_COLOR[app.status]}`}>
                      {STATUS_LABEL[app.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{app.address}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {app.type === 'type1' ? 'סגירה עונתית' : 'מבנה קבוע'} · {app.area} מ״ר
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className={`flex-1 relative ${editingApp ? 'cursor-crosshair' : ''}`}>
          {editingApp && (
            <div className="absolute top-4 right-4 z-[1000] bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
              📍 לחץ על המפה לבחירת מיקום
            </div>
          )}
          <MapContainer
            center={ASHDOD_CENTER}
            zoom={13}
            className="w-full h-full"
            zoomControl={false}
            onClick={handleMapClick}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {flyTo && <FlyTo coords={flyTo} key={flyTo.join(',')} />}
            {editingApp && tempCoords && (
              <Marker position={tempCoords}>
                <Popup>
                  <div className="text-right" dir="rtl">
                    <div className="font-bold mb-1">מיקום נבחר</div>
                    <div className="text-xs text-gray-500 mb-2">
                      {tempCoords[0].toFixed(5)}, {tempCoords[1].toFixed(5)}
                    </div>
                    <button
                      onClick={handleSaveLocation}
                      className="w-full bg-green-500 text-white px-3 py-1.5 rounded text-xs hover:bg-green-600"
                    >
                      ✓ שמור מיקום
                    </button>
                  </div>
                </Popup>
              </Marker>
            )}
            {filtered.map(app => {
              const coords = app.lat && app.lng ? [app.lat, app.lng] : guessCoords(app.address);
              return (
                <Marker
                  key={app.id}
                  position={coords}
                  ref={el => { if (el) markerRefs.current[app.id] = el; }}
                  eventHandlers={{ click: () => setSelected(app.id) }}
                >
                  <Popup>
                    <div className="text-right min-w-[160px]" dir="rtl">
                      <div className="font-bold text-gray-800 mb-1">{app.business}</div>
                      <div className="text-xs text-gray-500 mb-1">{app.address}</div>
                      <div className="flex items-center gap-1 text-xs">
                        <span className={`px-2 py-0.5 rounded-full ${STATUS_COLOR[app.status]}`}>
                          {STATUS_LABEL[app.status]}
                        </span>
                      </div>
                      {app.phone && (
                        <div className="text-xs text-gray-500 mt-1">📞 {app.phone}</div>
                      )}
                      {!app.lat && !app.lng && (
                        <button
                          onClick={() => { setEditingApp(app); setFlyTo([ASHDOD_CENTER[0], ASHDOD_CENTER[1]]); setSelected(null); }}
                          className="mt-2 w-full text-center text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition"
                        >
                          📍 סמן מיקום
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/architect/${app.id}`)}
                        className="mt-2 w-full text-center text-xs bg-blue-700 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800 transition"
                      >
                        צפה בבקשה
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}