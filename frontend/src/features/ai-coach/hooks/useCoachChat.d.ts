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
export declare const useCoachChat: () => UseCoachChatReturn;
export {};
