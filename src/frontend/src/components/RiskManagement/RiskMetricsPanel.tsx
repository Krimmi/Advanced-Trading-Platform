import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  Tooltip, 
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { PortfolioRiskMetrics } from '../../services/riskManagementService';

interface RiskMetricsPanelProps {
  riskMetrics: PortfolioRiskMetrics | null;
  portfolioName: string;
  benchmark: string;
}

const RiskMetricsPanel: React.FC<RiskMetricsPanelProps> = ({ riskMetrics, portfolioName, benchmark }) => {
  if (!riskMetrics) {
    return (
      <Paper sx={{ p: 3, height: '100%' }}>
        <Typography variant="h6" gutterBottom>
          Risk Metrics
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No risk metrics available for this portfolio.
        </Typography>
      </Paper>
    );
  }

  // Helper function to format percentages
  const formatPercent = (value: number | null): string => {
    if (value === null) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };

  // Helper function to format ratios
  const formatRatio = (value: number | null): string => {
    if (value === null) return 'N/A';
    return value.toFixed(2);
  };

  // Helper function to determine color based on value
  const getValueColor = (value: number | null, isGoodIfHigh: boolean): string => {
    if (value === null) return 'text.secondary';
    
    // For metrics where higher is better (e.g., Sharpe ratio)
    if (isGoodIfHigh) {
      if (value > 1) return 'success.main';
      if (value > 0) return 'warning.main';
      return 'error.main';
    } 
    // For metrics where lower is better (e.g., volatility)
    else {
      if (value < 0.1) return 'success.main';
      if (value < 0.2) return 'warning.main';
      return 'error.main';
    }
  };

  // Define risk metrics with descriptions
  const riskMetricsInfo = [
    {
      name: 'Volatility',
      value: riskMetrics.volatility,
      format: formatPercent,
      isGoodIfHigh: false,
      description: 'Annualized standard deviation of portfolio returns, measuring the dispersion of returns around the mean.'
    },
    {
      name: 'Beta',
      value: riskMetrics.beta,
      format: formatRatio,
      isGoodIfHigh: null, // Neutral
      description: `Measure of portfolio's volatility relative to the ${benchmark} benchmark. Beta > 1 indicates higher volatility than the market.`
    },
    {
      name: 'Alpha',
      value: riskMetrics.alpha,
      format: formatPercent,
      isGoodIfHigh: true,
      description: `Risk-adjusted excess return relative to the ${benchmark} benchmark, after accounting for beta.`
    },
    {
      name: 'Sharpe Ratio',
      value: riskMetrics.sharpe_ratio,
      format: formatRatio,
      isGoodIfHigh: true,
      description: 'Ratio of excess returns to volatility, measuring risk-adjusted performance.'
    },
    {
      name: 'Sortino Ratio',
      value: riskMetrics.sortino_ratio,
      format: formatRatio,
      isGoodIfHigh: true,
      description: 'Similar to Sharpe ratio but only considers downside volatility, focusing on harmful volatility.'
    },
    {
      name: 'Max Drawdown',
      value: riskMetrics.max_drawdown,
      format: formatPercent,
      isGoodIfHigh: false,
      description: 'Largest peak-to-trough decline in portfolio value, measuring worst-case historical loss.'
    },
    {
      name: 'Value at Risk (95%)',
      value: riskMetrics.var_95,
      format: formatPercent,
      isGoodIfHigh: false,
      description: 'Maximum expected loss over a given time period at 95% confidence level.'
    },
    {
      name: 'Expected Shortfall',
      value: riskMetrics.expected_shortfall,
      format: formatPercent,
      isGoodIfHigh: false,
      description: 'Average loss in the worst 5% of scenarios, also known as Conditional Value at Risk (CVaR).'
    },
    {
      name: 'Tracking Error',
      value: riskMetrics.tracking_error,
      format: formatPercent,
      isGoodIfHigh: false,
      description: `Standard deviation of the difference between portfolio returns and ${benchmark} benchmark returns.`
    },
    {
      name: 'Information Ratio',
      value: riskMetrics.information_ratio,
      format: formatRatio,
      isGoodIfHigh: true,
      description: 'Ratio of excess returns to tracking error, measuring consistency of outperformance.'
    },
    {
      name: 'Treynor Ratio',
      value: riskMetrics.treynor_ratio,
      format: formatRatio,
      isGoodIfHigh: true,
      description: 'Ratio of excess returns to beta, measuring returns earned in excess of risk-free rate per unit of market risk.'
    },
    {
      name: 'Downside Deviation',
      value: riskMetrics.downside_deviation,
      format: formatPercent,
      isGoodIfHigh: false,
      description: 'Standard deviation of returns below a minimum acceptable return, focusing on downside risk.'
    }
  ];

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Risk Metrics
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {portfolioName} vs {benchmark}
      </Typography>
      <Typography variant="caption" color="text.secondary" gutterBottom>
        As of {new Date(riskMetrics.date).toLocaleDateString()}
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <TableContainer>
        <Table size="small">
          <TableBody>
            {riskMetricsInfo.map((metric) => (
              <TableRow key={metric.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row" sx={{ py: 1, pl: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {metric.name}
                    <Tooltip title={metric.description} arrow placement="right">
                      <IconButton size="small" sx={{ ml: 0.5 }}>
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell 
                  align="right" 
                  sx={{ 
                    py: 1, 
                    pr: 0, 
                    color: metric.isGoodIfHigh !== null ? getValueColor(metric.value, metric.isGoodIfHigh) : 'text.primary',
                    fontWeight: 'medium'
                  }}
                >
                  {metric.format(metric.value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          * Risk metrics are calculated based on historical data and may not predict future performance.
        </Typography>
      </Box>
    </Paper>
  );
};

export default RiskMetricsPanel;