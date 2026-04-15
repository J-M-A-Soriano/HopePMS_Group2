import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Package } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();

  const [urlError, setUrlError] = useState<string | null>(null);

  React.useEffect(() => {
    if (window.location.search.includes('force=true')) {
      localStorage.clear();
      sessionStorage.clear();
      window.history.replaceState({}, document.title, "/login");
      window.location.reload();
    } else if (window.location.search.includes('error=')) {
      // Safely capture the exact error type into the DOM state
      const params = new URLSearchParams(window.location.search);
      setUrlError(params.get('error'));
      // Clean the URL silently so refreshes don't retrigger it
      window.history.replaceState({}, document.title, "/login");
    }
  }, []);

  if (user && !window.location.search.includes('force=true')) {
    return <Navigate to="/" />;
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
  };

  const handleGoogleLogin = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) setError(error.message);
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md border border-slate-100">
        <div className="mb-8 flex flex-col items-center justify-center space-y-2 text-center">
          <div className="rounded-full bg-primary/10 p-3">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to HopePMS</h1>
          <p className="text-sm text-slate-500">Product Management System Enterprise Portal</p>
        </div>

        {urlError === 'account_locked' && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-md text-sm font-medium flex items-center gap-3">
             <div className="bg-red-100 text-red-700 rounded-full p-1 border border-red-200 shrink-0">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
             </div>
             Your account is locked or suspended. Please contact highly privileged personnel.
          </div>
        )}

        {urlError === 'account_pending' && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-md text-sm font-medium flex items-center gap-3">
             <div className="bg-amber-100 text-amber-700 rounded-full p-1 border border-amber-200 shrink-0">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
             </div>
             Your account is currently inactive. You must secure explicit permission from an Admin or Superadmin to access the platform.
          </div>
        )}

        {urlError === 'account_deleted' && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-md text-sm font-medium flex items-center gap-3">
             <div className="bg-red-100 text-red-700 rounded-full p-1 border border-red-200 shrink-0">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
             </div>
             Your account does not exist or has been permanently deleted from the registry.
          </div>
        )}

        {error && <div className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded">{error}</div>}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Email</label>
            <input 
              type="email" 
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20" 
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Password</label>
            <input 
              type="password" 
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground h-10 rounded-md font-medium hover:bg-primary/90 transition">
            Sign In
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-muted-foreground">Or continue with</span></div>
        </div>

        <button 
          onClick={handleGoogleLogin} 
          className="w-full border shadow-sm bg-white text-slate-700 h-10 rounded-md font-medium hover:bg-slate-50 transition flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
          Google
        </button>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don't have an account? <Link to="/register" className="text-primary hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
}
