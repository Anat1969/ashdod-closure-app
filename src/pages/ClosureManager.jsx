import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import BusinessOwnerView from '../components/closure/BusinessOwnerView';
import ArchitectView from '../components/closure/ArchitectView';
import ResidentView from '../components/closure/ResidentView';
import { Building2, HardHat, Users, Map } from 'lucide-react';
import { Link } from 'react-router-dom';

const ROLES = [
  { id: 'owner', label: 'מסלול בעל עסק', icon: Building2 },
  { id: 'architect', label: 'מסלול עירייה', icon: HardHat },
  { id: 'resident', label: 'תושב', icon: Users },
];

export default function ClosureManager() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const [activeRole, setActiveRole] = useState(null);

  useEffect(() => {
    setActiveRole(isAdmin ? 'architect' : 'owner');
  }, [isAdmin]);

  if (!activeRole) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-800 rounded-full animate-spin" />
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="https://upload.wikimedia.org/wikipedia/he/thumb/a/a9/Ashdod_COA.svg/120px-Ashdod_COA.svg.png"
              alt="עיריית אשדוד"
              className="h-12 w-12 object-contain bg-white rounded-full p-1"
            />
            <div>
              <h1 className="text-xl font-bold">מנהל סגירות — עיריית אשדוד</h1>
              <p className="text-blue-200 text-sm">הגשת בקשות והיתרי סגירה עונתיים וחורף</p>
            </div>
          </div>
          <div className="flex gap-1 bg-blue-800 rounded-lg p-1">
            {ROLES.map(role => {
              const Icon = role.icon;
              if (role.id === 'architect' && !isAdmin) return null;
              return (
                <button
                  key={role.id}
                  onClick={() => setActiveRole(role.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    activeRole === role.id ? 'bg-white text-blue-900' : 'text-blue-200 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{role.label}</span>
                </button>
              );
            })}
            <Link
              to="/map"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-blue-200 hover:text-white transition-all"
            >
              <Map className="w-4 h-4" />
              <span className="hidden sm:inline">מפה</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeRole === 'owner' && <BusinessOwnerView />}
        {activeRole === 'architect' && isAdmin && <ArchitectView />}
        {activeRole === 'architect' && !isAdmin && (
          <div className="text-center py-20 text-gray-500">גישה מוגבלת לאדריכל העיר בלבד</div>
        )}
        {activeRole === 'resident' && <ResidentView />}
      </main>
    </div>
  );
}