interface AdviceCardProps {
  title: string;
  description: string;
  category: string;
  actionLabel?: string;
  onAction?: () => void;
}
export declare const AdviceCard: ({
  title,
  description,
  category,
  actionLabel,
  onAction,
}: AdviceCardProps) => import("react").JSX.Element;
export {};
