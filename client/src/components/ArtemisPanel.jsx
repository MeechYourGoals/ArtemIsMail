import React from 'react';
import { Sparkles, Check, AlertCircle, Loader2 } from 'lucide-react';
import useStore from '../store/useStore';

const ArtemisPanel = ({ decision, email, emailId }) => {
  const { approveDraft, analyzeEmail, analyzingEmailId } = useStore();
  const isAnalyzing = analyzingEmailId === emailId;

  return (
    <div className="w-80 border-l border-gray-800 bg-gray-950 p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-6 text-purple-400">
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-semibold tracking-wider">ARTEMIS INTELLIGENCE</span>
      </div>

      {!decision ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-500 mb-4">No analysis yet</p>
          <button
            onClick={() => email && analyzeEmail(email)}
            disabled={isAnalyzing || !email}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded transition-colors"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
          </button>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-gray-500 uppercase">Analysis</h3>
              {email && (
                <button
                  onClick={() => analyzeEmail(email)}
                  disabled={isAnalyzing}
                  className="text-xs text-purple-400 hover:text-purple-300 disabled:opacity-50"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
                </button>
              )}
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{decision.reasoning}</p>
          </div>

          {decision.suggestedAction === 'DRAFT_REPLY' && (
            <div className="flex-1 flex flex-col">
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Draft Reply</h3>
              <div className="bg-gray-900 p-3 rounded text-sm text-gray-300 whitespace-pre-wrap flex-1 overflow-y-auto border border-gray-800">
                {decision.draftReply}
              </div>

              <button
                onClick={() => approveDraft(emailId)}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded flex items-center justify-center gap-2 text-sm font-medium transition-colors"
              >
                {decision.status === 'APPROVED' ? (
                  <>
                    <Check className="w-4 h-4" /> Approved
                  </>
                ) : (
                  "Artemis Approved"
                )}
              </button>
            </div>
          )}

          {decision.suggestedAction === 'ARCHIVE' && (
            <div className="mt-4 p-3 bg-gray-900 rounded border border-gray-800 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-400">Suggested Action: Archive</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ArtemisPanel;
