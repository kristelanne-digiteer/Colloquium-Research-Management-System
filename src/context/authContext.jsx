import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

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
  const [activeRole, setActiveRoleState] = useState(
    () => localStorage.getItem('colloquium-active-role') || 'author'
  );

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

    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (!error) setProfile(data);
      });

    return () => {
      isMounted = false;
    };
  }, [session?.user?.id]);

  const setActiveRole = (role) => {
    setActiveRoleState(role);
    localStorage.setItem('colloquium-active-role', role);
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
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', session.user.id)
      .select()
      .single();
    if (!error) setProfile(data);
    return { data, error };
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
    [session, profile, loading, activeRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}