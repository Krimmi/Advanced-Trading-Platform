import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Grid,
  Divider,
  CircularProgress,
  Tooltip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Slider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import { 
  RiskCalculationServiceFactory 
} from '../../services/risk/RiskCalculationServiceFactory';
import {
  Portfolio,
  Position,
  CorrelationMatrixResult
} from '../../services/risk/models/RiskModels';
import { CorrelationAnalysisService, CorrelationMethod } from '../../services/risk/CorrelationAnalysisService';

// Import chart components
import {
  Heatmap,
  HeatmapSeries,
  HeatmapCell,
  ChartTooltip,
  ChartProvider,
  ChartContainer,
  ChartLegend
} from '@mui/x-charts';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: theme.shadows[8],
    transform: 'translateY(-2px)'
  }
}));

const SettingsContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2)
}));

const CorrelationCell = styled(TableCell)<{ value: number }>(({ theme, value }) => {
  // Color scale from red (negative correlation) to white (no correlation) to blue (positive correlation)
  const getColor = (correlation: number) => {
    if (correlation > 0) {
      // Blue scale for positive correlation
      const intensity = Math.min(255, Math.round(200 * correlation) + 55);
      return `rgba(0, 0, ${intensity}, ${Math.abs(correlation) * 0.8 + 0.2})`;
    } else {
      // Red scale for negative correlation
      const intensity = Math.min(255, Math.round(200 * Math.abs(correlation)) + 55);
      return `rgba(${intensity}, 0, 0, ${Math.abs(correlation) * 0.8 + 0.2})`;
    }
  };
  
  return {
    backgroundColor: getColor(value),
    color: Math.abs(value) > 0.5 ? theme.palette.common.white : theme.palette.text.primary,
    fontWeight: Math.abs(value) > 0.7 ? 'bold' : 'normal',
    textAlign: 'center'
  };
});

// Interface for component props
interface CorrelationMatrixPanelProps {
  portfolioId: string;
  onRefresh?: () => void;
}

/**
 * CorrelationMatrixPanel displays correlation analysis for portfolio assets
 */
const CorrelationMatrixPanel: React.FC<CorrelationMatrixPanelProps> = ({
  portfolioId,
  onRefresh
}) => {
  // State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [correlationResult, setCorrelationResult] = useState<CorrelationMatrixResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lookbackPeriod, setLookbackPeriod] = useState<number>(252);
  const [correlationMethod, setCorrelationMethod] = useState<CorrelationMethod>(CorrelationMethod.PEARSON);
  const [useLogReturns, setUseLogReturns] = useState<boolean>(true);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [correlationThreshold, setCorrelationThreshold] = useState<number>(0);
  
  // Services
  const correlationService = new CorrelationAnalysisService();
  
  // Load data
  useEffect(() => {
    loadData();
  }, [portfolioId]);
  
  // Load portfolio data
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const riskService = RiskCalculationServiceFactory.getService();
      
      // Get portfolio
      const portfolioData = await riskService.getPortfolio(portfolioId);
      setPortfolio(portfolioData);
      
      // Calculate correlation matrix with default settings
      await calculateCorrelation();
    } catch (err) {
      console.error('Error loading data:', err);
      setError(`Failed to load data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate correlation matrix
  const calculateCorrelation = async () => {
    if (!portfolio) {
      return;
    }
    
    setIsCalculating(true);
    setError(null);
    
    try {
      // Calculate correlation matrix
      const result = await correlationService.calculatePortfolioCorrelation(portfolio, {
        lookbackPeriod,
        method: correlationMethod,
        useLogReturns
      });
      
      setCorrelationResult(result);
      
      // Prepare heatmap data
      prepareHeatmapData(result);
    } catch (err) {
      console.error('Error calculating correlation:', err);
      setError(`Failed to calculate correlation: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsCalculating(false);
    }
  };
  
  // Prepare heatmap data
  const prepareHeatmapData = (result: CorrelationMatrixResult) => {
    const { value: correlationMatrix, symbols } = result;
    
    // Create heatmap data
    const data = [];
    
    for (let i = 0; i < symbols.length; i++) {
      for (let j = 0; j < symbols.length; j++) {
        const symbol1 = symbols[i];
        const symbol2 = symbols[j];
        const correlation = correlationMatrix[symbol1][symbol2];
        
        data.push({
          x: i,
          y: j,
          value: correlation,
          symbol1,
          symbol2
        });
      }
    }
    
    setHeatmapData(data);
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    loadData();
    if (onRefresh) {
      onRefresh();
    }
  };
  
  // Handle lookback period change
  const handleLookbackPeriodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setLookbackPeriod(value);
    }
  };
  
  // Handle correlation method change
  const handleCorrelationMethodChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setCorrelationMethod(event.target.value as CorrelationMethod);
  };
  
  // Handle use log returns change
  const handleUseLogReturnsChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setUseLogReturns(event.target.value === 'true');
  };
  
  // Handle apply settings
  const handleApplySettings = () => {
    calculateCorrelation();
  };
  
  // Handle correlation threshold change
  const handleCorrelationThresholdChange = (event: Event, newValue: number | number[]) => {
    setCorrelationThreshold(newValue as number);
  };
  
  // Format correlation value
  const formatCorrelation = (value: number): string => {
    return value.toFixed(2);
  };
  
  // Get correlation cell color
  const getCorrelationColor = (value: number): string => {
    if (value > 0) {
      // Blue scale for positive correlation
      return `rgba(0, 0, 255, ${Math.min(1, value)})`;
    } else {
      // Red scale for negative correlation
      return `rgba(255, 0, 0, ${Math.min(1, Math.abs(value))})`;
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="400px">
        <WarningIcon color="error" fontSize="large" sx={{ mb: 2 }} />
        <Typography color="error" gutterBottom>{error}</Typography>
        <Button variant="contained" onClick={handleRefresh} startIcon={<RefreshIcon />}>
          Retry
        </Button>
      </Box>
    );
  }
  
  // Render no data state
  if (!portfolio) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="400px">
        <Typography color="textSecondary" gutterBottom>No portfolio data available</Typography>
        <Button variant="contained" onClick={handleRefresh} startIcon={<RefreshIcon />}>
          Refresh
        </Button>
      </Box>
    );
  }
  
  // Get symbols from correlation result
  const symbols = correlationResult?.symbols || [];
  
  // Filter correlation matrix based on threshold
  const getFilteredCorrelations = () => {
    if (!correlationResult) {
      return [];
    }
    
    const { value: correlationMatrix, symbols } = correlationResult;
    const filteredCorrelations = [];
    
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        const symbol1 = symbols[i];
        const symbol2 = symbols[j];
        const correlation = correlationMatrix[symbol1][symbol2];
        
        if (Math.abs(correlation) >= correlationThreshold) {
          filteredCorrelations.push({
            symbol1,
            symbol2,
            correlation
          });
        }
      }
    }
    
    // Sort by absolute correlation (descending)
    return filteredCorrelations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  };
  
  return (
    <StyledCard>
      <CardHeader
        title="Correlation Analysis"
        subheader={`Portfolio: ${portfolio.name}`}
        action={
          <IconButton onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        }
      />
      
      <Divider />
      
      <CardContent>
        {/* Settings */}
        <SettingsContainer>
          <Typography variant="subtitle1" gutterBottom>Correlation Settings</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <TextField
                label="Lookback Period (days)"
                type="number"
                value={lookbackPeriod}
                onChange={handleLookbackPeriodChange}
                InputProps={{ inputProps: { min: 30 } }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Correlation Method</InputLabel>
                <Select
                  value={correlationMethod}
                  onChange={handleCorrelationMethodChange}
                  label="Correlation Method"
                >
                  <MenuItem value={CorrelationMethod.PEARSON}>Pearson</MenuItem>
                  <MenuItem value={CorrelationMethod.SPEARMAN}>Spearman</MenuItem>
                  <MenuItem value={CorrelationMethod.KENDALL}>Kendall</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Return Type</InputLabel>
                <Select
                  value={useLogReturns.toString()}
                  onChange={handleUseLogReturnsChange}
                  label="Return Type"
                >
                  <MenuItem value="true">Log Returns</MenuItem>
                  <MenuItem value="false">Simple Returns</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box display="flex" alignItems="center" height="100%">
                <Button
                  variant="contained"
                  onClick={handleApplySettings}
                  fullWidth
                  disabled={isCalculating}
                  startIcon={isCalculating ? <CircularProgress size={20} /> : undefined}
                >
                  {isCalculating ? 'Calculating...' : 'Calculate'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </SettingsContainer>
        
        {correlationResult ? (
          <>
            {/* Correlation Matrix */}
            <Box mb={4}>
              <Typography variant="subtitle1" gutterBottom>Correlation Matrix</Typography>
              <Paper sx={{ p: 2, overflow: 'auto', maxHeight: '500px' }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell></TableCell>
                        {symbols.map(symbol => (
                          <TableCell key={symbol} align="center">{symbol}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {symbols.map(symbol1 => (
                        <TableRow key={symbol1}>
                          <TableCell component="th" scope="row">{symbol1}</TableCell>
                          {symbols.map(symbol2 => {
                            const correlation = correlationResult.value[symbol1][symbol2];
                            return (
                              <CorrelationCell key={symbol2} value={correlation}>
                                {formatCorrelation(correlation)}
                              </CorrelationCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
            
            {/* Significant Correlations */}
            <Box mb={4}>
              <Typography variant="subtitle1" gutterBottom>Significant Correlations</Typography>
              <Box mb={2}>
                <Typography gutterBottom>
                  Correlation Threshold: {correlationThreshold.toFixed(2)}
                </Typography>
                <Slider
                  value={correlationThreshold}
                  onChange={handleCorrelationThresholdChange}
                  min={0}
                  max={1}
                  step={0.05}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 0.5, label: '0.5' },
                    { value: 0.7, label: '0.7' },
                    { value: 0.9, label: '0.9' }
                  ]}
                />
              </Box>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Symbol 1</TableCell>
                      <TableCell>Symbol 2</TableCell>
                      <TableCell align="center">Correlation</TableCell>
                      <TableCell>Relationship</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getFilteredCorrelations().map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.symbol1}</TableCell>
                        <TableCell>{item.symbol2}</TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              backgroundColor: getCorrelationColor(item.correlation),
                              color: Math.abs(item.correlation) > 0.5 ? 'white' : 'inherit',
                              borderRadius: 1,
                              padding: '4px 8px',
                              display: 'inline-block',
                              fontWeight: 'bold'
                            }}
                          >
                            {formatCorrelation(item.correlation)}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {item.correlation > 0.7 ? 'Strong positive correlation' :
                           item.correlation > 0.5 ? 'Moderate positive correlation' :
                           item.correlation > 0.3 ? 'Weak positive correlation' :
                           item.correlation < -0.7 ? 'Strong negative correlation' :
                           item.correlation < -0.5 ? 'Moderate negative correlation' :
                           item.correlation < -0.3 ? 'Weak negative correlation' :
                           'Little to no correlation'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {getFilteredCorrelations().length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No correlations meet the threshold
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            
            {/* Interpretation */}
            <Box mt={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Correlation Analysis Interpretation</Typography>
                <Typography variant="body2" paragraph>
                  Correlation measures the statistical relationship between two assets, ranging from -1 (perfect negative correlation) to +1 (perfect positive correlation).
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>Positive Correlation (0.5 to 1.0)</Typography>
                      <Typography variant="body2">
                        Assets tend to move in the same direction. High positive correlations may indicate redundancy in your portfolio and less diversification benefit.
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>Little/No Correlation (-0.3 to 0.3)</Typography>
                      <Typography variant="body2">
                        Assets move independently of each other. These relationships provide good diversification benefits to reduce overall portfolio risk.
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>Negative Correlation (-1.0 to -0.5)</Typography>
                      <Typography variant="body2">
                        Assets tend to move in opposite directions. Strong negative correlations provide excellent hedging properties during market stress.
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                <Box mt={2}>
                  <Typography variant="body2">
                    <strong>Method used:</strong> {correlationMethod} correlation with {useLogReturns ? 'logarithmic' : 'simple'} returns over {lookbackPeriod} days.
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </>
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" height="200px">
            <Typography color="textSecondary">
              Click "Calculate" to generate correlation analysis
            </Typography>
          </Box>
        )}
      </CardContent>
    </StyledCard>
  );
};

export default CorrelationMatrixPanel;