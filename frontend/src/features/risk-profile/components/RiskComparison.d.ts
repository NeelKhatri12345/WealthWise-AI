interface BenchmarkData {
  label: string;
  userValue: number;
  benchmarkValue: number;
  unit?: string;
}
interface RiskComparisonProps {
  benchmarks: BenchmarkData[];
}
export declare const RiskComparison: ({
  benchmarks,
}: RiskComparisonProps) => import("react").JSX.Element;
export {};
