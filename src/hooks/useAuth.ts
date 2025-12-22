import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  username: string | null;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ⚠️ TEMPORARY MOCK AUTH - REMOVE WHEN SUPABASE AUTH IS FIXED ⚠️
    // Hardcoded fake user session for testing
    const MOCK_USER: User = {
      id: 'cf56b3ef-2fb1-4068-a603-70ceb311959f',
      email: 'sami.mustafa@kelpieai.co.uk',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
    } as User;

    const MOCK_SESSION: Session = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      expires_at: Date.now() / 1000 + 3600,
      token_type: 'bearer',
      user: MOCK_USER,
    };

    const MOCK_PROFILE: UserProfile = {
      id: 'cf56b3ef-2fb1-4068-a603-70ceb311959f',
      email: 'sami.mustafa@kelpieai.co.uk',
      full_name: 'Sami Mustafa',
      username: 'sami',
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setUser(MOCK_USER);
    setSession(MOCK_SESSION);
    setProfile(MOCK_PROFILE);
    setLoading(false);

    // COMMENTED OUT: Real Supabase auth check
    // supabase.auth.getSession().then(({ data: { session } }) => {
    //   setSession(session);
    //   setUser(session?.user ?? null);
    //   if (session?.user) {
    //     fetchProfile(session.user.id);
    //   } else {
    //     setLoading(false);
    //   }
    // });

    // COMMENTED OUT: Real auth state change listener
    // const {
    //   data: { subscription },
    // } = supabase.auth.onAuthStateChange((_event, session) => {
    //   setSession(session);
    //   setUser(session?.user ?? null);
    //   if (session?.user) {
    //     fetchProfile(session.user.id);
    //   } else {
    //     setProfile(null);
    //     setLoading(false);
    //   }
    // });

    // return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error signing in:', error);
      return { data: null, error };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    username?: string,
    role: 'admin' | 'user' = 'user'
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username: username || email.split('@')[0],
            role: role,
          },
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error signing up:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Error signing out:', error);
      return { error };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Refresh profile
      await fetchProfile(user.id);
      return { error: null };
    } catch (error: any) {
      console.error('Error updating profile:', error);
      return { error };
    }
  };

  const isAdmin = profile?.role === 'admin';

  return {
    user,
    profile,
    session,
    loading,
    isAdmin,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };
};