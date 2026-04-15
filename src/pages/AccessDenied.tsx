import { ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function AccessDenied() {
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear(); // Hard wipe to guarantee session destruction
    } catch(e) {}
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="bg-white max-w-md w-full rounded-lg shadow-sm border border-slate-200 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
        <p className="text-slate-600 mb-8">
          Your account is currently inactive or pending activation. If you are a newly registered user or your account was suspended, you must secure explicit permission and clearance from an <strong>Admin</strong> or <strong>Superadmin</strong> to access the platform.
        </p>
        <button 
          onClick={handleSignOut}
          className="bg-slate-900 text-white px-6 py-2 rounded-md font-medium hover:bg-slate-800 transition-colors inline-block"
        >
          Logout & Return to Login
        </button>
      </div>
    </div>
  );
}
