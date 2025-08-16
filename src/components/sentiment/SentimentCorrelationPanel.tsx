import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  ButtonGroup,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Line, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ScatterController
} from 'chart.js';
import SentimentAnalyticsService from '../../services/sentimentAnalyticsService';
import SentimentVisualizationService from '../../services/sentimentVisualizationService';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ScatterController,
  Title,
  Tooltip,
  Legend
);

interface SentimentCorrelationPanelProps {
  ticker: string;
  source: string;
  timeframe?: number;
  onTimeframeChange?: (days: number) => void;
}

const SentimentCorrelationPanel: React.FC<SentimentCorrelationPanelProps> = ({ 
  ticker, 
  source,
  timeframe = 30,
  onTimeframeChange
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [correlationData, setCorrelationData] = useState<any>(null);
  
  const sentimentService = new SentimentAnalyticsService();
  const visualizationService = new SentimentVisualizationService();
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let data;
        
        switch (source) {
          case 'news':
            data = await sentimentService.getNewsPriceCorrelation(ticker, timeframe);
            break;
          case 'social_media':
            data = await sentimentService.getSocialSentimentCorrelation(ticker, 'all', timeframe);
            break;
          case 'all':
          default:
            data = await sentimentService.getSentimentPriceCorrelation(ticker, 'all', timeframe);
            break;
        }
        
        const visualizedData = visualizationService.prepareSentimentPriceCorrelationVisualization(data);
        setCorrelationData(visualizedData);
      } catch (err) {
        console.error('Error fetching correlation data:', err);
        setError('Failed to load correlation data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [ticker, source, timeframe]);
  
  const getSourceName = () => {
    switch (source) {
      case 'news':
        return 'News';
      case 'social_media':
        return 'Social Media';
      case 'earnings_call':
        return 'Earnings Calls';
      case 'sec_filing':
        return 'SEC Filings';
      case 'all':
      default:
        return 'All Sources';
    }
  };
  
  const getCorrelationColor = (correlation: number) => {
    if (correlation > 0.7) return theme.palette.success.main;
    if (correlation > 0.3) return theme.palette.success.light;
    if (correlation > 0) return theme.palette.success.light;
    if (correlation < -0.7) return theme.palette.error.main;
    if (correlation < -0.3) return theme.palette.error.light;
    if (correlation < 0) return theme.palette.error.light;
    return theme.palette.grey[500];
  };
  
  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Paper>
    );
  }
  
  if (error) {
    return (
      <Paper elevation={2} sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }
  
  if (!correlationData) {
    return (
      <Paper elevation={2} sx={{ p: 2 }}>
        <Alert severity="info">No correlation data available.</Alert>
      </Paper>
    );
  }
  
  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {getSourceName()} Sentiment-Price Correlation
      </Typography>
      
      <Grid container spacing={3}>
        {/* Correlation Metrics */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Correlation Analysis
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h3" component="div" sx={{ 
                  fontWeight: 'bold',
                  color: getCorrelationColor(correlationData.correlation.value)
                }}>
                  {correlationData.correlation.value.toFixed(2)}
                </Typography>
                <Box sx={{ ml: 2 }}>
                  <Chip 
                    label={correlationData.correlation.interpretation} 
                    sx={{ 
                      backgroundColor: `${getCorrelationColor(correlationData.correlation.value)}20`,
                      color: getCorrelationColor(correlationData.correlation.value)
                    }}
                  />
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Lead-Lag Relationship
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {correlationData.correlation.leadLag > 0 ? 
                    `Sentiment leads price by ${correlationData.correlation.leadLag} days` : 
                    correlationData.correlation.leadLag < 0 ? 
                    `Price leads sentiment by ${Math.abs(correlationData.correlation.leadLag)} days` : 
                    'Sentiment and price move simultaneously'}
                </Typography>
                <Chip 
                  label={`${Math.abs(correlationData.correlation.leadLag)} days`} 
                  size="small"
                  color={correlationData.correlation.leadLag !== 0 ? "primary" : "default"}
                />
              </Box>
            </CardContent>
          </Card>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Interpretation
            </Typography>
            <Typography variant="body2">
              {correlationData.correlation.value > 0.7 ? 
                `There is a strong positive correlation between ${getSourceName().toLowerCase()} sentiment and price movements. This suggests that ${getSourceName().toLowerCase()} sentiment is a reliable indicator for price direction.` : 
                correlationData.correlation.value > 0.3 ? 
                `There is a moderate positive correlation between ${getSourceName().toLowerCase()} sentiment and price movements. This suggests that ${getSourceName().toLowerCase()} sentiment has some predictive value for price direction.` : 
                correlationData.correlation.value > 0 ? 
                `There is a weak positive correlation between ${getSourceName().toLowerCase()} sentiment and price movements. This suggests that ${getSourceName().toLowerCase()} sentiment has limited predictive value for price direction.` : 
                correlationData.correlation.value < -0.7 ? 
                `There is a strong negative correlation between ${getSourceName().toLowerCase()} sentiment and price movements. This suggests that ${getSourceName().toLowerCase()} sentiment moves in the opposite direction of price.` : 
                correlationData.correlation.value < -0.3 ? 
                `There is a moderate negative correlation between ${getSourceName().toLowerCase()} sentiment and price movements. This suggests that ${getSourceName().toLowerCase()} sentiment often moves in the opposite direction of price.` : 
                correlationData.correlation.value < 0 ? 
                `There is a weak negative correlation between ${getSourceName().toLowerCase()} sentiment and price movements. This suggests that ${getSourceName().toLowerCase()} sentiment sometimes moves in the opposite direction of price.` : 
                `There is no significant correlation between ${getSourceName().toLowerCase()} sentiment and price movements.`}
              
              {correlationData.correlation.leadLag > 1 ? 
                ` With sentiment leading price by ${correlationData.correlation.leadLag} days, changes in sentiment may provide early signals for potential price movements.` : 
                correlationData.correlation.leadLag < -1 ? 
                ` With price leading sentiment by ${Math.abs(correlationData.correlation.leadLag)} days, price movements appear to influence sentiment rather than the reverse.` : 
                ''}
            </Typography>
          </Box>
          
          {onTimeframeChange && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <ButtonGroup size="small">
                <Button 
                  onClick={() => onTimeframeChange(7)} 
                  variant={timeframe === 7 ? 'contained' : 'outlined'}
                >
                  7D
                </Button>
                <Button 
                  onClick={() => onTimeframeChange(30)} 
                  variant={timeframe === 30 ? 'contained' : 'outlined'}
                >
                  30D
                </Button>
                <Button 
                  onClick={() => onTimeframeChange(90)} 
                  variant={timeframe === 90 ? 'contained' : 'outlined'}
                >
                  90D
                </Button>
              </ButtonGroup>
            </Box>
          )}
        </Grid>
        
        {/* Time Series Chart */}
        <Grid item xs={12} md={8}>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Sentiment vs. Price Time Series
              </Typography>
              <Box sx={{ height: 300 }}>
                <Line 
                  data={correlationData.chartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      mode: 'index',
                      intersect: false,
                    },
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                              label += ': ';
                            }
                            if (context.parsed.y !== null) {
                              label += context.parsed.y.toFixed(2);
                            }
                            return label;
                          }
                        }
                      }
                    },
                    scales: {
                      'y-sentiment': {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                          display: true,
                          text: 'Sentiment Score'
                        },
                        min: -1,
                        max: 1
                      },
                      'y-price': {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                          drawOnChartArea: false,
                        },
                        title: {
                          display: true,
                          text: 'Price'
                        }
                      },
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
          
          {/* Scatter Plot */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Sentiment vs. Price Change Correlation
              </Typography>
              <Box sx={{ height: 300 }}>
                <Scatter 
                  data={correlationData.scatterData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `Sentiment: ${context.parsed.x.toFixed(2)}, Price Change: ${context.parsed.y.toFixed(2)}%`;
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Sentiment Score'
                        },
                        min: -1,
                        max: 1
                      },
                      y: {
                        title: {
                          display: true,
                          text: 'Price Change (%)'
                        }
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SentimentCorrelationPanel;