import React, { useEffect } from 'react';
import useStore from './store/useStore';
import Sidebar from './components/Sidebar';
import EmailList from './components/EmailList';
import ReadingPane from './components/ReadingPane';

function App() {
  const { fetchEmails } = useStore();

  useEffect(() => {
    fetchEmails();
  }, []); // Initial fetch

  return (
    <div className="flex h-screen w-screen bg-black overflow-hidden font-sans">
      <Sidebar />
      <EmailList />
      <ReadingPane />
    </div>
  );
}

export default App;
