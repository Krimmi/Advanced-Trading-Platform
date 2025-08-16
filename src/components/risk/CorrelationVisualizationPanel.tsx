import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Divider,
  Tooltip,
  CircularProgress,
  useTheme,
  alpha,
  SelectChangeEvent
} from '@mui/material';
import { 
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  GridOn as GridOnIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { 
  ResponsiveHeatMap,
  ResponsiveLine
} from '@nivo/core';
import { HeatMap } from '@nivo/heatmap';
import { Line } from '@nivo/line';
import { CorrelationAnalysisService, CorrelationMethod } from '../../services/risk/CorrelationAnalysisService';
import { DynamicCorrelationService, MarketRegime } from '../../services/risk/DynamicCorrelationService';
import { Portfolio } from '../../services/risk/models/RiskModels';

// Props interface
interface CorrelationVisualizationPanelProps {
  portfolio?: Portfolio;
  symbols?: string[];
  onCorrelationCalculated?: (correlationMatrix: Record<string, Record<string, number>>) => void;
  height?: number | string;
}

// Component for visualizing correlation matrices and dynamic correlations
const CorrelationVisualizationPanel: React.FC<CorrelationVisualizationPanelProps> = ({
  portfolio,
  symbols: propSymbols,
  onCorrelationCalculated,
  height = 600
}) => {
  const theme = useTheme();
  
  // Services
  const correlationService = useMemo(() => new CorrelationAnalysisService(), []);
  const dynamicCorrelationService = useMemo(() => new DynamicCorrelationService(), []);
  
  // State
  const [symbols, setSymbols] = useState<string[]>([]);
  const [correlationMatrix, setCorrelationMatrix] = useState<Record<string, Record<string, number>> | null>(null);
  const [dynamicCorrelation, setDynamicCorrelation] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Settings
  const [correlationMethod, setCorrelationMethod] = useState<CorrelationMethod>(CorrelationMethod.PEARSON);
  const [lookbackPeriod, setLookbackPeriod] = useState<number>(252); // 1 year of trading days
  const [windowSize, setWindowSize] = useState<number>(60); // 60 days window
  const [stepSize, setStepSize] = useState<number>(5); // 5 days step
  const [useLogReturns, setUseLogReturns] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'matrix' | 'dynamic'>('matrix');
  
  // Initialize symbols from props
  useEffect(() => {
    if (portfolio && portfolio.positions.length > 0) {
      setSymbols(portfolio.positions.map(p => p.symbol));
    } else if (propSymbols && propSymbols.length > 0) {
      setSymbols(propSymbols);
    }
  }, [portfolio, propSymbols]);
  
  // Calculate correlation matrix when parameters change
  useEffect(() => {
    if (symbols.length > 1) {
      calculateCorrelation();
    }
  }, [symbols, correlationMethod, lookbackPeriod, useLogReturns]);
  
  // Calculate correlation matrix
  const calculateCorrelation = async () => {
    if (symbols.length < 2) {
      setError('At least two symbols are required for correlation analysis');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await correlationService.calculateCorrelationMatrix(
        symbols,
        {
          lookbackPeriod,
          method: correlationMethod,
          useLogReturns
        }
      );
      
      setCorrelationMatrix(result.value);
      
      if (onCorrelationCalculated) {
        onCorrelationCalculated(result.value);
      }
    } catch (err) {
      console.error('Error calculating correlation:', err);
      setError('Failed to calculate correlation matrix');
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate dynamic correlation
  const calculateDynamicCorrelation = async () => {
    if (symbols.length < 2) {
      setError('At least two symbols are required for correlation analysis');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await dynamicCorrelationService.calculateDynamicCorrelationMatrix(
        symbols,
        {
          lookbackPeriod,
          method: correlationMethod,
          useLogReturns,
          windowSize,
          stepSize,
          detectRegimeChanges: true,
          useExponentialWeighting: true,
          decayFactor: 0.94
        }
      );
      
      setDynamicCorrelation(result);
      setViewMode('dynamic');
    } catch (err) {
      console.error('Error calculating dynamic correlation:', err);
      setError('Failed to calculate dynamic correlation');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle correlation method change
  const handleMethodChange = (event: SelectChangeEvent<CorrelationMethod>) => {
    setCorrelationMethod(event.target.value as CorrelationMethod);
  };
  
  // Prepare data for heatmap visualization
  const heatmapData = useMemo(() => {
    if (!correlationMatrix) return [];
    
    const symbols = Object.keys(correlationMatrix);
    
    return symbols.map(symbol => {
      const row: any = { id: symbol };
      
      symbols.forEach(otherSymbol => {
        row[otherSymbol] = correlationMatrix[symbol][otherSymbol];
      });
      
      return row;
    });
  }, [correlationMatrix]);
  
  // Prepare data for dynamic correlation visualization
  const dynamicCorrelationData = useMemo(() => {
    if (!dynamicCorrelation) return [];
    
    const { timePoints, correlationMatrices } = dynamicCorrelation;
    const symbols = Object.keys(correlationMatrices[0] || {});
    const result: any[] = [];
    
    // Create a line for each symbol pair
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        const symbol1 = symbols[i];
        const symbol2 = symbols[j];
        const id = `${symbol1} - ${symbol2}`;
        
        const data = timePoints.map((timestamp: number, idx: number) => ({
          x: new Date(timestamp).toISOString().split('T')[0],
          y: correlationMatrices[idx][symbol1][symbol2]
        }));
        
        result.push({
          id,
          data
        });
      }
    }
    
    return result;
  }, [dynamicCorrelation]);
  
  // Prepare regime data for visualization
  const regimeData = useMemo(() => {
    if (!dynamicCorrelation || !dynamicCorrelation.regimes) return [];
    
    const { timePoints, regimes } = dynamicCorrelation;
    
    // Map regimes to numeric values for visualization
    const regimeValues: Record<MarketRegime, number> = {
      [MarketRegime.NORMAL]: 0,
      [MarketRegime.BULL]: 1,
      [MarketRegime.BEAR]: -1,
      [MarketRegime.CRISIS]: -2,
      [MarketRegime.RECOVERY]: 2,
      [MarketRegime.HIGH_VOLATILITY]: -1.5,
      [MarketRegime.LOW_VOLATILITY]: 0.5
    };
    
    const data = timePoints.map((timestamp: number, idx: number) => ({
      x: new Date(timestamp).toISOString().split('T')[0],
      y: regimeValues[regimes[idx] as MarketRegime]
    }));
    
    return [{
      id: 'Market Regime',
      data
    }];
  }, [dynamicCorrelation]);
  
  // Get color for correlation value
  const getCorrelationColor = (value: number) => {
    if (value >= 0.8) return theme.palette.error.main;
    if (value >= 0.5) return theme.palette.warning.main;
    if (value >= 0.2) return theme.palette.info.main;
    if (value >= -0.2) return theme.palette.text.secondary;
    if (value >= -0.5) return theme.palette.info.light;
    if (value >= -0.8) return theme.palette.success.light;
    return theme.palette.success.main;
  };
  
  // Get color for regime
  const getRegimeColor = (regime: MarketRegime) => {
    switch (regime) {
      case MarketRegime.BULL:
        return theme.palette.success.main;
      case MarketRegime.BEAR:
        return theme.palette.error.main;
      case MarketRegime.CRISIS:
        return theme.palette.error.dark;
      case MarketRegime.RECOVERY:
        return theme.palette.success.light;
      case MarketRegime.HIGH_VOLATILITY:
        return theme.palette.warning.main;
      case MarketRegime.LOW_VOLATILITY:
        return theme.palette.info.light;
      default:
        return theme.palette.text.secondary;
    }
  };
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: height,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Asset Correlation Analysis
          <Tooltip title="Correlation analysis helps understand how assets move in relation to each other, which is essential for portfolio diversification and risk management.">
            <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle', color: theme.palette.info.main }} />
          </Tooltip>
        </Typography>
        <Divider />
      </Box>
      
      {/* Controls */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="correlation-method-label">Correlation Method</InputLabel>
            <Select
              labelId="correlation-method-label"
              id="correlation-method"
              value={correlationMethod}
              onChange={handleMethodChange}
              label="Correlation Method"
            >
              <MenuItem value={CorrelationMethod.PEARSON}>Pearson</MenuItem>
              <MenuItem value={CorrelationMethod.SPEARMAN}>Spearman (Rank)</MenuItem>
              <MenuItem value={CorrelationMethod.KENDALL}>Kendall's Tau</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="Lookback Period (Days)"
            type="number"
            size="small"
            value={lookbackPeriod}
            onChange={(e) => setLookbackPeriod(parseInt(e.target.value))}
            InputProps={{ inputProps: { min: 30, max: 1000 } }}
          />
        </Grid>
        
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="Window Size (Days)"
            type="number"
            size="small"
            value={windowSize}
            onChange={(e) => setWindowSize(parseInt(e.target.value))}
            InputProps={{ inputProps: { min: 20, max: 252 } }}
          />
        </Grid>
        
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="Step Size (Days)"
            type="number"
            size="small"
            value={stepSize}
            onChange={(e) => setStepSize(parseInt(e.target.value))}
            InputProps={{ inputProps: { min: 1, max: 30 } }}
          />
        </Grid>
      </Grid>
      
      {/* Action Buttons */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            startIcon={<GridOnIcon />}
            onClick={calculateCorrelation}
            disabled={loading || symbols.length < 2}
          >
            Calculate Correlation Matrix
          </Button>
        </Grid>
        
        <Grid item>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<TimelineIcon />}
            onClick={calculateDynamicCorrelation}
            disabled={loading || symbols.length < 2}
          >
            Calculate Dynamic Correlation
          </Button>
        </Grid>
        
        {viewMode === 'dynamic' && dynamicCorrelation && (
          <Grid item>
            <Button
              variant="text"
              color="inherit"
              startIcon={<GridOnIcon />}
              onClick={() => setViewMode('matrix')}
            >
              Show Matrix View
            </Button>
          </Grid>
        )}
        
        {viewMode === 'matrix' && dynamicCorrelation && (
          <Grid item>
            <Button
              variant="text"
              color="inherit"
              startIcon={<TimelineIcon />}
              onClick={() => setViewMode('dynamic')}
            >
              Show Dynamic View
            </Button>
          </Grid>
        )}
      </Grid>
      
      {/* Error Message */}
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      
      {/* Loading Indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* Correlation Matrix Visualization */}
      {!loading && correlationMatrix && viewMode === 'matrix' && (
        <Box sx={{ flexGrow: 1, minHeight: 400 }}>
          <HeatMap
            data={heatmapData}
            margin={{ top: 60, right: 80, bottom: 60, left: 80 }}
            valueFormat=".2f"
            axisTop={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -45,
              legend: '',
              legendOffset: 46
            }}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -45,
              legend: '',
              legendOffset: 46
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: '',
              legendOffset: -72
            }}
            colors={{
              type: 'diverging',
              scheme: 'red_yellow_blue',
              divergeAt: 0.5,
              minValue: -1,
              maxValue: 1
            }}
            emptyColor="#555555"
            legends={[
              {
                anchor: 'bottom',
                translateX: 0,
                translateY: 30,
                length: 400,
                thickness: 8,
                direction: 'row',
                tickPosition: 'after',
                tickSize: 3,
                tickSpacing: 4,
                tickOverlap: false,
                tickFormat: '.2f',
                title: 'Correlation',
                titleAlign: 'middle',
                titleOffset: 4
              }
            ]}
            annotations={[]}
            theme={{
              axis: {
                ticks: {
                  text: {
                    fill: theme.palette.text.primary
                  }
                },
                legend: {
                  text: {
                    fill: theme.palette.text.primary
                  }
                }
              },
              legends: {
                text: {
                  fill: theme.palette.text.primary
                },
                ticks: {
                  text: {
                    fill: theme.palette.text.primary
                  }
                },
                title: {
                  text: {
                    fill: theme.palette.text.primary
                  }
                }
              },
              labels: {
                text: {
                  fill: theme.palette.text.primary,
                  fontWeight: 'bold'
                }
              },
              tooltip: {
                container: {
                  background: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  fontSize: '12px',
                  borderRadius: '2px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
                  padding: '5px 9px'
                }
              }
            }}
            hoverTarget="cell"
            cellHoverOthersOpacity={0.25}
          />
        </Box>
      )}
      
      {/* Dynamic Correlation Visualization */}
      {!loading && dynamicCorrelation && viewMode === 'dynamic' && (
        <Grid container spacing={2} sx={{ flexGrow: 1 }}>
          {/* Dynamic Correlation Chart */}
          <Grid item xs={12} md={8} sx={{ height: 400 }}>
            <Typography variant="subtitle1" gutterBottom>
              Dynamic Correlation Over Time
            </Typography>
            <Box sx={{ height: 350 }}>
              <Line
                data={dynamicCorrelationData}
                margin={{ top: 20, right: 110, bottom: 50, left: 60 }}
                xScale={{ type: 'point' }}
                yScale={{
                  type: 'linear',
                  min: -1,
                  max: 1,
                  stacked: false,
                  reverse: false
                }}
                yFormat=" >-.2f"
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legend: 'Date',
                  legendOffset: 36,
                  legendPosition: 'middle'
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Correlation',
                  legendOffset: -40,
                  legendPosition: 'middle'
                }}
                pointSize={4}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                pointLabelYOffset={-12}
                useMesh={true}
                legends={[
                  {
                    anchor: 'bottom-right',
                    direction: 'column',
                    justify: false,
                    translateX: 100,
                    translateY: 0,
                    itemsSpacing: 0,
                    itemDirection: 'left-to-right',
                    itemWidth: 80,
                    itemHeight: 20,
                    itemOpacity: 0.75,
                    symbolSize: 12,
                    symbolShape: 'circle',
                    symbolBorderColor: 'rgba(0, 0, 0, .5)',
                    effects: [
                      {
                        on: 'hover',
                        style: {
                          itemBackground: 'rgba(0, 0, 0, .03)',
                          itemOpacity: 1
                        }
                      }
                    ]
                  }
                ]}
                theme={{
                  axis: {
                    domain: {
                      line: {
                        stroke: theme.palette.divider
                      }
                    },
                    ticks: {
                      line: {
                        stroke: theme.palette.divider
                      },
                      text: {
                        fill: theme.palette.text.primary
                      }
                    },
                    legend: {
                      text: {
                        fill: theme.palette.text.primary
                      }
                    }
                  },
                  grid: {
                    line: {
                      stroke: theme.palette.divider,
                      strokeWidth: 1
                    }
                  },
                  legends: {
                    text: {
                      fill: theme.palette.text.primary
                    }
                  },
                  tooltip: {
                    container: {
                      background: theme.palette.background.paper,
                      color: theme.palette.text.primary
                    }
                  }
                }}
              />
            </Box>
          </Grid>
          
          {/* Market Regime Chart */}
          <Grid item xs={12} md={4} sx={{ height: 400 }}>
            <Typography variant="subtitle1" gutterBottom>
              Market Regimes
            </Typography>
            <Box sx={{ height: 350 }}>
              {dynamicCorrelation.regimes && (
                <Line
                  data={regimeData}
                  margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                  xScale={{ type: 'point' }}
                  yScale={{
                    type: 'linear',
                    min: -2.5,
                    max: 2.5,
                    stacked: false,
                    reverse: false
                  }}
                  curve="stepAfter"
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45,
                    legend: 'Date',
                    legendOffset: 36,
                    legendPosition: 'middle'
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Regime',
                    legendOffset: -40,
                    legendPosition: 'middle',
                    tickValues: [-2, -1, 0, 1, 2],
                    format: (value) => {
                      switch (value) {
                        case -2: return 'Crisis';
                        case -1: return 'Bear';
                        case 0: return 'Normal';
                        case 1: return 'Bull';
                        case 2: return 'Recovery';
                        default: return '';
                      }
                    }
                  }}
                  enableGridX={false}
                  colors={['#ff9800']}
                  lineWidth={3}
                  pointSize={10}
                  pointColor={{ theme: 'background' }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: 'serieColor' }}
                  enableArea={true}
                  areaOpacity={0.15}
                  useMesh={true}
                  theme={{
                    axis: {
                      domain: {
                        line: {
                          stroke: theme.palette.divider
                        }
                      },
                      ticks: {
                        line: {
                          stroke: theme.palette.divider
                        },
                        text: {
                          fill: theme.palette.text.primary
                        }
                      },
                      legend: {
                        text: {
                          fill: theme.palette.text.primary
                        }
                      }
                    },
                    grid: {
                      line: {
                        stroke: theme.palette.divider,
                        strokeWidth: 1
                      }
                    },
                    tooltip: {
                      container: {
                        background: theme.palette.background.paper,
                        color: theme.palette.text.primary
                      }
                    }
                  }}
                />
              )}
            </Box>
          </Grid>
          
          {/* Regime Statistics */}
          {dynamicCorrelation.regimes && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Regime Statistics
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 2,
                p: 2,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.background.paper, 0.5)
              }}>
                {Object.values(MarketRegime).map(regime => {
                  const count = dynamicCorrelation.regimes.filter((r: string) => r === regime).length;
                  const percentage = dynamicCorrelation.regimes.length > 0 
                    ? (count / dynamicCorrelation.regimes.length * 100).toFixed(1)
                    : '0';
                  
                  return (
                    <Box 
                      key={regime}
                      sx={{ 
                        p: 1, 
                        borderRadius: 1, 
                        bgcolor: alpha(getRegimeColor(regime as MarketRegime), 0.1),
                        border: `1px solid ${getRegimeColor(regime as MarketRegime)}`,
                        minWidth: 120
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {regime.charAt(0).toUpperCase() + regime.slice(1)}
                      </Typography>
                      <Typography variant="body2">
                        {count} days ({percentage}%)
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Grid>
          )}
        </Grid>
      )}
      
      {/* No Data Message */}
      {!loading && !correlationMatrix && !dynamicCorrelation && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <Typography variant="body1" color="text.secondary">
            Calculate correlation matrix or dynamic correlation to view visualization
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default CorrelationVisualizationPanel;