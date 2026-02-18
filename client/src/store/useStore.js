import { create } from 'zustand';
import axios from 'axios';
import useAuthStore from './useAuthStore';

const API_BASE = 'http://localhost:3000';

const getAuthHeaders = () => {
  const session = useAuthStore.getState().session;
  const userId = session?.user?.id;
  return userId ? { 'X-User-Id': userId } : {};
};

const useStore = create((set, get) => ({
  demoMode: true,
  emails: [],
  selectedEmail: null,
  loading: false,
  analyzingEmailId: null,

  toggleDemoMode: async () => {
    const newMode = !get().demoMode;
    set({ demoMode: newMode, selectedEmail: null });
    await get().fetchEmails();
  },

  fetchEmails: async () => {
    set({ loading: true });
    try {
      const mode = get().demoMode ? 'demo' : 'live';
      const response = await axios.get(`${API_BASE}/api/emails?mode=${mode}`);
      set({ emails: response.data, loading: false });
    } catch (error) {
      console.error(error);
      set({ emails: [], loading: false });
    }
  },

  selectEmail: (email) => set({ selectedEmail: email }),

  analyzeEmail: async (email) => {
    const { id, subject, body, from, to } = email;
    set({ analyzingEmailId: id });
    try {
      const { data } = await axios.post(`${API_BASE}/api/ai/analyze`, {
        subject,
        body,
        from,
        to
      }, { headers: getAuthHeaders() });

      const decision = {
        ...data,
        status: 'PENDING'
      };

      set((state) => ({
        emails: state.emails.map((e) =>
          e.id === id ? { ...e, decision } : e
        ),
        selectedEmail: state.selectedEmail?.id === id
          ? { ...state.selectedEmail, decision }
          : state.selectedEmail,
        analyzingEmailId: null
      }));
    } catch (error) {
      console.error(error);
      set({ analyzingEmailId: null });
    }
  },

  approveDraft: (emailId) => {
    set((state) => ({
      emails: state.emails.map(e =>
        e.id === emailId
          ? { ...e, decision: { ...e.decision, status: 'APPROVED' } }
          : e
      ),
      selectedEmail: state.selectedEmail?.id === emailId
        ? { ...state.selectedEmail, decision: { ...state.selectedEmail.decision, status: 'APPROVED' } }
        : state.selectedEmail
    }));
  }
}));

export default useStore;
