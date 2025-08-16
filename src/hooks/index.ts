import useDebounce from './useDebounce';
import useIntersectionObserver from './useIntersectionObserver';
import useLocalStorage from './useLocalStorage';
import useWebSocket from './useWebSocket';
import { usePortfolioOptimization } from './usePortfolioOptimization';
import { usePortfolioRebalancing } from './usePortfolioRebalancing';
import { useBlackLitterman } from './useBlackLitterman';
import { useFactorOptimization } from './useFactorOptimization';

// Re-export all hooks
export {
  useDebounce,
  useIntersectionObserver,
  useLocalStorage,
  useWebSocket,
  usePortfolioOptimization,
  usePortfolioRebalancing,
  useBlackLitterman,
  useFactorOptimization
};