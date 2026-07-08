import axiosInstance, { type ApiResponse } from "./axiosInstance";

export interface PortfolioHolding {
  id: string;
  assetName: string;
  assetType: string;
  symbol?: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  currentValue: number;
  investedValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  purchaseDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface RawPortfolioHolding {
  id: string;
  asset_name: string;
  asset_type: string;
  symbol?: string | null;
  quantity: string | number;
  average_buy_price: string | number;
  current_price: string | number;
  current_value: string | number;
  invested_value: string | number;
  profit_loss: string | number;
  profit_loss_percentage: string | number;
  purchase_date: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

function toNumber(value: string | number): number {
  return typeof value === "string" ? parseFloat(value) : value;
}

function mapHolding(raw: RawPortfolioHolding): PortfolioHolding {
  return {
    id: raw.id,
    assetName: raw.asset_name,
    assetType: raw.asset_type,
    symbol: raw.symbol || undefined,
    quantity: toNumber(raw.quantity),
    averageBuyPrice: toNumber(raw.average_buy_price),
    currentPrice: toNumber(raw.current_price),
    currentValue: toNumber(raw.current_value),
    investedValue: toNumber(raw.invested_value),
    profitLoss: toNumber(raw.profit_loss),
    profitLossPercentage: toNumber(raw.profit_loss_percentage),
    purchaseDate: raw.purchase_date,
    notes: raw.notes || undefined,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export interface PortfolioHoldingInput {
  assetName: string;
  assetType: string;
  symbol?: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  purchaseDate: string;
  notes?: string;
}

function toPayload(input: Partial<PortfolioHoldingInput>) {
  return {
    asset_name: input.assetName,
    asset_type: input.assetType,
    symbol: input.symbol === undefined ? undefined : (input.symbol || null),
    quantity: input.quantity,
    average_buy_price: input.averageBuyPrice,
    current_price: input.currentPrice,
    purchase_date: input.purchaseDate,
    notes: input.notes === undefined ? undefined : (input.notes || null),
  };
}

export const portfolioHoldingApi = {
  async getHoldings(): Promise<PortfolioHolding[]> {
    const { data } = await axiosInstance.get<ApiResponse<RawPortfolioHolding[]>>(
      "/portfolio",
    );
    return data.data.map(mapHolding);
  },

  async getHolding(id: string): Promise<PortfolioHolding> {
    const { data } = await axiosInstance.get<ApiResponse<RawPortfolioHolding>>(
      `/portfolio/${id}`,
    );
    return mapHolding(data.data);
  },

  async createHolding(input: PortfolioHoldingInput): Promise<PortfolioHolding> {
    const { data } = await axiosInstance.post<ApiResponse<RawPortfolioHolding>>(
      "/portfolio",
      toPayload(input),
    );
    return mapHolding(data.data);
  },

  async updateHolding(
    id: string,
    input: Partial<PortfolioHoldingInput>,
  ): Promise<PortfolioHolding> {
    const { data } = await axiosInstance.put<ApiResponse<RawPortfolioHolding>>(
      `/portfolio/${id}`,
      toPayload(input),
    );
    return mapHolding(data.data);
  },

  async deleteHolding(id: string): Promise<void> {
    await axiosInstance.delete(`/portfolio/${id}`);
  },
};
