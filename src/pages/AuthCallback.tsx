import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Package } from 'lucide-react';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for the session being established from OAuth redirect
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/', { replace: true });
      } else if (event === 'SIGNED_OUT') {
        navigate('/login', { replace: true });
      }
    });

    // Also check if a session already exists (e.g., token in URL hash)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/', { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background overflow-hidden relative">
      {/* Subtle Corporate Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      <div className="flex flex-col items-center gap-6 relative z-10">
        <div className="rounded-xl bg-primary/10 p-4 shadow-sm ring-1 ring-primary/20 animate-pulse">
          <Package className="h-10 w-10 text-primary" />
        </div>

        {/* Spinner */}
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Establishing Session</h2>
          <p className="text-sm text-muted-foreground">Please wait while we securely sign you in…</p>
        </div>
      </div>
    </div>
  );
}
