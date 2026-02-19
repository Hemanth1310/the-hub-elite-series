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
      console.log('⚠️ Supabase not configured. Please add environment variables.');
      setUser(null);
      setLoading(false);
      return;
    }

    // Check active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await setUserProfile(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await setUserProfile(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user profile from public.users table
  const setUserProfile = async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, is_admin')
        .eq('id', authUser.id)
        .single();
      if (error || !data) {
        // fallback to auth user if not found in public.users
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          isAdmin: authUser.user_metadata?.isAdmin === true,
        });
        return;
      }
      setUser({
        id: data.id,
        email: data.email,
        name: data.name,
        isAdmin: data.is_admin,
      });
    } catch (e) {
      setUser(null);
    }
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
        await setUserProfile(data.user);
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
