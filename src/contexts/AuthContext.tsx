import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, UserProfile } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

type AuthContextType = {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase is not configured. Authentication is disabled.');
      setUser(null);
      setLoading(false);
      return;
    }

    // Check active session
    const initializeSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(buildProfileFromAuth(session.user));
          void loadUserProfile(session.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(buildProfileFromAuth(session.user));
        void loadUserProfile(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const buildProfileFromAuth = (authUser: User): UserProfile => ({
    id: authUser.id,
    email: authUser.email || '',
    name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
    isAdmin: authUser.user_metadata?.isAdmin === true || authUser.user_metadata?.is_admin === true,
  });

  const loadUserProfile = async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id,email,name,is_admin')
        .eq('id', authUser.id)
        .single();

      if (!error && data) {
        setUser({
          id: data.id,
          email: data.email,
          name: data.name,
          isAdmin: data.is_admin === true,
        });
        return;
      }
    } catch {
      // fall through to metadata fallback
    }

    setUser(buildProfileFromAuth(authUser));
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { error: 'Supabase is not configured. Please add environment variables.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        setUser(buildProfileFromAuth(data.user));
        await loadUserProfile(data.user);
      }

      return { error: null };
    } catch (err) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
