import { renderHook, act } from '@testing-library/react';
import useLocalStorage from '../useLocalStorage';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

// Mock storage event
const mockStorageEvent = (key: string, newValue: string) => {
  const event = new Event('storage') as StorageEvent;
  Object.defineProperties(event, {
    key: { value: key },
    newValue: { value: newValue },
  });
  window.dispatchEvent(event);
};

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    
    // Clear mock calls
    jest.clearAllMocks();
    
    // Clear mock storage
    mockLocalStorage.clear();
  });

  test('should use initial value when localStorage is empty', () => {
    const initialValue = { name: 'John', age: 30 };
    const { result } = renderHook(() => useLocalStorage('user', initialValue));
    
    expect(result.current[0]).toEqual(initialValue);
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('user');
  });

  test('should use value from localStorage if it exists', () => {
    const storedValue = { name: 'Jane', age: 25 };
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(storedValue));
    
    const { result } = renderHook(() => useLocalStorage('user', { name: '', age: 0 }));
    
    expect(result.current[0]).toEqual(storedValue);
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('user');
  });

  test('should update localStorage when state changes', () => {
    const { result } = renderHook(() => useLocalStorage('user', { name: 'John', age: 30 }));
    
    const newValue = { name: 'Jane', age: 25 };
    act(() => {
      result.current[1](newValue);
    });
    
    expect(result.current[0]).toEqual(newValue);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(newValue));
  });

  test('should update state when using function setter', () => {
    const initialValue = { name: 'John', age: 30 };
    const { result } = renderHook(() => useLocalStorage('user', initialValue));
    
    act(() => {
      result.current[1]((prev) => ({ ...prev, age: prev.age + 1 }));
    });
    
    expect(result.current[0]).toEqual({ name: 'John', age: 31 });
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify({ name: 'John', age: 31 }));
  });

  test('should handle localStorage errors gracefully', () => {
    // Mock console.warn to prevent test output noise
    const originalConsoleWarn = console.warn;
    console.warn = jest.fn();
    
    // Mock localStorage.getItem to throw an error
    mockLocalStorage.getItem.mockImplementationOnce(() => {
      throw new Error('getItem error');
    });
    
    const initialValue = { name: 'John', age: 30 };
    const { result } = renderHook(() => useLocalStorage('user', initialValue));
    
    // Should use initial value when localStorage throws
    expect(result.current[0]).toEqual(initialValue);
    expect(console.warn).toHaveBeenCalled();
    
    // Mock localStorage.setItem to throw an error
    mockLocalStorage.setItem.mockImplementationOnce(() => {
      throw new Error('setItem error');
    });
    
    // Should not throw when setting value
    act(() => {
      result.current[1]({ name: 'Jane', age: 25 });
    });
    
    expect(console.warn).toHaveBeenCalledTimes(2);
    
    // Restore console.warn
    console.warn = originalConsoleWarn;
  });

  test('should update state when localStorage changes in another window', () => {
    const initialValue = { name: 'John', age: 30 };
    const { result } = renderHook(() => useLocalStorage('user', initialValue));
    
    // Simulate storage event from another window
    const newValue = { name: 'Jane', age: 25 };
    act(() => {
      mockStorageEvent('user', JSON.stringify(newValue));
    });
    
    expect(result.current[0]).toEqual(newValue);
  });

  test('should handle invalid JSON in storage event', () => {
    // Mock console.warn to prevent test output noise
    const originalConsoleWarn = console.warn;
    console.warn = jest.fn();
    
    const initialValue = { name: 'John', age: 30 };
    const { result } = renderHook(() => useLocalStorage('user', initialValue));
    
    // Simulate storage event with invalid JSON
    act(() => {
      mockStorageEvent('user', '{invalid json}');
    });
    
    // Should keep the current value
    expect(result.current[0]).toEqual(initialValue);
    expect(console.warn).toHaveBeenCalled();
    
    // Restore console.warn
    console.warn = originalConsoleWarn;
  });
});