import React, { useEffect } from 'react';
import useStore from './store/useStore';
import useAuthStore from './store/useAuthStore';
import { isSupabaseConfigured } from './lib/supabase';
import Sidebar from './components/Sidebar';
import EmailList from './components/EmailList';
import ReadingPane from './components/ReadingPane';
import LoginScreen from './components/LoginScreen';
import AuthLoadingScreen from './components/AuthLoadingScreen';

function App() {
  const { fetchEmails } = useStore();
  const { user, authLoading, authInitialized, initAuth, subscribeAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    const unsub = subscribeAuth();
    return unsub;
  }, [subscribeAuth]);

  useEffect(() => {
    if (user) fetchEmails();
  }, [user, fetchEmails]);

  const useAuth = isSupabaseConfigured();

  if (useAuth && authLoading) {
    return <AuthLoadingScreen />;
  }

  if (useAuth && authInitialized && !user) {
    return <LoginScreen />;
  }

  return (
    <div className="flex h-screen w-screen bg-black overflow-hidden font-sans">
      <Sidebar />
      <EmailList />
      <ReadingPane />
    </div>
  );
}

export default App;
