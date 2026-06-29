import { env } from "./env";
export const appConfig = {
    name: env.APP_NAME,
    version: env.APP_VERSION,
    description: "Smart Financial Management powered by AI",
    defaultPageSize: 20,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    supportedFileTypes: [".csv", ".xlsx", ".xls", ".pdf"],
    debounceMs: 300,
    tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
};
