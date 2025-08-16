export interface WidgetDefinition {
  type: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  defaultSettings: Record<string, any>;
  defaultSize: {
    w: number;
    h: number;
  };
  permissions?: string[];
}

/**
 * Registry for available dashboard widgets
 */
class WidgetRegistry {
  private static instance: WidgetRegistry;
  private widgets: Map<string, WidgetDefinition> = new Map();

  private constructor() {
    this.registerDefaultWidgets();
  }

  public static getInstance(): WidgetRegistry {
    if (!WidgetRegistry.instance) {
      WidgetRegistry.instance = new WidgetRegistry();
    }
    return WidgetRegistry.instance;
  }

  /**
   * Register a new widget type
   */
  public registerWidget(widgetDefinition: WidgetDefinition): void {
    if (this.widgets.has(widgetDefinition.type)) {
      console.warn(`Widget type ${widgetDefinition.type} is already registered. Overwriting.`);
    }
    
    this.widgets.set(widgetDefinition.type, widgetDefinition);
  }

  /**
   * Get a widget definition by type
   */
  public getWidgetDefinition(type: string): WidgetDefinition | undefined {
    return this.widgets.get(type);
  }

  /**
   * Get all registered widget definitions
   */
  public getAllWidgetDefinitions(): WidgetDefinition[] {
    return Array.from(this.widgets.values());
  }

  /**
   * Get widget definitions by category
   */
  public getWidgetDefinitionsByCategory(category: string): WidgetDefinition[] {
    return this.getAllWidgetDefinitions().filter(widget => widget.category === category);
  }

  /**
   * Check if a widget type is registered
   */
  public hasWidgetType(type: string): boolean {
    return this.widgets.has(type);
  }

  /**
   * Register default widgets
   */
  private registerDefaultWidgets(): void {
    // Market widgets
    this.registerWidget({
      type: 'MarketOverviewWidget',
      name: 'Market Overview',
      description: 'Displays key market indices and their performance',
      category: 'Market',
      icon: 'trending_up',
      defaultSettings: {
        showIndices: true,
        showTopMovers: true,
        refreshInterval: 60
      },
      defaultSize: { w: 6, h: 4 }
    });

    this.registerWidget({
      type: 'MarketHeatmapWidget',
      name: 'Market Heatmap',
      description: 'Visual representation of market performance by sector',
      category: 'Market',
      icon: 'grid_view',
      defaultSettings: {
        view: 'sector',
        colorScale: 'RdYlGn',
        sizeBy: 'marketCap'
      },
      defaultSize: { w: 6, h: 6 }
    });

    this.registerWidget({
      type: 'NewsWidget',
      name: 'News Feed',
      description: 'Latest financial news from various sources',
      category: 'Market',
      icon: 'newspaper',
      defaultSettings: {
        sources: ['bloomberg', 'reuters', 'wsj'],
        categories: ['markets', 'economy'],
        limit: 10
      },
      defaultSize: { w: 6, h: 6 }
    });

    // Portfolio widgets
    this.registerWidget({
      type: 'PortfolioSummaryWidget',
      name: 'Portfolio Summary',
      description: 'Overview of your portfolio performance',
      category: 'Portfolio',
      icon: 'account_balance',
      defaultSettings: {
        showPerformance: true,
        showAllocation: true,
        period: '1M'
      },
      defaultSize: { w: 6, h: 4 }
    });

    this.registerWidget({
      type: 'PortfolioAllocationWidget',
      name: 'Portfolio Allocation',
      description: 'Asset allocation breakdown of your portfolio',
      category: 'Portfolio',
      icon: 'pie_chart',
      defaultSettings: {
        view: 'asset_class',
        showLegend: true,
        showPercentages: true
      },
      defaultSize: { w: 4, h: 4 }
    });

    this.registerWidget({
      type: 'PositionsTableWidget',
      name: 'Positions Table',
      description: 'Detailed table of all positions in your portfolio',
      category: 'Portfolio',
      icon: 'table_chart',
      defaultSettings: {
        columns: ['symbol', 'quantity', 'price', 'value', 'dayChange', 'totalReturn'],
        sortBy: 'value',
        sortDirection: 'desc'
      },
      defaultSize: { w: 12, h: 6 }
    });

    // Trading widgets
    this.registerWidget({
      type: 'OrderEntryWidget',
      name: 'Order Entry',
      description: 'Place new orders for stocks and other assets',
      category: 'Trading',
      icon: 'add_shopping_cart',
      defaultSettings: {
        defaultSymbol: '',
        showAdvancedOptions: false
      },
      defaultSize: { w: 4, h: 6 }
    });

    this.registerWidget({
      type: 'ChartWidget',
      name: 'Price Chart',
      description: 'Interactive price chart with technical indicators',
      category: 'Trading',
      icon: 'show_chart',
      defaultSettings: {
        symbol: 'SPY',
        timeframe: '1D',
        chartType: 'candle',
        indicators: ['SMA']
      },
      defaultSize: { w: 8, h: 6 }
    });

    this.registerWidget({
      type: 'WatchlistWidget',
      name: 'Watchlist',
      description: 'Monitor a list of securities',
      category: 'Trading',
      icon: 'visibility',
      defaultSettings: {
        watchlistId: 'default',
        showCharts: true,
        refreshInterval: 30
      },
      defaultSize: { w: 6, h: 6 }
    });

    // Analytics widgets
    this.registerWidget({
      type: 'PerformanceAnalyticsWidget',
      name: 'Performance Analytics',
      description: 'Detailed analysis of portfolio performance',
      category: 'Analytics',
      icon: 'analytics',
      defaultSettings: {
        period: '1Y',
        benchmark: 'SPY',
        metrics: ['alpha', 'beta', 'sharpe', 'drawdown']
      },
      defaultSize: { w: 6, h: 6 }
    });

    this.registerWidget({
      type: 'RiskAnalyticsWidget',
      name: 'Risk Analytics',
      description: 'Risk metrics and analysis for your portfolio',
      category: 'Analytics',
      icon: 'warning',
      defaultSettings: {
        riskMetrics: ['var', 'volatility', 'beta', 'correlation'],
        confidenceInterval: 0.95,
        timeHorizon: '1M'
      },
      defaultSize: { w: 6, h: 6 }
    });

    // ML widgets
    this.registerWidget({
      type: 'MLInsightsWidget',
      name: 'ML Insights',
      description: 'Machine learning-based market insights',
      category: 'ML',
      icon: 'psychology',
      defaultSettings: {
        insightTypes: ['trend', 'anomaly', 'prediction'],
        confidenceThreshold: 0.7,
        limit: 5
      },
      defaultSize: { w: 6, h: 4 }
    });

    this.registerWidget({
      type: 'PredictionWidget',
      name: 'Price Predictions',
      description: 'ML-based price predictions for selected assets',
      category: 'ML',
      icon: 'timeline',
      defaultSettings: {
        symbols: ['AAPL', 'MSFT', 'GOOGL'],
        timeHorizon: '1W',
        showConfidenceIntervals: true
      },
      defaultSize: { w: 6, h: 6 }
    });
  }
}

export default WidgetRegistry;