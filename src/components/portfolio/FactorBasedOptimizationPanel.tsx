import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  CircularProgress, 
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import portfolioOptimizationService from '../../frontend/src/services/portfolioOptimizationService';

// Define types for factors
interface Factor {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface AssetFactorExposure {
  symbol: string;
  exposures: Record<string, number>;
}

interface FactorConstraint {
  factorId: string;
  min: number | null;
  max: number | null;
}

interface FactorBasedOptimizationPanelProps {
  symbols: string[];
  onOptimizationComplete?: (result: any) => void;
}

const FactorBasedOptimizationPanel: React.FC<FactorBasedOptimizationPanelProps> = ({ 
  symbols, 
  onOptimizationComplete 
}) => {
  // State variables
  const [loading, setLoading] = useState<boolean>(false);
  const [factors, setFactors] = useState<Factor[]>([
    { id: 'market', name: 'Market', description: 'Exposure to overall market movements', category: 'Macro' },
    { id: 'size', name: 'Size', description: 'Small vs large cap exposure', category: 'Style' },
    { id: 'value', name: 'Value', description: 'Value vs growth exposure', category: 'Style' },
    { id: 'momentum', name: 'Momentum', description: 'Exposure to price momentum', category: 'Style' },
    { id: 'quality', name: 'Quality', description: 'Exposure to company quality metrics', category: 'Fundamental' },
    { id: 'volatility', name: 'Volatility', description: 'Exposure to market volatility', category: 'Risk' },
    { id: 'yield', name: 'Yield', description: 'Exposure to dividend yield', category: 'Income' },
    { id: 'growth', name: 'Growth', description: 'Exposure to earnings growth', category: 'Fundamental' },
    { id: 'liquidity', name: 'Liquidity', description: 'Exposure to market liquidity', category: 'Risk' },
    { id: 'profitability', name: 'Profitability', description: 'Exposure to company profitability', category: 'Fundamental' }
  ]);
  const [selectedFactors, setSelectedFactors] = useState<string[]>(['market', 'size', 'value', 'momentum']);
  const [factorConstraints, setFactorConstraints] = useState<FactorConstraint[]>([]);
  const [assetExposures, setAssetExposures] = useState<AssetFactorExposure[]>([]);
  const [optimizationObjective, setOptimizationObjective] = useState<string>('max_sharpe');
  const [riskAversion, setRiskAversion] = useState<number>(1);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [factorReturns, setFactorReturns] = useState<Record<string, number>>({
    market: 0.05,
    size: 0.02,
    value: 0.03,
    momentum: 0.04,
    quality: 0.02,
    volatility: -0.01,
    yield: 0.03,
    growth: 0.04,
    liquidity: 0.01,
    profitability: 0.03
  });
  const [factorCovariance, setFactorCovariance] = useState<any>(null);

  // Available optimization objectives
  const objectives = [
    { value: 'max_sharpe', label: 'Maximum Sharpe Ratio' },
    { value: 'min_risk', label: 'Minimum Risk' },
    { value: 'max_return', label: 'Maximum Return' },
    { value: 'max_diversification', label: 'Maximum Diversification' },
    { value: 'risk_parity', label: 'Risk Parity' }
  ];

  // Load asset factor exposures when symbols or selected factors change
  useEffect(() => {
    if (symbols.length > 0 && selectedFactors.length > 0) {
      fetchAssetFactorExposures();
    }
  }, [symbols, selectedFactors]);

  // Initialize factor constraints when selected factors change
  useEffect(() => {
    const initialConstraints = selectedFactors.map(factorId => ({
      factorId,
      min: null,
      max: null
    }));
    setFactorConstraints(initialConstraints);
  }, [selectedFactors]);

  // Fetch asset factor exposures
  const fetchAssetFactorExposures = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would call an API to get factor exposures
      // For now, we'll generate random exposures for demonstration
      const exposures = symbols.map(symbol => {
        const exposureObj: Record<string, number> = {};
        selectedFactors.forEach(factorId => {
          // Generate random exposure between -1 and 1
          exposureObj[factorId] = parseFloat((Math.random() * 2 - 1).toFixed(2));
        });
        return {
          symbol,
          exposures: exposureObj
        };
      });
      
      setAssetExposures(exposures);
    } catch (error) {
      console.error('Error fetching asset factor exposures:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update factor constraint
  const updateFactorConstraint = (factorId: string, field: 'min' | 'max', value: number | null) => {
    setFactorConstraints(prevConstraints => 
      prevConstraints.map(constraint => 
        constraint.factorId === factorId 
          ? { ...constraint, [field]: value } 
          : constraint
      )
    );
  };

  // Update factor return expectation
  const updateFactorReturn = (factorId: string, value: number) => {
    setFactorReturns(prev => ({
      ...prev,
      [factorId]: value
    }));
  };

  // Run factor-based optimization
  const runFactorBasedOptimization = async () => {
    setLoading(true);
    try {
      // Prepare constraints for the optimization
      const optimizationConstraints = factorConstraints
        .filter(constraint => constraint.min !== null || constraint.max !== null)
        .map(constraint => ({
          type: 'factor_exposure' as const,
          parameters: {
            factor: constraint.factorId,
            ...(constraint.min !== null && { min_exposure: constraint.min }),
            ...(constraint.max !== null && { max_exposure: constraint.max })
          }
        }));
      
      // Add default constraints (sum of weights = 1, no short selling)
      optimizationConstraints.push({
        type: 'min_weight' as const,
        parameters: { min_weight: 0 }
      });
      
      // Prepare factor returns for the optimization
      const factorReturnParams = selectedFactors.reduce((acc, factorId) => {
        acc[factorId] = factorReturns[factorId] || 0;
        return acc;
      }, {} as Record<string, number>);
      
      // In a real implementation, this would call the portfolio optimization service
      // For now, we'll simulate the optimization result
      
      // Simulate optimization calculation
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
      
      // Generate random weights that sum to 1
      const weights: Record<string, number> = {};
      const randomValues = symbols.map(() => Math.random());
      const sum = randomValues.reduce((a, b) => a + b, 0);
      
      symbols.forEach((symbol, index) => {
        weights[symbol] = parseFloat((randomValues[index] / sum).toFixed(4));
      });
      
      // Calculate expected return and risk based on factor exposures
      let expectedReturn = 0;
      let expectedRisk = 0.12; // Simplified risk calculation
      
      // Calculate portfolio factor exposures
      const portfolioFactorExposures: Record<string, number> = {};
      selectedFactors.forEach(factorId => {
        let exposure = 0;
        symbols.forEach(symbol => {
          const assetExposure = assetExposures.find(ae => ae.symbol === symbol);
          if (assetExposure) {
            exposure += weights[symbol] * (assetExposure.exposures[factorId] || 0);
          }
        });
        portfolioFactorExposures[factorId] = parseFloat(exposure.toFixed(4));
        
        // Contribute to expected return
        expectedReturn += exposure * factorReturns[factorId];
      });
      
      expectedReturn = parseFloat(expectedReturn.toFixed(4));
      
      // Calculate Sharpe ratio
      const riskFreeRate = 0.02;
      const sharpeRatio = parseFloat(((expectedReturn - riskFreeRate) / expectedRisk).toFixed(4));
      
      const result = {
        weights,
        expected_return: expectedReturn,
        expected_risk: expectedRisk,
        sharpe_ratio: sharpeRatio,
        factor_exposures: portfolioFactorExposures,
        optimization_metrics: {
          objective_value: optimizationObjective === 'max_sharpe' ? sharpeRatio : 
                          optimizationObjective === 'min_risk' ? -expectedRisk : expectedReturn,
          iterations: 150,
          convergence: true,
          computation_time: 0.75
        }
      };
      
      setOptimizationResult(result);
      
      // Notify parent component if callback is provided
      if (onOptimizationComplete) {
        onOptimizationComplete(result);
      }
    } catch (error) {
      console.error('Error running factor-based optimization:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Factor-Based Portfolio Optimization
      </Typography>
      
      <Grid container spacing={3}>
        {/* Factor Selection */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Select Factors
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {factors.map(factor => (
                <Chip
                  key={factor.id}
                  label={factor.name}
                  color={selectedFactors.includes(factor.id) ? 'primary' : 'default'}
                  onClick={() => {
                    if (selectedFactors.includes(factor.id)) {
                      setSelectedFactors(selectedFactors.filter(id => id !== factor.id));
                    } else {
                      setSelectedFactors([...selectedFactors, factor.id]);
                    }
                  }}
                  sx={{ m: 0.5 }}
                />
              ))}
            </Box>
            
            <Alert severity="info" sx={{ mt: 1 }}>
              Select the factors you want to include in your optimization model. 
              These factors will be used to estimate returns and risk.
            </Alert>
          </Paper>
        </Grid>
        
        {/* Factor Return Expectations */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Factor Return Expectations
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Factor</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Expected Return (%)</TableCell>
                    <TableCell align="right">Info</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedFactors.map(factorId => {
                    const factor = factors.find(f => f.id === factorId);
                    if (!factor) return null;
                    
                    return (
                      <TableRow key={factor.id}>
                        <TableCell>{factor.name}</TableCell>
                        <TableCell>{factor.category}</TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            value={factorReturns[factor.id] * 100}
                            onChange={(e) => updateFactorReturn(factor.id, Number(e.target.value) / 100)}
                            inputProps={{ step: 0.1, min: -10, max: 10 }}
                            size="small"
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title={factor.description}>
                            <IconButton size="small">
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        
        {/* Factor Constraints */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Factor Exposure Constraints
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Factor</TableCell>
                    <TableCell align="right">Min Exposure</TableCell>
                    <TableCell align="right">Max Exposure</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {factorConstraints.map((constraint, index) => {
                    const factor = factors.find(f => f.id === constraint.factorId);
                    if (!factor) return null;
                    
                    return (
                      <TableRow key={factor.id}>
                        <TableCell>{factor.name}</TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            value={constraint.min === null ? '' : constraint.min}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : Number(e.target.value);
                              updateFactorConstraint(factor.id, 'min', value);
                            }}
                            inputProps={{ step: 0.1, min: -2, max: 2 }}
                            size="small"
                            sx={{ width: 80 }}
                            placeholder="None"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            value={constraint.max === null ? '' : constraint.max}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : Number(e.target.value);
                              updateFactorConstraint(factor.id, 'max', value);
                            }}
                            inputProps={{ step: 0.1, min: -2, max: 2 }}
                            size="small"
                            sx={{ width: 80 }}
                            placeholder="None"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              Set constraints on factor exposures to control the risk characteristics of your portfolio.
              Leave blank for no constraint.
            </Alert>
          </Paper>
        </Grid>
        
        {/* Asset Factor Exposures */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Asset Factor Exposures
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Symbol</TableCell>
                      {selectedFactors.map(factorId => {
                        const factor = factors.find(f => f.id === factorId);
                        return (
                          <TableCell key={factorId} align="right">
                            {factor?.name || factorId}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assetExposures.map((asset) => (
                      <TableRow key={asset.symbol}>
                        <TableCell>
                          <strong>{asset.symbol}</strong>
                        </TableCell>
                        {selectedFactors.map(factorId => (
                          <TableCell 
                            key={factorId} 
                            align="right"
                            sx={{ 
                              color: asset.exposures[factorId] > 0 ? 'success.main' : 
                                    asset.exposures[factorId] < 0 ? 'error.main' : 'text.primary'
                            }}
                          >
                            {asset.exposures[factorId]?.toFixed(2) || '0.00'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={fetchAssetFactorExposures}
                startIcon={<RefreshIcon />}
                disabled={loading}
              >
                Refresh Exposures
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Optimization Controls */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Optimization Settings
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="objective-select-label">Optimization Objective</InputLabel>
                  <Select
                    labelId="objective-select-label"
                    value={optimizationObjective}
                    onChange={(e) => setOptimizationObjective(e.target.value as string)}
                    label="Optimization Objective"
                  >
                    {objectives.map((obj) => (
                      <MenuItem key={obj.value} value={obj.value}>
                        {obj.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography id="risk-aversion-slider" gutterBottom>
                  Risk Aversion: {riskAversion}
                </Typography>
                <Slider
                  value={riskAversion}
                  onChange={(e, newValue) => setRiskAversion(newValue as number)}
                  aria-labelledby="risk-aversion-slider"
                  step={0.1}
                  marks
                  min={0.1}
                  max={5}
                  valueLabelDisplay="auto"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={runFactorBasedOptimization}
                    disabled={loading || selectedFactors.length === 0 || assetExposures.length === 0}
                    startIcon={loading ? <CircularProgress size={20} /> : <TrendingUpIcon />}
                  >
                    Run Factor Optimization
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Optimization Results */}
        {optimizationResult && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Optimization Results
              </Typography>
              
              <Grid container spacing={2}>
                {/* Portfolio Metrics */}
                <Grid item xs={12} md={4}>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell><strong>Expected Return</strong></TableCell>
                          <TableCell align="right">{(optimizationResult.expected_return * 100).toFixed(2)}%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Expected Risk</strong></TableCell>
                          <TableCell align="right">{(optimizationResult.expected_risk * 100).toFixed(2)}%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Sharpe Ratio</strong></TableCell>
                          <TableCell align="right">{optimizationResult.sharpe_ratio.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Iterations</strong></TableCell>
                          <TableCell align="right">{optimizationResult.optimization_metrics.iterations}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Computation Time</strong></TableCell>
                          <TableCell align="right">{optimizationResult.optimization_metrics.computation_time.toFixed(3)}s</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                
                {/* Portfolio Factor Exposures */}
                <Grid item xs={12} md={8}>
                  <Typography variant="body2" gutterBottom>
                    Portfolio Factor Exposures
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Object.entries(optimizationResult.factor_exposures).map(([factorId, exposure]) => {
                      const factor = factors.find(f => f.id === factorId);
                      const exposureValue = exposure as number;
                      
                      return (
                        <Chip
                          key={factorId}
                          label={`${factor?.name || factorId}: ${exposureValue.toFixed(2)}`}
                          color={exposureValue > 0.2 ? 'success' : exposureValue < -0.2 ? 'error' : 'default'}
                          variant="outlined"
                          sx={{ m: 0.5 }}
                        />
                      );
                    })}
                  </Box>
                </Grid>
                
                {/* Portfolio Weights */}
                <Grid item xs={12}>
                  <Typography variant="body2" gutterBottom>
                    Portfolio Weights
                  </Typography>
                  
                  <TableContainer sx={{ maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Symbol</TableCell>
                          <TableCell align="right">Weight (%)</TableCell>
                          <TableCell>Allocation</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(optimizationResult.weights)
                          .sort(([, weightA], [, weightB]) => (weightB as number) - (weightA as number))
                          .map(([symbol, weight]) => (
                            <TableRow key={symbol}>
                              <TableCell><strong>{symbol}</strong></TableCell>
                              <TableCell align="right">{((weight as number) * 100).toFixed(2)}%</TableCell>
                              <TableCell>
                                <Box sx={{ width: '100%', height: 10, bgcolor: '#eee', borderRadius: 1 }}>
                                  <Box
                                    sx={{
                                      width: `${(weight as number) * 100}%`,
                                      height: '100%',
                                      bgcolor: 'primary.main',
                                      borderRadius: 1
                                    }}
                                  />
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default FactorBasedOptimizationPanel;