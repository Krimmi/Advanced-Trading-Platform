/**
 * Sentiment Analytics Dashboard
 * 
 * Main dashboard component for the Sentiment & Behavioral Analytics feature.
 * Displays sentiment analysis from various sources, social media metrics,
 * news analysis, and behavioral indicators.
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, Tab, Box, Typography, Paper, Grid, CircularProgress, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Import services
import SentimentAnalyticsService from '../services/sentimentAnalyticsService';
import SentimentVisualizationService from '../services/sentimentVisualizationService';

// Import components
import SentimentOverviewPanel from './sentiment/SentimentOverviewPanel';
import SentimentTimeSeriesChart from './sentiment/SentimentTimeSeriesChart';
import SocialMediaSentimentPanel from './sentiment/SocialMediaSentimentPanel';
import NewsSentimentPanel from './sentiment/NewsSentimentPanel';
import BehavioralIndicatorsPanel from './sentiment/BehavioralIndicatorsPanel';
import SentimentCorrelationPanel from './sentiment/SentimentCorrelationPanel';
import EntitySentimentPanel from './sentiment/EntitySentimentPanel';
import TopicDistributionPanel from './sentiment/TopicDistributionPanel';
import TrendingTickersPanel from './sentiment/TrendingTickersPanel';
import SentimentAlertPanel from './sentiment/SentimentAlertPanel';

// Import types
import { SentimentOverview, SentimentTimeSeriesPoint } from '../types/sentimentTypes';
import { SocialMediaAnalysisResult } from '../types/socialMediaTypes';
import { NewsAnalysisResult } from '../types/newsTypes';
import { BehavioralMetricsResult } from '../types/behavioralTypes';

interface SentimentAnalyticsDashboardProps {
  defaultTicker?: string;
}

const SentimentAnalyticsDashboard: React.FC<SentimentAnalyticsDashboardProps> = ({ defaultTicker }) => {
  const theme = useTheme();
  const { ticker: urlTicker } = useParams<{ ticker: string }>();
  
  // Use ticker from URL params or default
  const ticker = urlTicker || defaultTicker || 'AAPL';
  
  // Tab state
  const [activeTab, setActiveTab] = useState<number>(0);
  
  // Data states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<number>(30); // Default to 30 days
  
  const [sentimentOverview, setSentimentOverview] = useState<SentimentOverview | null>(null);
  const [sentimentTimeSeries, setSentimentTimeSeries] = useState<SentimentTimeSeriesPoint[]>([]);
  const [socialMediaAnalysis, setSocialMediaAnalysis] = useState<SocialMediaAnalysisResult | null>(null);
  const [newsAnalysis, setNewsAnalysis] = useState<NewsAnalysisResult | null>(null);
  const [behavioralMetrics, setBehavioralMetrics] = useState<BehavioralMetricsResult | null>(null);
  
  // Initialize services
  const sentimentService = new SentimentAnalyticsService();
  const visualizationService = new SentimentVisualizationService();
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Handle timeframe change
  const handleTimeframeChange = (days: number) => {
    setTimeframe(days);
  };
  
  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch data based on active tab to avoid unnecessary API calls
        if (activeTab === 0 || sentimentOverview === null) {
          const overviewData = await sentimentService.getSentimentOverview(ticker);
          setSentimentOverview(overviewData);
          
          const timeSeriesData = await sentimentService.getSentimentTimeSeries(
            ticker, 
            ['news', 'social_media', 'earnings_call', 'sec_filing'], 
            timeframe
          );
          setSentimentTimeSeries(timeSeriesData);
        }
        
        if (activeTab === 1 || socialMediaAnalysis === null) {
          const socialData = await sentimentService.getSocialMediaAnalysis(ticker);
          setSocialMediaAnalysis(socialData);
        }
        
        if (activeTab === 2 || newsAnalysis === null) {
          const newsData = await sentimentService.getNewsAnalysis(ticker);
          setNewsAnalysis(newsData);
        }
        
        if (activeTab === 3 || behavioralMetrics === null) {
          const behavioralData = await sentimentService.getBehavioralMetrics(ticker);
          setBehavioralMetrics(behavioralData);
        }
      } catch (err) {
        console.error('Error fetching sentiment data:', err);
        setError('Failed to load sentiment data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [ticker, timeframe, activeTab]);
  
  return (
    <Box sx={{ width: '100%', padding: 2 }}>
      <Paper sx={{ padding: 2, marginBottom: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sentiment & Behavioral Analytics: {ticker}
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Comprehensive analysis of market sentiment and behavioral metrics from news, social media, and market data.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ marginBottom: 2 }}>
            {error}
          </Alert>
        )}
        
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="sentiment analytics tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" />
          <Tab label="Social Media" />
          <Tab label="News Analysis" />
          <Tab label="Behavioral Metrics" />
          <Tab label="Correlations" />
          <Tab label="Alerts" />
        </Tabs>
      </Paper>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', padding: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Overview Tab */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                {sentimentOverview && (
                  <SentimentOverviewPanel 
                    data={visualizationService.prepareSentimentOverview(sentimentOverview)}
                    onTimeframeChange={handleTimeframeChange}
                    currentTimeframe={timeframe}
                  />
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                {sentimentTimeSeries.length > 0 && sentimentOverview && (
                  <SentimentTimeSeriesChart 
                    data={visualizationService.prepareSentimentTimeSeries(
                      sentimentOverview.sources || [],
                      timeframe
                    )}
                    onTimeframeChange={handleTimeframeChange}
                    currentTimeframe={timeframe}
                  />
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                {sentimentOverview?.entitySentiment && (
                  <EntitySentimentPanel 
                    data={visualizationService.prepareEntitySentimentVisualization(
                      sentimentOverview.entitySentiment
                    )}
                  />
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <TrendingTickersPanel />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Social Media Tab */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {socialMediaAnalysis && (
                  <SocialMediaSentimentPanel 
                    data={visualizationService.prepareSocialMediaMetricsVisualization(
                      socialMediaAnalysis
                    )}
                    onTimeframeChange={handleTimeframeChange}
                    currentTimeframe={timeframe}
                  />
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                {socialMediaAnalysis?.topics && (
                  <TopicDistributionPanel 
                    data={visualizationService.prepareTopicDistributionVisualization(
                      socialMediaAnalysis.topics
                    )}
                    title="Social Media Topics"
                  />
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <SentimentCorrelationPanel 
                  ticker={ticker}
                  source="social_media"
                  timeframe={timeframe}
                  onTimeframeChange={handleTimeframeChange}
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* News Analysis Tab */}
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {newsAnalysis && (
                  <NewsSentimentPanel 
                    data={{
                      impact: visualizationService.prepareNewsImpactVisualization(
                        newsAnalysis.impact
                      ),
                      trends: visualizationService.prepareNewsTrendsVisualization(
                        newsAnalysis.trends
                      ),
                      categories: newsAnalysis.categories
                    }}
                    onTimeframeChange={handleTimeframeChange}
                    currentTimeframe={timeframe}
                  />
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                {newsAnalysis?.entities && (
                  <EntitySentimentPanel 
                    data={visualizationService.prepareEntitySentimentVisualization(
                      newsAnalysis.entities.map(entity => ({
                        entity: entity.name,
                        mentions: entity.mentions,
                        score: entity.sentiment.score,
                        classification: entity.sentiment.classification
                      }))
                    )}
                    title="News Entities"
                  />
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <SentimentCorrelationPanel 
                  ticker={ticker}
                  source="news"
                  timeframe={timeframe}
                  onTimeframeChange={handleTimeframeChange}
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Behavioral Metrics Tab */}
          <TabPanel value={activeTab} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {behavioralMetrics && (
                  <BehavioralIndicatorsPanel 
                    data={visualizationService.prepareBehavioralIndicatorsVisualization(
                      behavioralMetrics
                    )}
                    onTimeframeChange={handleTimeframeChange}
                    currentTimeframe={timeframe}
                  />
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                {behavioralMetrics?.tradingPatterns && (
                  <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Trading Patterns
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      {visualizationService.prepareTradingPatternsVisualization(
                        behavioralMetrics.tradingPatterns
                      ).patterns.map((pattern, index) => (
                        <Box 
                          key={index} 
                          sx={{ 
                            mb: 1, 
                            p: 1, 
                            borderLeft: `4px solid ${pattern.color}`,
                            backgroundColor: theme.palette.background.default
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight="bold">
                            {pattern.name} ({pattern.type})
                          </Typography>
                          <Typography variant="body2">
                            {pattern.description}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Strength: {(pattern.strength * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                {behavioralMetrics?.marketAnomalies && (
                  <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Market Anomalies
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      {visualizationService.prepareMarketAnomaliesVisualization(
                        behavioralMetrics.marketAnomalies
                      ).anomalies.map((anomaly, index) => (
                        <Box 
                          key={index} 
                          sx={{ 
                            mb: 1, 
                            p: 1, 
                            borderLeft: `4px solid ${anomaly.color}`,
                            backgroundColor: theme.palette.background.default
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight="bold">
                            {anomaly.type} ({anomaly.date})
                          </Typography>
                          <Typography variant="body2">
                            {anomaly.description}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Significance: {(anomaly.significance * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                )}
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Correlations Tab */}
          <TabPanel value={activeTab} index={4}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <SentimentCorrelationPanel 
                  ticker={ticker}
                  source="all"
                  timeframe={timeframe}
                  onTimeframeChange={handleTimeframeChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <SentimentCorrelationPanel 
                  ticker={ticker}
                  source="news"
                  timeframe={timeframe}
                  onTimeframeChange={handleTimeframeChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <SentimentCorrelationPanel 
                  ticker={ticker}
                  source="social_media"
                  timeframe={timeframe}
                  onTimeframeChange={handleTimeframeChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <SentimentCorrelationPanel 
                  ticker={ticker}
                  source="earnings_call"
                  timeframe={timeframe}
                  onTimeframeChange={handleTimeframeChange}
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Alerts Tab */}
          <TabPanel value={activeTab} index={5}>
            <SentimentAlertPanel ticker={ticker} />
          </TabPanel>
        </>
      )}
    </Box>
  );
};

// TabPanel component for tab content
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

export default SentimentAnalyticsDashboard;