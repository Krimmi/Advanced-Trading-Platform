// Base API Service
export { BaseApiService, ApiError } from './BaseApiService';

// Market Data Services
export { 
  MarketDataService,
  MarketQuote,
  MarketHistoricalPrice,
  MarketSearchResult
} from './marketData/MarketDataService';
export { AlphaVantageService, alphaVantageService } from './marketData/AlphaVantageService';
export { PolygonService, polygonService } from './marketData/PolygonService';
export { IEXCloudService, iexCloudService } from './marketData/IEXCloudService';
export { mockMarketDataProvider } from './marketData/MockMarketDataProvider';
export { 
  MarketDataServiceFactory, 
  marketDataService,
  MarketDataProvider
} from './marketData/MarketDataServiceFactory';

// Trading Services
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
} from './trading/AlpacaService';
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
} from './trading/InteractiveBrokersService';
export { mockTradingProvider } from './trading/MockTradingProvider';
export {
  TradingServiceFactory,
  tradingService,
  TradingProvider,
  Account,
  Position,
  Order,
  OrderRequest
} from './trading/TradingServiceFactory';

// Financial Data Services
export {
  IFinancialDataService,
  IncomeStatement,
  BalanceSheet,
  CashFlowStatement,
  CompanyProfile,
  FinancialRatios,
  Earnings,
  FinancialPeriod
} from './financialData/FinancialDataService';
export { FinancialModelingPrepService, financialModelingPrepService } from './financialData/FinancialModelingPrepService';
export { QuandlService, quandlService } from './financialData/QuandlService';
export { mockFinancialDataProvider } from './financialData/MockFinancialDataProvider';
export {
  FinancialDataServiceFactory,
  financialDataService,
  FinancialDataProvider
} from './financialData/FinancialDataServiceFactory';

// News and Sentiment Services
export {
  INewsService,
  NewsArticle,
  NewsSearchParams,
  NewsSearchResponse,
  SentimentAnalysis,
  SentimentTrendPoint,
  SentimentTrendResponse
} from './news/NewsService';
export { NewsApiService, newsApiService } from './news/NewsApiService';
export { FinnhubService, finnhubService } from './news/FinnhubService';
export { mockNewsProvider } from './news/MockNewsProvider';
export {
  NewsServiceFactory,
  newsService,
  NewsProvider
} from './news/NewsServiceFactory';