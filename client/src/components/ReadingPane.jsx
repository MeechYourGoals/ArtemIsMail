import React from 'react';
import useStore from '../store/useStore';
import ArtemisPanel from './ArtemisPanel';

const ReadingPane = () => {
  const { selectedEmail } = useStore();

  if (!selectedEmail) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black text-gray-600">
        Select an email to read
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-black h-screen overflow-hidden">
      <div className="flex-1 flex flex-col p-8 overflow-y-auto">
        <h1 className="text-2xl font-bold text-white mb-4">{selectedEmail.subject}</h1>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 text-xs">
            {selectedEmail.from[0].toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-white font-medium">{selectedEmail.from}</span>
            <span className="text-xs text-gray-500">to {selectedEmail.to}</span>
          </div>
          <span className="ml-auto text-xs text-gray-500">
            {new Date(selectedEmail.date).toLocaleString()}
          </span>
        </div>

        <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
          {selectedEmail.body}
        </div>
      </div>

      {/* Right Rail: Artemis */}
      <ArtemisPanel decision={selectedEmail.decision} email={selectedEmail} emailId={selectedEmail.id} />
    </div>
  );
};

export default ReadingPane;
