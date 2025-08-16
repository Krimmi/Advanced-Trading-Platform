"""
Event Detection Module
This module provides tools for detecting and analyzing financial events.
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Union, Tuple
import logging
from datetime import datetime, timedelta
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("event_detection")

class FinancialEvent:
    """
    Class representing a financial event.
    """
    
    def __init__(
        self,
        event_type: str,
        date: Union[str, datetime],
        symbol: str,
        description: str,
        source: str,
        impact_score: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize a financial event.
        
        Args:
            event_type: Type of event (earnings, dividend, merger, etc.)
            date: Date of the event
            symbol: Stock symbol associated with the event
            description: Description of the event
            source: Source of the event information
            impact_score: Estimated impact score of the event (-1.0 to 1.0)
            metadata: Additional metadata about the event
        """
        self.event_type = event_type
        
        # Convert date to datetime if it's a string
        if isinstance(date, str):
            try:
                self.date = datetime.fromisoformat(date)
            except ValueError:
                try:
                    self.date = datetime.strptime(date, "%Y-%m-%d")
                except ValueError:
                    self.date = datetime.now()
                    logger.warning(f"Could not parse date: {date}, using current date")
        else:
            self.date = date
        
        self.symbol = symbol
        self.description = description
        self.source = source
        self.impact_score = impact_score
        self.metadata = metadata or {}
        self.id = f"{symbol}_{event_type}_{self.date.strftime('%Y%m%d%H%M%S')}"
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the event to a dictionary.
        
        Returns:
            Dictionary representation of the event
        """
        return {
            "id": self.id,
            "event_type": self.event_type,
            "date": self.date.isoformat(),
            "symbol": self.symbol,
            "description": self.description,
            "source": self.source,
            "impact_score": self.impact_score,
            "metadata": self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'FinancialEvent':
        """
        Create an event from a dictionary.
        
        Args:
            data: Dictionary representation of the event
            
        Returns:
            FinancialEvent instance
        """
        return cls(
            event_type=data["event_type"],
            date=data["date"],
            symbol=data["symbol"],
            description=data["description"],
            source=data["source"],
            impact_score=data.get("impact_score"),
            metadata=data.get("metadata", {})
        )


class EventDetector:
    """
    Base class for event detectors.
    """
    
    def __init__(self):
        """
        Initialize the event detector.
        """
        self.logger = logger
    
    def detect_events(self, data: Any) -> List[FinancialEvent]:
        """
        Detect events from data.
        
        Args:
            data: Data to analyze for events
            
        Returns:
            List of detected events
        """
        raise NotImplementedError("Subclasses must implement detect_events")


class EarningsEventDetector(EventDetector):
    """
    Detector for earnings-related events.
    """
    
    def detect_events(
        self,
        earnings_data: List[Dict[str, Any]]
    ) -> List[FinancialEvent]:
        """
        Detect earnings events from earnings data.
        
        Args:
            earnings_data: List of earnings announcements
            
        Returns:
            List of earnings events
        """
        try:
            events = []
            
            for earnings in earnings_data:
                symbol = earnings.get("symbol", "")
                date = earnings.get("date", "")
                eps_actual = earnings.get("epsActual")
                eps_estimate = earnings.get("epsEstimate")
                revenue_actual = earnings.get("revenueActual")
                revenue_estimate = earnings.get("revenueEstimate")
                
                # Skip if missing essential data
                if not symbol or not date:
                    continue
                
                # Calculate surprise percentages
                eps_surprise_pct = None
                revenue_surprise_pct = None
                
                if eps_estimate is not None and eps_estimate != 0 and eps_actual is not None:
                    eps_surprise_pct = (eps_actual - eps_estimate) / abs(eps_estimate)
                
                if revenue_estimate is not None and revenue_estimate != 0 and revenue_actual is not None:
                    revenue_surprise_pct = (revenue_actual - revenue_estimate) / revenue_estimate
                
                # Determine event type based on surprise
                event_type = "earnings_announcement"
                
                if eps_surprise_pct is not None:
                    if eps_surprise_pct > 0.1:  # 10% beat
                        event_type = "earnings_beat"
                    elif eps_surprise_pct < -0.1:  # 10% miss
                        event_type = "earnings_miss"
                
                # Create description
                description = f"Earnings announcement for {symbol}"
                
                if eps_actual is not None and eps_estimate is not None:
                    description += f". EPS: ${eps_actual:.2f} vs. estimate ${eps_estimate:.2f}"
                    
                    if eps_surprise_pct is not None:
                        description += f" ({eps_surprise_pct*100:.1f}% {'beat' if eps_surprise_pct > 0 else 'miss'})"
                
                if revenue_actual is not None and revenue_estimate is not None:
                    description += f". Revenue: ${revenue_actual/1e6:.1f}M vs. estimate ${revenue_estimate/1e6:.1f}M"
                    
                    if revenue_surprise_pct is not None:
                        description += f" ({revenue_surprise_pct*100:.1f}% {'beat' if revenue_surprise_pct > 0 else 'miss'})"
                
                # Calculate impact score based on surprise
                impact_score = 0.0
                
                if eps_surprise_pct is not None:
                    # Cap at -1.0 to 1.0
                    eps_impact = min(max(eps_surprise_pct, -1.0), 1.0)
                    impact_score += eps_impact * 0.7  # 70% weight to EPS
                
                if revenue_surprise_pct is not None:
                    # Cap at -1.0 to 1.0
                    revenue_impact = min(max(revenue_surprise_pct, -1.0), 1.0)
                    impact_score += revenue_impact * 0.3  # 30% weight to revenue
                
                # Create event
                event = FinancialEvent(
                    event_type=event_type,
                    date=date,
                    symbol=symbol,
                    description=description,
                    source="earnings_calendar",
                    impact_score=impact_score,
                    metadata={
                        "eps_actual": eps_actual,
                        "eps_estimate": eps_estimate,
                        "eps_surprise_pct": eps_surprise_pct,
                        "revenue_actual": revenue_actual,
                        "revenue_estimate": revenue_estimate,
                        "revenue_surprise_pct": revenue_surprise_pct
                    }
                )
                
                events.append(event)
            
            return events
        except Exception as e:
            self.logger.error(f"Error detecting earnings events: {e}")
            return []


class DividendEventDetector(EventDetector):
    """
    Detector for dividend-related events.
    """
    
    def detect_events(
        self,
        dividend_data: List[Dict[str, Any]]
    ) -> List[FinancialEvent]:
        """
        Detect dividend events from dividend data.
        
        Args:
            dividend_data: List of dividend announcements
            
        Returns:
            List of dividend events
        """
        try:
            events = []
            
            for dividend in dividend_data:
                symbol = dividend.get("symbol", "")
                declaration_date = dividend.get("declarationDate", "")
                ex_date = dividend.get("exDate", "")
                payment_date = dividend.get("paymentDate", "")
                record_date = dividend.get("recordDate", "")
                amount = dividend.get("amount")
                
                # Skip if missing essential data
                if not symbol or not amount:
                    continue
                
                # Create events for different dividend dates
                if declaration_date:
                    description = f"Dividend declaration for {symbol}: ${amount:.2f} per share"
                    
                    event = FinancialEvent(
                        event_type="dividend_declaration",
                        date=declaration_date,
                        symbol=symbol,
                        description=description,
                        source="dividend_calendar",
                        impact_score=0.2,  # Modest positive impact
                        metadata={
                            "amount": amount,
                            "ex_date": ex_date,
                            "payment_date": payment_date,
                            "record_date": record_date
                        }
                    )
                    
                    events.append(event)
                
                if ex_date:
                    description = f"Ex-dividend date for {symbol}: ${amount:.2f} per share"
                    
                    event = FinancialEvent(
                        event_type="ex_dividend",
                        date=ex_date,
                        symbol=symbol,
                        description=description,
                        source="dividend_calendar",
                        impact_score=-0.1,  # Slight negative impact on ex-date
                        metadata={
                            "amount": amount,
                            "declaration_date": declaration_date,
                            "payment_date": payment_date,
                            "record_date": record_date
                        }
                    )
                    
                    events.append(event)
                
                if payment_date:
                    description = f"Dividend payment for {symbol}: ${amount:.2f} per share"
                    
                    event = FinancialEvent(
                        event_type="dividend_payment",
                        date=payment_date,
                        symbol=symbol,
                        description=description,
                        source="dividend_calendar",
                        impact_score=0.1,  # Slight positive impact
                        metadata={
                            "amount": amount,
                            "declaration_date": declaration_date,
                            "ex_date": ex_date,
                            "record_date": record_date
                        }
                    )
                    
                    events.append(event)
            
            return events
        except Exception as e:
            self.logger.error(f"Error detecting dividend events: {e}")
            return []


class NewsEventDetector(EventDetector):
    """
    Detector for news-related events.
    """
    
    def __init__(self):
        """
        Initialize the news event detector.
        """
        super().__init__()
        
        # Define keywords for different event types
        self.event_keywords = {
            "merger_acquisition": [
                "merger", "acquisition", "acquire", "takeover", "buyout", "M&A",
                "purchased", "acquiring", "merging", "deal", "transaction"
            ],
            "product_launch": [
                "launch", "unveil", "introduce", "announce", "release", "debut",
                "new product", "new service", "new offering"
            ],
            "management_change": [
                "CEO", "CFO", "COO", "CTO", "executive", "resign", "appoint",
                "management", "director", "board", "leadership"
            ],
            "legal_regulatory": [
                "lawsuit", "legal", "court", "regulation", "regulatory", "compliance",
                "settlement", "fine", "penalty", "investigation", "SEC", "FDA"
            ],
            "financial_results": [
                "earnings", "revenue", "profit", "loss", "financial results",
                "quarterly results", "annual results", "guidance", "forecast"
            ],
            "stock_split": [
                "stock split", "share split", "split shares", "reverse split"
            ],
            "share_repurchase": [
                "buyback", "share repurchase", "stock repurchase", "repurchase program"
            ]
        }
    
    def _classify_news(self, headline: str, content: str) -> str:
        """
        Classify news into an event type based on keywords.
        
        Args:
            headline: News headline
            content: News content
            
        Returns:
            Event type
        """
        # Combine headline and content for analysis
        text = (headline + " " + content).lower()
        
        # Check for each event type
        for event_type, keywords in self.event_keywords.items():
            for keyword in keywords:
                if keyword.lower() in text:
                    return event_type
        
        # Default to general news
        return "general_news"
    
    def _estimate_impact_score(self, headline: str, content: str, event_type: str) -> float:
        """
        Estimate the impact score of a news event.
        
        Args:
            headline: News headline
            content: News content
            event_type: Type of event
            
        Returns:
            Impact score between -1.0 and 1.0
        """
        # Combine headline and content for analysis
        text = (headline + " " + content).lower()
        
        # Define positive and negative sentiment words
        positive_words = [
            "positive", "growth", "increase", "rise", "gain", "profit", "success",
            "beat", "exceed", "above", "higher", "strong", "improve", "up", "better",
            "bullish", "opportunity", "innovation", "partnership", "collaboration"
        ]
        
        negative_words = [
            "negative", "decline", "decrease", "fall", "drop", "loss", "fail",
            "miss", "below", "lower", "weak", "worsen", "down", "worse",
            "bearish", "risk", "concern", "issue", "problem", "challenge", "lawsuit"
        ]
        
        # Count positive and negative words
        positive_count = sum(1 for word in positive_words if word in text)
        negative_count = sum(1 for word in negative_words if word in text)
        
        # Calculate base sentiment score
        total_count = positive_count + negative_count
        if total_count > 0:
            base_score = (positive_count - negative_count) / total_count
        else:
            base_score = 0.0
        
        # Adjust based on event type
        event_type_multipliers = {
            "merger_acquisition": 0.8,
            "product_launch": 0.6,
            "management_change": 0.5,
            "legal_regulatory": -0.7,
            "financial_results": 0.7,
            "stock_split": 0.3,
            "share_repurchase": 0.5,
            "general_news": 0.3
        }
        
        multiplier = event_type_multipliers.get(event_type, 0.3)
        
        # Calculate final score, capped between -1.0 and 1.0
        impact_score = base_score * multiplier
        impact_score = max(min(impact_score, 1.0), -1.0)
        
        return impact_score
    
    def detect_events(
        self,
        news_data: List[Dict[str, Any]]
    ) -> List[FinancialEvent]:
        """
        Detect events from news data.
        
        Args:
            news_data: List of news articles
            
        Returns:
            List of news events
        """
        try:
            events = []
            
            for news in news_data:
                symbol = news.get("symbol", "")
                date = news.get("date", "")
                headline = news.get("headline", "")
                content = news.get("content", "")
                source = news.get("source", "news")
                
                # Skip if missing essential data
                if not symbol or not date or not headline:
                    continue
                
                # Classify news into event type
                event_type = self._classify_news(headline, content)
                
                # Estimate impact score
                impact_score = self._estimate_impact_score(headline, content, event_type)
                
                # Create event
                event = FinancialEvent(
                    event_type=event_type,
                    date=date,
                    symbol=symbol,
                    description=headline,
                    source=source,
                    impact_score=impact_score,
                    metadata={
                        "headline": headline,
                        "content": content,
                        "url": news.get("url", "")
                    }
                )
                
                events.append(event)
            
            return events
        except Exception as e:
            self.logger.error(f"Error detecting news events: {e}")
            return []


class TechnicalEventDetector(EventDetector):
    """
    Detector for technical analysis events.
    """
    
    def detect_events(
        self,
        price_data: pd.DataFrame,
        volume_data: Optional[pd.DataFrame] = None
    ) -> List[FinancialEvent]:
        """
        Detect technical events from price and volume data.
        
        Args:
            price_data: DataFrame of price data with DatetimeIndex
            volume_data: DataFrame of volume data with DatetimeIndex (optional)
            
        Returns:
            List of technical events
        """
        try:
            events = []
            
            # Ensure we have a symbol
            if isinstance(price_data, pd.DataFrame):
                if 'symbol' in price_data.columns:
                    symbols = price_data['symbol'].unique()
                else:
                    # Assume each column is a symbol
                    symbols = price_data.columns
            else:
                self.logger.error("Price data must be a DataFrame")
                return []
            
            for symbol in symbols:
                # Get price data for the symbol
                if 'symbol' in price_data.columns:
                    symbol_prices = price_data[price_data['symbol'] == symbol]
                    close_prices = symbol_prices['close']
                    dates = symbol_prices.index
                else:
                    close_prices = price_data[symbol]
                    dates = price_data.index
                
                # Get volume data for the symbol if available
                if volume_data is not None:
                    if 'symbol' in volume_data.columns:
                        symbol_volumes = volume_data[volume_data['symbol'] == symbol]
                        volumes = symbol_volumes['volume']
                    else:
                        volumes = volume_data[symbol]
                else:
                    volumes = None
                
                # Skip if not enough data
                if len(close_prices) < 20:
                    continue
                
                # Calculate moving averages
                ma_20 = close_prices.rolling(window=20).mean()
                ma_50 = close_prices.rolling(window=50).mean()
                ma_200 = close_prices.rolling(window=200).mean()
                
                # Detect moving average crossovers
                for i in range(1, len(close_prices)):
                    date = dates[i]
                    
                    # Golden Cross (50-day MA crosses above 200-day MA)
                    if (i > 200 and 
                        ma_50.iloc[i-1] <= ma_200.iloc[i-1] and 
                        ma_50.iloc[i] > ma_200.iloc[i]):
                        
                        description = f"Golden Cross for {symbol}: 50-day MA crossed above 200-day MA"
                        
                        event = FinancialEvent(
                            event_type="golden_cross",
                            date=date,
                            symbol=symbol,
                            description=description,
                            source="technical_analysis",
                            impact_score=0.7,  # Strong positive signal
                            metadata={
                                "ma_50": ma_50.iloc[i],
                                "ma_200": ma_200.iloc[i],
                                "close_price": close_prices.iloc[i]
                            }
                        )
                        
                        events.append(event)
                    
                    # Death Cross (50-day MA crosses below 200-day MA)
                    if (i > 200 and 
                        ma_50.iloc[i-1] >= ma_200.iloc[i-1] and 
                        ma_50.iloc[i] < ma_200.iloc[i]):
                        
                        description = f"Death Cross for {symbol}: 50-day MA crossed below 200-day MA"
                        
                        event = FinancialEvent(
                            event_type="death_cross",
                            date=date,
                            symbol=symbol,
                            description=description,
                            source="technical_analysis",
                            impact_score=-0.7,  # Strong negative signal
                            metadata={
                                "ma_50": ma_50.iloc[i],
                                "ma_200": ma_200.iloc[i],
                                "close_price": close_prices.iloc[i]
                            }
                        )
                        
                        events.append(event)
                    
                    # Price crossing above 200-day MA
                    if (i > 200 and 
                        close_prices.iloc[i-1] <= ma_200.iloc[i-1] and 
                        close_prices.iloc[i] > ma_200.iloc[i]):
                        
                        description = f"Bullish Signal for {symbol}: Price crossed above 200-day MA"
                        
                        event = FinancialEvent(
                            event_type="price_above_ma200",
                            date=date,
                            symbol=symbol,
                            description=description,
                            source="technical_analysis",
                            impact_score=0.5,  # Positive signal
                            metadata={
                                "ma_200": ma_200.iloc[i],
                                "close_price": close_prices.iloc[i]
                            }
                        )
                        
                        events.append(event)
                    
                    # Price crossing below 200-day MA
                    if (i > 200 and 
                        close_prices.iloc[i-1] >= ma_200.iloc[i-1] and 
                        close_prices.iloc[i] < ma_200.iloc[i]):
                        
                        description = f"Bearish Signal for {symbol}: Price crossed below 200-day MA"
                        
                        event = FinancialEvent(
                            event_type="price_below_ma200",
                            date=date,
                            symbol=symbol,
                            description=description,
                            source="technical_analysis",
                            impact_score=-0.5,  # Negative signal
                            metadata={
                                "ma_200": ma_200.iloc[i],
                                "close_price": close_prices.iloc[i]
                            }
                        )
                        
                        events.append(event)
                
                # Detect volume spikes if volume data available
                if volumes is not None and len(volumes) > 20:
                    # Calculate average volume
                    avg_volume = volumes.rolling(window=20).mean()
                    
                    for i in range(20, len(volumes)):
                        date = dates[i]
                        
                        # Volume spike (volume > 2x 20-day average)
                        if volumes.iloc[i] > 2 * avg_volume.iloc[i]:
                            # Determine if it's bullish or bearish based on price change
                            price_change = close_prices.iloc[i] - close_prices.iloc[i-1]
                            is_bullish = price_change > 0
                            
                            event_type = "bullish_volume_spike" if is_bullish else "bearish_volume_spike"
                            impact_score = 0.4 if is_bullish else -0.4
                            
                            description = f"{'Bullish' if is_bullish else 'Bearish'} Volume Spike for {symbol}: {volumes.iloc[i]/1e6:.1f}M shares ({volumes.iloc[i]/avg_volume.iloc[i]:.1f}x average)"
                            
                            event = FinancialEvent(
                                event_type=event_type,
                                date=date,
                                symbol=symbol,
                                description=description,
                                source="technical_analysis",
                                impact_score=impact_score,
                                metadata={
                                    "volume": volumes.iloc[i],
                                    "avg_volume": avg_volume.iloc[i],
                                    "volume_ratio": volumes.iloc[i] / avg_volume.iloc[i],
                                    "price_change": price_change,
                                    "close_price": close_prices.iloc[i]
                                }
                            )
                            
                            events.append(event)
            
            return events
        except Exception as e:
            self.logger.error(f"Error detecting technical events: {e}")
            return []


class EventDetectionService:
    """
    Service for detecting and analyzing financial events.
    """
    
    def __init__(self):
        """
        Initialize the event detection service.
        """
        self.detectors = {
            "earnings": EarningsEventDetector(),
            "dividend": DividendEventDetector(),
            "news": NewsEventDetector(),
            "technical": TechnicalEventDetector()
        }
        self.logger = logger
    
    def detect_events(
        self,
        data: Dict[str, Any],
        detector_types: Optional[List[str]] = None
    ) -> List[FinancialEvent]:
        """
        Detect events from various data sources.
        
        Args:
            data: Dictionary of data sources
            detector_types: List of detector types to use (optional)
            
        Returns:
            List of detected events
        """
        try:
            all_events = []
            
            # Use all detectors if not specified
            if detector_types is None:
                detector_types = list(self.detectors.keys())
            
            # Run each detector
            for detector_type in detector_types:
                if detector_type not in self.detectors:
                    self.logger.warning(f"Unknown detector type: {detector_type}")
                    continue
                
                detector = self.detectors[detector_type]
                
                if detector_type == "earnings" and "earnings_data" in data:
                    events = detector.detect_events(data["earnings_data"])
                    all_events.extend(events)
                
                elif detector_type == "dividend" and "dividend_data" in data:
                    events = detector.detect_events(data["dividend_data"])
                    all_events.extend(events)
                
                elif detector_type == "news" and "news_data" in data:
                    events = detector.detect_events(data["news_data"])
                    all_events.extend(events)
                
                elif detector_type == "technical" and "price_data" in data:
                    events = detector.detect_events(
                        data["price_data"],
                        data.get("volume_data")
                    )
                    all_events.extend(events)
            
            # Sort events by date
            all_events.sort(key=lambda e: e.date)
            
            return all_events
        except Exception as e:
            self.logger.error(f"Error detecting events: {e}")
            return []
    
    def filter_events(
        self,
        events: List[FinancialEvent],
        start_date: Optional[Union[str, datetime]] = None,
        end_date: Optional[Union[str, datetime]] = None,
        symbols: Optional[List[str]] = None,
        event_types: Optional[List[str]] = None,
        min_impact_score: Optional[float] = None
    ) -> List[FinancialEvent]:
        """
        Filter events based on criteria.
        
        Args:
            events: List of events to filter
            start_date: Start date for filtering
            end_date: End date for filtering
            symbols: List of symbols to include
            event_types: List of event types to include
            min_impact_score: Minimum absolute impact score
            
        Returns:
            Filtered list of events
        """
        try:
            filtered_events = events
            
            # Filter by date
            if start_date is not None:
                if isinstance(start_date, str):
                    start_date = datetime.fromisoformat(start_date)
                
                filtered_events = [e for e in filtered_events if e.date >= start_date]
            
            if end_date is not None:
                if isinstance(end_date, str):
                    end_date = datetime.fromisoformat(end_date)
                
                filtered_events = [e for e in filtered_events if e.date <= end_date]
            
            # Filter by symbol
            if symbols is not None:
                filtered_events = [e for e in filtered_events if e.symbol in symbols]
            
            # Filter by event type
            if event_types is not None:
                filtered_events = [e for e in filtered_events if e.event_type in event_types]
            
            # Filter by impact score
            if min_impact_score is not None:
                filtered_events = [e for e in filtered_events if e.impact_score is not None and abs(e.impact_score) >= min_impact_score]
            
            return filtered_events
        except Exception as e:
            self.logger.error(f"Error filtering events: {e}")
            return events
    
    def analyze_event_impact(
        self,
        events: List[FinancialEvent],
        price_data: pd.DataFrame,
        window_days: int = 5
    ) -> Dict[str, Any]:
        """
        Analyze the price impact of events.
        
        Args:
            events: List of events to analyze
            price_data: DataFrame of price data with DatetimeIndex
            window_days: Number of days to analyze after each event
            
        Returns:
            Dictionary with impact analysis results
        """
        try:
            # Group events by type
            events_by_type = {}
            for event in events:
                if event.event_type not in events_by_type:
                    events_by_type[event.event_type] = []
                
                events_by_type[event.event_type].append(event)
            
            # Analyze impact for each event type
            impact_analysis = {}
            
            for event_type, type_events in events_by_type.items():
                # Skip if too few events
                if len(type_events) < 3:
                    continue
                
                # Calculate price changes after events
                price_changes = []
                
                for event in type_events:
                    symbol = event.symbol
                    event_date = event.date
                    
                    # Get price data for the symbol
                    if 'symbol' in price_data.columns:
                        symbol_prices = price_data[price_data['symbol'] == symbol]
                        close_prices = symbol_prices['close']
                    else:
                        if symbol not in price_data.columns:
                            continue
                        
                        close_prices = price_data[symbol]
                    
                    # Find the event date in the price data
                    try:
                        event_idx = close_prices.index.get_indexer([event_date], method='nearest')[0]
                    except:
                        continue
                    
                    # Skip if not enough data after the event
                    if event_idx + window_days >= len(close_prices):
                        continue
                    
                    # Calculate price change
                    event_price = close_prices.iloc[event_idx]
                    after_price = close_prices.iloc[event_idx + window_days]
                    
                    price_change = (after_price - event_price) / event_price
                    price_changes.append(price_change)
                
                # Calculate statistics
                if price_changes:
                    avg_change = sum(price_changes) / len(price_changes)
                    median_change = sorted(price_changes)[len(price_changes) // 2]
                    std_dev = (sum((x - avg_change) ** 2 for x in price_changes) / len(price_changes)) ** 0.5
                    
                    impact_analysis[event_type] = {
                        "count": len(price_changes),
                        "avg_price_change": avg_change,
                        "median_price_change": median_change,
                        "std_dev": std_dev,
                        "positive_count": sum(1 for x in price_changes if x > 0),
                        "negative_count": sum(1 for x in price_changes if x < 0)
                    }
            
            return impact_analysis
        except Exception as e:
            self.logger.error(f"Error analyzing event impact: {e}")
            return {}