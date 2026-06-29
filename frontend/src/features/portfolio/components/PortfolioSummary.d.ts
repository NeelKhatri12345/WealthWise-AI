interface PortfolioSummaryProps {
    totalValue: number;
    totalChange: number;
    totalChangePercent: number;
    assetCount: number;
    lastUpdated?: string;
}
export declare const PortfolioSummary: ({ totalValue, totalChange, totalChangePercent, assetCount, lastUpdated, }: PortfolioSummaryProps) => import("react").JSX.Element;
export {};
