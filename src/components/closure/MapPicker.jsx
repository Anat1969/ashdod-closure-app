import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Search, Loader2 } from 'lucide-react';
import { ASHDOD_CENTER, TILE_URL, TILE_ATTRIBUTION, geocodeAddress } from '@/lib/map';

function ClickHandler({ onSelect }) {
  useMapEvents({ click: (e) => onSelect(e.latlng.lat, e.latlng.lng) });
  return null;
}

function Recenter({ pos }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.setView(pos, Math.max(map.getZoom(), 16));
  }, [pos?.[0], pos?.[1]]);
  return null;
}

export default function MapPicker({ lat, lng, onSelect, address = '' }) {
  const pos = lat != null && lng != null ? [Number(lat), Number(lng)] : null;
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const handleFind = async () => {
    if (!address.trim()) {
      setError('יש למלא כתובת תחילה');
      return;
    }
    setSearching(true);
    setError('');
    try {
      const found = await geocodeAddress(address);
      if (found) onSelect(found[0], found[1]);
      else setError('הכתובת לא נמצאה — סמנו את המיקום ידנית על המפה');
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="block text-sm font-medium text-gray-700">
          מיקום על המפה{' '}
          <span className="text-gray-400 font-normal">(לחצו על המפה לסימון)</span>
        </label>
        <button
          type="button"
          onClick={handleFind}
          disabled={searching}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 disabled:opacity-50"
        >
          {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          מצא לפי הכתובת
        </button>
      </div>
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm relative z-0" style={{ height: 240 }}>
        <MapContainer center={pos || ASHDOD_CENTER} zoom={pos ? 16 : 14} className="w-full h-full">
          <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
          <ClickHandler onSelect={onSelect} />
          <Recenter pos={pos} />
          {pos && <Marker position={pos} />}
        </MapContainer>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {pos ? (
        <p className="text-xs text-green-600">✓ מיקום נבחר: {pos[0].toFixed(5)}, {pos[1].toFixed(5)}</p>
      ) : (
        <p className="text-xs text-amber-600">⚠ לא נבחר מיקום — לחצו על המפה או על "מצא לפי הכתובת"</p>
      )}
    </div>
  );
}
