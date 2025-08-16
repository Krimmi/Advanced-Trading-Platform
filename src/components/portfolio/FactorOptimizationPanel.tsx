import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Slider,
  FormControlLabel,
  RadioGroup,
  Radio,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import { 
  FactorOptimizationParameters, 
  FactorOptimizationResult,
  Factor,
  FactorCategory,
  FactorExposure
} from '../../services/portfolio/FactorOptimizationService';

interface FactorOptimizationPanelProps {
  portfolioId: string;
  onOptimize: (params: FactorOptimizationParameters) => Promise<FactorOptimizationResult>;
  onAnalyze: (portfolioId: string) => Promise<any>;
  isLoading: boolean;
}

const FactorOptimizationPanel: React.FC<FactorOptimizationPanelProps> = ({
  portfolioId,
  onOptimize,
  onAnalyze,
  isLoading
}) => {
  const theme = useTheme();
  const [objectiveType, setObjectiveType] = useState<'MAXIMIZE_RETURN' | 'MINIMIZE_RISK' | 'MAXIMIZE_SHARPE' | 'TARGET_FACTOR_EXPOSURES'>('MAXIMIZE_SHARPE');
  const [riskFreeRate, setRiskFreeRate] = useState<number>(0.02);
  const [specificRiskConstraint, setSpecificRiskConstraint] = useState<number | null>(null);
  const [targetFactorExposures, setTargetFactorExposures] = useState<Record<string, { min?: number, target?: number, max?: number }>>({
    'MKT': { target: 1.0 },
    'SMB': { min: -0.2, max: 0.2 },
    'HML': { min: 0, max: 0.5 },
    'MOM': { target: 0.2 },
    'QMJ': { min: 0.1, max: 0.5 },
    'BAB': { target: 0.3 }
  });
  const [result, setResult] = useState<FactorOptimizationResult | null>(null);
  const [portfolioAnalysis, setPortfolioAnalysis] = useState<any | null>(null);
  const [availableFactors, setAvailableFactors] = useState<Factor[]>([
    { id: 'MKT', name: 'Market', category: FactorCategory.MARKET, description: 'Exposure to broad market movements' },
    { id: 'SMB', name: 'Size', category: FactorCategory.SIZE, description: 'Small minus big - exposure to size premium' },
    { id: 'HML', name: 'Value', category: FactorCategory.VALUE, description: 'High minus low - exposure to value premium' },
    { id: 'MOM', name: 'Momentum', category: FactorCategory.MOMENTUM, description: 'Exposure to momentum effect' },
    { id: 'QMJ', name: 'Quality', category: FactorCategory.QUALITY, description: 'Quality minus junk - exposure to quality premium' },
    { id: 'BAB', name: 'Low Volatility', category: FactorCategory.VOLATILITY, description: 'Betting against beta - exposure to low volatility premium' }
  ]);

  useEffect(() => {
    // Analyze current portfolio when component mounts
    handleAnalyzePortfolio();
  }, [portfolioId]);

  const handleAnalyzePortfolio = async () => {
    try {
      const analysis = await onAnalyze(portfolioId);
      setPortfolioAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
    }
  };

  const handleOptimize = async () => {
    const params: FactorOptimizationParameters = {
      objectiveType,
      riskFreeRate,
      specificRiskConstraint: specificRiskConstraint || undefined,
      targetFactorExposures: objectiveType === 'TARGET_FACTOR_EXPOSURES' ? targetFactorExposures : undefined
    };

    try {
      const result = await onOptimize(params);
      setResult(result);
    } catch (error) {
      console.error('Error optimizing portfolio:', error);
      alert('Failed to optimize portfolio. See console for details.');
    }
  };

  const handleUpdateTargetFactorExposure = (
    factorId: string, 
    field: 'min' | 'target' | 'max', 
    value: string
  ) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    
    setTargetFactorExposures({
      ...targetFactorExposures,
      [factorId]: {
        ...targetFactorExposures[factorId] || {},
        [field]: numValue
      }
    });
  };

  const getFactorName = (factorId: string): string => {
    const factor = availableFactors.find(f => f.id === factorId);
    return factor ? factor.name : factorId;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Factor-Based Portfolio Optimization
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Optimize your portfolio based on factor exposures to achieve specific risk and return objectives.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Optimization Settings
            </Typography>

            <FormControl component="fieldset" fullWidth margin="normal">
              <Typography variant="subtitle2" gutterBottom>
                Optimization Objective
              </Typography>
              <RadioGroup
                value={objectiveType}
                onChange={(e) => setObjectiveType(e.target.value as any)}
              >
                <FormControlLabel value="MAXIMIZE_RETURN" control={<Radio />} label="Maximize Factor-Based Return" />
                <FormControlLabel value="MINIMIZE_RISK" control={<Radio />} label="Minimize Factor-Based Risk" />
                <FormControlLabel value="MAXIMIZE_SHARPE" control={<Radio />} label="Maximize Factor-Based Sharpe Ratio" />
                <FormControlLabel value="TARGET_FACTOR_EXPOSURES" control={<Radio />} label="Target Specific Factor Exposures" />
              </RadioGroup>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <Typography id="risk-free-rate-slider" gutterBottom>
                Risk-Free Rate: {(riskFreeRate * 100).toFixed(2)}%
              </Typography>
              <Slider
                aria-labelledby="risk-free-rate-slider"
                value={riskFreeRate}
                onChange={(_, value) => setRiskFreeRate(value as number)}
                min={0}
                max={0.1}
                step={0.005}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 0.05, label: '5%' },
                  { value: 0.1, label: '10%' }
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${(value * 100).toFixed(1)}%`}
              />
            </FormControl>

            <FormControl fullWidth margin="normal">
              <TextField
                label="Specific Risk Constraint (%)"
                type="number"
                value={specificRiskConstraint === null ? '' : specificRiskConstraint}
                onChange={(e) => setSpecificRiskConstraint(e.target.value === '' ? null : parseFloat(e.target.value))}
                inputProps={{ step: 0.1 }}
                helperText="Maximum allowable specific risk (leave empty for no constraint)"
              />
            </FormControl>

            {objectiveType === 'TARGET_FACTOR_EXPOSURES' && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Target Factor Exposures
                </Typography>
                <Typography variant="caption" color="textSecondary" paragraph>
                  Specify target exposures, ranges, or both for each factor.
                </Typography>

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Factor</TableCell>
                        <TableCell align="right">Min</TableCell>
                        <TableCell align="right">Target</TableCell>
                        <TableCell align="right">Max</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {availableFactors.map((factor) => (
                        <TableRow key={factor.id}>
                          <TableCell>
                            <Typography variant="body2">{factor.name}</Typography>
                            <Typography variant="caption" color="textSecondary">{factor.id}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={targetFactorExposures[factor.id]?.min ?? ''}
                              onChange={(e) => handleUpdateTargetFactorExposure(factor.id, 'min', e.target.value)}
                              inputProps={{ step: 0.1, style: { width: '60px' } }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={targetFactorExposures[factor.id]?.target ?? ''}
                              onChange={(e) => handleUpdateTargetFactorExposure(factor.id, 'target', e.target.value)}
                              inputProps={{ step: 0.1, style: { width: '60px' } }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={targetFactorExposures[factor.id]?.max ?? ''}
                              onChange={(e) => handleUpdateTargetFactorExposure(factor.id, 'max', e.target.value)}
                              inputProps={{ step: 0.1, style: { width: '60px' } }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3 }}
              onClick={handleOptimize}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Run Factor Optimization'
              )}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          {result ? (
            <Box>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Optimization Results
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      Expected Return
                    </Typography>
                    <Typography variant="h6">
                      {(result.metrics.expectedReturn * 100).toFixed(2)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      Expected Risk
                    </Typography>
                    <Typography variant="h6">
                      {(result.metrics.expectedRisk * 100).toFixed(2)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      Sharpe Ratio
                    </Typography>
                    <Typography variant="h6">
                      {result.metrics.sharpeRatio.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      Factor Risk
                    </Typography>
                    <Typography variant="h6">
                      {(result.metrics.factorRisk * 100).toFixed(2)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      Specific Risk
                    </Typography>
                    <Typography variant="h6">
                      {(result.metrics.specificRisk * 100).toFixed(2)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      Total Risk
                    </Typography>
                    <Typography variant="h6">
                      {(result.metrics.totalRisk * 100).toFixed(2)}%
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Asset Allocation
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={result.allocations.map((alloc) => ({
                            name: alloc.assetId,
                            value: alloc.weight
                          }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${(value * 100).toFixed(1)}%`}
                        >
                          {result.allocations.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={theme.palette.primary[`${((index + 1) * 100) % 900 || 100}`]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${(value * 100).toFixed(2)}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Factor Exposures
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart 
                        cx="50%" 
                        cy="50%" 
                        outerRadius="80%" 
                        data={result.factorExposures.map(exposure => ({
                          factor: getFactorName(exposure.factorId),
                          exposure: exposure.exposure,
                          target: targetFactorExposures[exposure.factorId]?.target || 0
                        }))}
                      >
                        <PolarGrid />
                        <PolarAngleAxis dataKey="factor" />
                        <PolarRadiusAxis angle={30} domain={[-1, 1]} />
                        <Radar 
                          name="Optimized Portfolio" 
                          dataKey="exposure" 
                          stroke={theme.palette.primary.main} 
                          fill={theme.palette.primary.main} 
                          fillOpacity={0.6} 
                        />
                        {objectiveType === 'TARGET_FACTOR_EXPOSURES' && (
                          <Radar 
                            name="Target" 
                            dataKey="target" 
                            stroke={theme.palette.secondary.main} 
                            fill={theme.palette.secondary.main}
                            fillOpacity={0.1} 
                          />
                        )}
                        <Legend />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Optimal Asset Allocation
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Asset</TableCell>
                            <TableCell align="right">Weight</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {result.allocations.map((alloc) => (
                            <TableRow key={alloc.assetId}>
                              <TableCell>{alloc.assetId}</TableCell>
                              <TableCell align="right">{(alloc.weight * 100).toFixed(2)}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          ) : portfolioAnalysis ? (
            <Box>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Current Portfolio Factor Analysis
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      Expected Return
                    </Typography>
                    <Typography variant="h6">
                      {(portfolioAnalysis.metrics.expectedReturn * 100).toFixed(2)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      Total Risk
                    </Typography>
                    <Typography variant="h6">
                      {(portfolioAnalysis.metrics.totalRisk * 100).toFixed(2)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      Factor Risk
                    </Typography>
                    <Typography variant="h6">
                      {(portfolioAnalysis.metrics.factorRisk * 100).toFixed(2)}%
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Current Factor Exposures
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart 
                    cx="50%" 
                    cy="50%" 
                    outerRadius="80%" 
                    data={portfolioAnalysis.factorExposures.map((exposure: FactorExposure) => ({
                      factor: getFactorName(exposure.factorId),
                      exposure: exposure.exposure
                    }))}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="factor" />
                    <PolarRadiusAxis angle={30} domain={[-1, 1]} />
                    <Radar 
                      name="Current Portfolio" 
                      dataKey="exposure" 
                      stroke={theme.palette.info.main} 
                      fill={theme.palette.info.main} 
                      fillOpacity={0.6} 
                    />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </Paper>

              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Factor Risk Contributions
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={portfolioAnalysis.factorContributions.map((contrib: any) => ({
                      factor: getFactorName(contrib.factorId),
                      riskContribution: contrib.riskContribution * 100,
                      returnContribution: contrib.returnContribution * 100
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="factor" />
                    <YAxis tickFormatter={(value) => `${value.toFixed(1)}%`} />
                    <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                    <Legend />
                    <Bar dataKey="riskContribution" name="Risk Contribution" fill={theme.palette.error.main} />
                    <Bar dataKey="returnContribution" name="Return Contribution" fill={theme.palette.success.main} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Box>
          ) : (
            <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No Results Yet
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Configure your factor optimization settings and run the optimization to see results.
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default FactorOptimizationPanel;