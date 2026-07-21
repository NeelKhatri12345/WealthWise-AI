import { useAppSelector } from "@/store";
import { Avatar } from "@/components/ui/Avatar";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export const ChatMessage = ({ role, content, timestamp }: ChatMessageProps) => {
  const isUser = role === "user";
  const user = useAppSelector((state) => state.auth.user);
  
  const userName = user?.fullName || user?.email || "User";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shadow-sm">
          <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser ? "bg-primary-600 text-white rounded-tr-sm" : "bg-white border border-wealth-border text-gray-800 rounded-tl-sm"
        }`}
      >
        {!isUser && (
          <p className="mb-1 text-xs font-semibold text-primary-600">Ask AI</p>
        )}
        <p className={`text-sm whitespace-pre-wrap leading-relaxed ${isUser ? "text-white" : ""}`}>{content}</p>
        <p
          className={`mt-1 text-[10px] ${
            isUser ? "text-primary-100" : "text-wealth-muted"
          }`}
        >
          {timestamp}
        </p>
      </div>

      {isUser && (
        <Avatar name={userName} size="sm" className="flex-shrink-0 shadow-sm" />
      )}
    </div>
  );
};
