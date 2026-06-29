interface ChatMessageProps {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}
export declare const ChatMessage: ({ role, content, timestamp }: ChatMessageProps) => import("react").JSX.Element;
export {};
