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
  Tabs,
  Tab,
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
  LinearProgress,
  Rating
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { 
  TradingStrategy, 
  StrategyExplanation,
  MarketCondition,
  StrategyType
} from '../../models/strategy/StrategyTypes';
import { StrategyExplanationService } from '../../services/strategy/StrategyExplanationService';

// Mock icons (replace with actual imports in a real implementation)
const ExpandMoreIcon = () => <Box>▼</Box>;
const InfoIcon = () => <Box>ℹ️</Box>;
const CheckIcon = () => <Box sx={{ color: 'success.main' }}>✓</Box>;
const WarningIcon = () => <Box sx={{ color: 'warning.main' }}>⚠️</Box>;
const ErrorIcon = () => <Box sx={{ color: 'error.main' }}>✖</Box>;
const BookIcon = () => <Box>📚</Box>;
const CompareIcon = () => <Box>⚖️</Box>;
const RiskIcon = () => <Box>🛡️</Box>;
const MarketIcon = () => <Box>📊</Box>;
const ParameterIcon = () => <Box>🔧</Box>;

interface StrategyExplanationPanelProps {
  apiKey: string;
  baseUrl?: string;
  strategy: TradingStrategy;
  onParameterExplanationRequest?: (parameterId: string) => void;
  onMarketConditionAnalysisRequest?: (condition: MarketCondition) => void;
  onCompareStrategyRequest?: (strategyId: string) => void;
}

const StrategyExplanationPanel: React.FC<StrategyExplanationPanelProps> = ({
  apiKey,
  baseUrl,
  strategy,
  onParameterExplanationRequest,
  onMarketConditionAnalysisRequest,
  onCompareStrategyRequest
}) => {
  const theme = useTheme();
  const [explanation, setExplanation] = useState<StrategyExplanation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [explanationService] = useState<StrategyExplanationService>(
    new StrategyExplanationService(apiKey, baseUrl)
  );

  // Load explanation when strategy changes
  useEffect(() => {
    if (strategy) {
      loadExplanation();
    }
  }, [strategy]);

  // Load strategy explanation
  const loadExplanation = async () => {
    if (!strategy) return;

    setLoading(true);
    setError(null);

    try {
      const result = await explanationService.getStrategyExplanation(strategy.id);
      setExplanation(result);
    } catch (err) {
      console.error('Error loading strategy explanation:', err);
      setError('Failed to load strategy explanation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle parameter explanation request
  const handleParameterExplanationRequest = (parameterId: string) => {
    if (onParameterExplanationRequest) {
      onParameterExplanationRequest(parameterId);
    }
  };

  // Handle market condition analysis request
  const handleMarketConditionAnalysisRequest = (condition: MarketCondition) => {
    if (onMarketConditionAnalysisRequest) {
      onMarketConditionAnalysisRequest(condition);
    }
  };

  // Handle compare strategy request
  const handleCompareStrategyRequest = (strategyId: string) => {
    if (onCompareStrategyRequest) {
      onCompareStrategyRequest(strategyId);
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

  // Get market condition label
  const getMarketConditionLabel = (condition: MarketCondition): string => {
    return condition.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Get color for suitability
  const getSuitabilityColor = (suitability: number): string => {
    if (suitability >= 80) return theme.palette.success.main;
    if (suitability >= 60) return theme.palette.success.light;
    if (suitability >= 40) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Get icon for suitability
  const getSuitabilityIcon = (suitability: number) => {
    if (suitability >= 80) return <CheckIcon />;
    if (suitability >= 40) return <WarningIcon />;
    return <ErrorIcon />;
  };

  // Render overview tab
  const renderOverviewTab = () => {
    if (!explanation) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Strategy Overview
        </Typography>
        
        <Typography variant="body1" paragraph>
          {explanation.overview}
        </Typography>
        
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          Key Components
        </Typography>
        
        <Grid container spacing={2}>
          {explanation.keyComponents.map((component, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">
                      {component.component}
                    </Typography>
                    <Chip 
                      label={`${component.importance}%`} 
                      size="small"
                      color={component.importance > 80 ? 'error' : component.importance > 60 ? 'warning' : 'default'}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {component.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {explanation.academicResearch && explanation.academicResearch.length > 0 && (
          <>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
              Academic Research
            </Typography>
            
            <List>
              {explanation.academicResearch.map((research, index) => (
                <ListItem key={index} alignItems="flex-start">
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <BookIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={research.title}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {research.authors.join(', ')} ({research.year})
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {research.summary}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Box>
    );
  };

  // Render market conditions tab
  const renderMarketConditionsTab = () => {
    if (!explanation) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Market Condition Analysis
        </Typography>
        
        <Grid container spacing={2}>
          {explanation.marketConditionAnalysis.map((analysis, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <MarketIcon />
                      <Typography variant="subtitle1" sx={{ ml: 1 }}>
                        {getMarketConditionLabel(analysis.condition)}
                      </Typography>
                    </Box>
                    <Chip 
                      label={`${analysis.suitability}%`} 
                      size="small"
                      sx={{ 
                        backgroundColor: getSuitabilityColor(analysis.suitability),
                        color: analysis.suitability >= 60 ? 'white' : 'inherit'
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ mr: 1 }}>
                      Suitability:
                    </Typography>
                    <Box sx={{ width: '100%' }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={analysis.suitability} 
                        sx={{ 
                          height: 8, 
                          borderRadius: 1,
                          backgroundColor: theme.palette.grey[200],
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getSuitabilityColor(analysis.suitability)
                          }
                        }}
                      />
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    {analysis.explanation}
                  </Typography>
                  
                  <Button 
                    size="small" 
                    sx={{ mt: 1 }}
                    onClick={() => handleMarketConditionAnalysisRequest(analysis.condition)}
                  >
                    Detailed Analysis
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  // Render parameters tab
  const renderParametersTab = () => {
    if (!explanation) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Parameter Explanations
        </Typography>
        
        {explanation.parameterExplanations.map((param, index) => (
          <Accordion key={index} defaultExpanded={index === 0}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ParameterIcon />
                  <Typography variant="subtitle1" sx={{ ml: 1 }}>
                    {strategy.parameters.find(p => p.id === param.parameterId)?.name || param.parameterId}
                  </Typography>
                </Box>
                <Chip 
                  label={`Sensitivity: ${param.sensitivityLevel}%`} 
                  size="small"
                  color={param.sensitivityLevel > 80 ? 'error' : param.sensitivityLevel > 60 ? 'warning' : 'default'}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                {param.explanation}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Recommended Values by Market Condition
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Market Condition</TableCell>
                      <TableCell>Recommended Value</TableCell>
                      <TableCell>Explanation</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {param.recommendedValues.map((rec, i) => (
                      <TableRow key={i}>
                        <TableCell>{getMarketConditionLabel(rec.marketCondition)}</TableCell>
                        <TableCell>{typeof rec.value === 'number' ? rec.value.toFixed(2) : String(rec.value)}</TableCell>
                        <TableCell>{rec.explanation}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Button 
                size="small" 
                sx={{ mt: 2 }}
                onClick={() => handleParameterExplanationRequest(param.parameterId)}
              >
                Detailed Analysis
              </Button>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  // Render risk analysis tab
  const renderRiskAnalysisTab = () => {
    if (!explanation) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Risk Analysis
        </Typography>
        
        <Grid container spacing={2}>
          {explanation.riskAnalysis.map((risk, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <RiskIcon />
                      <Typography variant="subtitle1" sx={{ ml: 1 }}>
                        {risk.riskFactor}
                      </Typography>
                    </Box>
                    <Chip 
                      label={`Impact: ${risk.impact}%`} 
                      size="small"
                      color={risk.impact > 80 ? 'error' : risk.impact > 60 ? 'warning' : 'default'}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ mr: 1 }}>
                      Impact:
                    </Typography>
                    <Box sx={{ width: '100%' }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={risk.impact} 
                        sx={{ 
                          height: 8, 
                          borderRadius: 1,
                          backgroundColor: theme.palette.grey[200],
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: risk.impact > 80 ? theme.palette.error.main : 
                                           risk.impact > 60 ? theme.palette.warning.main : 
                                           theme.palette.primary.main
                          }
                        }}
                      />
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" paragraph>
                    <strong>Mitigation:</strong> {risk.mitigationApproach}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  // Render comparisons tab
  const renderComparisonsTab = () => {
    if (!explanation || !explanation.comparisonWithSimilarStrategies || explanation.comparisonWithSimilarStrategies.length === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No comparison data available for this strategy.
          </Typography>
        </Box>
      );
    }

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Comparison with Similar Strategies
        </Typography>
        
        {explanation.comparisonWithSimilarStrategies.map((comparison, index) => (
          <Card key={index} variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CompareIcon />
                  <Typography variant="subtitle1" sx={{ ml: 1 }}>
                    Compared to: {comparison.strategyId}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Similarity:
                  </Typography>
                  <Rating 
                    value={comparison.similarityScore / 20} 
                    precision={0.5} 
                    readOnly 
                  />
                </Box>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Key Differences
                  </Typography>
                  <List dense>
                    {comparison.keyDifferences.map((diff, i) => (
                      <ListItem key={i}>
                        <ListItemText primary={diff} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Relative Strengths
                  </Typography>
                  <List dense>
                    {comparison.relativeStrengths.map((strength, i) => (
                      <ListItem key={i}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          <CheckIcon />
                        </ListItemIcon>
                        <ListItemText primary={strength} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Relative Weaknesses
                  </Typography>
                  <List dense>
                    {comparison.relativeWeaknesses.map((weakness, i) => (
                      <ListItem key={i}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          <WarningIcon />
                        </ListItemIcon>
                        <ListItemText primary={weakness} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
              
              <Button 
                size="small" 
                sx={{ mt: 2 }}
                onClick={() => handleCompareStrategyRequest(comparison.strategyId)}
              >
                Detailed Comparison
              </Button>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };

  // Render visual explanations tab
  const renderVisualsTab = () => {
    if (!explanation || !explanation.visualExplanations || explanation.visualExplanations.length === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No visual explanations available for this strategy.
          </Typography>
        </Box>
      );
    }

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Visual Explanations
        </Typography>
        
        {explanation.visualExplanations.map((visual, index) => (
          <Card key={index} variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                {visual.title}
              </Typography>
              
              <Typography variant="body2" paragraph>
                {visual.description}
              </Typography>
              
              <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" align="center">
                  [Visual content would be rendered here based on the data]
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Strategy Explanation: {strategy.name}
      </Typography>
      
      {loading && (
        <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            Loading strategy explanation...
          </Typography>
        </Box>
      )}
      
      {error && (
        <Box sx={{ p: 2, bgcolor: theme.palette.error.light, borderRadius: 1, mt: 2, mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}
      
      {explanation && (
        <Box sx={{ mt: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab label="Overview" />
            <Tab label="Market Conditions" />
            <Tab label="Parameters" />
            <Tab label="Risk Analysis" />
            <Tab label="Comparisons" />
            <Tab label="Visuals" />
          </Tabs>
          
          <Box sx={{ mt: 2 }}>
            {activeTab === 0 && renderOverviewTab()}
            {activeTab === 1 && renderMarketConditionsTab()}
            {activeTab === 2 && renderParametersTab()}
            {activeTab === 3 && renderRiskAnalysisTab()}
            {activeTab === 4 && renderComparisonsTab()}
            {activeTab === 5 && renderVisualsTab()}
          </Box>
        </Box>
      )}
      
      {!loading && !explanation && !error && (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Select a strategy to view its explanation.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default StrategyExplanationPanel;