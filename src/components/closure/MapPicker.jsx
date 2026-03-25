import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const ASHDOD_CENTER = [31.8014, 34.6436];

function ClickHandler({ onSelect }) {
  useMapEvents({ click: (e) => onSelect(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function MapPicker({ lat, lng, onSelect }) {
  const pos = lat && lng ? [lat, lng] : null;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        מיקום על המפה <span className="text-gray-400 font-normal">(לחץ על המפה לסימון המיקום)</span>
      </label>
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 220 }}>
        <MapContainer center={pos || ASHDOD_CENTER} zoom={14} className="w-full h-full" zoomControl={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onSelect={onSelect} />
          {pos && <Marker position={pos} />}
        </MapContainer>
      </div>
      {pos ? (
        <p className="text-xs text-green-600">✓ מיקום נבחר: {lat.toFixed(5)}, {lng.toFixed(5)}</p>
      ) : (
        <p className="text-xs text-amber-600">⚠ לא נבחר מיקום — לחץ על המפה</p>
      )}
    </div>
  );
}