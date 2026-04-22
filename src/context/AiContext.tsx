import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import { AiConversationMessage, AiInsight } from '../Interfaces/ai';
import { askAi, getAiInsights } from '../services/aiApi';
import { v4 as uuid } from 'uuid';
import { useLocation } from 'react-router-dom';

interface AiContextValue {
  // Command palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // AI Chat
  aiChatOpen: boolean;
  setAiChatOpen: (open: boolean) => void;
  conversation: AiConversationMessage[];
  sendMessage: (message: string) => Promise<void>;
  clearConversation: () => void;
  isAiLoading: boolean;

  // AI Insights
  insights: Record<string, AiInsight[]>;
  loadInsights: (module: string, data?: Record<string, unknown>) => Promise<void>;
}

const AiContext = createContext<AiContextValue | null>(null);

export function AiProvider({ children }: { children: ReactNode }) {
  const location = useLocation();

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [conversation, setConversation] = useState<AiConversationMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [insights, setInsights] = useState<Record<string, AiInsight[]>>({});

  const currentModule = useMemo(() => {
    const path = location.pathname.split('/').filter(Boolean)[0] || 'dashboard';
    return path;
  }, [location.pathname]);

  const sendMessage = useCallback(
    async (message: string) => {
      const userMsg: AiConversationMessage = {
        id: uuid(),
        role: 'user',
        content: message,
        timestamp: new Date(),
        module: currentModule,
      };

      setConversation((prev) => [...prev, userMsg]);
      setIsAiLoading(true);

      try {
        const response = await askAi(message, { module: currentModule });

        const assistantMsg: AiConversationMessage = {
          id: uuid(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
          module: currentModule,
        };

        setConversation((prev) => [...prev, assistantMsg]);

        if (response.insights) {
          setInsights((prev) => ({
            ...prev,
            [currentModule]: response.insights!,
          }));
        }
      } catch (error) {
        const errorMsg: AiConversationMessage = {
          id: uuid(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        };
        setConversation((prev) => [...prev, errorMsg]);
      } finally {
        setIsAiLoading(false);
      }
    },
    [currentModule]
  );

  const clearConversation = useCallback(() => {
    setConversation([]);
  }, []);

  const loadInsights = useCallback(
    async (module: string, data?: Record<string, unknown>) => {
      try {
        const response = await getAiInsights(module, data);
        if (response.insights) {
          setInsights((prev) => ({
            ...prev,
            [module]: response.insights!,
          }));
        }
      } catch {
        // Silently fail for insights
      }
    },
    []
  );

  const value = useMemo(
    () => ({
      commandPaletteOpen,
      setCommandPaletteOpen,
      aiChatOpen,
      setAiChatOpen,
      conversation,
      sendMessage,
      clearConversation,
      isAiLoading,
      insights,
      loadInsights,
    }),
    [
      commandPaletteOpen,
      aiChatOpen,
      conversation,
      sendMessage,
      clearConversation,
      isAiLoading,
      insights,
      loadInsights,
    ]
  );

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>;
}

export function useAi(): AiContextValue {
  const ctx = useContext(AiContext);
  if (!ctx) throw new Error('useAi must be used within AiProvider');
  return ctx;
}
