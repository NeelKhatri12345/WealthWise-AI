interface RiskFactor {
  name: string;
  value: number;
  maxValue: number;
  description: string;
  status: "good" | "warning" | "danger";
}
interface RiskFactorsProps {
  factors: RiskFactor[];
}
export declare const RiskFactors: ({
  factors,
}: RiskFactorsProps) => import("react").JSX.Element;
export {};
