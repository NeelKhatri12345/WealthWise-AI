interface Recommendation {
    id: string;
    title: string;
    description: string;
    type: 'buy' | 'sell' | 'hold' | 'rebalance';
    confidence: number;
    asset?: string;
}
interface RecommendationListProps {
    recommendations: Recommendation[];
    onAction?: (id: string) => void;
}
export declare const RecommendationList: ({ recommendations, onAction }: RecommendationListProps) => import("react").JSX.Element;
export {};
