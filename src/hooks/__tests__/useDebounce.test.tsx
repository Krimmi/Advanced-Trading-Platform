import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import useDebounce from '../useDebounce';

// Mock timer functions
jest.useFakeTimers();

describe('useDebounce', () => {
  test('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial value', 500));
    
    expect(result.current).toBe('initial value');
  });

  test('should not update the debounced value before the delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial value', delay: 500 } }
    );
    
    // Change the value
    rerender({ value: 'updated value', delay: 500 });
    
    // Value should not be updated yet
    expect(result.current).toBe('initial value');
    
    // Fast-forward time by 400ms (less than the delay)
    act(() => {
      jest.advanceTimersByTime(400);
    });
    
    // Value should still not be updated
    expect(result.current).toBe('initial value');
  });

  test('should update the debounced value after the delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial value', delay: 500 } }
    );
    
    // Change the value
    rerender({ value: 'updated value', delay: 500 });
    
    // Fast-forward time by 500ms (equal to the delay)
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    // Value should be updated now
    expect(result.current).toBe('updated value');
  });

  test('should handle multiple value changes within the delay period', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial value', delay: 500 } }
    );
    
    // Change the value multiple times
    rerender({ value: 'first update', delay: 500 });
    
    // Fast-forward time by 200ms
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    // Change the value again
    rerender({ value: 'second update', delay: 500 });
    
    // Fast-forward time by 200ms
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    // Change the value one more time
    rerender({ value: 'final update', delay: 500 });
    
    // Value should still be the initial value
    expect(result.current).toBe('initial value');
    
    // Fast-forward time by 500ms
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    // Value should now be the final update
    expect(result.current).toBe('final update');
  });

  test('should handle delay changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial value', delay: 500 } }
    );
    
    // Change the value and delay
    rerender({ value: 'updated value', delay: 1000 });
    
    // Fast-forward time by 500ms (the original delay)
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    // Value should not be updated yet due to increased delay
    expect(result.current).toBe('initial value');
    
    // Fast-forward time by another 500ms (total 1000ms)
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    // Value should be updated now
    expect(result.current).toBe('updated value');
  });

  test('should work with different value types', () => {
    // Test with number
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 500 } }
    );
    
    numberRerender({ value: 42, delay: 500 });
    
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    expect(numberResult.current).toBe(42);
    
    // Test with object
    const { result: objectResult, rerender: objectRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: { name: 'initial' }, delay: 500 } }
    );
    
    objectRerender({ value: { name: 'updated' }, delay: 500 });
    
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    expect(objectResult.current).toEqual({ name: 'updated' });
    
    // Test with array
    const { result: arrayResult, rerender: arrayRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: [1, 2, 3], delay: 500 } }
    );
    
    arrayRerender({ value: [4, 5, 6], delay: 500 });
    
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    expect(arrayResult.current).toEqual([4, 5, 6]);
  });
});