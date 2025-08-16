# Real-Time Market Data Integration

This document provides an overview of the real-time market data integration features implemented in the Hedge Fund Trading Platform.

## Overview

The real-time market data integration provides high-performance, scalable streaming of market data with advanced features including:

- WebSocket-based real-time data streaming
- Intelligent backpressure handling for high-frequency data
- Real-time analytics processing
- Configurable notification system
- Interactive UI components for data visualization

## Architecture

The real-time market data system is built with a layered architecture:

1. **WebSocket Layer**: Manages connections to data providers
2. **Streaming Layer**: Handles data flow and backpressure
3. **Analytics Layer**: Processes streaming data for insights
4. **Notification Layer**: Alerts users to important events
5. **UI Layer**: Visualizes real-time data and analytics

## Key Components

### WebSocket Services

- **WebSocketService**: Base service providing robust WebSocket connections with automatic reconnection, subscription management, and heartbeat functionality.
- **MarketDataWebSocketService**: Specialized service for handling market data streams with provider-specific normalization.
- **WebSocketServiceFactory**: Factory for creating and managing WebSocket services based on the provider.

### Data Streaming Pipeline

- **DataStreamingPipeline**: Manages processing stages for streaming data with backpressure handling.
- **DataProcessor**: Interface for data processors in the pipeline.
- **DataProcessorFactory**: Factory for creating common data processors (filtering, mapping, batching, throttling, deduplication).

### Market Data Streaming Service

- **MarketDataStreamingService**: High-level service for subscribing to real-time market data with advanced features.
- **MarketDataSubscription**: Manages subscriptions to market data streams.

### Real-Time Analytics

- **RealTimeAnalyticsService**: Processes streaming market data to calculate various analytics in real-time.
- **AnalyticsType**: Types of analytics that can be calculated (momentum, volatility, VWAP, etc.).
- **AnalyticsSubscription**: Manages subscriptions to analytics calculations.

### Notification System

- **NotificationService**: Manages real-time alerts and notifications based on market data and analytics.
- **AlertRule**: Configuration for alert rules.
- **AlertCondition**: Conditions that trigger alerts.
- **AlertAction**: Actions to take when alerts are triggered.

### UI Components

- **RealTimeMarketDataPanel**: React component for displaying real-time market data and analytics.
- **RealTimeMarketDataPage**: Page component that integrates the real-time market data panel with the application.

## Usage Examples

### Subscribing to Real-Time Market Data

```typescript
// Get the streaming service instance
const streamingService = MarketDataStreamingService.getInstance();

// Initialize the service
await streamingService.initialize();

// Subscribe to market data
const subscriptionId = streamingService.subscribe({
  dataTypes: [MarketDataType.QUOTES, MarketDataType.TRADES],
  symbols: ['AAPL', 'MSFT', 'GOOGL'],
  throttleRate: 5, // 5 updates per second
  bufferSize: 1000,
  priority: 10, // High priority
  deduplicationWindow: 100 // 100ms deduplication window
});

// Add listeners for specific data types
streamingService.addListener(
  subscriptionId,
  MarketDataType.QUOTES,
  (data) => {
    console.log(`Quote for ${data.symbol}:`, data.data);
  }
);

// Unsubscribe when done
streamingService.unsubscribe(subscriptionId);
```

### Setting Up Real-Time Analytics

```typescript
// Get the analytics service instance
const analyticsService = RealTimeAnalyticsService.getInstance();

// Initialize the service
await analyticsService.initialize();

// Subscribe to price momentum analytics
const subscriptionId = analyticsService.subscribe({
  type: AnalyticsType.PRICE_MOMENTUM,
  symbols: ['AAPL', 'MSFT', 'GOOGL'],
  parameters: { lookbackPeriods: 5 },
  windowSize: 60000, // 1 minute window
  updateInterval: 5000, // Update every 5 seconds
  requiredDataTypes: [MarketDataType.TRADES, MarketDataType.BARS]
});

// Add listener for analytics results
analyticsService.addListener(
  subscriptionId,
  (result) => {
    console.log(`Momentum for ${result.symbol}:`, result.value);
  }
);

// Unsubscribe when done
analyticsService.unsubscribe(subscriptionId);
```

### Creating Alert Rules

```typescript
// Get the notification service instance
const notificationService = NotificationService.getInstance();

// Initialize the service
await notificationService.initialize();

// Add an alert rule for price threshold
const ruleId = notificationService.addAlertRule({
  id: 'price-alert-aapl',
  name: 'AAPL Price Alert',
  description: 'Alert when AAPL price exceeds $200',
  enabled: true,
  condition: {
    type: AlertConditionType.PRICE_THRESHOLD,
    parameters: {
      operator: 'above',
      threshold: 200
    },
    symbols: ['AAPL'],
    dataTypes: [MarketDataType.TRADES]
  },
  actions: [
    {
      type: AlertActionType.SEND_NOTIFICATION,
      parameters: {
        title: 'AAPL Price Alert',
        message: 'AAPL price has exceeded $200',
        category: NotificationCategory.PRICE_ALERT,
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
      }
    }
  ],
  throttleMs: 60000 // Only trigger once per minute
});

// Update an alert rule
notificationService.updateAlertRule(ruleId, {
  enabled: false
});

// Remove an alert rule
notificationService.removeAlertRule(ruleId);
```

## Performance Considerations

The real-time market data system is designed for high performance with the following features:

1. **Backpressure Handling**: Prevents memory issues during high-frequency data bursts.
2. **Data Throttling**: Limits update rates to prevent UI performance issues.
3. **Deduplication**: Eliminates redundant updates to reduce processing overhead.
4. **Priority-Based Processing**: Ensures critical data is processed first during high load.
5. **Efficient Memory Management**: Uses buffers with size limits and eviction policies.

## Provider Support

The system supports multiple market data providers:

- **Alpaca**: Real-time stock quotes, trades, and bars
- **Finnhub**: Real-time stock data and news
- **Polygon**: Comprehensive market data
- **IEX Cloud**: Real-time and historical financial data

## Future Enhancements

Planned enhancements for the real-time market data system:

1. **Advanced Visualization**: WebGL-based charts for large datasets
2. **Machine Learning Integration**: Real-time anomaly detection and predictive analytics
3. **Custom Alert Builder**: UI for creating complex alert rules
4. **Historical Replay**: Ability to replay historical data through the real-time system
5. **Cross-Asset Integration**: Support for options, futures, forex, and crypto data

## Troubleshooting

Common issues and solutions:

1. **Connection Issues**: Check network connectivity and provider status
2. **High Memory Usage**: Reduce buffer sizes or increase throttling
3. **Delayed Updates**: Check for backpressure in the streaming pipeline
4. **Missing Data**: Verify subscription parameters and provider capabilities
5. **UI Performance**: Reduce update frequency or number of displayed symbols