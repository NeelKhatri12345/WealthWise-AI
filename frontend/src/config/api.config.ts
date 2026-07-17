import { env } from "./env";

export const apiConfig = {
  baseURL: env.API_BASE_URL,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
} as const;
