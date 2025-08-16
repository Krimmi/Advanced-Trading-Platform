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
  TableRow,
  Chip,
  Alert
} from '@mui/material';
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
import { 
  RebalancingStrategy, 
  RebalancingParameters, 
  RebalancingResult,
  RebalancingStatus,
  PortfolioTrade
} from '../../services/portfolio/PortfolioRebalancingService';

interface PortfolioRebalancingPanelProps {
  portfolioId: string;
  onGenerateRebalancingPlan: (portfolioId: string, params: RebalancingParameters) => Promise<RebalancingResult>;
  onApproveRebalancingPlan: (result: RebalancingResult) => Promise<RebalancingResult>;
  onExecuteRebalancingPlan: (result: RebalancingResult) => Promise<RebalancingResult>;
  isLoading: boolean;
}

const PortfolioRebalancingPanel: React.FC<PortfolioRebalancingPanelProps> = ({
  portfolioId,
  onGenerateRebalancingPlan,
  onApproveRebalancingPlan,
  onExecuteRebalancingPlan,
  isLoading
}) => {
  const theme = useTheme();
  const [rebalancingStrategy, setRebalancingStrategy] = useState<RebalancingStrategy>(RebalancingStrategy.THRESHOLD);
  const [thresholdValue, setThresholdValue] = useState<number>(0.05);
  const [driftThreshold, setDriftThreshold] = useState<number>(0.1);
  const [scheduleFrequency, setScheduleFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY'>('MONTHLY');
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [maxTurnover, setMaxTurnover] = useState<number | null>(null);
  const [minTradeSize, setMinTradeSize] = useState<number>(100);
  const [rebalancingResult, setRebalancingResult] = useState<RebalancingResult | null>(null);

  const handleGenerateRebalancingPlan = async () => {
    const parameters: RebalancingParameters = {
      strategy: rebalancingStrategy,
      maxTurnover: maxTurnover !== null ? maxTurnover / 100 : undefined,
      minTradeSize: minTradeSize || undefined
    };

    // Add strategy-specific parameters
    switch (rebalancingStrategy) {
      case RebalancingStrategy.THRESHOLD:
        parameters.thresholds = {
          relative: thresholdValue
        };
        break;
      
      case RebalancingStrategy.CALENDAR:
        parameters.schedule = {
          frequency: scheduleFrequency,
          dayOfMonth: dayOfMonth
        };
        break;
      
      case RebalancingStrategy.DRIFT:
        parameters.drift = {
          portfolioThreshold: driftThreshold
        };
        break;
      
      case RebalancingStrategy.HYBRID:
        parameters.thresholds = {
          relative: thresholdValue
        };
        parameters.drift = {
          portfolioThreshold: driftThreshold
        };
        break;
    }

    try {
      const result = await onGenerateRebalancingPlan(portfolioId, parameters);
      setRebalancingResult(result);
    } catch (error) {
      console.error('Error generating rebalancing plan:', error);
      alert('Failed to generate rebalancing plan. See console for details.');
    }
  };

  const handleApproveRebalancing = async () => {
    if (!rebalancingResult) return;
    
    try {
      const result = await onApproveRebalancingPlan(rebalancingResult);
      setRebalancingResult(result);
    } catch (error) {
      console.error('Error approving rebalancing plan:', error);
      alert('Failed to approve rebalancing plan. See console for details.');
    }
  };

  const handleExecuteRebalancing = async () => {
    if (!rebalancingResult) return;
    
    try {
      const result = await onExecuteRebalancingPlan(rebalancingResult);
      setRebalancingResult(result);
    } catch (error) {
      console.error('Error executing rebalancing plan:', error);
      alert('Failed to execute rebalancing plan. See console for details.');
    }
  };

  const getStatusColor = (status: RebalancingStatus) => {
    switch (status) {
      case RebalancingStatus.PENDING:
        return theme.palette.warning.main;
      case RebalancingStatus.APPROVED:
        return theme.palette.info.main;
      case RebalancingStatus.EXECUTED:
        return theme.palette.success.main;
      case RebalancingStatus.REJECTED:
        return theme.palette.error.main;
      case RebalancingStatus.FAILED:
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Portfolio Rebalancing
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Generate and execute portfolio rebalancing plans based on different strategies.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Rebalancing Settings
            </Typography>

            <FormControl component="fieldset" fullWidth margin="normal">
              <Typography variant="subtitle2" gutterBottom>
                Rebalancing Strategy
              </Typography>
              <RadioGroup
                value={rebalancingStrategy}
                onChange={(e) => setRebalancingStrategy(e.target.value as RebalancingStrategy)}
              >
                <FormControlLabel value={RebalancingStrategy.THRESHOLD} control={<Radio />} label="Threshold-Based" />
                <FormControlLabel value={RebalancingStrategy.CALENDAR} control={<Radio />} label="Calendar-Based" />
                <FormControlLabel value={RebalancingStrategy.DRIFT} control={<Radio />} label="Drift-Based" />
                <FormControlLabel value={RebalancingStrategy.OPPORTUNITY} control={<Radio />} label="Opportunity-Based" />
                <FormControlLabel value={RebalancingStrategy.HYBRID} control={<Radio />} label="Hybrid" />
              </RadioGroup>
            </FormControl>

            {/* Strategy-specific settings */}
            {rebalancingStrategy === RebalancingStrategy.THRESHOLD || rebalancingStrategy === RebalancingStrategy.HYBRID ? (
              <FormControl fullWidth margin="normal">
                <Typography id="threshold-slider" gutterBottom>
                  Relative Threshold: {(thresholdValue * 100).toFixed(1)}%
                </Typography>
                <Slider
                  aria-labelledby="threshold-slider"
                  value={thresholdValue}
                  onChange={(_, value) => setThresholdValue(value as number)}
                  min={0.01}
                  max={0.2}
                  step={0.01}
                  marks={[
                    { value: 0.01, label: '1%' },
                    { value: 0.1, label: '10%' },
                    { value: 0.2, label: '20%' }
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
                />
                <Typography variant="caption" color="textSecondary">
                  Rebalance when asset weights deviate from target by this percentage
                </Typography>
              </FormControl>
            ) : null}

            {rebalancingStrategy === RebalancingStrategy.CALENDAR ? (
              <Box>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="frequency-select-label">Frequency</InputLabel>
                  <Select
                    labelId="frequency-select-label"
                    value={scheduleFrequency}
                    label="Frequency"
                    onChange={(e) => setScheduleFrequency(e.target.value as any)}
                  >
                    <MenuItem value="DAILY">Daily</MenuItem>
                    <MenuItem value="WEEKLY">Weekly</MenuItem>
                    <MenuItem value="MONTHLY">Monthly</MenuItem>
                    <MenuItem value="QUARTERLY">Quarterly</MenuItem>
                    <MenuItem value="ANNUALLY">Annually</MenuItem>
                  </Select>
                </FormControl>

                {scheduleFrequency !== 'DAILY' && scheduleFrequency !== 'WEEKLY' && (
                  <FormControl fullWidth margin="normal">
                    <TextField
                      label="Day of Month"
                      type="number"
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                      inputProps={{ min: 1, max: 31 }}
                      helperText="Day of month to perform rebalancing"
                    />
                  </FormControl>
                )}
              </Box>
            ) : null}

            {rebalancingStrategy === RebalancingStrategy.DRIFT || rebalancingStrategy === RebalancingStrategy.HYBRID ? (
              <FormControl fullWidth margin="normal">
                <Typography id="drift-threshold-slider" gutterBottom>
                  Portfolio Drift Threshold: {(driftThreshold * 100).toFixed(1)}%
                </Typography>
                <Slider
                  aria-labelledby="drift-threshold-slider"
                  value={driftThreshold}
                  onChange={(_, value) => setDriftThreshold(value as number)}
                  min={0.05}
                  max={0.3}
                  step={0.01}
                  marks={[
                    { value: 0.05, label: '5%' },
                    { value: 0.15, label: '15%' },
                    { value: 0.3, label: '30%' }
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
                />
                <Typography variant="caption" color="textSecondary">
                  Rebalance when total portfolio drift exceeds this threshold
                </Typography>
              </FormControl>
            ) : null}

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Rebalancing Constraints
            </Typography>

            <FormControl fullWidth margin="normal">
              <TextField
                label="Maximum Turnover (%)"
                type="number"
                value={maxTurnover === null ? '' : maxTurnover}
                onChange={(e) => setMaxTurnover(e.target.value === '' ? null : parseFloat(e.target.value))}
                inputProps={{ min: 0, max: 100, step: 1 }}
                helperText="Maximum portfolio turnover allowed (leave empty for no constraint)"
              />
            </FormControl>

            <FormControl fullWidth margin="normal">
              <TextField
                label="Minimum Trade Size ($)"
                type="number"
                value={minTradeSize}
                onChange={(e) => setMinTradeSize(parseFloat(e.target.value))}
                inputProps={{ min: 0, step: 10 }}
                helperText="Minimum dollar amount for a trade to be executed"
              />
            </FormControl>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3 }}
              onClick={handleGenerateRebalancingPlan}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Generate Rebalancing Plan'
              )}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          {rebalancingResult ? (
            <Box>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">
                    Rebalancing Plan
                  </Typography>
                  <Chip 
                    label={rebalancingResult.status} 
                    sx={{ 
                      backgroundColor: getStatusColor(rebalancingResult.status),
                      color: theme.palette.getContrastText(getStatusColor(rebalancingResult.status))
                    }} 
                  />
                </Box>

                {rebalancingResult.message && (
                  <Alert severity={rebalancingResult.status === RebalancingStatus.FAILED ? 'error' : 'info'} sx={{ mb: 2 }}>
                    {rebalancingResult.message}
                  </Alert>
                )}

                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      Turnover
                    </Typography>
                    <Typography variant="h6">
                      {(rebalancingResult.metrics.turnover * 100).toFixed(2)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      Estimated Cost
                    </Typography>
                    <Typography variant="h6">
                      ${rebalancingResult.metrics.estimatedCost.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      Risk Change
                    </Typography>
                    <Typography variant="h6">
                      {rebalancingResult.metrics.riskChange ? 
                        `${(rebalancingResult.metrics.riskChange * 100).toFixed(2)}%` : 
                        'N/A'}
                    </Typography>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleApproveRebalancing}
                    disabled={
                      isLoading || 
                      rebalancingResult.status !== RebalancingStatus.PENDING
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleExecuteRebalancing}
                    disabled={
                      isLoading || 
                      rebalancingResult.status !== RebalancingStatus.APPROVED
                    }
                  >
                    Execute
                  </Button>
                </Box>
              </Paper>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Current vs Target Allocation
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={rebalancingResult.currentAllocations.map((current, i) => {
                          const target = rebalancingResult.targetAllocations.find(
                            t => t.assetId === current.assetId
                          );
                          return {
                            name: current.assetId,
                            current: current.weight * 100,
                            target: (target?.weight || 0) * 100,
                            difference: ((target?.weight || 0) - current.weight) * 100
                          };
                        })}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `${value}%`} />
                        <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                        <Legend />
                        <Bar dataKey="current" name="Current" fill={theme.palette.primary.main} />
                        <Bar dataKey="target" name="Target" fill={theme.palette.secondary.main} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Rebalancing Trades
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Asset</TableCell>
                            <TableCell>Action</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell align="right">Price</TableCell>
                            <TableCell align="right">Value</TableCell>
                            <TableCell align="right">Cost</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rebalancingResult.trades.length > 0 ? (
                            rebalancingResult.trades.map((trade) => (
                              <TableRow key={`${trade.action}-${trade.assetId}`}>
                                <TableCell>{trade.symbol}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={trade.action} 
                                    size="small"
                                    sx={{ 
                                      backgroundColor: trade.action === 'BUY' ? 
                                        theme.palette.success.light : theme.palette.error.light,
                                      color: trade.action === 'BUY' ? 
                                        theme.palette.success.contrastText : theme.palette.error.contrastText
                                    }} 
                                  />
                                </TableCell>
                                <TableCell align="right">{trade.quantity.toFixed(2)}</TableCell>
                                <TableCell align="right">${trade.estimatedPrice.toFixed(2)}</TableCell>
                                <TableCell align="right">${trade.estimatedValue.toFixed(2)}</TableCell>
                                <TableCell align="right">${trade.estimatedCost.toFixed(2)}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} align="center">
                                No trades required
                              </TableCell>
                            </TableRow>
                          )}
                          {rebalancingResult.trades.length > 0 && (
                            <TableRow>
                              <TableCell colSpan={4} align="right">
                                <Typography variant="subtitle2">Total</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="subtitle2">
                                  ${rebalancingResult.trades.reduce((sum, trade) => sum + trade.estimatedValue, 0).toFixed(2)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="subtitle2">
                                  ${rebalancingResult.trades.reduce((sum, trade) => sum + trade.estimatedCost, 0).toFixed(2)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
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
                  No Rebalancing Plan Yet
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Configure your rebalancing strategy and generate a plan to see results.
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default PortfolioRebalancingPanel;