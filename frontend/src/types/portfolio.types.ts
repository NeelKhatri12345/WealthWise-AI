export interface PortfolioRecommendation {
  id: string;
  title: string;
  description: string;
  type: "buy" | "sell" | "hold" | "rebalance";
  confidence: number;
  assets: Asset[];
  createdAt: string;
}

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  type: "stock" | "bond" | "mutual_fund" | "etf" | "crypto" | "real_estate";
  currentValue: number;
  allocation: number;
  returns: number;
}

export interface Allocation {
  category: string;
  current: number;
  recommended: number;
  difference: number;
}
