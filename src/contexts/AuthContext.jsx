import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(undefined); // undefined = not yet checked
  const [loading, setLoading] = useState(true);
  const profileLoadedFor = useRef(null); // track which user we loaded profile for

  async function loadProfile(userId) {
    profileLoadedFor.current = userId;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      // Only apply if this is still the current user
      if (profileLoadedFor.current !== userId) return;
      if (!error && data) setProfile(data);
      else setProfile(null);
    } catch {
      if (profileLoadedFor.current === userId) setProfile(null);
    }
  }

  useEffect(() => {
    let initialLoad = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
      initialLoad = false;
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        // Skip if the initial getSession load is still handling this
        if (!initialLoad) {
          loadProfile(session.user.id);
        }
      } else {
        setProfile(null);
        profileLoadedFor.current = null;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signUp(email, password, displayName) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error };

    if (data?.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        display_name: displayName,
        email: email.toLowerCase().trim(),
      });
    }

    return { error: null };
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (data?.session) {
      setSession(data.session);
      await loadProfile(data.session.user.id);
    }
    return { error };
  }

  async function signOut() {
    setSession(null);
    setProfile(null);
    profileLoadedFor.current = null;
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  async function refreshProfile() {
    if (session?.user) await loadProfile(session.user.id);
  }

  // profile === undefined means we haven't checked yet — treat as loading
  const profileReady = profile !== undefined;

  return (
    <AuthContext.Provider value={{ session, profile, loading, profileReady, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
