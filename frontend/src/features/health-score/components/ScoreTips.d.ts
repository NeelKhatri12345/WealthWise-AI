interface Tip {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  category: string;
}
interface ScoreTipsProps {
  tips: Tip[];
}
export declare const ScoreTips: ({
  tips,
}: ScoreTipsProps) => import("react").JSX.Element;
export {};
