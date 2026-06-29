import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { authReducer, dashboardReducer, uploadReducer, transactionReducer, healthScoreReducer, riskProfileReducer, portfolioReducer, coachReducer, notificationReducer, adminReducer, uiReducer, } from './slices';
import { apiMiddleware } from './middleware/api.middleware';
import { loggerMiddleware } from './middleware/logger.middleware';
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
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: {
            ignoredActions: ['upload/uploadFile/pending'],
            ignoredPaths: ['upload.currentFile'],
        },
    }).concat(apiMiddleware, loggerMiddleware),
    devTools: import.meta.env.DEV,
});
export const useAppDispatch = useDispatch;
export const useAppSelector = useSelector;
export * from './slices';
