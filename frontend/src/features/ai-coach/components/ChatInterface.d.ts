interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}
interface ChatInterfaceProps {
    messages: Message[];
    onSendMessage: (message: string) => void;
    isTyping?: boolean;
}
export declare const ChatInterface: ({ messages, onSendMessage, isTyping }: ChatInterfaceProps) => import("react").JSX.Element;
export {};
