import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// Component that throws an error
const ErrorThrowingComponent = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Suppress console errors during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary', () => {
  test('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test Content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('renders fallback UI when an error occurs', () => {
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    // Check if the default fallback UI is rendered
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/Test error/)).toBeInTheDocument();
  });

  test('renders custom fallback UI when provided', () => {
    const customFallback = <div>Custom Error UI</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
  });

  test('calls custom fallback function when provided', () => {
    const customFallback = jest.fn().mockImplementation((error, resetError) => (
      <div>
        <div>Custom Function Error: {error.message}</div>
        <button onClick={resetError}>Reset</button>
      </div>
    ));
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    expect(customFallback).toHaveBeenCalled();
    expect(screen.getByText('Custom Function Error: Test error')).toBeInTheDocument();
  });

  test('calls onError callback when an error occurs', () => {
    const onError = jest.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  test('resets error state when "Try Again" button is clicked', () => {
    const TestComponent = ({ shouldThrow, setShouldThrow }) => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return (
        <div>
          <div>No error</div>
          <button onClick={() => setShouldThrow(true)}>Throw Error</button>
        </div>
      );
    };

    const TestWrapper = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      
      return (
        <ErrorBoundary>
          <TestComponent shouldThrow={shouldThrow} setShouldThrow={setShouldThrow} />
        </ErrorBoundary>
      );
    };

    render(<TestWrapper />);

    // Initially, the error UI should be shown
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    
    // Click the "Try Again" button
    fireEvent.click(screen.getByText('Try Again'));
    
    // Now the component should render without error
    expect(screen.getByText('No error')).toBeInTheDocument();
    
    // Trigger an error again
    fireEvent.click(screen.getByText('Throw Error'));
    
    // Error UI should be shown again
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});