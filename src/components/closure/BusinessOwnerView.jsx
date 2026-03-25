import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ApplicationWizard from './ApplicationWizard';
import StatusBadge from './StatusBadge';
import { Plus, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function BusinessOwnerView() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.ClosureApplication.list('-created_date', 50);
    setApps(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSaved = () => { setShowWizard(false); setSelected(null); load(); };

  if (showWizard || selected) {
    return (
      <ApplicationWizard
        application={selected}
        onCancel={() => { setShowWizard(false); setSelected(null); }}
        onSaved={handleSaved}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">הבקשות שלי</h2>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition"
        >
          <Plus className="w-4 h-4" />
          בקשה חדשה
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">טוען...</div>
      ) : apps.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">אין בקשות עדיין</p>
          <p className="text-sm mt-1">לחץ על "בקשה חדשה" להגשת בקשה</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {apps.map(app => (
            <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-800 text-lg">{app.business}</h3>
                  <StatusBadge status={app.status} />
                </div>
                <p className="text-gray-500 text-sm">{app.address}</p>
                <p className="text-gray-400 text-xs mt-1">
                  {app.application_id} · {app.type === 'type1' ? 'סגירה עונתית/חורף' : 'מבנה קבוע/עונתי'} · {app.area} מ״ר
                </p>
                {app.notes && (
                  <p className="text-amber-700 text-sm mt-2 bg-amber-50 px-3 py-2 rounded-lg">
                    <strong>הערת אדריכל:</strong> {app.notes}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {(app.status === 'pending_owner') && (
                  <button
                    onClick={() => setSelected(app)}
                    className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 text-sm"
                  >
                    המשך מילוי
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}