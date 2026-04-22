export interface AiConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  module?: string;
}

export interface AiInsight {
  id: string;
  type: 'info' | 'warning' | 'success' | 'suggestion';
  title: string;
  description: string;
  module: string;
  actionLabel?: string;
  actionPath?: string;
}

export interface AiSuggestion {
  id: string;
  type: string;
  label: string;
  value: string;
  confidence?: number;
}

export interface AiResponse {
  message: string;
  insights?: AiInsight[];
  suggestions?: AiSuggestion[];
}
