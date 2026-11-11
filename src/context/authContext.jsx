import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

// profiles.roles is a text[] (default {'AUTHOR'}). Anyone holding one of these
// can open the EC Chair side; everybody else only ever sees the Author / Reviewer side.
const ADMIN_ROLES = ['ADMIN', 'EC_CHAIR'];
const ROLE_STORAGE_KEY = 'colloquium-active-role';

const MOCK_USER = {
  id: 'dev-user-0001',
  email: 'dev.tester@colloquium.app',
};

const MOCK_PROFILE = {
  id: 'dev-user-0001',
  full_name: 'Dev Tester',
  bio: 'Frontend preview account — no backend connected yet.',
  affiliation: 'Colloquium University',
  work_field: 'Computer Science',
  avatar_url: '',
  // Dev preview: set VITE_DEV_BYPASS_ADMIN=true in .env to see the EC Chair tab.
  roles: import.meta.env.VITE_DEV_BYPASS_ADMIN === 'true' ? ['AUTHOR', 'ADMIN'] : ['AUTHOR'],
  expertise_tracks: [],
  notification_preferences: {
    email: true,
    submissionUpdates: true,
    reviewReminders: false,
  },
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(DEV_BYPASS ? { user: MOCK_USER } : null);
  const [profile, setProfile] = useState(DEV_BYPASS ? MOCK_PROFILE : null);
  const [loading, setLoading] = useState(!DEV_BYPASS);
  const [activeRoleState, setActiveRoleState] = useState(
    () => localStorage.getItem(ROLE_STORAGE_KEY) || 'author'
  );

  const isAdmin = useMemo(
    () => (profile?.roles ?? []).some((r) => ADMIN_ROLES.includes(String(r).toUpperCase())),
    [profile?.roles]
  );
  // Non-admins are always on the 'author' (Author / Reviewer) side, whatever is in localStorage.
  const activeRole = isAdmin && activeRoleState === 'chair' ? 'chair' : 'author';

  useEffect(() => {
    if (DEV_BYPASS) return;

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (DEV_BYPASS) return;
    if (!session?.user) {
      setProfile(null);
      return;
    }

    let isMounted = true;

    Promise.all([
      supabase.from('profiles').select('*').eq('id', session.user.id).single(),
      supabase.from('reviewer_tracks').select('track_code').eq('user_id', session.user.id),
    ]).then(([profileRes, tracksRes]) => {
      if (!isMounted) return;
      if (!profileRes.error) {
        setProfile({
          ...profileRes.data,
          expertise_tracks: (tracksRes.data ?? []).map((t) => t.track_code),
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [session?.user?.id]);

  const setActiveRole = (role) => {
    setActiveRoleState(role);
    localStorage.setItem(ROLE_STORAGE_KEY, role);
  };

  const signUp = async ({ email, password, fullName, affiliation, fieldOfStudy, phone }) => {
    if (DEV_BYPASS) return { data: { user: MOCK_USER }, error: null };
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          affiliation,
          field_of_study: fieldOfStudy,
          work_field: fieldOfStudy,
          phone_number: phone,
        },
      },
    });
  };

  const signInWithPassword = async ({ email, password }) => {
    if (DEV_BYPASS) {
      setSession({ user: MOCK_USER });
      setProfile(MOCK_PROFILE);
      return { data: { user: MOCK_USER }, error: null };
    }
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signInWithGoogle = async () => {
    if (DEV_BYPASS) {
      setSession({ user: MOCK_USER });
      setProfile(MOCK_PROFILE);
      return { data: { user: MOCK_USER }, error: null };
    }
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
  };

  const verifySignupOtp = async ({ email, token }) => {
    if (DEV_BYPASS) {
      setSession({ user: MOCK_USER });
      setProfile(MOCK_PROFILE);
      return { data: { user: MOCK_USER }, error: null };
    }
    return supabase.auth.verifyOtp({ email, token, type: 'signup' });
  };

  const verifyRecoveryOtp = async ({ email, token }) => {
    if (DEV_BYPASS) return { data: {}, error: null };
    return supabase.auth.verifyOtp({ email, token, type: 'recovery' });
  };

  const resendSignupOtp = async ({ email }) => {
    if (DEV_BYPASS) return { data: {}, error: null };
    return supabase.auth.resend({ type: 'signup', email });
  };

  const sendPasswordResetOtp = async ({ email }) => {
    if (DEV_BYPASS) return { data: {}, error: null };
    return supabase.auth.resetPasswordForEmail(email);
  };

  const updatePassword = async ({ password }) => {
    if (DEV_BYPASS) return { data: {}, error: null };
    return supabase.auth.updateUser({ password });
  };

  const updateProfile = async (updates) => {
    if (DEV_BYPASS) {
      setProfile((prev) => ({ ...prev, ...updates }));
      return { data: { ...profile, ...updates }, error: null };
    }
    if (!session?.user) return { error: new Error('Not authenticated') };

    // expertise_tracks is not a column on profiles; it lives in reviewer_tracks.
    const { expertise_tracks, ...profileUpdates } = updates;

    let data = profile;
    if (Object.keys(profileUpdates).length > 0) {
      const res = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', session.user.id)
        .select()
        .single();
      if (res.error) return { data: null, error: res.error };
      data = res.data;
    }

    let tracks = profile?.expertise_tracks ?? [];
    if (Array.isArray(expertise_tracks)) {
      const { error: tracksError } = await saveExpertiseTracks(session.user.id, expertise_tracks);
      if (tracksError) return { data: null, error: tracksError };
      tracks = expertise_tracks;
    }

    const next = { ...data, expertise_tracks: tracks };
    setProfile(next);
    return { data: next, error: null };
  };

  // Replace the user's reviewer_tracks rows with the given track codes.
  const saveExpertiseTracks = async (userId, codes) => {
    const { error: delError } = await supabase.from('reviewer_tracks').delete().eq('user_id', userId);
    if (delError) return { error: delError };
    if (codes.length === 0) return { error: null };
    return supabase
      .from('reviewer_tracks')
      .insert(codes.map((track_code) => ({ user_id: userId, track_code })));
  };

  const signOut = async () => {
    if (DEV_BYPASS) {
      setSession(null);
      setProfile(null);
      return { error: null };
    }
    return supabase.auth.signOut();
  };

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      activeRole,
      isAdmin,
      setActiveRole,
      signUp,
      signInWithPassword,
      signInWithGoogle,
      verifySignupOtp,
      verifyRecoveryOtp,
      resendSignupOtp,
      sendPasswordResetOtp,
      updatePassword,
      updateProfile,
      signOut,
    }),
    [session, profile, loading, activeRole, isAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}