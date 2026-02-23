import React from 'react';
import useStore from '../store/useStore';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

const EmailList = () => {
  const { emails, selectedEmail, selectEmail, loading } = useStore();

  if (loading) return <div className="w-80 border-r border-gray-800 bg-black text-gray-500 p-4">Loading...</div>;

  return (
    <div className="w-96 flex flex-col border-r border-gray-800 bg-black">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-white font-semibold">Inbox</h2>
        <div className="text-xs text-gray-500 mt-1">{emails.length} messages</div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {emails.map((email) => (
          <div
            key={email.id}
            onClick={() => selectEmail(email)}
            className={clsx(
              "p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-900 transition-colors",
              selectedEmail?.id === email.id ? "bg-gray-900 border-l-2 border-l-blue-500" : "border-l-2 border-l-transparent",
              !email.isRead && "font-semibold text-white"
            )}
          >
            <div className="flex justify-between items-start mb-1">
              <span className={clsx("text-sm truncate", !email.isRead ? "text-white" : "text-gray-400")}>
                {email.from.split('<')[0]}
              </span>
              <span className="text-xs text-gray-600 whitespace-nowrap ml-2">
                {formatDistanceToNow(new Date(email.date), { addSuffix: true })}
              </span>
            </div>
            <div className="text-sm text-gray-300 truncate mb-1">{email.subject}</div>
            <div className="text-xs text-gray-500 truncate">{email.snippet}</div>

            <div className="flex gap-2 mt-2">
              <span className={clsx(
                "text-[10px] px-1.5 py-0.5 rounded font-medium",
                email.priority === 'CRITICAL' ? "bg-red-900/30 text-red-400" :
                email.priority === 'IMPORTANT' ? "bg-amber-900/30 text-amber-400" :
                "bg-gray-800 text-gray-400"
              )}>
                {email.priority}
              </span>
              <span className={clsx(
                "text-[10px] px-1.5 py-0.5 rounded font-medium",
                email.score > 80 ? "bg-green-900/30 text-green-400" : "bg-gray-800 text-gray-400"
              )}>
                {email.score}/100
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmailList;
