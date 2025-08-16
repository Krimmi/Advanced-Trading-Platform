"""
Sentiment Analysis Module for Financial Text

This module provides classes and functions for analyzing sentiment in financial text data
including news articles, social media posts, and other text sources.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Union, Tuple
import re
import logging
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("sentiment_analyzer")

class SentimentAnalyzer:
    """
    Base class for sentiment analysis of financial text.
    """
    
    def __init__(self, model_type: str = "lexicon"):
        """
        Initialize the sentiment analyzer.
        
        Args:
            model_type: Type of sentiment model to use ('lexicon', 'ml', or 'transformer')
        """
        self.model_type = model_type
        self.logger = logger
        
        # Initialize lexicon dictionaries
        self.positive_words = set([
            "bullish", "uptrend", "growth", "profit", "increase", "gain", "positive", 
            "success", "strong", "opportunity", "outperform", "beat", "exceed", "upgrade",
            "buy", "recommend", "attractive", "favorable", "optimistic", "upside",
            "momentum", "rally", "recover", "improve", "efficient", "innovative",
            "leadership", "advantage", "dominant", "moat", "breakthrough", "disruptive",
            "expanding", "accelerating", "robust", "solid", "resilient", "dividend",
            "buyback", "acquisition", "synergy", "partnership", "collaboration"
        ])
        
        self.negative_words = set([
            "bearish", "downtrend", "decline", "loss", "decrease", "drop", "negative", 
            "fail", "weak", "risk", "underperform", "miss", "below", "downgrade",
            "sell", "avoid", "unattractive", "unfavorable", "pessimistic", "downside",
            "slowdown", "slump", "recession", "deteriorate", "inefficient", "outdated",
            "laggard", "disadvantage", "vulnerable", "competitive threat", "setback",
            "disappointing", "contracting", "decelerating", "weak", "fragile", "cut",
            "debt", "liability", "lawsuit", "investigation", "recall", "delay"
        ])
        
        self.financial_entities = set([
            "revenue", "earnings", "profit", "margin", "growth", "eps", "income",
            "sales", "guidance", "outlook", "forecast", "estimate", "target",
            "dividend", "buyback", "acquisition", "merger", "ipo", "debt", "cash",
            "balance sheet", "income statement", "cash flow", "quarter", "fiscal",
            "annual", "report", "sec", "filing", "10-k", "10-q", "8-k", "guidance"
        ])
        
        # Initialize model
        self._initialize_model()
    
    def _initialize_model(self):
        """
        Initialize the sentiment analysis model based on the specified type.
        """
        if self.model_type == "lexicon":
            self.logger.info("Initializing lexicon-based sentiment analyzer")
            # No additional initialization needed for lexicon-based approach
            pass
        
        elif self.model_type == "ml":
            self.logger.info("Initializing ML-based sentiment analyzer")
            # In a real implementation, this would load a trained ML model
            # For now, we'll just simulate it
            pass
        
        elif self.model_type == "transformer":
            self.logger.info("Initializing transformer-based sentiment analyzer")
            # In a real implementation, this would load a pre-trained transformer model
            # For now, we'll just simulate it
            pass
        
        else:
            raise ValueError(f"Unknown model type: {self.model_type}")
    
    def analyze_text(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment of a text.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary with sentiment analysis results
        """
        if self.model_type == "lexicon":
            return self._analyze_with_lexicon(text)
        elif self.model_type == "ml":
            return self._analyze_with_ml(text)
        elif self.model_type == "transformer":
            return self._analyze_with_transformer(text)
        else:
            raise ValueError(f"Unknown model type: {self.model_type}")
    
    def _analyze_with_lexicon(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment using a lexicon-based approach.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary with sentiment analysis results
        """
        # Preprocess text
        processed_text = self._preprocess_text(text)
        
        # Count positive and negative words
        words = processed_text.split()
        positive_count = sum(1 for word in words if word in self.positive_words)
        negative_count = sum(1 for word in words if word in self.negative_words)
        
        # Calculate sentiment score
        total_sentiment_words = positive_count + negative_count
        
        if total_sentiment_words == 0:
            sentiment_score = 0.5  # Neutral if no sentiment words found
        else:
            sentiment_score = positive_count / total_sentiment_words
        
        # Determine sentiment type
        if sentiment_score > 0.6:
            sentiment_type = "positive"
        elif sentiment_score < 0.4:
            sentiment_type = "negative"
        else:
            sentiment_type = "neutral"
        
        # Calculate magnitude (intensity)
        magnitude = min(1.0, total_sentiment_words / max(10, len(words) / 10))
        
        # Extract entities (potential stock symbols)
        entities = self._extract_entities(text)
        
        return {
            "score": sentiment_score,
            "magnitude": magnitude,
            "sentiment": sentiment_type,
            "entities": entities,
            "positive_words": positive_count,
            "negative_words": negative_count,
            "total_words": len(words)
        }
    
    def _analyze_with_ml(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment using a machine learning approach.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary with sentiment analysis results
        """
        # In a real implementation, this would use a trained ML model
        # For now, we'll simulate it with a more sophisticated version of the lexicon approach
        
        # Preprocess text
        processed_text = self._preprocess_text(text)
        
        # Extract features (simplified)
        words = processed_text.split()
        
        # Count positive and negative words with position weighting
        # Words at the beginning and end often carry more sentiment weight
        positive_count = 0
        negative_count = 0
        
        for i, word in enumerate(words):
            # Position weight: higher weight for words at beginning and end
            position = i / len(words)
            position_weight = 1.0 + 0.5 * (position < 0.2 or position > 0.8)
            
            if word in self.positive_words:
                positive_count += position_weight
            elif word in self.negative_words:
                negative_count += position_weight
        
        # Calculate sentiment score with simulated ML features
        total_sentiment = positive_count + negative_count
        
        if total_sentiment == 0:
            sentiment_score = 0.5  # Neutral if no sentiment words found
        else:
            base_score = positive_count / total_sentiment
            
            # Adjust score based on "but" clauses
            but_indices = [i for i, word in enumerate(words) if word == "but" or word == "however"]
            if but_indices:
                last_but_index = but_indices[-1]
                # Words after the last "but" carry more weight
                after_but_positive = sum(1 for i, word in enumerate(words) if i > last_but_index and word in self.positive_words)
                after_but_negative = sum(1 for i, word in enumerate(words) if i > last_but_index and word in self.negative_words)
                
                if after_but_positive + after_but_negative > 0:
                    after_but_score = after_but_positive / (after_but_positive + after_but_negative)
                    # Blend the scores, with more weight to the post-"but" sentiment
                    sentiment_score = 0.4 * base_score + 0.6 * after_but_score
                else:
                    sentiment_score = base_score
            else:
                sentiment_score = base_score
        
        # Determine sentiment type
        if sentiment_score > 0.6:
            sentiment_type = "positive"
        elif sentiment_score < 0.4:
            sentiment_type = "negative"
        else:
            sentiment_type = "neutral"
        
        # Calculate magnitude (intensity)
        magnitude = min(1.0, total_sentiment / max(10, len(words) / 8))
        
        # Extract entities
        entities = self._extract_entities(text)
        
        return {
            "score": sentiment_score,
            "magnitude": magnitude,
            "sentiment": sentiment_type,
            "entities": entities,
            "confidence": 0.75,  # Simulated confidence score
            "model_type": "ml"
        }
    
    def _analyze_with_transformer(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment using a transformer-based approach.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary with sentiment analysis results
        """
        # In a real implementation, this would use a pre-trained transformer model
        # For now, we'll simulate it with a more sophisticated approach
        
        # Preprocess text
        processed_text = self._preprocess_text(text)
        
        # Simulate transformer prediction
        # In reality, this would tokenize the text and run it through the model
        
        # Use a more sophisticated simulation based on text characteristics
        words = processed_text.split()
        
        # Count positive and negative words with context awareness
        positive_score = 0
        negative_score = 0
        
        # Negation words that flip sentiment
        negation_words = {"not", "no", "never", "none", "neither", "nor", "barely", "hardly", "scarcely", "doesn't", "don't", "didn't", "won't", "wouldn't", "couldn't", "can't", "isn't", "aren't", "wasn't", "weren't"}
        
        # Intensifier words that amplify sentiment
        intensifiers = {"very", "extremely", "incredibly", "highly", "substantially", "significantly", "notably", "remarkably", "exceedingly", "especially", "particularly"}
        
        # Simulate contextual understanding
        for i, word in enumerate(words):
            # Check for negation in the 3 preceding words
            negated = any(words[j] in negation_words for j in range(max(0, i-3), i))
            
            # Check for intensifiers in the 2 preceding words
            intensified = any(words[j] in intensifiers for j in range(max(0, i-2), i))
            
            # Base sentiment value
            sentiment_value = 1.0
            
            # Adjust for intensifiers
            if intensified:
                sentiment_value = 1.5
            
            if word in self.positive_words:
                if negated:
                    negative_score += sentiment_value
                else:
                    positive_score += sentiment_value
            elif word in self.negative_words:
                if negated:
                    positive_score += sentiment_value
                else:
                    negative_score += sentiment_value
        
        # Calculate sentiment score
        total_sentiment = positive_score + negative_score
        
        if total_sentiment == 0:
            sentiment_score = 0.5  # Neutral if no sentiment words found
        else:
            sentiment_score = positive_score / total_sentiment
        
        # Add some randomness to simulate model variance
        sentiment_score = max(0, min(1, sentiment_score + np.random.normal(0, 0.05)))
        
        # Determine sentiment type
        if sentiment_score > 0.6:
            sentiment_type = "positive"
        elif sentiment_score < 0.4:
            sentiment_type = "negative"
        else:
            sentiment_type = "neutral"
        
        # Calculate magnitude (intensity)
        magnitude = min(1.0, total_sentiment / max(5, len(words) / 15))
        
        # Extract entities with simulated NER
        entities = self._extract_entities_with_ner(text)
        
        return {
            "score": sentiment_score,
            "magnitude": magnitude,
            "sentiment": sentiment_type,
            "entities": entities,
            "confidence": 0.9,  # Simulated confidence score
            "model_type": "transformer"
        }
    
    def _preprocess_text(self, text: str) -> str:
        """
        Preprocess text for sentiment analysis.
        
        Args:
            text: Text to preprocess
            
        Returns:
            Preprocessed text
        """
        # Convert to lowercase
        text = text.lower()
        
        # Remove URLs
        text = re.sub(r'https?://\S+|www\.\S+', '', text)
        
        # Remove HTML tags
        text = re.sub(r'<.*?>', '', text)
        
        # Remove special characters but keep important punctuation
        text = re.sub(r'[^\w\s\.\,\!\?\$\%]', '', text)
        
        # Replace multiple spaces with single space
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    def _extract_entities(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract entities (potential stock symbols) from text.
        
        Args:
            text: Text to extract entities from
            
        Returns:
            List of extracted entities
        """
        # Extract potential stock symbols (uppercase words 1-5 characters)
        potential_symbols = re.findall(r'\b[A-Z]{1,5}\b', text)
        
        # Extract financial entities
        financial_terms = []
        for term in self.financial_entities:
            if term in text.lower():
                financial_terms.append(term)
        
        entities = []
        
        # Add stock symbols
        for symbol in potential_symbols:
            entities.append({
                "name": symbol,
                "type": "STOCK_SYMBOL",
                "salience": 0.8
            })
        
        # Add financial terms
        for term in financial_terms:
            entities.append({
                "name": term,
                "type": "FINANCIAL_TERM",
                "salience": 0.6
            })
        
        return entities
    
    def _extract_entities_with_ner(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract entities using simulated Named Entity Recognition.
        
        Args:
            text: Text to extract entities from
            
        Returns:
            List of extracted entities
        """
        # This is a more sophisticated version of entity extraction
        # In a real implementation, this would use a NER model
        
        entities = []
        
        # Extract potential stock symbols (uppercase words 1-5 characters)
        potential_symbols = re.findall(r'\b[A-Z]{1,5}\b', text)
        
        # Common company name patterns
        company_patterns = [
            r'\b[A-Z][a-z]+ (?:Inc|Corp|Corporation|Company|Co|Ltd|Limited|LLC|Group|Holdings|Bancorp|Technologies|Therapeutics|Pharmaceuticals)\b',
            r'\b[A-Z][a-z]+ [A-Z][a-z]+ (?:Inc|Corp|Corporation|Company|Co|Ltd|Limited|LLC|Group|Holdings)\b'
        ]
        
        companies = []
        for pattern in company_patterns:
            companies.extend(re.findall(pattern, text))
        
        # Extract financial metrics
        metric_patterns = [
            r'\$\d+(?:\.\d+)?(?:\s?[bmBM]illion|\s?[tT]rillion)?',
            r'\d+(?:\.\d+)?\s?percent',
            r'\d+(?:\.\d+)?%'
        ]
        
        metrics = []
        for pattern in metric_patterns:
            metrics.extend(re.findall(pattern, text))
        
        # Add stock symbols
        for symbol in potential_symbols:
            entities.append({
                "name": symbol,
                "type": "STOCK_SYMBOL",
                "salience": 0.9
            })
        
        # Add companies
        for company in companies:
            entities.append({
                "name": company,
                "type": "ORGANIZATION",
                "salience": 0.8
            })
        
        # Add metrics
        for metric in metrics:
            entities.append({
                "name": metric,
                "type": "FINANCIAL_METRIC",
                "salience": 0.7
            })
        
        return entities
    
    def analyze_batch(self, texts: List[str]) -> List[Dict[str, Any]]:
        """
        Analyze sentiment for a batch of texts.
        
        Args:
            texts: List of texts to analyze
            
        Returns:
            List of sentiment analysis results
        """
        return [self.analyze_text(text) for text in texts]
    
    def analyze_dataframe(self, df: pd.DataFrame, text_column: str, output_prefix: str = "sentiment_") -> pd.DataFrame:
        """
        Analyze sentiment for texts in a DataFrame column.
        
        Args:
            df: DataFrame containing texts
            text_column: Name of column containing texts
            output_prefix: Prefix for output columns
            
        Returns:
            DataFrame with sentiment analysis results added as new columns
        """
        # Create a copy of the DataFrame
        result_df = df.copy()
        
        # Apply sentiment analysis to each text
        analyses = result_df[text_column].apply(self.analyze_text)
        
        # Extract sentiment features to separate columns
        result_df[f"{output_prefix}score"] = analyses.apply(lambda x: x["score"])
        result_df[f"{output_prefix}magnitude"] = analyses.apply(lambda x: x["magnitude"])
        result_df[f"{output_prefix}type"] = analyses.apply(lambda x: x["sentiment"])
        
        return result_df


class FinancialSentimentAnalyzer(SentimentAnalyzer):
    """
    Specialized sentiment analyzer for financial texts.
    """
    
    def __init__(self, model_type: str = "transformer"):
        """
        Initialize the financial sentiment analyzer.
        
        Args:
            model_type: Type of sentiment model to use ('lexicon', 'ml', or 'transformer')
        """
        super().__init__(model_type)
        
        # Add financial-specific positive words
        self.positive_words.update([
            "beat", "exceed", "outperform", "upgrade", "buy", "overweight", "strong buy",
            "dividend", "buyback", "acquisition", "merger", "synergy", "growth",
            "margin expansion", "cost cutting", "efficiency", "market share",
            "patent", "innovation", "pipeline", "launch", "approval", "partnership",
            "collaboration", "licensing", "royalty", "milestone", "backlog", "guidance"
        ])
        
        # Add financial-specific negative words
        self.negative_words.update([
            "miss", "below", "underperform", "downgrade", "sell", "underweight", "strong sell",
            "cut", "reduce", "suspend", "halt", "delay", "recall", "investigation",
            "lawsuit", "litigation", "fine", "penalty", "warning", "default", "bankruptcy",
            "restructuring", "layoff", "downsizing", "write-down", "impairment", "goodwill",
            "restatement", "accounting", "sec", "inquiry", "probe", "margin compression"
        ])
    
    def analyze_financial_text(self, text: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Analyze sentiment of financial text with additional context.
        
        Args:
            text: Text to analyze
            context: Additional context (e.g., stock symbol, sector, previous sentiment)
            
        Returns:
            Dictionary with sentiment analysis results
        """
        # Get base sentiment analysis
        sentiment = self.analyze_text(text)
        
        # If context is provided, enhance the analysis
        if context:
            sentiment = self._enhance_with_context(sentiment, text, context)
        
        return sentiment
    
    def _enhance_with_context(self, sentiment: Dict[str, Any], text: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enhance sentiment analysis with additional context.
        
        Args:
            sentiment: Base sentiment analysis
            text: Original text
            context: Additional context
            
        Returns:
            Enhanced sentiment analysis
        """
        # Check if the text mentions the stock symbol from context
        if "symbol" in context and context["symbol"] in text:
            # Increase salience for this symbol
            for entity in sentiment["entities"]:
                if entity["name"] == context["symbol"] and entity["type"] == "STOCK_SYMBOL":
                    entity["salience"] = min(1.0, entity["salience"] + 0.2)
        
        # Adjust sentiment based on sector-specific terms
        if "sector" in context:
            sector = context["sector"].lower()
            
            # Technology sector
            if sector == "technology":
                tech_positive = ["innovation", "patent", "disruption", "cloud", "ai", "machine learning"]
                tech_negative = ["obsolete", "legacy", "outdated", "security breach", "hack", "vulnerability"]
                
                # Check for sector-specific terms
                for term in tech_positive:
                    if term in text.lower():
                        sentiment["score"] = min(1.0, sentiment["score"] + 0.05)
                
                for term in tech_negative:
                    if term in text.lower():
                        sentiment["score"] = max(0.0, sentiment["score"] - 0.05)
            
            # Healthcare sector
            elif sector == "healthcare" or sector == "biotech" or sector == "pharmaceutical":
                health_positive = ["approval", "trial success", "breakthrough", "patent", "pipeline"]
                health_negative = ["rejection", "trial failure", "side effect", "recall", "litigation"]
                
                # Check for sector-specific terms
                for term in health_positive:
                    if term in text.lower():
                        sentiment["score"] = min(1.0, sentiment["score"] + 0.05)
                
                for term in health_negative:
                    if term in text.lower():
                        sentiment["score"] = max(0.0, sentiment["score"] - 0.05)
        
        # Recalculate sentiment type based on adjusted score
        if sentiment["score"] > 0.6:
            sentiment["sentiment"] = "positive"
        elif sentiment["score"] < 0.4:
            sentiment["sentiment"] = "negative"
        else:
            sentiment["sentiment"] = "neutral"
        
        # Add context information to the result
        sentiment["context"] = context
        
        return sentiment
    
    def analyze_earnings_call(self, transcript: str, symbol: str) -> Dict[str, Any]:
        """
        Analyze sentiment in an earnings call transcript.
        
        Args:
            transcript: Earnings call transcript
            symbol: Stock symbol
            
        Returns:
            Dictionary with sentiment analysis results
        """
        # Split transcript into sections
        sections = self._split_transcript_sections(transcript)
        
        # Analyze each section
        section_sentiments = {}
        for section_name, section_text in sections.items():
            section_sentiments[section_name] = self.analyze_text(section_text)
        
        # Calculate overall sentiment
        overall_score = sum(s["score"] for s in section_sentiments.values()) / len(section_sentiments)
        overall_magnitude = sum(s["magnitude"] for s in section_sentiments.values()) / len(section_sentiments)
        
        # Determine overall sentiment type
        if overall_score > 0.6:
            overall_sentiment = "positive"
        elif overall_score < 0.4:
            overall_sentiment = "negative"
        else:
            overall_sentiment = "neutral"
        
        # Extract key phrases
        key_phrases = self._extract_key_phrases(transcript, symbol)
        
        return {
            "overall": {
                "score": overall_score,
                "magnitude": overall_magnitude,
                "sentiment": overall_sentiment
            },
            "sections": section_sentiments,
            "key_phrases": key_phrases,
            "symbol": symbol
        }
    
    def _split_transcript_sections(self, transcript: str) -> Dict[str, str]:
        """
        Split an earnings call transcript into sections.
        
        Args:
            transcript: Earnings call transcript
            
        Returns:
            Dictionary with section names and texts
        """
        # This is a simplified implementation
        # In a real implementation, this would use more sophisticated parsing
        
        sections = {}
        
        # Try to identify common sections
        lines = transcript.split('\n')
        current_section = "introduction"
        current_text = []
        
        for line in lines:
            lower_line = line.lower()
            
            # Check for section headers
            if "prepared remarks" in lower_line or "opening statement" in lower_line:
                # Save previous section
                if current_text:
                    sections[current_section] = '\n'.join(current_text)
                
                current_section = "prepared_remarks"
                current_text = []
            
            elif "question and answer" in lower_line or "q&a" in lower_line:
                # Save previous section
                if current_text:
                    sections[current_section] = '\n'.join(current_text)
                
                current_section = "q_and_a"
                current_text = []
            
            elif "financial results" in lower_line or "financial performance" in lower_line:
                # Save previous section
                if current_text:
                    sections[current_section] = '\n'.join(current_text)
                
                current_section = "financial_results"
                current_text = []
            
            elif "outlook" in lower_line or "guidance" in lower_line or "forecast" in lower_line:
                # Save previous section
                if current_text:
                    sections[current_section] = '\n'.join(current_text)
                
                current_section = "outlook"
                current_text = []
            
            elif "conclusion" in lower_line or "closing remarks" in lower_line:
                # Save previous section
                if current_text:
                    sections[current_section] = '\n'.join(current_text)
                
                current_section = "conclusion"
                current_text = []
            
            else:
                # Add line to current section
                current_text.append(line)
        
        # Save the last section
        if current_text:
            sections[current_section] = '\n'.join(current_text)
        
        return sections
    
    def _extract_key_phrases(self, text: str, symbol: str) -> List[Dict[str, Any]]:
        """
        Extract key phrases from text.
        
        Args:
            text: Text to extract key phrases from
            symbol: Stock symbol
            
        Returns:
            List of key phrases
        """
        # This is a simplified implementation
        # In a real implementation, this would use more sophisticated NLP techniques
        
        key_phrases = []
        
        # Look for sentences containing the symbol
        symbol_sentences = []
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        for sentence in sentences:
            if symbol in sentence:
                symbol_sentences.append(sentence)
        
        # Look for sentences with financial terms
        financial_terms = ["revenue", "earnings", "profit", "margin", "growth", "guidance", "outlook"]
        financial_sentences = []
        
        for sentence in sentences:
            if any(term in sentence.lower() for term in financial_terms):
                financial_sentences.append(sentence)
        
        # Add key phrases
        for sentence in symbol_sentences[:5]:  # Limit to top 5
            sentiment = self.analyze_text(sentence)
            key_phrases.append({
                "text": sentence,
                "sentiment": sentiment["sentiment"],
                "score": sentiment["score"],
                "type": "symbol_mention"
            })
        
        for sentence in financial_sentences[:5]:  # Limit to top 5
            if sentence not in symbol_sentences:  # Avoid duplicates
                sentiment = self.analyze_text(sentence)
                key_phrases.append({
                    "text": sentence,
                    "sentiment": sentiment["sentiment"],
                    "score": sentiment["score"],
                    "type": "financial_term"
                })
        
        return key_phrases


class SocialMediaSentimentAnalyzer(FinancialSentimentAnalyzer):
    """
    Specialized sentiment analyzer for social media content.
    """
    
    def __init__(self, model_type: str = "transformer"):
        """
        Initialize the social media sentiment analyzer.
        
        Args:
            model_type: Type of sentiment model to use ('lexicon', 'ml', or 'transformer')
        """
        super().__init__(model_type)
        
        # Add social media specific positive words
        self.positive_words.update([
            "moon", "rocket", "diamond", "hands", "hodl", "lambo", "tendies",
            "bullish", "long", "buy", "calls", "yolo", "fomo", "btfd", "dip"
        ])
        
        # Add social media specific negative words
        self.negative_words.update([
            "dump", "crash", "tank", "rug", "pull", "scam", "ponzi", "bubble",
            "bearish", "short", "sell", "puts", "rekt", "guh", "bagholder"
        ])
    
    def analyze_social_post(self, post: str, platform: str = None) -> Dict[str, Any]:
        """
        Analyze sentiment of a social media post.
        
        Args:
            post: Social media post
            platform: Social media platform (e.g., 'twitter', 'reddit', 'stocktwits')
            
        Returns:
            Dictionary with sentiment analysis results
        """
        # Get base sentiment analysis
        sentiment = self.analyze_text(post)
        
        # Extract cashtags and hashtags
        cashtags = re.findall(r'\$([A-Z]{1,5})\b', post)
        hashtags = re.findall(r'\#(\w+)', post)
        
        # Add cashtags and hashtags to entities
        for cashtag in cashtags:
            sentiment["entities"].append({
                "name": cashtag,
                "type": "CASHTAG",
                "salience": 0.9
            })
        
        for hashtag in hashtags:
            sentiment["entities"].append({
                "name": hashtag,
                "type": "HASHTAG",
                "salience": 0.7
            })
        
        # Add platform-specific analysis
        if platform:
            sentiment["platform"] = platform
            
            # Adjust sentiment based on platform-specific patterns
            if platform.lower() == "twitter":
                # Twitter-specific adjustments
                # Check for emojis
                if "🚀" in post:
                    sentiment["score"] = min(1.0, sentiment["score"] + 0.1)
                if "💎" in post or "👐" in post:
                    sentiment["score"] = min(1.0, sentiment["score"] + 0.05)
                if "📉" in post:
                    sentiment["score"] = max(0.0, sentiment["score"] - 0.1)
                
            elif platform.lower() == "reddit":
                # Reddit-specific adjustments
                if "wallstreetbets" in post.lower() or "wsb" in post.lower():
                    # WSB tends to be more extreme in sentiment
                    if sentiment["score"] > 0.5:
                        sentiment["score"] = min(1.0, sentiment["score"] + 0.1)
                    else:
                        sentiment["score"] = max(0.0, sentiment["score"] - 0.1)
                
            elif platform.lower() == "stocktwits":
                # StockTwits-specific adjustments
                if "bullish" in post.lower():
                    sentiment["score"] = min(1.0, sentiment["score"] + 0.15)
                if "bearish" in post.lower():
                    sentiment["score"] = max(0.0, sentiment["score"] - 0.15)
        
        # Recalculate sentiment type based on adjusted score
        if sentiment["score"] > 0.6:
            sentiment["sentiment"] = "positive"
        elif sentiment["score"] < 0.4:
            sentiment["sentiment"] = "negative"
        else:
            sentiment["sentiment"] = "neutral"
        
        # Add social media specific fields
        sentiment["cashtags"] = cashtags
        sentiment["hashtags"] = hashtags
        
        return sentiment
    
    def analyze_social_volume(self, posts: List[Dict[str, Any]], symbol: str) -> Dict[str, Any]:
        """
        Analyze social media volume and sentiment for a symbol.
        
        Args:
            posts: List of social media posts with timestamp and text
            symbol: Stock symbol
            
        Returns:
            Dictionary with volume and sentiment analysis
        """
        # Filter posts mentioning the symbol
        symbol_posts = [post for post in posts if symbol.lower() in post["text"].lower() or f"${symbol}" in post["text"]]
        
        # If no posts mention the symbol, return empty analysis
        if not symbol_posts:
            return {
                "symbol": symbol,
                "post_count": 0,
                "sentiment_score": 0.5,
                "sentiment_type": "neutral",
                "volume_change": 0,
                "hourly_data": []
            }
        
        # Analyze sentiment for each post
        for post in symbol_posts:
            post["sentiment"] = self.analyze_social_post(post["text"], post.get("platform"))
        
        # Calculate overall sentiment
        sentiment_scores = [post["sentiment"]["score"] for post in symbol_posts]
        avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
        
        # Determine sentiment type
        if avg_sentiment > 0.6:
            sentiment_type = "positive"
        elif avg_sentiment < 0.4:
            sentiment_type = "negative"
        else:
            sentiment_type = "neutral"
        
        # Group posts by hour
        hourly_data = {}
        
        for post in symbol_posts:
            timestamp = post["timestamp"]
            hour = timestamp.replace(minute=0, second=0, microsecond=0)
            
            if hour not in hourly_data:
                hourly_data[hour] = {
                    "hour": hour.isoformat(),
                    "post_count": 0,
                    "sentiment_scores": []
                }
            
            hourly_data[hour]["post_count"] += 1
            hourly_data[hour]["sentiment_scores"].append(post["sentiment"]["score"])
        
        # Calculate hourly sentiment
        for hour, data in hourly_data.items():
            data["sentiment_score"] = sum(data["sentiment_scores"]) / len(data["sentiment_scores"])
            del data["sentiment_scores"]  # Remove raw scores
        
        # Sort hourly data by hour
        sorted_hourly_data = sorted(hourly_data.values(), key=lambda x: x["hour"])
        
        # Calculate volume change (compared to average of previous 24 hours)
        recent_count = len(symbol_posts)
        
        # In a real implementation, this would compare to historical data
        # For now, we'll simulate a random change
        avg_historical_count = recent_count / (1 + np.random.uniform(-0.5, 0.5))
        volume_change = (recent_count - avg_historical_count) / avg_historical_count if avg_historical_count > 0 else 0
        
        return {
            "symbol": symbol,
            "post_count": len(symbol_posts),
            "sentiment_score": avg_sentiment,
            "sentiment_type": sentiment_type,
            "volume_change": volume_change,
            "hourly_data": sorted_hourly_data
        }


class NewsSentimentAnalyzer(FinancialSentimentAnalyzer):
    """
    Specialized sentiment analyzer for news articles.
    """
    
    def __init__(self, model_type: str = "transformer"):
        """
        Initialize the news sentiment analyzer.
        
        Args:
            model_type: Type of sentiment model to use ('lexicon', 'ml', or 'transformer')
        """
        super().__init__(model_type)
    
    def analyze_news_article(self, title: str, content: str, source: str = None) -> Dict[str, Any]:
        """
        Analyze sentiment of a news article.
        
        Args:
            title: Article title
            content: Article content
            source: News source
            
        Returns:
            Dictionary with sentiment analysis results
        """
        # Analyze title and content separately
        title_sentiment = self.analyze_text(title)
        content_sentiment = self.analyze_text(content)
        
        # Title usually carries more weight in news sentiment
        overall_score = 0.7 * title_sentiment["score"] + 0.3 * content_sentiment["score"]
        overall_magnitude = 0.7 * title_sentiment["magnitude"] + 0.3 * content_sentiment["magnitude"]
        
        # Determine overall sentiment type
        if overall_score > 0.6:
            overall_sentiment = "positive"
        elif overall_score < 0.4:
            overall_sentiment = "negative"
        else:
            overall_sentiment = "neutral"
        
        # Extract entities from both title and content
        entities = title_sentiment["entities"] + content_sentiment["entities"]
        
        # Remove duplicate entities
        unique_entities = []
        entity_names = set()
        
        for entity in entities:
            if entity["name"] not in entity_names:
                unique_entities.append(entity)
                entity_names.add(entity["name"])
        
        # Extract key sentences
        key_sentences = self._extract_key_sentences(content)
        
        return {
            "title": {
                "text": title,
                "score": title_sentiment["score"],
                "magnitude": title_sentiment["magnitude"],
                "sentiment": title_sentiment["sentiment"]
            },
            "content": {
                "score": content_sentiment["score"],
                "magnitude": content_sentiment["magnitude"],
                "sentiment": content_sentiment["sentiment"]
            },
            "overall": {
                "score": overall_score,
                "magnitude": overall_magnitude,
                "sentiment": overall_sentiment
            },
            "entities": unique_entities,
            "key_sentences": key_sentences,
            "source": source
        }
    
    def _extract_key_sentences(self, content: str) -> List[Dict[str, Any]]:
        """
        Extract key sentences from content.
        
        Args:
            content: Article content
            
        Returns:
            List of key sentences with sentiment
        """
        # Split content into sentences
        sentences = re.split(r'(?<=[.!?])\s+', content)
        
        # Analyze each sentence
        sentence_sentiments = []
        for sentence in sentences:
            # Skip very short sentences
            if len(sentence.split()) < 5:
                continue
            
            sentiment = self.analyze_text(sentence)
            
            # Only include sentences with strong sentiment
            if sentiment["magnitude"] > 0.3:
                sentence_sentiments.append({
                    "text": sentence,
                    "score": sentiment["score"],
                    "magnitude": sentiment["magnitude"],
                    "sentiment": sentiment["sentiment"]
                })
        
        # Sort by magnitude (strongest sentiment first)
        sentence_sentiments.sort(key=lambda x: x["magnitude"], reverse=True)
        
        # Return top sentences
        return sentence_sentiments[:5]
    
    def analyze_news_impact(self, articles: List[Dict[str, Any]], symbol: str) -> Dict[str, Any]:
        """
        Analyze the impact of news articles on a stock.
        
        Args:
            articles: List of news articles with title, content, and timestamp
            symbol: Stock symbol
            
        Returns:
            Dictionary with news impact analysis
        """
        # Filter articles mentioning the symbol
        symbol_articles = [article for article in articles if symbol in article["title"] or symbol in article["content"]]
        
        # If no articles mention the symbol, return empty analysis
        if not symbol_articles:
            return {
                "symbol": symbol,
                "article_count": 0,
                "sentiment_score": 0.5,
                "sentiment_type": "neutral",
                "volume_change": 0,
                "daily_data": []
            }
        
        # Analyze sentiment for each article
        for article in symbol_articles:
            article["sentiment"] = self.analyze_news_article(article["title"], article["content"], article.get("source"))
        
        # Calculate overall sentiment
        sentiment_scores = [article["sentiment"]["overall"]["score"] for article in symbol_articles]
        avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
        
        # Determine sentiment type
        if avg_sentiment > 0.6:
            sentiment_type = "positive"
        elif avg_sentiment < 0.4:
            sentiment_type = "negative"
        else:
            sentiment_type = "neutral"
        
        # Group articles by day
        daily_data = {}
        
        for article in symbol_articles:
            timestamp = article["timestamp"]
            day = timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
            
            if day not in daily_data:
                daily_data[day] = {
                    "date": day.strftime("%Y-%m-%d"),
                    "article_count": 0,
                    "sentiment_scores": []
                }
            
            daily_data[day]["article_count"] += 1
            daily_data[day]["sentiment_scores"].append(article["sentiment"]["overall"]["score"])
        
        # Calculate daily sentiment
        for day, data in daily_data.items():
            data["sentiment_score"] = sum(data["sentiment_scores"]) / len(data["sentiment_scores"])
            del data["sentiment_scores"]  # Remove raw scores
        
        # Sort daily data by date
        sorted_daily_data = sorted(daily_data.values(), key=lambda x: x["date"])
        
        # Calculate volume change (compared to average of previous 7 days)
        recent_count = len(symbol_articles)
        
        # In a real implementation, this would compare to historical data
        # For now, we'll simulate a random change
        avg_historical_count = recent_count / (1 + np.random.uniform(-0.3, 0.3))
        volume_change = (recent_count - avg_historical_count) / avg_historical_count if avg_historical_count > 0 else 0
        
        return {
            "symbol": symbol,
            "article_count": len(symbol_articles),
            "sentiment_score": avg_sentiment,
            "sentiment_type": sentiment_type,
            "volume_change": volume_change,
            "daily_data": sorted_daily_data
        }