import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { Building2, HardHat } from 'lucide-react';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">
          שלום, {currentUser?.full_name || 'משתמש'} 👋
        </h2>
        <p className="text-gray-500 mt-1">ברוך הבא למערכת ניהול סגירות עיריית אשדוד</p>
      </div>

      {/* Main buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
        <Link
          to="/owner"
          className="flex flex-col items-center justify-center gap-4 border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 rounded-2xl p-10 transition-all group"
        >
          <div className="p-4 rounded-2xl bg-white shadow-sm text-blue-600 group-hover:shadow-md transition-all">
            <Building2 className="w-10 h-10" />
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-blue-800">מסלול בעל עסק</div>
            <div className="text-sm text-blue-500 mt-1">הגשת בקשות סגירה עונתיות וחורף</div>
          </div>
        </Link>

        {isAdmin && (
          <Link
            to="/architect"
            className="flex flex-col items-center justify-center gap-4 border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 rounded-2xl p-10 transition-all group"
          >
            <div className="p-4 rounded-2xl bg-white shadow-sm text-amber-600 group-hover:shadow-md transition-all">
              <HardHat className="w-10 h-10" />
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-amber-800">מסלול עירייה</div>
              <div className="text-sm text-amber-500 mt-1">בדיקה ואישור בקשות</div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}