import React, { useEffect, useState } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

const API_BASE = 'http://localhost:3000';

const getAuthHeaders = () => {
  const session = useAuthStore.getState().session;
  const userId = session?.user?.id;
  return userId ? { 'X-User-Id': userId } : {};
};

const SettingsModal = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const [customInstructions, setCustomInstructions] = useState('');
  const [knowledge, setKnowledge] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    const load = async () => {
      setLoading(true);
      try {
        const headers = getAuthHeaders();
        const [settingsRes, knowledgeRes] = await Promise.all([
          axios.get(`${API_BASE}/api/settings`, { headers }).catch((e) => (e.response?.status === 401 ? { data: { customInstructions: '' } } : { data: null })),
          axios.get(`${API_BASE}/api/knowledge`, { headers })
        ]);
        setCustomInstructions(settingsRes?.data?.customInstructions ?? '');
        setKnowledge(knowledgeRes?.data || []);
      } catch (e) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen]);

  const saveInstructions = async () => {
    setError(null);
    const headers = getAuthHeaders();
    if (!headers['X-User-Id']) {
      setError('Sign in to save custom instructions.');
      return;
    }
    try {
      await axios.put(`${API_BASE}/api/settings`, { customInstructions }, { headers });
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  };

  const addKnowledge = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setError(null);
    try {
      const { data } = await axios.post(`${API_BASE}/api/knowledge`, {
        title: newTitle.trim(),
        content: newContent.trim(),
        type: 'NOTE'
      }, { headers: getAuthHeaders() });
      setKnowledge((k) => [data, ...k]);
      setNewTitle('');
      setNewContent('');
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  };

  const deleteKnowledge = async (id) => {
    setError(null);
    try {
      await axios.delete(`${API_BASE}/api/knowledge/${id}`, { headers: getAuthHeaders() });
      setKnowledge((k) => k.filter((i) => i.id !== id));
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {error && (
            <div className="p-3 bg-red-900/30 text-red-400 text-sm rounded">{error}</div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">Custom AI Instructions</h3>
            <p className="text-xs text-gray-500 mb-2">
              Tell Artemis how to prioritize and respond (e.g., &quot;Always be formal&quot;, &quot;Flag anything from legal&quot;).
            </p>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              onBlur={saveInstructions}
              placeholder="e.g., Be concise. Flag urgent legal matters. Use formal tone with executives."
              className="w-full h-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">Knowledge Base</h3>
            <p className="text-xs text-gray-500 mb-2">
              Upload context Artemis can use when analyzing emails (company info, preferences, etc.).
            </p>
            <div className="flex gap-2 mb-4">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Title"
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Content"
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={addKnowledge}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {knowledge.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-3 bg-gray-800 rounded border border-gray-700"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white truncate">{item.title}</div>
                    <div className="text-xs text-gray-400 truncate mt-0.5">{item.content}</div>
                  </div>
                  <button
                    onClick={() => deleteKnowledge(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-400 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {knowledge.length === 0 && !loading && (
                <p className="text-sm text-gray-500 py-4">No knowledge items yet.</p>
              )}
            </div>
          </div>

          {!user && (
            <p className="text-xs text-amber-500">
              Sign in with Google to save custom instructions and knowledge to your account.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
