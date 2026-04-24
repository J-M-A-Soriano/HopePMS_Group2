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

  // ✅ Track the last userId we fetched for — not just a boolean
  const fetchedForUserId = React.useRef<string | null>(null);

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
          if (
            data.record_status === 'SUSPENDED' ||
            data.record_status === 'TERMINATED' ||
            data.record_status === 'INACTIVE'
          ) {
            supabase.auth.signOut().catch(() => { });
            localStorage.clear();
            window.location.href =
              data.record_status === 'INACTIVE'
                ? '/login?error=account_pending'
                : '/login?error=account_locked';
            return;
          }
          setUserRole(data.user_type || 'USER');
          setStaffId(data.staff_id);
          fetchedForUserId.current = userId;
        } else if (error && error.code === 'PGRST116') {
          console.error('User row not found (PGRST116). Falling back to basic USER role.');
          setUserRole('USER');
          fetchedForUserId.current = userId;
        } else if (error) {
          // If the error is a Postgres structural error like infinite recursion (42P17) or syntax error,
          // retrying will never fix it. We must abort immediately to prevent 3-second loading delays!
          // Only retry on network errors or timeouts (usually no error.code, or a specific fetch error).
          const isPostgresError = error.code && typeof error.code === 'string';
          
          if (!isPostgresError && retries > 0) {
            console.warn(`Network/Lock error fetching role, retrying (${retries} left)...`, error);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchUserRole(userId, retries - 1);
          }
          console.error('Database error fetching role, fallback to USER:', error);
          setUserRole('USER');
          fetchedForUserId.current = userId;
        }
      } catch (err) {
        console.error('fetchUserRole exception:', err);
      }
    };

    // 1. Initial Session Check (Standard Supabase Flow with Anti-Freeze Shield)
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session lock timeout')), 1000)
    );

    Promise.race([sessionPromise, timeoutPromise])
      .then(async (result: any) => {
        if (!mounted) return;
        const { data: { session }, error } = result;
        if (error) console.error("Error getting session:", error);
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserRole(session.user.id);
        }
        setLoading(false);
      })
      .catch((e) => {
        // If it times out because of a multi-tab lock freeze, force the loading screen off!
        console.warn("Forced loading screen off due to lock freeze:", e);
        if (mounted) setLoading(false);
      });

    // 2. Listen for subsequent auth state changes (Alt-Tab, Token Refresh, Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;
      
      // Ignore the initial session event from the listener since we already handled it above
      if (event === 'INITIAL_SESSION') return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setUserRole(null);
        setStaffId(null);
        fetchedForUserId.current = null;
        setLoading(false);
        return;
      }

      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);

        // Fetch role if the user changed or we haven't fetched it yet
        if (fetchedForUserId.current !== currentSession.user.id) {
          await fetchUserRole(currentSession.user.id);
        }
      }
    });

    return () => {
      mounted = false;
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