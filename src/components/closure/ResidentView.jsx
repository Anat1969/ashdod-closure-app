import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Search, Utensils, X } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const ASHDOD_CENTER = [31.8014, 34.6436];

const ADDRESS_COORDS = {
  'לכיש': [31.8100, 34.6400],
  'הרצל': [31.8050, 34.6450],
  'ירושלים': [31.8020, 34.6480],
  'השחר': [31.7950, 34.6550],
  'רמב"ם': [31.8080, 34.6350],
  'ויצמן': [31.7960, 34.6460],
  'יד מרדכי': [31.8120, 34.6500],
};

function guessCoords(address) {
  if (!address) return ASHDOD_CENTER;
  for (const [key, coords] of Object.entries(ADDRESS_COORDS)) {
    if (address.includes(key)) return coords;
  }
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

export default function ResidentView() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [flyTo, setFlyTo] = useState(null);
  const [menuApp, setMenuApp] = useState(null);
  const markerRefs = useRef({});

  useEffect(() => {
    base44.entities.ClosureApplication.filter({ status: 'approved' }, '-created_date', 100)
      .then(data => { setApps(data); setLoading(false); });
  }, []);

  const filtered = apps.filter(a =>
    a.business?.toLowerCase().includes(search.toLowerCase()) ||
    a.address?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (app) => {
    setSelected(app.id);
    const coords = app.lat && app.lng ? [app.lat, app.lng] : guessCoords(app.address);
    setFlyTo(coords);
    setTimeout(() => { markerRefs.current[app.id]?.openPopup(); }, 1300);
  };

  return (
    <div dir="rtl" className="flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">מסלול תושב — סגירות מאושרות</h2>
        <p className="text-gray-500 text-sm">כל העסקים שקיבלו היתר סגירה מהעירייה</p>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 flex flex-col overflow-hidden bg-white rounded-xl border border-gray-200">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="חפש עסק או כתובת..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {loading ? (
              <div className="text-center py-12 text-gray-400 text-sm">טוען...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">לא נמצאו עסקים</div>
            ) : filtered.map(app => (
              <div
                key={app.id}
                onClick={() => handleSelect(app)}
                className={`rounded-xl border cursor-pointer transition-all hover:shadow-sm overflow-hidden ${
                  selected === app.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:border-blue-200'
                }`}
              >
                {app.closure_image && (
                  <img src={app.closure_image} alt="סגירה" className="w-full h-28 object-cover" />
                )}
                <div className="p-3">
                  <div className="font-bold text-gray-800 text-sm">{app.business}</div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{app.address}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {app.type === 'type1' ? 'סגירה עונתית' : 'מבנה קבוע'} · {app.area} מ״ר
                  </div>
                  {app.menu && Object.keys(app.menu).length > 0 && (
                    <button
                      onClick={e => { e.stopPropagation(); setMenuApp(app); }}
                      className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <Utensils className="w-3 h-3" /> צפה בתפריט
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {!loading && (
            <div className="p-2 border-t border-gray-100 text-center text-xs text-gray-400">
              {filtered.length} עסקים מאושרים
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 rounded-xl overflow-hidden border border-gray-200">
          <MapContainer center={ASHDOD_CENTER} zoom={13} className="w-full h-full" zoomControl={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {flyTo && <FlyTo coords={flyTo} key={flyTo.join(',')} />}
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
                    <div className="text-right min-w-[180px]" dir="rtl">
                      {app.closure_image && (
                        <img src={app.closure_image} alt="סגירה" className="w-full h-24 object-cover rounded mb-2" />
                      )}
                      <div className="font-bold text-gray-800 mb-0.5">{app.business}</div>
                      <div className="text-xs text-gray-500 mb-1">{app.address}</div>
                      <div className="text-xs text-gray-400 mb-2">
                        {app.type === 'type1' ? 'סגירה עונתית' : 'מבנה קבוע'} · {app.area} מ״ר
                      </div>
                      {app.menu && Object.keys(app.menu).length > 0 && (
                        <button
                          onClick={() => setMenuApp(app)}
                          className="w-full text-center text-xs bg-blue-700 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800 transition flex items-center justify-center gap-1"
                        >
                          <Utensils className="w-3 h-3" /> צפה בתפריט
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Menu Modal */}
      {menuApp && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setMenuApp(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{menuApp.business}</h3>
                <p className="text-sm text-gray-500">תפריט העסק</p>
              </div>
              <button onClick={() => setMenuApp(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {Object.entries(menuApp.menu).map(([item, price]) => (
                <div key={item} className="flex justify-between py-2.5 text-sm">
                  <span className="text-gray-700">{item}</span>
                  <span className="text-gray-500 font-medium">{price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}