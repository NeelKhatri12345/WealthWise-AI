interface AllocationSlice {
  name: string;
  percentage: number;
  value: number;
  color?: string;
}
interface AllocationChartProps {
  data: AllocationSlice[];
  title?: string;
}
export declare const AllocationChart: ({
  data,
  title,
}: AllocationChartProps) => import("react").JSX.Element;
export {};
