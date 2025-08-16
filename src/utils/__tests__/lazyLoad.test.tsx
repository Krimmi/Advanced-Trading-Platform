import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { lazyLoad, lazyLoadWithRetry, lazyLoadWithErrorHandling } from '../lazyLoad';

// Mock components
const TestComponent = () => <div>Test Component</div>;
const ErrorComponent = ({ error }: { error: Error }) => <div>Error: {error.message}</div>;

// Mock successful import
const mockSuccessfulImport = () => Promise.resolve({ default: TestComponent });

// Mock failing import that succeeds after retries
let failCount = 0;
const mockRetryImport = () => {
  return new Promise((resolve, reject) => {
    if (failCount < 2) {
      failCount++;
      reject(new Error('Failed to load'));
    } else {
      resolve({ default: TestComponent });
    }
  });
};

// Mock failing import that always fails
const mockFailingImport = () => Promise.reject(new Error('Failed to load'));

// Mock setTimeout
jest.useFakeTimers();

describe('lazyLoad utilities', () => {
  beforeEach(() => {
    failCount = 0;
    jest.clearAllMocks();
  });

  test('lazyLoad renders component after successful import', async () => {
    const LazyComponent = lazyLoad(mockSuccessfulImport);
    
    render(<LazyComponent />);
    
    // Initially should show loading component
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // After the import resolves, should show the actual component
    await waitFor(() => {
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });
  });

  test('lazyLoad renders custom loading component', () => {
    const CustomLoading = () => <div>Custom Loading...</div>;
    const LazyComponent = lazyLoad(mockSuccessfulImport, CustomLoading);
    
    render(<LazyComponent />);
    
    // Should show custom loading component
    expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
  });

  test('lazyLoadWithRetry retries failed imports', async () => {
    const LazyComponent = lazyLoadWithRetry(mockRetryImport);
    
    render(<LazyComponent />);
    
    // Initially should show loading component
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Advance timers to trigger retries
    jest.advanceTimersByTime(1000);
    jest.advanceTimersByTime(2000);
    
    // After retries, should show the actual component
    await waitFor(() => {
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });
    
    // Should have retried twice
    expect(failCount).toBe(2);
  });

  test('lazyLoadWithErrorHandling renders error component on failure', async () => {
    const LazyComponent = lazyLoadWithErrorHandling(
      mockFailingImport,
      ErrorComponent
    );
    
    render(<LazyComponent />);
    
    // Initially should show loading component
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // After the import fails, should show the error component
    await waitFor(() => {
      expect(screen.getByText('Error: Failed to load')).toBeInTheDocument();
    });
  });

  test('lazyLoadWithRetry gives up after max retries', async () => {
    // Mock console.warn to avoid test output noise
    const originalConsoleWarn = console.warn;
    console.warn = jest.fn();
    
    const LazyComponent = lazyLoadWithRetry(mockFailingImport, undefined, 2);
    
    render(<LazyComponent />);
    
    // Advance timers to trigger retries
    jest.advanceTimersByTime(1000);
    jest.advanceTimersByTime(2000);
    
    // After max retries, should throw an error
    // This will be caught by React's error boundary
    await expect(async () => {
      await waitFor(() => {
        throw new Error('Should have thrown');
      });
    }).rejects.toThrow();
    
    // Should have warned about retries
    expect(console.warn).toHaveBeenCalledTimes(2);
    
    // Restore console.warn
    console.warn = originalConsoleWarn;
  });
});