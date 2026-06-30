interface AssetCardProps {
  name: string;
  ticker?: string;
  value: number;
  allocation: number;
  change: number;
  changePercent: number;
}
export declare const AssetCard: ({
  name,
  ticker,
  value,
  allocation,
  change,
  changePercent,
}: AssetCardProps) => import("react").JSX.Element;
export {};
