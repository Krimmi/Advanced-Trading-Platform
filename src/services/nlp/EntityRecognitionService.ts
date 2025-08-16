/**
 * EntityRecognitionService - Named Entity Recognition for financial text
 * 
 * This service provides specialized entity recognition for financial documents,
 * identifying companies, people, financial metrics, regulations, and more.
 */

import axios from 'axios';
import { 
  Entity, 
  EntityType, 
  DocumentType, 
  EntityRecognitionResult,
  EntityRelationship
} from '../../models/nlp/NLPTypes';

export class EntityRecognitionService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly entityCache: Map<string, Entity[]>;

  constructor(apiKey: string, baseUrl: string = 'https://api.ninjatechfinance.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.entityCache = new Map<string, Entity[]>();
  }

  /**
   * Recognize entities in financial text
   * @param text The text to analyze
   * @param documentType The type of document being analyzed
   * @returns Promise with entity recognition results
   */
  public async recognizeEntities(
    text: string,
    documentType: DocumentType = DocumentType.GENERAL
  ): Promise<EntityRecognitionResult> {
    try {
      // Generate a cache key
      const cacheKey = `${documentType}_${this.hashText(text)}`;
      
      // Check cache first
      if (this.entityCache.has(cacheKey)) {
        const cachedEntities = this.entityCache.get(cacheKey)!;
        return {
          documentType,
          entities: cachedEntities,
          rawText: text,
          confidence: 1.0, // Using cached results
          processingTime: 0,
          modelVersion: 'cached'
        };
      }
      
      // Call the NLP API for entity recognition
      const response = await axios.post(`${this.baseUrl}/nlp/entity-recognition`, {
        text,
        documentType
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      const result = response.data;
      
      // Process and enhance entities
      const entities = this.enhanceEntities(result.entities, documentType);
      
      // Cache the results
      this.entityCache.set(cacheKey, entities);
      
      return {
        documentType,
        entities,
        rawText: text,
        confidence: result.confidence,
        processingTime: result.processingTime,
        modelVersion: result.modelVersion
      };
    } catch (error) {
      console.error('Error recognizing entities:', error);
      
      // Fallback to local entity extraction for basic entities
      const entities = this.extractBasicEntities(text);
      
      return {
        documentType,
        entities,
        rawText: text,
        confidence: 0.7, // Lower confidence for fallback method
        processingTime: 0,
        modelVersion: 'fallback-local'
      };
    }
  }

  /**
   * Extract entity relationships from text
   * @param text The text to analyze
   * @param documentType The type of document being analyzed
   * @returns Promise with entity relationships
   */
  public async extractEntityRelationships(
    text: string,
    documentType: DocumentType = DocumentType.GENERAL
  ): Promise<EntityRelationship[]> {
    try {
      // First recognize entities
      const entityResult = await this.recognizeEntities(text, documentType);
      
      // If no entities or only one entity, no relationships to extract
      if (entityResult.entities.length <= 1) {
        return [];
      }
      
      // Call the NLP API for relationship extraction
      const response = await axios.post(`${this.baseUrl}/nlp/entity-relationships`, {
        text,
        entities: entityResult.entities,
        documentType
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data.relationships.map((rel: any) => ({
        sourceEntity: entityResult.entities.find(e => e.text === rel.sourceEntity.text)!,
        targetEntity: entityResult.entities.find(e => e.text === rel.targetEntity.text)!,
        relationshipType: rel.relationshipType,
        confidence: rel.confidence
      }));
    } catch (error) {
      console.error('Error extracting entity relationships:', error);
      return [];
    }
  }

  /**
   * Link entities to knowledge base
   * @param entities Array of entities to link
   * @returns Promise with linked entities
   */
  public async linkEntitiesToKnowledgeBase(entities: Entity[]): Promise<Entity[]> {
    try {
      // Filter for entities that can be linked (companies, people, organizations)
      const linkableEntities = entities.filter(entity => 
        [EntityType.COMPANY, EntityType.PERSON, EntityType.ORGANIZATION].includes(entity.type)
      );
      
      if (linkableEntities.length === 0) {
        return entities;
      }
      
      // Call the NLP API for entity linking
      const response = await axios.post(`${this.baseUrl}/nlp/entity-linking`, {
        entities: linkableEntities
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      const linkedEntitiesMap = new Map<string, any>();
      response.data.linkedEntities.forEach((linkedEntity: any) => {
        linkedEntitiesMap.set(
          `${linkedEntity.text}_${linkedEntity.type}_${linkedEntity.startChar}_${linkedEntity.endChar}`, 
          linkedEntity
        );
      });
      
      // Merge linked data with original entities
      return entities.map(entity => {
        const key = `${entity.text}_${entity.type}_${entity.startChar}_${entity.endChar}`;
        const linkedData = linkedEntitiesMap.get(key);
        
        if (linkedData) {
          return {
            ...entity,
            metadata: {
              ...entity.metadata,
              ...linkedData.metadata,
              knowledgeBaseId: linkedData.knowledgeBaseId,
              linkedEntity: true
            }
          };
        }
        
        return entity;
      });
    } catch (error) {
      console.error('Error linking entities to knowledge base:', error);
      return entities;
    }
  }

  /**
   * Track entity mentions over time
   * @param entity The entity to track
   * @param startDate Start date for tracking
   * @param endDate End date for tracking
   * @returns Promise with entity mention trends
   */
  public async trackEntityMentions(
    entity: string,
    entityType: EntityType,
    startDate: Date,
    endDate: Date
  ): Promise<{
    entity: string;
    entityType: EntityType;
    mentionsByDate: {
      date: Date;
      count: number;
      sources: {
        source: string;
        count: number;
      }[];
    }[];
    totalMentions: number;
    sentiment: {
      average: number;
      trend: 'improving' | 'deteriorating' | 'stable';
    };
  }> {
    try {
      // Call the NLP API for entity mention tracking
      const response = await axios.post(`${this.baseUrl}/nlp/entity-mentions`, {
        entity,
        entityType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      const result = response.data;
      
      return {
        entity: result.entity,
        entityType: result.entityType,
        mentionsByDate: result.mentionsByDate.map((item: any) => ({
          date: new Date(item.date),
          count: item.count,
          sources: item.sources
        })),
        totalMentions: result.totalMentions,
        sentiment: result.sentiment
      };
    } catch (error) {
      console.error('Error tracking entity mentions:', error);
      throw new Error('Failed to track entity mentions');
    }
  }

  /**
   * Enhance entities with financial domain knowledge
   * @param rawEntities Raw entities from the API
   * @param documentType The type of document being analyzed
   * @returns Enhanced entities with additional metadata
   */
  private enhanceEntities(rawEntities: any[], documentType: DocumentType): Entity[] {
    return rawEntities.map(entity => {
      // Create base entity
      const enhancedEntity: Entity = {
        text: entity.text,
        type: entity.type as EntityType,
        startChar: entity.startChar,
        endChar: entity.endChar,
        confidence: entity.confidence,
        metadata: entity.metadata || {}
      };

      // Enhance with financial domain knowledge based on entity type
      if (entity.type === EntityType.COMPANY) {
        // Add financial metadata for companies
        enhancedEntity.metadata = {
          ...enhancedEntity.metadata,
          ticker: entity.metadata?.ticker || null,
          exchange: entity.metadata?.exchange || null,
          sector: entity.metadata?.sector || null,
          industry: entity.metadata?.industry || null
        };
      } else if (entity.type === EntityType.PERSON) {
        // Add metadata for people (executives, analysts, etc.)
        enhancedEntity.metadata = {
          ...enhancedEntity.metadata,
          role: entity.metadata?.role || null,
          organization: entity.metadata?.organization || null,
          title: entity.metadata?.title || null
        };
      } else if (entity.type === EntityType.FINANCIAL_METRIC) {
        // Add metadata for financial metrics
        enhancedEntity.metadata = {
          ...enhancedEntity.metadata,
          metricType: entity.metadata?.metricType || null,
          value: entity.metadata?.value || null,
          unit: entity.metadata?.unit || null,
          period: entity.metadata?.period || null,
          changePercent: entity.metadata?.changePercent || null
        };
      } else if (entity.type === EntityType.EVENT) {
        // Add metadata for financial events
        enhancedEntity.metadata = {
          ...enhancedEntity.metadata,
          eventType: entity.metadata?.eventType || null,
          date: entity.metadata?.date || null,
          impact: entity.metadata?.impact || null
        };
      } else if (entity.type === EntityType.REGULATION) {
        // Add metadata for regulations
        enhancedEntity.metadata = {
          ...enhancedEntity.metadata,
          regulationType: entity.metadata?.regulationType || null,
          jurisdiction: entity.metadata?.jurisdiction || null,
          effectiveDate: entity.metadata?.effectiveDate || null
        };
      }

      return enhancedEntity;
    });
  }

  /**
   * Extract basic entities using local patterns (fallback method)
   * @param text The text to analyze
   * @returns Array of basic entities
   */
  private extractBasicEntities(text: string): Entity[] {
    const entities: Entity[] = [];
    
    // Simple pattern matching for companies (e.g., "Apple Inc.", "Google LLC")
    const companyPattern = /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s(?:Inc\.|Corp\.|LLC|Ltd\.|Limited|Group|Holdings)/g;
    let match;
    while ((match = companyPattern.exec(text)) !== null) {
      entities.push({
        text: match[0],
        type: EntityType.COMPANY,
        startChar: match.index,
        endChar: match.index + match[0].length,
        confidence: 0.8,
        metadata: {}
      });
    }
    
    // Simple pattern matching for financial metrics
    const metricPatterns = [
      { pattern: /(\$\d+(?:\.\d+)?(?:\s?[bmtk]illion)?)/gi, type: EntityType.MONEY },
      { pattern: /(\d+(?:\.\d+)?%)/g, type: EntityType.PERCENTAGE },
      { pattern: /(revenue|profit|earnings|EBITDA|EPS|P\/E|margin)/gi, type: EntityType.FINANCIAL_METRIC }
    ];
    
    metricPatterns.forEach(({ pattern, type }) => {
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          text: match[0],
          type: type as EntityType,
          startChar: match.index,
          endChar: match.index + match[0].length,
          confidence: 0.7,
          metadata: {}
        });
      }
    });
    
    return entities;
  }

  /**
   * Simple hash function for text (for caching purposes)
   * @param text The text to hash
   * @returns A hash string
   */
  private hashText(text: string): string {
    let hash = 0;
    if (text.length === 0) return hash.toString();
    
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash.toString();
  }
}

export default EntityRecognitionService;