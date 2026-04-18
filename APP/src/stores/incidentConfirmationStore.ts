import { create } from 'zustand';

interface PendingIncident {
  type: 'fall' | 'inactivity';
  detectedAt: string;
  magnitude?: number;
  inactiveDuration?: number;
  timeoutId?: ReturnType<typeof setTimeout>;
}

interface IncidentConfirmationStore {
  pendingIncident: PendingIncident | null;
  isModalVisible: boolean;

  setPendingIncident: (incident: Omit<PendingIncident, 'timeoutId'>, onTimeout: () => void) => void;
  confirmIncident: () => void;
  cancelIncident: () => void;
  clearIncident: () => void;
  getPendingIncident: () => PendingIncident | null;
}

export const useIncidentConfirmationStore = create<IncidentConfirmationStore>((set, get) => ({
  pendingIncident: null,
  isModalVisible: false,

  setPendingIncident: (incident, onTimeout) => {
    const current = get().pendingIncident;
    if (current?.timeoutId) {
      clearTimeout(current.timeoutId);
    }

    const timeoutId = setTimeout(() => {
      onTimeout();
      set({ isModalVisible: false, pendingIncident: null });
    }, 30000);

    set({
      pendingIncident: { ...incident, timeoutId },
      isModalVisible: true,
    });
  },

  confirmIncident: () => {
    const { pendingIncident } = get();
    if (pendingIncident?.timeoutId) {
      clearTimeout(pendingIncident.timeoutId);
    }
    set({ isModalVisible: false });
  },

  cancelIncident: () => {
    const { pendingIncident } = get();
    if (pendingIncident?.timeoutId) {
      clearTimeout(pendingIncident.timeoutId);
    }
    set({ isModalVisible: false, pendingIncident: null });
  },

  clearIncident: () => {
    const { pendingIncident } = get();
    if (pendingIncident?.timeoutId) {
      clearTimeout(pendingIncident.timeoutId);
    }
    set({ isModalVisible: false, pendingIncident: null });
  },

  getPendingIncident: () => {
    return get().pendingIncident;
  },
}));
