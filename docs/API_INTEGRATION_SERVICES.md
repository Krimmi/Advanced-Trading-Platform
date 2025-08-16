# API Integration Services Documentation

## Overview

This document provides comprehensive documentation for the API integration services implemented in the Hedge Fund Trading Application. These services provide a unified interface for interacting with various external data providers and trading platforms.

## Table of Contents

1. [Architecture](#architecture)
2. [Base API Service](#base-api-service)
3. [Market Data Services](#market-data-services)
4. [Trading Services](#trading-services)
5. [Financial Data Services](#financial-data-services)
6. [News and Sentiment Services](#news-and-sentiment-services)
7. [Configuration](#configuration)
8. [Error Handling](#error-handling)
9. [Caching](#caching)
10. [Mock Providers](#mock-providers)
11. [Usage Examples](#usage-examples)
12. [Testing](#testing)

## Architecture

The API integration services follow a layered architecture:

1. **Base Layer**: `BaseApiService` provides common functionality for all API services.
2. **Service Interfaces**: Define the contract for each service type.
3. **Provider Implementations**: Implement service interfaces for specific providers.
4. **Factory Classes**: Provide a unified interface to access the best available service.
5. **Mock Providers**: Provide mock data for development and testing.

This architecture ensures:

- **Consistency**: All services follow the same patterns and error handling.
- **Flexibility**: New providers can be added without changing consumer code.
- **Fallback Mechanism**: If a preferred provider fails, the system can automatically try alternatives.
- **Mock Data**: The application works even without API keys.

## Base API Service

The `BaseApiService` is an abstract class that provides common functionality for all API services:

- HTTP request methods (GET, POST, PUT, DELETE)
- Error handling and retry logic
- Request/response interceptors
- Response caching
- Authentication header management

### Key Features

- **Automatic Retries**: Automatically retries failed requests with exponential backoff.
- **Caching**: Caches responses to reduce API calls and improve performance.
- **Error Transformation**: Transforms provider-specific errors into a consistent format.

### Usage

```typescript
// Example of extending BaseApiService
export class MyApiService extends BaseApiService {
  constructor() {
    super('https://api.example.com');
  }
  
  async getData(): Promise<any> {
    return this.get('/data');
  }
}
```

## Market Data Services

Market data services provide access to stock quotes, historical prices, and other market data.

### Providers

- **AlphaVantage**: Provides stock quotes, historical prices, and technical indicators.
- **Polygon**: Provides real-time and historical market data.
- **IEX Cloud**: Provides financial data and market information.

### Factory

The `MarketDataServiceFactory` provides a unified interface to access market data:

```typescript
// Get a quote for a symbol
const quote = await marketDataService.getQuote('AAPL');

// Get historical prices
const prices = await marketDataService.getHistoricalPrices('AAPL', '1m');

// Search for symbols
const results = await marketDataService.searchSymbols('Apple');
```

## Trading Services

Trading services provide access to trading platforms for executing orders and managing positions.

### Providers

- **Alpaca**: Provides commission-free trading API for stocks and ETFs.
- **Interactive Brokers**: Provides a comprehensive trading API for multiple asset classes.

### Additional Services

- **OrderManagementService**: Manages order submission, cancellation, and tracking.
- **PositionTrackingService**: Tracks positions and calculates portfolio metrics.
- **TradingHistoryService**: Analyzes past trades and calculates performance metrics.

### Factory

The `TradingServiceFactory` provides a unified interface to access trading services:

```typescript
// Get account information
const account = await tradingService.getAccount();

// Get positions
const positions = await tradingService.getPositions();

// Submit an order
const order = await tradingService.createOrder({
  symbol: 'AAPL',
  side: 'buy',
  type: 'market',
  quantity: 10
});

// Cancel an order
await tradingService.cancelOrder('order123');
```

## Financial Data Services

Financial data services provide access to fundamental financial data such as income statements, balance sheets, and company profiles.

### Providers

- **Financial Modeling Prep**: Provides comprehensive financial data and ratios.
- **Quandl**: Provides alternative financial data and economic indicators.

### Factory

The `FinancialDataServiceFactory` provides a unified interface to access financial data:

```typescript
// Get income statements
const incomeStatements = await financialDataService.getIncomeStatements('AAPL', 'annual', 5);

// Get balance sheets
const balanceSheets = await financialDataService.getBalanceSheets('AAPL', 'annual', 5);

// Get cash flow statements
const cashFlowStatements = await financialDataService.getCashFlowStatements('AAPL', 'annual', 5);

// Get company profile
const profile = await financialDataService.getCompanyProfile('AAPL');

// Get financial ratios
const ratios = await financialDataService.getFinancialRatios('AAPL');

// Get earnings data
const earnings = await financialDataService.getEarnings('AAPL');

// Get economic data (Quandl-specific)
const gdpData = await financialDataService.getEconomicData('FRED/GDP');
```

## News and Sentiment Services

News and sentiment services provide access to financial news and sentiment analysis.

### Providers

- **NewsAPI**: Provides access to news articles from various sources.
- **Finnhub**: Provides financial news and sentiment analysis.

### Factory

The `NewsServiceFactory` provides a unified interface to access news and sentiment data:

```typescript
// Search for news articles
const newsResults = await newsService.searchNews({
  query: 'Tesla earnings',
  from: '2023-01-01',
  to: '2023-01-31'
});

// Get news for a specific symbol
const symbolNews = await newsService.getSymbolNews('AAPL', 10);

// Get top news
const topNews = await newsService.getTopNews('business', 5);

// Get sentiment analysis for a symbol
const sentiment = await newsService.getSentiment('AAPL');

// Get sentiment trend for a symbol
const sentimentTrend = await newsService.getSentimentTrend('AAPL', 30);
```

## Configuration

API services are configured through the `apiConfig.ts` file, which provides:

- API key management
- Data source configuration
- Caching settings
- Mock data settings

### Environment-Specific Configuration

The application uses environment-specific configuration files to manage different settings for development, staging, and production environments.

```typescript
// Example of accessing environment configuration
import { config } from '../config/environments';

// Use environment-specific settings
const apiUrl = config.apiUrl;
const cacheTTL = config.cacheTTL.marketData;
```

## Error Handling

All API services use a consistent error handling approach:

1. Provider-specific errors are transformed into `ApiError` instances.
2. Errors include status codes, messages, and additional data.
3. Retry logic is applied for transient errors.
4. Errors are logged and tracked with Sentry.

### Error Types

- **Network Errors**: Connection issues, timeouts, etc.
- **API Errors**: Invalid requests, authentication failures, etc.
- **Rate Limiting**: Too many requests to the API.
- **Data Errors**: Invalid or unexpected data formats.

## Caching

API responses are cached to improve performance and reduce API calls:

- Each service type has its own cache TTL (Time To Live).
- Cache can be bypassed for real-time data.
- Cache can be cleared manually.

### Cache Configuration

```typescript
// Cache TTL settings
cacheTTL: {
  marketData: 60000, // 1 minute
  fundamentalData: 86400000, // 24 hours
  newsData: 300000, // 5 minutes
  portfolioData: 60000 // 1 minute
}
```

## Mock Providers

Mock providers generate realistic data for development and testing:

- **MockMarketDataProvider**: Generates mock market data.
- **MockTradingProvider**: Simulates trading operations.
- **MockFinancialDataProvider**: Generates mock financial data.
- **MockNewsProvider**: Generates mock news and sentiment data.

### Usage

Mock providers are used automatically when:

1. API keys are not configured.
2. `forceMockData` is set to `true` in the configuration.
3. As a fallback when API calls fail.

## Usage Examples

### Basic Usage

```typescript
// Import the factory
import { marketDataService } from '../services/api/marketData/MarketDataServiceFactory';

// Use the service
async function getStockData(symbol: string) {
  try {
    const quote = await marketDataService.getQuote(symbol);
    const historicalPrices = await marketDataService.getHistoricalPrices(symbol, '1m');
    
    return {
      quote,
      historicalPrices
    };
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    throw error;
  }
}
```

### Using with React Components

```tsx
import React, { useState, useEffect } from 'react';
import { marketDataService } from '../services/api/marketData/MarketDataServiceFactory';

const StockQuote: React.FC<{ symbol: string }> = ({ symbol }) => {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchQuote = async () => {
      try {
        setLoading(true);
        const data = await marketDataService.getQuote(symbol);
        setQuote(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuote();
  }, [symbol]);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h2>{symbol}</h2>
      <p>Price: ${quote.price}</p>
      <p>Change: {quote.change} ({quote.changePercent}%)</p>
    </div>
  );
};
```

### Advanced Usage with Performance Monitoring

```typescript
import { marketDataService } from '../services/api/marketData/MarketDataServiceFactory';
import { performanceMonitoring, MetricType } from '../services/monitoring/performanceMonitoring';

async function getMarketData(symbols: string[]) {
  const metricId = performanceMonitoring.startMetric(
    'getMarketData',
    MetricType.API_CALL,
    { symbolCount: symbols.length }
  );
  
  try {
    const quotes = await Promise.all(
      symbols.map(symbol => marketDataService.getQuote(symbol))
    );
    
    performanceMonitoring.endMetric(metricId, true, { quoteCount: quotes.length });
    return quotes;
  } catch (error) {
    performanceMonitoring.endMetric(metricId, false, { error: error.message });
    throw error;
  }
}
```

## Testing

Each service has corresponding unit tests to ensure proper functionality:

- **Factory Tests**: Test the factory's provider selection logic.
- **Service Tests**: Test individual service implementations.
- **Mock Provider Tests**: Test mock data generation.
- **Integration Tests**: Test the complete flow from request to response.

### Example Test

```typescript
describe('MarketDataServiceFactory', () => {
  it('should return the best available service', () => {
    // Setup
    (API_KEYS as any).polygon = 'test-key';
    (polygonService.isAvailable as jest.Mock).mockReturnValue(true);
    
    // Execute
    const service = marketDataService.getBestAvailableService();
    
    // Verify
    expect(service).toBe(polygonService);
  });
  
  it('should get quote from the selected service', async () => {
    // Setup
    const mockQuote = { symbol: 'AAPL', price: 150 };
    (polygonService.getQuote as jest.Mock).mockResolvedValue(mockQuote);
    
    // Execute
    const quote = await marketDataService.getQuote('AAPL');
    
    // Verify
    expect(polygonService.getQuote).toHaveBeenCalledWith('AAPL');
    expect(quote).toEqual(mockQuote);
  });
});
```