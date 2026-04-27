import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LogOut, Package, ShieldCheck, History, BarChart3, Settings as SettingsIcon, UserCircle, Menu, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUserRights } from '@/context/UserRightsContext';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from './ThemeToggle';

export function Layout() {
  const { canViewAdminPanel, canViewReports, canViewSystemConfig } = useUserRights();
  const { user, userRole, staffId } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    try {
      // Fire async but do not wait for it if it hangs
      supabase.auth.signOut().catch(() => {});
    } catch(e) {}
    window.location.href = '/login?force=true';
  };

  const getLinkClasses = (path: string) => {
    const isActive = location.pathname === path;
    return `flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-300 relative overflow-hidden group ${
      isActive 
        ? 'bg-primary/10 text-primary font-semibold shadow-[0_0_10px_rgba(var(--primary-glow))]' 
        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium'
    }`;
  };

  const sidebarContent = (
    <>
      <div className="flex flex-col border-b border-border/50">
        <div className="flex h-14 items-center justify-between px-4 lg:h-[60px] lg:px-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-primary group">
            <Package className="h-6 w-6 transition-transform group-hover:scale-110 group-hover:text-blue-500 duration-300" />
            <span className="text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:to-blue-400">HopePMS</span>
          </Link>
          <button className="md:hidden p-1" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        {user && (
          <div className="px-4 pb-4 lg:px-6">
            <div className="bg-card/50 rounded-lg p-3 border border-border/50 shadow-sm flex flex-col gap-1 backdrop-blur-sm transition-all hover:shadow-md hover:border-primary/30">
              <div className="flex flex-row items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wider">
              <UserCircle className="h-4 w-4 text-primary" />
              {userRole}
            </div>
            <div className="text-xs text-muted-foreground font-mono truncate" title={staffId || 'Unknown ID'}>
              ID: {staffId || 'PENDING'}
            </div>
            <div className="text-[10px] text-muted-foreground/70 truncate mt-1" title={user.email}>
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
              <SettingsIcon className="h-4 w-4" />
              System Config
            </Link>
          )}
        </nav>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen w-full bg-background transition-colors duration-300 bg-gradient-to-br from-background to-muted/30">
        <aside className="w-64 flex-col border-r border-border bg-glass backdrop-blur-md hidden md:flex shadow-xl shadow-black/5 z-20">
          {sidebarContent}
        </aside>

        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
            <aside className="relative w-64 flex-col border-r border-border bg-background shadow-xl flex z-50">
              {sidebarContent}
            </aside>
          </div>
        )}
      <div className="flex flex-col sm:gap-4 sm:py-4 flex-1 relative z-10 min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/50 bg-glass backdrop-blur-md sm:static sm:h-auto sm:border-0 sm:bg-transparent px-4 sm:px-6 sm:pb-2">
          <button 
            className="md:hidden p-2 -ml-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1"></div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 bg-card border border-border shadow-sm px-4 py-2 rounded-md hover:bg-muted transition-colors text-sm font-medium text-foreground hover:shadow-md"
            >
               <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </header>
        <main className="flex-1 px-4 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
