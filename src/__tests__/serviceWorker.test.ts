import { register, unregister } from '../serviceWorker';

// Mock service worker registration
const mockRegistration = {
  onupdatefound: null,
  unregister: jest.fn().mockResolvedValue(undefined),
};

// Mock service worker
const mockServiceWorker = {
  state: 'installed',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Mock navigator
const mockNavigator = {
  serviceWorker: {
    register: jest.fn().mockResolvedValue(mockRegistration),
    ready: Promise.resolve(mockRegistration),
    controller: { state: 'activated' },
  },
};

// Mock window
const mockWindow = {
  location: {
    origin: 'https://example.com',
    href: 'https://example.com',
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Mock process.env
const originalEnv = process.env;

describe('Service Worker', () => {
  beforeEach(() => {
    // Setup mocks
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true,
    });
    
    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true,
    });
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock process.env
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      PUBLIC_URL: '',
    };
  });

  afterEach(() => {
    // Restore process.env
    process.env = originalEnv;
  });

  test('register does nothing in development environment', () => {
    process.env.NODE_ENV = 'development';
    
    register();
    
    expect(mockNavigator.serviceWorker.register).not.toHaveBeenCalled();
  });

  test('register does nothing if service worker is not supported', () => {
    Object.defineProperty(global, 'navigator', {
      value: {},
      writable: true,
    });
    
    register();
    
    // Since serviceWorker is undefined, register should not be called
    expect(mockNavigator.serviceWorker.register).not.toHaveBeenCalled();
  });

  test('register does nothing if PUBLIC_URL is on different origin', () => {
    process.env.PUBLIC_URL = 'https://other-domain.com';
    
    register();
    
    expect(mockNavigator.serviceWorker.register).not.toHaveBeenCalled();
  });

  test('register calls serviceWorker.register with correct URL', () => {
    // Simulate load event
    const loadCallback = mockWindow.addEventListener.mock.calls.find(
      call => call[0] === 'load'
    )?.[1];
    
    if (loadCallback) {
      loadCallback();
      
      expect(mockNavigator.serviceWorker.register).toHaveBeenCalledWith(
        '/service-worker.js'
      );
    } else {
      fail('Load event listener not added');
    }
  });

  test('register calls onSuccess callback when registration is successful', async () => {
    const onSuccess = jest.fn();
    
    register({ onSuccess });
    
    // Simulate load event
    const loadCallback = mockWindow.addEventListener.mock.calls.find(
      call => call[0] === 'load'
    )?.[1];
    
    if (loadCallback) {
      loadCallback();
      
      // Simulate registration success
      const installingWorker = { ...mockServiceWorker };
      Object.defineProperty(mockRegistration, 'installing', {
        value: installingWorker,
        writable: true,
      });
      
      // Trigger onupdatefound
      if (mockRegistration.onupdatefound) {
        mockRegistration.onupdatefound();
      }
      
      // Simulate state change to 'installed'
      const stateChangeCallback = installingWorker.addEventListener.mock.calls.find(
        call => call[0] === 'statechange'
      )?.[1];
      
      if (stateChangeCallback) {
        stateChangeCallback();
        
        // Wait for promises to resolve
        await Promise.resolve();
        
        expect(onSuccess).toHaveBeenCalledWith(mockRegistration);
      } else {
        fail('State change event listener not added');
      }
    } else {
      fail('Load event listener not added');
    }
  });

  test('unregister calls serviceWorker.unregister when available', async () => {
    await unregister();
    
    expect(mockRegistration.unregister).toHaveBeenCalled();
  });

  test('unregister handles errors gracefully', async () => {
    // Mock console.error to avoid test output noise
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Make unregister throw an error
    mockRegistration.unregister.mockRejectedValueOnce(new Error('Unregister failed'));
    
    await unregister();
    
    // Should have logged the error
    expect(console.error).toHaveBeenCalledWith(expect.any(String));
    
    // Restore console.error
    console.error = originalConsoleError;
  });
});