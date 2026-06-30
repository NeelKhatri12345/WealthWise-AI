interface Question {
  id: string;
  text: string;
  options: Array<{
    value: string;
    label: string;
  }>;
}
interface RiskAssessmentProps {
  questions: Question[];
  onSubmit: (answers: Record<string, string>) => void;
  isLoading?: boolean;
}
export declare const RiskAssessment: ({
  questions,
  onSubmit,
  isLoading,
}: RiskAssessmentProps) => import("react").JSX.Element;
export {};
