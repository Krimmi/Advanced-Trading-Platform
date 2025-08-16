import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import riskManagementService, { StressTestScenario, StressTestResult } from '../../services/riskManagementService';
import portfolioConstructionService from '../../services/portfolioConstructionService';

interface StressTestingToolProps {
  portfolioId: string;
}

const StressTestingTool: React.FC<StressTestingToolProps> = ({ portfolioId }) => {
  const [scenarios, setScenarios] = useState<StressTestScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [stressTestResult, setStressTestResult] = useState<StressTestResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [scenariosLoading, setScenariosLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const [newScenario, setNewScenario] = useState<Partial<StressTestScenario>>({
    name: '',
    description: '',
    market_change: 0,
    interest_rate_change: 0,
    volatility_change: 0,
    credit_spread_change: 0,
    fx_change: {},
    commodity_change: {},
    custom_factors: {}
  });

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const NEGATIVE_COLOR = '#FF4842';
  const POSITIVE_COLOR = '#54D62C';

  // Fetch available stress test scenarios
  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    setScenariosLoading(true);
    try {
      const scenariosData = await riskManagementService.getStressTestScenarios();
      setScenarios(scenariosData);
      
      // Select the first scenario by default if available
      if (scenariosData.length > 0 && !selectedScenarioId) {
        setSelectedScenarioId(scenariosData[0].id);
      }
    } catch (err) {
      console.error('Error fetching stress test scenarios:', err);
      setError('Failed to load stress test scenarios');
    } finally {
      setScenariosLoading(false);
    }
  };

  const handleRunStressTest = async () => {
    if (!selectedScenarioId) {
      setError('Please select a scenario first');
      return;
    }

    setLoading(true);
    setError(null);
    setStressTestResult(null);

    try {
      const result = await riskManagementService.runStressTest(portfolioId, selectedScenarioId);
      setStressTestResult(result);
    } catch (err) {
      console.error('Error running stress test:', err);
      setError('Failed to run stress test');
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedScenarioId(event.target.value as string);
    setStressTestResult(null); // Clear previous results
  };

  const handleCreateScenario = async () => {
    if (!newScenario.name) {
      setError('Scenario name is required');
      return;
    }

    setLoading(true);
    try {
      await riskManagementService.createStressTestScenario(newScenario as Omit<StressTestScenario, 'id'>);
      setOpenCreateDialog(false);
      // Reset form
      setNewScenario({
        name: '',
        description: '',
        market_change: 0,
        interest_rate_change: 0,
        volatility_change: 0,
        credit_spread_change: 0,
        fx_change: {},
        commodity_change: {},
        custom_factors: {}
      });
      // Refresh scenarios
      await fetchScenarios();
    } catch (err) {
      console.error('Error creating stress test scenario:', err);
      setError('Failed to create stress test scenario');
    } finally {
      setLoading(false);
    }
  };

  const handleNewScenarioChange = (field: string, value: any) => {
    setNewScenario(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Format asset returns data for bar chart
  const formatAssetReturnsData = () => {
    if (!stressTestResult || !stressTestResult.asset_returns) return [];

    return Object.entries(stressTestResult.asset_returns)
      .map(([symbol, returnValue]) => ({
        symbol,
        return: returnValue * 100 // Convert to percentage
      }))
      .sort((a, b) => a.return - b.return); // Sort by return value
  };

  // Get the selected scenario details
  const selectedScenario = scenarios.find(s => s.id === selectedScenarioId);

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Stress Test Scenarios
            </Typography>
            
            {scenariosLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel id="scenario-select-label">Select Scenario</InputLabel>
                  <Select
                    labelId="scenario-select-label"
                    id="scenario-select"
                    value={selectedScenarioId}
                    label="Select Scenario"
                    onChange={handleScenarioChange as any}
                  >
                    {scenarios.map((scenario) => (
                      <MenuItem key={scenario.id} value={scenario.id}>
                        {scenario.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Button 
                  variant="contained" 
                  fullWidth 
                  onClick={handleRunStressTest}
                  disabled={!selectedScenarioId || loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Run Stress Test'}
                </Button>
                
                <Divider sx={{ my: 3 }} />
                
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  fullWidth
                  onClick={() => setOpenCreateDialog(true)}
                >
                  Create New Scenario
                </Button>
              </>
            )}
            
            {selectedScenario && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Scenario Details
                </Typography>
                <Typography variant="body2" paragraph>
                  {selectedScenario.description}
                </Typography>
                
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Market Change" 
                      secondary={`${(selectedScenario.market_change * 100).toFixed(2)}%`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Interest Rate Change" 
                      secondary={`${(selectedScenario.interest_rate_change * 100).toFixed(2)} bps`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Volatility Change" 
                      secondary={`${(selectedScenario.volatility_change * 100).toFixed(2)}%`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Credit Spread Change" 
                      secondary={`${(selectedScenario.credit_spread_change * 100).toFixed(2)} bps`} 
                    />
                  </ListItem>
                </List>
                
                {Object.keys(selectedScenario.fx_change).length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>FX Changes</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {Object.entries(selectedScenario.fx_change).map(([currency, change]) => (
                          <ListItem key={currency}>
                            <ListItemText 
                              primary={currency} 
                              secondary={`${(change * 100).toFixed(2)}%`} 
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}
                
                {Object.keys(selectedScenario.commodity_change).length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>Commodity Changes</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {Object.entries(selectedScenario.commodity_change).map(([commodity, change]) => (
                          <ListItem key={commodity}>
                            <ListItemText 
                              primary={commodity} 
                              secondary={`${(change * 100).toFixed(2)}%`} 
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {stressTestResult ? (
            <Box>
              <Card sx={{ mb: 3 }}>
                <CardHeader 
                  title="Stress Test Results" 
                  subheader={`Scenario: ${selectedScenario?.name}`}
                />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Portfolio Value Before
                        </Typography>
                        <Typography variant="h5">
                          ${stressTestResult.portfolio_value_before.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Portfolio Value After
                        </Typography>
                        <Typography variant="h5">
                          ${stressTestResult.portfolio_value_after.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12}>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 2, 
                          bgcolor: stressTestResult.portfolio_return < 0 ? 'error.lighter' : 'success.lighter',
                          color: stressTestResult.portfolio_return < 0 ? 'error.darker' : 'success.darker'
                        }}
                      >
                        <Typography variant="subtitle2">
                          Portfolio Return
                        </Typography>
                        <Typography variant="h4">
                          {(stressTestResult.portfolio_return * 100).toFixed(2)}%
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Risk Metrics Comparison
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Volatility
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" sx={{ mr: 1 }}>
                            {stressTestResult.risk_metrics_before.volatility 
                              ? `${(stressTestResult.risk_metrics_before.volatility * 100).toFixed(2)}%`
                              : 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">→</Typography>
                          <Typography variant="body1" sx={{ ml: 1 }}>
                            {stressTestResult.risk_metrics_after.volatility 
                              ? `${(stressTestResult.risk_metrics_after.volatility * 100).toFixed(2)}%`
                              : 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          VaR (95%)
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" sx={{ mr: 1 }}>
                            {stressTestResult.risk_metrics_before.var_95 
                              ? `${(stressTestResult.risk_metrics_before.var_95 * 100).toFixed(2)}%`
                              : 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">→</Typography>
                          <Typography variant="body1" sx={{ ml: 1 }}>
                            {stressTestResult.risk_metrics_after.var_95 
                              ? `${(stressTestResult.risk_metrics_after.var_95 * 100).toFixed(2)}%`
                              : 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Sharpe Ratio
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" sx={{ mr: 1 }}>
                            {stressTestResult.risk_metrics_before.sharpe_ratio 
                              ? stressTestResult.risk_metrics_before.sharpe_ratio.toFixed(2)
                              : 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">→</Typography>
                          <Typography variant="body1" sx={{ ml: 1 }}>
                            {stressTestResult.risk_metrics_after.sharpe_ratio 
                              ? stressTestResult.risk_metrics_after.sharpe_ratio.toFixed(2)
                              : 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Beta
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" sx={{ mr: 1 }}>
                            {stressTestResult.risk_metrics_before.beta 
                              ? stressTestResult.risk_metrics_before.beta.toFixed(2)
                              : 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">→</Typography>
                          <Typography variant="body1" sx={{ ml: 1 }}>
                            {stressTestResult.risk_metrics_after.beta 
                              ? stressTestResult.risk_metrics_after.beta.toFixed(2)
                              : 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader title="Asset Returns" />
                <CardContent>
                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={formatAssetReturnsData()}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          type="number" 
                          tickFormatter={(value) => `${value}%`}
                        />
                        <YAxis 
                          dataKey="symbol" 
                          type="category" 
                          width={80}
                        />
                        <Tooltip 
                          formatter={(value) => [`${value}%`, 'Return']}
                        />
                        <Legend />
                        <ReferenceLine x={0} stroke="#000" />
                        <Bar dataKey="return" name="Return (%)">
                          {formatAssetReturnsData().map((entry, index) => (
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
            </Box>
          ) : (
            <Paper sx={{ p: 3, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  No Stress Test Results
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Select a scenario and run a stress test to see results here.
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
      
      {/* Create New Scenario Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Stress Test Scenario</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Scenario Name"
                fullWidth
                required
                value={newScenario.name}
                onChange={(e) => handleNewScenarioChange('name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={newScenario.description}
                onChange={(e) => handleNewScenarioChange('description', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Market Change (%)"
                type="number"
                fullWidth
                value={newScenario.market_change * 100}
                onChange={(e) => handleNewScenarioChange('market_change', Number(e.target.value) / 100)}
                InputProps={{
                  inputProps: { step: 0.1 }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Interest Rate Change (bps)"
                type="number"
                fullWidth
                value={newScenario.interest_rate_change * 100}
                onChange={(e) => handleNewScenarioChange('interest_rate_change', Number(e.target.value) / 100)}
                InputProps={{
                  inputProps: { step: 1 }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Volatility Change (%)"
                type="number"
                fullWidth
                value={newScenario.volatility_change * 100}
                onChange={(e) => handleNewScenarioChange('volatility_change', Number(e.target.value) / 100)}
                InputProps={{
                  inputProps: { step: 0.1 }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Credit Spread Change (bps)"
                type="number"
                fullWidth
                value={newScenario.credit_spread_change * 100}
                onChange={(e) => handleNewScenarioChange('credit_spread_change', Number(e.target.value) / 100)}
                InputProps={{
                  inputProps: { step: 1 }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateScenario} 
            variant="contained" 
            disabled={loading || !newScenario.name}
          >
            {loading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StressTestingTool;