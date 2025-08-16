import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';

// Import reducers
import authReducer from './slices/authSlice';
import marketReducer from './slices/marketSlice';
import stockReducer from './slices/stockSlice';
import portfolioReducer from './slices/portfolioSlice';
import watchlistReducer from './slices/watchlistSlice';
import alertsReducer from './slices/alertsSlice';
import mlReducer from './slices/mlSlice';
import uiReducer from './slices/uiSlice';
import screenerReducer from './slices/screenerSlice';
import settingsReducer from './slices/settingsSlice';
import backtestReducer from './slices/backtestSlice';

// Import middleware
import authMiddleware from '../middleware/authMiddleware';

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  market: marketReducer,
  stock: stockReducer,
  portfolio: portfolioReducer,
  watchlist: watchlistReducer,
  alerts: alertsReducer,
  ml: mlReducer,
  ui: uiReducer,
  screener: screenerReducer,
  settings: settingsReducer,
  backtest: backtestReducer,
});

// Configure store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(authMiddleware),
});

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();

export default store;