import { api } from '@src/services/ApiService';
import { ApiResponse } from '@src/types/api';

export type ChatbotActionId =
  | 'account.settings'
  | 'account.notifications'
  | 'account.invitations'
  | 'account.external-professionals'
  | 'account.my-schedule'
  | 'institution.details'
  | 'tab.members'
  | 'tab.dashboard'
  | 'tab.profile';

export interface ChatbotAction {
  id: ChatbotActionId;
  label: string;
}

export interface ChatbotAskRequest {
  question: string;
  lang?: 'pt' | 'en';
  /** When set, the server skips keyword matching and returns this entry directly. */
  entryId?: string;
}

export interface ChatbotSuggestion {
  id: string;
  question: string;
}

export interface ChatbotAskResponse {
  answer: string;
  matched: boolean;
  entryId: string | null;
  action: ChatbotAction | null;
  /** Where the answer came from: curated knowledge base, LLM fallback,
   *  or static "I don't know" message. */
  source?: 'kb' | 'llm' | 'fallback';
  suggestions: ChatbotSuggestion[];
}

export interface ChatbotSuggestionsResponse {
  suggestions: ChatbotSuggestion[];
}

export interface ChatbotInitResponse {
  welcome: string;
  suggestions: ChatbotSuggestion[];
}

export const chatbotApi = {
  ask: (data: ChatbotAskRequest): Promise<ApiResponse<ChatbotAskResponse>> =>
    api.post('/chatbot/ask', data).then(response => response.data),

  getSuggestions: (lang: 'pt' | 'en'): Promise<ApiResponse<ChatbotSuggestionsResponse>> =>
    api.get('/chatbot/suggestions', { params: { lang } }).then(response => response.data),

  init: (lang: 'pt' | 'en'): Promise<ApiResponse<ChatbotInitResponse>> =>
    api.get('/chatbot/init', { params: { lang } }).then(response => response.data),
};
