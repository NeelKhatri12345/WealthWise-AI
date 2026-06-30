interface RebalanceSuggestion {
  asset: string;
  currentAllocation: number;
  targetAllocation: number;
  action: "increase" | "decrease";
}
interface RebalanceAlertProps {
  suggestions: RebalanceSuggestion[];
  onRebalance?: () => void;
  onDismiss?: () => void;
}
export declare const RebalanceAlert: ({
  suggestions,
  onRebalance,
  onDismiss,
}: RebalanceAlertProps) => import("react").JSX.Element | null;
export {};
