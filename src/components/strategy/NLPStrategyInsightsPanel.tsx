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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Alert,
  LinearProgress,
  Tab,
  Tabs
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import EventIcon from '@mui/icons-material/Event';
import TopicIcon from '@mui/icons-material/Topic';
import { StrategyRecommendationService } from '../../services/strategy/StrategyRecommendationService';
import { StrategyType } from '../../models/strategy/StrategyTypes';
import { HeatmapVisualizationComponent } from '../visualization';

interface NLPStrategyInsightsPanelProps {
  apiKey: string;
  baseUrl?: string;
  ticker: string;
  onStrategyTypeSelect?: (strategyType: StrategyType) => void;
}

interface SentimentSignal {
  source: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  strength: number;
  confidence: number;
  timestamp: Date;
  explanation: string;
  supportingEvidence: {
    text: string;
    source: string;
    url?: string;
    date: Date;
  }[];
}

interface TopicSignal {
  source: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  strength: number;
  confidence: number;
  timestamp: Date;
  explanation: string;
  topic: string;
  keywords: string[];
  supportingEvidence: {
    text: string;
    source: string;
    url?: string;
    date: Date;
  }[];
}

interface EventSignal {
  source: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  strength: number;
  confidence: number;
  timestamp: Date;
  explanation: string;
  eventType: string;
  eventDate: Date;
  supportingEvidence: {
    text: string;
    source: string;
    url?: string;
    date: Date;
  }[];
}

interface NLPInsights {
  sentimentSignals: SentimentSignal[];
  topicSignals: TopicSignal[];
  eventSignals: EventSignal[];
  recommendedStrategyTypes: StrategyType[];
  explanation: string;
}

const NLPStrategyInsightsPanel: React.FC<NLPStrategyInsightsPanelProps> = ({
  apiKey,
  baseUrl,
  ticker,
  onStrategyTypeSelect
}) => {
  const theme = useTheme();
  const [insights, setInsights] = useState<NLPInsights | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendationService] = useState<StrategyRecommendationService>(
    new StrategyRecommendationService(apiKey, baseUrl)
  );
  const [currentTab, setCurrentTab] = useState<number>(0);
  const [sentimentCorrelationData, setSentimentCorrelationData] = useState<number[][]>([]);
  const [sentimentCorrelationLabels, setSentimentCorrelationLabels] = useState<string[]>([]);

  // Fetch NLP insights when ticker changes
  useEffect(() => {
    if (ticker) {
      fetchNLPInsights();
    }
  }, [ticker]);

  // Fetch NLP insights from the service
  const fetchNLPInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await recommendationService.getNLPStrategyInsights(ticker);
      setInsights(result as unknown as NLPInsights);
      
      // Generate correlation data for visualization
      generateSentimentCorrelationData(result.sentimentSignals);
    } catch (err) {
      console.error('Error fetching NLP strategy insights:', err);
      setError('Failed to fetch NLP strategy insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate correlation data for visualization
  const generateSentimentCorrelationData = (sentimentSignals: any[]) => {
    if (!sentimentSignals || sentimentSignals.length === 0) return;

    // Extract unique sources
    const sources = Array.from(new Set(sentimentSignals.map(signal => signal.source)));
    
    // Create correlation matrix
    const correlationMatrix: number[][] = [];
    const labels: string[] = [];
    
    sources.forEach((source, i) => {
      labels.push(source);
      correlationMatrix.push(Array(sources.length).fill(0));
      
      // Set diagonal to 1 (self-correlation)
      correlationMatrix[i][i] = 1;
      
      // Calculate correlation with other sources
      for (let j = i + 1; j < sources.length; j++) {
        const sourceSignals = sentimentSignals.filter(s => s.source === source);
        const otherSourceSignals = sentimentSignals.filter(s => s.source === sources[j]);
        
        // Simple correlation based on direction agreement
        let agreement = 0;
        let total = 0;
        
        sourceSignals.forEach(s1 => {
          otherSourceSignals.forEach(s2 => {
            // Check if timestamps are close (within 24 hours)
            const timeDiff = Math.abs(new Date(s1.timestamp).getTime() - new Date(s2.timestamp).getTime());
            if (timeDiff <= 24 * 60 * 60 * 1000) {
              total++;
              if (s1.direction === s2.direction) {
                agreement++;
              } else if (s1.direction !== 'neutral' && s2.direction !== 'neutral' && s1.direction !== s2.direction) {
                agreement--; // Penalize opposite directions
              }
            }
          });
        });
        
        const correlation = total > 0 ? agreement / total : 0;
        correlationMatrix[i][j] = correlation;
        correlationMatrix[j][i] = correlation; // Symmetric matrix
      }
    });
    
    setSentimentCorrelationData(correlationMatrix);
    setSentimentCorrelationLabels(labels);
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Handle strategy type selection
  const handleStrategyTypeClick = (strategyType: StrategyType) => {
    if (onStrategyTypeSelect) {
      onStrategyTypeSelect(strategyType);
    }
  };

  // Get icon for sentiment direction
  const getSentimentIcon = (direction: 'bullish' | 'bearish' | 'neutral') => {
    switch (direction) {
      case 'bullish':
        return <TrendingUpIcon sx={{ color: theme.palette.success.main }} />;
      case 'bearish':
        return <TrendingDownIcon sx={{ color: theme.palette.error.main }} />;
      case 'neutral':
        return <TrendingFlatIcon sx={{ color: theme.palette.text.secondary }} />;
      default:
        return <TrendingFlatIcon />;
    }
  };

  // Get color for sentiment direction
  const getSentimentColor = (direction: 'bullish' | 'bearish' | 'neutral') => {
    switch (direction) {
      case 'bullish':
        return theme.palette.success.main;
      case 'bearish':
        return theme.palette.error.main;
      case 'neutral':
        return theme.palette.text.secondary;
      default:
        return theme.palette.text.primary;
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get strategy type label
  const getStrategyTypeLabel = (type: StrategyType): string => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        NLP Strategy Insights for {ticker}
      </Typography>
      
      {loading && (
        <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            Analyzing news, social media, and market sentiment...
          </Typography>
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {insights && (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Recommended Strategy Types
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {insights.recommendedStrategyTypes.map((strategyType) => (
                <Chip
                  key={strategyType}
                  label={getStrategyTypeLabel(strategyType)}
                  color="primary"
                  variant="outlined"
                  onClick={() => handleStrategyTypeClick(strategyType)}
                  sx={{ mb: 1 }}
                />
              ))}
            </Box>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {insights.explanation}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ width: '100%' }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Sentiment" />
              <Tab label="Topics" />
              <Tab label="Events" />
              <Tab label="Correlations" />
            </Tabs>
          </Box>
          
          <Box sx={{ mt: 2 }}>
            {/* Sentiment Tab */}
            {currentTab === 0 && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Sentiment Analysis
                </Typography>
                {insights.sentimentSignals.length > 0 ? (
                  <List>
                    {insights.sentimentSignals.map((signal, index) => (
                      <ListItem
                        key={index}
                        alignItems="flex-start"
                        divider={index < insights.sentimentSignals.length - 1}
                      >
                        <ListItemIcon>
                          {getSentimentIcon(signal.direction)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle2" sx={{ color: getSentimentColor(signal.direction) }}>
                                {signal.direction.charAt(0).toUpperCase() + signal.direction.slice(1)} Sentiment
                              </Typography>
                              <Chip
                                size="small"
                                label={`${(signal.strength * 100).toFixed(0)}% Strength`}
                                color={signal.direction === 'bullish' ? 'success' : signal.direction === 'bearish' ? 'error' : 'default'}
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" color="text.primary">
                                {signal.explanation}
                              </Typography>
                              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                Source: {signal.source} | {formatDate(signal.timestamp)} | Confidence: {(signal.confidence * 100).toFixed(0)}%
                              </Typography>
                              {signal.supportingEvidence.length > 0 && (
                                <Accordion sx={{ mt: 1 }} elevation={0}>
                                  <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{ p: 0 }}
                                  >
                                    <Typography variant="caption">Supporting Evidence</Typography>
                                  </AccordionSummary>
                                  <AccordionDetails sx={{ p: 0 }}>
                                    <List dense disablePadding>
                                      {signal.supportingEvidence.map((evidence, i) => (
                                        <ListItem key={i} sx={{ pl: 0 }}>
                                          <ListItemText
                                            primary={evidence.text}
                                            secondary={`${evidence.source} | ${formatDate(evidence.date)}`}
                                            primaryTypographyProps={{ variant: 'caption' }}
                                            secondaryTypographyProps={{ variant: 'caption' }}
                                          />
                                        </ListItem>
                                      ))}
                                    </List>
                                  </AccordionDetails>
                                </Accordion>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No sentiment signals available for this ticker.
                  </Typography>
                )}
              </>
            )}
            
            {/* Topics Tab */}
            {currentTab === 1 && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Topic Analysis
                </Typography>
                {insights.topicSignals.length > 0 ? (
                  <List>
                    {insights.topicSignals.map((signal, index) => (
                      <ListItem
                        key={index}
                        alignItems="flex-start"
                        divider={index < insights.topicSignals.length - 1}
                      >
                        <ListItemIcon>
                          <TopicIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle2">
                                {signal.topic}
                              </Typography>
                              <Chip
                                size="small"
                                label={signal.direction}
                                color={signal.direction === 'bullish' ? 'success' : signal.direction === 'bearish' ? 'error' : 'default'}
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" color="text.primary">
                                {signal.explanation}
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                {signal.keywords.map((keyword, i) => (
                                  <Chip key={i} label={keyword} size="small" variant="outlined" />
                                ))}
                              </Box>
                              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                Source: {signal.source} | {formatDate(signal.timestamp)} | Confidence: {(signal.confidence * 100).toFixed(0)}%
                              </Typography>
                              {signal.supportingEvidence.length > 0 && (
                                <Accordion sx={{ mt: 1 }} elevation={0}>
                                  <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{ p: 0 }}
                                  >
                                    <Typography variant="caption">Supporting Evidence</Typography>
                                  </AccordionSummary>
                                  <AccordionDetails sx={{ p: 0 }}>
                                    <List dense disablePadding>
                                      {signal.supportingEvidence.map((evidence, i) => (
                                        <ListItem key={i} sx={{ pl: 0 }}>
                                          <ListItemText
                                            primary={evidence.text}
                                            secondary={`${evidence.source} | ${formatDate(evidence.date)}`}
                                            primaryTypographyProps={{ variant: 'caption' }}
                                            secondaryTypographyProps={{ variant: 'caption' }}
                                          />
                                        </ListItem>
                                      ))}
                                    </List>
                                  </AccordionDetails>
                                </Accordion>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No topic signals available for this ticker.
                  </Typography>
                )}
              </>
            )}
            
            {/* Events Tab */}
            {currentTab === 2 && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Event Analysis
                </Typography>
                {insights.eventSignals.length > 0 ? (
                  <List>
                    {insights.eventSignals.map((signal, index) => (
                      <ListItem
                        key={index}
                        alignItems="flex-start"
                        divider={index < insights.eventSignals.length - 1}
                      >
                        <ListItemIcon>
                          <EventIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle2">
                                {signal.eventType}
                              </Typography>
                              <Chip
                                size="small"
                                label={signal.direction}
                                color={signal.direction === 'bullish' ? 'success' : signal.direction === 'bearish' ? 'error' : 'default'}
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" color="text.primary">
                                {signal.explanation}
                              </Typography>
                              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                Event Date: {formatDate(signal.eventDate)} | Source: {signal.source} | Confidence: {(signal.confidence * 100).toFixed(0)}%
                              </Typography>
                              {signal.supportingEvidence.length > 0 && (
                                <Accordion sx={{ mt: 1 }} elevation={0}>
                                  <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{ p: 0 }}
                                  >
                                    <Typography variant="caption">Supporting Evidence</Typography>
                                  </AccordionSummary>
                                  <AccordionDetails sx={{ p: 0 }}>
                                    <List dense disablePadding>
                                      {signal.supportingEvidence.map((evidence, i) => (
                                        <ListItem key={i} sx={{ pl: 0 }}>
                                          <ListItemText
                                            primary={evidence.text}
                                            secondary={`${evidence.source} | ${formatDate(evidence.date)}`}
                                            primaryTypographyProps={{ variant: 'caption' }}
                                            secondaryTypographyProps={{ variant: 'caption' }}
                                          />
                                        </ListItem>
                                      ))}
                                    </List>
                                  </AccordionDetails>
                                </Accordion>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No event signals available for this ticker.
                  </Typography>
                )}
              </>
            )}
            
            {/* Correlations Tab */}
            {currentTab === 3 && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Sentiment Source Correlation
                </Typography>
                {sentimentCorrelationData.length > 0 ? (
                  <Box sx={{ height: 400, mt: 2 }}>
                    <HeatmapVisualizationComponent
                      data={sentimentCorrelationData}
                      rowLabels={sentimentCorrelationLabels}
                      colLabels={sentimentCorrelationLabels}
                      width={700}
                      height={400}
                      title="Sentiment Source Correlation"
                      colorScale={['#4575b4', '#ffffbf', '#d73027']}
                      showValues={true}
                      minValue={-1}
                      maxValue={1}
                      cellTooltip={(row, col, value) => 
                        `Correlation between ${sentimentCorrelationLabels[row]} and ${sentimentCorrelationLabels[col]}: ${value.toFixed(2)}`
                      }
                    />
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Not enough data to generate correlation analysis.
                  </Typography>
                )}
              </>
            )}
          </Box>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={fetchNLPInsights}
              disabled={loading}
            >
              Refresh Analysis
            </Button>
          </Box>
        </>
      )}
      
      {!loading && !insights && !error && (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Enter a ticker symbol to get NLP strategy insights.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default NLPStrategyInsightsPanel;