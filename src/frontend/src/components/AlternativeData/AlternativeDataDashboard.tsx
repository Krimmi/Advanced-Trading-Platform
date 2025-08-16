import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Tabs, Tab, CircularProgress, Alert } from '@mui/material';
import alternativeDataService from '../../services/alternativeDataService';
import SentimentAnalysisVisualization from './SentimentAnalysisVisualization';
import NewsDataVisualization from './NewsDataVisualization';
import SocialMediaDataVisualization from './SocialMediaDataVisualization';
import SatelliteImageryVisualization from './SatelliteImageryVisualization';
import MacroeconomicIndicatorsVisualization from './MacroeconomicIndicatorsVisualization';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`alternative-data-tabpanel-${index}`}
      aria-labelledby={`alternative-data-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface AlternativeDataDashboardProps {
  symbol: string;
}

const AlternativeDataDashboard: React.FC<AlternativeDataDashboardProps> = ({ symbol }) => {
  const [tabValue, setTabValue] = useState(0);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSources, setDataSources] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch alternative data summary for the symbol
        const summaryData = await alternativeDataService.getAlternativeDataSummary(symbol);
        setSummary(summaryData);

        // Fetch available data sources
        const sources = await alternativeDataService.getDataSources();
        setDataSources(sources);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching alternative data:', err);
        setError('Failed to load alternative data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Alternative Data Dashboard for {symbol}
        </Typography>
        
        {summary && (
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, height: '100%', bgcolor: 'background.default' }}>
                <Typography variant="h6">Sentiment Overview</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      bgcolor: summary.sentiment.overall_score > 0.6 ? 'success.main' : 
                              summary.sentiment.overall_score < 0.4 ? 'error.main' : 'warning.main',
                      mr: 1
                    }}
                  />
                  <Typography>
                    Overall: {summary.sentiment.overall_score > 0.6 ? 'Positive' : 
                             summary.sentiment.overall_score < 0.4 ? 'Negative' : 'Neutral'}
                    {' '}({(summary.sentiment.overall_score * 100).toFixed(1)}%)
                  </Typography>
                </Box>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    News Sentiment: {(summary.sentiment.news_score * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2">
                    Social Media Sentiment: {(summary.sentiment.social_score * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2">
                    Recent Change: {(summary.sentiment.recent_change * 100).toFixed(1)}%
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, height: '100%', bgcolor: 'background.default' }}>
                <Typography variant="h6">News Activity</Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Recent Articles: {summary.news.count}
                  </Typography>
                  <Typography variant="body2">
                    Categories: {summary.news.categories.join(', ')}
                  </Typography>
                  {summary.news.recent_articles.length > 0 && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Latest: {summary.news.recent_articles[0].title}
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, height: '100%', bgcolor: 'background.default' }}>
                <Typography variant="h6">Social Media Activity</Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Recent Mentions: {summary.social_media.count}
                  </Typography>
                  <Typography variant="body2">
                    Total Engagement: {summary.social_media.engagement}
                  </Typography>
                  <Typography variant="body2">
                    Platforms: {summary.social_media.platforms.join(', ')}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="alternative data tabs">
            <Tab label="Sentiment Analysis" />
            <Tab label="News Data" />
            <Tab label="Social Media" />
            <Tab label="Satellite Imagery" />
            <Tab label="Macroeconomic Indicators" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <SentimentAnalysisVisualization symbol={symbol} />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <NewsDataVisualization symbol={symbol} />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <SocialMediaDataVisualization symbol={symbol} />
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <SatelliteImageryVisualization symbol={symbol} />
        </TabPanel>
        
        <TabPanel value={tabValue} index={4}>
          <MacroeconomicIndicatorsVisualization symbol={symbol} />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AlternativeDataDashboard;