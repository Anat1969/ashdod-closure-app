import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { LayoutDashboard, Building2, HardHat, Map, Users, Menu, X, BookOpen } from 'lucide-react';
import { useState } from 'react';
import BackupMenu from './BackupMenu';

const NAV_ITEMS = [
  { path: '/', label: 'דשבורד', icon: LayoutDashboard, adminOnly: false },
  { path: '/policy', label: 'מדיניות', icon: BookOpen, adminOnly: false },
  { path: '/owner', label: 'מסלול בעל עסק', icon: Building2, adminOnly: false },
  { path: '/architect', label: 'מסלול עירייה', icon: HardHat, adminOnly: false },
  { path: '/map', label: 'מפת סגירות', icon: Map, adminOnly: false },
  { path: '/residents', label: 'מסלול תושב', icon: Users, adminOnly: false },
];

export default function Layout() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const isAdmin = currentUser?.role === 'admin';
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter(i => !i.adminOnly || isAdmin);

  const NavLinks = () => (
    <>
      {visibleItems.map(item => {
        const Icon = item.icon;
        const active = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              active
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-blue-100 hover:bg-blue-800 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar */}
      <header className="bg-blue-900 text-white shadow-lg flex-shrink-0">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            className="sm:hidden p-1.5 rounded-lg hover:bg-blue-800"
            onClick={() => setMobileOpen(o => !o)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <img
            src={`${import.meta.env.BASE_URL}logo.svg`}
            alt=""
            className="h-10 w-10 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold leading-tight">מנהל סגירות — עיריית אשדוד</h1>
            <p className="text-blue-300 text-xs hidden sm:block">היתרי סגירה עונתיים וחורף</p>
          </div>
          <BackupMenu />
        </div>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1 px-4 pb-3">
          <NavLinks />
        </nav>
      </header>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="sm:hidden bg-blue-900 px-4 pb-4 flex flex-col gap-1 border-t border-blue-800">
          <NavLinks />
        </div>
      )}

      {/* Page content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}