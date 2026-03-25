import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MapPin, Phone, Mail, Utensils, Search } from 'lucide-react';

export default function ResidentView() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    base44.entities.ClosureApplication.filter({ status: 'approved' }, '-created_date', 100)
      .then(data => { setApps(data); setLoading(false); });
  }, []);

  const filtered = apps.filter(a =>
    a.business?.toLowerCase().includes(search.toLowerCase()) ||
    a.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">עסקים מאושרים בעיר</h2>
        <p className="text-gray-500 text-sm">כל העסקים שקיבלו היתר סגירה חורף ועונתית מהעירייה</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חפש עסק או כתובת..."
          className="w-full border border-gray-200 rounded-xl px-3 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">טוען...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>לא נמצאו עסקים מאושרים</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(app => (
            <div
              key={app.id}
              className={`bg-white rounded-xl border-2 shadow-sm p-5 cursor-pointer transition-all hover:shadow-md ${
                selected === app.id ? 'border-blue-500' : 'border-gray-100'
              }`}
              onClick={() => setSelected(selected === app.id ? null : app.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-800">{app.business}</h3>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {app.type === 'type1' ? 'סגירה עונתית' : 'מבנה קבוע'}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{app.area} מ״ר</span>
              </div>

              <div className="space-y-1.5 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span>{app.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <a href={`tel:${app.phone}`} className="hover:text-blue-600">{app.phone}</a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <a href={`mailto:${app.email}`} className="hover:text-blue-600 truncate">{app.email}</a>
                </div>
              </div>

              {selected === app.id && app.menu && Object.keys(app.menu).length > 0 && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Utensils className="w-4 h-4" /> תפריט
                  </div>
                  <div className="space-y-1">
                    {Object.entries(app.menu).map(([item, price]) => (
                      <div key={item} className="flex justify-between text-sm">
                        <span className="text-gray-700">{item}</span>
                        <span className="text-gray-500">{price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <p className="text-center text-gray-400 text-sm mt-8">
          {filtered.length} עסקים מאושרים מוצגים
        </p>
      )}
    </div>
  );
}