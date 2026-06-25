interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const ChatMessage = ({ role, content, timestamp }: ChatMessageProps) => {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        {!isUser && (
          <p className="mb-1 text-xs font-medium text-indigo-600">AI Coach</p>
        )}
        <p className="text-sm whitespace-pre-wrap">{content}</p>
        <p
          className={`mt-1 text-xs ${
            isUser ? 'text-indigo-200' : 'text-gray-400'
          }`}
        >
          {timestamp}
        </p>
      </div>
    </div>
  );
};
