import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
  Rating,
  Paper,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import BarChartIcon from '@mui/icons-material/BarChart';

import { 
  StrategyRecommendationService, 
  StrategyPreferences, 
  StrategyRecommendation,
  StrategyType,
  RiskTolerance,
  TimeHorizon
} from '../../services/strategy';

interface StrategyRecommendationPanelProps {
  onSelectStrategy?: (strategy: StrategyRecommendation) => void;
  onViewBacktest?: (strategy: StrategyRecommendation) => void;
  onViewExplanation?: (strategy: StrategyRecommendation) => void;
}

const StrategyRecommendationPanel: React.FC<StrategyRecommendationPanelProps> = ({
  onSelectStrategy,
  onViewBacktest,
  onViewExplanation
}) => {
  // State for user preferences
  const [preferences, setPreferences] = useState<StrategyPreferences>({
    riskTolerance: RiskTolerance.MODERATE,
    timeHorizon: TimeHorizon.MEDIUM_TERM,
    preferredAssetClasses: ['equities', 'etfs'],
    preferredStrategyTypes: undefined,
    excludedStrategyTypes: undefined,
    capitalAllocation: 100000,
    performanceMetricPriority: ['sharpe_ratio', 'total_return', 'max_drawdown']
  });

  // State for recommendations
  const [recommendations, setRecommendations] = useState<StrategyRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyRecommendation | null>(null);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const [favoriteStrategies, setFavoriteStrategies] = useState<string[]>([]);

  // Mock service for demo purposes
  const recommendationService = new StrategyRecommendationService(
    // @ts-ignore - These would be properly injected in a real app
    null, null, null
  );

  // Fetch recommendations when preferences change
  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await recommendationService.getRecommendations(preferences, 5);
      setRecommendations(results);
    } catch (err) {
      setError('Failed to fetch strategy recommendations. Please try again.');
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (field: keyof StrategyPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStrategyTypeToggle = (type: StrategyType) => {
    setPreferences(prev => {
      const current = prev.preferredStrategyTypes || [];
      const updated = current.includes(type)
        ? current.filter(t => t !== type)
        : [...current, type];
      
      return {
        ...prev,
        preferredStrategyTypes: updated.length > 0 ? updated : undefined
      };
    });
  };

  const handleAssetClassToggle = (assetClass: string) => {
    setPreferences(prev => {
      const updated = prev.preferredAssetClasses.includes(assetClass)
        ? prev.preferredAssetClasses.filter(ac => ac !== assetClass)
        : [...prev.preferredAssetClasses, assetClass];
      
      return {
        ...prev,
        preferredAssetClasses: updated
      };
    });
  };

  const handleViewDetails = (strategy: StrategyRecommendation) => {
    setSelectedStrategy(strategy);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
  };

  const handleToggleFavorite = (strategyId: string) => {
    setFavoriteStrategies(prev => 
      prev.includes(strategyId)
        ? prev.filter(id => id !== strategyId)
        : [...prev, strategyId]
    );
  };

  const getStrategyTypeIcon = (type: StrategyType) => {
    switch (type) {
      case StrategyType.MOMENTUM:
        return <TrendingUpIcon />;
      case StrategyType.MEAN_REVERSION:
        return <TimelineIcon />;
      case StrategyType.TREND_FOLLOWING:
        return <ShowChartIcon />;
      case StrategyType.BREAKOUT:
        return <BarChartIcon />;
      case StrategyType.STATISTICAL_ARBITRAGE:
        return <EqualizerIcon />;
      default:
        return <ShowChartIcon />;
    }
  };

  const renderPreferencesPanel = () => (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Strategy Preferences
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Risk Tolerance</InputLabel>
              <Select
                value={preferences.riskTolerance}
                onChange={(e) => handlePreferenceChange('riskTolerance', e.target.value)}
              >
                <MenuItem value={RiskTolerance.CONSERVATIVE}>Conservative</MenuItem>
                <MenuItem value={RiskTolerance.MODERATE}>Moderate</MenuItem>
                <MenuItem value={RiskTolerance.AGGRESSIVE}>Aggressive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Time Horizon</InputLabel>
              <Select
                value={preferences.timeHorizon}
                onChange={(e) => handlePreferenceChange('timeHorizon', e.target.value)}
              >
                <MenuItem value={TimeHorizon.SHORT_TERM}>Short Term (Days to Weeks)</MenuItem>
                <MenuItem value={TimeHorizon.MEDIUM_TERM}>Medium Term (Weeks to Months)</MenuItem>
                <MenuItem value={TimeHorizon.LONG_TERM}>Long Term (Months to Years)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Typography gutterBottom>Capital Allocation</Typography>
            <Slider
              value={preferences.capitalAllocation}
              min={10000}
              max={1000000}
              step={10000}
              marks={[
                { value: 10000, label: '$10K' },
                { value: 100000, label: '$100K' },
                { value: 500000, label: '$500K' },
                { value: 1000000, label: '$1M' }
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `$${value.toLocaleString()}`}
              onChange={(_, value) => handlePreferenceChange('capitalAllocation', value)}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography gutterBottom>Preferred Asset Classes</Typography>
            <FormGroup row>
              {['equities', 'etfs', 'options', 'futures', 'forex', 'crypto'].map(asset => (
                <FormControlLabel
                  key={asset}
                  control={
                    <Checkbox
                      checked={preferences.preferredAssetClasses.includes(asset)}
                      onChange={() => handleAssetClassToggle(asset)}
                    />
                  }
                  label={asset.charAt(0).toUpperCase() + asset.slice(1)}
                />
              ))}
            </FormGroup>
          </Grid>
          
          <Grid item xs={12}>
            <Typography gutterBottom>Strategy Types</Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {Object.values(StrategyType).map(type => (
                <Chip
                  key={type}
                  label={type.replace('_', ' ')}
                  icon={getStrategyTypeIcon(type)}
                  onClick={() => handleStrategyTypeToggle(type)}
                  color={preferences.preferredStrategyTypes?.includes(type) ? 'primary' : 'default'}
                  variant={preferences.preferredStrategyTypes?.includes(type) ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              onClick={fetchRecommendations}
              startIcon={<RefreshIcon />}
              disabled={loading}
            >
              {loading ? 'Generating Recommendations...' : 'Update Recommendations'}
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderRecommendationCard = (strategy: StrategyRecommendation) => {
    const isFavorite = favoriteStrategies.includes(strategy.id);
    
    return (
      <Card 
        key={strategy.id} 
        variant="outlined" 
        sx={{ 
          mb: 2, 
          position: 'relative',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 3
          }
        }}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6" component="div">
              {strategy.name}
            </Typography>
            <Box display="flex" alignItems="center">
              <Chip 
                size="small" 
                label={strategy.type.replace('_', ' ')}
                icon={getStrategyTypeIcon(strategy.type)}
                color="primary"
                variant="outlined"
                sx={{ mr: 1 }}
              />
              <IconButton 
                size="small" 
                onClick={() => handleToggleFavorite(strategy.id)}
                color={isFavorite ? 'secondary' : 'default'}
              >
                {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
            </Box>
          </Box>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {strategy.description.length > 120 
              ? `${strategy.description.substring(0, 120)}...` 
              : strategy.description}
          </Typography>
          
          <Box display="flex" alignItems="center" mt={2} mb={1}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
              Match Score:
            </Typography>
            <Rating 
              value={strategy.score / 20} 
              precision={0.5} 
              readOnly 
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({strategy.score}/100)
            </Typography>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Expected Return:
              </Typography>
              <Typography variant="body1">
                {(strategy.expectedPerformance.expectedReturn * 100).toFixed(1)}%
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Expected Risk:
              </Typography>
              <Typography variant="body1">
                {(strategy.expectedPerformance.expectedRisk * 100).toFixed(1)}%
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Sharpe Ratio:
              </Typography>
              <Typography variant="body1">
                {strategy.expectedPerformance.sharpeRatio.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Success Probability:
              </Typography>
              <Typography variant="body1">
                {(strategy.expectedPerformance.successProbability * 100).toFixed(0)}%
              </Typography>
            </Grid>
          </Grid>
          
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Match Reasons:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
              {strategy.matchReasons.map((reason, index) => (
                <Chip key={index} label={reason} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
          
          <Box display="flex" justifyContent="space-between" mt={2}>
            <Button 
              size="small" 
              onClick={() => handleViewDetails(strategy)}
              startIcon={<InfoIcon />}
            >
              Details
            </Button>
            <Box>
              <Button 
                size="small" 
                color="primary" 
                onClick={() => onViewBacktest && onViewBacktest(strategy)}
                sx={{ mr: 1 }}
              >
                Backtest
              </Button>
              <Button 
                size="small" 
                variant="contained" 
                color="primary"
                onClick={() => onSelectStrategy && onSelectStrategy(strategy)}
              >
                Select
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderStrategyDetails = () => {
    if (!selectedStrategy) return null;
    
    return (
      <Dialog 
        open={detailsOpen} 
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{selectedStrategy.name}</Typography>
            <Chip 
              label={selectedStrategy.type.replace('_', ' ')}
              icon={getStrategyTypeIcon(selectedStrategy.type)}
              color="primary"
            />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" paragraph>
            {selectedStrategy.description}
          </Typography>
          
          <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Expected Return
                </Typography>
                <Typography variant="h5">
                  {(selectedStrategy.expectedPerformance.expectedReturn * 100).toFixed(1)}%
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Expected Risk
                </Typography>
                <Typography variant="h5">
                  {(selectedStrategy.expectedPerformance.expectedRisk * 100).toFixed(1)}%
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Sharpe Ratio
                </Typography>
                <Typography variant="h5">
                  {selectedStrategy.expectedPerformance.sharpeRatio.toFixed(2)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Success Probability
                </Typography>
                <Typography variant="h5">
                  {(selectedStrategy.expectedPerformance.successProbability * 100).toFixed(0)}%
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Strategy Parameters</Typography>
          <Grid container spacing={2}>
            {Object.entries(selectedStrategy.parameters).map(([key, value]) => (
              <Grid item xs={12} md={6} key={key}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                  </Typography>
                  <Typography variant="body2">
                    {Array.isArray(value) ? value.join(', ') : value.toString()}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Suitable Market Conditions</Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {selectedStrategy.suitableMarketConditions.map((condition, index) => (
              <Chip key={index} label={condition} />
            ))}
          </Box>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Match Reasons</Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {selectedStrategy.matchReasons.map((reason, index) => (
              <Chip key={index} label={reason} variant="outlined" />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onViewExplanation && onViewExplanation(selectedStrategy)}>
            View Full Explanation
          </Button>
          <Button onClick={() => onViewBacktest && onViewBacktest(selectedStrategy)}>
            Run Backtest
          </Button>
          <Button onClick={handleCloseDetails}>
            Close
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              onSelectStrategy && onSelectStrategy(selectedStrategy);
              handleCloseDetails();
            }}
          >
            Select Strategy
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          {renderPreferencesPanel()}
        </Grid>
        <Grid item xs={12} md={8}>
          <Typography variant="h5" gutterBottom>
            Recommended Strategies
          </Typography>
          
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <CircularProgress />
            </Box>
          ) : error ? (
            <Paper sx={{ p: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
              <Typography>{error}</Typography>
              <Button 
                variant="contained" 
                sx={{ mt: 2 }} 
                onClick={fetchRecommendations}
              >
                Retry
              </Button>
            </Paper>
          ) : recommendations.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography>No recommendations found. Try adjusting your preferences.</Typography>
              <Button 
                variant="contained" 
                sx={{ mt: 2 }} 
                onClick={fetchRecommendations}
              >
                Generate Recommendations
              </Button>
            </Paper>
          ) : (
            recommendations.map(strategy => renderRecommendationCard(strategy))
          )}
        </Grid>
      </Grid>
      
      {renderStrategyDetails()}
    </Box>
  );
};

export default StrategyRecommendationPanel;