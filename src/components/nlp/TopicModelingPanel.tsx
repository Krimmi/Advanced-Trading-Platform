import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Slider,
  Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import { 
  Topic, 
  DocumentType, 
  TopicModelingResult
} from '../../models/nlp/NLPTypes';
import { TopicModelingService } from '../../services/nlp/TopicModelingService';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  ChartTooltip,
  Legend
);

interface TopicModelingPanelProps {
  apiKey: string;
  baseUrl?: string;
  initialTexts?: string[];
  documentType?: DocumentType;
  onTopicClick?: (topic: Topic) => void;
}

const TopicModelingPanel: React.FC<TopicModelingPanelProps> = ({
  apiKey,
  baseUrl,
  initialTexts = [],
  documentType = DocumentType.GENERAL,
  onTopicClick
}) => {
  const theme = useTheme();
  const [texts, setTexts] = useState<string[]>(initialTexts);
  const [currentText, setCurrentText] = useState<string>('');
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>(documentType);
  const [numTopics, setNumTopics] = useState<number>(5);
  const [result, setResult] = useState<TopicModelingResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [topicService] = useState<TopicModelingService>(
    new TopicModelingService(apiKey, baseUrl)
  );

  // Process texts when component mounts or when initialTexts changes
  useEffect(() => {
    if (initialTexts && initialTexts.length > 0 && JSON.stringify(initialTexts) !== JSON.stringify(texts)) {
      setTexts(initialTexts);
      if (initialTexts.length >= 2) {
        analyzeTexts(initialTexts, selectedDocType, numTopics);
      }
    }
  }, [initialTexts]);

  // Analyze texts using the topic modeling service
  const analyzeTexts = async (textsToAnalyze: string[], docType: DocumentType, topics: number) => {
    if (textsToAnalyze.length < 2) {
      setError('Please add at least 2 texts for topic modeling');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const modelingResult = await topicService.extractTopics(textsToAnalyze, topics, docType);
      setResult(modelingResult);
    } catch (err) {
      console.error('Error analyzing texts:', err);
      setError('Failed to analyze texts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentText(e.target.value);
  };

  // Handle document type change
  const handleDocTypeChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedDocType(e.target.value as DocumentType);
  };

  // Handle number of topics change
  const handleNumTopicsChange = (event: Event, newValue: number | number[]) => {
    setNumTopics(newValue as number);
  };

  // Add current text to the list
  const handleAddText = () => {
    if (currentText.trim()) {
      setTexts([...texts, currentText.trim()]);
      setCurrentText('');
    }
  };

  // Remove text from the list
  const handleRemoveText = (index: number) => {
    const newTexts = [...texts];
    newTexts.splice(index, 1);
    setTexts(newTexts);
  };

  // Handle analyze button click
  const handleAnalyzeClick = () => {
    analyzeTexts(texts, selectedDocType, numTopics);
  };

  // Prepare data for topic distribution chart
  const prepareChartData = () => {
    if (!result || !result.topics) return null;
    
    return {
      labels: result.topics.map(topic => topic.name),
      datasets: [
        {
          data: result.topicDistribution.map(td => td.percentage),
          backgroundColor: result.topics.map(topic => topic.sentimentColor),
          borderWidth: 1
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const topic = result?.topics[context.dataIndex];
            if (!topic) return '';
            return [
              `${topic.name}: ${context.parsed.toFixed(1)}%`,
              `Sentiment: ${topic.sentimentScore.toFixed(2)}`
            ];
          }
        }
      }
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Topic Modeling
      </Typography>
      
      <Grid container spacing={2}>
        {/* Input Section */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Add Text"
                    multiline
                    rows={4}
                    value={currentText}
                    onChange={handleTextChange}
                    fullWidth
                    variant="outlined"
                    placeholder="Enter text to add to the collection..."
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleAddText}
                    disabled={!currentText.trim()}
                    fullWidth
                  >
                    Add Text
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Texts for Analysis ({texts.length})
                  </Typography>
                  <List
                    sx={{
                      maxHeight: 200,
                      overflow: 'auto',
                      bgcolor: theme.palette.background.default,
                      borderRadius: 1
                    }}
                  >
                    {texts.length === 0 ? (
                      <ListItem>
                        <ListItemText primary="No texts added yet. Add at least 2 texts for analysis." />
                      </ListItem>
                    ) : (
                      texts.map((text, index) => (
                        <ListItem
                          key={index}
                          secondaryAction={
                            <Button
                              size="small"
                              color="error"
                              onClick={() => handleRemoveText(index)}
                            >
                              Remove
                            </Button>
                          }
                        >
                          <ListItemText
                            primary={`Text ${index + 1}`}
                            secondary={text.length > 100 ? `${text.substring(0, 100)}...` : text}
                          />
                        </ListItem>
                      ))
                    )}
                  </List>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel id="document-type-label">Document Type</InputLabel>
                    <Select
                      labelId="document-type-label"
                      value={selectedDocType}
                      onChange={handleDocTypeChange}
                      label="Document Type"
                    >
                      {Object.values(DocumentType).map((type) => (
                        <MenuItem key={type} value={type}>
                          {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography id="num-topics-slider" gutterBottom>
                    Number of Topics: {numTopics}
                  </Typography>
                  <Slider
                    value={numTopics}
                    onChange={handleNumTopicsChange}
                    aria-labelledby="num-topics-slider"
                    valueLabelDisplay="auto"
                    step={1}
                    marks
                    min={2}
                    max={10}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAnalyzeClick}
                    disabled={loading || texts.length < 2}
                    fullWidth
                    sx={{ height: '100%' }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Analyze Topics'}
                  </Button>
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
        
        {/* Results Section */}
        {result && (
          <>
            {/* Topic Distribution Chart */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Topic Distribution
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    {prepareChartData() && (
                      <Doughnut data={prepareChartData()!} options={chartOptions} />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Topic Summary */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Topic Summary
                  </Typography>
                  <Box sx={{ height: 300, overflow: 'auto' }}>
                    <List>
                      {result.topics.map((topic, index) => (
                        <React.Fragment key={topic.id}>
                          {index > 0 && <Divider />}
                          <ListItem
                            button={!!onTopicClick}
                            onClick={() => onTopicClick && onTopicClick(topic)}
                          >
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="subtitle2">
                                    {topic.name}
                                  </Typography>
                                  <Chip
                                    label={`${(topic.weight * 100).toFixed(1)}%`}
                                    size="small"
                                    sx={{
                                      bgcolor: `${topic.sentimentColor}20`,
                                      color: topic.sentimentColor
                                    }}
                                  />
                                </Box>
                              }
                              secondary={
                                <>
                                  <Typography variant="body2" color="text.secondary">
                                    Sentiment: {topic.sentimentScore.toFixed(2)} ({topic.sentimentClassification})
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                    {topic.keywords.slice(0, 5).map((keyword, keywordIndex) => (
                                      <Chip
                                        key={keywordIndex}
                                        label={keyword}
                                        size="small"
                                        variant="outlined"
                                      />
                                    ))}
                                    {topic.keywords.length > 5 && (
                                      <Tooltip title={topic.keywords.slice(5).join(', ')}>
                                        <Chip
                                          label={`+${topic.keywords.length - 5}`}
                                          size="small"
                                          variant="outlined"
                                        />
                                      </Tooltip>
                                    )}
                                  </Box>
                                </>
                              }
                            />
                          </ListItem>
                        </React.Fragment>
                      ))}
                    </List>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Topic Details */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Topic Details
                  </Typography>
                  <Grid container spacing={2}>
                    {result.topics.map((topic) => (
                      <Grid item xs={12} sm={6} md={4} key={topic.id}>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 2,
                            height: '100%',
                            borderLeft: `4px solid ${topic.sentimentColor}`
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2">{topic.name}</Typography>
                            <Chip
                              label={`${(topic.weight * 100).toFixed(1)}%`}
                              size="small"
                              sx={{
                                bgcolor: `${topic.sentimentColor}20`,
                                color: topic.sentimentColor
                              }}
                            />
                          </Box>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Sentiment: {topic.sentimentScore.toFixed(2)} ({topic.sentimentClassification})
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Key terms:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {topic.keywords.map((keyword, keywordIndex) => (
                              <Chip
                                key={keywordIndex}
                                label={keyword}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                          {topic.relatedEntities.length > 0 && (
                            <>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }} gutterBottom>
                                Related entities:
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {topic.relatedEntities.slice(0, 3).map((entity, entityIndex) => (
                                  <Chip
                                    key={entityIndex}
                                    label={entity.text}
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                                {topic.relatedEntities.length > 3 && (
                                  <Tooltip title={topic.relatedEntities.slice(3).map(e => e.text).join(', ')}>
                                    <Chip
                                      label={`+${topic.relatedEntities.length - 3}`}
                                      size="small"
                                      variant="outlined"
                                    />
                                  </Tooltip>
                                )}
                              </Box>
                            </>
                          )}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Model Information */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Model Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        Document Type: {result.documentType}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        Coherence Score: {result.coherenceScore?.toFixed(3) || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        Model Version: {result.modelVersion || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>
    </Paper>
  );
};

export default TopicModelingPanel;