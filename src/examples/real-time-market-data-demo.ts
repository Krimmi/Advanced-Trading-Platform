import { AlgorithmicTradingService } from '../services/algorithmic-trading/AlgorithmicTradingService';
import { StrategyType } from '../services/algorithmic-trading/registry/StrategyFactory';
import { ConnectionState } from '../services/websocket/WebSocketService';
import { Signal } from '../models/algorithmic-trading/StrategyTypes';

/**
 * This script demonstrates the real-time market data integration with the algorithmic trading framework.
 * It creates a Moving Average Crossover strategy and connects it to real-time market data.
 */
async function main() {
  try {
    console.log('Starting Real-Time Market Data Demo');
    
    // Get the algorithmic trading service
    const tradingService = AlgorithmicTradingService.getInstance();
    
    // Initialize the service
    await tradingService.initialize({});
    
    console.log('Algorithmic Trading Service initialized');
    
    // Create a Moving Average Crossover strategy
    const strategy = await tradingService.createStrategy(
      StrategyType.MOVING_AVERAGE_CROSSOVER,
      {
        parameters: {
          fastPeriod: 10,
          slowPeriod: 30,
          symbols: ['AAPL', 'MSFT', 'GOOGL'],
          positionSize: 0.1,
          stopLossPercent: 0.02,
          takeProfitPercent: 0.04
        }
      }
    );
    
    console.log(`Created strategy: ${strategy.id} - ${strategy.name}`);
    
    // Set up event listeners
    tradingService.on('connection_state_changed', (state: ConnectionState) => {
      console.log(`Market data connection state changed: ${state}`);
    });
    
    tradingService.on('signal', ({ strategyId, signal }: { strategyId: string, signal: Signal }) => {
      console.log(`Signal received from strategy ${strategyId}:`, signal);
    });
    
    tradingService.on('order_created', ({ signal, order }: { signal: Signal, order: any }) => {
      console.log(`Order created for signal:`, { signal, order });
    });
    
    tradingService.on('market_data_error', (error: any) => {
      console.error('Market data error:', error);
    });
    
    // Start the service
    await tradingService.start();
    
    console.log('Algorithmic Trading Service started');
    console.log('Strategy is now receiving real-time market data');
    console.log('Press Ctrl+C to stop');
    
    // Keep the script running
    await new Promise((resolve) => {
      process.on('SIGINT', () => {
        console.log('Stopping...');
        tradingService.stop().then(() => {
          console.log('Algorithmic Trading Service stopped');
          resolve(undefined);
        });
      });
    });
    
  } catch (error) {
    console.error('Error in Real-Time Market Data Demo:', error);
  }
}

// Run the main function
main().catch(console.error);