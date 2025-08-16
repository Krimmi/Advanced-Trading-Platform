import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { config, currentEnvironment } from '../../config/environments';

/**
 * Initialize error tracking with Sentry
 */
export const initializeErrorTracking = (): void => {
  // Only initialize if error tracking is enabled and SENTRY_DSN is provided
  if (!config.monitoring.errorTracking || !config.monitoring.sentryDsn) {
    console.warn('Error tracking is disabled or Sentry DSN not provided.');
    return;
  }

  Sentry.init({
    dsn: config.monitoring.sentryDsn,
    integrations: [new BrowserTracing()],
    environment: config.monitoring.sentryEnvironment,
    
    // Set tracesSampleRate based on environment configuration
    tracesSampleRate: config.monitoring.sentryTracesSampleRate,
    
    // Only enable in staging and production by default
    enabled: currentEnvironment !== 'development' || process.env.REACT_APP_FORCE_SENTRY === 'true',
    
    // Add release version for better tracking
    release: config.version,
    
    // Capture errors based on environment log level
    beforeSend(event) {
      // Filter out errors based on log level
      const errorLevel = event.level || 'error';
      
      switch (config.logLevel) {
        case 'error':
          return errorLevel === 'error' || errorLevel === 'fatal' ? event : null;
        case 'warn':
          return ['error', 'fatal', 'warning'].includes(errorLevel) ? event : null;
        case 'info':
          return ['error', 'fatal', 'warning', 'info'].includes(errorLevel) ? event : null;
        case 'debug':
          return event;
        default:
          return event;
      }
    }
  });
};

/**
 * Capture an exception with additional context
 * @param error - Error to capture
 * @param context - Additional context
 */
export const captureException = (error: Error, context?: Record<string, any>): void => {
  if (!config.monitoring.errorTracking) return;
  
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
};

/**
 * Capture a message with additional context
 * @param message - Message to capture
 * @param level - Severity level
 * @param context - Additional context
 */
export const captureMessage = (
  message: string, 
  level: Sentry.Severity | 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug' = 'info',
  context?: Record<string, any>
): void => {
  if (!config.monitoring.errorTracking) return;
  
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      Sentry.captureMessage(message, level as Sentry.Severity);
    });
  } else {
    Sentry.captureMessage(message, level as Sentry.Severity);
  }
};

/**
 * Set user information for error tracking
 * @param user - User information
 */
export const setUser = (user: { id: string; email?: string; username?: string }): void => {
  if (!config.monitoring.errorTracking) return;
  Sentry.setUser(user);
};

/**
 * Clear user information
 */
export const clearUser = (): void => {
  if (!config.monitoring.errorTracking) return;
  Sentry.setUser(null);
};

/**
 * Start tracking a transaction
 * @param name - Transaction name
 * @param operation - Operation type
 * @returns Transaction object
 */
export const startTransaction = (name: string, operation: string): Sentry.Transaction => {
  if (!config.monitoring.errorTracking) {
    // Return a dummy transaction if error tracking is disabled
    return {
      finish: () => {},
      setData: () => {},
      setStatus: () => {},
      startChild: () => ({ finish: () => {} }),
    } as any;
  }
  
  return Sentry.startTransaction({ name, op: operation });
};

/**
 * Error boundary component for React components
 */
export const ErrorBoundary = Sentry.ErrorBoundary;

/**
 * Initialize error tracking on application startup
 */
export const initializeErrorTrackingOnStartup = (): void => {
  // Initialize error tracking as soon as the module is imported
  initializeErrorTracking();
  
  // Log initialization status
  if (config.monitoring.errorTracking && config.monitoring.sentryDsn) {
    console.log(`Error tracking initialized for ${config.monitoring.sentryEnvironment} environment`);
  } else {
    console.log('Error tracking is disabled');
  }
};

// Initialize error tracking on import
initializeErrorTrackingOnStartup();