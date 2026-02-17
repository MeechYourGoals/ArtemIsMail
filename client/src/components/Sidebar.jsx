import React from 'react';
import useStore from '../store/useStore';
import { Mail, Search, Clock, Archive, Settings, ToggleLeft, ToggleRight } from 'lucide-react';

const Sidebar = () => {
  const { demoMode, toggleDemoMode } = useStore();

  return (
    <div className="w-16 flex flex-col items-center py-4 bg-gray-900 text-gray-400 border-r border-gray-800">
      <div className="mb-8 text-white">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">A</div>
      </div>

      <div className="flex flex-col gap-6 flex-1">
        <Mail className="w-5 h-5 text-white cursor-pointer" />
        <Search className="w-5 h-5 hover:text-white cursor-pointer" />
        <Clock className="w-5 h-5 hover:text-white cursor-pointer" />
        <Archive className="w-5 h-5 hover:text-white cursor-pointer" />
      </div>

      <div className="mt-auto flex flex-col gap-6 items-center">
        <div
          onClick={toggleDemoMode}
          className="cursor-pointer tooltip"
          title={demoMode ? "Demo Mode ON" : "Live Mode"}
        >
          {demoMode ? (
            <ToggleRight className="w-6 h-6 text-green-500" />
          ) : (
            <ToggleLeft className="w-6 h-6 text-gray-500" />
          )}
        </div>
        <Settings className="w-5 h-5 hover:text-white cursor-pointer" />
      </div>
    </div>
  );
};

export default Sidebar;
