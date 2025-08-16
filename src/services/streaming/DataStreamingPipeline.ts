import { EventEmitter } from 'events';

/**
 * Interface for a data processor in the pipeline
 */
export interface DataProcessor<T, U> {
  process(data: T): U | Promise<U>;
  name: string;
}

/**
 * Pipeline stage configuration
 */
export interface PipelineStageConfig<T, U> {
  processor: DataProcessor<T, U>;
  bufferSize?: number;
  throttleRate?: number; // Items per second
  dropStrategy?: 'oldest' | 'newest' | 'none';
}

/**
 * Pipeline stage that processes data and handles backpressure
 */
class PipelineStage<T, U> extends EventEmitter {
  private processor: DataProcessor<T, U>;
  private buffer: T[] = [];
  private maxBufferSize: number;
  private processing: boolean = false;
  private throttleRate: number;
  private lastProcessTime: number = 0;
  private dropStrategy: 'oldest' | 'newest' | 'none';
  private metrics = {
    processed: 0,
    dropped: 0,
    errors: 0,
    bufferHighWaterMark: 0,
    averageProcessingTime: 0,
    totalProcessingTime: 0
  };

  /**
   * Creates a new pipeline stage
   * @param config Stage configuration
   */
  constructor(config: PipelineStageConfig<T, U>) {
    super();
    this.processor = config.processor;
    this.maxBufferSize = config.bufferSize || 1000;
    this.throttleRate = config.throttleRate || 0; // 0 means no throttling
    this.dropStrategy = config.dropStrategy || 'oldest';
  }

  /**
   * Pushes data into the pipeline stage
   * @param data Data to process
   * @returns True if data was accepted, false if dropped
   */
  public push(data: T): boolean {
    // Check if buffer is full
    if (this.buffer.length >= this.maxBufferSize) {
      switch (this.dropStrategy) {
        case 'oldest':
          this.buffer.shift(); // Remove oldest item
          this.metrics.dropped++;
          break;
        case 'newest':
          this.metrics.dropped++;
          return false; // Drop the new item
        case 'none':
          // Block until buffer has space
          return false;
      }
    }
    
    // Add to buffer
    this.buffer.push(data);
    
    // Update metrics
    if (this.buffer.length > this.metrics.bufferHighWaterMark) {
      this.metrics.bufferHighWaterMark = this.buffer.length;
    }
    
    // Start processing if not already
    if (!this.processing) {
      this.processNext();
    }
    
    return true;
  }

  /**
   * Processes the next item in the buffer
   */
  private async processNext(): Promise<void> {
    if (this.buffer.length === 0) {
      this.processing = false;
      this.emit('idle');
      return;
    }
    
    this.processing = true;
    
    // Apply throttling if needed
    if (this.throttleRate > 0) {
      const now = Date.now();
      const minInterval = 1000 / this.throttleRate;
      const elapsed = now - this.lastProcessTime;
      
      if (elapsed < minInterval) {
        // Wait until we can process the next item
        await new Promise(resolve => setTimeout(resolve, minInterval - elapsed));
      }
    }
    
    // Get next item
    const item = this.buffer.shift()!;
    const startTime = Date.now();
    
    try {
      // Process the item
      const result = await Promise.resolve(this.processor.process(item));
      
      // Update metrics
      this.metrics.processed++;
      const processingTime = Date.now() - startTime;
      this.metrics.totalProcessingTime += processingTime;
      this.metrics.averageProcessingTime = this.metrics.totalProcessingTime / this.metrics.processed;
      this.lastProcessTime = Date.now();
      
      // Emit the result
      this.emit('data', result);
    } catch (error) {
      this.metrics.errors++;
      this.emit('error', error, item);
    }
    
    // Process next item
    setImmediate(() => this.processNext());
  }

  /**
   * Gets the current metrics for this stage
   * @returns Stage metrics
   */
  public getMetrics(): any {
    return {
      ...this.metrics,
      bufferSize: this.buffer.length,
      processorName: this.processor.name
    };
  }

  /**
   * Clears the buffer
   */
  public clear(): void {
    const droppedCount = this.buffer.length;
    this.buffer = [];
    this.metrics.dropped += droppedCount;
    this.emit('cleared', droppedCount);
  }

  /**
   * Gets the current buffer size
   * @returns Current buffer size
   */
  public getBufferSize(): number {
    return this.buffer.length;
  }

  /**
   * Checks if the stage is currently processing
   * @returns True if processing, false otherwise
   */
  public isProcessing(): boolean {
    return this.processing;
  }
}

/**
 * DataStreamingPipeline manages a series of processing stages for streaming data
 */
export class DataStreamingPipeline<T> extends EventEmitter {
  private stages: PipelineStage<any, any>[] = [];
  private name: string;
  private active: boolean = false;
  private priorityThreshold: number = 0;

  /**
   * Creates a new data streaming pipeline
   * @param name Pipeline name
   */
  constructor(name: string) {
    super();
    this.name = name;
  }

  /**
   * Adds a processing stage to the pipeline
   * @param config Stage configuration
   * @returns This pipeline for chaining
   */
  public addStage<U, V>(config: PipelineStageConfig<U, V>): DataStreamingPipeline<T> {
    const stage = new PipelineStage<U, V>(config);
    
    // Connect stage events
    stage.on('error', (error, item) => {
      this.emit('stageError', {
        stageName: config.processor.name,
        error,
        item
      });
    });
    
    // If this is not the first stage, connect it to the previous stage
    if (this.stages.length > 0) {
      const previousStage = this.stages[this.stages.length - 1];
      previousStage.on('data', (data) => {
        const accepted = stage.push(data);
        if (!accepted) {
          this.emit('backpressure', {
            stageName: config.processor.name,
            bufferSize: stage.getBufferSize()
          });
        }
      });
    }
    
    this.stages.push(stage);
    return this;
  }

  /**
   * Pushes data into the pipeline
   * @param data Data to process
   * @param priority Priority of the data (higher numbers = higher priority)
   * @returns True if data was accepted, false if dropped
   */
  public push(data: T, priority: number = 0): boolean {
    if (!this.active) {
      return false;
    }
    
    // Skip low priority data when under backpressure
    if (priority < this.priorityThreshold) {
      this.emit('dropped', { reason: 'priority', data });
      return false;
    }
    
    // Push to first stage
    if (this.stages.length > 0) {
      const accepted = this.stages[0].push(data);
      
      if (!accepted) {
        this.emit('backpressure', {
          stageName: this.stages[0].processor.name,
          bufferSize: this.stages[0].getBufferSize()
        });
      }
      
      return accepted;
    }
    
    return false;
  }

  /**
   * Starts the pipeline
   */
  public start(): void {
    this.active = true;
    this.emit('started');
  }

  /**
   * Stops the pipeline
   */
  public stop(): void {
    this.active = false;
    this.emit('stopped');
  }

  /**
   * Sets the priority threshold for backpressure
   * @param threshold Priority threshold (items with lower priority will be dropped)
   */
  public setPriorityThreshold(threshold: number): void {
    this.priorityThreshold = threshold;
    this.emit('priorityThresholdChanged', threshold);
  }

  /**
   * Gets the current priority threshold
   * @returns Current priority threshold
   */
  public getPriorityThreshold(): number {
    return this.priorityThreshold;
  }

  /**
   * Clears all buffers in the pipeline
   */
  public clear(): void {
    this.stages.forEach(stage => stage.clear());
    this.emit('cleared');
  }

  /**
   * Gets metrics for all stages
   * @returns Array of stage metrics
   */
  public getMetrics(): any[] {
    return this.stages.map(stage => stage.getMetrics());
  }

  /**
   * Gets the pipeline name
   * @returns Pipeline name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Checks if the pipeline is active
   * @returns True if active, false otherwise
   */
  public isActive(): boolean {
    return this.active;
  }
}

/**
 * Factory for creating common data processors
 */
export class DataProcessorFactory {
  /**
   * Creates a filtering processor
   * @param predicate Filter function
   * @param name Processor name
   * @returns Filter processor
   */
  public static createFilter<T>(predicate: (data: T) => boolean, name: string): DataProcessor<T, T> {
    return {
      process: (data: T) => predicate(data) ? data : null as any,
      name
    };
  }

  /**
   * Creates a mapping processor
   * @param mapper Mapping function
   * @param name Processor name
   * @returns Mapper processor
   */
  public static createMapper<T, U>(mapper: (data: T) => U, name: string): DataProcessor<T, U> {
    return {
      process: mapper,
      name
    };
  }

  /**
   * Creates a batching processor
   * @param batchSize Batch size
   * @param maxWaitMs Maximum wait time in milliseconds
   * @param name Processor name
   * @returns Batching processor
   */
  public static createBatcher<T>(batchSize: number, maxWaitMs: number, name: string): DataProcessor<T, T[]> {
    let batch: T[] = [];
    let timer: NodeJS.Timeout | null = null;
    
    return {
      process: (data: T) => {
        batch.push(data);
        
        if (batch.length >= batchSize) {
          const result = [...batch];
          batch = [];
          
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
          
          return result;
        }
        
        if (!timer && maxWaitMs > 0) {
          timer = setTimeout(() => {
            if (batch.length > 0) {
              const result = [...batch];
              batch = [];
              return result;
            }
          }, maxWaitMs);
        }
        
        return null as any;
      },
      name
    };
  }

  /**
   * Creates a throttling processor
   * @param rateLimit Maximum items per second
   * @param name Processor name
   * @returns Throttling processor
   */
  public static createThrottler<T>(rateLimit: number, name: string): DataProcessor<T, T> {
    let lastProcessTime = 0;
    const minInterval = 1000 / rateLimit;
    
    return {
      process: async (data: T) => {
        const now = Date.now();
        const elapsed = now - lastProcessTime;
        
        if (elapsed < minInterval) {
          await new Promise(resolve => setTimeout(resolve, minInterval - elapsed));
        }
        
        lastProcessTime = Date.now();
        return data;
      },
      name
    };
  }

  /**
   * Creates a deduplication processor
   * @param keyExtractor Function to extract key from data
   * @param windowMs Time window for deduplication in milliseconds
   * @param name Processor name
   * @returns Deduplication processor
   */
  public static createDeduplicator<T>(
    keyExtractor: (data: T) => string, 
    windowMs: number, 
    name: string
  ): DataProcessor<T, T> {
    const seen = new Map<string, number>();
    
    // Periodically clean up old entries
    setInterval(() => {
      const now = Date.now();
      for (const [key, timestamp] of seen.entries()) {
        if (now - timestamp > windowMs) {
          seen.delete(key);
        }
      }
    }, Math.min(windowMs, 60000)); // Clean up at most once per minute
    
    return {
      process: (data: T) => {
        const key = keyExtractor(data);
        const now = Date.now();
        
        if (seen.has(key) && now - seen.get(key)! < windowMs) {
          return null as any; // Duplicate within window
        }
        
        seen.set(key, now);
        return data;
      },
      name
    };
  }
}