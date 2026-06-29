type RiskLevel = 'low' | 'moderate' | 'high' | 'very-high';
interface RiskProfileWidgetProps {
    riskLevel: RiskLevel;
    riskScore: number;
    onClick?: () => void;
}
export declare const RiskProfileWidget: ({ riskLevel, riskScore, onClick }: RiskProfileWidgetProps) => import("react").JSX.Element;
export {};
