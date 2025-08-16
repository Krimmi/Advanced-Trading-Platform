const mongoose = require('mongoose');

// Schema for Quote data
const QuoteSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    index: true
  },
  bidPrice: {
    type: Number,
    required: true
  },
  bidSize: {
    type: Number,
    required: true
  },
  askPrice: {
    type: Number,
    required: true
  },
  askSize: {
    type: Number,
    required: true
  },
  lastPrice: {
    type: Number,
    required: true
  },
  lastSize: {
    type: Number,
    required: true
  },
  volume: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  exchange: {
    type: String,
    required: false
  },
  conditions: {
    type: [String],
    required: false
  },
  dataProvider: {
    type: String,
    enum: ['alpaca', 'polygon', 'iex', 'fmp'],
    required: true
  },
  dataQuality: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  }
}, { timestamps: true });

// Create a compound index for symbol and timestamp
QuoteSchema.index({ symbol: 1, timestamp: -1 }, { unique: true });

// Schema for Bar/Candle data
const BarSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    index: true
  },
  open: {
    type: Number,
    required: true
  },
  high: {
    type: Number,
    required: true
  },
  low: {
    type: Number,
    required: true
  },
  close: {
    type: Number,
    required: true
  },
  volume: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  interval: {
    type: String,
    enum: ['1min', '5min', '15min', '30min', '1hour', '1day', '1week', '1month'],
    required: true,
    index: true
  },
  adjustedClose: {
    type: Number,
    required: false
  },
  dividendAmount: {
    type: Number,
    default: 0
  },
  splitCoefficient: {
    type: Number,
    default: 1
  },
  dataProvider: {
    type: String,
    enum: ['alpaca', 'polygon', 'iex', 'fmp'],
    required: true
  },
  dataQuality: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  }
}, { timestamps: true });

// Create a compound index for symbol, interval, and timestamp
BarSchema.index({ symbol: 1, interval: 1, timestamp: -1 }, { unique: true });

// Schema for Trade data
const TradeSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    index: true
  },
  price: {
    type: Number,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  exchange: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  conditions: {
    type: [String],
    required: false
  },
  tradeId: {
    type: String,
    required: false
  },
  tape: {
    type: String,
    required: false
  },
  dataProvider: {
    type: String,
    enum: ['alpaca', 'polygon', 'iex', 'fmp'],
    required: true
  },
  dataQuality: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  }
}, { timestamps: true });

// Create a compound index for symbol and timestamp
TradeSchema.index({ symbol: 1, timestamp: -1 });

// Schema for Technical Indicators
const TechnicalIndicatorSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    index: true
  },
  indicator: {
    type: String,
    required: true,
    index: true
  },
  parameters: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  interval: {
    type: String,
    enum: ['1min', '5min', '15min', '30min', '1hour', '1day', '1week', '1month'],
    required: true,
    index: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  dataProvider: {
    type: String,
    enum: ['alpaca', 'polygon', 'iex', 'fmp', 'calculated'],
    required: true
  }
}, { timestamps: true });

// Create a compound index for symbol, indicator, parameters, interval, and timestamp
TechnicalIndicatorSchema.index({ 
  symbol: 1, 
  indicator: 1, 
  'parameters': 1, 
  interval: 1, 
  timestamp: -1 
}, { unique: true });

// Schema for Symbol Metadata
const SymbolMetadataSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  exchange: {
    type: String,
    required: true
  },
  assetType: {
    type: String,
    enum: ['equity', 'etf', 'forex', 'crypto', 'future', 'option', 'index'],
    required: true
  },
  sector: {
    type: String,
    required: false
  },
  industry: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: false
  },
  website: {
    type: String,
    required: false
  },
  logo: {
    type: String,
    required: false
  },
  country: {
    type: String,
    required: false
  },
  currency: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  dataProviders: {
    type: [String],
    enum: ['alpaca', 'polygon', 'iex', 'fmp'],
    required: true
  }
}, { timestamps: true });

// Schema for Market News
const MarketNewsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: false
  },
  url: {
    type: String,
    required: true
  },
  publishedAt: {
    type: Date,
    required: true,
    index: true
  },
  source: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: false
  },
  symbols: {
    type: [String],
    required: false,
    index: true
  },
  categories: {
    type: [String],
    required: false,
    index: true
  },
  sentiment: {
    score: {
      type: Number,
      min: -1,
      max: 1,
      required: false
    },
    magnitude: {
      type: Number,
      min: 0,
      required: false
    }
  },
  dataProvider: {
    type: String,
    enum: ['alpaca', 'polygon', 'iex', 'fmp', 'newsapi'],
    required: true
  }
}, { timestamps: true });

// Create indexes for news
MarketNewsSchema.index({ publishedAt: -1 });
MarketNewsSchema.index({ symbols: 1, publishedAt: -1 });
MarketNewsSchema.index({ categories: 1, publishedAt: -1 });

// Create models
const Quote = mongoose.model('Quote', QuoteSchema);
const Bar = mongoose.model('Bar', BarSchema);
const Trade = mongoose.model('Trade', TradeSchema);
const TechnicalIndicator = mongoose.model('TechnicalIndicator', TechnicalIndicatorSchema);
const SymbolMetadata = mongoose.model('SymbolMetadata', SymbolMetadataSchema);
const MarketNews = mongoose.model('MarketNews', MarketNewsSchema);

module.exports = {
  Quote,
  Bar,
  Trade,
  TechnicalIndicator,
  SymbolMetadata,
  MarketNews
};