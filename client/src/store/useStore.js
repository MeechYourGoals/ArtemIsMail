import { create } from 'zustand';
import axios from 'axios';

const useStore = create((set, get) => ({
  demoMode: true,
  emails: [],
  selectedEmail: null,
  loading: false,

  toggleDemoMode: async () => {
    const newMode = !get().demoMode;
    set({ demoMode: newMode, selectedEmail: null });
    await get().fetchEmails();
  },

  fetchEmails: async () => {
    set({ loading: true });
    try {
      const mode = get().demoMode ? 'demo' : 'live';
      const response = await axios.get(`http://localhost:3000/api/emails?mode=${mode}`);
      set({ emails: response.data, loading: false });
    } catch (error) {
      console.error(error);
      set({ emails: [], loading: false });
    }
  },

  selectEmail: (email) => set({ selectedEmail: email }),

  // Mock Action: Approve Draft
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
