import { configureStore, combineReducers } from "@reduxjs/toolkit";
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
  portfolioHoldingReducer,
  coachReducer,
  aiCoachReducer,
  notificationReducer,
  adminReducer,
  uiReducer,
  statementReviewReducer,
  financialProfileReducer,
  financialAnalysisReducer,
  investmentRecommendationReducer,
} from "./slices";
import { apiMiddleware } from "./middleware/api.middleware";
import { loggerMiddleware } from "./middleware/logger.middleware";

const appReducer = combineReducers({
  auth: authReducer,
  dashboard: dashboardReducer,
  upload: uploadReducer,
  transactions: transactionReducer,
  healthScore: healthScoreReducer,
  riskProfile: riskProfileReducer,
  portfolio: portfolioReducer,
  portfolioHoldings: portfolioHoldingReducer,
  coach: coachReducer,
  aiCoach: aiCoachReducer,
  financialAnalysis: financialAnalysisReducer,
  notifications: notificationReducer,
  admin: adminReducer,
  ui: uiReducer,
  statementReview: statementReviewReducer,
  financialProfile: financialProfileReducer,
  investmentRecommendation: investmentRecommendationReducer,
});

import type { UnknownAction } from "@reduxjs/toolkit";

const rootReducer = (state: ReturnType<typeof appReducer> | undefined, action: UnknownAction) => {
  if (
    action.type === "auth/logout/fulfilled" ||
    action.type === "auth/logout/rejected" ||
    action.type === "auth/deleteAccount/fulfilled"
  ) {
    // When logging out or deleting account, clear all slice states to prevent stale state leakages.
    // Setting state = undefined resets the state of all reducers back to their initialState.
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
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
