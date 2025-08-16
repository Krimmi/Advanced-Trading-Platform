import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Chip, 
  Grid, 
  Card, 
  CardContent, 
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  CircularProgress,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { 
  Entity, 
  EntityType, 
  DocumentType,
  EntityRecognitionResult
} from '../../models/nlp/NLPTypes';
import { EntityRecognitionService } from '../../services/nlp/EntityRecognitionService';

interface EntityRecognitionPanelProps {
  apiKey: string;
  baseUrl?: string;
  initialText?: string;
  documentType?: DocumentType;
  onEntityClick?: (entity: Entity) => void;
}

const EntityRecognitionPanel: React.FC<EntityRecognitionPanelProps> = ({
  apiKey,
  baseUrl,
  initialText = '',
  documentType = DocumentType.GENERAL,
  onEntityClick
}) => {
  const theme = useTheme();
  const [text, setText] = useState<string>(initialText);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>(documentType);
  const [result, setResult] = useState<EntityRecognitionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [entityService] = useState<EntityRecognitionService>(
    new EntityRecognitionService(apiKey, baseUrl)
  );

  // Entity type colors
  const entityColors: Record<EntityType, string> = {
    [EntityType.COMPANY]: theme.palette.primary.main,
    [EntityType.PERSON]: theme.palette.secondary.main,
    [EntityType.LOCATION]: theme.palette.success.main,
    [EntityType.ORGANIZATION]: theme.palette.info.main,
    [EntityType.PRODUCT]: theme.palette.warning.main,
    [EntityType.EVENT]: theme.palette.error.main,
    [EntityType.DATE]: '#9C27B0', // Purple
    [EntityType.MONEY]: '#4CAF50', // Green
    [EntityType.PERCENTAGE]: '#FF9800', // Orange
    [EntityType.FINANCIAL_METRIC]: '#2196F3', // Blue
    [EntityType.REGULATION]: '#795548', // Brown
    [EntityType.INDUSTRY]: '#607D8B', // Blue Grey
    [EntityType.MARKET]: '#009688', // Teal
    [EntityType.CURRENCY]: '#FFEB3B', // Yellow
    [EntityType.OTHER]: '#9E9E9E' // Grey
  };

  // Process text when component mounts or when initialText changes
  useEffect(() => {
    if (initialText && initialText !== text) {
      setText(initialText);
      analyzeText(initialText, selectedDocType);
    }
  }, [initialText]);

  // Analyze text using the entity recognition service
  const analyzeText = async (textToAnalyze: string, docType: DocumentType) => {
    if (!textToAnalyze.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const recognitionResult = await entityService.recognizeEntities(textToAnalyze, docType);
      setResult(recognitionResult);
    } catch (err) {
      console.error('Error analyzing text:', err);
      setError('Failed to analyze text. Please try again.');
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

  // Handle analyze button click
  const handleAnalyzeClick = () => {
    analyzeText(text, selectedDocType);
  };

  // Render text with highlighted entities
  const renderHighlightedText = () => {
    if (!result || !result.entities || result.entities.length === 0) {
      return <Typography variant="body1">{text}</Typography>;
    }

    // Sort entities by start position (descending) to avoid issues with overlapping entities
    const sortedEntities = [...result.entities].sort((a, b) => b.startChar - a.startChar);
    
    let highlightedText = text;
    
    // Replace entities with highlighted spans
    sortedEntities.forEach(entity => {
      const entityText = highlightedText.substring(entity.startChar, entity.endChar);
      const highlightedEntity = `<span class="entity-highlight" style="background-color: ${entityColors[entity.type]}30; border-bottom: 2px solid ${entityColors[entity.type]}; padding: 0 2px; cursor: pointer;" data-entity-id="${entity.text}_${entity.type}_${entity.startChar}">${entityText}</span>`;
      
      highlightedText = 
        highlightedText.substring(0, entity.startChar) + 
        highlightedEntity + 
        highlightedText.substring(entity.endChar);
    });

    return (
      <Typography 
        variant="body1" 
        component="div"
        dangerouslySetInnerHTML={{ __html: highlightedText }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.classList.contains('entity-highlight')) {
            const entityId = target.getAttribute('data-entity-id');
            if (entityId && onEntityClick) {
              const [text, type, startChar] = entityId.split('_');
              const entity = result.entities.find(
                e => e.text === text && e.type === type && e.startChar === parseInt(startChar)
              );
              if (entity) {
                onEntityClick(entity);
              }
            }
          }
        }}
      />
    );
  };

  // Group entities by type
  const getEntitiesByType = () => {
    if (!result || !result.entities) return {};
    
    const groupedEntities: Record<EntityType, Entity[]> = {} as Record<EntityType, Entity[]>;
    
    result.entities.forEach(entity => {
      if (!groupedEntities[entity.type]) {
        groupedEntities[entity.type] = [];
      }
      groupedEntities[entity.type].push(entity);
    });
    
    return groupedEntities;
  };

  // Get entity type label
  const getEntityTypeLabel = (type: EntityType): string => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Entity Recognition
      </Typography>
      
      <Grid container spacing={2}>
        {/* Input Section */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Text to Analyze"
                    multiline
                    rows={6}
                    value={text}
                    onChange={handleTextChange}
                    fullWidth
                    variant="outlined"
                    placeholder="Enter financial text to analyze..."
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
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
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAnalyzeClick}
                    disabled={loading || !text.trim()}
                    fullWidth
                    sx={{ height: '100%' }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Analyze Text'}
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
            {/* Highlighted Text */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Highlighted Entities
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: theme.palette.background.default, borderRadius: 1 }}>
                    {renderHighlightedText()}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Entity Summary */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Entity Summary
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {Object.entries(getEntitiesByType()).map(([type, entities]) => (
                      <Tooltip 
                        key={type} 
                        title={`${entities.length} ${getEntityTypeLabel(type as EntityType)}${entities.length !== 1 ? 's' : ''}`}
                      >
                        <Chip
                          label={`${getEntityTypeLabel(type as EntityType)}: ${entities.length}`}
                          sx={{ 
                            bgcolor: `${entityColors[type as EntityType]}20`,
                            color: entityColors[type as EntityType],
                            borderColor: entityColors[type as EntityType]
                          }}
                          variant="outlined"
                        />
                      </Tooltip>
                    ))}
                  </Box>
                  <Typography variant="body2">
                    Found {result.entities.length} entities in {text.length} characters of text.
                    {result.modelVersion && ` Model version: ${result.modelVersion}`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Entity Details */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Entity Details
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Entity</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Confidence</TableCell>
                          <TableCell>Metadata</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {result.entities.map((entity, index) => (
                          <TableRow 
                            key={index}
                            hover
                            onClick={() => onEntityClick && onEntityClick(entity)}
                            sx={{ cursor: onEntityClick ? 'pointer' : 'default' }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    bgcolor: entityColors[entity.type],
                                    mr: 1
                                  }}
                                />
                                {entity.text}
                              </Box>
                            </TableCell>
                            <TableCell>{getEntityTypeLabel(entity.type)}</TableCell>
                            <TableCell>{(entity.confidence * 100).toFixed(0)}%</TableCell>
                            <TableCell>
                              {Object.keys(entity.metadata).length > 0 ? (
                                <Tooltip
                                  title={
                                    <Box>
                                      {Object.entries(entity.metadata).map(([key, value]) => (
                                        <Typography variant="body2" key={key}>
                                          <strong>{key}:</strong> {value?.toString() || 'N/A'}
                                        </Typography>
                                      ))}
                                    </Box>
                                  }
                                >
                                  <Button size="small" variant="text">
                                    View Details
                                  </Button>
                                </Tooltip>
                              ) : (
                                'None'
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>
    </Paper>
  );
};

export default EntityRecognitionPanel;