import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { technicalService, technicalServiceExtensions } from '../../services';
import { TechnicalIndicator } from '../../services/technicalService';
import { MultiTimeframeAnalysis } from '../../services/technicalServiceExtensions';

interface MultiTimeframeAnalysisPanelProps {
  symbol: string;
}

const MultiTimeframeAnalysisPanel: React.FC<MultiTimeframeAnalysisPanelProps> = ({ symbol }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(false);
  const [indicator, setIndicator] = useState<string>('rsi');
  const [parameters, setParameters] = useState<Record<string, any>>({ period: 14 });
  const [timeframes, setTimeframes] = useState<string[]>(['5min', 'hourly', 'daily', 'weekly']);
  const [analysisData, setAnalysisData] = useState<MultiTimeframeAnalysis | null>(null);
  const [availableIndicators, setAvailableIndicators] = useState<any[]>([]);

  useEffect(() => {
    const fetchAvailableIndicators = async () => {
      try {
        const indicatorsData = await technicalServiceExtensions.getAvailableIndicators();
        setAvailableIndicators(indicatorsData.flatMap(category => category.indicators));
      } catch (error) {
        console.error('Error fetching available indicators:', error);
      }
    };

    fetchAvailableIndicators();
  }, []);

  useEffect(() => {
    if (symbol && indicator) {
      fetchMultiTimeframeData();
    }
  }, [symbol, indicator]);

  const fetchMultiTimeframeData = async () => {
    setLoading(true);
    try {
      const data = await technicalServiceExtensions.getMultiTimeframeAnalysis(
        symbol,
        indicator,
        parameters,
        timeframes as any[]
      );
      setAnalysisData(data);
    } catch (error) {
      console.error('Error fetching multi-timeframe data:', error);
      setAnalysisData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleIndicatorChange = (event: SelectChangeEvent) => {
    const selectedIndicator = event.target.value;
    setIndicator(selectedIndicator);
    
    // Set default parameters based on the selected indicator
    const indicatorDef = availableIndicators.find(ind => ind.id === selectedIndicator);
    if (indicatorDef && indicatorDef.parameters) {
      const defaultParams = indicatorDef.parameters.reduce((acc: Record<string, any>, param: any) => {
        acc[param.name] = param.defaultValue;
        return acc;
      }, {});
      setParameters(defaultParams);
    }
  };

  const handleParameterChange = (name: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTimeframesChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setTimeframes(typeof value === 'string' ? value.split(',') : value);
  };

  const handleAnalyze = () => {
    fetchMultiTimeframeData();
  };

  const getSignalColor = (value: number, indicator: string) => {
    // Different indicators have different signal thresholds
    switch (indicator.toLowerCase()) {
      case 'rsi':
        if (value > 70) return theme.palette.error.main; // Overbought
        if (value < 30) return theme.palette.success.main; // Oversold
        return theme.palette.info.main; // Neutral
      case 'macd':
        return value > 0 ? theme.palette.success.main : theme.palette.error.main;
      case 'stochastic':
        if (value > 80) return theme.palette.error.main; // Overbought
        if (value < 20) return theme.palette.success.main; // Oversold
        return theme.palette.info.main; // Neutral
      default:
        return theme.palette.info.main;
    }
  };

  const getSignalIcon = (value: number, indicator: string) => {
    // Different indicators have different signal thresholds
    switch (indicator.toLowerCase()) {
      case 'rsi':
        if (value > 70) return <TrendingDownIcon color="error" />; // Overbought - bearish
        if (value < 30) return <TrendingUpIcon color="success" />; // Oversold - bullish
        return <TrendingFlatIcon color="info" />; // Neutral
      case 'macd':
        return value > 0 ? <TrendingUpIcon color="success" /> : <TrendingDownIcon color="error" />;
      case 'stochastic':
        if (value > 80) return <TrendingDownIcon color="error" />; // Overbought - bearish
        if (value < 20) return <TrendingUpIcon color="success" />; // Oversold - bullish
        return <TrendingFlatIcon color="info" />; // Neutral
      default:
        return <TrendingFlatIcon color="info" />;
    }
  };

  const getSignalText = (value: number, indicator: string) => {
    // Different indicators have different signal thresholds
    switch (indicator.toLowerCase()) {
      case 'rsi':
        if (value > 70) return 'Overbought';
        if (value < 30) return 'Oversold';
        return 'Neutral';
      case 'macd':
        return value > 0 ? 'Bullish' : 'Bearish';
      case 'stochastic':
        if (value > 80) return 'Overbought';
        if (value < 20) return 'Oversold';
        return 'Neutral';
      default:
        return 'Neutral';
    }
  };

  const renderParameterInputs = () => {
    const indicatorDef = availableIndicators.find(ind => ind.id === indicator);
    if (!indicatorDef || !indicatorDef.parameters) {
      return null;
    }

    return (
      <Grid container spacing={2}>
        {indicatorDef.parameters.map((param: any) => (
          <Grid item xs={12} sm={6} md={3} key={param.name}>
            <FormControl fullWidth size="small">
              <InputLabel>{param.name}</InputLabel>
              <Select
                value={parameters[param.name] || param.defaultValue}
                label={param.name}
                onChange={(e) => handleParameterChange(param.name, e.target.value)}
              >
                {Array.from({ length: 20 }, (_, i) => param.defaultValue - 10 + i).map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box>
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Multi-Timeframe Analysis
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Indicator</InputLabel>
              <Select value={indicator} label="Indicator" onChange={handleIndicatorChange}>
                {availableIndicators.map((ind) => (
                  <MenuItem key={ind.id} value={ind.id}>
                    {ind.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Timeframes</InputLabel>
              <Select
                multiple
                value={timeframes}
                onChange={handleTimeframesChange}
                label="Timeframes"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="minute">1 Minute</MenuItem>
                <MenuItem value="5min">5 Minutes</MenuItem>
                <MenuItem value="15min">15 Minutes</MenuItem>
                <MenuItem value="30min">30 Minutes</MenuItem>
                <MenuItem value="hourly">1 Hour</MenuItem>
                <MenuItem value="4hour">4 Hours</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SearchIcon />}
              onClick={handleAnalyze}
              fullWidth
            >
              Analyze
            </Button>
          </Grid>
          
          {renderParameterInputs()}
        </Grid>
      </Paper>

      <Typography variant="h6" gutterBottom>
        {indicator.toUpperCase()} Analysis for {symbol} Across Timeframes
      </Typography>
      
      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : !analysisData ? (
        <Alert severity="info">
          Select an indicator and timeframes, then click Analyze to view multi-timeframe analysis.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Timeframe</TableCell>
                    <TableCell>Latest Value</TableCell>
                    <TableCell>Signal</TableCell>
                    <TableCell>Previous Value</TableCell>
                    <TableCell>Change</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analysisData.timeframes.map((tf) => {
                    const latestValue = tf.values[tf.values.length - 1]?.value || 0;
                    const previousValue = tf.values[tf.values.length - 2]?.value || 0;
                    const change = latestValue - previousValue;
                    const date = tf.values[tf.values.length - 1]?.date || '';
                    
                    return (
                      <TableRow key={tf.timeframe}>
                        <TableCell>{tf.timeframe}</TableCell>
                        <TableCell>{latestValue.toFixed(2)}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            {getSignalIcon(latestValue, indicator)}
                            <Typography sx={{ ml: 1 }}>
                              {getSignalText(latestValue, indicator)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{previousValue.toFixed(2)}</TableCell>
                        <TableCell
                          sx={{
                            color: change > 0 ? 'success.main' : change < 0 ? 'error.main' : 'text.primary',
                          }}
                        >
                          {change > 0 ? '+' : ''}{change.toFixed(2)}
                        </TableCell>
                        <TableCell>{new Date(date).toLocaleDateString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Multi-Timeframe Summary
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Indicator: {indicator.toUpperCase()}
                </Typography>
                
                <Typography variant="body2" paragraph>
                  Analyzing {symbol} across {timeframes.length} timeframes from {timeframes[0]} to {timeframes[timeframes.length - 1]}.
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>
                  Signals:
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  {analysisData.timeframes.map((tf) => {
                    const latestValue = tf.values[tf.values.length - 1]?.value || 0;
                    const signal = getSignalText(latestValue, indicator);
                    const color = signal === 'Bullish' || signal === 'Oversold' ? 'success' :
                                signal === 'Bearish' || signal === 'Overbought' ? 'error' : 'info';
                    
                    return (
                      <Box key={tf.timeframe} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">{tf.timeframe}:</Typography>
                        <Chip
                          label={signal}
                          size="small"
                          color={color as any}
                        />
                      </Box>
                    );
                  })}
                </Box>
                
                <Typography variant="subtitle2" gutterBottom>
                  Confluence Analysis:
                </Typography>
                
                <Typography variant="body2">
                  {(() => {
                    // Count signals
                    const signals = analysisData.timeframes.map(tf => {
                      const latestValue = tf.values[tf.values.length - 1]?.value || 0;
                      return getSignalText(latestValue, indicator);
                    });
                    
                    const bullishCount = signals.filter(s => s === 'Bullish' || s === 'Oversold').length;
                    const bearishCount = signals.filter(s => s === 'Bearish' || s === 'Overbought').length;
                    const neutralCount = signals.filter(s => s === 'Neutral').length;
                    
                    if (bullishCount > bearishCount && bullishCount > neutralCount) {
                      return `Bullish bias across ${bullishCount} of ${timeframes.length} timeframes. Consider looking for buying opportunities.`;
                    } else if (bearishCount > bullishCount && bearishCount > neutralCount) {
                      return `Bearish bias across ${bearishCount} of ${timeframes.length} timeframes. Consider caution or looking for selling opportunities.`;
                    } else if (neutralCount >= bullishCount && neutralCount >= bearishCount) {
                      return `Mixed or neutral signals across timeframes. Consider waiting for clearer direction.`;
                    } else {
                      return `Mixed signals across timeframes. ${bullishCount} bullish, ${bearishCount} bearish, and ${neutralCount} neutral.`;
                    }
                  })()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default MultiTimeframeAnalysisPanel;