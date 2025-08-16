# NLP Services for Hedge Fund Trading Application

## Overview

This module provides advanced Natural Language Processing (NLP) capabilities for financial text analysis, including sentiment analysis, entity recognition, topic modeling, text summarization, and NLP-based trading signals.

## Services

### 1. NLPService

The core service that provides a unified interface for all NLP-related functionality.

```typescript
import { NLPService } from '../../services/nlp/NLPService';

const nlpService = new NLPService(apiKey, baseUrl);
```

Key features:
- Entity recognition for financial text
- Topic modeling for document collections
- Text summarization for financial documents
- NLP-based trading signals

### 2. AdvancedSentimentService

Enhanced sentiment analysis for financial text.

```typescript
import { AdvancedSentimentService } from '../../services/nlp/AdvancedSentimentService';

const sentimentService = new AdvancedSentimentService(apiKey, baseUrl);
```

Key features:
- Aspect-based sentiment analysis
- Comparative sentiment analysis
- Sentiment trend analysis
- Sentiment anomaly detection
- Sentiment-based trading signals

### 3. EntityRecognitionService

Specialized entity recognition for financial documents.

```typescript
import { EntityRecognitionService } from '../../services/nlp/EntityRecognitionService';

const entityService = new EntityRecognitionService(apiKey, baseUrl);
```

Key features:
- Financial entity recognition (companies, people, metrics, etc.)
- Entity relationship extraction
- Entity linking to knowledge base
- Entity mention tracking

### 4. TopicModelingService

Topic modeling for financial document collections.

```typescript
import { TopicModelingService } from '../../services/nlp/TopicModelingService';

const topicService = new TopicModelingService(apiKey, baseUrl);
```

Key features:
- Topic extraction from document collections
- Topic trend analysis
- Document clustering
- Similar document finding
- Topic-based trading signals

### 5. TextSummarizationService

Text summarization for financial documents.

```typescript
import { TextSummarizationService } from '../../services/nlp/TextSummarizationService';

const summarizationService = new TextSummarizationService(apiKey, baseUrl);
```

Key features:
- General text summarization
- Earnings call transcript summarization
- SEC filing summarization
- Comparative document summarization

### 6. TradingSignalsService

Generate trading signals based on NLP analysis.

```typescript
import { TradingSignalsService } from '../../services/nlp/TradingSignalsService';

const signalsService = new TradingSignalsService(apiKey, baseUrl);
```

Key features:
- Sentiment-based trading signals
- Topic-based trading signals
- Anomaly-based trading signals
- Event-based trading signals

## UI Components

The following UI components are available for displaying NLP analysis results:

1. `EntityRecognitionPanel` - Display entity recognition results
2. `TopicModelingPanel` - Display topic modeling results
3. `TextSummarizationPanel` - Display text summarization results
4. `TradingSignalsPanel` - Display NLP-based trading signals

## Integration

The NLP Dashboard page (`NLPDashboardPage.tsx`) integrates all NLP components into a unified interface.

## Usage Example

```typescript
import { NLPService } from '../../services/nlp/NLPService';
import { DocumentType } from '../../models/nlp/NLPTypes';

// Initialize the NLP service
const nlpService = new NLPService(apiKey, baseUrl);

// Analyze financial text
const text = "Apple Inc. reported strong quarterly earnings, with revenue reaching $89.5 billion.";

// Recognize entities
const entityResult = await nlpService.recognizeEntities(text, DocumentType.NEWS);

// Generate trading signals
const signals = await nlpService.generateTradingSignals("AAPL");
```

## Data Models

The NLP module uses the following data models:

- `NLPTypes.ts` - Type definitions for all NLP-related functionality
- `Entity` - Represents an entity recognized in text
- `Topic` - Represents a topic identified in text
- `NLPSignal` - Represents an NLP-based trading signal

## Dependencies

- API access to NLP services (requires valid API key)
- React and Material-UI for UI components
- Chart.js for data visualization