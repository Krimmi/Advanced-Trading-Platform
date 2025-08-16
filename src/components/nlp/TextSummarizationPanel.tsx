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
  Slider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { 
  DocumentType, 
  TextSummaryResult
} from '../../models/nlp/NLPTypes';
import { TextSummarizationService } from '../../services/nlp/TextSummarizationService';

// Mock icons (replace with actual imports in a real implementation)
const KeyPointIcon = () => <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mr: 1 }} />;
const CopyIcon = () => <Box>📋</Box>;

interface TextSummarizationPanelProps {
  apiKey: string;
  baseUrl?: string;
  initialText?: string;
  documentType?: DocumentType;
  maxLength?: number;
}

const TextSummarizationPanel: React.FC<TextSummarizationPanelProps> = ({
  apiKey,
  baseUrl,
  initialText = '',
  documentType = DocumentType.GENERAL,
  maxLength = 500
}) => {
  const theme = useTheme();
  const [text, setText] = useState<string>(initialText);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>(documentType);
  const [summaryLength, setSummaryLength] = useState<number>(maxLength);
  const [result, setResult] = useState<TextSummaryResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [summarizationService] = useState<TextSummarizationService>(
    new TextSummarizationService(apiKey, baseUrl)
  );

  // Process text when component mounts or when initialText changes
  useEffect(() => {
    if (initialText && initialText !== text) {
      setText(initialText);
      if (initialText.length > 100) {
        summarizeText(initialText, selectedDocType, summaryLength);
      }
    }
  }, [initialText]);

  // Summarize text using the summarization service
  const summarizeText = async (textToSummarize: string, docType: DocumentType, maxChars: number) => {
    if (textToSummarize.length < 100) {
      setError('Text is too short to summarize. Please provide at least 100 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const summaryResult = await summarizationService.summarizeText(textToSummarize, maxChars, docType);
      setResult(summaryResult);
    } catch (err) {
      console.error('Error summarizing text:', err);
      setError('Failed to summarize text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  // Handle document type change
  const handleDocTypeChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedDocType(e.target.value as DocumentType);
  };

  // Handle summary length change
  const handleSummaryLengthChange = (event: Event, newValue: number | number[]) => {
    setSummaryLength(newValue as number);
  };

  // Handle summarize button click
  const handleSummarizeClick = () => {
    summarizeText(text, selectedDocType, summaryLength);
  };

  // Copy text to clipboard
  const copyToClipboard = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy).then(
      () => {
        // Success message could be shown here
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  };

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Text Summarization
      </Typography>
      
      <Grid container spacing={2}>
        {/* Input Section */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Text to Summarize"
                    multiline
                    rows={6}
                    value={text}
                    onChange={handleTextChange}
                    fullWidth
                    variant="outlined"
                    placeholder="Enter financial text to summarize..."
                  />
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
                  <Typography id="summary-length-slider" gutterBottom>
                    Summary Length: {summaryLength} characters
                  </Typography>
                  <Slider
                    value={summaryLength}
                    onChange={handleSummaryLengthChange}
                    aria-labelledby="summary-length-slider"
                    valueLabelDisplay="auto"
                    step={100}
                    marks={[
                      { value: 200, label: '200' },
                      { value: 500, label: '500' },
                      { value: 1000, label: '1000' }
                    ]}
                    min={200}
                    max={1000}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSummarizeClick}
                    disabled={loading || text.length < 100}
                    fullWidth
                    sx={{ height: '100%' }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Summarize Text'}
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
            {/* Summary */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1">
                      Summary
                    </Typography>
                    <Tooltip title="Copy summary to clipboard">
                      <IconButton size="small" onClick={() => copyToClipboard(result.summary)}>
                        <CopyIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box 
                    sx={{ 
                      p: 2, 
                      bgcolor: theme.palette.background.default, 
                      borderRadius: 1,
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <Typography variant="body1">
                      {result.summary}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Compression ratio: {(result.compressionRatio * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {result.summary.length} characters (from {result.originalText.length})
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Key Points */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Key Points
                  </Typography>
                  {result.keyPoints.length > 0 ? (
                    <List>
                      {result.keyPoints.map((point, index) => (
                        <ListItem key={index} alignItems="flex-start">
                          <ListItemIcon sx={{ minWidth: 24 }}>
                            <KeyPointIcon />
                          </ListItemIcon>
                          <ListItemText primary={point} />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No key points extracted from the summary.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Summary Statistics */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Summary Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Document Type:
                      </Typography>
                      <Typography variant="body1">
                        {result.documentType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Model Version:
                      </Typography>
                      <Typography variant="body1">
                        {result.modelVersion || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Original Length:
                      </Typography>
                      <Typography variant="body1">
                        {result.originalText.length} characters
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Summary Length:
                      </Typography>
                      <Typography variant="body1">
                        {result.summary.length} characters
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Compression Ratio:
                      </Typography>
                      <Typography variant="body1">
                        {(result.compressionRatio * 100).toFixed(1)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Key Points:
                      </Typography>
                      <Typography variant="body1">
                        {result.keyPoints.length}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Original Text (Collapsible) */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Original Text
                  </Typography>
                  <Box 
                    sx={{ 
                      p: 2, 
                      bgcolor: theme.palette.background.default, 
                      borderRadius: 1,
                      border: `1px solid ${theme.palette.divider}`,
                      maxHeight: 200,
                      overflow: 'auto'
                    }}
                  >
                    <Typography variant="body2">
                      {result.originalText}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>
    </Paper>
  );
};

export default TextSummarizationPanel;