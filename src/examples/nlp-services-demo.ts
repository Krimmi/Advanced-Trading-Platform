/**
 * NLP Services Demo
 * 
 * This script demonstrates how to use the NLP services in the hedge fund trading application.
 * It provides examples of entity recognition, topic modeling, text summarization, and trading signals.
 */

import { NLPService } from '../services/nlp/NLPService';
import { EntityRecognitionService } from '../services/nlp/EntityRecognitionService';
import { TopicModelingService } from '../services/nlp/TopicModelingService';
import { TextSummarizationService } from '../services/nlp/TextSummarizationService';
import { TradingSignalsService } from '../services/nlp/TradingSignalsService';
import { DocumentType } from '../models/nlp/NLPTypes';

// Replace with your actual API key
const API_KEY = 'your_api_key_here';
const BASE_URL = 'https://api.ninjatechfinance.com/v1';

// Sample financial text for demonstration
const SAMPLE_TEXT = `
Apple Inc. reported strong quarterly earnings, with revenue reaching $89.5 billion, exceeding analyst expectations.
CEO Tim Cook highlighted the success of iPhone 15 sales and growth in services revenue.
The company announced a 5% increase in its quarterly dividend and authorized an additional $90 billion for share repurchases.
However, sales in China declined by 2.5% year-over-year, causing some concern among investors.
Apple's gross margin improved to 45.2%, and the company expects continued growth in the wearables segment.
CFO Luca Maestri mentioned potential supply chain challenges in the coming quarter due to global semiconductor shortages.
Despite these challenges, Apple remains optimistic about its long-term growth prospects, particularly with the upcoming launch of new AI features.
`;

// Sample collection of texts for topic modeling
const SAMPLE_TEXTS = [
  `Apple Inc. reported strong quarterly earnings, with revenue reaching $89.5 billion, exceeding analyst expectations. CEO Tim Cook highlighted the success of iPhone 15 sales and growth in services revenue.`,
  `Microsoft Corporation announced a new AI-powered version of its Office suite, integrating GPT-4 capabilities across Word, Excel, and PowerPoint. CEO Satya Nadella emphasized the company's commitment to AI innovation.`,
  `Tesla delivered 422,875 vehicles in the first quarter, up 36% year-over-year but slightly below Wall Street expectations. The company cited production challenges at its Berlin and Austin factories.`,
  `Amazon Web Services announced price reductions for several cloud services, intensifying competition with Microsoft Azure and Google Cloud. The move is expected to accelerate cloud adoption among small businesses.`,
  `Google unveiled its latest Pixel smartphone with enhanced AI photography features and improved battery life. The device will compete directly with Apple's iPhone and Samsung's Galaxy series.`
];

/**
 * Entity Recognition Demo
 */
async function entityRecognitionDemo() {
  console.log('=== Entity Recognition Demo ===');
  
  const entityService = new EntityRecognitionService(API_KEY, BASE_URL);
  
  try {
    console.log('Analyzing text for entities...');
    const result = await entityService.recognizeEntities(SAMPLE_TEXT, DocumentType.NEWS);
    
    console.log(`Found ${result.entities.length} entities:`);
    result.entities.forEach(entity => {
      console.log(`- ${entity.text} (${entity.type}) [Confidence: ${(entity.confidence * 100).toFixed(0)}%]`);
      
      if (Object.keys(entity.metadata).length > 0) {
        console.log('  Metadata:');
        Object.entries(entity.metadata).forEach(([key, value]) => {
          console.log(`    ${key}: ${value}`);
        });
      }
    });
    
    console.log(`\nModel version: ${result.modelVersion}`);
    console.log(`Processing time: ${result.processingTime}s`);
  } catch (error) {
    console.error('Error in entity recognition demo:', error);
  }
}

/**
 * Topic Modeling Demo
 */
async function topicModelingDemo() {
  console.log('\n=== Topic Modeling Demo ===');
  
  const topicService = new TopicModelingService(API_KEY, BASE_URL);
  
  try {
    console.log('Extracting topics from text collection...');
    const result = await topicService.extractTopics(SAMPLE_TEXTS, 3, DocumentType.NEWS);
    
    console.log(`Found ${result.topics.length} topics:`);
    result.topics.forEach(topic => {
      console.log(`- ${topic.name} (Weight: ${(topic.weight * 100).toFixed(1)}%, Sentiment: ${topic.sentimentScore.toFixed(2)})`);
      console.log(`  Keywords: ${topic.keywords.join(', ')}`);
    });
    
    console.log(`\nCoherence score: ${result.coherenceScore?.toFixed(3) || 'N/A'}`);
    console.log(`Model version: ${result.modelVersion}`);
  } catch (error) {
    console.error('Error in topic modeling demo:', error);
  }
}

/**
 * Text Summarization Demo
 */
async function textSummarizationDemo() {
  console.log('\n=== Text Summarization Demo ===');
  
  const summarizationService = new TextSummarizationService(API_KEY, BASE_URL);
  
  try {
    console.log('Generating summary...');
    const result = await summarizationService.summarizeText(SAMPLE_TEXT, 200, DocumentType.NEWS);
    
    console.log('Summary:');
    console.log(result.summary);
    
    if (result.keyPoints && result.keyPoints.length > 0) {
      console.log('\nKey Points:');
      result.keyPoints.forEach((point, index) => {
        console.log(`${index + 1}. ${point}`);
      });
    }
    
    console.log(`\nCompression ratio: ${(result.compressionRatio * 100).toFixed(1)}%`);
    console.log(`Original length: ${result.originalText.length} characters`);
    console.log(`Summary length: ${result.summary.length} characters`);
    console.log(`Model version: ${result.modelVersion}`);
  } catch (error) {
    console.error('Error in text summarization demo:', error);
  }
}

/**
 * Trading Signals Demo
 */
async function tradingSignalsDemo() {
  console.log('\n=== Trading Signals Demo ===');
  
  const signalsService = new TradingSignalsService(API_KEY, BASE_URL);
  
  try {
    console.log('Generating trading signals for AAPL...');
    const signals = await signalsService.generateTradingSignals('AAPL', ['news', 'social_media']);
    
    console.log(`Generated ${signals.length} trading signals:`);
    signals.forEach((signal, index) => {
      console.log(`\nSignal ${index + 1}:`);
      console.log(`- Direction: ${signal.direction}`);
      console.log(`- Type: ${signal.signalType}`);
      console.log(`- Source: ${signal.source}`);
      console.log(`- Strength: ${(signal.strength.value * 100).toFixed(0)}%`);
      console.log(`- Confidence: ${(signal.confidence.value * 100).toFixed(0)}%`);
      console.log(`- Timeframe: ${signal.timeframe}`);
      console.log(`- Explanation: ${signal.explanation}`);
      
      if (signal.supportingEvidence && signal.supportingEvidence.length > 0) {
        console.log('- Supporting Evidence:');
        signal.supportingEvidence.forEach(evidence => {
          console.log(`  * ${evidence.text}`);
        });
      }
    });
  } catch (error) {
    console.error('Error in trading signals demo:', error);
  }
}

/**
 * Unified NLP Service Demo
 */
async function unifiedNLPServiceDemo() {
  console.log('\n=== Unified NLP Service Demo ===');
  
  const nlpService = new NLPService(API_KEY, BASE_URL);
  
  try {
    console.log('Using the unified NLP service...');
    
    // Entity recognition
    console.log('\nRecognizing entities:');
    const entityResult = await nlpService.recognizeEntities(SAMPLE_TEXT, DocumentType.NEWS);
    console.log(`Found ${entityResult.entities.length} entities`);
    
    // Generate trading signals
    console.log('\nGenerating trading signals:');
    const signals = await nlpService.generateTradingSignals('AAPL');
    console.log(`Generated ${signals.length} trading signals`);
    
    console.log('\nNLP service model versions:');
    console.log(`- Sentiment: ${nlpService.getModelVersion('sentiment' as any)}`);
    console.log(`- Entity Recognition: ${nlpService.getModelVersion('entity_recognition' as any)}`);
    console.log(`- Topic Modeling: ${nlpService.getModelVersion('topic_modeling' as any)}`);
    console.log(`- Summarization: ${nlpService.getModelVersion('summarization' as any)}`);
    console.log(`- Trading Signals: ${nlpService.getModelVersion('trading_signals' as any)}`);
  } catch (error) {
    console.error('Error in unified NLP service demo:', error);
  }
}

/**
 * Run all demos
 */
async function runAllDemos() {
  console.log('Starting NLP Services Demo...\n');
  
  await entityRecognitionDemo();
  await topicModelingDemo();
  await textSummarizationDemo();
  await tradingSignalsDemo();
  await unifiedNLPServiceDemo();
  
  console.log('\nNLP Services Demo completed.');
}

// Run the demo
runAllDemos().catch(error => {
  console.error('Error running NLP Services Demo:', error);
});

/**
 * Note: To run this demo, you need to:
 * 1. Replace 'your_api_key_here' with your actual API key
 * 2. Ensure you have network connectivity to the API
 * 3. Run the script with Node.js:
 *    npx ts-node src/examples/nlp-services-demo.ts
 */