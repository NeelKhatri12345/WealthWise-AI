const requiredEnvVars = ["VITE_API_BASE_URL"] as const;

function getEnvVar(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function validateEnv() {
  for (const key of requiredEnvVars) {
    getEnvVar(key);
  }
}

if (import.meta.env.PROD) {
  validateEnv();
}

export const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1",
  APP_NAME: import.meta.env.VITE_APP_NAME ?? "WealthWise AI",
  APP_VERSION: import.meta.env.VITE_APP_VERSION ?? "0.1.0",
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;
