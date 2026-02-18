import React from 'react';
import { Mail } from 'lucide-react';

const AuthLoadingScreen = () => (
  <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
    <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4 animate-pulse">
      <Mail className="w-8 h-8 text-white" />
    </div>
    <p className="text-gray-400 text-sm">Loading...</p>
    <p className="text-gray-600 text-xs mt-2">This should only take a moment</p>
  </div>
);

export default AuthLoadingScreen;
