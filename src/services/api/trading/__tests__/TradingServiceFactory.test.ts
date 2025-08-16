import { tradingService } from '../TradingServiceFactory';
import { alpacaService } from '../AlpacaService';
import { interactiveBrokersService } from '../InteractiveBrokersService';
import { API_KEYS, DATA_SOURCE_CONFIG } from '../../../../config/apiConfig';

// Mock the API services
jest.mock('../AlpacaService', () => ({
  alpacaService: {
    isAvailable: jest.fn(),
    getAccount: jest.fn(),
    getPositions: jest.fn(),
    getOrders: jest.fn(),
    createOrder: jest.fn(),
    cancelOrder: jest.fn()
  }
}));

jest.mock('../InteractiveBrokersService', () => ({
  interactiveBrokersService: {
    isAvailable: jest.fn(),
    getAccount: jest.fn(),
    getPositions: jest.fn(),
    getOrders: jest.fn(),
    createOrder: jest.fn(),
    cancelOrder: jest.fn()
  }
}));

// Mock the config
jest.mock('../../../../config/apiConfig', () => ({
  API_KEYS: {
    alpaca: {
      apiKey: '',
      apiSecret: '',
      paper: true
    },
    interactiveBrokers: {
      accountId: '',
      apiKey: ''
    }
  },
  DATA_SOURCE_CONFIG: {
    forceMockData: false,
    cacheTTL: {
      marketData: 60000
    }
  }
}));

describe('TradingServiceFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default to no services available
    (alpacaService.isAvailable as jest.Mock).mockReturnValue(false);
    (interactiveBrokersService.isAvailable as jest.Mock).mockReturnValue(false);
  });

  describe('getBestAvailableService', () => {
    it('should return the requested service if available', () => {
      // Setup
      (alpacaService.isAvailable as jest.Mock).mockReturnValue(true);
      
      // Execute
      const service = tradingService.getBestAvailableService('alpaca');
      
      // Verify
      expect(service).toBe(alpacaService);
    });

    it('should return the best available service if requested service is not available', () => {
      // Setup
      (interactiveBrokersService.isAvailable as jest.Mock).mockReturnValue(true);
      
      // Execute
      const service = tradingService.getBestAvailableService('alpaca');
      
      // Verify
      expect(service).toBe(interactiveBrokersService);
    });

    it('should prefer Alpaca over Interactive Brokers when both are available', () => {
      // Setup
      (alpacaService.isAvailable as jest.Mock).mockReturnValue(true);
      (interactiveBrokersService.isAvailable as jest.Mock).mockReturnValue(true);
      
      // Execute
      const service = tradingService.getBestAvailableService('auto');
      
      // Verify
      expect(service).toBe(alpacaService);
    });

    it('should return Alpaca if no service is available', () => {
      // Execute
      const service = tradingService.getBestAvailableService();
      
      // Verify
      expect(service).toBe(alpacaService);
    });
  });

  describe('getAccount', () => {
    it('should get account from Alpaca and normalize the data', async () => {
      // Setup
      (alpacaService.isAvailable as jest.Mock).mockReturnValue(true);
      (alpacaService.getAccount as jest.Mock).mockResolvedValue({
        id: 'abc123',
        currency: 'USD',
        cash: '10000.50',
        buying_power: '20000.75',
        equity: '15000.25',
        status: 'ACTIVE'
      });

      // Execute
      const account = await tradingService.getAccount('alpaca');
      
      // Verify
      expect(alpacaService.getAccount).toHaveBeenCalled();
      expect(account).toEqual({
        id: 'abc123',
        currency: 'USD',
        cash: 10000.50,
        buyingPower: 20000.75,
        equity: 15000.25,
        provider: 'alpaca'
      });
    });

    it('should get account from Interactive Brokers and normalize the data', async () => {
      // Setup
      (interactiveBrokersService.isAvailable as jest.Mock).mockReturnValue(true);
      (interactiveBrokersService.getAccount as jest.Mock).mockResolvedValue({
        accountId: 'xyz789',
        currency: 'USD',
        cashBalance: 10000.50,
        buyingPower: 20000.75,
        equityWithLoanValue: 15000.25,
        accountType: 'INDIVIDUAL'
      });

      // Execute
      const account = await tradingService.getAccount('interactiveBrokers');
      
      // Verify
      expect(interactiveBrokersService.getAccount).toHaveBeenCalled();
      expect(account).toEqual({
        id: 'xyz789',
        currency: 'USD',
        cash: 10000.50,
        buyingPower: 20000.75,
        equity: 15000.25,
        provider: 'interactiveBrokers'
      });
    });
  });

  describe('getPositions', () => {
    it('should get positions from Alpaca and normalize the data', async () => {
      // Setup
      (alpacaService.isAvailable as jest.Mock).mockReturnValue(true);
      (alpacaService.getPositions as jest.Mock).mockResolvedValue([
        {
          symbol: 'AAPL',
          qty: '10',
          avg_entry_price: '150.25',
          market_value: '1600.50',
          unrealized_pl: '100.00',
          unrealized_plpc: '0.0665',
          current_price: '160.05'
        }
      ]);

      // Execute
      const positions = await tradingService.getPositions('alpaca');
      
      // Verify
      expect(alpacaService.getPositions).toHaveBeenCalled();
      expect(positions).toEqual([
        {
          symbol: 'AAPL',
          quantity: 10,
          averageEntryPrice: 150.25,
          marketValue: 1600.50,
          unrealizedPnl: 100.00,
          unrealizedPnlPercent: 6.65,
          currentPrice: 160.05,
          provider: 'alpaca'
        }
      ]);
    });

    it('should get positions from Interactive Brokers and normalize the data', async () => {
      // Setup
      (interactiveBrokersService.isAvailable as jest.Mock).mockReturnValue(true);
      (interactiveBrokersService.getPositions as jest.Mock).mockResolvedValue([
        {
          symbol: 'AAPL',
          position: 10,
          avgCost: 150.25,
          marketValue: 1600.50,
          unrealizedPnL: 100.00,
          marketPrice: 160.05
        }
      ]);

      // Execute
      const positions = await tradingService.getPositions('interactiveBrokers');
      
      // Verify
      expect(interactiveBrokersService.getPositions).toHaveBeenCalled();
      expect(positions).toEqual([
        {
          symbol: 'AAPL',
          quantity: 10,
          averageEntryPrice: 150.25,
          marketValue: 1600.50,
          unrealizedPnl: 100.00,
          unrealizedPnlPercent: 6.248046875,
          currentPrice: 160.05,
          provider: 'interactiveBrokers'
        }
      ]);
    });
  });

  describe('createOrder', () => {
    it('should create an order with Alpaca and normalize the response', async () => {
      // Setup
      (alpacaService.isAvailable as jest.Mock).mockReturnValue(true);
      (alpacaService.createOrder as jest.Mock).mockResolvedValue({
        id: 'order123',
        symbol: 'AAPL',
        side: 'buy',
        type: 'market',
        qty: '10',
        filled_qty: '0',
        status: 'new',
        created_at: '2023-01-01T12:00:00Z',
        updated_at: '2023-01-01T12:00:00Z'
      });

      // Execute
      const order = await tradingService.createOrder({
        symbol: 'AAPL',
        side: 'buy',
        type: 'market',
        quantity: 10
      }, 'alpaca');
      
      // Verify
      expect(alpacaService.createOrder).toHaveBeenCalledWith({
        symbol: 'AAPL',
        side: 'buy',
        type: 'market',
        qty: 10,
        time_in_force: 'day'
      });
      
      expect(order).toEqual({
        id: 'order123',
        symbol: 'AAPL',
        side: 'buy',
        type: 'market',
        quantity: 10,
        filledQuantity: 0,
        status: 'new',
        createdAt: '2023-01-01T12:00:00Z',
        updatedAt: '2023-01-01T12:00:00Z',
        provider: 'alpaca'
      });
    });

    it('should create an order with Interactive Brokers and normalize the response', async () => {
      // Setup
      (interactiveBrokersService.isAvailable as jest.Mock).mockReturnValue(true);
      (interactiveBrokersService.createOrder as jest.Mock).mockResolvedValue({
        orderId: 456,
        symbol: 'AAPL',
        side: 'BUY',
        orderType: 'MKT',
        quantity: 10,
        filledQuantity: 0,
        status: 'Submitted',
        createTime: '2023-01-01T12:00:00Z',
        updateTime: '2023-01-01T12:00:00Z'
      });

      // Execute
      const order = await tradingService.createOrder({
        symbol: 'AAPL',
        side: 'buy',
        type: 'market',
        quantity: 10
      }, 'interactiveBrokers');
      
      // Verify
      expect(interactiveBrokersService.createOrder).toHaveBeenCalledWith({
        symbol: 'AAPL',
        side: 'BUY',
        orderType: 'MKT',
        quantity: 10,
        timeInForce: 'DAY'
      });
      
      expect(order).toEqual({
        id: '456',
        symbol: 'AAPL',
        side: 'buy',
        type: 'market',
        quantity: 10,
        filledQuantity: 0,
        status: 'new',
        createdAt: '2023-01-01T12:00:00Z',
        updatedAt: '2023-01-01T12:00:00Z',
        provider: 'interactiveBrokers'
      });
    });
  });
});