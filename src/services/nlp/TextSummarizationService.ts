/**
 * TextSummarizationService - Advanced text summarization for financial documents
 * 
 * This service provides specialized text summarization capabilities for financial documents,
 * including earnings call transcripts, SEC filings, news articles, and research reports.
 */

import axios from 'axios';
import { 
  DocumentType, 
  TextSummaryResult
} from '../../models/nlp/NLPTypes';

export class TextSummarizationService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly summaryCache: Map<string, TextSummaryResult>;

  constructor(apiKey: string, baseUrl: string = 'https://api.ninjatechfinance.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.summaryCache = new Map<string, TextSummaryResult>();
  }

  /**
   * Generate a summary of financial text
   * @param text The text to summarize
   * @param maxLength Maximum length of the summary in characters
   * @param documentType The type of document being summarized
   * @returns Promise with text summary results
   */
  public async summarizeText(
    text: string,
    maxLength: number = 500,
    documentType: DocumentType = DocumentType.GENERAL
  ): Promise<TextSummaryResult> {
    try {
      // Generate a cache key
      const cacheKey = `${documentType}_${maxLength}_${this.hashText(text)}`;
      
      // Check cache first
      if (this.summaryCache.has(cacheKey)) {
        return this.summaryCache.get(cacheKey)!;
      }
      
      // Call the NLP API for text summarization
      const response = await axios.post(`${this.baseUrl}/nlp/summarization`, {
        text,
        maxLength,
        documentType
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      const result = response.data;
      
      // Extract key points from the summary
      const keyPoints = this.extractKeyPoints(result.summary, documentType);
      
      const summaryResult: TextSummaryResult = {
        documentType,
        originalText: text,
        summary: result.summary,
        keyPoints,
        compressionRatio: result.compressionRatio,
        modelVersion: result.modelVersion
      };
      
      // Cache the results
      this.summaryCache.set(cacheKey, summaryResult);
      
      return summaryResult;
    } catch (error) {
      console.error('Error generating text summary:', error);
      
      // Fallback to extractive summarization
      return this.extractiveSummarization(text, maxLength, documentType);
    }
  }

  /**
   * Summarize an earnings call transcript
   * @param transcript The earnings call transcript text
   * @param sections Specific sections to focus on (e.g., 'prepared_remarks', 'qa')
   * @returns Promise with summarized earnings call
   */
  public async summarizeEarningsCall(
    transcript: string,
    sections: string[] = ['prepared_remarks', 'qa']
  ): Promise<{
    overallSummary: string;
    sectionSummaries: {
      section: string;
      summary: string;
      keyPoints: string[];
    }[];
    financialMetrics: {
      metric: string;
      value: string;
      change?: string;
      context?: string;
    }[];
    forwardLookingStatements: string[];
  }> {
    try {
      // Call the NLP API for earnings call summarization
      const response = await axios.post(`${this.baseUrl}/nlp/summarize-earnings-call`, {
        transcript,
        sections
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error('Error summarizing earnings call:', error);
      throw new Error('Failed to summarize earnings call');
    }
  }

  /**
   * Summarize an SEC filing
   * @param filingText The SEC filing text
   * @param filingType The type of SEC filing (e.g., '10-K', '10-Q', '8-K')
   * @param sections Specific sections to focus on (e.g., 'risk_factors', 'mda')
   * @returns Promise with summarized SEC filing
   */
  public async summarizeSECFiling(
    filingText: string,
    filingType: string,
    sections: string[] = []
  ): Promise<{
    overallSummary: string;
    sectionSummaries: {
      section: string;
      summary: string;
      keyPoints: string[];
    }[];
    riskFactors: string[];
    significantChanges: {
      item: string;
      change: string;
      impact: string;
    }[];
  }> {
    try {
      // Call the NLP API for SEC filing summarization
      const response = await axios.post(`${this.baseUrl}/nlp/summarize-sec-filing`, {
        filingText,
        filingType,
        sections
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error('Error summarizing SEC filing:', error);
      throw new Error('Failed to summarize SEC filing');
    }
  }

  /**
   * Generate a comparative summary of multiple documents
   * @param texts Array of texts to summarize and compare
   * @param documentType The type of documents being summarized
   * @returns Promise with comparative summary
   */
  public async generateComparativeSummary(
    texts: string[],
    documentType: DocumentType = DocumentType.GENERAL
  ): Promise<{
    individualSummaries: {
      index: number;
      summary: string;
      keyPoints: string[];
    }[];
    commonThemes: string[];
    differences: {
      theme: string;
      variations: {
        index: number;
        perspective: string;
      }[];
    }[];
    overallSummary: string;
  }> {
    try {
      // Call the NLP API for comparative summarization
      const response = await axios.post(`${this.baseUrl}/nlp/comparative-summary`, {
        texts,
        documentType
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error('Error generating comparative summary:', error);
      throw new Error('Failed to generate comparative summary');
    }
  }

  /**
   * Extract key points from a summary
   * @param summary The summary text
   * @param documentType The type of document being summarized
   * @returns Array of key points extracted from the summary
   */
  private extractKeyPoints(summary: string, documentType: DocumentType): string[] {
    // Split the summary into sentences
    const sentences = summary.match(/[^.!?]+[.!?]+/g) || [];
    
    // Filter for sentences that contain important financial information
    const keyPointSentences = sentences.filter(sentence => {
      const lowerSentence = sentence.toLowerCase();
      
      // Financial metrics
      if (/revenue|profit|earnings|eps|ebitda|margin|growth|decline|increase|decrease/.test(lowerSentence)) {
        return true;
      }
      
      // Future outlook
      if (/guidance|outlook|forecast|expect|anticipate|project|future/.test(lowerSentence)) {
        return true;
      }
      
      // Strategic information
      if (/strategy|initiative|launch|expand|acquisition|merger|restructure/.test(lowerSentence)) {
        return true;
      }
      
      // Risk factors
      if (/risk|challenge|uncertainty|litigation|regulatory|compliance/.test(lowerSentence)) {
        return true;
      }
      
      return false;
    });
    
    // Limit to top 5 key points and clean them up
    return keyPointSentences
      .slice(0, 5)
      .map(sentence => sentence.trim());
  }

  /**
   * Fallback extractive summarization method
   * @param text The text to summarize
   * @param maxLength Maximum length of the summary
   * @param documentType The type of document being summarized
   * @returns Basic text summary result
   */
  private extractiveSummarization(
    text: string,
    maxLength: number,
    documentType: DocumentType
  ): TextSummaryResult {
    // Split the text into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    
    if (sentences.length === 0) {
      return {
        documentType,
        originalText: text,
        summary: text.substring(0, maxLength),
        keyPoints: [],
        compressionRatio: 1,
        modelVersion: 'fallback-extractive'
      };
    }
    
    // Score sentences based on position and keyword presence
    const scoredSentences = sentences.map((sentence, index) => {
      let score = 0;
      
      // Position scoring - favor sentences at the beginning and end
      if (index < sentences.length * 0.2) {
        score += 3; // Beginning of text
      } else if (index > sentences.length * 0.8) {
        score += 1; // End of text
      }
      
      // Keyword scoring
      const lowerSentence = sentence.toLowerCase();
      
      // Financial keywords
      const financialKeywords = [
        'revenue', 'profit', 'earnings', 'growth', 'increase', 'decrease',
        'margin', 'guidance', 'outlook', 'forecast', 'strategy', 'acquisition'
      ];
      
      financialKeywords.forEach(keyword => {
        if (lowerSentence.includes(keyword)) {
          score += 2;
        }
      });
      
      // Document type specific keywords
      if (documentType === DocumentType.EARNINGS_CALL) {
        ['quarter', 'year', 'guidance', 'eps', 'beat', 'miss'].forEach(keyword => {
          if (lowerSentence.includes(keyword)) {
            score += 2;
          }
        });
      } else if (documentType === DocumentType.SEC_FILING) {
        ['risk', 'factor', 'material', 'significant', 'adverse'].forEach(keyword => {
          if (lowerSentence.includes(keyword)) {
            score += 2;
          }
        });
      } else if (documentType === DocumentType.NEWS) {
        ['announced', 'reported', 'launched', 'released', 'today'].forEach(keyword => {
          if (lowerSentence.includes(keyword)) {
            score += 2;
          }
        });
      }
      
      return { sentence, score, index };
    });
    
    // Sort by score (descending)
    scoredSentences.sort((a, b) => b.score - a.score);
    
    // Select top sentences up to maxLength
    let summaryText = '';
    let selectedSentences: { sentence: string, index: number }[] = [];
    
    for (const { sentence, index } of scoredSentences) {
      if ((summaryText + sentence).length <= maxLength) {
        selectedSentences.push({ sentence, index });
        summaryText += sentence;
      } else {
        break;
      }
    }
    
    // Sort selected sentences by original position
    selectedSentences.sort((a, b) => a.index - b.index);
    
    // Combine sentences
    const summary = selectedSentences.map(item => item.sentence).join(' ');
    
    // Extract key points
    const keyPoints = this.extractKeyPoints(summary, documentType);
    
    return {
      documentType,
      originalText: text,
      summary,
      keyPoints,
      compressionRatio: summary.length / text.length,
      modelVersion: 'fallback-extractive'
    };
  }

  /**
   * Simple hash function for text (for caching purposes)
   * @param text The text to hash
   * @returns A hash string
   */
  private hashText(text: string): string {
    // Use only the first 1000 characters for hashing
    const truncatedText = text.substring(0, 1000);
    
    let hash = 0;
    if (truncatedText.length === 0) return hash.toString();
    
    for (let i = 0; i < truncatedText.length; i++) {
      const char = truncatedText.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash.toString();
  }
}

export default TextSummarizationService;