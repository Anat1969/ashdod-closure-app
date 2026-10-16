import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import StatusBadge from '../components/closure/StatusBadge';
import { STATUS_LABELS, typeLabel } from '../components/closure/constants';
import {
  ASHDOD_CENTER, ASHDOD_BOUNDS, ASHDOD_GIS_URL, coordsOf, hasCoords, statusIcon, locateAddress, reverseGeocode, baseMapOf, loadOsmVenues, osmIcon, AMENITY_LABELS,
} from '@/lib/map';
import { loadStreets, matchStreet, parseAddress, streetBounds } from '@/lib/streets';
import { useSettings, setSettings } from '@/lib/settings';
import { nextApplicationId } from '@/lib/applicationId';

function FlyTo({ coords }) {
  const map = useMap();
  useEffect(() => { if (coords) map.flyTo(coords, 17, { duration: 1 }); }, [coords, map]);
  return null;
}

// Leaflet measures its box once; re-measure after the page animation and on resize.
function KeepSized() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 400);
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => { clearTimeout(t); ro.disconnect(); };
  }, [map]);
  return null;
}

function FitStreet({ street }) {
  const map = useMap();
  useEffect(() => {
    const b = streetBounds(street);
    if (b) map.flyToBounds(b, { padding: [60, 60], maxZoom: 17, duration: 0.9 });
  }, [street, map]);
  return null;
}

function ClickToPick({ active, onPick }) {
  useMapEvents({ click: (e) => { if (active) onPick([e.latlng.lat, e.latlng.lng]); } });
  return null;
}

const STATUS_DOT = { approved: '#16a34a', pending_review: '#d97706', pending_owner: '#2563eb', rejected: '#dc2626', mapped: '#7c3aed' };
const FILTERS = [{ val: 'all', label: 'הכל' }, ...Object.entries(STATUS_LABELS).map(([val, label]) => ({ val, label }))];
const TYPE_FILTERS = [{ val: 'all', label: 'כל הסוגים' }, { val: 'type1', label: 'פרגוד חורף' }, { val: 'type2', label: 'עונתית' }];
const NEW_STATUSES = [['mapped', 'סגירה קיימת'], ['approved', 'מאושר'], ['pending_review', 'ממתין לבדיקה']];

const streetOf = (a) => a.street_name || parseAddress(a.address).street;
const distM = ([a, b], [c, d]) => Math.hypot((a - c) * 111000, (b - d) * 94000);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const chip = (active) => `px-3 py-1 rounded-md text-xs font-medium transition ${active ? 'bg-white shadow text-blue-950' : 'text-blue-600 hover:text-blue-950'}`;
const input = 'w-full border border-blue-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400';

// Bulk line format: "address" or "business | address".
function parseLine(line) {
  const parts = line.split('|').map(p => p.trim()).filter(Boolean);
  return parts.length > 1 ? { business: parts[0], address: parts.slice(1).join(' ') } : { business: '', address: parts[0] };
}

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
  const [tab, setTab] = useState(params.get('tab') === 'add' ? 'add' : 'list');
  const [search, setSearch] = useState('');
  const markerRefs = useRef({});
  const [streets, setStreets] = useState([]);
  const [streetQuery, setStreetQuery] = useState('');
  const [focusStreet, setFocusStreet] = useState(null);

  // add-closure state
  const [form, setForm] = useState({ address: '', business: '', type: 'type1', status: 'mapped', area: '' });
  const [pickMode, setPickMode] = useState(false);   // click on the map to place the next closure
  const [picked, setPicked] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [bulk, setBulk] = useState('');
  const [progress, setProgress] = useState(null);
  const [notFound, setNotFound] = useState([]);
  const [relocate, setRelocate] = useState(null);     // existing record being placed by click

  const statusFilter = params.get('status') || 'all';
  const typeFilter = params.get('type') || 'all';
  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (!v || v === 'all') next.delete(k); else next.set(k, v);
    setParams(next, { replace: true });
  };

  const load = () => base44.entities.ClosureApplication.list('-created_date').then(setApps);
  useEffect(() => {
    load().finally(() => setLoading(false));
    loadOsmVenues().then(setOsm).catch(() => setOsm({ venues: [] }));
    loadStreets().then(setStreets).catch(() => setStreets([]));
  }, []);

  const typedStreet = useMemo(() => matchStreet(streets, parseAddress(form.address).street), [streets, form.address]);
  const chooseStreet = (text) => {
    setStreetQuery(text);
    const m = streets.find(s => s.name === text) || (text.trim().length > 1 ? matchStreet(streets, text) : null);
    setFocusStreet(m && m.lines ? m : null);
  };

  const q = search.trim().toLowerCase();
  const filtered = apps.filter(a =>
    (!focusStreet || a.street_code === focusStreet.code || matchStreet(streets, streetOf(a))?.code === focusStreet.code) &&
    (statusFilter === 'all' || a.status === statusFilter) &&
    (typeFilter === 'all' || (a.type || 'type1') === typeFilter) &&
    (!q || a.business?.toLowerCase().includes(q) || a.address?.toLowerCase().includes(q))
  );
  const stats = useMemo(() => {
    const byStreet = {};
    filtered.forEach(a => { const s = streetOf(a.address); if (s) byStreet[s] = (byStreet[s] || 0) + 1; });
    return { area: filtered.reduce((s, a) => s + (Number(a.area) || 0), 0), streets: Object.entries(byStreet).sort((a, b) => b[1] - a[1]).slice(0, 5) };
  }, [filtered]);
  const osmVenues = (osm?.venues || []).filter(v => !q || v.name?.toLowerCase().includes(q) || v.address?.toLowerCase().includes(q));
  const appNear = (v) => apps.find(a => hasCoords(a) && distM(coordsOf(a), [v.lat, v.lng]) < 25);

  const focus = (app) => {
    setSelected(app.id);
    setFlyTo(coordsOf(app));
    setTimeout(() => markerRefs.current[app.id]?.openPopup(), 1100);
  };

  const createClosure = async ({ address, business, lat, lng, street, precision }) => {
    const { number } = parseAddress(address);
    const official = street || matchStreet(streets, parseAddress(address).street);
    const shown = official ? `${official.name}${number ? ` ${number}` : ''}` : address;
    const full = shown && !/אשדוד/.test(shown) ? `${shown}, אשדוד` : shown;
    return base44.entities.ClosureApplication.create({
      business: business || form.business || `סגירה ב${shown || 'מיקום שסומן'}`,
      address: full || '',
      street_code: official?.code ?? null,
      street_name: official?.name ?? '',
      location_precision: precision || (lat != null ? 'manual' : 'none'),
      type: form.type,
      status: form.status,
      area: form.area ? Number(form.area) : '',
      lat: lat ?? null,
      lng: lng ?? null,
      source: 'map',
      application_id: await nextApplicationId(),
      description: 'נוסף ממפת הסגירות.',
    });
  };

  const afterAdd = async (created, text) => {
    await load();
    setMsg(text);
    setForm(f => ({ ...f, address: '', business: '', area: '' }));
    setPicked(null);
    setPickMode(false);
    if (hasCoords(created)) { setSelected(created.id); setFlyTo([created.lat, created.lng]); }
  };

  const handleAdd = async () => {
    setMsg('');
    if (picked) {
      setBusy(true);
      const created = await createClosure({ address: form.address, business: form.business, lat: picked[0], lng: picked[1] });
      setBusy(false);
      return afterAdd(created, 'הסגירה נוספה למפה במיקום שסימנת');
    }
    if (!form.address.trim()) { setMsg('הקלידו כתובת או סמנו מיקום על המפה'); return undefined; }
    setBusy(true);
    try {
      const loc = await locateAddress(form.address);
      if (!loc.coords) {
        setPickMode(true);
        setMsg('הכתובת לא אותרה. לחצו על המפה במקום הנכון, ואז "הוספה למפה".');
        return undefined;
      }
      const created = await createClosure({ address: form.address, business: form.business, lat: loc.coords[0], lng: loc.coords[1], street: loc.street, precision: loc.precision });
      return afterAdd(created, loc.precision === 'street'
        ? `נוספה סגירה ברחוב ${loc.street.name}. מספר הבית לא אותר, הסגירה מוקמה על הרחוב. אפשר לדייק בסימון במפה.`
        : `נוספה סגירה ב${created.address}`);
    } catch (err) {
      setPickMode(true);
      setMsg(`${err.message}. אפשר לסמן את המיקום בלחיצה על המפה.`);
      return undefined;
    } finally {
      setBusy(false);
    }
  };

  const handlePick = async (coords) => {
    if (relocate) {
      await base44.entities.ClosureApplication.update(relocate.id, { lat: coords[0], lng: coords[1] });
      setNotFound(n => n.filter(x => x.id !== relocate.id));
      setRelocate(null);
      setPickMode(false);
      await load();
      setMsg('המיקום נשמר');
      return;
    }
    setPicked(coords);
    if (!form.address.trim()) {
      const addr = await reverseGeocode(coords).catch(() => '');
      if (addr) {
        const { street, number } = parseAddress(addr);
        const official = matchStreet(streets, street);
        setForm(f => ({ ...f, address: official ? `${official.name}${number ? ` ${number}` : ''}` : addr }));
      }
    }
  };

  const handleBulk = async () => {
    const lines = bulk.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setBusy(true);
    setMsg('');
    const missing = [];
    let added = 0;
    for (let i = 0; i < lines.length; i++) {
      setProgress({ done: i, total: lines.length, current: lines[i] });
      const { business, address } = parseLine(lines[i]);
      let loc = { coords: null };
      try { loc = await locateAddress(address); } catch { /* keep unlocated */ }
      const created = await createClosure({ address, business, lat: loc.coords?.[0], lng: loc.coords?.[1], street: loc.street, precision: loc.precision });
      added++;
      if (!loc.coords) missing.push(created);
      if (i < lines.length - 1) await sleep(1100); // Nominatim allows one request per second
    }
    setProgress(null);
    setBusy(false);
    setBulk('');
    setNotFound(missing);
    await load();
    setMsg(`נוספו ${added} סגירות${missing.length ? `, ${missing.length} לא אותרו ומחכות לסימון ידני` : ''}`);
  };

  const openFileFromOsm = async (v) => {
    const created = await base44.entities.ClosureApplication.create({
      business: v.name || AMENITY_LABELS[v.amenity] || 'עסק מ-OSM',
      address: v.address ? `${v.address}, אשדוד` : '',
      business_type: AMENITY_LABELS[v.amenity] || '',
      lat: v.lat, lng: v.lng, status: 'mapped', type: 'type1', osm_id: v.id,
      application_id: await nextApplicationId(),
      description: 'סומן מתוך שכבת OpenStreetMap.',
    });
    await load();
    setSelected(created.id);
    setMsg(`${created.business} סומן כסגירה קיימת`);
  };

  const picking = pickMode || !!relocate;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="label">מפת הסגירות</div>
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
            <button type="button" onClick={() => setSettings({ showStreets: !settings.showStreets })} className={chip(settings.showStreets)} aria-pressed={settings.showStreets}>רחובות רשמיים</button>
            <button type="button" onClick={() => setSettings({ showOsm: !settings.showOsm })} className={chip(settings.showOsm)} aria-pressed={settings.showOsm}>עסקי מזון מ-OSM</button>
          </div>
          <a href={ASHDOD_GIS_URL} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-300 text-blue-800 hover:bg-white">המפה העירונית הרשמית</a>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className={`relative z-0 rounded-2xl overflow-hidden border border-blue-200 shadow-xl h-[62vh] lg:h-[calc(100vh-240px)] min-h-[420px] map-ltr ${picking ? 'cursor-crosshair ring-4 ring-amber-300' : ''}`} data-testid="closure-map">
          <MapContainer center={ASHDOD_CENTER} zoom={14} minZoom={12} maxBounds={ASHDOD_BOUNDS} maxBoundsViscosity={0.8} className="w-full h-full">
            <KeepSized />
            <TileLayer key={settings.baseMap} attribution={base.attribution} url={base.url} maxZoom={base.maxZoom} maxNativeZoom={base.maxZoom} />
            {settings.showStreets && streets.filter(s => s.lines && s.code !== focusStreet?.code).map(s => (
              <Polyline key={s.code} positions={s.lines} pathOptions={{ color: '#6d28d9', weight: 4, opacity: 0.18 }}
                eventHandlers={{ click: () => { setStreetQuery(s.name); setFocusStreet(s); } }}>
                <Tooltip sticky direction="top">{s.name}</Tooltip>
              </Polyline>
            ))}
            {focusStreet && (
              <>
                <Polyline positions={focusStreet.lines} pathOptions={{ color: '#f59e0b', weight: 9, opacity: 0.9 }}>
                  <Tooltip permanent direction="top" className="street-label">{focusStreet.name}</Tooltip>
                </Polyline>
                <FitStreet street={focusStreet} />
              </>
            )}
            <ClickToPick active={picking} onPick={handlePick} />
            {flyTo && <FlyTo coords={flyTo} key={flyTo.join(',')} />}
            {picked && <Marker position={picked} icon={statusIcon(form.status, false, form.type)} />}
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
                        ? <button type="button" onClick={() => navigate(`/architect/${near.id}`)} className="mt-2 w-full text-xs bg-blue-900 text-white px-3 py-1.5 rounded-lg">כבר במפה: {near.business}</button>
                        : <button type="button" onClick={() => openFileFromOsm(v)} className="mt-2 w-full text-xs bg-violet-700 text-white px-3 py-1.5 rounded-lg">סימון כסגירה קיימת</button>}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            {filtered.map(app => (
              <Marker key={app.id} position={coordsOf(app)} icon={statusIcon(app.status, !hasCoords(app), app.type)}
                ref={el => { if (el) markerRefs.current[app.id] = el; }}
                eventHandlers={{ click: () => setSelected(app.id) }}>
                <Popup>
                  <div className="text-right min-w-[190px]" dir="rtl">
                    <div className="font-bold text-blue-950 mb-1">{app.business}</div>
                    <div className="text-xs text-blue-600 mb-1">{app.address}</div>
                    <StatusBadge status={app.status} />
                    <div className="text-xs text-blue-600 mt-1">{typeLabel(app.type)}{app.area ? ` · ${app.area} מ"ר` : ''}</div>
                    {!hasCoords(app) && <div className="text-xs text-amber-700 mt-1">מיקום משוער, לא סומן במדויק</div>}
                    <button type="button" onClick={() => { setRelocate(app); setMsg(`לחצו על המפה כדי למקם את ${app.business}`); }} className="mt-2 w-full text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700">{hasCoords(app) ? 'שינוי מיקום' : 'סימון מיקום'}</button>
                    <button type="button" onClick={() => navigate(`/architect/${app.id}`)} className="mt-1.5 w-full text-xs bg-blue-900 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800">פרטי הסגירה</button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          <div dir="rtl" className="absolute bottom-3 right-3 z-[500] bg-white/95 backdrop-blur rounded-xl shadow-lg p-3 text-[11px] text-blue-800 space-y-1 max-w-[210px]" data-testid="legend">
            <div className="label !text-[10px]">מקרא</div>
            {Object.entries(STATUS_LABELS).map(([k, l]) => (
              <div key={k} className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-white shadow" style={{ background: STATUS_DOT[k] }} />{l}</div>
            ))}
            <div className="flex items-center gap-2 pt-1"><span className="w-3 h-3 rounded-full bg-blue-400" />עיגול: פרגוד חורף</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-[3px] bg-blue-400" />ריבוע: סגירה עונתית</div>
            {settings.showOsm && <div className="flex items-center gap-2"><span className="osm-dot !w-2.5 !h-2.5" style={{ background: '#0f766e' }} />עסק מזון (OSM)</div>}
          </div>
          <AnimatePresence>
            {picking && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} dir="rtl"
                className="absolute top-3 inset-x-3 mx-auto w-fit z-[500] bg-amber-400 text-blue-950 rounded-lg px-4 py-2 text-sm font-medium shadow-lg flex items-center gap-3">
                {relocate ? `לחצו על המפה כדי למקם את ${relocate.business}` : 'לחצו על המפה כדי לסמן את מיקום הסגירה'}
                <button type="button" onClick={() => { setPickMode(false); setRelocate(null); setPicked(null); }} className="underline">ביטול</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="paper rounded-2xl flex flex-col overflow-hidden lg:h-[calc(100vh-240px)] min-h-[420px] min-w-0">
          <div className="flex gap-1 p-2 border-b border-blue-100 bg-blue-50/60" role="tablist">
            {[['list', `סגירות במפה (${filtered.length})`], ['add', 'הוספת סגירות']].map(([k, l]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${tab === k ? 'bg-blue-900 text-white shadow' : 'text-blue-700 hover:bg-white'}`}>{l}</button>
            ))}
          </div>

          {msg && <p className="mx-3 mt-3 text-sm rounded-lg bg-blue-900 text-white px-3 py-2" role="status">{msg}</p>}

          {tab === 'add' ? (
            <div className="overflow-y-auto flex-1 p-3 space-y-5">
              <section className="space-y-2">
                <div className="label">סגירה אחת</div>
                <input className={input} list="ashdod-streets" placeholder="כתובת, למשל: הציונות 20" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleAdd()} aria-label="כתובת" />
                {form.address.trim().length > 1 && streets.length > 0 && (
                  <p className={`text-xs ${typedStreet ? 'text-green-800' : 'text-amber-800'}`} data-testid="street-match">
                    {typedStreet ? `רחוב רשמי: ${typedStreet.name} (סמל ${typedStreet.code})` : 'הרחוב לא נמצא ברשימת הרחובות של אשדוד'}
                  </p>
                )}
                <input className={input} placeholder="שם העסק (לא חובה)" value={form.business} onChange={e => setForm({ ...form, business: e.target.value })} aria-label="שם העסק" />
                <div className="grid grid-cols-2 gap-2">
                  <select className={input} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} aria-label="סוג">
                    <option value="type1">פרגוד חורף</option>
                    <option value="type2">סגירה עונתית</option>
                  </select>
                  <select className={input} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} aria-label="סטטוס">
                    {NEW_STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <input className={input} placeholder='שטח במ"ר (לא חובה)' inputMode="decimal" value={form.area} onChange={e => setForm({ ...form, area: e.target.value.replace(/[^\d.]/g, '') })} aria-label="שטח" />
                {picked && <p className="text-xs text-violet-800">מיקום סומן על המפה{form.address ? `: ${form.address}` : ''}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={handleAdd} disabled={busy} className="flex-1 py-2 rounded-lg bg-blue-900 text-white text-sm font-medium disabled:opacity-50">{busy ? 'מאתר...' : picked ? 'הוספה למפה' : 'איתור והוספה למפה'}</button>
                  <button type="button" onClick={() => { setPickMode(true); setRelocate(null); }} className={`px-3 py-2 rounded-lg text-sm border ${pickMode ? 'bg-amber-400 border-amber-400' : 'border-blue-300'}`}>סימון במפה</button>
                </div>
              </section>

              <section className="space-y-2">
                <div className="label">רשימת כתובות</div>
                <p className="text-xs text-blue-600">כתובת בכל שורה. אפשר גם: שם העסק | כתובת</p>
                <textarea className={`${input} h-28 font-mono text-xs`} value={bulk} onChange={e => setBulk(e.target.value)} placeholder={'הציונות 20\nקפה הים | שדרות הרצל 10'} aria-label="רשימת כתובות" />
                <button type="button" onClick={handleBulk} disabled={busy || !bulk.trim()} className="w-full py-2 rounded-lg bg-blue-900 text-white text-sm font-medium disabled:opacity-50">הוספת כל הכתובות</button>
                {progress && (
                  <div className="space-y-1">
                    <div className="h-2 rounded-full bg-blue-100 overflow-hidden"><motion.div className="h-full bg-violet-600" animate={{ width: `${(progress.done / progress.total) * 100}%` }} /></div>
                    <p className="text-xs text-blue-600 font-mono">{progress.done + 1}/{progress.total} · {progress.current}</p>
                  </div>
                )}
                {notFound.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 space-y-1">
                    <p className="text-xs font-medium text-amber-900">לא אותרו. לחצו על כתובת ואז על המפה:</p>
                    {notFound.map(a => (
                      <button key={a.id} type="button" onClick={() => { setRelocate(a); setPickMode(false); }} className="block w-full text-right text-xs underline text-amber-900">{a.address || a.business}</button>
                    ))}
                  </div>
                )}
              </section>
              <p className="text-[11px] text-blue-500">איתור כתובות דרך OpenStreetMap Nominatim, שירות חינמי. הסגירות נשמרות בדפדפן הזה.</p>
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-blue-100 space-y-2">
                <div className="flex gap-2">
                  <input value={streetQuery} onChange={e => chooseStreet(e.target.value)} list="ashdod-streets" placeholder={`רחוב באשדוד (${streets.length || '...'} רחובות רשמיים)`} type="search" className={input} aria-label="רחוב" />
                  {focusStreet && <button type="button" onClick={() => chooseStreet('')} className="px-2 text-xs underline text-blue-700 flex-none">כל העיר</button>}
                </div>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש עסק או כתובת" type="search" className={input} />
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div><div className="font-mono text-lg">{filtered.length}</div><div className="text-[11px] text-blue-600">סגירות ובקשות</div></div>
                  <div><div className="font-mono text-lg">{stats.area}</div><div className="text-[11px] text-blue-600">מ"ר</div></div>
                </div>
                {stats.streets.length > 0 && (
                  <div>
                    <div className="label mb-1">רחובות מובילים</div>
                    {stats.streets.map(([s, n]) => (
                      <button key={s} type="button" onClick={() => setSearch(s)} className="w-full flex items-center gap-2 text-xs py-0.5 text-blue-700 hover:text-blue-950">
                        <span className="truncate flex-1 text-right">{s}</span>
                        <span className="h-1.5 rounded-full bg-violet-600" style={{ width: `${Math.min(n * 14, 90)}px` }} />
                        <span className="font-mono w-4">{n}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {loading ? <div className="text-center py-12 text-blue-400">טוען...</div>
                  : filtered.length === 0 ? (
                    <div className="text-center py-10 px-3 text-blue-600 text-sm space-y-3">
                      <p>אין עדיין סגירות להצגה.</p>
                      <button type="button" onClick={() => setTab('add')} className="px-4 py-2 rounded-lg bg-blue-900 text-white">הוספת סגירה לפי כתובת</button>
                    </div>
                  ) : filtered.map(app => (
                    <button key={app.id} type="button" onClick={() => focus(app)}
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
            </>
          )}
        </aside>
      </div>
      <datalist id="ashdod-streets">{streets.map(s => <option key={s.code} value={s.name} />)}</datalist>
    </div>
  );
}
