import { api } from '@src/services/ApiService';
import { ApiResponse } from '@src/types/api';

export interface ChatbotAskRequest {
  question: string;
  lang?: 'pt' | 'en';
}

export interface ChatbotSuggestion {
  id: string;
  question: string;
}

export interface ChatbotAskResponse {
  answer: string;
  matched: boolean;
  entryId: string | null;
  suggestions: ChatbotSuggestion[];
}

export interface ChatbotSuggestionsResponse {
  suggestions: ChatbotSuggestion[];
}

export const chatbotApi = {
  ask: (data: ChatbotAskRequest): Promise<ApiResponse<ChatbotAskResponse>> =>
    api.post('/chatbot/ask', data).then(response => response.data),

  getSuggestions: (lang: 'pt' | 'en'): Promise<ApiResponse<ChatbotSuggestionsResponse>> =>
    api.get('/chatbot/suggestions', { params: { lang } }).then(response => response.data),
};
