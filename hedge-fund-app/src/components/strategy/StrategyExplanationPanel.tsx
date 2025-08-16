import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Rating,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Alert,
  AlertTitle,
  Link
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SettingsIcon from '@mui/icons-material/Settings';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CodeIcon from '@mui/icons-material/Code';
import DescriptionIcon from '@mui/icons-material/Description';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import SecurityIcon from '@mui/icons-material/Security';
import BuildIcon from '@mui/icons-material/Build';

import { 
  StrategyExplanationService, 
  StrategyExplanation,
  ExplanationComponentType,
  ParameterExplanation,
  MarketConditionAnalysis,
  RiskAnalysis,
  ImplementationGuide,
  StrategyType
} from '../../services/strategy';

interface StrategyExplanationPanelProps {
  strategyId?: string;
  strategyName?: string;
  strategyType?: StrategyType;
  strategyParameters?: Record<string, any>;
  onParameterUpdate?: (parameters: Record<string, any>) => void;
}

const StrategyExplanationPanel: React.FC<StrategyExplanationPanelProps> = ({
  strategyId = 'default-strategy',
  strategyName = 'Default Strategy',
  strategyType = StrategyType.MOMENTUM,
  strategyParameters = {},
  onParameterUpdate
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [explanation, setExplanation] = useState<StrategyExplanation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Mock service for demo purposes
  const explanationService = new StrategyExplanationService(
    // @ts-ignore - These would be properly injected in a real app
    null, null
  );

  useEffect(() => {
    fetchExplanation();
  }, [strategyId, strategyType]);

  const fetchExplanation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await explanationService.getStrategyExplanation(
        strategyId,
        strategyName,
        strategyType,
        strategyParameters
      );
      
      setExplanation(result);
    } catch (err) {
      setError('Failed to fetch strategy explanation. Please try again.');
      console.error('Error fetching explanation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleParameterUpdate = (paramName: string, value: any) => {
    if (onParameterUpdate) {
      const updatedParameters = {
        ...strategyParameters,
        [paramName]: value
      };
      
      onParameterUpdate(updatedParameters);
    }
  };

  const getRiskLevelColor = (level: string): string => {
    switch (level.toLowerCase()) {
      case 'low':
        return 'success.main';
      case 'medium':
        return 'warning.main';
      case 'high':
        return 'error.main';
      case 'very_high':
        return 'error.dark';
      default:
        return 'text.primary';
    }
  };

  const getSensitivityLevelColor = (level: string): string => {
    switch (level) {
      case 'low':
        return 'success.main';
      case 'medium':
        return 'warning.main';
      case 'high':
        return 'error.main';
      default:
        return 'text.primary';
    }
  };

  const renderOverviewTab = () => {
    if (!explanation) return null;
    
    const { overview } = explanation;
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Strategy Summary
            </Typography>
            <Typography variant="body1" paragraph>
              {overview.summary}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              Key Principles
            </Typography>
            <List>
              {overview.keyPrinciples.map((principle, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <CheckCircleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={principle} />
                </ListItem>
              ))}
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              Suitable Investors
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
              {overview.suitableInvestors.map((investor, index) => (
                <Chip key={index} label={investor} variant="outlined" />
              ))}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              Historical Context
            </Typography>
            <Typography variant="body1" paragraph>
              {overview.historicalContext}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              Academic Research
            </Typography>
            <List dense>
              {overview.academicResearch.map((research, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <DescriptionIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={research} 
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderMarketConditionsTab = () => {
    if (!explanation) return null;
    
    const { marketConditionAnalysis } = explanation;
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Favorable Market Conditions
            </Typography>
            <List>
              {marketConditionAnalysis.favorableConditions.map((condition, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <TrendingUpIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary={condition} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Unfavorable Market Conditions
            </Typography>
            <List>
              {marketConditionAnalysis.unfavorableConditions.map((condition, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <TrendingDownIcon color="error" />
                  </ListItemIcon>
                  <ListItemText primary={condition} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Current Market Assessment
            </Typography>
            
            <Box display="flex" alignItems="center" mb={2}>
              <Typography variant="subtitle1" sx={{ mr: 2 }}>
                Suitability Score:
              </Typography>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress 
                  variant="determinate" 
                  value={marketConditionAnalysis.currentMarketAssessment.suitabilityScore} 
                  color={
                    marketConditionAnalysis.currentMarketAssessment.suitabilityScore > 70 ? "success" :
                    marketConditionAnalysis.currentMarketAssessment.suitabilityScore > 40 ? "warning" : "error"
                  }
                  size={60}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="caption" component="div" color="text.secondary">
                    {`${Math.round(marketConditionAnalysis.currentMarketAssessment.suitabilityScore)}%`}
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Typography variant="subtitle1" gutterBottom>
              Key Factors
            </Typography>
            <List dense>
              {marketConditionAnalysis.currentMarketAssessment.keyFactors.map((factor, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <InfoIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={factor} />
                </ListItem>
              ))}
            </List>
            
            {marketConditionAnalysis.currentMarketAssessment.warnings.length > 0 && (
              <>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Warnings
                </Typography>
                <Alert severity="warning">
                  <List dense disablePadding>
                    {marketConditionAnalysis.currentMarketAssessment.warnings.map((warning, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          <WarningIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={warning} />
                      </ListItem>
                    ))}
                  </List>
                </Alert>
              </>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Historical Performance by Market Condition
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Market Condition</TableCell>
                    <TableCell align="right">Average Return</TableCell>
                    <TableCell align="right">Win Rate</TableCell>
                    <TableCell align="right">Sharpe Ratio</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {marketConditionAnalysis.historicalPerformanceByCondition.map((condition, index) => (
                    <TableRow key={index}>
                      <TableCell>{condition.condition}</TableCell>
                      <TableCell align="right" sx={{ 
                        color: condition.performance.averageReturn >= 0 ? 'success.main' : 'error.main',
                        fontWeight: 'medium'
                      }}>
                        {(condition.performance.averageReturn * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell align="right">
                        {(condition.performance.winRate * 100).toFixed(0)}%
                      </TableCell>
                      <TableCell align="right">
                        {condition.performance.sharpeRatio.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderParametersTab = () => {
    if (!explanation) return null;
    
    const { parameterExplanations } = explanation;
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Strategy Parameters
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              These parameters control how the strategy operates. Understanding and optimizing them is key to successful implementation.
            </Typography>
            
            {parameterExplanations.map((param, index) => (
              <Accordion key={index} defaultExpanded={index === 0}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" width="100%">
                    <Typography sx={{ flexGrow: 1 }}>
                      {param.name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Typography>
                    <Chip 
                      label={`Sensitivity: ${param.sensitivityLevel}`} 
                      size="small"
                      sx={{ 
                        ml: 2,
                        color: 'white',
                        bgcolor: getSensitivityLevelColor(param.sensitivityLevel)
                      }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="body1" paragraph>
                        {param.description}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Current Value
                      </Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                        {Array.isArray(param.value) 
                          ? param.value.join(', ') 
                          : typeof param.value === 'object'
                            ? JSON.stringify(param.value)
                            : param.value.toString()
                        }
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Recommended Range
                      </Typography>
                      <Typography variant="body1">
                        {param.recommendedRange}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Impact on Strategy
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {param.impact}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Optimization Tips
                      </Typography>
                      <Typography variant="body1">
                        {param.optimizationTips}
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderRiskAnalysisTab = () => {
    if (!explanation) return null;
    
    const { riskAnalysis } = explanation;
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Overall Risk Assessment
              </Typography>
              <Chip 
                label={`Risk Level: ${riskAnalysis.overallRiskLevel.replace('_', ' ')}`}
                sx={{ 
                  color: 'white',
                  bgcolor: getRiskLevelColor(riskAnalysis.overallRiskLevel)
                }}
              />
            </Box>
            
            <Alert 
              severity={
                riskAnalysis.overallRiskLevel === 'low' ? 'success' :
                riskAnalysis.overallRiskLevel === 'medium' ? 'warning' :
                'error'
              }
              sx={{ mb: 3 }}
            >
              <AlertTitle>Risk Summary</AlertTitle>
              This strategy has a {riskAnalysis.overallRiskLevel} overall risk level. Investors should ensure this aligns with their risk tolerance and investment goals.
            </Alert>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Key Risks
            </Typography>
            
            {riskAnalysis.keyRisks.map((risk, index) => (
              <Accordion key={index} defaultExpanded={index === 0}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" width="100%">
                    <Typography sx={{ flexGrow: 1 }}>
                      {risk.type}
                    </Typography>
                    <Box display="flex" alignItems="center">
                      <Chip 
                        label={`Impact: ${risk.impact}`} 
                        size="small"
                        sx={{ 
                          mr: 1,
                          color: 'white',
                          bgcolor: getRiskLevelColor(risk.impact)
                        }}
                      />
                      <Chip 
                        label={`Likelihood: ${risk.likelihood}`} 
                        size="small"
                        sx={{ 
                          color: 'white',
                          bgcolor: getRiskLevelColor(risk.likelihood)
                        }}
                      />
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body1" paragraph>
                    {risk.description}
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Mitigation Strategies
                  </Typography>
                  <List dense>
                    {risk.mitigationStrategies.map((strategy, idx) => (
                      <ListItem key={idx}>
                        <ListItemIcon>
                          <SecurityIcon fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={strategy} />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Stress Test Results
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Scenario</TableCell>
                    <TableCell align="right">Potential Loss</TableCell>
                    <TableCell align="right">Recovery Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {riskAnalysis.stressTestResults.map((test, index) => (
                    <TableRow key={index}>
                      <TableCell>{test.scenario}</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'medium' }}>
                        {(test.potentialLoss * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell align="right">
                        {test.recoveryTime}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Drawdown Analysis
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Average Drawdown
                </Typography>
                <Typography variant="h6" color="error.main">
                  {(riskAnalysis.drawdownAnalysis.averageDrawdown * 100).toFixed(1)}%
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Maximum Drawdown
                </Typography>
                <Typography variant="h6" color="error.main">
                  {(riskAnalysis.drawdownAnalysis.maxDrawdown * 100).toFixed(1)}%
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Average Recovery Time
                </Typography>
                <Typography variant="h6">
                  {riskAnalysis.drawdownAnalysis.averageRecoveryTime}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Drawdown Frequency
                </Typography>
                <Typography variant="h6">
                  {riskAnalysis.drawdownAnalysis.drawdownFrequency}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Volatility Analysis
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Historical Volatility
                </Typography>
                <Typography variant="h6">
                  {(riskAnalysis.volatilityAnalysis.historicalVolatility * 100).toFixed(1)}%
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Comparison to Benchmark
                </Typography>
                <Typography variant="body1">
                  {riskAnalysis.volatilityAnalysis.comparisonToBenchmark}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Volatility Trend
                </Typography>
                <Typography variant="body1">
                  {riskAnalysis.volatilityAnalysis.volatilityTrend}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderImplementationTab = () => {
    if (!explanation) return null;
    
    const { implementationGuide } = explanation;
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Implementation Steps
            </Typography>
            
            {implementationGuide.steps.map((step, index) => (
              <Accordion key={index} defaultExpanded={index === 0}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>
                    <strong>Step {step.step}:</strong> {step.title}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body1" paragraph>
                    {step.description}
                  </Typography>
                  
                  {step.codeSnippet && (
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        mb: 2, 
                        bgcolor: 'grey.900',
                        color: 'grey.100',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        overflow: 'auto'
                      }}
                    >
                      <pre style={{ margin: 0 }}>{step.codeSnippet}</pre>
                    </Paper>
                  )}
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Tips
                  </Typography>
                  <List dense>
                    {step.tips.map((tip, idx) => (
                      <ListItem key={idx}>
                        <ListItemIcon>
                          <InfoIcon fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={tip} />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Required Data
            </Typography>
            <List>
              {implementationGuide.requiredData.map((data, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <AssessmentIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={data} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Monitoring Guidelines
            </Typography>
            <List>
              {implementationGuide.monitoringGuidelines.map((guideline, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <ShowChartIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={guideline} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Common Pitfalls
            </Typography>
            <List>
              {implementationGuide.commonPitfalls.map((pitfall, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <WarningIcon color="error" />
                  </ListItemIcon>
                  <ListItemText primary={pitfall} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Performance Checklist
            </Typography>
            <List>
              {implementationGuide.performanceChecklist.map((item, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box>
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">
              {explanation ? explanation.strategyName : strategyName}
            </Typography>
            <Chip 
              label={explanation ? explanation.strategyType : strategyType}
              color="primary"
              icon={<TimelineIcon />}
            />
          </Box>
        </CardContent>
      </Card>
      
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
          <Button 
            variant="outlined" 
            size="small" 
            sx={{ mt: 1 }} 
            onClick={fetchExplanation}
          >
            Retry
          </Button>
        </Alert>
      ) : (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="strategy explanation tabs">
              <Tab icon={<InfoIcon />} label="Overview" />
              <Tab icon={<ShowChartIcon />} label="Market Conditions" />
              <Tab icon={<SettingsIcon />} label="Parameters" />
              <Tab icon={<SecurityIcon />} label="Risk Analysis" />
              <Tab icon={<BuildIcon />} label="Implementation" />
            </Tabs>
          </Box>
          
          <Box sx={{ mt: 2 }}>
            {activeTab === 0 && renderOverviewTab()}
            {activeTab === 1 && renderMarketConditionsTab()}
            {activeTab === 2 && renderParametersTab()}
            {activeTab === 3 && renderRiskAnalysisTab()}
            {activeTab === 4 && renderImplementationTab()}
          </Box>
        </>
      )}
    </Box>
  );
};

export default StrategyExplanationPanel;