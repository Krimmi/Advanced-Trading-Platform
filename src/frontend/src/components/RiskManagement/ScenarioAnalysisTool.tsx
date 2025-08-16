import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Divider,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line
} from 'recharts';
import riskManagementService from '../../services/riskManagementService';

interface ScenarioAnalysisToolProps {
  portfolioId: string;
}

interface ScenarioFactor {
  name: string;
  value: number;
}

interface CustomScenario {
  name: string;
  factors: ScenarioFactor[];
}

const ScenarioAnalysisTool: React.FC<ScenarioAnalysisToolProps> = ({ portfolioId }) => {
  const [scenarios, setScenarios] = useState<CustomScenario[]>([
    {
      name: 'Market Crash',
      factors: [
        { name: 'market_return', value: -20 },
        { name: 'interest_rate', value: 0.5 },
        { name: 'volatility', value: 50 }
      ]
    },
    {
      name: 'Stagflation',
      factors: [
        { name: 'market_return', value: -5 },
        { name: 'interest_rate', value: 2 },
        { name: 'inflation', value: 8 }
      ]
    }
  ]);
  const [newScenario, setNewScenario] = useState<CustomScenario>({
    name: '',
    factors: [{ name: 'market_return', value: 0 }]
  });
  const [scenarioResults, setScenarioResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddScenario, setShowAddScenario] = useState<boolean>(false);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const NEGATIVE_COLOR = '#FF4842';
  const POSITIVE_COLOR = '#54D62C';

  // Available factors for scenarios
  const availableFactors = [
    { value: 'market_return', label: 'Market Return (%)', description: 'Overall market return change' },
    { value: 'interest_rate', label: 'Interest Rate (bps)', description: 'Change in interest rates in basis points' },
    { value: 'volatility', label: 'Volatility (%)', description: 'Change in market volatility' },
    { value: 'inflation', label: 'Inflation (%)', description: 'Change in inflation rate' },
    { value: 'credit_spread', label: 'Credit Spread (bps)', description: 'Change in credit spreads in basis points' },
    { value: 'oil_price', label: 'Oil Price (%)', description: 'Change in oil prices' },
    { value: 'usd_index', label: 'USD Index (%)', description: 'Change in US Dollar index' },
    { value: 'gold_price', label: 'Gold Price (%)', description: 'Change in gold prices' },
    { value: 'real_estate', label: 'Real Estate (%)', description: 'Change in real estate prices' },
    { value: 'unemployment', label: 'Unemployment (pp)', description: 'Change in unemployment rate in percentage points' }
  ];

  const handleRunScenarioAnalysis = async () => {
    if (scenarios.length === 0) {
      setError('Please add at least one scenario');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Format scenarios for API
      const formattedScenarios = scenarios.map(scenario => ({
        name: scenario.name,
        factor_changes: scenario.factors.reduce((acc, factor) => {
          // Convert percentages to decimals for API
          const value = factor.name.includes('_rate') || factor.name.includes('spread') 
            ? factor.value / 100 // Convert basis points to decimal
            : factor.value / 100; // Convert percentage to decimal
          return { ...acc, [factor.name]: value };
        }, {} as Record<string, number>)
      }));

      const results = await riskManagementService.runScenarioAnalysis(portfolioId, formattedScenarios);
      setScenarioResults(results);
    } catch (err) {
      console.error('Error running scenario analysis:', err);
      setError('Failed to run scenario analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleAddScenario = () => {
    if (!newScenario.name) {
      setError('Scenario name is required');
      return;
    }

    if (newScenario.factors.length === 0) {
      setError('At least one factor is required');
      return;
    }

    setScenarios([...scenarios, { ...newScenario }]);
    setNewScenario({ name: '', factors: [{ name: 'market_return', value: 0 }] });
    setShowAddScenario(false);
  };

  const handleRemoveScenario = (index: number) => {
    const updatedScenarios = [...scenarios];
    updatedScenarios.splice(index, 1);
    setScenarios(updatedScenarios);
  };

  const handleAddFactor = () => {
    setNewScenario({
      ...newScenario,
      factors: [...newScenario.factors, { name: 'market_return', value: 0 }]
    });
  };

  const handleRemoveFactor = (index: number) => {
    const updatedFactors = [...newScenario.factors];
    updatedFactors.splice(index, 1);
    setNewScenario({
      ...newScenario,
      factors: updatedFactors
    });
  };

  const handleFactorChange = (index: number, field: 'name' | 'value', value: string | number) => {
    const updatedFactors = [...newScenario.factors];
    updatedFactors[index] = {
      ...updatedFactors[index],
      [field]: field === 'value' ? Number(value) : value
    };
    setNewScenario({
      ...newScenario,
      factors: updatedFactors
    });
  };

  // Format scenario results for bar chart
  const formatScenarioResultsData = () => {
    return scenarioResults.map(result => ({
      name: result.scenario_name,
      return: result.portfolio_return * 100 // Convert to percentage
    }));
  };

  // Get factor label from value
  const getFactorLabel = (factorName: string): string => {
    const factor = availableFactors.find(f => f.value === factorName);
    return factor ? factor.label : factorName;
  };

  // Get factor description from value
  const getFactorDescription = (factorName: string): string => {
    const factor = availableFactors.find(f => f.value === factorName);
    return factor ? factor.description : '';
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Custom Scenarios
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setShowAddScenario(true)}
                size="small"
              >
                Add Scenario
              </Button>
            </Box>
            
            {scenarios.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No scenarios defined. Add a scenario to begin analysis.
              </Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Scenario</TableCell>
                      <TableCell>Factors</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scenarios.map((scenario, index) => (
                      <TableRow key={index}>
                        <TableCell>{scenario.name}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {scenario.factors.map((factor, factorIndex) => (
                              <Tooltip 
                                key={factorIndex} 
                                title={`${getFactorLabel(factor.name)}: ${factor.value}${factor.name.includes('_rate') || factor.name.includes('spread') ? ' bps' : '%'}`}
                              >
                                <Chip 
                                  label={`${factor.name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`} 
                                  size="small" 
                                  variant="outlined"
                                />
                              </Tooltip>
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton 
                            size="small" 
                            onClick={() => handleRemoveScenario(index)}
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
            )}
            
            {showAddScenario && (
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardHeader title="Add New Scenario" />
                <CardContent>
                  <TextField
                    label="Scenario Name"
                    fullWidth
                    value={newScenario.name}
                    onChange={(e) => setNewScenario({ ...newScenario, name: e.target.value })}
                    margin="normal"
                    required
                  />
                  
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    Factors
                  </Typography>
                  
                  {newScenario.factors.map((factor, index) => (
                    <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 1 }}>
                      <Grid item xs={5}>
                        <FormControl fullWidth size="small">
                          <InputLabel id={`factor-name-label-${index}`}>Factor</InputLabel>
                          <Select
                            labelId={`factor-name-label-${index}`}
                            value={factor.name}
                            label="Factor"
                            onChange={(e) => handleFactorChange(index, 'name', e.target.value)}
                          >
                            {availableFactors.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={5}>
                        <TextField
                          label="Value"
                          type="number"
                          fullWidth
                          size="small"
                          value={factor.value}
                          onChange={(e) => handleFactorChange(index, 'value', e.target.value)}
                          InputProps={{
                            endAdornment: factor.name.includes('_rate') || factor.name.includes('spread') ? 'bps' : '%'
                          }}
                        />
                      </Grid>
                      <Grid item xs={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleRemoveFactor(index)}
                            color="error"
                            disabled={newScenario.factors.length <= 1}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                          <Tooltip title={getFactorDescription(factor.name)}>
                            <IconButton size="small">
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Grid>
                    </Grid>
                  ))}
                  
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddFactor}
                    sx={{ mt: 1 }}
                  >
                    Add Factor
                  </Button>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button 
                      onClick={() => setShowAddScenario(false)} 
                      sx={{ mr: 1 }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="contained" 
                      onClick={handleAddScenario}
                      disabled={!newScenario.name || newScenario.factors.length === 0}
                    >
                      Add Scenario
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
            
            <Button
              variant="contained"
              fullWidth
              onClick={handleRunScenarioAnalysis}
              disabled={scenarios.length === 0 || loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Run Scenario Analysis'}
            </Button>
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={7}>
          {scenarioResults.length > 0 ? (
            <Box>
              <Card sx={{ mb: 3 }}>
                <CardHeader title="Portfolio Returns by Scenario" />
                <CardContent>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={formatScenarioResultsData()}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `${value}%`} />
                        <RechartsTooltip formatter={(value) => [`${value}%`, 'Return']} />
                        <Legend />
                        <Bar dataKey="return" name="Portfolio Return">
                          {formatScenarioResultsData().map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.return < 0 ? NEGATIVE_COLOR : POSITIVE_COLOR} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader title="Detailed Scenario Results" />
                <CardContent>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Scenario</TableCell>
                          <TableCell align="right">Portfolio Return</TableCell>
                          <TableCell align="right">Volatility</TableCell>
                          <TableCell align="right">VaR (95%)</TableCell>
                          <TableCell align="right">Sharpe Ratio</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {scenarioResults.map((result, index) => (
                          <TableRow key={index}>
                            <TableCell>{result.scenario_name}</TableCell>
                            <TableCell 
                              align="right"
                              sx={{ 
                                color: result.portfolio_return < 0 ? NEGATIVE_COLOR : POSITIVE_COLOR,
                                fontWeight: 'medium'
                              }}
                            >
                              {(result.portfolio_return * 100).toFixed(2)}%
                            </TableCell>
                            <TableCell align="right">
                              {result.risk_metrics.volatility 
                                ? `${(result.risk_metrics.volatility * 100).toFixed(2)}%` 
                                : 'N/A'}
                            </TableCell>
                            <TableCell align="right">
                              {result.risk_metrics.var_95 
                                ? `${(result.risk_metrics.var_95 * 100).toFixed(2)}%` 
                                : 'N/A'}
                            </TableCell>
                            <TableCell align="right">
                              {result.risk_metrics.sharpe_ratio 
                                ? result.risk_metrics.sharpe_ratio.toFixed(2) 
                                : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Box>
          ) : (
            <Paper sx={{ p: 3, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  No Scenario Analysis Results
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Define scenarios and run the analysis to see results here.
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ScenarioAnalysisTool;