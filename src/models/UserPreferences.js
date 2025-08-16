const mongoose = require('mongoose');

// Schema for User Preferences
const UserPreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  // UI Preferences
  ui: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    density: {
      type: String,
      enum: ['compact', 'comfortable', 'spacious'],
      default: 'comfortable'
    },
    defaultDashboard: {
      type: String,
      enum: ['overview', 'portfolio', 'watchlist', 'analytics', 'trading'],
      default: 'overview'
    },
    chartPreferences: {
      defaultTimeframe: {
        type: String,
        enum: ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'MAX'],
        default: '1M'
      },
      defaultChartType: {
        type: String,
        enum: ['candle', 'line', 'area', 'bar', 'heikin-ashi'],
        default: 'candle'
      },
      showVolume: {
        type: Boolean,
        default: true
      },
      showAfterHours: {
        type: Boolean,
        default: true
      },
      defaultIndicators: {
        type: [String],
        default: ['SMA-50', 'SMA-200', 'MACD', 'RSI']
      },
      colors: {
        up: {
          type: String,
          default: '#26a69a' // Green
        },
        down: {
          type: String,
          default: '#ef5350' // Red
        },
        line: {
          type: String,
          default: '#2196f3' // Blue
        },
        volume: {
          type: String,
          default: '#b0bec5' // Gray
        },
        grid: {
          type: String,
          default: '#e0e0e0' // Light Gray
        }
      }
    },
    tablePreferences: {
      rowsPerPage: {
        type: Number,
        enum: [10, 25, 50, 100],
        default: 25
      },
      defaultSortColumn: {
        type: String,
        default: 'symbol'
      },
      defaultSortDirection: {
        type: String,
        enum: ['asc', 'desc'],
        default: 'asc'
      },
      visibleColumns: {
        type: Map,
        of: Boolean,
        default: {
          symbol: true,
          name: true,
          lastPrice: true,
          change: true,
          changePercent: true,
          volume: true,
          marketCap: true
        }
      }
    },
    layoutPreferences: {
      sidebarCollapsed: {
        type: Boolean,
        default: false
      },
      widgetLayout: {
        type: Map,
        of: {
          x: Number,
          y: Number,
          w: Number,
          h: Number,
          visible: Boolean
        },
        default: {
          portfolio: { x: 0, y: 0, w: 12, h: 6, visible: true },
          watchlist: { x: 0, y: 6, w: 6, h: 6, visible: true },
          news: { x: 6, y: 6, w: 6, h: 6, visible: true },
          chart: { x: 0, y: 12, w: 12, h: 8, visible: true }
        }
      }
    }
  },
  // Notification Preferences
  notifications: {
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      frequency: {
        type: String,
        enum: ['instant', 'hourly', 'daily', 'weekly'],
        default: 'daily'
      },
      types: {
        priceAlerts: {
          type: Boolean,
          default: true
        },
        tradeExecutions: {
          type: Boolean,
          default: true
        },
        accountActivity: {
          type: Boolean,
          default: true
        },
        marketNews: {
          type: Boolean,
          default: true
        },
        earningsAnnouncements: {
          type: Boolean,
          default: true
        },
        dividendAnnouncements: {
          type: Boolean,
          default: true
        },
        systemNotifications: {
          type: Boolean,
          default: true
        }
      }
    },
    push: {
      enabled: {
        type: Boolean,
        default: true
      },
      types: {
        priceAlerts: {
          type: Boolean,
          default: true
        },
        tradeExecutions: {
          type: Boolean,
          default: true
        },
        accountActivity: {
          type: Boolean,
          default: false
        },
        marketNews: {
          type: Boolean,
          default: false
        },
        earningsAnnouncements: {
          type: Boolean,
          default: true
        },
        dividendAnnouncements: {
          type: Boolean,
          default: true
        },
        systemNotifications: {
          type: Boolean,
          default: true
        }
      }
    },
    sms: {
      enabled: {
        type: Boolean,
        default: false
      },
      phoneNumber: {
        type: String,
        required: false
      },
      types: {
        priceAlerts: {
          type: Boolean,
          default: true
        },
        tradeExecutions: {
          type: Boolean,
          default: true
        },
        accountActivity: {
          type: Boolean,
          default: false
        },
        marketNews: {
          type: Boolean,
          default: false
        },
        earningsAnnouncements: {
          type: Boolean,
          default: false
        },
        dividendAnnouncements: {
          type: Boolean,
          default: false
        },
        systemNotifications: {
          type: Boolean,
          default: false
        }
      }
    },
    doNotDisturb: {
      enabled: {
        type: Boolean,
        default: false
      },
      startTime: {
        type: String,
        default: '22:00' // 10:00 PM
      },
      endTime: {
        type: String,
        default: '08:00' // 8:00 AM
      },
      timezone: {
        type: String,
        default: 'America/New_York'
      },
      exceptUrgent: {
        type: Boolean,
        default: true
      }
    }
  },
  // Trading Preferences
  trading: {
    defaultOrderType: {
      type: String,
      enum: ['market', 'limit', 'stop', 'stop_limit', 'trailing_stop'],
      default: 'market'
    },
    defaultTimeInForce: {
      type: String,
      enum: ['day', 'gtc', 'opg', 'cls', 'ioc', 'fok'],
      default: 'day'
    },
    confirmations: {
      orderSubmit: {
        type: Boolean,
        default: true
      },
      orderCancel: {
        type: Boolean,
        default: true
      },
      orderModify: {
        type: Boolean,
        default: true
      },
      marketOrders: {
        type: Boolean,
        default: true
      },
      limitOrders: {
        type: Boolean,
        default: false
      },
      stopOrders: {
        type: Boolean,
        default: true
      }
    },
    defaultQuantity: {
      type: Number,
      default: 1
    },
    riskManagement: {
      enableStopLoss: {
        type: Boolean,
        default: false
      },
      defaultStopLossPercent: {
        type: Number,
        default: 5
      },
      enableTakeProfit: {
        type: Boolean,
        default: false
      },
      defaultTakeProfitPercent: {
        type: Number,
        default: 10
      },
      enableTrailingStop: {
        type: Boolean,
        default: false
      },
      defaultTrailingStopPercent: {
        type: Number,
        default: 3
      },
      maxPositionSizePercent: {
        type: Number,
        default: 10
      },
      maxSectorExposurePercent: {
        type: Number,
        default: 30
      }
    }
  },
  // Data Preferences
  data: {
    defaultDataProvider: {
      type: String,
      enum: ['alpaca', 'polygon', 'iex', 'fmp'],
      default: 'alpaca'
    },
    refreshIntervals: {
      quotes: {
        type: Number, // in seconds
        default: 5
      },
      charts: {
        type: Number, // in seconds
        default: 60
      },
      watchlist: {
        type: Number, // in seconds
        default: 10
      },
      portfolio: {
        type: Number, // in seconds
        default: 30
      },
      news: {
        type: Number, // in seconds
        default: 300
      }
    },
    preloadData: {
      type: Boolean,
      default: true
    },
    cacheSettings: {
      enabled: {
        type: Boolean,
        default: true
      },
      maxAge: {
        type: Number, // in seconds
        default: 3600
      },
      maxSize: {
        type: Number, // in MB
        default: 100
      }
    }
  },
  // Research Preferences
  research: {
    defaultScreenerCriteria: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {
        marketCap: { min: 1000000000 },
        sector: [],
        pe: { min: 0, max: 50 }
      }
    },
    savedScreeners: [{
      name: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: false
      },
      criteria: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    defaultFundamentalMetrics: {
      type: [String],
      default: ['PE', 'EPS', 'MarketCap', 'DividendYield', 'PriceToBook', 'DebtToEquity']
    },
    defaultTechnicalIndicators: {
      type: [String],
      default: ['SMA', 'EMA', 'RSI', 'MACD', 'Bollinger']
    }
  },
  // Accessibility Preferences
  accessibility: {
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large', 'x-large'],
      default: 'medium'
    },
    highContrast: {
      type: Boolean,
      default: false
    },
    reduceMotion: {
      type: Boolean,
      default: false
    },
    enableKeyboardShortcuts: {
      type: Boolean,
      default: true
    },
    screenReaderOptimized: {
      type: Boolean,
      default: false
    }
  },
  // Security Preferences
  security: {
    twoFactorAuthentication: {
      enabled: {
        type: Boolean,
        default: false
      },
      method: {
        type: String,
        enum: ['app', 'sms', 'email'],
        default: 'app'
      }
    },
    sessionTimeout: {
      type: Number, // in minutes
      default: 30
    },
    ipWhitelist: {
      enabled: {
        type: Boolean,
        default: false
      },
      addresses: {
        type: [String],
        default: []
      }
    },
    loginNotifications: {
      type: Boolean,
      default: true
    },
    activityAlerts: {
      type: Boolean,
      default: true
    }
  },
  // Last updated timestamp
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Schema for User Watchlists
const WatchlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  symbols: [{
    symbol: {
      type: String,
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      required: false
    },
    alertSettings: {
      priceAbove: {
        enabled: {
          type: Boolean,
          default: false
        },
        value: {
          type: Number,
          required: false
        }
      },
      priceBelow: {
        enabled: {
          type: Boolean,
          default: false
        },
        value: {
          type: Number,
          required: false
        }
      },
      percentChange: {
        enabled: {
          type: Boolean,
          default: false
        },
        value: {
          type: Number,
          required: false
        }
      },
      volumeSpike: {
        enabled: {
          type: Boolean,
          default: false
        },
        value: {
          type: Number,
          required: false
        }
      }
    }
  }],
  sortOrder: {
    field: {
      type: String,
      default: 'symbol'
    },
    direction: {
      type: String,
      enum: ['asc', 'desc'],
      default: 'asc'
    }
  },
  visibility: {
    type: String,
    enum: ['private', 'public', 'shared'],
    default: 'private'
  },
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['read', 'write'],
      default: 'read'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for userId and name
WatchlistSchema.index({ userId: 1, name: 1 }, { unique: true });

// Schema for User Alerts
const AlertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  symbol: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  type: {
    type: String,
    enum: ['price', 'technical', 'fundamental', 'news', 'earnings', 'custom'],
    required: true
  },
  conditions: {
    // Price alerts
    price: {
      operator: {
        type: String,
        enum: ['above', 'below', 'equal', 'percent_change'],
        required: function() { return this.type === 'price'; }
      },
      value: {
        type: Number,
        required: function() { return this.type === 'price'; }
      },
      percentChangeType: {
        type: String,
        enum: ['increase', 'decrease', 'either'],
        required: function() { return this.type === 'price' && this.conditions.price.operator === 'percent_change'; }
      },
      timeframe: {
        type: String,
        enum: ['intraday', '1day', '1week', '1month'],
        required: function() { return this.type === 'price' && this.conditions.price.operator === 'percent_change'; }
      }
    },
    // Technical alerts
    technical: {
      indicator: {
        type: String,
        enum: ['sma', 'ema', 'rsi', 'macd', 'bollinger', 'volume', 'atr', 'custom'],
        required: function() { return this.type === 'technical'; }
      },
      parameters: {
        type: Map,
        of: Number,
        required: function() { return this.type === 'technical'; }
      },
      operator: {
        type: String,
        enum: ['crosses_above', 'crosses_below', 'above', 'below', 'equal'],
        required: function() { return this.type === 'technical'; }
      },
      value: {
        type: Number,
        required: function() { return this.type === 'technical' && ['above', 'below', 'equal'].includes(this.conditions.technical.operator); }
      },
      compareIndicator: {
        type: String,
        required: function() { return this.type === 'technical' && ['crosses_above', 'crosses_below'].includes(this.conditions.technical.operator); }
      },
      compareParameters: {
        type: Map,
        of: Number,
        required: function() { return this.type === 'technical' && ['crosses_above', 'crosses_below'].includes(this.conditions.technical.operator); }
      }
    },
    // Fundamental alerts
    fundamental: {
      metric: {
        type: String,
        enum: ['eps', 'pe', 'pb', 'dividend_yield', 'market_cap', 'revenue', 'debt_to_equity', 'custom'],
        required: function() { return this.type === 'fundamental'; }
      },
      operator: {
        type: String,
        enum: ['above', 'below', 'equal', 'percent_change'],
        required: function() { return this.type === 'fundamental'; }
      },
      value: {
        type: Number,
        required: function() { return this.type === 'fundamental'; }
      },
      percentChangeType: {
        type: String,
        enum: ['increase', 'decrease', 'either'],
        required: function() { return this.type === 'fundamental' && this.conditions.fundamental.operator === 'percent_change'; }
      }
    },
    // News alerts
    news: {
      keywords: {
        type: [String],
        required: function() { return this.type === 'news'; }
      },
      sources: {
        type: [String],
        required: false
      },
      sentiment: {
        type: String,
        enum: ['positive', 'negative', 'neutral', 'any'],
        default: 'any',
        required: function() { return this.type === 'news'; }
      }
    },
    // Earnings alerts
    earnings: {
      eventType: {
        type: String,
        enum: ['announcement', 'surprise', 'estimate_change', 'conference_call'],
        required: function() { return this.type === 'earnings'; }
      },
      operator: {
        type: String,
        enum: ['above', 'below', 'equal', 'percent_change'],
        required: function() { return this.type === 'earnings' && ['surprise', 'estimate_change'].includes(this.conditions.earnings.eventType); }
      },
      value: {
        type: Number,
        required: function() { return this.type === 'earnings' && ['surprise', 'estimate_change'].includes(this.conditions.earnings.eventType); }
      }
    },
    // Custom alerts
    custom: {
      expression: {
        type: String,
        required: function() { return this.type === 'custom'; }
      }
    }
  },
  status: {
    type: String,
    enum: ['active', 'triggered', 'expired', 'disabled'],
    default: 'active'
  },
  frequency: {
    type: String,
    enum: ['once', 'always'],
    default: 'once'
  },
  expirationDate: {
    type: Date,
    required: false
  },
  notificationChannels: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    inApp: {
      type: Boolean,
      default: true
    }
  },
  lastTriggered: {
    type: Date,
    required: false
  },
  triggerCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for alerts
AlertSchema.index({ userId: 1, symbol: 1, type: 1 });
AlertSchema.index({ status: 1 });

// Create models
const UserPreferences = mongoose.model('UserPreferences', UserPreferencesSchema);
const Watchlist = mongoose.model('Watchlist', WatchlistSchema);
const Alert = mongoose.model('Alert', AlertSchema);

module.exports = {
  UserPreferences,
  Watchlist,
  Alert
};