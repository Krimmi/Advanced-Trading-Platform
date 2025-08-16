# API Integration Services Documentation

## Overview

This document provides an overview of the API integration services implemented for the Hedge Fund Trading Application. These services provide a unified interface for accessing market data from various providers, with built-in error handling, caching, and fallback mechanisms.

## Architecture

The API integration services follow a layered architecture:

1. **Base Service Layer**: Provides common functionality for all API services
2. **Provider-Specific Services**: Implement provider-specific API calls
3. **Service Factory Layer**: Provides a unified interface for accessing services
4. **Mock Data Layer**: Provides mock data when real APIs are unavailable

### Class Diagram

```
┌─────────────────────┐
│  BaseApiService     │
└─────────────────────┘
          ▲
          │
          │
┌─────────┴─────────┐
│                   │
│                   │
│                   │
┌─────────────┐ ┌───────────────┐ ┌───────────────┐
│AlphaVantage │ │PolygonService │ │IEXCloudService│
│  Service    │ │               │ │               │
└─────────────┘ └───────────────┘ └───────────────┘
          ▲           ▲                 ▲
          │           │                 │
          └───────────┼─────────────────┘
                      │
          ┌───────────┴───────────┐
          │MarketDataServiceFactory│
          └───────────────────────┘
                      │
                      ▼
          ┌───────────────────────┐
          │  MockMarketDataProvider│
          └───────────────────────┘
```

## Base API Service

The `BaseApiService` class provides common functionality for all API services:

- **HTTP Request Handling**: Wraps Axios for making HTTP requests
- **Error Handling**: Provides standardized error handling and retry logic
- **Caching**: Implements in-memory caching for API responses
- **Authentication**: Handles API key management and authentication

### Key Features

- **Automatic Retries**: Automatically retries failed requests with exponential backoff
- **Response Transformation**: Transforms API responses into standardized formats
- **Request Interceptors**: Adds authentication headers and other request modifications
- **Response Interceptors**: Handles error responses and transforms successful responses

## Market Data Services

### AlphaVantageService

The `AlphaVantageService` provides access to Alpha Vantage API for stock market data:

- **Stock Quotes**: Get real-time and delayed quotes for stocks
- **Time Series Data**: Get historical price data for stocks
- **Symbol Search**: Search for stock symbols by keywords

### PolygonService

The `PolygonService` provides access to Polygon.io API for real-time market data:

- **Real-time Quotes**: Get real-time quotes for stocks
- **Aggregated Bars**: Get aggregated price bars for various time intervals
- **Symbol Search**: Search for stock symbols by keywords

### IEXCloudService

The `IEXCloudService` provides access to IEX Cloud API for financial data:

- **Stock Quotes**: Get real-time quotes for stocks
- **Historical Prices**: Get historical price data for stocks
- **Company Information**: Get company profiles and fundamentals
- **Market Movers**: Get top gainers, losers, and most active stocks

## MarketDataServiceFactory

The `MarketDataServiceFactory` provides a unified interface for accessing market data from any provider:

- **Service Selection**: Automatically selects the best available service
- **Data Normalization**: Normalizes data from different providers into a common format
- **Fallback Mechanism**: Falls back to alternative providers if the primary provider fails
- **Mock Data**: Uses mock data when real APIs are unavailable

### Usage Example

```typescript
import { marketDataService } from '../services/api/marketData/MarketDataServiceFactory';

// Get a quote for a stock
const quote = await marketDataService.getQuote('AAPL');

// Get historical prices for a stock
const historicalPrices = await marketDataService.getHistoricalBars('AAPL', '1d', 30);

// Search for symbols
const searchResults = await marketDataService.searchSymbols('Apple');

// Get market movers
const gainers = await marketDataService.getMarketMovers('gainers', 10);
```

## Mock Market Data Provider

The `MockMarketDataProvider` generates realistic mock data for development and testing:

- **Consistent Data**: Generates consistent mock data for the same inputs
- **Realistic Values**: Generates realistic price and volume values
- **Common Stocks**: Includes data for common stock symbols
- **Random Walk**: Simulates price movements using random walk with drift

## Configuration

API services are configured using the `apiConfig.ts` file:

- **API Keys**: Configure API keys for each provider
- **Mock Data**: Toggle between real and mock data
- **Caching**: Configure caching settings for API responses

### Example Configuration

```typescript
// In apiConfig.ts
export const API_KEYS: ApiKeysConfig = {
  alphaVantage: 'YOUR_ALPHA_VANTAGE_API_KEY',
  polygon: 'YOUR_POLYGON_API_KEY',
  iexCloud: 'YOUR_IEX_CLOUD_API_KEY'
};

export const DATA_SOURCE_CONFIG: DataSourceConfig = {
  useMockDataAsFallback: true,
  forceMockData: false,
  enableApiCache: true,
  cacheTTL: {
    marketData: 60000, // 1 minute
    fundamentalData: 86400000, // 24 hours
    newsData: 300000, // 5 minutes
    portfolioData: 60000 // 1 minute
  }
};
```

## Testing

The API services include comprehensive tests:

- **Unit Tests**: Test individual service methods
- **Integration Tests**: Test service interactions
- **Mock Tests**: Test with mock data providers

## Next Steps

1. **Trading API Services**: Implement services for trading operations (Alpaca, Interactive Brokers)
2. **Financial Data API Services**: Implement services for financial data (Financial Modeling Prep, Quandl)
3. **News and Sentiment API Services**: Implement services for news and sentiment analysis (NewsAPI, Finnhub)