import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);
  // Monotonically increasing ID — stale fetch results (older than current) are discarded.
  const loadIdRef = useRef(0);
  // Set while signIn / signOut / signUp are mid-flight so the auth listener
  // doesn't race them with duplicate session/profile loads.
  const explicitAuthRef = useRef(false);

  async function fetchProfile(userId) {
    const loadId = ++loadIdRef.current;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (loadIdRef.current !== loadId) return { stale: true };
      if (!error && data) return { profile: data };
      if (error && error.code === 'PGRST116') return { profile: null }; // row doesn't exist
      return { error: error || new Error('Unknown profile fetch error') };
    } catch (err) {
      if (loadIdRef.current !== loadId) return { stale: true };
      return { error: err };
    }
  }

  // Fully resolve session+profile state from a session object. Only updates
  // profile if the fetch succeeded or definitively returned no row — transient
  // errors leave the existing profile state intact (no destructive overwrite).
  async function syncFromSession(newSession) {
    setSession(newSession);
    if (newSession?.user) {
      const result = await fetchProfile(newSession.user.id);
      if (result.stale) return;
      if (result.error) {
        console.error('Profile fetch failed:', result.error);
        return;
      }
      setProfile(result.profile);
    } else {
      setProfile(null);
    }
  }

  useEffect(() => {
    let mounted = true;
    let bootstrapped = false;

    (async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (!mounted) return;
      await syncFromSession(initialSession);
      bootstrapped = true;
      if (mounted) setReady(true);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted || !bootstrapped) return;
      // INITIAL_SESSION is handled by the getSession() bootstrap above.
      if (event === 'INITIAL_SESSION') return;
      // signIn / signOut / signUp drive their own session+profile transitions.
      // Skip listener-side handling during those to avoid duplicate / racing loads.
      if (explicitAuthRef.current) return;

      if (event === 'TOKEN_REFRESHED') {
        // Same user, just a fresher token — no UI gate needed.
        setSession(newSession);
        return;
      }
      // SIGNED_IN, SIGNED_OUT, USER_UPDATED, PASSWORD_RECOVERY etc. from outside
      // this tab (e.g. another tab signed in/out). Resync fully behind the ready gate.
      setReady(false);
      await syncFromSession(newSession);
      if (mounted) setReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
    explicitAuthRef.current = true;
    setReady(false);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error };
      await syncFromSession(data.session);
      return { error: null };
    } finally {
      explicitAuthRef.current = false;
      setReady(true);
    }
  }

  async function signOut() {
    explicitAuthRef.current = true;
    setReady(false);
    try {
      await supabase.auth.signOut();
      // Invalidate any in-flight profile fetches.
      loadIdRef.current++;
      setSession(null);
      setProfile(null);
    } finally {
      explicitAuthRef.current = false;
      setReady(true);
    }
  }

  async function refreshProfile() {
    if (!session?.user) return;
    const result = await fetchProfile(session.user.id);
    if (result.stale || result.error) return;
    setProfile(result.profile);
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
