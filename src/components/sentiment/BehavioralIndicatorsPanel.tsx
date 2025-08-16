import React from 'react';
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
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface BehavioralIndicatorsPanelProps {
  data: {
    indicators: {
      name: string;
      value: number;
      classification: string;
      description: string;
      trend: string;
      trendIcon: string;
      color: string;
    }[];
    marketRegime: {
      regime: string;
      confidence: number;
      description: string;
      characteristics: string[];
    };
  };
  onTimeframeChange?: (days: number) => void;
  currentTimeframe?: number;
}

const BehavioralIndicatorsPanel: React.FC<BehavioralIndicatorsPanelProps> = ({ 
  data, 
  onTimeframeChange,
  currentTimeframe = 30
}) => {
  const theme = useTheme();
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
      case 'improving':
        return <TrendingUpIcon sx={{ color: '#4CAF50' }} />;
      case 'decreasing':
      case 'deteriorating':
        return <TrendingDownIcon sx={{ color: '#F44336' }} />;
      default:
        return <TrendingFlatIcon sx={{ color: '#9E9E9E' }} />;
    }
  };
  
  const getCharacteristicIcon = (index: number) => {
    const icons = [
      <CheckCircleIcon sx={{ color: theme.palette.success.main }} />,
      <InfoIcon sx={{ color: theme.palette.info.main }} />,
      <WarningIcon sx={{ color: theme.palette.warning.main }} />,
      <ErrorIcon sx={{ color: theme.palette.error.main }} />
    ];
    return icons[index % icons.length];
  };
  
  // Prepare radar chart data
  const radarData = {
    labels: data.indicators.map(indicator => indicator.name),
    datasets: [
      {
        label: 'Behavioral Indicators',
        data: data.indicators.map(indicator => {
          // Normalize values to 0-100 range for radar chart
          if (indicator.name === 'Fear & Greed Index') {
            return indicator.value; // Already in 0-100 range
          } else if (indicator.name === 'Momentum Indicator') {
            return (indicator.value + 100) / 2; // Convert -100 to 100 range to 0-100
          } else if (indicator.name === 'Volatility Regime') {
            return indicator.value * 3.33; // Convert 0-30 range to 0-100
          } else if (indicator.name === 'Put/Call Ratio') {
            return (2 - indicator.value) * 50; // Convert 0-2 range to 100-0 (inverted)
          } else if (indicator.name === 'Implied Volatility') {
            return (50 - indicator.value) * 2; // Convert 0-50 range to 100-0 (inverted)
          }
          return indicator.value;
        }),
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        fill: true
      }
    ]
  };
  
  const radarOptions = {
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 100
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const indicator = data.indicators[context.dataIndex];
            return `${indicator.name}: ${indicator.value} (${indicator.classification})`;
          }
        }
      }
    }
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={3}>
        {/* Market Regime Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Market Regime
              </Typography>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                backgroundColor: theme.palette.background.default,
                mb: 2
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h5" component="div" fontWeight="bold">
                    {data.marketRegime.regime}
                  </Typography>
                  <Chip 
                    label={`${(data.marketRegime.confidence * 100).toFixed(0)}% Confidence`} 
                    color={data.marketRegime.confidence > 0.7 ? "success" : data.marketRegime.confidence > 0.4 ? "warning" : "default"}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {data.marketRegime.description}
                </Typography>
              </Box>
              
              <Typography variant="subtitle1" gutterBottom>
                Regime Characteristics
              </Typography>
              <List dense>
                {data.marketRegime.characteristics.map((characteristic, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {getCharacteristicIcon(index)}
                    </ListItemIcon>
                    <ListItemText primary={characteristic} />
                  </ListItem>
                ))}
              </List>
              
              {onTimeframeChange && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <ButtonGroup size="small">
                    <Button 
                      onClick={() => onTimeframeChange(7)} 
                      variant={currentTimeframe === 7 ? 'contained' : 'outlined'}
                    >
                      7D
                    </Button>
                    <Button 
                      onClick={() => onTimeframeChange(30)} 
                      variant={currentTimeframe === 30 ? 'contained' : 'outlined'}
                    >
                      30D
                    </Button>
                    <Button 
                      onClick={() => onTimeframeChange(90)} 
                      variant={currentTimeframe === 90 ? 'contained' : 'outlined'}
                    >
                      90D
                    </Button>
                  </ButtonGroup>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Behavioral Indicators Radar Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Behavioral Indicators Overview
              </Typography>
              <Box sx={{ height: 350 }}>
                <Radar data={radarData} options={radarOptions} />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                Radar chart showing normalized values of key behavioral indicators.
                Higher values generally indicate more bullish conditions.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Behavioral Indicators Detail */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Behavioral Indicators Detail
              </Typography>
              <Grid container spacing={2}>
                {data.indicators.map((indicator, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: 2, 
                        height: '100%',
                        borderLeft: `4px solid ${indicator.color}`,
                        backgroundColor: `${indicator.color}10`
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1">{indicator.name}</Typography>
                        {getTrendIcon(indicator.trend)}
                      </Box>
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <Typography 
                            variant="h4" 
                            component="div" 
                            sx={{ 
                              fontWeight: 'bold',
                              color: indicator.color
                            }}
                          >
                            {indicator.value.toFixed(1)}
                          </Typography>
                          <Chip 
                            label={indicator.classification} 
                            size="small"
                            sx={{ 
                              backgroundColor: `${indicator.color}20`,
                              color: indicator.color,
                              textTransform: 'capitalize'
                            }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {indicator.description}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            Trend:
                          </Typography>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {indicator.trend}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Behavioral Analysis Summary */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Behavioral Analysis Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Market Sentiment
                    </Typography>
                    <Typography variant="body2">
                      {data.indicators.some(i => i.name === 'Fear & Greed Index') ? 
                        `The Fear & Greed Index is at ${data.indicators.find(i => i.name === 'Fear & Greed Index')?.value.toFixed(0)}, 
                        indicating ${data.indicators.find(i => i.name === 'Fear & Greed Index')?.classification} in the market. ` : 
                        'Market sentiment indicators show mixed signals. '}
                      {data.indicators.some(i => i.name === 'Fear & Greed Index' && i.trend === 'improving') ? 
                        'Sentiment is improving, suggesting growing investor confidence. ' : 
                        data.indicators.some(i => i.name === 'Fear & Greed Index' && i.trend === 'deteriorating') ? 
                        'Sentiment is deteriorating, suggesting growing investor caution. ' : 
                        'Sentiment is relatively stable. '}
                      {data.indicators.some(i => i.name === 'Put/Call Ratio') ? 
                        `The Put/Call Ratio of ${data.indicators.find(i => i.name === 'Put/Call Ratio')?.value.toFixed(2)} 
                        indicates ${data.indicators.find(i => i.name === 'Put/Call Ratio')?.classification} positioning.` : 
                        ''}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Market Momentum
                    </Typography>
                    <Typography variant="body2">
                      {data.indicators.some(i => i.name === 'Momentum Indicator') ? 
                        `The Momentum Indicator is ${data.indicators.find(i => i.name === 'Momentum Indicator')?.value.toFixed(0)}, 
                        showing ${data.indicators.find(i => i.name === 'Momentum Indicator')?.classification} momentum. ` : 
                        'Market momentum indicators are mixed. '}
                      {data.indicators.some(i => i.name === 'Momentum Indicator' && i.trend === 'improving') ? 
                        'Momentum is improving, suggesting potential continuation of the current trend. ' : 
                        data.indicators.some(i => i.name === 'Momentum Indicator' && i.trend === 'deteriorating') ? 
                        'Momentum is deteriorating, suggesting potential weakening of the current trend. ' : 
                        'Momentum is relatively stable. '}
                      The current market regime is characterized as {data.marketRegime.regime.toLowerCase()}.
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Volatility Assessment
                    </Typography>
                    <Typography variant="body2">
                      {data.indicators.some(i => i.name === 'Volatility Regime') ? 
                        `The Volatility Regime is ${data.indicators.find(i => i.name === 'Volatility Regime')?.value.toFixed(1)}, 
                        classified as ${data.indicators.find(i => i.name === 'Volatility Regime')?.classification}. ` : 
                        'Volatility indicators show mixed signals. '}
                      {data.indicators.some(i => i.name === 'Implied Volatility') ? 
                        `Implied Volatility is at ${data.indicators.find(i => i.name === 'Implied Volatility')?.value.toFixed(1)}, 
                        which is ${data.indicators.find(i => i.name === 'Implied Volatility')?.classification}. ` : 
                        ''}
                      {data.indicators.some(i => i.name === 'Volatility Regime' && i.trend === 'increasing') ? 
                        'Volatility is increasing, suggesting potential market turbulence ahead. ' : 
                        data.indicators.some(i => i.name === 'Volatility Regime' && i.trend === 'decreasing') ? 
                        'Volatility is decreasing, suggesting potential market stabilization. ' : 
                        'Volatility levels are relatively stable. '}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BehavioralIndicatorsPanel;