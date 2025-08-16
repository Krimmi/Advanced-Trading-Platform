"""
Router for alternative data endpoints.
This module provides API endpoints for accessing alternative data sources.
"""
from fastapi import APIRouter, HTTPException, Query, Depends, Path, Body
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import numpy as np
import json
import os
import sys
import pandas as pd
from pydantic import BaseModel

# Add the project root to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))

# Configure router
router = APIRouter()

# Models
class SentimentAnalysisRequest(BaseModel):
    symbols: Optional[List[str]] = None
    sources: Optional[List[str]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    limit: Optional[int] = 100

class NewsRequest(BaseModel):
    symbols: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    sources: Optional[List[str]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    limit: Optional[int] = 20
    offset: Optional[int] = 0
    min_relevance: Optional[float] = 0.5

class SocialMediaRequest(BaseModel):
    symbols: Optional[List[str]] = None
    platforms: Optional[List[str]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    limit: Optional[int] = 20
    offset: Optional[int] = 0
    min_engagement: Optional[float] = 0

class DataSourceConfig(BaseModel):
    config: Dict[str, Any]

# Helper function to generate mock sentiment data
def generate_mock_sentiment_data(symbols: List[str], days: int = 30) -> List[Dict[str, Any]]:
    """
    Generate mock sentiment data for the specified symbols.
    
    Args:
        symbols: List of stock symbols
        days: Number of days of historical data
        
    Returns:
        List of sentiment data entries
    """
    # Generate date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    date_range = pd.date_range(start=start_date, end=end_date, freq='D')
    
    # Generate mock sentiment data
    np.random.seed(42)  # For reproducibility
    sentiment_data = []
    
    sources = ["twitter", "reddit", "news", "stocktwits", "sec_filings"]
    sentiment_types = ["positive", "negative", "neutral"]
    sentiment_weights = [0.5, 0.3, 0.2]  # More positive than negative or neutral
    
    for symbol in symbols:
        for date in date_range:
            # Generate 1-3 sentiment entries per day per symbol
            num_entries = np.random.randint(1, 4)
            
            for _ in range(num_entries):
                source = np.random.choice(sources)
                sentiment_type = np.random.choice(sentiment_types, p=sentiment_weights)
                
                # Generate sentiment score based on sentiment type
                if sentiment_type == "positive":
                    score = np.random.uniform(0.6, 1.0)
                elif sentiment_type == "negative":
                    score = np.random.uniform(0.0, 0.4)
                else:  # neutral
                    score = np.random.uniform(0.4, 0.6)
                
                # Generate magnitude (intensity of sentiment)
                magnitude = np.random.uniform(0.3, 1.0)
                
                # Create sentiment entry
                sentiment_entry = {
                    "symbol": symbol,
                    "score": score,
                    "magnitude": magnitude,
                    "sentiment": sentiment_type,
                    "source": source,
                    "timestamp": date.strftime("%Y-%m-%dT%H:%M:%S")
                }
                
                sentiment_data.append(sentiment_entry)
    
    return sentiment_data

# Helper function to generate mock news data
def generate_mock_news_data(symbols: List[str], days: int = 30) -> List[Dict[str, Any]]:
    """
    Generate mock news data for the specified symbols.
    
    Args:
        symbols: List of stock symbols
        days: Number of days of historical data
        
    Returns:
        List of news data entries
    """
    # Generate date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    date_range = pd.date_range(start=start_date, end=end_date, freq='D')
    
    # Generate mock news data
    np.random.seed(43)  # Different seed from sentiment
    news_data = []
    
    sources = ["Bloomberg", "Reuters", "CNBC", "WSJ", "MarketWatch", "Yahoo Finance"]
    categories = ["earnings", "analyst_ratings", "company_news", "industry_news", "market_news", "economy"]
    
    # Sample news titles and summaries
    news_templates = [
        {
            "title": "{symbol} Reports Q{quarter} Earnings Above Expectations",
            "summary": "{symbol} reported quarterly earnings of ${eps} per share, beating analyst expectations of ${exp_eps}. Revenue came in at ${revenue}B, up {growth}% year-over-year."
        },
        {
            "title": "Analyst Upgrades {symbol} to {rating}",
            "summary": "Analysts at {bank} have upgraded {symbol} from {old_rating} to {rating}, citing {reason}. The price target was raised to ${price_target}."
        },
        {
            "title": "{symbol} Announces New Product Line",
            "summary": "{symbol} unveiled its new {product} today, which is expected to {impact} the company's market position in the {industry} industry."
        },
        {
            "title": "{symbol} Shares {direction} After {event}",
            "summary": "Shares of {symbol} {direction_verb} {percent}% after the company announced {event_detail}."
        },
        {
            "title": "{symbol} to {action} {amount}B in {method}",
            "summary": "{symbol} announced plans to {action} ${amount}B in {method}, signaling {signal} to investors about the company's financial outlook."
        }
    ]
    
    id_counter = 1000
    
    for symbol in symbols:
        # Generate 5-15 news items per symbol
        num_news = np.random.randint(5, 16)
        
        for _ in range(num_news):
            # Select random date
            date = np.random.choice(date_range)
            
            # Select random source and category
            source = np.random.choice(sources)
            category = np.random.choice(categories)
            
            # Select random news template
            template = np.random.choice(news_templates)
            
            # Fill in template with random data
            title = template["title"]
            summary = template["summary"]
            
            # Replace placeholders with random values
            replacements = {
                "{symbol}": symbol,
                "{quarter}": str(np.random.randint(1, 5)),
                "{eps}": f"{np.random.uniform(0.5, 3.0):.2f}",
                "{exp_eps}": f"{np.random.uniform(0.5, 3.0):.2f}",
                "{revenue}": f"{np.random.uniform(1.0, 50.0):.1f}",
                "{growth}": f"{np.random.uniform(-10.0, 30.0):.1f}",
                "{bank}": np.random.choice(["Goldman Sachs", "Morgan Stanley", "JP Morgan", "Bank of America", "Citigroup"]),
                "{rating}": np.random.choice(["Buy", "Overweight", "Strong Buy", "Outperform"]),
                "{old_rating}": np.random.choice(["Hold", "Neutral", "Equal-weight"]),
                "{reason}": np.random.choice(["strong growth prospects", "undervalued shares", "market leadership", "innovative products"]),
                "{price_target}": f"{np.random.uniform(50.0, 500.0):.2f}",
                "{product}": np.random.choice(["product line", "service offering", "technology platform", "subscription model"]),
                "{impact}": np.random.choice(["strengthen", "revolutionize", "enhance", "improve"]),
                "{industry}": np.random.choice(["tech", "healthcare", "finance", "consumer", "energy"]),
                "{direction}": np.random.choice(["Up", "Down", "Surge", "Plunge", "Rally", "Tumble"]),
                "{direction_verb}": np.random.choice(["rose", "fell", "jumped", "dropped", "surged", "plunged"]),
                "{percent}": f"{np.random.uniform(1.0, 15.0):.1f}",
                "{event}": np.random.choice(["Earnings Report", "Analyst Upgrade", "Product Launch", "Acquisition Announcement", "Regulatory Approval"]),
                "{event_detail}": np.random.choice(["better-than-expected earnings", "a major acquisition", "regulatory approval for a key product", "a new partnership", "restructuring plans"]),
                "{action}": np.random.choice(["Buyback", "Raise", "Invest", "Allocate", "Return to Shareholders"]),
                "{amount}": f"{np.random.uniform(1.0, 20.0):.1f}",
                "{method}": np.random.choice(["Share Repurchases", "Dividends", "Capital Expenditures", "R&D", "Debt Reduction"]),
                "{signal}": np.random.choice(["confidence", "caution", "optimism", "strategic focus", "long-term commitment"])
            }
            
            for placeholder, value in replacements.items():
                title = title.replace(placeholder, value)
                summary = summary.replace(placeholder, value)
            
            # Generate sentiment
            sentiment_score = np.random.uniform(0.0, 1.0)
            sentiment_type = "positive" if sentiment_score > 0.6 else "negative" if sentiment_score < 0.4 else "neutral"
            
            # Create news entry
            news_entry = {
                "id": f"news_{id_counter}",
                "title": title,
                "summary": summary,
                "url": f"https://example.com/news/{id_counter}",
                "source": source,
                "publishedAt": date.strftime("%Y-%m-%dT%H:%M:%S"),
                "sentiment": {
                    "score": sentiment_score,
                    "magnitude": np.random.uniform(0.3, 1.0),
                    "sentiment": sentiment_type
                },
                "symbols": [symbol] + np.random.choice(symbols, size=np.random.randint(0, 3), replace=False).tolist(),
                "categories": [category],
                "relevance": np.random.uniform(0.5, 1.0)
            }
            
            # Remove duplicates from symbols list
            news_entry["symbols"] = list(set(news_entry["symbols"]))
            
            news_data.append(news_entry)
            id_counter += 1
    
    # Sort by date (newest first)
    news_data.sort(key=lambda x: x["publishedAt"], reverse=True)
    
    return news_data

# Helper function to generate mock social media data
def generate_mock_social_media_data(symbols: List[str], days: int = 30) -> List[Dict[str, Any]]:
    """
    Generate mock social media data for the specified symbols.
    
    Args:
        symbols: List of stock symbols
        days: Number of days of historical data
        
    Returns:
        List of social media data entries
    """
    # Generate date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    date_range = pd.date_range(start=start_date, end=end_date, freq='D')
    
    # Generate mock social media data
    np.random.seed(44)  # Different seed
    social_media_data = []
    
    platforms = ["twitter", "reddit", "stocktwits"]
    
    # Sample social media content templates
    content_templates = [
        "Just bought more {symbol}! {bullish}",
        "Thinking of selling my {symbol} shares. {bearish}",
        "{symbol} looks {sentiment} after {event}. Thoughts?",
        "Anyone else watching {symbol}? {question}",
        "{symbol} {direction} {percent}% today. {reaction}",
        "Earnings for {symbol} coming up. {prediction}",
        "New analyst report on {symbol}: {rating}",
        "The CEO of {symbol} just {action}. {opinion}",
        "{symbol} vs {competitor} - which is the better buy?",
        "Long-term {outlook} on {symbol}. {reason}"
    ]
    
    id_counter = 5000
    
    for symbol in symbols:
        # Generate 10-30 social media posts per symbol
        num_posts = np.random.randint(10, 31)
        
        for _ in range(num_posts):
            # Select random date and time
            date = np.random.choice(date_range)
            hour = np.random.randint(0, 24)
            minute = np.random.randint(0, 60)
            second = np.random.randint(0, 60)
            timestamp = date.replace(hour=hour, minute=minute, second=second)
            
            # Select random platform
            platform = np.random.choice(platforms)
            
            # Select random content template
            template = np.random.choice(content_templates)
            
            # Fill in template with random data
            content = template
            
            # Replace placeholders with random values
            replacements = {
                "{symbol}": symbol,
                "{bullish}": np.random.choice(["To the moon! 🚀", "Very bullish!", "Great long-term play.", "Expecting big gains!"]),
                "{bearish}": np.random.choice(["Not looking good.", "Bearish outlook.", "Too much risk.", "Better opportunities elsewhere."]),
                "{sentiment}": np.random.choice(["promising", "concerning", "interesting", "overvalued", "undervalued"]),
                "{event}": np.random.choice(["earnings", "the announcement", "today's news", "the market drop", "the sector rotation"]),
                "{question}": np.random.choice(["What's your price target?", "Buy, sell or hold?", "What's the catalyst?", "Any concerns?"]),
                "{direction}": np.random.choice(["up", "down", "jumped", "tanked", "moved"]),
                "{percent}": f"{np.random.uniform(0.5, 15.0):.1f}",
                "{reaction}": np.random.choice(["Wow! 😮", "As expected.", "Buying opportunity?", "Taking profits.", "Holding strong! 💪"]),
                "{prediction}": np.random.choice(["Expecting a beat!", "Could disappoint.", "Priced in already.", "Make or break moment."]),
                "{rating}": np.random.choice(["Strong Buy", "Outperform", "Hold", "Underperform", "Sell"]),
                "{action}": np.random.choice(["bought shares", "sold shares", "announced retirement", "gave an interview", "presented at a conference"]),
                "{opinion}": np.random.choice(["Bullish signal!", "Concerning development.", "No impact on thesis.", "Worth monitoring."]),
                "{competitor}": np.random.choice([s for s in symbols if s != symbol] or ["competitor"]),
                "{outlook}": np.random.choice(["bullish", "bearish", "neutral", "cautious", "optimistic"]),
                "{reason}": np.random.choice(["Strong fundamentals.", "Technical breakout imminent.", "Valuation concerns.", "Competitive advantages.", "Sector headwinds."])
            }
            
            for placeholder, value in replacements.items():
                content = content.replace(placeholder, value)
            
            # Generate engagement metrics
            likes = np.random.randint(0, 1000)
            comments = np.random.randint(0, 100)
            shares = np.random.randint(0, 50)
            engagement = likes + comments * 2 + shares * 3  # Weighted engagement score
            
            # Generate sentiment
            sentiment_score = np.random.uniform(0.0, 1.0)
            sentiment_type = "positive" if sentiment_score > 0.6 else "negative" if sentiment_score < 0.4 else "neutral"
            
            # Create social media entry
            social_media_entry = {
                "id": f"social_{id_counter}",
                "platform": platform,
                "content": content,
                "author": f"user_{np.random.randint(1000, 9999)}",
                "url": f"https://example.com/{platform}/post/{id_counter}",
                "publishedAt": timestamp.strftime("%Y-%m-%dT%H:%M:%S"),
                "sentiment": {
                    "score": sentiment_score,
                    "magnitude": np.random.uniform(0.3, 1.0),
                    "sentiment": sentiment_type
                },
                "symbols": [symbol] + np.random.choice(symbols, size=np.random.randint(0, 2), replace=False).tolist(),
                "likes": likes,
                "comments": comments,
                "shares": shares,
                "engagement": engagement
            }
            
            # Remove duplicates from symbols list
            social_media_entry["symbols"] = list(set(social_media_entry["symbols"]))
            
            social_media_data.append(social_media_entry)
            id_counter += 1
    
    # Sort by date (newest first)
    social_media_data.sort(key=lambda x: x["publishedAt"], reverse=True)
    
    return social_media_data

# Helper function to generate mock data sources
def generate_mock_data_sources() -> List[Dict[str, Any]]:
    """
    Generate mock alternative data sources.
    
    Returns:
        List of data source entries
    """
    return [
        {
            "id": "twitter_sentiment",
            "name": "Twitter Sentiment Analysis",
            "type": "social_media",
            "description": "Real-time sentiment analysis of tweets related to stocks and financial markets.",
            "enabled": True,
            "lastUpdated": (datetime.now() - timedelta(minutes=15)).isoformat(),
            "status": "active",
            "config": {
                "update_frequency": "real-time",
                "sentiment_model": "bert-base-financial",
                "min_confidence": 0.7
            }
        },
        {
            "id": "news_sentiment",
            "name": "Financial News Sentiment",
            "type": "news",
            "description": "Sentiment analysis of financial news articles from major publications.",
            "enabled": True,
            "lastUpdated": (datetime.now() - timedelta(hours=1)).isoformat(),
            "status": "active",
            "config": {
                "update_frequency": "hourly",
                "sources": ["Bloomberg", "Reuters", "CNBC", "WSJ", "MarketWatch"],
                "sentiment_model": "finbert"
            }
        },
        {
            "id": "reddit_wallstreetbets",
            "name": "Reddit r/wallstreetbets Analysis",
            "type": "social_media",
            "description": "Sentiment and trend analysis from the r/wallstreetbets subreddit.",
            "enabled": True,
            "lastUpdated": (datetime.now() - timedelta(minutes=30)).isoformat(),
            "status": "active",
            "config": {
                "update_frequency": "30min",
                "sentiment_model": "reddit-financial-bert",
                "min_upvotes": 10
            }
        },
        {
            "id": "stocktwits_sentiment",
            "name": "StockTwits Sentiment",
            "type": "social_media",
            "description": "Sentiment analysis of StockTwits messages for tracked symbols.",
            "enabled": True,
            "lastUpdated": (datetime.now() - timedelta(minutes=5)).isoformat(),
            "status": "active",
            "config": {
                "update_frequency": "5min",
                "min_message_count": 5,
                "include_trending": True
            }
        },
        {
            "id": "satellite_imagery",
            "name": "Satellite Imagery Analysis",
            "type": "satellite",
            "description": "Analysis of satellite imagery for retail parking lots, shipping ports, and oil storage.",
            "enabled": True,
            "lastUpdated": (datetime.now() - timedelta(days=1)).isoformat(),
            "status": "active",
            "config": {
                "update_frequency": "daily",
                "locations": ["retail", "shipping", "energy"],
                "resolution": "high"
            }
        },
        {
            "id": "macro_indicators",
            "name": "Macroeconomic Indicators",
            "type": "macro",
            "description": "Real-time and historical macroeconomic indicators and their impact on markets.",
            "enabled": True,
            "lastUpdated": (datetime.now() - timedelta(hours=6)).isoformat(),
            "status": "active",
            "config": {
                "update_frequency": "6h",
                "indicators": ["gdp", "unemployment", "inflation", "interest_rates", "housing"],
                "sources": ["fed", "bls", "census", "eia"]
            }
        },
        {
            "id": "sec_filings",
            "name": "SEC Filings Analysis",
            "type": "other",
            "description": "NLP analysis of SEC filings to extract sentiment, risk factors, and key changes.",
            "enabled": True,
            "lastUpdated": (datetime.now() - timedelta(hours=12)).isoformat(),
            "status": "active",
            "config": {
                "update_frequency": "12h",
                "filing_types": ["10-K", "10-Q", "8-K", "S-1", "13F"],
                "analysis_depth": "deep"
            }
        },
        {
            "id": "credit_card_data",
            "name": "Credit Card Transaction Data",
            "type": "other",
            "description": "Anonymized credit card transaction data for consumer spending trends.",
            "enabled": False,
            "lastUpdated": (datetime.now() - timedelta(days=7)).isoformat(),
            "status": "inactive",
            "config": {
                "update_frequency": "weekly",
                "sectors": ["retail", "restaurants", "travel", "entertainment"],
                "granularity": "company-level"
            }
        }
    ]

# Helper function to generate mock sentiment trends
def generate_mock_sentiment_trends(symbols: List[str], days: int = 30) -> List[Dict[str, Any]]:
    """
    Generate mock sentiment trends for the specified symbols.
    
    Args:
        symbols: List of stock symbols
        days: Number of days of historical data
        
    Returns:
        List of sentiment trend entries
    """
    # Generate date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    date_range = pd.date_range(start=start_date, end=end_date, freq='D')
    
    # Generate mock sentiment trends
    np.random.seed(45)  # Different seed
    sentiment_trends = []
    
    for symbol in symbols:
        # Initialize trend data
        trend_data = []
        
        # Generate a base sentiment pattern with some autocorrelation
        base_sentiment = 0.5  # Start at neutral
        
        for date in date_range:
            # Add some autocorrelation to sentiment
            random_change = np.random.normal(0, 0.1)  # Random change with mean 0
            base_sentiment = max(0, min(1, base_sentiment + random_change))  # Keep between 0 and 1
            
            # Add some volume variation
            volume = int(np.random.gamma(5, 20))  # Gamma distribution for volume
            
            # Add to trend data
            trend_data.append({
                "date": date.strftime("%Y-%m-%d"),
                "sentiment": base_sentiment,
                "volume": volume
            })
        
        # Create sentiment trend entry
        sentiment_trend = {
            "symbol": symbol,
            "data": trend_data
        }
        
        sentiment_trends.append(sentiment_trend)
    
    return sentiment_trends

# Helper function to generate mock satellite imagery data
def generate_mock_satellite_data(location: str, start_date: str, end_date: str) -> Dict[str, Any]:
    """
    Generate mock satellite imagery data for the specified location and date range.
    
    Args:
        location: Location identifier
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        
    Returns:
        Dictionary with satellite imagery data
    """
    # Parse dates
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    
    # Generate date range
    date_range = pd.date_range(start=start, end=end, freq='D')
    
    # Generate mock satellite data
    np.random.seed(46)  # Different seed
    
    # Different metrics based on location type
    if "retail" in location.lower():
        # Retail location - track parking lot occupancy
        metrics = {
            "type": "retail",
            "location_name": location,
            "metrics": "parking_lot_occupancy",
            "data": []
        }
        
        # Generate occupancy data
        base_occupancy = np.random.uniform(0.3, 0.6)  # Base occupancy rate
        
        for date in date_range:
            # Higher occupancy on weekends
            weekend_factor = 1.3 if date.weekday() >= 5 else 1.0
            
            # Seasonal variations
            month = date.month
            seasonal_factor = 1.2 if month in [11, 12] else 1.1 if month in [1, 6, 7] else 1.0
            
            # Daily occupancy with some randomness
            daily_occupancy = min(0.95, base_occupancy * weekend_factor * seasonal_factor * np.random.uniform(0.8, 1.2))
            
            # Add to data
            metrics["data"].append({
                "date": date.strftime("%Y-%m-%d"),
                "occupancy_rate": daily_occupancy,
                "vehicle_count": int(daily_occupancy * 500),  # Assuming parking lot capacity of 500
                "image_url": f"https://example.com/satellite/{location}/image_{date.strftime('%Y%m%d')}.jpg"
            })
    
    elif "shipping" in location.lower():
        # Shipping port - track container counts and ship traffic
        metrics = {
            "type": "shipping",
            "location_name": location,
            "metrics": "port_activity",
            "data": []
        }
        
        # Generate shipping data
        base_containers = np.random.randint(5000, 15000)
        base_ships = np.random.randint(5, 20)
        
        for date in date_range:
            # Some weekly patterns
            day_factor = 0.8 if date.weekday() == 6 else 1.0  # Less activity on Sundays
            
            # Monthly variations
            month = date.month
            seasonal_factor = 1.3 if month in [10, 11] else 0.9 if month in [1, 2] else 1.0
            
            # Daily activity with some randomness
            daily_containers = int(base_containers * day_factor * seasonal_factor * np.random.uniform(0.9, 1.1))
            daily_ships = int(base_ships * day_factor * seasonal_factor * np.random.uniform(0.8, 1.2))
            
            # Add to data
            metrics["data"].append({
                "date": date.strftime("%Y-%m-%d"),
                "container_count": daily_containers,
                "ship_count": daily_ships,
                "dock_utilization": np.random.uniform(0.6, 0.9),
                "image_url": f"https://example.com/satellite/{location}/image_{date.strftime('%Y%m%d')}.jpg"
            })
    
    elif "energy" in location.lower():
        # Energy facility - track storage levels
        metrics = {
            "type": "energy",
            "location_name": location,
            "metrics": "storage_levels",
            "data": []
        }
        
        # Generate energy storage data
        base_level = np.random.uniform(0.5, 0.8)  # Base storage level
        
        for date in date_range:
            # Seasonal variations
            month = date.month
            seasonal_factor = 1.1 if month in [1, 2, 12] else 0.9 if month in [6, 7, 8] else 1.0
            
            # Daily level with some autocorrelation
            if date == date_range[0]:
                daily_level = base_level
            else:
                prev_level = metrics["data"][-1]["storage_level"]
                change = np.random.normal(0, 0.03)  # Random change with mean 0
                daily_level = max(0.1, min(0.95, prev_level + change))  # Keep between 0.1 and 0.95
            
            # Apply seasonal factor
            daily_level = max(0.1, min(0.95, daily_level * seasonal_factor))
            
            # Add to data
            metrics["data"].append({
                "date": date.strftime("%Y-%m-%d"),
                "storage_level": daily_level,
                "capacity_utilization": daily_level,
                "estimated_volume": int(daily_level * 1000000),  # Assuming capacity of 1M barrels
                "image_url": f"https://example.com/satellite/{location}/image_{date.strftime('%Y%m%d')}.jpg"
            })
    
    else:
        # Generic location - track general activity
        metrics = {
            "type": "general",
            "location_name": location,
            "metrics": "activity_index",
            "data": []
        }
        
        # Generate generic activity data
        base_activity = np.random.uniform(0.4, 0.7)  # Base activity level
        
        for date in date_range:
            # Weekly patterns
            day_factor = 0.7 if date.weekday() >= 5 else 1.0  # Less activity on weekends
            
            # Daily activity with some randomness
            daily_activity = base_activity * day_factor * np.random.uniform(0.9, 1.1)
            
            # Add to data
            metrics["data"].append({
                "date": date.strftime("%Y-%m-%d"),
                "activity_index": daily_activity,
                "change_from_previous": 0 if date == date_range[0] else daily_activity - metrics["data"][-1]["activity_index"],
                "image_url": f"https://example.com/satellite/{location}/image_{date.strftime('%Y%m%d')}.jpg"
            })
    
    return metrics

# Helper function to generate mock macroeconomic indicators
def generate_mock_macro_indicators(indicators: List[str], start_date: str, end_date: str) -> Dict[str, Any]:
    """
    Generate mock macroeconomic indicator data for the specified indicators and date range.
    
    Args:
        indicators: List of indicator names
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        
    Returns:
        Dictionary with macroeconomic indicator data
    """
    # Parse dates
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    
    # Generate date range - monthly for macro indicators
    date_range = pd.date_range(start=start, end=end, freq='M')
    
    # Generate mock macro data
    np.random.seed(47)  # Different seed
    
    # Initialize results
    results = {}
    
    # Define indicator parameters
    indicator_params = {
        "gdp": {
            "name": "GDP Growth Rate",
            "unit": "percent",
            "base_value": 2.5,
            "volatility": 0.5,
            "frequency": "quarterly"
        },
        "unemployment": {
            "name": "Unemployment Rate",
            "unit": "percent",
            "base_value": 4.0,
            "volatility": 0.2,
            "frequency": "monthly"
        },
        "inflation": {
            "name": "Inflation Rate (CPI)",
            "unit": "percent",
            "base_value": 2.2,
            "volatility": 0.3,
            "frequency": "monthly"
        },
        "interest_rates": {
            "name": "Federal Funds Rate",
            "unit": "percent",
            "base_value": 1.5,
            "volatility": 0.1,
            "frequency": "daily"
        },
        "housing": {
            "name": "Housing Price Index",
            "unit": "index",
            "base_value": 200,
            "volatility": 2.0,
            "frequency": "monthly"
        },
        "consumer_confidence": {
            "name": "Consumer Confidence Index",
            "unit": "index",
            "base_value": 100,
            "volatility": 5.0,
            "frequency": "monthly"
        },
        "retail_sales": {
            "name": "Retail Sales Growth",
            "unit": "percent",
            "base_value": 0.4,
            "volatility": 0.3,
            "frequency": "monthly"
        },
        "industrial_production": {
            "name": "Industrial Production Index",
            "unit": "index",
            "base_value": 105,
            "volatility": 1.0,
            "frequency": "monthly"
        },
        "pmi": {
            "name": "Purchasing Managers Index",
            "unit": "index",
            "base_value": 52,
            "volatility": 2.0,
            "frequency": "monthly"
        },
        "trade_balance": {
            "name": "Trade Balance",
            "unit": "billion USD",
            "base_value": -50,
            "volatility": 5.0,
            "frequency": "monthly"
        }
    }
    
    # Generate data for each requested indicator
    for indicator in indicators:
        if indicator in indicator_params:
            params = indicator_params[indicator]
            
            # Initialize indicator data
            indicator_data = {
                "name": params["name"],
                "unit": params["unit"],
                "frequency": params["frequency"],
                "data": []
            }
            
            # Generate time series with some autocorrelation
            value = params["base_value"]
            
            # Adjust date range based on frequency
            if params["frequency"] == "quarterly":
                # Use quarterly dates
                quarter_dates = pd.date_range(start=start, end=end, freq='Q')
                for date in quarter_dates:
                    # Add some autocorrelation
                    change = np.random.normal(0, params["volatility"])
                    value = value + change
                    
                    # Add to data
                    indicator_data["data"].append({
                        "date": date.strftime("%Y-%m-%d"),
                        "value": value,
                        "change": change
                    })
            else:
                # Use monthly dates
                for date in date_range:
                    # Add some autocorrelation
                    change = np.random.normal(0, params["volatility"])
                    value = value + change
                    
                    # Add to data
                    indicator_data["data"].append({
                        "date": date.strftime("%Y-%m-%d"),
                        "value": value,
                        "change": change
                    })
            
            # Add to results
            results[indicator] = indicator_data
    
    return results

# Helper function to generate mock alternative data correlation
def generate_mock_correlation(symbol: str, data_type: str, lookback_days: int = 90) -> Dict[str, Any]:
    """
    Generate mock correlation data between alternative data and price movements.
    
    Args:
        symbol: Stock symbol
        data_type: Type of alternative data
        lookback_days: Number of days to look back
        
    Returns:
        Dictionary with correlation data
    """
    # Generate date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=lookback_days)
    date_range = pd.date_range(start=start_date, end=end_date, freq='D')
    
    # Generate mock correlation data
    np.random.seed(48)  # Different seed
    
    # Define correlation parameters based on data type
    if data_type == "sentiment":
        correlation_value = np.random.uniform(0.3, 0.7)
        lag_days = np.random.randint(0, 3)
        significance = np.random.uniform(0.01, 0.05)
    elif data_type == "news":
        correlation_value = np.random.uniform(0.4, 0.8)
        lag_days = np.random.randint(0, 2)
        significance = np.random.uniform(0.005, 0.03)
    elif data_type == "social_media":
        correlation_value = np.random.uniform(0.2, 0.6)
        lag_days = np.random.randint(0, 1)
        significance = np.random.uniform(0.02, 0.1)
    elif data_type == "satellite":
        correlation_value = np.random.uniform(0.3, 0.5)
        lag_days = np.random.randint(5, 15)
        significance = np.random.uniform(0.01, 0.07)
    elif data_type == "macro":
        correlation_value = np.random.uniform(0.2, 0.4)
        lag_days = np.random.randint(10, 30)
        significance = np.random.uniform(0.03, 0.1)
    else:
        correlation_value = np.random.uniform(0.1, 0.3)
        lag_days = np.random.randint(1, 7)
        significance = np.random.uniform(0.05, 0.2)
    
    # Generate time series data
    price_data = []
    alt_data = []
    
    # Base values
    price = 100.0
    alt_value = 50.0
    
    # Generate correlated time series
    for i, date in enumerate(date_range):
        # Generate random changes
        price_change = np.random.normal(0, 1)
        
        # Add correlation with lag
        if i >= lag_days:
            # Use previous price change to influence alternative data
            alt_change = correlation_value * price_data[i - lag_days]["change"] + np.random.normal(0, 1 - correlation_value)
        else:
            alt_change = np.random.normal(0, 1)
        
        # Update values
        price += price_change
        alt_value += alt_change
        
        # Add to data
        price_data.append({
            "date": date.strftime("%Y-%m-%d"),
            "value": price,
            "change": price_change
        })
        
        alt_data.append({
            "date": date.strftime("%Y-%m-%d"),
            "value": alt_value,
            "change": alt_change
        })
    
    # Create correlation result
    correlation_result = {
        "symbol": symbol,
        "data_type": data_type,
        "correlation": correlation_value,
        "lag_days": lag_days,
        "significance": significance,
        "lookback_days": lookback_days,
        "price_data": price_data,
        "alternative_data": alt_data,
        "analysis": {
            "correlation_by_timeframe": {
                "7d": np.random.uniform(0.1, 0.9),
                "30d": np.random.uniform(0.1, 0.9),
                "90d": correlation_value
            },
            "predictive_power": np.random.uniform(0.1, 0.8),
            "confidence_interval": [
                max(0, correlation_value - 0.15),
                min(1, correlation_value + 0.15)
            ]
        }
    }
    
    return correlation_result

# API Endpoints

@router.get("/sources")
async def get_data_sources():
    """
    Get available alternative data sources.
    """
    try:
        # Generate mock data sources
        sources = generate_mock_data_sources()
        
        return {
            "sources": sources,
            "count": len(sources),
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data sources: {str(e)}")

@router.put("/sources/{source_id}")
async def update_data_source(source_id: str, config: DataSourceConfig):
    """
    Update data source configuration.
    """
    try:
        # Get mock data sources
        sources = generate_mock_data_sources()
        
        # Find the source with the given ID
        source = next((s for s in sources if s["id"] == source_id), None)
        
        if not source:
            raise HTTPException(status_code=404, detail=f"Data source with ID {source_id} not found")
        
        # Update the source configuration
        source["config"].update(config.config)
        source["lastUpdated"] = datetime.now().isoformat()
        
        return {
            "source": source,
            "updated_at": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating data source: {str(e)}")

@router.post("/sentiment")
async def get_sentiment_analysis(request: SentimentAnalysisRequest):
    """
    Get sentiment analysis for symbols.
    """
    try:
        # Set default values
        symbols = request.symbols or ["AAPL", "MSFT", "GOOGL", "AMZN", "META"]
        days = 30
        
        if request.start_date and request.end_date:
            start_date = datetime.strptime(request.start_date, "%Y-%m-%d")
            end_date = datetime.strptime(request.end_date, "%Y-%m-%d")
            days = (end_date - start_date).days
        
        # Generate mock sentiment data
        sentiment_data = generate_mock_sentiment_data(symbols, days)
        
        # Filter by sources if specified
        if request.sources:
            sentiment_data = [item for item in sentiment_data if item["source"] in request.sources]
        
        # Apply limit
        if request.limit and request.limit < len(sentiment_data):
            sentiment_data = sentiment_data[:request.limit]
        
        return {
            "results": sentiment_data,
            "count": len(sentiment_data),
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching sentiment analysis: {str(e)}")

@router.get("/sentiment/trends")
async def get_sentiment_trends(symbols: str = Query(...), days: int = Query(30)):
    """
    Get sentiment trends for symbols.
    """
    try:
        # Parse symbols
        symbol_list = symbols.split(",")
        
        # Generate mock sentiment trends
        trends = generate_mock_sentiment_trends(symbol_list, days)
        
        return {
            "trends": trends,
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching sentiment trends: {str(e)}")

@router.post("/news")
async def get_news(request: NewsRequest):
    """
    Get news for symbols.
    """
    try:
        # Set default values
        symbols = request.symbols or ["AAPL", "MSFT", "GOOGL", "AMZN", "META"]
        days = 30
        
        if request.start_date and request.end_date:
            start_date = datetime.strptime(request.start_date, "%Y-%m-%d")
            end_date = datetime.strptime(request.end_date, "%Y-%m-%d")
            days = (end_date - start_date).days
        
        # Generate mock news data
        news_data = generate_mock_news_data(symbols, days)
        
        # Filter by categories if specified
        if request.categories:
            news_data = [item for item in news_data if any(cat in request.categories for cat in item["categories"])]
        
        # Filter by sources if specified
        if request.sources:
            news_data = [item for item in news_data if item["source"] in request.sources]
        
        # Filter by minimum relevance
        if request.min_relevance:
            news_data = [item for item in news_data if item["relevance"] >= request.min_relevance]
        
        # Apply pagination
        start_idx = request.offset or 0
        end_idx = start_idx + (request.limit or 20)
        paginated_news = news_data[start_idx:end_idx]
        
        return {
            "news": paginated_news,
            "count": len(paginated_news),
            "total": len(news_data),
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching news: {str(e)}")

@router.post("/social-media")
async def get_social_media_mentions(request: SocialMediaRequest):
    """
    Get social media mentions for symbols.
    """
    try:
        # Set default values
        symbols = request.symbols or ["AAPL", "MSFT", "GOOGL", "AMZN", "META"]
        days = 30
        
        if request.start_date and request.end_date:
            start_date = datetime.strptime(request.start_date, "%Y-%m-%d")
            end_date = datetime.strptime(request.end_date, "%Y-%m-%d")
            days = (end_date - start_date).days
        
        # Generate mock social media data
        social_media_data = generate_mock_social_media_data(symbols, days)
        
        # Filter by platforms if specified
        if request.platforms:
            social_media_data = [item for item in social_media_data if item["platform"] in request.platforms]
        
        # Filter by minimum engagement
        if request.min_engagement:
            social_media_data = [item for item in social_media_data if item["engagement"] >= request.min_engagement]
        
        # Apply pagination
        start_idx = request.offset or 0
        end_idx = start_idx + (request.limit or 20)
        paginated_mentions = social_media_data[start_idx:end_idx]
        
        return {
            "mentions": paginated_mentions,
            "count": len(paginated_mentions),
            "total": len(social_media_data),
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching social media mentions: {str(e)}")

@router.get("/summary/{symbol}")
async def get_alternative_data_summary(symbol: str):
    """
    Get alternative data summary for a symbol.
    """
    try:
        # Generate mock sentiment data
        sentiment_data = generate_mock_sentiment_data([symbol], 7)
        
        # Generate mock news data
        news_data = generate_mock_news_data([symbol], 7)
        
        # Generate mock social media data
        social_media_data = generate_mock_social_media_data([symbol], 7)
        
        # Generate mock sentiment trends
        sentiment_trends = generate_mock_sentiment_trends([symbol], 30)
        
        # Calculate sentiment metrics
        sentiment_scores = [item["score"] for item in sentiment_data]
        avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0.5
        
        # Calculate news metrics
        news_sentiment_scores = [item["sentiment"]["score"] for item in news_data]
        avg_news_sentiment = sum(news_sentiment_scores) / len(news_sentiment_scores) if news_sentiment_scores else 0.5
        
        # Calculate social media metrics
        social_sentiment_scores = [item["sentiment"]["score"] for item in social_media_data]
        avg_social_sentiment = sum(social_sentiment_scores) / len(social_sentiment_scores) if social_sentiment_scores else 0.5
        
        # Create summary
        summary = {
            "symbol": symbol,
            "sentiment": {
                "overall_score": avg_sentiment,
                "news_score": avg_news_sentiment,
                "social_score": avg_social_sentiment,
                "sentiment_trend": sentiment_trends[0]["data"] if sentiment_trends else [],
                "recent_change": np.random.uniform(-0.2, 0.2)
            },
            "news": {
                "count": len(news_data),
                "recent_articles": news_data[:3],
                "categories": list(set(cat for item in news_data for cat in item["categories"]))
            },
            "social_media": {
                "count": len(social_media_data),
                "engagement": sum(item["engagement"] for item in social_media_data),
                "recent_mentions": social_media_data[:3],
                "platforms": list(set(item["platform"] for item in social_media_data))
            },
            "correlations": {
                "sentiment_price": np.random.uniform(0.3, 0.7),
                "news_volume_volatility": np.random.uniform(0.2, 0.6),
                "social_engagement_volume": np.random.uniform(0.4, 0.8)
            },
            "generated_at": datetime.now().isoformat()
        }
        
        return {
            "summary": summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching alternative data summary: {str(e)}")

@router.post("/analyze-text")
async def analyze_text(text: Dict[str, str]):
    """
    Run sentiment analysis on custom text.
    """
    try:
        # Extract text from request
        input_text = text.get("text", "")
        
        if not input_text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        # Generate mock sentiment analysis
        np.random.seed(int(sum(ord(c) for c in input_text) % 1000))  # Seed based on text
        
        # Analyze sentiment based on keywords
        positive_keywords = ["bullish", "growth", "profit", "increase", "up", "gain", "positive", "success", "strong", "opportunity"]
        negative_keywords = ["bearish", "decline", "loss", "decrease", "down", "drop", "negative", "fail", "weak", "risk"]
        
        # Count keyword occurrences
        positive_count = sum(input_text.lower().count(keyword) for keyword in positive_keywords)
        negative_count = sum(input_text.lower().count(keyword) for keyword in negative_keywords)
        
        # Calculate base sentiment score
        total_count = positive_count + negative_count
        base_score = 0.5  # Neutral by default
        
        if total_count > 0:
            base_score = 0.5 + 0.5 * (positive_count - negative_count) / total_count
        
        # Add some randomness
        sentiment_score = max(0, min(1, base_score + np.random.normal(0, 0.1)))
        
        # Determine sentiment type
        sentiment_type = "positive" if sentiment_score > 0.6 else "negative" if sentiment_score < 0.4 else "neutral"
        
        # Extract potential symbols (uppercase words 1-5 characters)
        import re
        potential_symbols = re.findall(r'\b[A-Z]{1,5}\b', input_text)
        
        # Create analysis result
        analysis = {
            "sentiment": {
                "score": sentiment_score,
                "magnitude": np.random.uniform(0.5, 1.0),
                "type": sentiment_type
            },
            "entities": [
                {
                    "name": symbol,
                    "type": "STOCK_SYMBOL",
                    "salience": np.random.uniform(0.5, 1.0)
                }
                for symbol in potential_symbols
            ],
            "language": "en",
            "text_length": len(input_text),
            "generated_at": datetime.now().isoformat()
        }
        
        return {
            "analysis": analysis
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing text: {str(e)}")

@router.get("/satellite")
async def get_satellite_data(
    location: str = Query(...),
    startDate: str = Query(...),
    endDate: str = Query(...)
):
    """
    Get satellite imagery data.
    """
    try:
        # Generate mock satellite data
        imagery = generate_mock_satellite_data(location, startDate, endDate)
        
        return {
            "imagery": imagery,
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching satellite data: {str(e)}")

@router.get("/macro")
async def get_macro_indicators(
    indicators: str = Query(...),
    startDate: str = Query(...),
    endDate: str = Query(...)
):
    """
    Get macroeconomic indicators.
    """
    try:
        # Parse indicators
        indicator_list = indicators.split(",")
        
        # Generate mock macro indicators
        macro_data = generate_mock_macro_indicators(indicator_list, startDate, endDate)
        
        return {
            "indicators": macro_data,
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching macroeconomic indicators: {str(e)}")

@router.get("/correlation")
async def get_alternative_data_correlation(
    symbol: str = Query(...),
    dataType: str = Query(...),
    lookbackDays: int = Query(90)
):
    """
    Get correlation between alternative data and price movements.
    """
    try:
        # Generate mock correlation data
        correlation = generate_mock_correlation(symbol, dataType, lookbackDays)
        
        return {
            "correlation": correlation,
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching alternative data correlation: {str(e)}")