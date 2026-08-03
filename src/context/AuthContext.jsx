import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const verifySession = useCallback(async (nextSession) => {
    setSession(nextSession);
    if (!nextSession || !supabase) {
      setIsAdmin(false);
      setLoading(false);
      return false;
    }

    const { data, error } = await supabase.rpc('is_admin');
    const authorized = !error && data === true;
    setIsAdmin(authorized);
    setLoading(false);
    return authorized;
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) verifySession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      window.setTimeout(() => {
        if (active) verifySession(nextSession);
      }, 0);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [verifySession]);

  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Supabase todavía no está configurado.');
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      throw new Error('No pudimos iniciar sesión con esas credenciales.');
    }

    const authorized = await verifySession(data.session);
    if (!authorized) {
      await supabase.auth.signOut();
      throw new Error('Esta cuenta no tiene acceso al panel.');
    }
  }, [verifySession]);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
  }, []);

  const value = useMemo(() => ({
    configured: isSupabaseConfigured,
    session,
    isAdmin,
    loading,
    signIn,
    signOut,
  }), [isAdmin, loading, session, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return context;
}

