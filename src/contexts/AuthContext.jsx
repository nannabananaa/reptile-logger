import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);
  const profileLoadedFor = useRef(null);

  async function loadProfile(userId) {
    profileLoadedFor.current = userId;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
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
      }
      setReady(true);
      initialLoad = false;
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // During initial load, getSession handles everything.
      // After signIn/signOut, those functions handle everything.
      // This listener only needs to handle external auth changes (e.g. token refresh).
      if (initialLoad) return;
      setSession(session);
      if (session?.user) {
        if (profileLoadedFor.current !== session.user.id) {
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
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        display_name: displayName,
        email: email.toLowerCase().trim(),
      });
      if (profileError) {
        console.error('Failed to create profile during sign up:', profileError.message);
      }
    }

    return { error: null };
  }

  async function signIn(email, password) {
    // Block all route rendering until profile is fully loaded.
    setReady(false);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (data?.session) {
      setSession(data.session);
      await loadProfile(data.session.user.id);
    }
    setReady(true);
    return { error };
  }

  async function signOut() {
    setReady(false);
    setSession(null);
    setProfile(null);
    profileLoadedFor.current = null;
    await supabase.auth.signOut();
    setReady(true);
  }

  async function refreshProfile() {
    if (session?.user) await loadProfile(session.user.id);
  }

  return (
    <AuthContext.Provider value={{ session, profile, ready, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
