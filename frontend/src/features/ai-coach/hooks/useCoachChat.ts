import { useState, useCallback } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface UseCoachChatReturn {
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  isTyping: boolean;
  clearChat: () => void;
}

export const useCoachChat = (): UseCoachChatReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // TODO: Replace with actual API call to AI coach endpoint
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: `Thank you for your question about "${content}". I'm analyzing your financial data to provide personalized advice. This feature will be connected to the AI backend soon.`,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, sendMessage, isTyping, clearChat };
};
