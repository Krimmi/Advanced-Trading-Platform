import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Import slices
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import marketReducer from './slices/marketSlice';
import portfolioReducer from './slices/portfolioSlice';
import tradingReducer from './slices/tradingSlice';
import mlReducer from './slices/mlSlice';
import alertsReducer from './slices/alertsSlice';
import performanceReducer from './slices/performanceSlice';

// Import middleware
import { 
  websocketMiddleware, 
  apiMiddleware, 
  loggingMiddleware 
} from './middleware';

// Configure persist
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'ui'], // Only persist auth and ui
};

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  market: marketReducer,
  portfolio: portfolioReducer,
  trading: tradingReducer,
  ml: mlReducer,
  alerts: alertsReducer,
  performance: performanceReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST', 
          'persist/REHYDRATE',
          'websocket/connect',
          'websocket/disconnect',
          'websocket/subscribe',
          'websocket/unsubscribe',
          'websocket/send',
          'api/request',
          'api/success',
          'api/error'
        ],
        ignoredPaths: [
          'some.path.to.ignore',
          'ui.notifications',
          'market.quotes',
          'portfolio.portfolios',
          'trading.orders',
          'trading.trades',
          'alerts.alerts',
          'alerts.priceAlerts',
          'performance.components',
          'performance.apis'
        ],
      },
    }).concat(
      apiMiddleware,
      websocketMiddleware,
      process.env.NODE_ENV !== 'production' ? loggingMiddleware : []
    ),
});

export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;