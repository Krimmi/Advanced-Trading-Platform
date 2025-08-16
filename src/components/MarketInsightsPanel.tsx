import React, { useState, useEffect } from 'react';
import { unifiedDataProvider } from '../services/api/UnifiedDataProvider';
import { anomalyDetectionService, AnomalyModelType } from '../services/ml/AnomalyDetectionService';
import { predictiveAnalyticsService, PredictionModelType, SignalType } from '../services/ml/PredictiveAnalyticsService';
import { performanceMonitoring, MetricType, usePerformanceTracking } from '../services/monitoring/performanceMonitoring';
import { featureFlags } from '../services/featureFlags/featureFlags';
import { captureException } from '../services/monitoring/errorTracking';

interface MarketInsightsPanelProps {
  symbol: string;
  onSignalGenerated?: (signal: any) => void;
  onAnomalyDetected?: (anomaly: any) => void;
}

const MarketInsightsPanel: React.FC<MarketInsightsPanelProps> = ({
  symbol,
  onSignalGenerated,
  onAnomalyDetected
}) => {
  // State for data
  const [marketData, setMarketData] = useState<any>(null);
  const [financialData, setFinancialData] = useState<any>(null);
  const [newsData, setNewsData] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [tradingSignal, setTradingSignal] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Performance tracking
  const performance = usePerformanceTracking('MarketInsightsPanel', MetricType.COMPONENT_RENDER);
  
  // Feature flags
  const mlFeaturesEnabled = featureFlags.isEnabled('ml-predictions');
  const anomalyDetectionEnabled = featureFlags.isEnabled('anomaly-detection');
  const advancedChartsEnabled = featureFlags.isEnabled('advanced-charts');
  
  // Load data on mount or when symbol changes
  useEffect(() => {
    const loadData = async () => {
      performance.start({ symbol });
      setLoading(true);
      setError(null);
      
      try {
        // Start a performance metric for data loading
        const metricId = performanceMonitoring.startMetric(
          `MarketInsightsPanel.loadData.${symbol}`,
          MetricType.DATA_PROCESSING,
          { symbol }
        );
        
        // Load comprehensive data with unified provider
        const data = await unifiedDataProvider.getComprehensiveData(symbol, {
          useAllProviders: true,
          forceRefresh: false
        });
        
        // Update state with normalized data
        setMarketData(data.market.data);
        setFinancialData(data.financial.data);
        setNewsData(data.news.data);
        
        // If ML features are enabled, generate predictions and detect anomalies
        if (mlFeaturesEnabled) {
          // Prepare historical data for ML models
          const historicalPrices = await getHistoricalPrices(symbol);
          
          // Generate predictions if we have enough data
          if (historicalPrices.length >= 30) {
            // Generate predictions using ensemble model
            const predictionResult = await predictiveAnalyticsService.forecast(
              symbol,
              historicalPrices,
              {
                modelType: PredictionModelType.ENSEMBLE,
                horizon: 5,
                features: ['price', 'volume', 'change', 'volatility']
              }
            );
            
            setPrediction(predictionResult);
            
            // Generate trading signal
            const signal = await predictiveAnalyticsService.generateSignal(
              symbol,
              historicalPrices,
              predictionResult
            );
            
            setTradingSignal(signal);
            
            // Notify parent component
            if (onSignalGenerated) {
              onSignalGenerated(signal);
            }
          }
          
          // Detect anomalies if enabled
          if (anomalyDetectionEnabled && historicalPrices.length >= 30) {
            const anomalyResult = await anomalyDetectionService.detectMarketAnomalies(
              symbol,
              historicalPrices,
              {
                modelType: AnomalyModelType.ENSEMBLE,
                sensitivity: 0.7
              }
            );
            
            if (anomalyResult.isAnomaly) {
              setAnomalies([anomalyResult]);
              
              // Notify parent component
              if (onAnomalyDetected) {
                onAnomalyDetected(anomalyResult);
              }
            }
          }
        }
        
        performanceMonitoring.endMetric(metricId, true);
        performance.end(true, { dataLoaded: true });
      } catch (err) {
        console.error('Error loading market insights:', err);
        setError(`Failed to load data: ${err.message}`);
        captureException(err, { symbol, component: 'MarketInsightsPanel' });
        performance.end(false, { error: err.message });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [symbol]);
  
  // Helper function to get historical prices
  const getHistoricalPrices = async (symbol: string): Promise<any[]> => {
    try {
      // This would be replaced with your actual API call to get historical data
      const response = await fetch(`/api/historical/${symbol}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching historical prices:', error);
      return [];
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="market-insights-panel loading">
        <div className="loading-spinner"></div>
        <p>Loading market insights for {symbol}...</p>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="market-insights-panel error">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }
  
  // Helper function to format price
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };
  
  // Helper function to format percent
  const formatPercent = (percent: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(percent / 100);
  };
  
  // Helper function to get signal color
  const getSignalColor = (signal: any): string => {
    if (!signal) return 'gray';
    
    switch (signal.signalType) {
      case SignalType.BUY:
        return '#4caf50'; // Green
      case SignalType.SELL:
        return '#f44336'; // Red
      default:
        return '#9e9e9e'; // Gray
    }
  };
  
  return (
    <div className="market-insights-panel">
      {/* Market Data Section */}
      <section className="market-data">
        <h2>{marketData.name} ({marketData.symbol})</h2>
        <div className="price-container">
          <span className="price">{formatPrice(marketData.price)}</span>
          <span className={`change ${marketData.change >= 0 ? 'positive' : 'negative'}`}>
            {marketData.change >= 0 ? '+' : ''}{formatPrice(marketData.change)} ({formatPercent(marketData.changePercent)})
          </span>
        </div>
        
        <div className="market-stats">
          <div className="stat">
            <span className="label">Open</span>
            <span className="value">{formatPrice(marketData.open)}</span>
          </div>
          <div className="stat">
            <span className="label">High</span>
            <span className="value">{formatPrice(marketData.high)}</span>
          </div>
          <div className="stat">
            <span className="label">Low</span>
            <span className="value">{formatPrice(marketData.low)}</span>
          </div>
          <div className="stat">
            <span className="label">Volume</span>
            <span className="value">{marketData.volume.toLocaleString()}</span>
          </div>
        </div>
      </section>
      
      {/* Company Profile Section */}
      <section className="company-profile">
        <h3>Company Profile</h3>
        <p className="description">{financialData.description}</p>
        <div className="company-stats">
          <div className="stat">
            <span className="label">Sector</span>
            <span className="value">{financialData.sector}</span>
          </div>
          <div className="stat">
            <span className="label">Industry</span>
            <span className="value">{financialData.industry}</span>
          </div>
          <div className="stat">
            <span className="label">Employees</span>
            <span className="value">{financialData.employees?.toLocaleString() || 'N/A'}</span>
          </div>
        </div>
      </section>
      
      {/* ML Predictions Section */}
      {mlFeaturesEnabled && prediction && (
        <section className="ml-predictions">
          <h3>Price Predictions</h3>
          <div className="prediction-chart">
            {/* Chart would be rendered here */}
            <div className="chart-placeholder">
              {/* In a real implementation, this would be a chart component */}
              <div className="chart-line" style={{ backgroundColor: getSignalColor(tradingSignal) }}></div>
            </div>
          </div>
          
          <div className="prediction-stats">
            <div className="stat">
              <span className="label">5-Day Forecast</span>
              <span className="value" style={{ color: getSignalColor(tradingSignal) }}>
                {formatPrice(prediction.predictions[prediction.predictions.length - 1].value)}
              </span>
            </div>
            <div className="stat">
              <span className="label">Predicted Change</span>
              <span className="value" style={{ color: getSignalColor(tradingSignal) }}>
                {tradingSignal ? (tradingSignal.predictedChange >= 0 ? '+' : '') + (tradingSignal.predictedChange * 100).toFixed(2) + '%' : 'N/A'}
              </span>
            </div>
            <div className="stat">
              <span className="label">Model Accuracy</span>
              <span className="value">{(prediction.accuracy.r2 * 100).toFixed(1)}%</span>
            </div>
          </div>
          
          {/* Trading Signal */}
          {tradingSignal && (
            <div className="trading-signal" style={{ borderColor: getSignalColor(tradingSignal) }}>
              <h4>Trading Signal: <span style={{ color: getSignalColor(tradingSignal) }}>{tradingSignal.signalType.toUpperCase()}</span></h4>
              <div className="signal-strength">
                <span className="label">Strength</span>
                <div className="strength-bar">
                  <div 
                    className="strength-fill" 
                    style={{ 
                      width: `${tradingSignal.strength * 100}%`,
                      backgroundColor: getSignalColor(tradingSignal)
                    }}
                  ></div>
                </div>
                <span className="value">{(tradingSignal.strength * 100).toFixed(0)}%</span>
              </div>
              <div className="signal-rationale">
                <h5>Rationale:</h5>
                <ul>
                  {tradingSignal.rationale.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {/* Anomaly Detection */}
          {anomalyDetectionEnabled && anomalies.length > 0 && (
            <div className="anomaly-alert">
              <h4>⚠️ Anomaly Detected</h4>
              <p>Unusual market behavior detected with {(anomalies[0].confidence * 100).toFixed(0)}% confidence.</p>
              <div className="anomaly-details">
                <h5>Contributing Factors:</h5>
                <ul>
                  {anomalies[0].contributingFeatures.slice(0, 3).map((feature, index) => (
                    <li key={index}>
                      {feature.feature}: {(feature.contribution * 100).toFixed(0)}% contribution
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      )}
      
      {/* News Section */}
      <section className="news-section">
        <h3>Latest News</h3>
        <div className="news-list">
          {newsData.slice(0, 5).map((article, index) => (
            <div className="news-item" key={index}>
              <h4><a href={article.url} target="_blank" rel="noopener noreferrer">{article.title}</a></h4>
              <p className="news-source">{article.source} • {new Date(article.publishedAt).toLocaleDateString()}</p>
              <p className="news-description">{article.description}</p>
            </div>
          ))}
        </div>
      </section>
      
      {/* Data Sources Section */}
      <section className="data-sources">
        <h4>Data Sources</h4>
        <div className="source-list">
          <div className="source">
            <span className="label">Market Data:</span>
            <span className="value">{marketData.sources?.map(s => s.provider).join(', ')}</span>
          </div>
          <div className="source">
            <span className="label">Financial Data:</span>
            <span className="value">{financialData.sources?.map(s => s.provider).join(', ')}</span>
          </div>
          <div className="source">
            <span className="label">News:</span>
            <span className="value">{newsData[0]?.sources?.map(s => s.provider).join(', ')}</span>
          </div>
          {prediction && (
            <div className="source">
              <span className="label">Predictions:</span>
              <span className="value">{prediction.modelType}</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default MarketInsightsPanel;