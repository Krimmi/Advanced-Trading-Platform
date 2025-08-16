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
  IconButton,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import { InvestorView, BlackLittermanParameters, BlackLittermanResult } from '../../services/portfolio/BlackLittermanService';

interface BlackLittermanPanelProps {
  portfolioId: string;
  onRunModel: (params: BlackLittermanParameters) => Promise<BlackLittermanResult>;
  isLoading: boolean;
}

const BlackLittermanPanel: React.FC<BlackLittermanPanelProps> = ({
  portfolioId,
  onRunModel,
  isLoading
}) => {
  const theme = useTheme();
  const [tau, setTau] = useState<number>(0.025);
  const [riskFreeRate, setRiskFreeRate] = useState<number>(0.02);
  const [investorViews, setInvestorViews] = useState<InvestorView[]>([]);
  const [newView, setNewView] = useState<{
    assets: string[];
    weights: string;
    expectedReturn: string;
    confidence: string;
  }>({
    assets: [],
    weights: '',
    expectedReturn: '',
    confidence: ''
  });
  const [availableAssets, setAvailableAssets] = useState<string[]>([
    'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'FB', 'TSLA', 'BRK.B', 'JPM', 'JNJ', 'V'
  ]);
  const [result, setResult] = useState<BlackLittermanResult | null>(null);

  const handleAddView = () => {
    if (!newView.assets.length || !newView.weights || !newView.expectedReturn || !newView.confidence) {
      return;
    }

    const weights = newView.weights.split(',').map(w => parseFloat(w.trim()));
    
    // Validate weights length matches assets length
    if (weights.length !== newView.assets.length) {
      alert('Number of weights must match number of assets');
      return;
    }

    const view: InvestorView = {
      id: `view-${investorViews.length + 1}`,
      assets: newView.assets,
      weights,
      expectedReturn: parseFloat(newView.expectedReturn),
      confidence: parseFloat(newView.confidence)
    };

    setInvestorViews([...investorViews, view]);
    setNewView({
      assets: [],
      weights: '',
      expectedReturn: '',
      confidence: ''
    });
  };

  const handleRemoveView = (index: number) => {
    const updatedViews = [...investorViews];
    updatedViews.splice(index, 1);
    setInvestorViews(updatedViews);
  };

  const handleRunModel = async () => {
    if (investorViews.length === 0) {
      alert('Please add at least one investor view');
      return;
    }

    const params: BlackLittermanParameters = {
      tau,
      views: investorViews,
      riskFreeRate
    };

    try {
      const result = await onRunModel(params);
      setResult(result);
    } catch (error) {
      console.error('Error running Black-Litterman model:', error);
      alert('Failed to run Black-Litterman model. See console for details.');
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Black-Litterman Model
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        The Black-Litterman model combines market equilibrium with investor views to create a more robust portfolio allocation.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Model Parameters
            </Typography>

            <FormControl fullWidth margin="normal">
              <Typography id="tau-slider" gutterBottom>
                Tau (τ): {tau.toFixed(3)}
              </Typography>
              <Slider
                aria-labelledby="tau-slider"
                value={tau}
                onChange={(_, value) => setTau(value as number)}
                min={0.001}
                max={0.1}
                step={0.001}
                marks={[
                  { value: 0.001, label: '0.001' },
                  { value: 0.05, label: '0.05' },
                  { value: 0.1, label: '0.1' }
                ]}
                valueLabelDisplay="auto"
              />
              <Typography variant="caption" color="textSecondary">
                Tau represents the uncertainty in the CAPM prior. Lower values give more weight to the prior.
              </Typography>
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

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" gutterBottom>
              Investor Views
            </Typography>
            <Typography variant="caption" color="textSecondary" paragraph>
              Express your views on expected returns for specific assets or combinations of assets.
            </Typography>

            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="assets-select-label">Assets</InputLabel>
                <Select
                  labelId="assets-select-label"
                  multiple
                  value={newView.assets}
                  onChange={(e) => setNewView({ ...newView, assets: e.target.value as string[] })}
                  label="Assets"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Typography variant="body2" key={value}>{value}</Typography>
                      ))}
                    </Box>
                  )}
                >
                  {availableAssets.map((asset) => (
                    <MenuItem key={asset} value={asset}>
                      {asset}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                margin="normal"
                label="Weights (comma-separated)"
                value={newView.weights}
                onChange={(e) => setNewView({ ...newView, weights: e.target.value })}
                helperText="Example: 1, -1 for a relative view or 0.5, 0.5 for an absolute view"
              />

              <TextField
                fullWidth
                margin="normal"
                label="Expected Return (%)"
                type="number"
                value={newView.expectedReturn}
                onChange={(e) => setNewView({ ...newView, expectedReturn: e.target.value })}
                inputProps={{ step: 0.1 }}
                helperText="Annual expected return in percentage"
              />

              <TextField
                fullWidth
                margin="normal"
                label="Confidence (1-10)"
                type="number"
                value={newView.confidence}
                onChange={(e) => setNewView({ ...newView, confidence: e.target.value })}
                inputProps={{ min: 1, max: 10, step: 1 }}
                helperText="Higher values indicate more confidence in your view"
              />

              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddView}
                fullWidth
                sx={{ mt: 1 }}
              >
                Add View
              </Button>
            </Box>

            {investorViews.length > 0 && (
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Assets</TableCell>
                      <TableCell>Weights</TableCell>
                      <TableCell>Return</TableCell>
                      <TableCell>Confidence</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {investorViews.map((view, index) => (
                      <TableRow key={view.id}>
                        <TableCell>{view.assets.join(', ')}</TableCell>
                        <TableCell>{view.weights.join(', ')}</TableCell>
                        <TableCell>{view.expectedReturn}%</TableCell>
                        <TableCell>{view.confidence}/10</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveView(index)}
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

            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3 }}
              onClick={handleRunModel}
              disabled={isLoading || investorViews.length === 0}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Run Black-Litterman Model'
              )}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          {result ? (
            <Box>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Model Results
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
              </Paper>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Prior vs Posterior Returns
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={result.priorReturns.map((prior, i) => ({
                          name: `Asset ${i+1}`,
                          prior: prior * 100,
                          posterior: result.posteriorReturns[i] * 100
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `${value.toFixed(1)}%`} />
                        <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                        <Legend />
                        <Bar dataKey="prior" name="Prior" fill={theme.palette.primary.main} />
                        <Bar dataKey="posterior" name="Posterior" fill={theme.palette.secondary.main} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Optimal Allocation
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={result.optimalAllocations.map((alloc) => ({
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
                          {result.optimalAllocations.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={theme.palette.primary[`${((index + 1) * 100) % 900 || 100}`]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${(value * 100).toFixed(2)}%`} />
                      </PieChart>
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
                            <TableCell align="right">Prior Return</TableCell>
                            <TableCell align="right">Posterior Return</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {result.optimalAllocations.map((alloc, index) => (
                            <TableRow key={alloc.assetId}>
                              <TableCell>{alloc.assetId}</TableCell>
                              <TableCell align="right">{(alloc.weight * 100).toFixed(2)}%</TableCell>
                              <TableCell align="right">
                                {index < result.priorReturns.length ? 
                                  `${(result.priorReturns[index] * 100).toFixed(2)}%` : 'N/A'}
                              </TableCell>
                              <TableCell align="right">
                                {index < result.posteriorReturns.length ? 
                                  `${(result.posteriorReturns[index] * 100).toFixed(2)}%` : 'N/A'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No Results Yet
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Add your investor views and run the Black-Litterman model to see optimal portfolio allocations.
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default BlackLittermanPanel;