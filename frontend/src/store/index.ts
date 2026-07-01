import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";

import {
  authReducer,
  dashboardReducer,
  uploadReducer,
  transactionReducer,
  healthScoreReducer,
  riskProfileReducer,
  portfolioReducer,
  coachReducer,
  notificationReducer,
  adminReducer,
  uiReducer,
} from "./slices";
import { apiMiddleware } from "./middleware/api.middleware";
import { loggerMiddleware } from "./middleware/logger.middleware";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    upload: uploadReducer,
    transactions: transactionReducer,
    healthScore: healthScoreReducer,
    riskProfile: riskProfileReducer,
    portfolio: portfolioReducer,
    coach: coachReducer,
    notifications: notificationReducer,
    admin: adminReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "upload/uploadStatement/pending",
          "upload/setSelectedFile",
        ],
        ignoredPaths: ["upload.selectedFile"],
      },
    }).concat(apiMiddleware, loggerMiddleware),
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export * from "./slices";
