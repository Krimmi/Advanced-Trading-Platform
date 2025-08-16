import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import useIntersectionObserver from '../useIntersectionObserver';

// Mock IntersectionObserver
class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  elements: Set<Element>;
  options: IntersectionObserverInit;

  constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit = {}) {
    this.callback = callback;
    this.elements = new Set();
    this.options = options;
  }

  observe(element: Element) {
    this.elements.add(element);
  }

  unobserve(element: Element) {
    this.elements.delete(element);
  }

  disconnect() {
    this.elements.clear();
  }

  // Helper method to simulate intersection
  simulateIntersection(isIntersecting: boolean) {
    const entries: IntersectionObserverEntry[] = Array.from(this.elements).map(element => ({
      boundingClientRect: element.getBoundingClientRect(),
      intersectionRatio: isIntersecting ? 1 : 0,
      intersectionRect: isIntersecting ? element.getBoundingClientRect() : new DOMRectReadOnly(),
      isIntersecting,
      rootBounds: null,
      target: element,
      time: Date.now(),
    } as IntersectionObserverEntry));

    this.callback(entries, this);
  }
}

// Replace the global IntersectionObserver with our mock
global.IntersectionObserver = MockIntersectionObserver as any;

// Test component that uses the hook
const TestComponent = ({ onIntersect }: { onIntersect: (isIntersecting: boolean) => void }) => {
  const [ref, isIntersecting] = useIntersectionObserver();
  
  React.useEffect(() => {
    onIntersect(isIntersecting);
  }, [isIntersecting, onIntersect]);
  
  return <div data-testid="observed-element" ref={ref}>Test Element</div>;
};

describe('useIntersectionObserver', () => {
  test('should initialize with isIntersecting as false', () => {
    const { result } = renderHook(() => useIntersectionObserver());
    
    const [, isIntersecting] = result.current;
    expect(isIntersecting).toBe(false);
  });

  test('should update isIntersecting when intersection changes', () => {
    const onIntersect = jest.fn();
    render(<TestComponent onIntersect={onIntersect} />);
    
    const element = screen.getByTestId('observed-element');
    const observer = Array.from(
      (global.IntersectionObserver as any).instances
    )[0] as MockIntersectionObserver;
    
    // Initially not intersecting
    expect(onIntersect).toHaveBeenLastCalledWith(false);
    
    // Simulate intersection
    observer.simulateIntersection(true);
    expect(onIntersect).toHaveBeenLastCalledWith(true);
    
    // Simulate leaving intersection
    observer.simulateIntersection(false);
    expect(onIntersect).toHaveBeenLastCalledWith(false);
  });

  test('should disconnect observer on unmount', () => {
    const onIntersect = jest.fn();
    const { unmount } = render(<TestComponent onIntersect={onIntersect} />);
    
    const observer = Array.from(
      (global.IntersectionObserver as any).instances
    )[0] as MockIntersectionObserver;
    
    const disconnectSpy = jest.spyOn(observer, 'disconnect');
    
    unmount();
    
    expect(disconnectSpy).toHaveBeenCalled();
  });

  test('should only trigger once when once option is true', () => {
    const { result } = renderHook(() => useIntersectionObserver({ once: true }));
    
    const [ref, isIntersecting] = result.current;
    
    // Manually trigger the observer callback
    const observer = Array.from(
      (global.IntersectionObserver as any).instances
    )[0] as MockIntersectionObserver;
    
    // Simulate intersection
    observer.simulateIntersection(true);
    
    // Should be intersecting
    expect(result.current[1]).toBe(true);
    
    // Simulate leaving intersection
    observer.simulateIntersection(false);
    
    // Should still be intersecting because once is true
    expect(result.current[1]).toBe(true);
  });

  test('should respect threshold option', () => {
    const threshold = 0.5;
    renderHook(() => useIntersectionObserver({ threshold }));
    
    const observer = Array.from(
      (global.IntersectionObserver as any).instances
    )[0] as MockIntersectionObserver;
    
    expect(observer.options.threshold).toBe(threshold);
  });

  test('should respect rootMargin option', () => {
    const rootMargin = '10px';
    renderHook(() => useIntersectionObserver({ rootMargin }));
    
    const observer = Array.from(
      (global.IntersectionObserver as any).instances
    )[0] as MockIntersectionObserver;
    
    expect(observer.options.rootMargin).toBe(rootMargin);
  });
});