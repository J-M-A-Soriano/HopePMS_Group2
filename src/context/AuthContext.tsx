import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  staffId: string | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, session: null, userRole: null, staffId: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchUserRole = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('user')
          .select('user_type, record_status, staff_id')
          .eq('userid', userId)
          .single();

        if (!mounted) return;

        if (!error && data) {
          if (data.record_status === 'SUSPENDED' || data.record_status === 'TERMINATED' || data.record_status === 'INACTIVE') {
            supabase.auth.signOut().catch(() => {});
            localStorage.clear();
            window.location.href = data.record_status === 'INACTIVE' ? '/login?error=account_pending' : '/login?error=account_locked';
            return;
          }
          setUserRole(data.user_type || 'USER');
          setStaffId(data.staff_id);
        } else {
          supabase.auth.signOut().catch(() => {});
          localStorage.clear();
          window.location.href = '/login?error=account_deleted';
        }
      } catch (err) {
        console.error("fetchUserRole exception:", err);
      }
    };

    // Absolute failsafe to kill the loading spinner regardless of async hangs
    const failsafe = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 2500);

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserRole(session.user.id);
        }
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(failsafe);
        }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
           await fetchUserRole(currentSession.user.id);
           if (mounted) setLoading(false);
        }
      } else {
        setUserRole(null);
        setStaffId(null);
        if (mounted) setLoading(false);
      }
    });

    return () => {
       mounted = false;
       clearTimeout(failsafe);
       subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, userRole, staffId, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
