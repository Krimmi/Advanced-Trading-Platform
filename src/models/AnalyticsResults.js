const mongoose = require('mongoose');

// Schema for Backtest Results
const BacktestResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  strategyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Strategy',
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
  symbols: {
    type: [String],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  initialCapital: {
    type: Number,
    required: true
  },
  finalCapital: {
    type: Number,
    required: true
  },
  // Return metrics
  totalReturn: {
    type: Number,
    required: true
  },
  totalReturnPercent: {
    type: Number,
    required: true
  },
  annualizedReturn: {
    type: Number,
    required: true
  },
  annualizedVolatility: {
    type: Number,
    required: true
  },
  sharpeRatio: {
    type: Number,
    required: true
  },
  sortinoRatio: {
    type: Number,
    required: true
  },
  calmarRatio: {
    type: Number,
    required: true
  },
  // Drawdown metrics
  maxDrawdown: {
    type: Number,
    required: true
  },
  maxDrawdownPercent: {
    type: Number,
    required: true
  },
  maxDrawdownDuration: {
    type: Number, // in days
    required: true
  },
  averageDrawdown: {
    type: Number,
    required: true
  },
  averageDrawdownPercent: {
    type: Number,
    required: true
  },
  averageDrawdownDuration: {
    type: Number, // in days
    required: true
  },
  // Trade metrics
  totalTrades: {
    type: Number,
    required: true
  },
  winningTrades: {
    type: Number,
    required: true
  },
  losingTrades: {
    type: Number,
    required: true
  },
  winRate: {
    type: Number,
    required: true
  },
  averageWin: {
    type: Number,
    required: true
  },
  averageLoss: {
    type: Number,
    required: true
  },
  averageWinPercent: {
    type: Number,
    required: true
  },
  averageLossPercent: {
    type: Number,
    required: true
  },
  largestWin: {
    type: Number,
    required: true
  },
  largestLoss: {
    type: Number,
    required: true
  },
  profitFactor: {
    type: Number,
    required: true
  },
  expectancy: {
    type: Number,
    required: true
  },
  // Time metrics
  averageHoldingPeriod: {
    type: Number, // in days
    required: true
  },
  averageWinningHoldingPeriod: {
    type: Number, // in days
    required: true
  },
  averageLosingHoldingPeriod: {
    type: Number, // in days
    required: true
  },
  // Risk metrics
  beta: {
    type: Number,
    required: false
  },
  alpha: {
    type: Number,
    required: false
  },
  informationRatio: {
    type: Number,
    required: false
  },
  treynorRatio: {
    type: Number,
    required: false
  },
  // Detailed data
  equityCurve: [{
    date: {
      type: Date,
      required: true
    },
    equity: {
      type: Number,
      required: true
    },
    drawdown: {
      type: Number,
      required: true
    },
    drawdownPercent: {
      type: Number,
      required: true
    }
  }],
  monthlyReturns: {
    type: Map,
    of: Map,
    required: true
  },
  trades: [{
    id: {
      type: String,
      required: true
    },
    symbol: {
      type: String,
      required: true
    },
    entryDate: {
      type: Date,
      required: true
    },
    entryPrice: {
      type: Number,
      required: true
    },
    entryQuantity: {
      type: Number,
      required: true
    },
    exitDate: {
      type: Date,
      required: false
    },
    exitPrice: {
      type: Number,
      required: false
    },
    exitQuantity: {
      type: Number,
      required: false
    },
    pnl: {
      type: Number,
      required: false
    },
    pnlPercent: {
      type: Number,
      required: false
    },
    holdingPeriod: {
      type: Number, // in days
      required: false
    },
    side: {
      type: String,
      enum: ['long', 'short'],
      required: true
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'partially_closed'],
      required: true
    },
    fees: {
      type: Number,
      required: false
    },
    strategyId: {
      type: String,
      required: true
    },
    tags: {
      type: [String],
      required: false
    },
    notes: {
      type: String,
      required: false
    }
  }],
  // Market comparison
  benchmarkSymbol: {
    type: String,
    required: false
  },
  benchmarkReturn: {
    type: Number,
    required: false
  },
  benchmarkAlpha: {
    type: Number,
    required: false
  },
  // Additional metrics
  customMetrics: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: false
  },
  // Strategy parameters used
  strategyParameters: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true
  },
  // Execution details
  executionTime: {
    type: Number, // in milliseconds
    required: true
  },
  executedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['completed', 'failed', 'running', 'cancelled'],
    default: 'completed'
  },
  errorMessage: {
    type: String,
    required: false
  }
}, { timestamps: true });

// Create indexes for backtest results
BacktestResultSchema.index({ userId: 1, strategyId: 1, createdAt: -1 });
BacktestResultSchema.index({ userId: 1, createdAt: -1 });
BacktestResultSchema.index({ strategyId: 1, createdAt: -1 });

// Schema for Risk Analysis Results
const RiskAnalysisResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  portfolioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
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
  analysisType: {
    type: String,
    enum: ['var', 'stress_test', 'correlation', 'sensitivity', 'scenario'],
    required: true
  },
  analysisDate: {
    type: Date,
    default: Date.now
  },
  // VaR Analysis
  varAnalysis: {
    method: {
      type: String,
      enum: ['historical', 'parametric', 'monte_carlo'],
      required: function() { return this.analysisType === 'var'; }
    },
    confidenceLevel: {
      type: Number,
      required: function() { return this.analysisType === 'var'; }
    },
    timeframe: {
      type: String,
      enum: ['1day', '5day', '10day', '20day'],
      required: function() { return this.analysisType === 'var'; }
    },
    varAmount: {
      type: Number,
      required: function() { return this.analysisType === 'var'; }
    },
    varPercentage: {
      type: Number,
      required: function() { return this.analysisType === 'var'; }
    },
    expectedShortfall: {
      type: Number,
      required: function() { return this.analysisType === 'var'; }
    },
    expectedShortfallPercentage: {
      type: Number,
      required: function() { return this.analysisType === 'var'; }
    },
    assetContributions: [{
      symbol: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      contribution: {
        type: Number,
        required: true
      },
      weight: {
        type: Number,
        required: true
      }
    }],
    riskFactorContributions: [{
      factor: {
        type: String,
        required: true
      },
      contribution: {
        type: Number,
        required: true
      }
    }]
  },
  // Stress Test Analysis
  stressTestAnalysis: {
    scenarioName: {
      type: String,
      required: function() { return this.analysisType === 'stress_test'; }
    },
    scenarioDescription: {
      type: String,
      required: function() { return this.analysisType === 'stress_test'; }
    },
    portfolioValueBefore: {
      type: Number,
      required: function() { return this.analysisType === 'stress_test'; }
    },
    portfolioValueAfter: {
      type: Number,
      required: function() { return this.analysisType === 'stress_test'; }
    },
    changeAmount: {
      type: Number,
      required: function() { return this.analysisType === 'stress_test'; }
    },
    changePercent: {
      type: Number,
      required: function() { return this.analysisType === 'stress_test'; }
    },
    maxDrawdown: {
      type: Number,
      required: function() { return this.analysisType === 'stress_test'; }
    },
    recoveryTime: {
      type: Number, // in months
      required: function() { return this.analysisType === 'stress_test'; }
    },
    assetImpacts: [{
      symbol: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      beforeValue: {
        type: Number,
        required: true
      },
      afterValue: {
        type: Number,
        required: true
      },
      changePercent: {
        type: Number,
        required: true
      }
    }],
    sectorImpacts: [{
      sector: {
        type: String,
        required: true
      },
      beforeValue: {
        type: Number,
        required: true
      },
      afterValue: {
        type: Number,
        required: true
      },
      changePercent: {
        type: Number,
        required: true
      }
    }],
    mitigationStrategies: [{
      strategy: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      },
      impactReduction: {
        type: Number,
        required: true
      },
      implementationCost: {
        type: Number,
        required: true
      }
    }]
  },
  // Correlation Analysis
  correlationAnalysis: {
    timeframe: {
      type: String,
      enum: ['1month', '3month', '6month', '1year', '3year', '5year'],
      required: function() { return this.analysisType === 'correlation'; }
    },
    averageCorrelation: {
      type: Number,
      required: function() { return this.analysisType === 'correlation'; }
    },
    diversificationScore: {
      type: Number,
      required: function() { return this.analysisType === 'correlation'; }
    },
    correlationMatrix: {
      symbols: {
        type: [String],
        required: function() { return this.analysisType === 'correlation'; }
      },
      names: {
        type: [String],
        required: function() { return this.analysisType === 'correlation'; }
      },
      matrix: {
        type: [[Number]],
        required: function() { return this.analysisType === 'correlation'; }
      }
    },
    sectorCorrelations: [{
      sector1: {
        type: String,
        required: true
      },
      sector2: {
        type: String,
        required: true
      },
      correlation: {
        type: Number,
        required: true
      }
    }],
    optimizationSuggestions: [{
      suggestion: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      },
      expectedImpact: {
        type: String,
        required: true
      }
    }]
  },
  // Sensitivity Analysis
  sensitivityAnalysis: {
    factorName: {
      type: String,
      required: function() { return this.analysisType === 'sensitivity'; }
    },
    factorDescription: {
      type: String,
      required: function() { return this.analysisType === 'sensitivity'; }
    },
    factorValues: {
      type: [Number],
      required: function() { return this.analysisType === 'sensitivity'; }
    },
    portfolioValues: {
      type: [Number],
      required: function() { return this.analysisType === 'sensitivity'; }
    },
    assetSensitivities: [{
      symbol: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      beta: {
        type: Number,
        required: true
      },
      values: {
        type: [Number],
        required: true
      }
    }]
  },
  // Scenario Analysis
  scenarioAnalysis: {
    scenarioName: {
      type: String,
      required: function() { return this.analysisType === 'scenario'; }
    },
    scenarioDescription: {
      type: String,
      required: function() { return this.analysisType === 'scenario'; }
    },
    scenarioParameters: {
      type: Map,
      of: Number,
      required: function() { return this.analysisType === 'scenario'; }
    },
    portfolioValueBefore: {
      type: Number,
      required: function() { return this.analysisType === 'scenario'; }
    },
    portfolioValueAfter: {
      type: Number,
      required: function() { return this.analysisType === 'scenario'; }
    },
    changeAmount: {
      type: Number,
      required: function() { return this.analysisType === 'scenario'; }
    },
    changePercent: {
      type: Number,
      required: function() { return this.analysisType === 'scenario'; }
    },
    assetImpacts: [{
      symbol: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      beforeValue: {
        type: Number,
        required: true
      },
      afterValue: {
        type: Number,
        required: true
      },
      changePercent: {
        type: Number,
        required: true
      }
    }]
  },
  // Execution details
  executionTime: {
    type: Number, // in milliseconds
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'failed', 'running', 'cancelled'],
    default: 'completed'
  },
  errorMessage: {
    type: String,
    required: false
  }
}, { timestamps: true });

// Create indexes for risk analysis results
RiskAnalysisResultSchema.index({ userId: 1, portfolioId: 1, analysisType: 1, createdAt: -1 });
RiskAnalysisResultSchema.index({ userId: 1, createdAt: -1 });
RiskAnalysisResultSchema.index({ portfolioId: 1, createdAt: -1 });

// Schema for Machine Learning Results
const MachineLearningResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  modelId: {
    type: String,
    required: true,
    index: true
  },
  modelType: {
    type: String,
    enum: ['prediction', 'classification', 'anomaly_detection', 'clustering', 'sentiment_analysis'],
    required: true
  },
  modelName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  symbols: {
    type: [String],
    required: true
  },
  targetVariable: {
    type: String,
    required: true
  },
  features: {
    type: [String],
    required: true
  },
  trainStartDate: {
    type: Date,
    required: true
  },
  trainEndDate: {
    type: Date,
    required: true
  },
  testStartDate: {
    type: Date,
    required: true
  },
  testEndDate: {
    type: Date,
    required: true
  },
  // Model performance metrics
  trainingMetrics: {
    accuracy: {
      type: Number,
      required: false
    },
    precision: {
      type: Number,
      required: false
    },
    recall: {
      type: Number,
      required: false
    },
    f1Score: {
      type: Number,
      required: false
    },
    mse: {
      type: Number,
      required: false
    },
    rmse: {
      type: Number,
      required: false
    },
    mae: {
      type: Number,
      required: false
    },
    r2: {
      type: Number,
      required: false
    }
  },
  testingMetrics: {
    accuracy: {
      type: Number,
      required: false
    },
    precision: {
      type: Number,
      required: false
    },
    recall: {
      type: Number,
      required: false
    },
    f1Score: {
      type: Number,
      required: false
    },
    mse: {
      type: Number,
      required: false
    },
    rmse: {
      type: Number,
      required: false
    },
    mae: {
      type: Number,
      required: false
    },
    r2: {
      type: Number,
      required: false
    }
  },
  // Feature importance
  featureImportance: [{
    feature: {
      type: String,
      required: true
    },
    importance: {
      type: Number,
      required: true
    }
  }],
  // Predictions or results
  predictions: [{
    date: {
      type: Date,
      required: true
    },
    symbol: {
      type: String,
      required: true
    },
    actual: {
      type: Number,
      required: false
    },
    predicted: {
      type: Number,
      required: true
    },
    confidence: {
      type: Number,
      required: false
    }
  }],
  // Model parameters
  hyperparameters: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true
  },
  // Model storage
  modelStoragePath: {
    type: String,
    required: false
  },
  // Execution details
  trainingTime: {
    type: Number, // in milliseconds
    required: true
  },
  inferenceTime: {
    type: Number, // in milliseconds
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['completed', 'failed', 'running', 'cancelled'],
    default: 'completed'
  },
  errorMessage: {
    type: String,
    required: false
  }
}, { timestamps: true });

// Create indexes for machine learning results
MachineLearningResultSchema.index({ userId: 1, modelType: 1, createdAt: -1 });
MachineLearningResultSchema.index({ userId: 1, symbols: 1, createdAt: -1 });
MachineLearningResultSchema.index({ modelId: 1 }, { unique: true });

// Create models
const BacktestResult = mongoose.model('BacktestResult', BacktestResultSchema);
const RiskAnalysisResult = mongoose.model('RiskAnalysisResult', RiskAnalysisResultSchema);
const MachineLearningResult = mongoose.model('MachineLearningResult', MachineLearningResultSchema);

module.exports = {
  BacktestResult,
  RiskAnalysisResult,
  MachineLearningResult
};