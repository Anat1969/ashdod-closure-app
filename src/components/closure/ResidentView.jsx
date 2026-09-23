import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin, Search, Utensils, X } from 'lucide-react';
import { typeLabel, menuItemsOf } from './constants';
import { isImageUrl } from '@/lib/files';
import { ASHDOD_CENTER, TILE_URL, TILE_ATTRIBUTION, coordsOf, hasCoords, statusIcon } from '@/lib/map';

function FlyTo({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 17, { duration: 1 });
  }, [coords, map]);
  return null;
}

// First image among the application's photos, for the resident-facing card.
function coverImage(app) {
  return [app.closure_image, app.closure_simulation, app.business_photo, ...(app.additional_photos || [])]
    .find(isImageUrl) || null;
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
    base44.entities.ClosureApplication.filter({ status: 'approved' }, 'business')
      .then(data => setApps(data))
      .finally(() => setLoading(false));
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = apps.filter(a =>
    !q || a.business?.toLowerCase().includes(q) || a.address?.toLowerCase().includes(q) || a.business_type?.toLowerCase().includes(q)
  );

  const handleSelect = (app) => {
    setSelected(app.id);
    setFlyTo(coordsOf(app));
    setTimeout(() => markerRefs.current[app.id]?.openPopup(), 1100);
  };

  const menuItems = menuApp ? menuItemsOf(menuApp) : [];

  return (
    <div dir="rtl" className="flex flex-col md:h-[calc(100vh-150px)] md:min-h-[520px]">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">מסלול תושב — סגירות מאושרות</h2>
        <p className="text-gray-500 text-sm">כל העסקים שקיבלו היתר סגירה מהעירייה</p>
      </div>

      <div className="flex flex-col-reverse md:flex-row flex-1 gap-4 md:overflow-hidden">
        {/* Sidebar */}
        <div className="md:w-72 flex-shrink-0 flex flex-col overflow-hidden bg-white rounded-xl border border-gray-200 max-h-96 md:max-h-none">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="חפש עסק, סוג או כתובת..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {loading ? (
              <div className="text-center py-12 text-gray-400 text-sm">טוען...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">{apps.length === 0 ? 'עדיין אין עסקים מאושרים' : 'לא נמצאו עסקים'}</div>
            ) : filtered.map(app => {
              const cover = coverImage(app);
              const hasMenu = menuItemsOf(app).length > 0;
              return (
                <div
                  key={app.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelect(app)}
                  onKeyDown={e => e.key === 'Enter' && handleSelect(app)}
                  className={`rounded-xl border cursor-pointer transition-all hover:shadow-sm overflow-hidden ${
                    selected === app.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:border-blue-200'
                  }`}
                >
                  {cover && <img src={cover} alt={app.business} className="w-full h-28 object-cover" />}
                  <div className="p-3">
                    <div className="font-bold text-gray-800 text-sm">{app.business}</div>
                    {app.business_type && <div className="text-xs text-gray-500">{app.business_type}</div>}
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{app.address}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {typeLabel(app.type)}{app.area ? ` · ${app.area} מ״ר` : ''}
                    </div>
                    {hasMenu && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setMenuApp(app); }}
                        className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <Utensils className="w-3 h-3" /> צפה בתפריט
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {!loading && (
            <div className="p-2 border-t border-gray-100 text-center text-xs text-gray-400">
              {filtered.length} עסקים מאושרים
            </div>
          )}
        </div>

        {/* Map */}
        <div className="md:flex-1 rounded-xl overflow-hidden border border-gray-200 relative z-0 h-[55vh] md:h-auto">
          <MapContainer center={ASHDOD_CENTER} zoom={13} className="w-full h-full">
            <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
            {flyTo && <FlyTo coords={flyTo} key={flyTo.join(',')} />}
            {filtered.map(app => {
              const cover = coverImage(app);
              return (
                <Marker
                  key={app.id}
                  position={coordsOf(app)}
                  icon={statusIcon('approved', !hasCoords(app))}
                  ref={el => { if (el) markerRefs.current[app.id] = el; }}
                  eventHandlers={{ click: () => setSelected(app.id) }}
                >
                  <Popup>
                    <div className="text-right min-w-[180px]" dir="rtl">
                      {cover && <img src={cover} alt={app.business} className="w-full h-24 object-cover rounded mb-2" />}
                      <div className="font-bold text-gray-800 mb-0.5">{app.business}</div>
                      <div className="text-xs text-gray-500 mb-1">{app.address}</div>
                      <div className="text-xs text-gray-400 mb-2">
                        {typeLabel(app.type)}{app.area ? ` · ${app.area} מ״ר` : ''}
                      </div>
                      {menuItemsOf(app).length > 0 && (
                        <button
                          type="button"
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[2000]" onClick={() => setMenuApp(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{menuApp.business}</h3>
                <p className="text-sm text-gray-500">תפריט העסק</p>
              </div>
              <button type="button" onClick={() => setMenuApp(null)} className="p-1.5 rounded-lg hover:bg-gray-100" aria-label="סגור">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="divide-y divide-gray-100 overflow-y-auto">
              {menuItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 text-sm">
                  {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />}
                  <span className="text-gray-700 flex-1">{item.name}</span>
                  {item.price && <span className="text-gray-500 font-medium">{/₪/.test(item.price) ? item.price : `₪${item.price}`}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
