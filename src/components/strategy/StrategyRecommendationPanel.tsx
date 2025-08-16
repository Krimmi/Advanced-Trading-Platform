import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Chip,
  Divider,
  CircularProgress,
  Button,
  Rating,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  LinearProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { 
  TradingStrategy, 
  StrategyRecommendation,
  UserPreferences,
  StrategyType,
  Timeframe,
  RiskLevel,
  MarketCondition
} from '../../models/strategy/StrategyTypes';
import { StrategyRecommendationService } from '../../services/strategy/StrategyRecommendationService';

// Mock icons (replace with actual imports in a real implementation)
const ExpandMoreIcon = () => <Box>▼</Box>;
const InfoIcon = () => <Box>ℹ️</Box>;
const BacktestIcon = () => <Box>📊</Box>;
const OptimizeIcon = () => <Box>⚙️</Box>;
const BullishIcon = () => <Box sx={{ color: 'success.main' }}>▲</Box>;
const BearishIcon = () => <Box sx={{ color: 'error.main' }}>▼</Box>;
const NeutralIcon = () => <Box sx={{ color: 'text.secondary' }}>◆</Box>;

interface StrategyRecommendationPanelProps {
  apiKey: string;
  baseUrl?: string;
  ticker?: string;
  userPreferences?: UserPreferences;
  onStrategySelect?: (strategy: TradingStrategy) => void;
  onBacktestRequest?: (strategy: TradingStrategy, ticker: string) => void;
  onOptimizeRequest?: (strategy: TradingStrategy, ticker: string) => void;
}

const StrategyRecommendationPanel: React.FC<StrategyRecommendationPanelProps> = ({
  apiKey,
  baseUrl,
  ticker = '',
  userPreferences,
  onStrategySelect,
  onBacktestRequest,
  onOptimizeRequest
}) => {
  const theme = useTheme();
  const [currentTicker, setCurrentTicker] = useState<string>(ticker);
  const [recommendations, setRecommendations] = useState<StrategyRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<StrategyRecommendation | null>(null);
  const [recommendationService] = useState<StrategyRecommendationService>(
    new StrategyRecommendationService(apiKey, baseUrl)
  );
  
  // Default user preferences if not provided
  const [currentPreferences, setCurrentPreferences] = useState<UserPreferences>(
    userPreferences || {
      riskTolerance: RiskLevel.MODERATE,
      preferredTimeframes: [Timeframe.DAILY],
      preferredStrategyTypes: [],
      excludedStrategyTypes: [],
      preferredMarketConditions: [],
      maxComplexity: 70,
      minSharpeRatio: 1.0,
      maxDrawdown: -0.15,
      minWinRate: 0.5,
      customTags: []
    }
  );

  // Update ticker and preferences when props change
  useEffect(() => {
    if (ticker !== currentTicker) {
      setCurrentTicker(ticker);
    }
    
    if (userPreferences) {
      setCurrentPreferences(userPreferences);
    }
  }, [ticker, userPreferences]);

  // Generate recommendations when ticker or preferences change
  useEffect(() => {
    if (currentTicker) {
      generateRecommendations();
    }
  }, [currentTicker, currentPreferences]);

  // Generate strategy recommendations
  const generateRecommendations = async () => {
    if (!currentTicker) {
      setError('Please enter a ticker symbol');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await recommendationService.getRecommendations(
        currentPreferences,
        currentTicker,
        5
      );
      
      setRecommendations(result);
      
      // Select the first recommendation by default
      if (result.length > 0 && !selectedRecommendation) {
        setSelectedRecommendation(result[0]);
      }
    } catch (err) {
      console.error('Error generating strategy recommendations:', err);
      setError('Failed to generate strategy recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle recommendation selection
  const handleRecommendationSelect = (recommendation: StrategyRecommendation) => {
    setSelectedRecommendation(recommendation);
    
    if (onStrategySelect) {
      onStrategySelect(recommendation.strategy);
    }
  };

  // Handle backtest request
  const handleBacktestRequest = (recommendation: StrategyRecommendation) => {
    if (onBacktestRequest) {
      onBacktestRequest(recommendation.strategy, currentTicker);
    }
  };

  // Handle optimize request
  const handleOptimizeRequest = (recommendation: StrategyRecommendation) => {
    if (onOptimizeRequest) {
      onOptimizeRequest(recommendation.strategy, currentTicker);
    }
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Get strategy type label
  const getStrategyTypeLabel = (type: StrategyType): string => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Get risk level label
  const getRiskLevelLabel = (level: RiskLevel): string => {
    return level.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Get timeframe label
  const getTimeframeLabel = (timeframe: Timeframe): string => {
    return timeframe.charAt(0).toUpperCase() + timeframe.slice(1);
  };

  // Get color for impact
  const getImpactColor = (impact: number): string => {
    if (impact > 50) return theme.palette.success.main;
    if (impact < -50) return theme.palette.error.main;
    if (impact > 0) return theme.palette.success.light;
    if (impact < 0) return theme.palette.error.light;
    return theme.palette.text.secondary;
  };

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Strategy Recommendations for {currentTicker}
      </Typography>
      
      {loading && (
        <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            Analyzing market conditions and generating recommendations...
          </Typography>
        </Box>
      )}
      
      {error && (
        <Box sx={{ p: 2, bgcolor: theme.palette.error.light, borderRadius: 1, mt: 2, mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}
      
      {recommendations.length > 0 && (
        <Grid container spacing={2}>
          {/* Recommendation List */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" gutterBottom>
              Recommended Strategies
            </Typography>
            <List
              sx={{
                bgcolor: theme.palette.background.default,
                borderRadius: 1,
                maxHeight: 400,
                overflow: 'auto'
              }}
            >
              {recommendations.map((recommendation, index) => (
                <ListItem
                  key={recommendation.strategy.id}
                  button
                  selected={selectedRecommendation?.strategy.id === recommendation.strategy.id}
                  onClick={() => handleRecommendationSelect(recommendation)}
                  divider={index < recommendations.length - 1}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2">
                          {recommendation.strategy.name}
                        </Typography>
                        <Chip
                          label={`${recommendation.score.toFixed(0)}%`}
                          size="small"
                          color={recommendation.score >= 80 ? 'success' : recommendation.score >= 60 ? 'primary' : 'default'}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {getStrategyTypeLabel(recommendation.strategy.type)}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          <Chip
                            label={getRiskLevelLabel(recommendation.strategy.riskLevel)}
                            size="small"
                            variant="outlined"
                          />
                          {recommendation.strategy.timeframes.slice(0, 2).map((timeframe, i) => (
                            <Chip
                              key={i}
                              label={getTimeframeLabel(timeframe)}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Grid>
          
          {/* Selected Recommendation Details */}
          {selectedRecommendation && (
            <Grid item xs={12} md={8}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      {selectedRecommendation.strategy.name}
                    </Typography>
                    <Box>
                      <Tooltip title="Backtest Strategy">
                        <IconButton 
                          size="small" 
                          onClick={() => handleBacktestRequest(selectedRecommendation)}
                          sx={{ mr: 1 }}
                        >
                          <BacktestIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Optimize Strategy">
                        <IconButton 
                          size="small" 
                          onClick={() => handleOptimizeRequest(selectedRecommendation)}
                        >
                          <OptimizeIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  <Typography variant="body1" paragraph>
                    {selectedRecommendation.strategy.description}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Strategy Details
                      </Typography>
                      <TableContainer component={Box}>
                        <Table size="small">
                          <TableBody>
                            <TableRow>
                              <TableCell component="th" scope="row">Type</TableCell>
                              <TableCell>{getStrategyTypeLabel(selectedRecommendation.strategy.type)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell component="th" scope="row">Risk Level</TableCell>
                              <TableCell>{getRiskLevelLabel(selectedRecommendation.strategy.riskLevel)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell component="th" scope="row">Timeframes</TableCell>
                              <TableCell>
                                {selectedRecommendation.strategy.timeframes.map(tf => getTimeframeLabel(tf)).join(', ')}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell component="th" scope="row">Complexity</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Box sx={{ width: 100, mr: 1 }}>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={selectedRecommendation.strategy.complexity} 
                                      color={selectedRecommendation.strategy.complexity > 70 ? "error" : "primary"}
                                    />
                                  </Box>
                                  <Typography variant="body2" color="text.secondary">
                                    {selectedRecommendation.strategy.complexity}/100
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell component="th" scope="row">Popularity</TableCell>
                              <TableCell>
                                <Rating 
                                  value={selectedRecommendation.strategy.popularity / 20} 
                                  readOnly 
                                  precision={0.5} 
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Expected Performance
                      </Typography>
                      <TableContainer component={Box}>
                        <Table size="small">
                          <TableBody>
                            <TableRow>
                              <TableCell component="th" scope="row">Est. Return</TableCell>
                              <TableCell sx={{ color: theme.palette.success.main }}>
                                {formatPercentage(selectedRecommendation.expectedPerformance.estimatedReturn)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell component="th" scope="row">Est. Risk</TableCell>
                              <TableCell>
                                {formatPercentage(selectedRecommendation.expectedPerformance.estimatedRisk)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell component="th" scope="row">Confidence</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Box sx={{ width: 100, mr: 1 }}>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={selectedRecommendation.expectedPerformance.confidenceLevel} 
                                      color={selectedRecommendation.expectedPerformance.confidenceLevel > 70 ? "success" : "primary"}
                                    />
                                  </Box>
                                  <Typography variant="body2" color="text.secondary">
                                    {selectedRecommendation.expectedPerformance.confidenceLevel.toFixed(0)}%
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell component="th" scope="row">Sharpe Ratio</TableCell>
                              <TableCell>
                                {selectedRecommendation.strategy.performanceMetrics.sharpeRatio.toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell component="th" scope="row">Max Drawdown</TableCell>
                              <TableCell sx={{ color: theme.palette.error.main }}>
                                {formatPercentage(selectedRecommendation.strategy.performanceMetrics.maxDrawdown)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                  </Grid>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  {/* Match Reasons */}
                  <Typography variant="subtitle2" gutterBottom>
                    Why This Strategy Matches Your Preferences
                  </Typography>
                  <List dense>
                    {selectedRecommendation.matchReasons.map((reason, index) => (
                      <ListItem key={index} disableGutters>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {reason.impact > 0 ? <BullishIcon /> : reason.impact < 0 ? <BearishIcon /> : <NeutralIcon />}
                        </ListItemIcon>
                        <ListItemText 
                          primary={reason.reason}
                          primaryTypographyProps={{ 
                            variant: 'body2',
                            color: getImpactColor(reason.impact)
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  {/* Suitable Tickers */}
                  {selectedRecommendation.suitableTickers && selectedRecommendation.suitableTickers.length > 0 && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Suitability for {currentTicker}
                      </Typography>
                      {selectedRecommendation.suitableTickers.map((tickerInfo, index) => (
                        <Box key={index} sx={{ mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ mr: 1 }}>
                              Suitability Score:
                            </Typography>
                            <Box sx={{ width: 100, mr: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={tickerInfo.suitabilityScore} 
                                color={tickerInfo.suitabilityScore > 70 ? "success" : "primary"}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {tickerInfo.suitabilityScore.toFixed(0)}%
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {tickerInfo.reason}
                          </Typography>
                        </Box>
                      ))}
                    </>
                  )}
                  
                  {/* Backtest Summary */}
                  {selectedRecommendation.backtestSummary && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Backtest Summary
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Best Performance
                          </Typography>
                          <Box sx={{ pl: 2 }}>
                            <Typography variant="body2">
                              Ticker: {selectedRecommendation.backtestSummary.bestPerformance.ticker}
                            </Typography>
                            <Typography variant="body2">
                              Period: {new Date(selectedRecommendation.backtestSummary.bestPerformance.period.start).toLocaleDateString()} - {new Date(selectedRecommendation.backtestSummary.bestPerformance.period.end).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2" sx={{ color: theme.palette.success.main }}>
                              Return: {formatPercentage(selectedRecommendation.backtestSummary.bestPerformance.return)}
                            </Typography>
                            <Typography variant="body2">
                              Sharpe: {selectedRecommendation.backtestSummary.bestPerformance.sharpeRatio.toFixed(2)}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Average Performance
                          </Typography>
                          <Box sx={{ pl: 2 }}>
                            <Typography variant="body2">
                              Return: {formatPercentage(selectedRecommendation.backtestSummary.averagePerformance.return)}
                            </Typography>
                            <Typography variant="body2">
                              Sharpe: {selectedRecommendation.backtestSummary.averagePerformance.sharpeRatio.toFixed(2)}
                            </Typography>
                            <Typography variant="body2">
                              Win Rate: {formatPercentage(selectedRecommendation.backtestSummary.averagePerformance.winRate)}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </>
                  )}
                  
                  {/* Parameters */}
                  <Divider sx={{ my: 2 }} />
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2">Strategy Parameters</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Parameter</TableCell>
                              <TableCell>Value</TableCell>
                              <TableCell>Description</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedRecommendation.strategy.parameters.map((param) => (
                              <TableRow key={param.id}>
                                <TableCell>{param.name}</TableCell>
                                <TableCell>
                                  {selectedRecommendation.customizedParameters[param.id] !== undefined ? 
                                    selectedRecommendation.customizedParameters[param.id] : 
                                    param.defaultValue}
                                </TableCell>
                                <TableCell>{param.description}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                  
                  {/* Performance Metrics */}
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2">Performance Metrics</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TableContainer>
                            <Table size="small">
                              <TableBody>
                                <TableRow>
                                  <TableCell component="th" scope="row">Sharpe Ratio</TableCell>
                                  <TableCell>{selectedRecommendation.strategy.performanceMetrics.sharpeRatio.toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell component="th" scope="row">Sortino Ratio</TableCell>
                                  <TableCell>{selectedRecommendation.strategy.performanceMetrics.sortino.toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell component="th" scope="row">Max Drawdown</TableCell>
                                  <TableCell>{formatPercentage(selectedRecommendation.strategy.performanceMetrics.maxDrawdown)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell component="th" scope="row">Annualized Return</TableCell>
                                  <TableCell>{formatPercentage(selectedRecommendation.strategy.performanceMetrics.annualizedReturn)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell component="th" scope="row">Win Rate</TableCell>
                                  <TableCell>{formatPercentage(selectedRecommendation.strategy.performanceMetrics.winRate)}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TableContainer>
                            <Table size="small">
                              <TableBody>
                                <TableRow>
                                  <TableCell component="th" scope="row">Profit Factor</TableCell>
                                  <TableCell>{selectedRecommendation.strategy.performanceMetrics.profitFactor.toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell component="th" scope="row">Volatility</TableCell>
                                  <TableCell>{formatPercentage(selectedRecommendation.strategy.performanceMetrics.volatility)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell component="th" scope="row">Beta</TableCell>
                                  <TableCell>{selectedRecommendation.strategy.performanceMetrics.beta.toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell component="th" scope="row">Alpha</TableCell>
                                  <TableCell>{formatPercentage(selectedRecommendation.strategy.performanceMetrics.alpha)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell component="th" scope="row">Calmar Ratio</TableCell>
                                  <TableCell>{selectedRecommendation.strategy.performanceMetrics.calmarRatio.toFixed(2)}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
      
      {!loading && recommendations.length === 0 && !error && (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Enter a ticker symbol to get strategy recommendations.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default StrategyRecommendationPanel;