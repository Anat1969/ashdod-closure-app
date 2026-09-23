import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { MapPin, Search, Loader2 } from 'lucide-react';
import StatusBadge from '../components/closure/StatusBadge';
import { STATUS_LABELS, typeLabel } from '../components/closure/constants';
import { ASHDOD_CENTER, TILE_URL, TILE_ATTRIBUTION, coordsOf, hasCoords, statusIcon, geocodeAddress } from '@/lib/map';

function FlyTo({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 17, { duration: 1 });
  }, [coords, map]);
  return null;
}

function ClickToPick({ active, onPick }) {
  useMapEvents({ click: (e) => { if (active) onPick([e.latlng.lat, e.latlng.lng]); } });
  return null;
}

const FILTERS = [{ val: 'all', label: 'הכל' }, ...Object.entries(STATUS_LABELS).map(([val, label]) => ({ val, label }))];

export default function MapView() {
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [flyTo, setFlyTo] = useState(null);
  const [editingApp, setEditingApp] = useState(null);
  const [tempCoords, setTempCoords] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const markerRefs = useRef({});

  useEffect(() => {
    base44.entities.ClosureApplication.list('-created_date')
      .then(data => setApps(data))
      .finally(() => setLoading(false));
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = apps.filter(a =>
    (statusFilter === 'all' || a.status === statusFilter) &&
    (!q || a.business?.toLowerCase().includes(q) || a.address?.toLowerCase().includes(q))
  );
  const unmarkedCount = filtered.filter(a => !hasCoords(a)).length;

  const handleSelect = (app) => {
    setSelected(app.id);
    setFlyTo(coordsOf(app));
    setTimeout(() => markerRefs.current[app.id]?.openPopup(), 1100);
  };

  const startEditing = (app) => {
    setEditingApp(app);
    setTempCoords(hasCoords(app) ? [Number(app.lat), Number(app.lng)] : null);
    setSelected(app.id);
  };

  const handleGeocode = async () => {
    if (!editingApp?.address) return;
    setGeocoding(true);
    try {
      const found = await geocodeAddress(editingApp.address);
      if (found) {
        setTempCoords(found);
        setFlyTo(found);
      } else {
        alert('הכתובת לא נמצאה — לחצו על המפה לסימון ידני');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setGeocoding(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!editingApp || !tempCoords) return;
    try {
      const [lat, lng] = tempCoords;
      await base44.entities.ClosureApplication.update(editingApp.id, { lat, lng });
      setApps(prev => prev.map(a => (a.id === editingApp.id ? { ...a, lat, lng } : a)));
      setEditingApp(null);
      setTempCoords(null);
    } catch (err) {
      alert('שגיאה בשמירת המיקום: ' + err.message);
    }
  };

  const handleCancelLocation = () => {
    setEditingApp(null);
    setTempCoords(null);
  };

  return (
    <div dir="rtl" className="flex flex-col gap-3 md:h-[calc(100vh-150px)] md:min-h-[520px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><MapPin className="w-6 h-6 text-blue-700" /> מפת סגירות</h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 flex-wrap">
          {FILTERS.map(f => (
            <button key={f.val} type="button" onClick={() => setStatusFilter(f.val)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${statusFilter === f.val ? 'bg-white shadow text-blue-800' : 'text-gray-500 hover:text-gray-800'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {editingApp && (
        <div className="flex flex-wrap gap-2 items-center bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm">
          <span className="font-medium text-amber-800">📍 עריכת מיקום: {editingApp.business} — לחצו על המפה לבחירת המיקום</span>
          <div className="flex gap-2 mr-auto">
            <button type="button" onClick={handleGeocode} disabled={geocoding || !editingApp.address}
              className="flex items-center gap-1 bg-white border border-amber-300 text-amber-800 px-3 py-1 rounded-lg disabled:opacity-50">
              {geocoding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />} מצא לפי הכתובת
            </button>
            <button type="button" onClick={handleSaveLocation} disabled={!tempCoords}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg font-medium disabled:opacity-40">שמור</button>
            <button type="button" onClick={handleCancelLocation} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-lg">ביטול</button>
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse md:flex-row flex-1 gap-3 md:overflow-hidden">
        {/* Sidebar */}
        <div className="md:w-72 flex-shrink-0 bg-white border border-gray-200 rounded-xl flex flex-col max-h-80 md:max-h-none overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש עסק או כתובת..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {loading ? (
              <div className="text-center py-12 text-gray-400">טוען...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">אין עסקים להצגה</div>
            ) : filtered.map(app => (
              <button
                key={app.id}
                type="button"
                onClick={() => handleSelect(app)}
                className={`w-full text-right p-3 rounded-xl border transition-all hover:shadow-sm ${
                  selected === app.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-100 hover:border-blue-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-semibold text-gray-800 text-sm leading-tight">{app.business || 'ללא שם'}</span>
                  <StatusBadge status={app.status} />
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{app.address || 'ללא כתובת'}</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {typeLabel(app.type)}{app.area ? ` · ${app.area} מ״ר` : ''}
                  {!hasCoords(app) && <span className="text-amber-600"> · מיקום משוער</span>}
                </div>
              </button>
            ))}
          </div>
          {!loading && (
            <div className="p-2 border-t border-gray-100 text-center text-xs text-gray-400">
              {filtered.length} עסקים{unmarkedCount > 0 && ` · ${unmarkedCount} ללא מיקום מדויק (מסומנים בשקיפות)`}
            </div>
          )}
        </div>

        {/* Map */}
        <div className={`md:flex-1 relative z-0 rounded-xl overflow-hidden border border-gray-200 h-[60vh] md:h-auto ${editingApp ? 'cursor-crosshair' : ''}`}>
          <MapContainer center={ASHDOD_CENTER} zoom={13} className="w-full h-full">
            <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
            <ClickToPick active={!!editingApp} onPick={setTempCoords} />
            {flyTo && <FlyTo coords={flyTo} key={flyTo.join(',')} />}
            {editingApp && tempCoords && <Marker position={tempCoords} />}
            {filtered.filter(app => app.id !== editingApp?.id).map(app => (
              <Marker
                key={app.id}
                position={coordsOf(app)}
                icon={statusIcon(app.status, !hasCoords(app))}
                ref={el => { if (el) markerRefs.current[app.id] = el; }}
                eventHandlers={{ click: () => setSelected(app.id) }}
              >
                <Popup>
                  <div className="text-right min-w-[170px]" dir="rtl">
                    <div className="font-bold text-gray-800 mb-1">{app.business}</div>
                    <div className="text-xs text-gray-500 mb-1">{app.address}</div>
                    <StatusBadge status={app.status} />
                    {app.phone && <div className="text-xs text-gray-500 mt-1">📞 {app.phone}</div>}
                    {!hasCoords(app) && <div className="text-xs text-amber-600 mt-1">מיקום משוער — לא סומן במדויק</div>}
                    <button
                      type="button"
                      onClick={() => startEditing(app)}
                      className="mt-2 w-full text-center text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition"
                    >
                      📍 {hasCoords(app) ? 'שנה מיקום' : 'סמן מיקום'}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/architect/${app.id}`)}
                      className="mt-1.5 w-full text-center text-xs bg-blue-700 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800 transition"
                    >
                      צפה בבקשה
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
