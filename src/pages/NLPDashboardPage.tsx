import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Tabs, 
  Tab, 
  Divider,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { 
  EntityRecognitionPanel, 
  TopicModelingPanel, 
  TextSummarizationPanel, 
  TradingSignalsPanel 
} from '../components/nlp';
import { DocumentType, Entity, Topic, NLPSignal } from '../models/nlp/NLPTypes';
import { TradingSignal } from '../services/nlp/TradingSignalsService';

// Mock icons (replace with actual imports in a real implementation)
const DashboardIcon = () => <Box>📊</Box>;
const EntityIcon = () => <Box>🏢</Box>;
const TopicIcon = () => <Box>📝</Box>;
const SummaryIcon = () => <Box>📃</Box>;
const SignalIcon = () => <Box>📈</Box>;
const SettingsIcon = () => <Box>⚙️</Box>;

interface NLPDashboardPageProps {
  apiKey: string;
  baseUrl?: string;
}

const NLPDashboardPage: React.FC<NLPDashboardPageProps> = ({
  apiKey,
  baseUrl
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [ticker, setTicker] = useState<string>('AAPL');
  const [sampleText, setSampleText] = useState<string>(
    "Apple Inc. reported strong quarterly earnings, with revenue reaching $89.5 billion, exceeding analyst expectations. " +
    "CEO Tim Cook highlighted the success of iPhone 15 sales and growth in services revenue. " +
    "The company announced a 5% increase in its quarterly dividend and authorized an additional $90 billion for share repurchases. " +
    "However, sales in China declined by 2.5% year-over-year, causing some concern among investors. " +
    "Apple's gross margin improved to 45.2%, and the company expects continued growth in the wearables segment. " +
    "CFO Luca Maestri mentioned potential supply chain challenges in the coming quarter due to global semiconductor shortages. " +
    "Despite these challenges, Apple remains optimistic about its long-term growth prospects, particularly with the upcoming launch of new AI features."
  );
  const [sampleTexts, setSampleTexts] = useState<string[]>([
    "Apple Inc. reported strong quarterly earnings, with revenue reaching $89.5 billion, exceeding analyst expectations. CEO Tim Cook highlighted the success of iPhone 15 sales and growth in services revenue.",
    "Microsoft Corporation announced a new AI-powered version of its Office suite, integrating GPT-4 capabilities across Word, Excel, and PowerPoint. CEO Satya Nadella emphasized the company's commitment to AI innovation.",
    "Tesla delivered 422,875 vehicles in the first quarter, up 36% year-over-year but slightly below Wall Street expectations. The company cited production challenges at its Berlin and Austin factories.",
    "Amazon Web Services announced price reductions for several cloud services, intensifying competition with Microsoft Azure and Google Cloud. The move is expected to accelerate cloud adoption among small businesses.",
    "Google unveiled its latest Pixel smartphone with enhanced AI photography features and improved battery life. The device will compete directly with Apple's iPhone and Samsung's Galaxy series."
  ]);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<TradingSignal | null>(null);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle ticker change
  const handleTickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTicker(e.target.value.toUpperCase());
  };

  // Handle sample text change
  const handleSampleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSampleText(e.target.value);
  };

  // Handle entity click
  const handleEntityClick = (entity: Entity) => {
    setSelectedEntity(entity);
  };

  // Handle topic click
  const handleTopicClick = (topic: Topic) => {
    setSelectedTopic(topic);
  };

  // Handle signal click
  const handleSignalClick = (signal: TradingSignal) => {
    setSelectedSignal(signal);
  };

  // Clear selected entity
  const clearSelectedEntity = () => {
    setSelectedEntity(null);
  };

  // Clear selected topic
  const clearSelectedTopic = () => {
    setSelectedTopic(null);
  };

  // Clear selected signal
  const clearSelectedSignal = () => {
    setSelectedSignal(null);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          NLP Financial Analysis Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            label="Ticker"
            value={ticker}
            onChange={handleTickerChange}
            variant="outlined"
            size="small"
            sx={{ width: 100, mr: 2 }}
          />
          <Tooltip title="Settings">
            <IconButton>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<DashboardIcon />} label="Dashboard" />
          <Tab icon={<EntityIcon />} label="Entity Recognition" />
          <Tab icon={<TopicIcon />} label="Topic Modeling" />
          <Tab icon={<SummaryIcon />} label="Text Summarization" />
          <Tab icon={<SignalIcon />} label="Trading Signals" />
        </Tabs>
      </Paper>

      {/* Dashboard Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              NLP Financial Analysis Overview
            </Typography>
            <Typography variant="body1" paragraph>
              This dashboard provides advanced natural language processing capabilities for financial text analysis.
              Use the tabs above to access specific NLP features.
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Entity Recognition
                </Typography>
                <Typography variant="body2" paragraph>
                  Identify companies, people, financial metrics, and other entities in financial text.
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => setActiveTab(1)}
                  startIcon={<EntityIcon />}
                >
                  Open Entity Recognition
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Topic Modeling
                </Typography>
                <Typography variant="body2" paragraph>
                  Discover key themes and topics in collections of financial documents.
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => setActiveTab(2)}
                  startIcon={<TopicIcon />}
                >
                  Open Topic Modeling
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Text Summarization
                </Typography>
                <Typography variant="body2" paragraph>
                  Generate concise summaries of financial documents, reports, and news articles.
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => setActiveTab(3)}
                  startIcon={<SummaryIcon />}
                >
                  Open Text Summarization
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Trading Signals
                </Typography>
                <Typography variant="body2" paragraph>
                  Generate trading signals based on NLP analysis of financial text.
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => setActiveTab(4)}
                  startIcon={<SignalIcon />}
                >
                  Open Trading Signals
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sample Text
                </Typography>
                <TextField
                  multiline
                  rows={4}
                  value={sampleText}
                  onChange={handleSampleTextChange}
                  fullWidth
                  variant="outlined"
                  placeholder="Enter financial text to analyze..."
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Entity Recognition Tab */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={selectedEntity ? 8 : 12}>
            <EntityRecognitionPanel
              apiKey={apiKey}
              baseUrl={baseUrl}
              initialText={sampleText}
              documentType={DocumentType.NEWS}
              onEntityClick={handleEntityClick}
            />
          </Grid>
          
          {selectedEntity && (
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Entity Details
                  </Typography>
                  <Button size="small" onClick={clearSelectedEntity}>
                    Close
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  {selectedEntity.text}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Type: {selectedEntity.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Confidence: {(selectedEntity.confidence * 100).toFixed(0)}%
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Metadata
                </Typography>
                {Object.keys(selectedEntity.metadata).length > 0 ? (
                  <Grid container spacing={1}>
                    {Object.entries(selectedEntity.metadata).map(([key, value]) => (
                      <Grid item xs={12} key={key}>
                        <Typography variant="body2">
                          <strong>{key}:</strong> {value?.toString() || 'N/A'}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No metadata available for this entity.
                  </Typography>
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Topic Modeling Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={selectedTopic ? 8 : 12}>
            <TopicModelingPanel
              apiKey={apiKey}
              baseUrl={baseUrl}
              initialTexts={sampleTexts}
              documentType={DocumentType.NEWS}
              onTopicClick={handleTopicClick}
            />
          </Grid>
          
          {selectedTopic && (
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Topic Details
                  </Typography>
                  <Button size="small" onClick={clearSelectedTopic}>
                    Close
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  {selectedTopic.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Weight: {(selectedTopic.weight * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Sentiment: {selectedTopic.sentimentScore.toFixed(2)} ({selectedTopic.sentimentClassification})
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Keywords
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {selectedTopic.keywords.map((keyword, index) => (
                    <Chip
                      key={index}
                      label={keyword}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
                
                {selectedTopic.relatedEntities.length > 0 && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Related Entities
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selectedTopic.relatedEntities.map((entity, index) => (
                        <Chip
                          key={index}
                          label={entity.text}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </>
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Text Summarization Tab */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextSummarizationPanel
              apiKey={apiKey}
              baseUrl={baseUrl}
              initialText={sampleText}
              documentType={DocumentType.NEWS}
              maxLength={500}
            />
          </Grid>
        </Grid>
      )}

      {/* Trading Signals Tab */}
      {activeTab === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={selectedSignal ? 8 : 12}>
            <TradingSignalsPanel
              apiKey={apiKey}
              baseUrl={baseUrl}
              ticker={ticker}
              onSignalClick={handleSignalClick}
            />
          </Grid>
          
          {selectedSignal && (
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Signal Details
                  </Typography>
                  <Button size="small" onClick={clearSelectedSignal}>
                    Close
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  {selectedSignal.direction.charAt(0).toUpperCase() + selectedSignal.direction.slice(1)}{' '}
                  {selectedSignal.signalType.charAt(0).toUpperCase() + selectedSignal.signalType.slice(1)} Signal
                </Typography>
                <Typography variant="body2" paragraph>
                  {selectedSignal.explanation}
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Source:
                    </Typography>
                    <Typography variant="body2">
                      {selectedSignal.source.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Timeframe:
                    </Typography>
                    <Typography variant="body2">
                      {selectedSignal.timeframe.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Strength:
                    </Typography>
                    <Typography variant="body2">
                      {(selectedSignal.strength.value * 100).toFixed(0)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Confidence:
                    </Typography>
                    <Typography variant="body2">
                      {(selectedSignal.confidence.value * 100).toFixed(0)}%
                    </Typography>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Supporting Evidence
                </Typography>
                {selectedSignal.supportingEvidence && selectedSignal.supportingEvidence.length > 0 ? (
                  selectedSignal.supportingEvidence.map((evidence, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        {evidence.text}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {evidence.source} - {new Date(evidence.date).toLocaleDateString()}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No supporting evidence available.
                  </Typography>
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  );
};

export default NLPDashboardPage;