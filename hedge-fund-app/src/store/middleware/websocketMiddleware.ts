import { Middleware, MiddlewareAPI, Dispatch, AnyAction } from 'redux';
import { RootState } from '../index';
import { websocketService, MessageType, ConnectionState } from '../../services/websocket';
import { updateMarketData } from '../slices/marketSlice';
import { updatePortfolioData } from '../slices/portfolioSlice';
import { updateTradingData } from '../slices/tradingSlice';
import { addAlert } from '../slices/alertsSlice';
import { addNotification } from '../slices/uiSlice';

// Action types
export const WEBSOCKET_CONNECT = 'websocket/connect';
export const WEBSOCKET_DISCONNECT = 'websocket/disconnect';
export const WEBSOCKET_SUBSCRIBE = 'websocket/subscribe';
export const WEBSOCKET_UNSUBSCRIBE = 'websocket/unsubscribe';
export const WEBSOCKET_SEND = 'websocket/send';

// Action creators
export const websocketConnect = () => ({ type: WEBSOCKET_CONNECT });
export const websocketDisconnect = () => ({ type: WEBSOCKET_DISCONNECT });
export const websocketSubscribe = (channel: string) => ({ 
  type: WEBSOCKET_SUBSCRIBE, 
  payload: { channel } 
});
export const websocketUnsubscribe = (channel: string) => ({ 
  type: WEBSOCKET_UNSUBSCRIBE, 
  payload: { channel } 
});
export const websocketSend = (message: any) => ({ 
  type: WEBSOCKET_SEND, 
  payload: { message } 
});

/**
 * WebSocket Middleware
 * 
 * This middleware handles WebSocket connections, subscriptions, and message processing.
 * It dispatches actions to update the Redux store based on incoming WebSocket messages.
 */
export const websocketMiddleware: Middleware = (api: MiddlewareAPI<Dispatch, RootState>) => {
  // Set up connection state handler
  websocketService.onConnectionStateChange((state) => {
    // Notify user of connection state changes
    switch (state) {
      case ConnectionState.CONNECTED:
        api.dispatch(addNotification({
          type: 'success',
          title: 'WebSocket Connected',
          message: 'Real-time data connection established',
          autoHideDuration: 3000,
        }));
        break;
        
      case ConnectionState.DISCONNECTED:
        api.dispatch(addNotification({
          type: 'warning',
          title: 'WebSocket Disconnected',
          message: 'Real-time data connection lost',
          autoHideDuration: 5000,
        }));
        break;
        
      case ConnectionState.RECONNECTING:
        api.dispatch(addNotification({
          type: 'info',
          title: 'Reconnecting',
          message: 'Attempting to reconnect to real-time data service',
          autoHideDuration: 3000,
        }));
        break;
        
      case ConnectionState.ERROR:
        api.dispatch(addNotification({
          type: 'error',
          title: 'Connection Error',
          message: 'Error connecting to real-time data service',
          autoHideDuration: 5000,
        }));
        break;
    }
  });
  
  // Set up message handlers for different message types
  websocketService.onMessage(MessageType.MARKET_DATA, (data) => {
    api.dispatch(updateMarketData(data));
  });
  
  websocketService.onMessage(MessageType.PORTFOLIO_UPDATE, (data) => {
    api.dispatch(updatePortfolioData(data));
  });
  
  websocketService.onMessage(MessageType.TRADE_EXECUTION, (data) => {
    api.dispatch(updateTradingData(data));
  });
  
  websocketService.onMessage(MessageType.ALERT, (data) => {
    api.dispatch(addAlert({
      id: data.id || `alert-${Date.now()}`,
      type: data.type || 'system',
      severity: data.severity || 'info',
      title: data.title,
      message: data.message,
      symbol: data.symbol,
      portfolioId: data.portfolioId,
      timestamp: data.timestamp || new Date().toISOString(),
      read: false,
      dismissed: false,
      actions: data.actions,
      metadata: data.metadata,
    }));
  });
  
  return (next: Dispatch) => (action: AnyAction) => {
    switch (action.type) {
      case WEBSOCKET_CONNECT:
        websocketService.connect().catch(error => {
          console.error('WebSocket connection error:', error);
          api.dispatch(addNotification({
            type: 'error',
            title: 'Connection Failed',
            message: 'Failed to connect to real-time data service',
            autoHideDuration: 5000,
          }));
        });
        break;
        
      case WEBSOCKET_DISCONNECT:
        websocketService.disconnect();
        break;
        
      case WEBSOCKET_SUBSCRIBE:
        websocketService.subscribe(action.payload.channel);
        break;
        
      case WEBSOCKET_UNSUBSCRIBE:
        websocketService.unsubscribe(action.payload.channel);
        break;
        
      case WEBSOCKET_SEND:
        websocketService.sendMessage(action.payload.message);
        break;
        
      default:
        // Pass all other actions to the next middleware or reducer
        return next(action);
    }
    
    // Pass the action to the next middleware or reducer
    return next(action);
  };
};

export default websocketMiddleware;