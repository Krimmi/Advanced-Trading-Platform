import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Grid, 
  Paper, 
  Tabs, 
  Tab, 
  Button, 
  Divider,
  Alert,
  AlertTitle,
  useTheme
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Psychology as PsychologyIcon,
  School as SchoolIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

import { MarketPredictionChart, ModelTrainingPanel } from '../../components/ml';
import { ModelTrainingResult } from '../../services/ml';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ml-tabpanel-${index}`}
      aria-labelledby={`ml-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const MLPredictionPage: React.FC = () => {
  const theme = useTheme();
  
  // State
  const [tabValue, setTabValue] = useState(0);
  const [trainingResult, setTrainingResult] = useState<ModelTrainingResult | null>(null);
  const [showTrainingSuccess, setShowTrainingSuccess] = useState(false);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle training complete
  const handleTrainingComplete = (result: ModelTrainingResult) => {
    setTrainingResult(result);
    setShowTrainingSuccess(true);
    
    // Auto-hide success message after 5 seconds
    setTimeout(() => {
      setShowTrainingSuccess(false);
    }, 5000);
  };
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Market Prediction & ML Models
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Advanced machine learning models for market prediction and analysis
        </Typography>
      </Box>
      
      {/* Training success alert */}
      {showTrainingSuccess && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => setShowTrainingSuccess(false)}
        >
          <AlertTitle>Model Training Complete</AlertTitle>
          Your model has been successfully trained and deployed. You can now use it for predictions.
        </Alert>
      )}
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="ml tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label="Market Predictions" 
            icon={<TrendingUpIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Model Training" 
            icon={<SchoolIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Model Performance" 
            icon={<BarChartIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Advanced Analytics" 
            icon={<TimelineIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>
      
      {/* Market Predictions Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <MarketPredictionChart 
              symbol={trainingResult?.symbol || 'AAPL'} 
              days={10}
              height={500}
            />
          </Grid>
          
          <Grid item xs={12} lg={4}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                height: '100%',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography variant="h6" gutterBottom>
                Available Prediction Models
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  The following ML models are available for market prediction:
                </Typography>
                
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box 
                      component="span" 
                      sx={{ 
                        display: 'inline-block', 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: 'primary.main', 
                        mr: 1 
                      }} 
                    />
                    LSTM Model for AAPL (Default)
                  </Typography>
                  
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box 
                      component="span" 
                      sx={{ 
                        display: 'inline-block', 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: 'primary.main', 
                        mr: 1 
                      }} 
                    />
                    Transformer Model for MSFT
                  </Typography>
                  
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box 
                      component="span" 
                      sx={{ 
                        display: 'inline-block', 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: 'primary.main', 
                        mr: 1 
                      }} 
                    />
                    LSTM Model for GOOGL
                  </Typography>
                  
                  {trainingResult && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 1,
                        fontWeight: 'bold',
                        color: 'success.main'
                      }}
                    >
                      <Box 
                        component="span" 
                        sx={{ 
                          display: 'inline-block', 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          bgcolor: 'success.main', 
                          mr: 1 
                        }} 
                      />
                      {trainingResult.modelType.toUpperCase()} Model for {trainingResult.symbol} (New)
                    </Typography>
                  )}
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                How It Works
              </Typography>
              
              <Typography variant="body2" paragraph>
                Our market prediction models use advanced machine learning techniques to analyze historical price data and predict future price movements.
              </Typography>
              
              <Typography variant="body2" paragraph>
                The models are trained on years of historical data and can identify patterns that are not visible to human traders. They take into account various factors such as price, volume, and technical indicators.
              </Typography>
              
              <Typography variant="body2" paragraph>
                The predictions are updated daily and can be used to inform your trading decisions. However, please note that these are predictions and not guarantees of future performance.
              </Typography>
              
              <Box sx={{ mt: 'auto', pt: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  onClick={() => setTabValue(1)}
                >
                  Train Your Own Model
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2
              }}
            >
              <Typography variant="h6" gutterBottom>
                Multi-Asset Predictions
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6} lg={3}>
                  <MarketPredictionChart 
                    symbol="MSFT" 
                    days={5}
                    height={300}
                    showControls={false}
                  />
                </Grid>
                
                <Grid item xs={12} md={6} lg={3}>
                  <MarketPredictionChart 
                    symbol="GOOGL" 
                    days={5}
                    height={300}
                    showControls={false}
                  />
                </Grid>
                
                <Grid item xs={12} md={6} lg={3}>
                  <MarketPredictionChart 
                    symbol="AMZN" 
                    days={5}
                    height={300}
                    showControls={false}
                  />
                </Grid>
                
                <Grid item xs={12} md={6} lg={3}>
                  <MarketPredictionChart 
                    symbol="TSLA" 
                    days={5}
                    height={300}
                    showControls={false}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
      
      {/* Model Training Tab */}
      <TabPanel value={tabValue} index={1}>
        <ModelTrainingPanel onTrainingComplete={handleTrainingComplete} />
      </TabPanel>
      
      {/* Model Performance Tab */}
      <TabPanel value={tabValue} index={2}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2
          }}
        >
          <Typography variant="h5" gutterBottom>
            Model Performance Analysis
          </Typography>
          
          <Typography variant="body1" paragraph>
            This section will show detailed performance metrics for all trained models.
          </Typography>
          
          <Alert severity="info">
            Train a model in the Model Training tab to see its performance metrics here.
          </Alert>
        </Paper>
      </TabPanel>
      
      {/* Advanced Analytics Tab */}
      <TabPanel value={tabValue} index={3}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2
          }}
        >
          <Typography variant="h5" gutterBottom>
            Advanced Analytics
          </Typography>
          
          <Typography variant="body1" paragraph>
            This section will provide advanced analytics and insights based on ML models.
          </Typography>
          
          <Alert severity="info">
            Advanced analytics features are coming soon.
          </Alert>
        </Paper>
      </TabPanel>
    </Container>
  );
};

export default MLPredictionPage;