import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AUTH_INIT_TIMEOUT_MS = 5000; // Prevent perpetual "Connecting" freeze

const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  authLoading: true,
  authError: null,
  authInitialized: false,

  initAuth: async () => {
    if (!isSupabaseConfigured() || !supabase) {
      set({ authLoading: false, authInitialized: true });
      return;
    }

    const timeoutId = setTimeout(() => {
      set((s) => {
        if (s.authLoading) {
          return {
            authLoading: false,
            authInitialized: true,
            authError: 'Connection timed out. Please try again.',
          };
        }
        return {};
      });
    }, AUTH_INIT_TIMEOUT_MS);

    try {
      // Handle OAuth callback: Supabase puts tokens in hash. Must process before getSession.
      const hashParams = new URLSearchParams(window.location.hash?.slice(1) || '');
      if (hashParams.get('access_token')) {
        const { data, error } = await supabase.auth.setSession({
          access_token: hashParams.get('access_token'),
          refresh_token: hashParams.get('refresh_token') || '',
        });
        if (!error) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      clearTimeout(timeoutId);

      if (error) {
        set({
          user: null,
          session: null,
          authLoading: false,
          authInitialized: true,
          authError: error.message,
        });
        return;
      }

      set({
        user: session?.user ?? null,
        session: session ?? null,
        authLoading: false,
        authInitialized: true,
        authError: null,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      set({
        user: null,
        session: null,
        authLoading: false,
        authInitialized: true,
        authError: err?.message || 'Failed to initialize auth',
      });
    }
  },

  signInWithGoogle: async () => {
    if (!supabase) {
      set({ authError: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' });
      return;
    }
    set({ authError: null });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
    if (error) set({ authError: error.message });
  },

  signOut: async () => {
    if (supabase) await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  subscribeAuth: () => {
    if (!supabase) return () => {};
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({
        user: session?.user ?? null,
        session: session ?? null,
        authError: null,
      });
    });
    return () => subscription.unsubscribe();
  },
}));

export default useAuthStore;
