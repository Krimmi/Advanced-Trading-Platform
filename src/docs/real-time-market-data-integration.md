# Real-Time Market Data Integration

This document describes the real-time market data integration with the algorithmic trading framework.

## Overview

The real-time market data integration connects the algorithmic trading framework with live market data sources through WebSocket connections. This enables strategies to receive and react to market data in real-time, making timely trading decisions based on the latest market conditions.

## Architecture

The integration consists of several key components:

1. **Market Data Providers**: Interfaces and implementations for different market data sources (Alpaca, IEX, Polygon, etc.)
2. **WebSocket Services**: Manages WebSocket connections to market data providers
3. **Strategy Market Data Service**: Distributes market data to strategies based on their subscriptions
4. **Algorithmic Trading Service**: Coordinates the overall trading process, including strategy management and signal execution

## Components

### Market Data Providers

The `IMarketDataProvider` interface defines the contract for all market data providers. Each provider implementation handles the specifics of connecting to a particular data source.

Key implementations:
- `AlpacaMarketDataProvider`: Connects to Alpaca Markets for real-time market data
- (Future) `IEXCloudMarketDataProvider`: Will connect to IEX Cloud
- (Future) `PolygonMarketDataProvider`: Will connect to Polygon.io

### WebSocket Services

The WebSocket services manage the connections to market data providers:

- `WebSocketService`: Base class for WebSocket connections
- `MarketDataWebSocketService`: Specialized for market data WebSockets
- `WebSocketServiceFactory`: Creates and manages WebSocket services

### Strategy Market Data Service

The `StrategyMarketDataService` is responsible for:

1. Subscribing to market data for symbols used by active strategies
2. Distributing market data to the appropriate strategies
3. Managing WebSocket connections and reconnections
4. Validating and normalizing market data

### Strategy Interface Extensions

The `IStrategy` interface has been extended with methods for handling real-time market data:

```typescript
interface IStrategy {
  // Existing methods...
  
  // Real-time market data handling
  onQuote?(symbol: string, quote: any): void;
  onTrade?(symbol: string, trade: any): void;
  onBar?(symbol: string, bar: any): void;
  onMarketData?(symbol: string, dataType: string, data: any): void;
  onOrderUpdate?(orderId: string, status: string, data: any): void;
  onPositionUpdate?(symbol: string, position: any): void;
}
```

The `BaseStrategy` class provides default implementations of these methods, which can be overridden by concrete strategy implementations.

## Data Flow

1. The `WebSocketService` connects to a market data provider and receives real-time data
2. The `MarketDataWebSocketService` normalizes the data into a standard format
3. The `StrategyMarketDataService` distributes the data to strategies based on their subscriptions
4. Strategies process the data through their `onQuote`, `onTrade`, `onBar`, or `onMarketData` methods
5. If a strategy generates a signal based on the data, it's passed to the `AlgorithmicTradingService`
6. The `AlgorithmicTradingService` can execute the signal through an execution service

## Configuration

The market data integration is configured through the environment configuration system:

```typescript
// Example configuration
const config = {
  alpaca: {
    apiKey: 'YOUR_API_KEY',
    apiSecret: 'YOUR_API_SECRET',
    baseUrl: 'https://paper-api.alpaca.markets',
    wsUrl: 'wss://stream.data.alpaca.markets/v2'
  }
};
```

## Usage Example

```typescript
// Initialize the algorithmic trading service
const tradingService = AlgorithmicTradingService.getInstance();
await tradingService.initialize({});

// Create a strategy
const strategy = await tradingService.createStrategy(
  StrategyType.MOVING_AVERAGE_CROSSOVER,
  {
    parameters: {
      fastPeriod: 10,
      slowPeriod: 30,
      symbols: ['AAPL', 'MSFT', 'GOOGL']
    }
  }
);

// Start the service (this will connect to market data and start strategies)
await tradingService.start();

// The strategy will now receive real-time market data and generate signals
```

## Error Handling

The integration includes comprehensive error handling:

1. WebSocket connection errors are caught and reconnection is attempted automatically
2. Data validation ensures that only valid market data is processed
3. Strategy-specific errors are isolated to prevent affecting other strategies
4. All errors are logged and emitted as events for monitoring

## Future Enhancements

1. **Additional Data Providers**: Integration with more market data providers
2. **Advanced Data Normalization**: More sophisticated data normalization and validation
3. **Historical Data Replay**: Ability to replay historical data for backtesting
4. **Data Persistence**: Store market data for later analysis
5. **Performance Optimization**: Optimize data processing for high-frequency trading