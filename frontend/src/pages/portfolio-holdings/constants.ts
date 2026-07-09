import type { SelectOption } from "@/types/common.types";

export const ASSET_TYPE_OPTIONS: SelectOption[] = [
  { label: "Stock", value: "stock" },
  { label: "Mutual Fund", value: "mutual_fund" },
  { label: "ETF", value: "etf" },
  { label: "Bonds", value: "bonds" },
  { label: "Fixed Deposit", value: "fixed_deposit" },
  { label: "Real Estate", value: "real_estate" },
  { label: "Gold", value: "gold" },
  { label: "Cryptocurrency", value: "cryptocurrency" },
  { label: "Other", value: "other" },
];
