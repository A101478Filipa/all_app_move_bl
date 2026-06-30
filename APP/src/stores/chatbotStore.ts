import { create } from 'zustand';
import { ChatbotAction } from '@src/api/endpoints/chatbot';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  action?: ChatbotAction | null;
}

interface ChatbotStore {
  isOpen: boolean;
  messages: ChatMessage[];
  /** Extra vertical offset (in px) added to the FAB's bottom, so a screen
   *  with its own floating action button can push the assistant out of the way. */
  fabOffset: number;
  open: () => void;
  close: () => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  setFabOffset: (offset: number) => void;
}

export const useChatbotStore = create<ChatbotStore>((set) => ({
  isOpen: false,
  messages: [],
  fabOffset: 0,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
  setFabOffset: (offset) => set({ fabOffset: offset }),
}));
