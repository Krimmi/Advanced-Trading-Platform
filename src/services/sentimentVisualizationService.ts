/**
 * Sentiment Visualization Service
 * 
 * This service prepares sentiment data for visualization in the frontend,
 * including charts, graphs, and other visual representations.
 */

import { 
  SentimentAnalysisResult, 
  SentimentSource,
  SentimentTrend,
  EntitySentiment
} from '../types/sentimentTypes';

import {
  SocialMediaAnalysisResult,
  SocialMediaMetrics,
  TopicDistribution
} from '../types/socialMediaTypes';

import {
  NewsAnalysisResult,
  NewsImpact,
  NewsTrend
} from '../types/newsTypes';

import {
  BehavioralMetricsResult,
  BehavioralIndicator,
  TradingPattern,
  MarketAnomaly
} from '../types/behavioralTypes';

export class SentimentVisualizationService {
  /**
   * Prepare sentiment overview data for visualization
   * @param sentimentData Aggregated sentiment data from different sources
   * @returns Formatted data for sentiment overview visualization
   */
  public prepareSentimentOverview(sentimentData: {
    ticker: string;
    sources: SentimentAnalysisResult[];
    overallScore: number;
    overallClassification: string;
    entitySentiment: EntitySentiment[];
    timestamp: Date;
  }): {
    ticker: string;
    overallSentiment: {
      score: number;
      classification: string;
      color: string;
    };
    sourceSentiments: {
      source: string;
      score: number;
      classification: string;
      color: string;
    }[];
    sentimentTrend: {
      source: string;
      direction: string;
      magnitude: number;
      volatility: number;
      directionIcon: string;
    }[];
    timestamp: Date;
  } {
    // Map sentiment classification to colors
    const sentimentColors = {
      'positive': '#4CAF50',
      'neutral': '#9E9E9E',
      'negative': '#F44336'
    };
    
    // Map trend direction to icons
    const directionIcons = {
      'improving': 'trending_up',
      'deteriorating': 'trending_down',
      'stable': 'trending_flat'
    };
    
    // Format overall sentiment
    const overallSentiment = {
      score: sentimentData.overallScore,
      classification: sentimentData.overallClassification,
      color: sentimentColors[sentimentData.overallClassification as keyof typeof sentimentColors]
    };
    
    // Format source sentiments
    const sourceSentiments = sentimentData.sources.map(source => ({
      source: this.formatSourceName(source.source),
      score: source.aggregateScore,
      classification: source.aggregateClassification,
      color: sentimentColors[source.aggregateClassification as keyof typeof sentimentColors]
    }));
    
    // Format sentiment trends
    const sentimentTrend = sentimentData.sources.map(source => ({
      source: this.formatSourceName(source.source),
      direction: source.trend.direction,
      magnitude: source.trend.magnitude,
      volatility: source.trend.volatility,
      directionIcon: directionIcons[source.trend.direction as keyof typeof directionIcons]
    }));
    
    return {
      ticker: sentimentData.ticker,
      overallSentiment,
      sourceSentiments,
      sentimentTrend,
      timestamp: sentimentData.timestamp
    };
  }

  /**
   * Format source name for display
   * @param source Sentiment source enum value
   * @returns Formatted source name
   */
  private formatSourceName(source: SentimentSource): string {
    switch (source) {
      case SentimentSource.NEWS:
        return 'News';
      case SentimentSource.SOCIAL_MEDIA:
        return 'Social Media';
      case SentimentSource.EARNINGS_CALL:
        return 'Earnings Calls';
      case SentimentSource.SEC_FILING:
        return 'SEC Filings';
      default:
        return 'Unknown';
    }
  }

  /**
   * Prepare sentiment time series data for visualization
   * @param sentimentData Sentiment data from different sources
   * @param timeframe Timeframe for the time series in days
   * @returns Formatted data for sentiment time series visualization
   */
  public prepareSentimentTimeSeries(
    sentimentData: SentimentAnalysisResult[],
    timeframe: number = 30
  ): {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }[];
  } {
    // Define colors for different sources
    const sourceColors = {
      [SentimentSource.NEWS]: {
        border: 'rgba(54, 162, 235, 1)',
        background: 'rgba(54, 162, 235, 0.2)'
      },
      [SentimentSource.SOCIAL_MEDIA]: {
        border: 'rgba(255, 99, 132, 1)',
        background: 'rgba(255, 99, 132, 0.2)'
      },
      [SentimentSource.EARNINGS_CALL]: {
        border: 'rgba(75, 192, 192, 1)',
        background: 'rgba(75, 192, 192, 0.2)'
      },
      [SentimentSource.SEC_FILING]: {
        border: 'rgba(153, 102, 255, 1)',
        background: 'rgba(153, 102, 255, 0.2)'
      }
    };
    
    // Generate date labels for the timeframe
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframe);
    
    const labels: string[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      labels.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Prepare datasets for each source
    const datasets = sentimentData.map(source => {
      // Group sentiment items by date
      const sentimentByDate: { [date: string]: number[] } = {};
      
      labels.forEach(date => {
        sentimentByDate[date] = [];
      });
      
      source.sentimentItems.forEach((item: any) => {
        const itemDate = new Date(item.date).toISOString().split('T')[0];
        if (sentimentByDate[itemDate]) {
          sentimentByDate[itemDate].push(item.score);
        }
      });
      
      // Calculate average sentiment for each date
      const data = labels.map(date => {
        const scores = sentimentByDate[date];
        if (scores.length === 0) return null; // No data for this date
        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
      });
      
      return {
        label: this.formatSourceName(source.source),
        data,
        borderColor: sourceColors[source.source].border,
        backgroundColor: sourceColors[source.source].background
      };
    });
    
    return {
      labels,
      datasets
    };
  }

  /**
   * Prepare entity sentiment data for visualization
   * @param entitySentiment Entity sentiment data
   * @returns Formatted data for entity sentiment visualization
   */
  public prepareEntitySentimentVisualization(
    entitySentiment: EntitySentiment[]
  ): {
    entities: {
      name: string;
      mentions: number;
      score: number;
      classification: string;
      color: string;
    }[];
  } {
    // Map sentiment classification to colors
    const sentimentColors = {
      'positive': '#4CAF50',
      'neutral': '#9E9E9E',
      'negative': '#F44336'
    };
    
    // Format entity sentiment data
    const entities = entitySentiment.map(entity => ({
      name: entity.entity,
      mentions: entity.mentions,
      score: entity.score,
      classification: entity.classification,
      color: sentimentColors[entity.classification as keyof typeof sentimentColors]
    }));
    
    return { entities };
  }

  /**
   * Prepare social media metrics data for visualization
   * @param socialData Social media analysis result
   * @returns Formatted data for social media metrics visualization
   */
  public prepareSocialMediaMetricsVisualization(
    socialData: SocialMediaAnalysisResult
  ): {
    sentimentDistribution: {
      labels: string[];
      data: number[];
      backgroundColor: string[];
    };
    platformDistribution: {
      labels: string[];
      data: number[];
      backgroundColor: string[];
    };
    postFrequency: {
      hourly: {
        labels: string[];
        data: number[];
      };
      daily: {
        labels: string[];
        data: number[];
      };
    };
    topInfluencers: {
      author: string;
      platform: string;
      followers: number;
      posts: number;
      averageEngagement: number;
      averageSentiment: number;
      sentimentColor: string;
      isVerified: boolean;
    }[];
  } {
    const metrics = socialData.metrics;
    
    // Prepare sentiment distribution data
    const sentimentDistribution = {
      labels: ['Positive', 'Neutral', 'Negative'],
      data: [
        metrics.sentimentDistribution.positive * 100,
        metrics.sentimentDistribution.neutral * 100,
        metrics.sentimentDistribution.negative * 100
      ],
      backgroundColor: ['#4CAF50', '#9E9E9E', '#F44336']
    };
    
    // Prepare platform distribution data
    const platformLabels = Object.keys(metrics.platformDistribution).map(platform => 
      platform.charAt(0).toUpperCase() + platform.slice(1)
    );
    
    const platformData = Object.values(metrics.platformDistribution).map(value => value * 100);
    
    const platformColors = [
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 99, 132, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)'
    ];
    
    const platformDistribution = {
      labels: platformLabels,
      data: platformData,
      backgroundColor: platformColors.slice(0, platformLabels.length)
    };
    
    // Prepare post frequency data
    const hourlyLabels = metrics.postFrequency.hourly.map(item => `${item.hour}:00`);
    const hourlyData = metrics.postFrequency.hourly.map(item => item.count);
    
    const dailyLabels = metrics.postFrequency.daily.map(item => item.date);
    const dailyData = metrics.postFrequency.daily.map(item => item.count);
    
    const postFrequency = {
      hourly: {
        labels: hourlyLabels,
        data: hourlyData
      },
      daily: {
        labels: dailyLabels,
        data: dailyData
      }
    };
    
    // Prepare top influencers data
    const sentimentColors = {
      'positive': '#4CAF50',
      'neutral': '#9E9E9E',
      'negative': '#F44336'
    };
    
    const topInfluencers = socialData.influencers.map(influencer => {
      let sentimentClassification = 'neutral';
      if (influencer.averageSentiment > 0.2) sentimentClassification = 'positive';
      else if (influencer.averageSentiment < -0.2) sentimentClassification = 'negative';
      
      return {
        author: influencer.author,
        platform: influencer.platform,
        followers: influencer.followers,
        posts: influencer.posts,
        averageEngagement: influencer.averageEngagement,
        averageSentiment: influencer.averageSentiment,
        sentimentColor: sentimentColors[sentimentClassification as keyof typeof sentimentColors],
        isVerified: influencer.isVerified
      };
    });
    
    return {
      sentimentDistribution,
      platformDistribution,
      postFrequency,
      topInfluencers
    };
  }

  /**
   * Prepare topic distribution data for visualization
   * @param topics Topic distribution data
   * @returns Formatted data for topic distribution visualization
   */
  public prepareTopicDistributionVisualization(
    topics: TopicDistribution[]
  ): {
    topics: {
      name: string;
      percentage: number;
      sentiment: number;
      sentimentColor: string;
      keywords: string[];
    }[];
    wordCloud: {
      text: string;
      value: number;
      sentiment: number;
    }[];
  } {
    // Map sentiment score to colors
    const getSentimentColor = (score: number): string => {
      if (score > 0.2) return '#4CAF50';
      if (score < -0.2) return '#F44336';
      return '#9E9E9E';
    };
    
    // Format topics data
    const formattedTopics = topics.map(topic => ({
      name: topic.topic,
      percentage: topic.percentage * 100,
      sentiment: topic.sentimentByTopic,
      sentimentColor: getSentimentColor(topic.sentimentByTopic),
      keywords: topic.keywords
    }));
    
    // Create word cloud data
    const wordCloud = topics.flatMap(topic => 
      topic.keywords.map(keyword => ({
        text: keyword,
        value: Math.round(topic.frequency * 10) + 10, // Scale for better visualization
        sentiment: topic.sentimentByTopic
      }))
    );
    
    return {
      topics: formattedTopics,
      wordCloud
    };
  }

  /**
   * Prepare news impact data for visualization
   * @param newsImpact News impact data
   * @returns Formatted data for news impact visualization
   */
  public prepareNewsImpactVisualization(
    newsImpact: NewsImpact
  ): {
    impactMetrics: {
      name: string;
      score: number;
      classification: string;
      confidence: number;
      color: string;
    }[];
    significantArticles: {
      title: string;
      url: string;
      date: string;
      sentiment: number;
      sentimentColor: string;
      relevance: number;
    }[];
  } {
    // Map sentiment classification to colors
    const sentimentColors = {
      'positive': '#4CAF50',
      'neutral': '#9E9E9E',
      'negative': '#F44336'
    };
    
    // Format impact metrics
    const impactMetrics = [
      {
        name: 'Overall Impact',
        score: newsImpact.overall.score,
        classification: newsImpact.overall.classification,
        confidence: newsImpact.overall.confidence,
        color: sentimentColors[newsImpact.overall.classification as keyof typeof sentimentColors]
      },
      {
        name: 'Short-Term Impact',
        score: newsImpact.shortTerm.score,
        classification: newsImpact.shortTerm.classification,
        confidence: newsImpact.shortTerm.confidence,
        color: sentimentColors[newsImpact.shortTerm.classification as keyof typeof sentimentColors]
      },
      {
        name: 'Long-Term Impact',
        score: newsImpact.longTerm.score,
        classification: newsImpact.longTerm.classification,
        confidence: newsImpact.longTerm.confidence,
        color: sentimentColors[newsImpact.longTerm.classification as keyof typeof sentimentColors]
      }
    ];
    
    // Format significant articles
    const significantArticles = newsImpact.significantArticles.map(article => {
      let sentimentColor = '#9E9E9E';
      if (article.sentiment.score > 0.2) sentimentColor = '#4CAF50';
      else if (article.sentiment.score < -0.2) sentimentColor = '#F44336';
      
      return {
        title: article.title,
        url: article.url,
        date: article.publishedAt.toLocaleDateString(),
        sentiment: article.sentiment.score,
        sentimentColor,
        relevance: article.relevance
      };
    });
    
    return {
      impactMetrics,
      significantArticles
    };
  }

  /**
   * Prepare news trends data for visualization
   * @param newsTrends News trends data
   * @returns Formatted data for news trends visualization
   */
  public prepareNewsTrendsVisualization(
    newsTrends: NewsTrend[]
  ): {
    trends: {
      name: string;
      value: number;
      changePercent: number;
      direction: string;
      directionIcon: string;
      color: string;
    }[];
  } {
    // Map trend direction to icons and colors
    const directionIcons = {
      'increasing': 'trending_up',
      'decreasing': 'trending_down',
      'stable': 'trending_flat',
      'improving': 'trending_up',
      'deteriorating': 'trending_down'
    };
    
    const directionColors = {
      'increasing': '#4CAF50',
      'decreasing': '#F44336',
      'stable': '#9E9E9E',
      'improving': '#4CAF50',
      'deteriorating': '#F44336'
    };
    
    // Format trends data
    const trends = newsTrends.map(trend => ({
      name: trend.name,
      value: trend.value,
      changePercent: trend.changePercent,
      direction: trend.direction,
      directionIcon: directionIcons[trend.direction as keyof typeof directionIcons],
      color: directionColors[trend.direction as keyof typeof directionColors]
    }));
    
    return { trends };
  }

  /**
   * Prepare behavioral indicators data for visualization
   * @param behavioralData Behavioral metrics data
   * @returns Formatted data for behavioral indicators visualization
   */
  public prepareBehavioralIndicatorsVisualization(
    behavioralData: BehavioralMetricsResult
  ): {
    indicators: {
      name: string;
      value: number;
      classification: string;
      description: string;
      trend: string;
      trendIcon: string;
      color: string;
    }[];
    marketRegime: {
      regime: string;
      confidence: number;
      description: string;
      characteristics: string[];
    };
  } {
    // Map trend to icons
    const trendIcons = {
      'increasing': 'trending_up',
      'decreasing': 'trending_down',
      'stable': 'trending_flat',
      'improving': 'trending_up',
      'deteriorating': 'trending_down'
    };
    
    // Map classification to colors
    const getClassificationColor = (classification: string): string => {
      const bullishTerms = ['bullish', 'strong bullish', 'greed', 'extreme greed'];
      const bearishTerms = ['bearish', 'strong bearish', 'fear', 'extreme fear'];
      
      if (bullishTerms.includes(classification.toLowerCase())) return '#4CAF50';
      if (bearishTerms.includes(classification.toLowerCase())) return '#F44336';
      return '#9E9E9E';
    };
    
    // Format behavioral indicators
    const indicators = behavioralData.behavioralIndicators.map(indicator => ({
      name: indicator.name,
      value: indicator.value,
      classification: indicator.classification,
      description: indicator.description,
      trend: indicator.trend,
      trendIcon: trendIcons[indicator.trend as keyof typeof trendIcons],
      color: getClassificationColor(indicator.classification)
    }));
    
    return {
      indicators,
      marketRegime: behavioralData.marketRegime
    };
  }

  /**
   * Prepare trading patterns data for visualization
   * @param tradingPatterns Trading patterns data
   * @returns Formatted data for trading patterns visualization
   */
  public prepareTradingPatternsVisualization(
    tradingPatterns: TradingPattern[]
  ): {
    patterns: {
      name: string;
      type: string;
      strength: number;
      description: string;
      startIndex: number;
      endIndex: number;
      color: string;
    }[];
  } {
    // Map pattern types to colors
    const patternTypeColors = {
      'trend': '#4CAF50',
      'reversal': '#F44336',
      'continuation': '#2196F3',
      'volatility': '#FF9800',
      'volume': '#9C27B0'
    };
    
    // Format trading patterns
    const patterns = tradingPatterns.map(pattern => ({
      name: pattern.name,
      type: pattern.type,
      strength: pattern.strength,
      description: pattern.description,
      startIndex: pattern.startIndex,
      endIndex: pattern.endIndex,
      color: patternTypeColors[pattern.type as keyof typeof patternTypeColors]
    }));
    
    return { patterns };
  }

  /**
   * Prepare market anomalies data for visualization
   * @param marketAnomalies Market anomalies data
   * @returns Formatted data for market anomalies visualization
   */
  public prepareMarketAnomaliesVisualization(
    marketAnomalies: MarketAnomaly[]
  ): {
    anomalies: {
      type: string;
      date: string;
      value: number;
      significance: number;
      description: string;
      color: string;
    }[];
  } {
    // Map anomaly types to colors
    const anomalyColors: { [key: string]: string } = {
      'Gap Up': '#4CAF50',
      'Gap Down': '#F44336',
      'Volume Spike': '#2196F3',
      'Volatility Spike': '#FF9800',
      'Abnormal Gain': '#4CAF50',
      'Abnormal Loss': '#F44336'
    };
    
    // Format market anomalies
    const anomalies = marketAnomalies.map(anomaly => ({
      type: anomaly.type,
      date: anomaly.date.toLocaleDateString(),
      value: anomaly.value,
      significance: anomaly.significance,
      description: anomaly.description,
      color: anomalyColors[anomaly.type] || '#9E9E9E'
    }));
    
    return { anomalies };
  }

  /**
   * Prepare sentiment-price correlation data for visualization
   * @param correlationData Sentiment-price correlation data
   * @returns Formatted data for sentiment-price correlation visualization
   */
  public prepareSentimentPriceCorrelationVisualization(
    correlationData: {
      correlation: number;
      leadLag: number;
      dailyData: {
        date: string;
        sentiment: number;
        price: number;
        priceChange: number;
      }[];
    }
  ): {
    correlation: {
      value: number;
      interpretation: string;
      leadLag: number;
      leadLagInterpretation: string;
    };
    chartData: {
      labels: string[];
      datasets: {
        label: string;
        data: number[];
        borderColor: string;
        backgroundColor: string;
        yAxisID: string;
      }[];
    };
    scatterData: {
      datasets: {
        label: string;
        data: {
          x: number;
          y: number;
        }[];
        backgroundColor: string;
      }[];
    };
  } {
    // Interpret correlation value
    let interpretation = 'No correlation';
    if (correlationData.correlation > 0.7) interpretation = 'Strong positive correlation';
    else if (correlationData.correlation > 0.3) interpretation = 'Moderate positive correlation';
    else if (correlationData.correlation > 0) interpretation = 'Weak positive correlation';
    else if (correlationData.correlation < -0.7) interpretation = 'Strong negative correlation';
    else if (correlationData.correlation < -0.3) interpretation = 'Moderate negative correlation';
    else if (correlationData.correlation < 0) interpretation = 'Weak negative correlation';
    
    // Interpret lead-lag value
    let leadLagInterpretation = 'Sentiment and price move simultaneously';
    if (correlationData.leadLag > 0) {
      leadLagInterpretation = `Sentiment leads price by ${correlationData.leadLag} days`;
    } else if (correlationData.leadLag < 0) {
      leadLagInterpretation = `Price leads sentiment by ${Math.abs(correlationData.leadLag)} days`;
    }
    
    // Prepare time series chart data
    const labels = correlationData.dailyData.map(item => item.date);
    
    const chartData = {
      labels,
      datasets: [
        {
          label: 'Sentiment',
          data: correlationData.dailyData.map(item => item.sentiment),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          yAxisID: 'y-sentiment'
        },
        {
          label: 'Price',
          data: correlationData.dailyData.map(item => item.price),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          yAxisID: 'y-price'
        }
      ]
    };
    
    // Prepare scatter plot data
    const scatterData = {
      datasets: [
        {
          label: 'Sentiment vs Price Change',
          data: correlationData.dailyData.map(item => ({
            x: item.sentiment,
            y: item.priceChange
          })),
          backgroundColor: 'rgba(75, 192, 192, 0.6)'
        }
      ]
    };
    
    return {
      correlation: {
        value: correlationData.correlation,
        interpretation,
        leadLag: correlationData.leadLag,
        leadLagInterpretation
      },
      chartData,
      scatterData
    };
  }
}

export default SentimentVisualizationService;