import React, { Suspense, lazy, ComponentType } from 'react';
import { Box, CircularProgress } from '@mui/material';

// Default loading component
const DefaultLoadingComponent = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 4 }}>
    <CircularProgress />
  </Box>
);

/**
 * Creates a lazily loaded component with a loading fallback
 * 
 * @param importFunc - Dynamic import function that returns a promise resolving to a module
 * @param LoadingComponent - Optional custom loading component to show while loading
 * @returns A lazily loaded component
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  LoadingComponent: React.ComponentType = DefaultLoadingComponent
) {
  const LazyComponent = lazy(importFunc);
  
  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={<LoadingComponent />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * Creates a lazily loaded component with a retry mechanism
 * 
 * @param importFunc - Dynamic import function that returns a promise resolving to a module
 * @param LoadingComponent - Optional custom loading component to show while loading
 * @param maxRetries - Maximum number of retries (default: 3)
 * @returns A lazily loaded component with retry capability
 */
export function lazyLoadWithRetry<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  LoadingComponent: React.ComponentType = DefaultLoadingComponent,
  maxRetries = 3
) {
  const LazyComponent = lazy(() => {
    let retries = 0;
    
    const retryImport = (): Promise<{ default: T }> => 
      importFunc()
        .catch(error => {
          if (retries < maxRetries) {
            retries++;
            console.warn(`Failed to load component, retrying (${retries}/${maxRetries})...`);
            return new Promise(resolve => setTimeout(resolve, 1000 * retries))
              .then(retryImport);
          }
          throw error;
        });
    
    return retryImport();
  });
  
  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={<LoadingComponent />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * Creates a lazily loaded component with a custom error boundary
 * 
 * @param importFunc - Dynamic import function that returns a promise resolving to a module
 * @param ErrorComponent - Component to render when an error occurs
 * @param LoadingComponent - Optional custom loading component to show while loading
 * @returns A lazily loaded component with error handling
 */
export function lazyLoadWithErrorHandling<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  ErrorComponent: React.ComponentType<{ error: Error }>,
  LoadingComponent: React.ComponentType = DefaultLoadingComponent
) {
  const LazyComponent = lazy(() => 
    importFunc()
      .catch(error => {
        console.error('Failed to load component:', error);
        return {
          default: (props: any) => <ErrorComponent error={error} {...props} />
        } as { default: T };
      })
  );
  
  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={<LoadingComponent />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}