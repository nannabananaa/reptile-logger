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
        // Skip if the initial getSession load is still handling this,
        // or if we already loaded the profile for this user (avoids flash).
        if (!initialLoad && profileLoadedFor.current !== session.user.id) {
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

    // Create or update the profile row. Use upsert because a database trigger
    // may have already created a row with a null display_name.
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
    // Reset profile to undefined (loading state) BEFORE setting the session
    // so ProtectedRoute shows a loading screen instead of flashing setup-profile.
    setProfile(undefined);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (data?.session) {
      setSession(data.session);
      await loadProfile(data.session.user.id);
    } else {
      setProfile(null);
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
