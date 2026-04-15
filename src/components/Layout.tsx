import { Outlet, Link, useLocation } from 'react-router-dom';
import { LogOut, Package, ShieldCheck, History, BarChart3, Settings as SettingsIcon, UserCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUserRights } from '@/context/UserRightsContext';
import { useAuth } from '@/context/AuthContext';

export function Layout() {
  const { canViewAdminPanel, canViewReports, canViewSystemConfig } = useUserRights();
  const { user, userRole, staffId } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    try {
      // Fire async but do not wait for it if it hangs
      supabase.auth.signOut().catch(() => {});
    } catch(e) {}
    window.location.href = '/login?force=true';
  };

  const getLinkClasses = (path: string) => {
    const isActive = location.pathname === path;
    return `flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
      isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
    }`;
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50/50">
      <aside className="w-64 flex-col border-r bg-white hidden md:flex">
        <div className="flex flex-col border-b">
          <div className="flex h-14 items-center px-4 lg:h-[60px] lg:px-6">
            <Link to="/" className="flex items-center gap-2 font-bold text-primary">
              <Package className="h-6 w-6" />
              <span className="text-xl tracking-tight">HopePMS</span>
            </Link>
          </div>
          {user && (
            <div className="px-4 pb-4 lg:px-6">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 shadow-sm flex flex-col gap-1">
                <div className="flex flex-row items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <UserCircle className="h-4 w-4 text-primary" />
                  {userRole}
                </div>
                <div className="text-xs text-slate-500 font-mono truncate" title={staffId || 'Unknown ID'}>
                  ID: {staffId || 'PENDING'}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-1" title={user.email}>
                  {user.email}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm lg:px-4 space-y-1">
            <Link to="/" className={getLinkClasses('/')}>
              <Package className="h-4 w-4" />
              Products
            </Link>
            <Link to="/price-history" className={getLinkClasses('/price-history')}>
              <History className="h-4 w-4" />
              Price History
            </Link>
            {canViewReports && (
              <Link to="/reports" className={getLinkClasses('/reports')}>
                <BarChart3 className="h-4 w-4" />
                Reports
              </Link>
            )}
            {canViewAdminPanel && (
              <>
                <Link to="/users" className={getLinkClasses('/users')}>
                  <ShieldCheck className="h-4 w-4" />
                  Manage Users
                </Link>
                <Link to="/archive" className={getLinkClasses('/archive')}>
                  <ShieldCheck className="h-4 w-4 text-red-500" />
                  Vault/Archive
                </Link>
              </>
            )}
            {canViewSystemConfig && (
              <Link to="/settings" className={getLinkClasses('/settings')}>
                <SettingsIcon className="h-4 w-4 text-slate-600" />
                System Config
              </Link>
            )}
          </nav>
        </div>
      </aside>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 md:pl-0 flex-1">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white sm:static sm:h-auto sm:border-0 sm:bg-transparent px-4 sm:px-6">
          <div className="flex-1"></div>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-white border shadow-sm px-4 py-2 rounded-md hover:bg-slate-50 transition-colors text-sm font-medium">
             <LogOut className="h-4 w-4" /> Logout
          </button>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
