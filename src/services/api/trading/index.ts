// Export trading services
export { 
  TradingServiceFactory, 
  tradingService,
  TradingProvider,
  Account,
  Position,
  Order,
  OrderRequest
} from './TradingServiceFactory';

export {
  AlpacaService,
  alpacaService,
  OrderSide as AlpacaOrderSide,
  OrderType as AlpacaOrderType,
  TimeInForce as AlpacaTimeInForce,
  OrderStatus as AlpacaOrderStatus,
  Account as AlpacaAccount,
  Position as AlpacaPosition,
  Order as AlpacaOrder,
  OrderRequest as AlpacaOrderRequest
} from './AlpacaService';

export {
  InteractiveBrokersService,
  interactiveBrokersService,
  OrderSide as IBOrderSide,
  OrderType as IBOrderType,
  TimeInForce as IBTimeInForce,
  OrderStatus as IBOrderStatus,
  IBAccount,
  IBPosition,
  IBOrder,
  IBOrderRequest
} from './InteractiveBrokersService';

export { mockTradingProvider } from './MockTradingProvider';

// Export new trading services
export { 
  OrderManagementService, 
  orderManagementService,
  OrderStatusFilter
} from './OrderManagementService';

export { 
  PositionTrackingService, 
  positionTrackingService,
  PositionSummary,
  PortfolioSummary
} from './PositionTrackingService';

export { 
  TradingHistoryService, 
  tradingHistoryService,
  TradeExecution,
  TradePerformance,
  TradingHistoryFilter,
  TradingStatistics
} from './TradingHistoryService';