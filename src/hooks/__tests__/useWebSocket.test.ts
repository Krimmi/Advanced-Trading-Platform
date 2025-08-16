import { renderHook, act } from '@testing-library/react';
import useWebSocket from '../useWebSocket';

// Mock WebSocket
class MockWebSocket {
  url: string;
  onopen: ((event: any) => void) | null = null;
  onclose: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  readyState: number = 0; // CONNECTING
  
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  constructor(url: string) {
    this.url = url;
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) this.onopen({ type: 'open' });
    }, 0);
  }

  send(data: any) {
    // Mock implementation
    return true;
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) this.onclose({ type: 'close', code: 1000, reason: 'Normal closure', wasClean: true });
  }

  // Helper method to simulate receiving a message
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data, type: 'message' });
    }
  }

  // Helper method to simulate an error
  simulateError() {
    if (this.onerror) {
      this.onerror({ type: 'error' });
    }
  }
}

// Replace the global WebSocket with our mock
global.WebSocket = MockWebSocket as any;

// Mock setTimeout and clearTimeout
jest.useFakeTimers();

describe('useWebSocket', () => {
  const mockUrl = 'wss://example.com/socket';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should connect to WebSocket on initialization', async () => {
    const { result } = renderHook(() => useWebSocket(mockUrl));
    
    // Initial state should be 'connecting'
    expect(result.current.status).toBe('connecting');
    
    // Advance timers to trigger the onopen callback
    act(() => {
      jest.advanceTimersByTime(10);
    });
    
    // Status should now be 'open'
    expect(result.current.status).toBe('open');
    expect(result.current.connectionAttempts).toBe(0);
  });

  test('should handle received messages', async () => {
    const { result } = renderHook(() => useWebSocket(mockUrl));
    
    // Advance timers to trigger the onopen callback
    act(() => {
      jest.advanceTimersByTime(10);
    });
    
    // Simulate receiving a message
    const testMessage = { data: 'test message' };
    act(() => {
      const ws = (global.WebSocket as any).mock.instances[0];
      ws.simulateMessage(testMessage);
    });
    
    // Last message should be updated
    expect(result.current.lastMessage).toEqual({
      data: testMessage,
      type: 'message'
    });
  });

  test('should send messages when connected', async () => {
    const { result } = renderHook(() => useWebSocket(mockUrl));
    
    // Advance timers to trigger the onopen callback
    act(() => {
      jest.advanceTimersByTime(10);
    });
    
    // Mock the send method
    const mockSend = jest.fn();
    const ws = (global.WebSocket as any).mock.instances[0];
    ws.send = mockSend;
    
    // Send a message
    act(() => {
      result.current.sendMessage('test message');
    });
    
    // Send should have been called
    expect(mockSend).toHaveBeenCalledWith('test message');
  });

  test('should handle disconnection', async () => {
    const { result } = renderHook(() => useWebSocket(mockUrl));
    
    // Advance timers to trigger the onopen callback
    act(() => {
      jest.advanceTimersByTime(10);
    });
    
    // Disconnect
    act(() => {
      result.current.disconnect();
    });
    
    // Status should be 'closing'
    expect(result.current.status).toBe('closing');
    
    // Simulate the onclose callback
    act(() => {
      const ws = (global.WebSocket as any).mock.instances[0];
      if (ws.onclose) ws.onclose({ type: 'close', code: 1000, reason: 'Normal closure', wasClean: true });
    });
    
    // Status should now be 'closed'
    expect(result.current.status).toBe('closed');
  });

  test('should handle reconnection', async () => {
    const { result } = renderHook(() => useWebSocket(mockUrl, { reconnectAttempts: 3, reconnectInterval: 1000 }));
    
    // Advance timers to trigger the onopen callback
    act(() => {
      jest.advanceTimersByTime(10);
    });
    
    // Simulate an error
    act(() => {
      const ws = (global.WebSocket as any).mock.instances[0];
      ws.simulateError();
    });
    
    // Status should be 'error'
    expect(result.current.status).toBe('error');
    
    // Simulate the onclose callback
    act(() => {
      const ws = (global.WebSocket as any).mock.instances[0];
      if (ws.onclose) ws.onclose({ type: 'close', code: 1000, reason: 'Normal closure', wasClean: true });
    });
    
    // Status should now be 'closed'
    expect(result.current.status).toBe('closed');
    
    // Connection attempts should be incremented
    expect(result.current.connectionAttempts).toBe(1);
    
    // Advance timers to trigger reconnection
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Status should be 'connecting' again
    expect(result.current.status).toBe('connecting');
    
    // Advance timers to trigger the onopen callback
    act(() => {
      jest.advanceTimersByTime(10);
    });
    
    // Status should now be 'open' again
    expect(result.current.status).toBe('open');
    // Connection attempts should be reset
    expect(result.current.connectionAttempts).toBe(0);
  });

  test('should manually reconnect when requested', async () => {
    const { result } = renderHook(() => useWebSocket(mockUrl));
    
    // Advance timers to trigger the onopen callback
    act(() => {
      jest.advanceTimersByTime(10);
    });
    
    // Manually reconnect
    act(() => {
      result.current.reconnect();
    });
    
    // Status should be 'connecting'
    expect(result.current.status).toBe('connecting');
    
    // Advance timers to trigger the onopen callback
    act(() => {
      jest.advanceTimersByTime(10);
    });
    
    // Status should now be 'open'
    expect(result.current.status).toBe('open');
  });
});