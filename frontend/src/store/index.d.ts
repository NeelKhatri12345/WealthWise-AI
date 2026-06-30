import type { TypedUseSelectorHook } from "react-redux";
export declare const store: import("@reduxjs/toolkit").EnhancedStore<
  {
    auth: import("./slices").AuthState;
    dashboard: import("./slices").DashboardState;
    upload: import("./slices").UploadState;
    transactions: import("./slices").TransactionState;
    healthScore: import("./slices").HealthScoreState;
    riskProfile: import("./slices").RiskProfileState;
    portfolio: import("./slices").PortfolioState;
    coach: import("./slices").CoachState;
    notifications: import("./slices").NotificationState;
    admin: import("./slices").AdminState;
    ui: import("./slices").UIState;
  },
  import("redux").UnknownAction,
  import("@reduxjs/toolkit").Tuple<
    [
      import("redux").StoreEnhancer<{
        dispatch: import("redux-thunk").ThunkDispatch<
          {
            auth: import("./slices").AuthState;
            dashboard: import("./slices").DashboardState;
            upload: import("./slices").UploadState;
            transactions: import("./slices").TransactionState;
            healthScore: import("./slices").HealthScoreState;
            riskProfile: import("./slices").RiskProfileState;
            portfolio: import("./slices").PortfolioState;
            coach: import("./slices").CoachState;
            notifications: import("./slices").NotificationState;
            admin: import("./slices").AdminState;
            ui: import("./slices").UIState;
          },
          undefined,
          import("redux").UnknownAction
        >;
      }>,
      import("redux").StoreEnhancer,
    ]
  >
>;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export declare const useAppDispatch: () => AppDispatch;
export declare const useAppSelector: TypedUseSelectorHook<RootState>;
export * from "./slices";
