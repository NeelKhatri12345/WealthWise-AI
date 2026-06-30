interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}
export declare const ChatInput: ({
  onSend,
  disabled,
  placeholder,
}: ChatInputProps) => import("react").JSX.Element;
export {};
