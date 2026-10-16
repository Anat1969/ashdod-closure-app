import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import StatusBadge from '../components/closure/StatusBadge';
import { STATUS_LABELS, typeLabel } from '../components/closure/constants';
import {
  ASHDOD_CENTER, coordsOf, hasCoords, statusIcon, geocodeAddress, baseMapOf, loadOsmVenues, osmIcon, AMENITY_LABELS,
} from '@/lib/map';
import { useSettings, setSettings } from '@/lib/settings';
import { nextApplicationId } from '@/lib/applicationId';

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

const STATUS_DOT = { approved: '#16a34a', pending_review: '#d97706', pending_owner: '#2563eb', rejected: '#dc2626' };
const FILTERS = [{ val: 'all', label: 'הכל' }, ...Object.entries(STATUS_LABELS).map(([val, label]) => ({ val, label }))];
const TYPE_FILTERS = [{ val: 'all', label: 'כל הסוגים' }, { val: 'type1', label: 'פרגוד חורף' }, { val: 'type2', label: 'עונתית' }];

const streetOf = (address) => String(address || '').replace(/,.*$/, '').replace(/\d+.*$/, '').trim();
const distM = ([a, b], [c, d]) => Math.hypot((a - c) * 111000, (b - d) * 94000);

const chip = (active) => `px-3 py-1 rounded-md text-xs font-medium transition ${active ? 'bg-white shadow text-blue-950' : 'text-blue-600 hover:text-blue-950'}`;

export default function MapView() {
  const navigate = useNavigate();
  const settings = useSettings();
  const base = baseMapOf(settings.baseMap);
  const [params, setParams] = useSearchParams();
  const [apps, setApps] = useState([]);
  const [osm, setOsm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(params.get('id'));
  const [flyTo, setFlyTo] = useState(null);
  const [editingApp, setEditingApp] = useState(null);
  const [tempCoords, setTempCoords] = useState(null);
  const statusFilter = params.get('status') || 'all';
  const typeFilter = params.get('type') || 'all';
  const [search, setSearch] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const markerRefs = useRef({});

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (!v || v === 'all') next.delete(k); else next.set(k, v);
    setParams(next, { replace: true });
  };

  const load = () => base44.entities.ClosureApplication.list('-created_date').then(setApps);

  useEffect(() => {
    load().finally(() => setLoading(false));
    loadOsmVenues().then(setOsm).catch(() => setOsm({ venues: [], error: true }));
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = apps.filter(a =>
    (statusFilter === 'all' || a.status === statusFilter) &&
    (typeFilter === 'all' || (a.type || 'type1') === typeFilter) &&
    (!q || a.business?.toLowerCase().includes(q) || a.address?.toLowerCase().includes(q))
  );
  const unmarkedCount = filtered.filter(a => !hasCoords(a)).length;

  const stats = useMemo(() => {
    const byStreet = {};
    filtered.forEach(a => { const s = streetOf(a.address); if (s) byStreet[s] = (byStreet[s] || 0) + 1; });
    return {
      area: filtered.reduce((s, a) => s + (Number(a.area) || 0), 0),
      streets: Object.entries(byStreet).sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
  }, [filtered]);

  const osmVenues = (osm?.venues || []).filter(v => !q || v.name?.toLowerCase().includes(q) || v.address?.toLowerCase().includes(q));
  const appNear = (v) => apps.find(a => hasCoords(a) && distM(coordsOf(a), [v.lat, v.lng]) < 25);

  const handleSelect = (app) => {
    setSelected(app.id);
    setParam('id', app.id);
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
      if (found) { setTempCoords(found); setFlyTo(found); } else alert('הכתובת לא נמצאה, לחצו על המפה לסימון ידני');
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

  const openFileFromOsm = async (v) => {
    const created = await base44.entities.ClosureApplication.create({
      business: v.name || AMENITY_LABELS[v.amenity] || 'עסק מ-OSM',
      address: v.address ? `${v.address}, אשדוד` : '',
      business_type: AMENITY_LABELS[v.amenity] || '',
      lat: v.lat,
      lng: v.lng,
      status: 'pending_owner',
      type: 'type1',
      osm_id: v.id,
      application_id: await nextApplicationId(),
      description: 'תיק נפתח מתוך שכבת OpenStreetMap. ממתין לפרטי בעל העסק.',
    });
    navigate(`/architect/${created.id}`);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="label">מיפוי</div>
          <h1 className="text-3xl font-extralight text-blue-950">איפה יש סגירות באשדוד</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1 bg-blue-100/70 rounded-lg p-1 flex-wrap" role="group" aria-label="סטטוס">
            {FILTERS.map(f => <button key={f.val} type="button" onClick={() => setParam('status', f.val)} className={chip(statusFilter === f.val)}>{f.label}</button>)}
          </div>
          <div className="flex gap-1 bg-blue-100/70 rounded-lg p-1 flex-wrap" role="group" aria-label="סוג">
            {TYPE_FILTERS.map(f => <button key={f.val} type="button" onClick={() => setParam('type', f.val)} className={chip(typeFilter === f.val)}>{f.label}</button>)}
          </div>
          <div className="flex gap-1 bg-blue-100/70 rounded-lg p-1" role="group" aria-label="שכבות">
            <button type="button" onClick={() => setSettings({ showApps: !settings.showApps })} className={chip(settings.showApps)} aria-pressed={settings.showApps}>שכבת בקשות</button>
            <button type="button" onClick={() => setSettings({ showOsm: !settings.showOsm })} className={chip(settings.showOsm)} aria-pressed={settings.showOsm}>שכבת עסקי מזון</button>
          </div>
        </div>
      </div>

      {editingApp && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2 items-center bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm">
          <span className="font-medium text-amber-900">עריכת מיקום: {editingApp.business}. לחצו על המפה לבחירת המיקום</span>
          <div className="flex gap-2 mr-auto">
            <button type="button" onClick={handleGeocode} disabled={geocoding || !editingApp.address} className="bg-white border border-amber-300 text-amber-900 px-3 py-1 rounded-lg disabled:opacity-50">{geocoding ? 'מחפש...' : 'מצא לפי הכתובת'}</button>
            <button type="button" onClick={handleSaveLocation} disabled={!tempCoords} className="bg-green-700 hover:bg-green-800 text-white px-3 py-1 rounded-lg font-medium disabled:opacity-40">שמירה</button>
            <button type="button" onClick={() => { setEditingApp(null); setTempCoords(null); }} className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-lg">ביטול</button>
          </div>
        </motion.div>
      )}

      <div className="grid gap-3 md:grid-cols-[300px_minmax(0,1fr)] md:h-[calc(100vh-250px)] md:min-h-[540px]">
        <aside className="paper rounded-2xl flex flex-col overflow-hidden max-h-[28rem] md:max-h-none min-w-0 order-2 md:order-1">
          <div className="p-3 border-b border-blue-100">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש עסק או כתובת" type="search"
              className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div className="px-3 py-2 border-b border-blue-100 grid grid-cols-3 gap-2 text-center">
            <div><div className="font-mono text-lg">{filtered.length}</div><div className="text-[11px] text-blue-600">בקשות</div></div>
            <div><div className="font-mono text-lg">{stats.area}</div><div className="text-[11px] text-blue-600">מ"ר</div></div>
            <div><div className="font-mono text-lg">{osm ? osm.venues.length : '-'}</div><div className="text-[11px] text-blue-600">עסקי מזון</div></div>
          </div>
          {stats.streets.length > 0 && (
            <div className="px-3 py-2 border-b border-blue-100">
              <div className="label mb-1">רחובות מובילים</div>
              {stats.streets.map(([s, n]) => (
                <button key={s} type="button" onClick={() => setSearch(s)} className="w-full flex items-center gap-2 text-xs py-0.5 hover:text-blue-950 text-blue-700">
                  <span className="truncate flex-1 text-right">{s}</span>
                  <span className="h-1.5 rounded-full bg-blue-800" style={{ width: `${n * 14}px` }} />
                  <span className="font-mono w-4">{n}</span>
                </button>
              ))}
            </div>
          )}
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {loading ? (
              <div className="text-center py-12 text-blue-400">טוען...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 px-3 text-blue-500 text-sm">אין בקשות להצגה. שכבת עסקי המזון מ-OSM מראה איפה סגירות אפשריות.</div>
            ) : filtered.map(app => (
              <button key={app.id} type="button" onClick={() => handleSelect(app)}
                className={`w-full text-right p-3 rounded-xl border transition-all ${selected === app.id ? 'border-blue-800 bg-blue-50 shadow' : 'border-blue-100 hover:border-blue-300 bg-white'}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-semibold text-blue-950 text-sm leading-tight">{app.business || 'ללא שם'}</span>
                  <StatusBadge status={app.status} />
                </div>
                <div className="text-xs text-blue-600 truncate">{app.address || 'ללא כתובת'}</div>
                <div className="text-xs text-blue-500 mt-0.5">
                  {typeLabel(app.type)}{app.area ? ` · ${app.area} מ"ר` : ''}
                  {!hasCoords(app) && <span className="text-amber-700"> · מיקום משוער</span>}
                </div>
              </button>
            ))}
          </div>
          {!loading && unmarkedCount > 0 && (
            <div className="p-2 border-t border-blue-100 text-center text-xs text-amber-700">{unmarkedCount} ללא מיקום מדויק (מסומנים בשקיפות)</div>
          )}
        </aside>

        <div className={`relative z-0 rounded-2xl overflow-hidden border border-blue-200 shadow-lg h-[62vh] md:h-auto map-ltr order-1 md:order-2 ${editingApp ? 'cursor-crosshair' : ''}`} data-testid="closure-map">
          <MapContainer center={ASHDOD_CENTER} zoom={13} className="w-full h-full">
            <TileLayer key={settings.baseMap} attribution={base.attribution} url={base.url} />
            <ClickToPick active={!!editingApp} onPick={setTempCoords} />
            {flyTo && <FlyTo coords={flyTo} key={flyTo.join(',')} />}
            {editingApp && tempCoords && <Marker position={tempCoords} icon={statusIcon('pending_review')} />}
            {settings.showOsm && osmVenues.map(v => {
              const near = appNear(v);
              return (
                <Marker key={v.id} position={[v.lat, v.lng]} icon={osmIcon(v.outdoor)}>
                  <Popup>
                    <div className="text-right min-w-[180px]" dir="rtl">
                      <div className="label mb-1">OpenStreetMap</div>
                      <div className="font-bold text-blue-950">{v.name || 'ללא שם במפה'}</div>
                      <div className="text-xs text-blue-600">{AMENITY_LABELS[v.amenity] || v.amenity}{v.address ? ` · ${v.address}` : ''}</div>
                      <div className="text-xs mt-1">{v.outdoor ? 'ישיבה בחוץ: כן' : 'ישיבה בחוץ: לא ידוע'}</div>
                      {near
                        ? <button type="button" onClick={() => navigate(`/architect/${near.id}`)} className="mt-2 w-full text-xs bg-blue-900 text-white px-3 py-1.5 rounded-lg">יש בקשה: {near.business}</button>
                        : <button type="button" onClick={() => openFileFromOsm(v)} className="mt-2 w-full text-xs bg-teal-700 text-white px-3 py-1.5 rounded-lg">פתיחת תיק בקשה</button>}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            {settings.showApps && filtered.filter(app => app.id !== editingApp?.id).map(app => (
              <Marker key={app.id} position={coordsOf(app)} icon={statusIcon(app.status, !hasCoords(app), app.type)}
                ref={el => { if (el) markerRefs.current[app.id] = el; }}
                eventHandlers={{ click: () => setSelected(app.id) }}>
                <Popup>
                  <div className="text-right min-w-[180px]" dir="rtl">
                    <div className="font-bold text-blue-950 mb-1">{app.business}</div>
                    <div className="text-xs text-blue-600 mb-1">{app.address}</div>
                    <StatusBadge status={app.status} />
                    <div className="text-xs text-blue-600 mt-1">{typeLabel(app.type)}{app.area ? ` · ${app.area} מ"ר` : ''}</div>
                    {app.phone && <div className="text-xs text-blue-600 mt-1">טלפון: {app.phone}</div>}
                    {!hasCoords(app) && <div className="text-xs text-amber-700 mt-1">מיקום משוער, לא סומן במדויק</div>}
                    <button type="button" onClick={() => startEditing(app)} className="mt-2 w-full text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700">{hasCoords(app) ? 'שינוי מיקום' : 'סימון מיקום'}</button>
                    <button type="button" onClick={() => navigate(`/architect/${app.id}`)} className="mt-1.5 w-full text-xs bg-blue-900 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800">צפייה בבקשה</button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          <div dir="rtl" className="absolute bottom-3 right-3 z-[500] bg-white/95 backdrop-blur rounded-xl shadow-lg p-3 text-[11px] text-blue-800 space-y-1 max-w-[220px]" data-testid="legend">
            <div className="label !text-[10px]">מקרא</div>
            {Object.entries(STATUS_LABELS).map(([k, l]) => (
              <div key={k} className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-white shadow" style={{ background: STATUS_DOT[k] }} />{l}</div>
            ))}
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-400" />עיגול: פרגוד חורף</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-[3px] bg-blue-400" />ריבוע: סגירה עונתית</div>
            <div className="flex items-center gap-2"><span className="osm-dot !w-2.5 !h-2.5" style={{ background: '#0f766e' }} />OSM: עסק עם ישיבה בחוץ</div>
            <div className="flex items-center gap-2"><span className="osm-dot !w-2.5 !h-2.5" style={{ background: '#7d8796' }} />OSM: עסק מזון</div>
            {osm?.fetched && <div className="text-blue-500 pt-1">OSM עודכן {osm.fetched}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
