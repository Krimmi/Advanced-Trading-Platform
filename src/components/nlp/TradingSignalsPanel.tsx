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
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
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
  Checkbox,
  FormGroup,
  FormControlLabel
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { TradingSignalsService, TradingSignal } from '../../services/nlp/TradingSignalsService';

// Mock icons (replace with actual imports in a real implementation)
const ExpandMoreIcon = () => <Box>▼</Box>;
const InfoIcon = () => <Box>ℹ️</Box>;
const BullishIcon = () => <Box sx={{ color: 'success.main' }}>▲</Box>;
const BearishIcon = () => <Box sx={{ color: 'error.main' }}>▼</Box>;
const NeutralIcon = () => <Box sx={{ color: 'text.secondary' }}>◆</Box>;

interface TradingSignalsPanelProps {
  apiKey: string;
  baseUrl?: string;
  ticker?: string;
  onSignalClick?: (signal: TradingSignal) => void;
}

const TradingSignalsPanel: React.FC<TradingSignalsPanelProps> = ({
  apiKey,
  baseUrl,
  ticker = '',
  onSignalClick
}) => {
  const theme = useTheme();
  const [currentTicker, setCurrentTicker] = useState<string>(ticker);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [signalsService] = useState<TradingSignalsService>(
    new TradingSignalsService(apiKey, baseUrl)
  );
  
  // Source filters
  const [selectedSources, setSelectedSources] = useState<{
    news: boolean;
    social_media: boolean;
    earnings_call: boolean;
    sec_filing: boolean;
  }>({
    news: true,
    social_media: true,
    earnings_call: true,
    sec_filing: true
  });

  // Signal type filters
  const [selectedTypes, setSelectedTypes] = useState<{
    sentiment: boolean;
    entity: boolean;
    topic: boolean;
    event: boolean;
    anomaly: boolean;
  }>({
    sentiment: true,
    entity: true,
    topic: true,
    event: true,
    anomaly: true
  });

  // Direction filters
  const [selectedDirections, setSelectedDirections] = useState<{
    bullish: boolean;
    bearish: boolean;
    neutral: boolean;
  }>({
    bullish: true,
    bearish: true,
    neutral: true
  });

  // Process ticker when component mounts or when ticker changes
  useEffect(() => {
    if (ticker && ticker !== currentTicker) {
      setCurrentTicker(ticker);
      generateSignals(ticker);
    }
  }, [ticker]);

  // Generate trading signals using the signals service
  const generateSignals = async (tickerSymbol: string) => {
    if (!tickerSymbol.trim()) {
      setError('Please enter a valid ticker symbol');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get selected sources as an array
      const sources = Object.entries(selectedSources)
        .filter(([_, selected]) => selected)
        .map(([source]) => source as 'news' | 'social_media' | 'earnings_call' | 'sec_filing');
      
      if (sources.length === 0) {
        setError('Please select at least one source');
        setLoading(false);
        return;
      }

      const tradingSignals = await signalsService.generateTradingSignals(tickerSymbol, sources);
      setSignals(tradingSignals);
    } catch (err) {
      console.error('Error generating trading signals:', err);
      setError('Failed to generate trading signals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle ticker change
  const handleTickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTicker(e.target.value.toUpperCase());
  };

  // Handle generate button click
  const handleGenerateClick = () => {
    generateSignals(currentTicker);
  };

  // Handle source filter change
  const handleSourceChange = (source: keyof typeof selectedSources) => {
    setSelectedSources({
      ...selectedSources,
      [source]: !selectedSources[source]
    });
  };

  // Handle type filter change
  const handleTypeChange = (type: keyof typeof selectedTypes) => {
    setSelectedTypes({
      ...selectedTypes,
      [type]: !selectedTypes[type]
    });
  };

  // Handle direction filter change
  const handleDirectionChange = (direction: keyof typeof selectedDirections) => {
    setSelectedDirections({
      ...selectedDirections,
      [direction]: !selectedDirections[direction]
    });
  };

  // Filter signals based on selected filters
  const filteredSignals = signals.filter(signal => 
    // Filter by source
    (selectedSources.news && signal.source === 'news') ||
    (selectedSources.social_media && signal.source === 'social_media') ||
    (selectedSources.earnings_call && signal.source === 'earnings_call') ||
    (selectedSources.sec_filing && signal.source === 'sec_filing') ||
    (signal.source === 'aggregate_sentiment' || signal.source === 'entity_sentiment' || 
     signal.source === 'topic_analysis' || signal.source === 'event_detection') &&
    
    // Filter by type
    (selectedTypes.sentiment && signal.signalType === 'sentiment') ||
    (selectedTypes.entity && signal.signalType === 'entity') ||
    (selectedTypes.topic && signal.signalType === 'topic') ||
    (selectedTypes.event && signal.signalType === 'event') ||
    (selectedTypes.anomaly && signal.signalType === 'anomaly') &&
    
    // Filter by direction
    (selectedDirections.bullish && signal.direction === 'bullish') ||
    (selectedDirections.bearish && signal.direction === 'bearish') ||
    (selectedDirections.neutral && signal.direction === 'neutral')
  );

  // Get signal direction icon
  const getDirectionIcon = (direction: 'bullish' | 'bearish' | 'neutral') => {
    switch (direction) {
      case 'bullish':
        return <BullishIcon />;
      case 'bearish':
        return <BearishIcon />;
      case 'neutral':
        return <NeutralIcon />;
    }
  };

  // Get signal type label
  const getSignalTypeLabel = (type: string): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Get signal source label
  const getSourceLabel = (source: string): string => {
    switch (source) {
      case 'news':
        return 'News';
      case 'social_media':
        return 'Social Media';
      case 'earnings_call':
        return 'Earnings Call';
      case 'sec_filing':
        return 'SEC Filing';
      case 'aggregate_sentiment':
        return 'Aggregate Sentiment';
      case 'entity_sentiment':
        return 'Entity Sentiment';
      case 'topic_analysis':
        return 'Topic Analysis';
      case 'event_detection':
        return 'Event Detection';
      default:
        return source.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  };

  // Get signal strength color
  const getStrengthColor = (strength: number): string => {
    if (strength > 0.7) return theme.palette.success.main;
    if (strength > 0.4) return theme.palette.warning.main;
    return theme.palette.text.secondary;
  };

  // Get signal confidence color
  const getConfidenceColor = (confidence: number): string => {
    if (confidence > 0.7) return theme.palette.success.main;
    if (confidence > 0.4) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString();
  };

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        NLP Trading Signals
      </Typography>
      
      <Grid container spacing={2}>
        {/* Input Section */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Ticker Symbol"
                    value={currentTicker}
                    onChange={handleTickerChange}
                    fullWidth
                    variant="outlined"
                    placeholder="e.g., AAPL"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleGenerateClick}
                    disabled={loading || !currentTicker.trim()}
                    fullWidth
                    sx={{ height: '100%' }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate Signals'}
                  </Button>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedSources.news}
                          onChange={() => handleSourceChange('news')}
                          size="small"
                        />
                      }
                      label="News"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedSources.social_media}
                          onChange={() => handleSourceChange('social_media')}
                          size="small"
                        />
                      }
                      label="Social Media"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedSources.earnings_call}
                          onChange={() => handleSourceChange('earnings_call')}
                          size="small"
                        />
                      }
                      label="Earnings Call"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedSources.sec_filing}
                          onChange={() => handleSourceChange('sec_filing')}
                          size="small"
                        />
                      }
                      label="SEC Filing"
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Error Message */}
        {error && (
          <Grid item xs={12}>
            <Box sx={{ p: 2, bgcolor: theme.palette.error.light, borderRadius: 1 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          </Grid>
        )}
        
        {/* Filters */}
        {signals.length > 0 && (
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Filters
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Signal Type
                    </Typography>
                    <FormGroup row>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedTypes.sentiment}
                            onChange={() => handleTypeChange('sentiment')}
                            size="small"
                          />
                        }
                        label="Sentiment"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedTypes.entity}
                            onChange={() => handleTypeChange('entity')}
                            size="small"
                          />
                        }
                        label="Entity"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedTypes.topic}
                            onChange={() => handleTypeChange('topic')}
                            size="small"
                          />
                        }
                        label="Topic"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedTypes.event}
                            onChange={() => handleTypeChange('event')}
                            size="small"
                          />
                        }
                        label="Event"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedTypes.anomaly}
                            onChange={() => handleTypeChange('anomaly')}
                            size="small"
                          />
                        }
                        label="Anomaly"
                      />
                    </FormGroup>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Direction
                    </Typography>
                    <FormGroup row>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedDirections.bullish}
                            onChange={() => handleDirectionChange('bullish')}
                            size="small"
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <BullishIcon />
                            <Box component="span" sx={{ ml: 0.5 }}>Bullish</Box>
                          </Box>
                        }
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedDirections.bearish}
                            onChange={() => handleDirectionChange('bearish')}
                            size="small"
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <BearishIcon />
                            <Box component="span" sx={{ ml: 0.5 }}>Bearish</Box>
                          </Box>
                        }
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedDirections.neutral}
                            onChange={() => handleDirectionChange('neutral')}
                            size="small"
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <NeutralIcon />
                            <Box component="span" sx={{ ml: 0.5 }}>Neutral</Box>
                          </Box>
                        }
                      />
                    </FormGroup>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Summary
                    </Typography>
                    <Box>
                      <Typography variant="body2">
                        Showing {filteredSignals.length} of {signals.length} signals
                      </Typography>
                      <Typography variant="body2">
                        Bullish: {signals.filter(s => s.direction === 'bullish').length}
                        {' | '}
                        Bearish: {signals.filter(s => s.direction === 'bearish').length}
                        {' | '}
                        Neutral: {signals.filter(s => s.direction === 'neutral').length}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
        
        {/* Results Section */}
        {signals.length > 0 ? (
          <Grid item xs={12}>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Direction</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Strength</TableCell>
                    <TableCell>Confidence</TableCell>
                    <TableCell>Timeframe</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSignals.map((signal, index) => (
                    <TableRow 
                      key={index}
                      hover
                      onClick={() => onSignalClick && onSignalClick(signal)}
                      sx={{ cursor: onSignalClick ? 'pointer' : 'default' }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getDirectionIcon(signal.direction)}
                          <Box component="span" sx={{ ml: 0.5 }}>
                            {signal.direction.charAt(0).toUpperCase() + signal.direction.slice(1)}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{getSignalTypeLabel(signal.signalType)}</TableCell>
                      <TableCell>{getSourceLabel(signal.source)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 50,
                              height: 6,
                              bgcolor: theme.palette.grey[300],
                              borderRadius: 3,
                              mr: 1
                            }}
                          >
                            <Box
                              sx={{
                                width: `${signal.strength.value * 100}%`,
                                height: '100%',
                                bgcolor: getStrengthColor(signal.strength.value),
                                borderRadius: 3
                              }}
                            />
                          </Box>
                          <Typography variant="body2" sx={{ color: getStrengthColor(signal.strength.value) }}>
                            {(signal.strength.value * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 50,
                              height: 6,
                              bgcolor: theme.palette.grey[300],
                              borderRadius: 3,
                              mr: 1
                            }}
                          >
                            <Box
                              sx={{
                                width: `${signal.confidence.value * 100}%`,
                                height: '100%',
                                bgcolor: getConfidenceColor(signal.confidence.value),
                                borderRadius: 3
                              }}
                            />
                          </Box>
                          <Typography variant="body2" sx={{ color: getConfidenceColor(signal.confidence.value) }}>
                            {(signal.confidence.value * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {signal.timeframe.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </TableCell>
                      <TableCell>{formatDate(signal.timestamp)}</TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        ) : !loading && (
          <Grid item xs={12}>
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No signals generated yet. Enter a ticker symbol and click "Generate Signals".
              </Typography>
            </Box>
          </Grid>
        )}
        
        {/* Signal Details */}
        {filteredSignals.length > 0 && (
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Signal Details</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {filteredSignals.map((signal, index) => (
                    <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle2">
                            {getDirectionIcon(signal.direction)}{' '}
                            {signal.direction.charAt(0).toUpperCase() + signal.direction.slice(1)}{' '}
                            {getSignalTypeLabel(signal.signalType)} Signal
                          </Typography>
                          <Chip
                            label={getSourceLabel(signal.source)}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                        <Typography variant="body2" gutterBottom>
                          {signal.explanation}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Strength: {(signal.strength.value * 100).toFixed(0)}%
                            </Typography>
                            <List dense disablePadding>
                              {signal.strength.factors.map((factor, i) => (
                                <ListItem key={i} disablePadding>
                                  <ListItemText
                                    primary={`${factor.factor}: ${(factor.contribution * 100).toFixed(0)}%`}
                                    primaryTypographyProps={{ variant: 'caption' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Confidence: {(signal.confidence.value * 100).toFixed(0)}%
                            </Typography>
                            <List dense disablePadding>
                              {signal.confidence.factors.map((factor, i) => (
                                <ListItem key={i} disablePadding>
                                  <ListItemText
                                    primary={`${factor.factor}: ${(factor.contribution * 100).toFixed(0)}%`}
                                    primaryTypographyProps={{ variant: 'caption' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Grid>
                        </Grid>
                        {signal.supportingEvidence && signal.supportingEvidence.length > 0 && (
                          <>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Supporting Evidence:
                            </Typography>
                            <List dense disablePadding>
                              {signal.supportingEvidence.slice(0, 3).map((evidence, i) => (
                                <ListItem key={i} disablePadding>
                                  <ListItemText
                                    primary={evidence.text}
                                    secondary={`${evidence.source} - ${new Date(evidence.date).toLocaleDateString()}`}
                                    primaryTypographyProps={{ variant: 'caption' }}
                                    secondaryTypographyProps={{ variant: 'caption' }}
                                  />
                                </ListItem>
                              ))}
                              {signal.supportingEvidence.length > 3 && (
                                <ListItem disablePadding>
                                  <ListItemText
                                    primary={`+${signal.supportingEvidence.length - 3} more evidence points`}
                                    primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                                  />
                                </ListItem>
                              )}
                            </List>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default TradingSignalsPanel;