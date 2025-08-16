import { Middleware, MiddlewareAPI, Dispatch, AnyAction } from 'redux';
import { RootState } from '../index';

// Configuration options for the logging middleware
interface LoggingMiddlewareOptions {
  // Whether to log actions
  logActions: boolean;
  // Whether to log state changes
  logState: boolean;
  // Whether to log action timing
  logTiming: boolean;
  // Whether to log in production environment
  logInProduction: boolean;
  // List of action types to ignore
  ignoredActions: string[];
  // Maximum depth for state diff
  maxDepth: number;
  // Whether to collapse console groups
  collapsed: boolean;
  // Custom logger function
  logger: (message: string, ...args: any[]) => void;
}

// Default options
const defaultOptions: LoggingMiddlewareOptions = {
  logActions: true,
  logState: true,
  logTiming: true,
  logInProduction: false,
  ignoredActions: [
    '@@redux/INIT',
    '@@INIT',
    'persist/PERSIST',
    'persist/REHYDRATE',
    'persist/REGISTER',
  ],
  maxDepth: 5,
  collapsed: true,
  logger: console.log,
};

/**
 * Creates a diff object between two objects
 */
const objectDiff = (prev: any, next: any, depth: number = 0, maxDepth: number = 5): any => {
  if (depth > maxDepth) return '(max depth reached)';
  if (prev === next) return undefined;
  if (prev === null || next === null) return next;
  if (typeof prev !== 'object' || typeof next !== 'object') return next;
  
  if (Array.isArray(prev) && Array.isArray(next)) {
    if (prev.length !== next.length) return next;
    const diff = next.map((item, index) => objectDiff(prev[index], item, depth + 1, maxDepth));
    return diff.some(d => d !== undefined) ? diff : undefined;
  }
  
  const diff: any = {};
  let hasDiff = false;
  
  // Check for removed keys
  Object.keys(prev).forEach(key => {
    if (!(key in next)) {
      diff[key] = undefined;
      hasDiff = true;
    }
  });
  
  // Check for added or changed keys
  Object.keys(next).forEach(key => {
    const prevValue = prev[key];
    const nextValue = next[key];
    
    if (!(key in prev)) {
      diff[key] = nextValue;
      hasDiff = true;
    } else {
      const valueDiff = objectDiff(prevValue, nextValue, depth + 1, maxDepth);
      if (valueDiff !== undefined) {
        diff[key] = valueDiff;
        hasDiff = true;
      }
    }
  });
  
  return hasDiff ? diff : undefined;
};

/**
 * Format value for logging
 */
const formatValue = (value: any): string => {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'function') return 'function()';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return `[Object ${Object.prototype.toString.call(value)}]`;
    }
  }
  return value.toString();
};

/**
 * Creates a logging middleware with the specified options
 */
export const createLoggingMiddleware = (customOptions: Partial<LoggingMiddlewareOptions> = {}): Middleware => {
  // Merge default options with custom options
  const options: LoggingMiddlewareOptions = {
    ...defaultOptions,
    ...customOptions,
  };
  
  // Skip logging in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && !options.logInProduction) {
    return () => (next) => (action) => next(action);
  }
  
  return (api: MiddlewareAPI<Dispatch, RootState>) => (next: Dispatch) => (action: AnyAction) => {
    // Skip ignored actions
    if (options.ignoredActions.includes(action.type)) {
      return next(action);
    }
    
    // Get current state
    const prevState = api.getState();
    
    // Start timing
    const startTime = options.logTiming ? performance.now() : 0;
    
    // Log action
    if (options.logActions) {
      const logTitle = `Action: ${action.type}`;
      
      if (options.collapsed) {
        console.groupCollapsed(logTitle);
      } else {
        console.group(logTitle);
      }
      
      console.log('Action:', action);
      console.log('Previous State:', prevState);
    }
    
    // Execute the action
    const result = next(action);
    
    // Get new state
    const nextState = api.getState();
    
    // Calculate time taken
    const endTime = options.logTiming ? performance.now() : 0;
    const timeTaken = endTime - startTime;
    
    // Log state changes
    if (options.logState) {
      console.log('Next State:', nextState);
      
      // Log state diff
      const stateDiff = objectDiff(prevState, nextState, 0, options.maxDepth);
      if (stateDiff) {
        console.log('State Diff:', stateDiff);
      } else {
        console.log('State Diff: No changes');
      }
    }
    
    // Log timing
    if (options.logTiming) {
      console.log(`Time: ${timeTaken.toFixed(2)}ms`);
    }
    
    if (options.logActions) {
      console.groupEnd();
    }
    
    return result;
  };
};

/**
 * Default logging middleware with default options
 */
export const loggingMiddleware = createLoggingMiddleware();

export default loggingMiddleware;