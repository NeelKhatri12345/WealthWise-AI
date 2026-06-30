interface CategoryData {
  name: string;
  amount: number;
  color?: string;
}
interface CategoryBreakdownProps {
  data: CategoryData[];
  title?: string;
}
export declare const CategoryBreakdown: ({
  data,
  title,
}: CategoryBreakdownProps) => import("react").JSX.Element;
export {};
