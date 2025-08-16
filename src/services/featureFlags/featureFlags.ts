import { currentEnvironment } from '../../config/environments';

/**
 * Feature flag interface
 */
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  enabledEnvironments: string[];
  rolloutPercentage: number;
  dependencies?: string[];
  userGroups?: string[];
}

/**
 * Feature flag service for managing feature flags
 */
class FeatureFlagService {
  private static instance: FeatureFlagService;
  private flags: Map<string, FeatureFlag> = new Map();
  private userGroups: string[] = [];
  private userId: string | null = null;
  private remoteConfigLoaded: boolean = false;
  
  private constructor() {
    // Initialize with default flags
    this.initializeDefaultFlags();
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }
  
  /**
   * Initialize default feature flags
   */
  private initializeDefaultFlags(): void {
    const defaultFlags: FeatureFlag[] = [
      {
        id: 'real-time-data',
        name: 'Real-Time Market Data',
        description: 'Enable real-time market data updates',
        enabled: true,
        enabledEnvironments: ['development', 'staging', 'production'],
        rolloutPercentage: 100
      },
      {
        id: 'advanced-charts',
        name: 'Advanced Charts',
        description: 'Enable advanced charting features',
        enabled: true,
        enabledEnvironments: ['development', 'staging', 'production'],
        rolloutPercentage: 100
      },
      {
        id: 'paper-trading',
        name: 'Paper Trading',
        description: 'Enable paper trading functionality',
        enabled: true,
        enabledEnvironments: ['development', 'staging', 'production'],
        rolloutPercentage: 100
      },
      {
        id: 'live-trading',
        name: 'Live Trading',
        description: 'Enable live trading functionality',
        enabled: true,
        enabledEnvironments: ['development', 'staging', 'production'],
        rolloutPercentage: 100,
        dependencies: ['paper-trading']
      },
      {
        id: 'ml-predictions',
        name: 'ML Predictions',
        description: 'Enable machine learning predictions',
        enabled: true,
        enabledEnvironments: ['development', 'staging', 'production'],
        rolloutPercentage: 100
      },
      {
        id: 'sentiment-analysis',
        name: 'Sentiment Analysis',
        description: 'Enable sentiment analysis features',
        enabled: true,
        enabledEnvironments: ['development', 'staging', 'production'],
        rolloutPercentage: 100
      },
      {
        id: 'portfolio-optimization',
        name: 'Portfolio Optimization',
        description: 'Enable portfolio optimization features',
        enabled: true,
        enabledEnvironments: ['development', 'staging', 'production'],
        rolloutPercentage: 100
      },
      {
        id: 'risk-analysis',
        name: 'Risk Analysis',
        description: 'Enable risk analysis features',
        enabled: true,
        enabledEnvironments: ['development', 'staging', 'production'],
        rolloutPercentage: 100
      },
      {
        id: 'news-integration',
        name: 'News Integration',
        description: 'Enable news integration features',
        enabled: true,
        enabledEnvironments: ['development', 'staging', 'production'],
        rolloutPercentage: 100
      },
      {
        id: 'social-sentiment',
        name: 'Social Media Sentiment',
        description: 'Enable social media sentiment analysis',
        enabled: true,
        enabledEnvironments: ['development', 'staging'],
        rolloutPercentage: 50,
        dependencies: ['sentiment-analysis']
      },
      {
        id: 'advanced-backtesting',
        name: 'Advanced Backtesting',
        description: 'Enable advanced backtesting features',
        enabled: true,
        enabledEnvironments: ['development', 'staging'],
        rolloutPercentage: 50
      },
      {
        id: 'multi-factor-auth',
        name: 'Multi-Factor Authentication',
        description: 'Enable multi-factor authentication',
        enabled: true,
        enabledEnvironments: ['development', 'staging', 'production'],
        rolloutPercentage: 100
      },
      {
        id: 'dark-mode',
        name: 'Dark Mode',
        description: 'Enable dark mode theme',
        enabled: true,
        enabledEnvironments: ['development', 'staging', 'production'],
        rolloutPercentage: 100
      }
    ];
    
    // Add default flags to map
    defaultFlags.forEach(flag => {
      this.flags.set(flag.id, flag);
    });
  }
  
  /**
   * Load remote configuration
   * @returns Promise that resolves when configuration is loaded
   */
  public async loadRemoteConfig(): Promise<void> {
    try {
      // In a real implementation, this would fetch from a remote config service
      // For now, we'll simulate a delay and use the default flags
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.remoteConfigLoaded = true;
    } catch (error) {
      console.error('Failed to load remote feature flag configuration:', error);
      // Continue with default flags
      this.remoteConfigLoaded = true;
    }
  }
  
  /**
   * Set user information for user-targeted feature flags
   * @param userId - User ID
   * @param groups - User groups
   */
  public setUser(userId: string, groups: string[] = []): void {
    this.userId = userId;
    this.userGroups = groups;
  }
  
  /**
   * Clear user information
   */
  public clearUser(): void {
    this.userId = null;
    this.userGroups = [];
  }
  
  /**
   * Check if a feature is enabled
   * @param featureId - Feature ID
   * @returns True if the feature is enabled
   */
  public isEnabled(featureId: string): boolean {
    const flag = this.flags.get(featureId);
    
    // Feature doesn't exist
    if (!flag) return false;
    
    // Check if feature is enabled
    if (!flag.enabled) return false;
    
    // Check if feature is enabled in current environment
    if (!flag.enabledEnvironments.includes(currentEnvironment)) return false;
    
    // Check dependencies
    if (flag.dependencies && flag.dependencies.length > 0) {
      const dependenciesMet = flag.dependencies.every(depId => this.isEnabled(depId));
      if (!dependenciesMet) return false;
    }
    
    // Check user groups
    if (flag.userGroups && flag.userGroups.length > 0) {
      const userInGroup = flag.userGroups.some(group => this.userGroups.includes(group));
      if (!userInGroup) return false;
    }
    
    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      // Use user ID for consistent behavior per user
      if (this.userId) {
        const hash = this.hashString(this.userId + featureId);
        const userPercentile = hash % 100;
        return userPercentile < flag.rolloutPercentage;
      } else {
        // No user ID, use random percentage
        return Math.random() * 100 < flag.rolloutPercentage;
      }
    }
    
    return true;
  }
  
  /**
   * Get all feature flags
   * @returns Array of feature flags
   */
  public getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }
  
  /**
   * Get a specific feature flag
   * @param featureId - Feature ID
   * @returns Feature flag or undefined if not found
   */
  public getFlag(featureId: string): FeatureFlag | undefined {
    return this.flags.get(featureId);
  }
  
  /**
   * Update a feature flag
   * @param featureId - Feature ID
   * @param updates - Updates to apply
   * @returns Updated feature flag or undefined if not found
   */
  public updateFlag(featureId: string, updates: Partial<FeatureFlag>): FeatureFlag | undefined {
    const flag = this.flags.get(featureId);
    
    if (!flag) return undefined;
    
    const updatedFlag = {
      ...flag,
      ...updates
    };
    
    this.flags.set(featureId, updatedFlag);
    
    return updatedFlag;
  }
  
  /**
   * Add a new feature flag
   * @param flag - Feature flag to add
   * @returns Added feature flag
   */
  public addFlag(flag: FeatureFlag): FeatureFlag {
    this.flags.set(flag.id, flag);
    return flag;
  }
  
  /**
   * Remove a feature flag
   * @param featureId - Feature ID
   * @returns True if the flag was removed
   */
  public removeFlag(featureId: string): boolean {
    return this.flags.delete(featureId);
  }
  
  /**
   * Check if remote configuration has been loaded
   * @returns True if remote configuration has been loaded
   */
  public isRemoteConfigLoaded(): boolean {
    return this.remoteConfigLoaded;
  }
  
  /**
   * Generate a hash from a string
   * @param str - String to hash
   * @returns Hash value
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

// Export singleton instance
export const featureFlags = FeatureFlagService.getInstance();

/**
 * React hook for checking if a feature is enabled
 * @param featureId - Feature ID
 * @returns True if the feature is enabled
 */
export function useFeatureFlag(featureId: string): boolean {
  const [isEnabled, setIsEnabled] = React.useState<boolean>(
    featureFlags.isEnabled(featureId)
  );
  
  React.useEffect(() => {
    // If remote config isn't loaded yet, load it and update
    if (!featureFlags.isRemoteConfigLoaded()) {
      featureFlags.loadRemoteConfig().then(() => {
        setIsEnabled(featureFlags.isEnabled(featureId));
      });
    }
  }, [featureId]);
  
  return isEnabled;
}

/**
 * Higher-order component for feature flag-based rendering
 * @param Component - Component to render if feature is enabled
 * @param featureId - Feature ID
 * @param FallbackComponent - Optional component to render if feature is disabled
 * @returns Component that renders based on feature flag
 */
export function withFeatureFlag<P>(
  Component: React.ComponentType<P>,
  featureId: string,
  FallbackComponent?: React.ComponentType<P>
): React.FC<P> {
  const FeatureFlaggedComponent: React.FC<P> = (props) => {
    const isEnabled = useFeatureFlag(featureId);
    
    if (isEnabled) {
      return <Component {...props} />;
    } else if (FallbackComponent) {
      return <FallbackComponent {...props} />;
    } else {
      return null;
    }
  };
  
  const displayName = Component.displayName || Component.name || 'Component';
  FeatureFlaggedComponent.displayName = `WithFeatureFlag(${displayName})`;
  
  return FeatureFlaggedComponent;
}