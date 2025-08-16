import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { Line, Bar, Radar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, RadialLinearScale, Title, Tooltip, Legend, Filler } from 'chart.js';

import { BacktestingService } from '../../services';
import { BacktestResult } from '../../types/backtesting/backtestingTypes';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface BacktestComparisonPanelProps {
  selectedResults: BacktestResult[];
  onResultsSelected?: (results: BacktestResult[]) => void;
  backtestResults: BacktestResult[];
}

const BacktestComparisonPanel: React.FC<BacktestComparisonPanelProps> = ({
  selectedResults,
  onResultsSelected,
  backtestResults
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<any>(null);
  
  const backtestingService = new BacktestingService();
  
  useEffect(() => {
    if (selectedResults.length >= 2) {
      generateComparisonData();
    }
  }, [selectedResults]);
  
  const generateComparisonData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get detailed equity curves for each backtest
      const equityCurves = await Promise.all(
        selectedResults.map(result => 
          backtestingService.getBacktestEquityCurve(result.id)
        )
      );
      
      // Generate comparison data
      const comparisonData = {
        equityCurves,
        performanceMetrics: selectedResults.map(result => result.performanceMetrics),
        monthlyReturns: await Promise.all(
          selectedResults.map(result => 
            backtestingService.getBacktestMonthlyReturns(result.id)
          )
        ),
        drawdownCurves: await Promise.all(
          selectedResults.map(result => 
            backtestingService.getBacktestDrawdownCurve(result.id)
          )
        )
      };
      
      setComparisonData(comparisonData);
      setLoading(false);
    } catch (err) {
      console.error('Error generating comparison data:', err);
      setError('Failed to generate comparison data. Please try again later.');
      setLoading(false);
    }
  };
  
  const handleRemoveResult = (result: BacktestResult) => {
    const updatedResults = selectedResults.filter(r => r.id !== result.id);
    
    if (onResultsSelected) {
      onResultsSelected(updatedResults);
    }
  };
  
  const handleAddResult = (result: BacktestResult) => {
    if (selectedResults.some(r => r.id === result.id)) return;
    
    const updatedResults = [...selectedResults, result];
    
    if (onResultsSelected) {
      onResultsSelected(updatedResults);
    }
  };
  
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value / 100);
  };
  
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getReturnColor = (value: number): string => {
    return value >= 0 ? theme.palette.success.main : theme.palette.error.main;
  };
  
  const getReturnIcon = (value: number) => {
    return value >= 0 ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />;
  };
  
  const getColorForIndex = (index: number): string => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.error.main,
      theme.palette.warning.main,
      theme.palette.info.main,
      '#9c27b0', // purple
      '#795548', // brown
      '#607d8b', // blue-grey
      '#009688', // teal
    ];
    
    return colors[index % colors.length];
  };
  
  const renderSelectedBacktests = () => {
    if (selectedResults.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            No backtests selected for comparison
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Select at least two backtests to compare
          </Typography>
        </Box>
      );
    }
    
    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Config ID</TableCell>
              <TableCell>Strategy</TableCell>
              <TableCell>Date Range</TableCell>
              <TableCell align="right">Return</TableCell>
              <TableCell align="right">Max Drawdown</TableCell>
              <TableCell align="right">Sharpe Ratio</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {selectedResults.map((result, index) => (
              <TableRow key={result.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: getColorForIndex(index),
                        mr: 1
                      }}
                    />
                    {result.configId}
                  </Box>
                </TableCell>
                <TableCell>{result.strategyId}</TableCell>
                <TableCell>
                  {formatDate(result.startDate)} - {formatDate(result.endDate)}
                </TableCell>
                <TableCell 
                  align="right" 
                  sx={{ color: getReturnColor(result.totalReturn) }}
                >
                  {formatPercentage(result.totalReturn)}
                </TableCell>
                <TableCell 
                  align="right" 
                  sx={{ color: theme.palette.error.main }}
                >
                  {formatPercentage(result.maxDrawdown)}
                </TableCell>
                <TableCell align="right">
                  {result.sharpeRatio.toFixed(2)}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveResult(result)}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  const renderAvailableBacktests = () => {
    const availableResults = backtestResults.filter(
      result => !selectedResults.some(r => r.id === result.id)
    );
    
    if (availableResults.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No more backtests available for comparison
          </Typography>
        </Box>
      );
    }
    
    return (
      <TableContainer sx={{ maxHeight: 200 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Config ID</TableCell>
              <TableCell>Strategy</TableCell>
              <TableCell>Date Range</TableCell>
              <TableCell align="right">Return</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {availableResults.map((result) => (
              <TableRow key={result.id}>
                <TableCell>{result.configId}</TableCell>
                <TableCell>{result.strategyId}</TableCell>
                <TableCell>
                  {formatDate(result.startDate)} - {formatDate(result.endDate)}
                </TableCell>
                <TableCell 
                  align="right" 
                  sx={{ color: getReturnColor(result.totalReturn) }}
                >
                  {formatPercentage(result.totalReturn)}
                </TableCell>
                <TableCell align="center">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleAddResult(result)}
                  >
                    Add
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  const renderEquityCurveChart = () => {
    if (!comparisonData || !comparisonData.equityCurves) return null;
    
    // Find the common date range for all equity curves
    const allDates = comparisonData.equityCurves.flatMap(curve => 
      curve.map(point => new Date(point.date).getTime())
    );
    const minDate = Math.min(...allDates);
    const maxDate = Math.max(...allDates);
    
    // Prepare chart data
    const data = {
      datasets: selectedResults.map((result, index) => {
        const equityCurve = comparisonData.equityCurves[index] || [];
        const color = getColorForIndex(index);
        
        return {
          label: result.configId,
          data: equityCurve.map(point => ({
            x: new Date(point.date),
            y: point.equity
          })),
          borderColor: color,
          backgroundColor: color + '20',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          tension: 0.1
        };
      })
    };
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'time' as const,
          time: {
            unit: 'day' as const
          },
          title: {
            display: true,
            text: 'Date'
          },
          min: minDate,
          max: maxDate
        },
        y: {
          title: {
            display: true,
            text: 'Equity ($)'
          }
        }
      },
      plugins: {
        legend: {
          position: 'top' as const
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
            }
          }
        }
      }
    };
    
    return (
      <Box sx={{ height: 400 }}>
        <Line data={data} options={options} />
      </Box>
    );
  };
  
  const renderDrawdownChart = () => {
    if (!comparisonData || !comparisonData.drawdownCurves) return null;
    
    // Prepare chart data
    const data = {
      datasets: selectedResults.map((result, index) => {
        const drawdownCurve = comparisonData.drawdownCurves[index] || [];
        const color = getColorForIndex(index);
        
        return {
          label: result.configId,
          data: drawdownCurve.map(point => ({
            x: new Date(point.date),
            y: point.drawdownPercentage * -1 // Convert to negative for visual representation
          })),
          borderColor: color,
          backgroundColor: color + '20',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          tension: 0.1
        };
      })
    };
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'time' as const,
          time: {
            unit: 'day' as const
          },
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Drawdown (%)'
          },
          reverse: true // Invert the y-axis to show drawdowns as negative values
        }
      },
      plugins: {
        legend: {
          position: 'top' as const
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              return `${context.dataset.label}: ${formatPercentage(context.parsed.y * -1)}`;
            }
          }
        }
      }
    };
    
    return (
      <Box sx={{ height: 400 }}>
        <Line data={data} options={options} />
      </Box>
    );
  };
  
  const renderMonthlyReturnsChart = () => {
    if (!comparisonData || !comparisonData.monthlyReturns) return null;
    
    // Get all unique year-month combinations
    const allYearMonths = comparisonData.monthlyReturns.flatMap(returns => 
      returns.map(item => `${item.year}-${item.month}`)
    );
    const uniqueYearMonths = [...new Set(allYearMonths)].sort();
    
    // Prepare chart data
    const data = {
      labels: uniqueYearMonths.map(ym => {
        const [year, month] = ym.split('-');
        return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(month) - 1]} ${year}`;
      }),
      datasets: selectedResults.map((result, index) => {
        const monthlyReturns = comparisonData.monthlyReturns[index] || [];
        const color = getColorForIndex(index);
        
        // Create a map of year-month to return
        const returnsMap = new Map();
        monthlyReturns.forEach(item => {
          returnsMap.set(`${item.year}-${item.month}`, item.return);
        });
        
        // Map the unique year-months to returns (or null if not available)
        const returns = uniqueYearMonths.map(ym => {
          return returnsMap.has(ym) ? returnsMap.get(ym) * 100 : null;
        });
        
        return {
          label: result.configId,
          data: returns,
          backgroundColor: color,
          borderColor: color,
          borderWidth: 1
        };
      })
    };
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Month'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Return (%)'
          }
        }
      },
      plugins: {
        legend: {
          position: 'top' as const
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              return `${context.dataset.label}: ${formatPercentage(context.parsed.y / 100)}`;
            }
          }
        }
      }
    };
    
    return (
      <Box sx={{ height: 400 }}>
        <Bar data={data} options={options} />
      </Box>
    );
  };
  
  const renderMetricsRadarChart = () => {
    if (!comparisonData || !comparisonData.performanceMetrics) return null;
    
    // Select key metrics for radar chart
    const metrics = [
      { key: 'sharpeRatio', label: 'Sharpe Ratio', scale: 1 },
      { key: 'sortinoRatio', label: 'Sortino Ratio', scale: 1 },
      { key: 'calmarRatio', label: 'Calmar Ratio', scale: 1 },
      { key: 'winRate', label: 'Win Rate', scale: 100 }, // Convert to percentage
      { key: 'profitFactor', label: 'Profit Factor', scale: 1 },
      { key: 'recoveryFactor', label: 'Recovery Factor', scale: 1 }
    ];
    
    // Prepare chart data
    const data = {
      labels: metrics.map(m => m.label),
      datasets: selectedResults.map((result, index) => {
        const performanceMetrics = comparisonData.performanceMetrics[index] || {};
        const color = getColorForIndex(index);
        
        return {
          label: result.configId,
          data: metrics.map(m => {
            const value = performanceMetrics[m.key as keyof typeof performanceMetrics];
            return value !== undefined ? value * m.scale : 0;
          }),
          backgroundColor: color + '40',
          borderColor: color,
          borderWidth: 2,
          pointBackgroundColor: color,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: color
        };
      })
    };
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: {
            display: true
          },
          suggestedMin: 0
        }
      },
      plugins: {
        legend: {
          position: 'top' as const
        }
      }
    };
    
    return (
      <Box sx={{ height: 400 }}>
        <Radar data={data} options={options} />
      </Box>
    );
  };
  
  const renderMetricsTable = () => {
    if (!comparisonData || !comparisonData.performanceMetrics) return null;
    
    // Select key metrics for the table
    const metrics = [
      { key: 'totalReturn', label: 'Total Return', format: 'percentage' },
      { key: 'annualizedReturn', label: 'Annualized Return', format: 'percentage' },
      { key: 'maxDrawdown', label: 'Max Drawdown', format: 'percentage' },
      { key: 'sharpeRatio', label: 'Sharpe Ratio', format: 'number' },
      { key: 'sortinoRatio', label: 'Sortino Ratio', format: 'number' },
      { key: 'calmarRatio', label: 'Calmar Ratio', format: 'number' },
      { key: 'winRate', label: 'Win Rate', format: 'percentage' },
      { key: 'profitFactor', label: 'Profit Factor', format: 'number' },
      { key: 'expectancy', label: 'Expectancy', format: 'currency' },
      { key: 'averageWin', label: 'Average Win', format: 'currency' },
      { key: 'averageLoss', label: 'Average Loss', format: 'currency' },
      { key: 'totalTrades', label: 'Total Trades', format: 'number' }
    ];
    
    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Metric</TableCell>
              {selectedResults.map((result, index) => (
                <TableCell key={result.id} align="right">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: getColorForIndex(index),
                        mr: 1
                      }}
                    />
                    {result.configId}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {metrics.map((metric) => (
              <TableRow key={metric.key}>
                <TableCell>{metric.label}</TableCell>
                {selectedResults.map((result, index) => {
                  const performanceMetrics = comparisonData.performanceMetrics[index] || {};
                  const value = performanceMetrics[metric.key as keyof typeof performanceMetrics];
                  
                  let formattedValue = '-';
                  let color = theme.palette.text.primary;
                  
                  if (value !== undefined) {
                    if (metric.format === 'percentage') {
                      formattedValue = formatPercentage(value);
                      if (['totalReturn', 'annualizedReturn', 'winRate'].includes(metric.key)) {
                        color = getReturnColor(value);
                      } else if (metric.key === 'maxDrawdown') {
                        color = theme.palette.error.main;
                      }
                    } else if (metric.format === 'currency') {
                      formattedValue = formatCurrency(value);
                      if (['expectancy', 'averageWin'].includes(metric.key)) {
                        color = getReturnColor(value);
                      } else if (metric.key === 'averageLoss') {
                        color = theme.palette.error.main;
                      }
                    } else {
                      formattedValue = value.toFixed(2);
                    }
                  }
                  
                  return (
                    <TableCell key={`${result.id}-${metric.key}`} align="right" sx={{ color }}>
                      {formattedValue}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Typography variant="h5" component="h1">
              Backtest Comparison
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Compare performance across multiple backtests
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<CompareArrowsIcon />}
              onClick={generateComparisonData}
              disabled={selectedResults.length < 2 || loading}
            >
              Compare
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Card sx={{ mb: 2 }}>
        <CardHeader title="Selected Backtests" />
        <Divider />
        {renderSelectedBacktests()}
      </Card>
      
      <Card sx={{ mb: 2 }}>
        <CardHeader title="Available Backtests" />
        <Divider />
        {renderAvailableBacktests()}
      </Card>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : selectedResults.length >= 2 && comparisonData ? (
        <>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Equity Curves" />
                <Divider />
                <CardContent>
                  {renderEquityCurveChart()}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Drawdown" />
                <Divider />
                <CardContent>
                  {renderDrawdownChart()}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Monthly Returns" />
                <Divider />
                <CardContent>
                  {renderMonthlyReturnsChart()}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Performance Metrics" />
                <Divider />
                <CardContent>
                  {renderMetricsRadarChart()}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Detailed Metrics Comparison" />
                <Divider />
                <CardContent>
                  {renderMetricsTable()}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      ) : (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            Select at least two backtests and click "Compare" to see comparison charts
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default BacktestComparisonPanel;