"""
Router for technical analysis endpoints.
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import numpy as np
import json

router = APIRouter()

# --- Helper Functions ---

def generate_mock_price_data(symbol: str, days: int) -> List[Dict[str, Any]]:
    """
    Generate mock price data for a symbol.
    """
    base_price = 100.0
    if symbol == "AAPL":
        base_price = 180.0
    elif symbol == "MSFT":
        base_price = 350.0
    elif symbol == "GOOGL":
        base_price = 140.0
    elif symbol == "AMZN":
        base_price = 150.0
    elif symbol == "TSLA":
        base_price = 250.0
    
    # Generate price data with some trend and volatility
    prices = []
    today = datetime.now()
    
    # Start with base price
    current_price = base_price
    
    # Add some randomness to create a somewhat realistic price series
    for i in range(days):
        date = today - timedelta(days=days-i-1)
        
        # Add random walk with drift
        random_change = np.random.normal(0.0005, 0.015)  # Small positive drift
        current_price = current_price * (1 + random_change)
        
        # Add some mean reversion
        mean_reversion = (base_price - current_price) * 0.01
        current_price = current_price + mean_reversion
        
        # Ensure price doesn't go negative
        current_price = max(current_price, 0.1)
        
        # Generate OHLC data
        open_price = current_price * (1 + np.random.normal(0, 0.005))
        high_price = max(open_price, current_price) * (1 + abs(np.random.normal(0, 0.008)))
        low_price = min(open_price, current_price) * (1 - abs(np.random.normal(0, 0.008)))
        close_price = current_price
        
        # Generate volume
        base_volume = np.random.uniform(500000, 5000000)
        volume = base_volume * (1 + abs(random_change) * 10)  # Higher volume on bigger price moves
        
        prices.append({
            "date": date.strftime("%Y-%m-%d"),
            "open": round(open_price, 2),
            "high": round(high_price, 2),
            "low": round(low_price, 2),
            "close": round(close_price, 2),
            "volume": int(volume)
        })
    
    return prices

def calculate_sma(prices: List[Dict[str, Any]], period: int) -> List[Dict[str, Any]]:
    """
    Calculate Simple Moving Average.
    """
    result = []
    
    for i in range(len(prices)):
        if i < period - 1:
            # Not enough data points yet
            result.append(None)
        else:
            # Calculate SMA
            sum_prices = sum(prices[j]["close"] for j in range(i - period + 1, i + 1))
            sma = sum_prices / period
            result.append(round(sma, 2))
    
    return result

def calculate_ema(prices: List[Dict[str, Any]], period: int) -> List[Dict[str, Any]]:
    """
    Calculate Exponential Moving Average.
    """
    result = []
    multiplier = 2 / (period + 1)
    
    # Start with SMA for the first EMA value
    sma = sum(prices[i]["close"] for i in range(period)) / period
    result.extend([None] * (period - 1))
    result.append(round(sma, 2))
    
    # Calculate EMA for the rest
    for i in range(period, len(prices)):
        ema = (prices[i]["close"] - result[i-1]) * multiplier + result[i-1]
        result.append(round(ema, 2))
    
    return result

def calculate_rsi(prices: List[Dict[str, Any]], period: int = 14) -> List[float]:
    """
    Calculate Relative Strength Index.
    """
    result = [None] * (period)
    
    # Calculate price changes
    changes = [prices[i]["close"] - prices[i-1]["close"] for i in range(1, len(prices))]
    
    # Calculate initial average gain and loss
    gains = [max(0, change) for change in changes[:period]]
    losses = [abs(min(0, change)) for change in changes[:period]]
    
    avg_gain = sum(gains) / period
    avg_loss = sum(losses) / period
    
    # Calculate RSI for the first point after the period
    if avg_loss == 0:
        result.append(100)
    else:
        rs = avg_gain / avg_loss
        result.append(round(100 - (100 / (1 + rs)), 2))
    
    # Calculate RSI for the rest using smoothed averages
    for i in range(period + 1, len(prices)):
        change = prices[i]["close"] - prices[i-1]["close"]
        gain = max(0, change)
        loss = abs(min(0, change))
        
        avg_gain = (avg_gain * (period - 1) + gain) / period
        avg_loss = (avg_loss * (period - 1) + loss) / period
        
        if avg_loss == 0:
            result.append(100)
        else:
            rs = avg_gain / avg_loss
            result.append(round(100 - (100 / (1 + rs)), 2))
    
    return result

def calculate_macd(prices: List[Dict[str, Any]], fast_period: int = 12, slow_period: int = 26, signal_period: int = 9) -> Dict[str, List[float]]:
    """
    Calculate MACD (Moving Average Convergence Divergence).
    """
    # Calculate EMAs
    fast_ema = calculate_ema(prices, fast_period)
    slow_ema = calculate_ema(prices, slow_period)
    
    # Calculate MACD line
    macd_line = []
    for i in range(len(prices)):
        if i < slow_period - 1:
            macd_line.append(None)
        else:
            macd_line.append(round(fast_ema[i] - slow_ema[i], 2))
    
    # Create a list of dictionaries for the signal line calculation
    macd_data = [{"close": v} if v is not None else {"close": 0} for v in macd_line]
    
    # Calculate signal line (EMA of MACD line)
    signal_line_start = slow_period - 1 + signal_period - 1
    signal_line = [None] * signal_line_start
    
    # Calculate initial SMA for signal line
    if len(macd_line) > signal_line_start:
        sma = sum(macd_line[slow_period-1:signal_line_start+1]) / signal_period
        signal_line.append(round(sma, 2))
        
        # Calculate EMA for the rest
        multiplier = 2 / (signal_period + 1)
        for i in range(signal_line_start + 1, len(macd_line)):
            if macd_line[i] is not None:
                ema = (macd_line[i] - signal_line[i-1]) * multiplier + signal_line[i-1]
                signal_line.append(round(ema, 2))
            else:
                signal_line.append(None)
    
    # Calculate histogram
    histogram = []
    for i in range(len(macd_line)):
        if macd_line[i] is not None and signal_line[i] is not None:
            histogram.append(round(macd_line[i] - signal_line[i], 2))
        else:
            histogram.append(None)
    
    return {
        "macd_line": macd_line,
        "signal_line": signal_line,
        "histogram": histogram
    }

def calculate_bollinger_bands(prices: List[Dict[str, Any]], period: int = 20, std_dev: float = 2.0) -> Dict[str, List[float]]:
    """
    Calculate Bollinger Bands.
    """
    sma = calculate_sma(prices, period)
    
    upper_band = []
    lower_band = []
    
    for i in range(len(prices)):
        if i < period - 1:
            upper_band.append(None)
            lower_band.append(None)
        else:
            # Calculate standard deviation
            price_slice = [prices[j]["close"] for j in range(i - period + 1, i + 1)]
            std = np.std(price_slice)
            
            upper_band.append(round(sma[i] + (std_dev * std), 2))
            lower_band.append(round(sma[i] - (std_dev * std), 2))
    
    return {
        "middle_band": sma,
        "upper_band": upper_band,
        "lower_band": lower_band
    }

def identify_support_resistance(prices: List[Dict[str, Any]], window: int = 10, threshold: float = 0.03) -> Dict[str, List[Dict[str, Any]]]:
    """
    Identify support and resistance levels.
    """
    support_levels = []
    resistance_levels = []
    
    # Look for local minima and maxima
    for i in range(window, len(prices) - window):
        # Check if this is a local minimum (support)
        is_min = True
        for j in range(i - window, i):
            if prices[j]["low"] < prices[i]["low"]:
                is_min = False
                break
        
        for j in range(i + 1, i + window + 1):
            if prices[j]["low"] < prices[i]["low"]:
                is_min = False
                break
        
        if is_min:
            # Check if this level is close to an existing support level
            level = prices[i]["low"]
            is_new = True
            
            for support in support_levels:
                if abs(support["level"] - level) / level < threshold:
                    is_new = False
                    # Update strength
                    support["strength"] += 1
                    break
            
            if is_new:
                support_levels.append({
                    "level": level,
                    "date": prices[i]["date"],
                    "strength": 1
                })
        
        # Check if this is a local maximum (resistance)
        is_max = True
        for j in range(i - window, i):
            if prices[j]["high"] > prices[i]["high"]:
                is_max = False
                break
        
        for j in range(i + 1, i + window + 1):
            if prices[j]["high"] > prices[i]["high"]:
                is_max = False
                break
        
        if is_max:
            # Check if this level is close to an existing resistance level
            level = prices[i]["high"]
            is_new = True
            
            for resistance in resistance_levels:
                if abs(resistance["level"] - level) / level < threshold:
                    is_new = False
                    # Update strength
                    resistance["strength"] += 1
                    break
            
            if is_new:
                resistance_levels.append({
                    "level": level,
                    "date": prices[i]["date"],
                    "strength": 1
                })
    
    # Sort by strength
    support_levels.sort(key=lambda x: x["strength"], reverse=True)
    resistance_levels.sort(key=lambda x: x["strength"], reverse=True)
    
    # Take top 5
    support_levels = support_levels[:5]
    resistance_levels = resistance_levels[:5]
    
    return {
        "support": support_levels,
        "resistance": resistance_levels
    }

def identify_patterns(prices: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Identify chart patterns.
    """
    patterns = []
    
    # This is a simplified mock implementation
    # In a real system, this would use more sophisticated pattern recognition algorithms
    
    # Check for head and shoulders pattern (very simplified)
    if len(prices) >= 60:
        # Look at the last 60 days
        recent_prices = prices[-60:]
        
        # Find local maxima
        maxima = []
        for i in range(5, len(recent_prices) - 5):
            is_max = True
            for j in range(i - 5, i):
                if recent_prices[j]["high"] > recent_prices[i]["high"]:
                    is_max = False
                    break
            
            for j in range(i + 1, i + 6):
                if recent_prices[j]["high"] > recent_prices[i]["high"]:
                    is_max = False
                    break
            
            if is_max:
                maxima.append((i, recent_prices[i]["high"]))
        
        # Need at least 3 maxima for head and shoulders
        if len(maxima) >= 3:
            # Check if middle peak is higher than the other two
            for i in range(len(maxima) - 2):
                if maxima[i+1][1] > maxima[i][1] and maxima[i+1][1] > maxima[i+2][1]:
                    # Potential head and shoulders
                    patterns.append({
                        "pattern": "head_and_shoulders",
                        "start_date": recent_prices[maxima[i][0]]["date"],
                        "end_date": recent_prices[maxima[i+2][0]]["date"],
                        "confidence": 0.7
                    })
                    break
    
    # Check for double bottom pattern (very simplified)
    if len(prices) >= 40:
        # Look at the last 40 days
        recent_prices = prices[-40:]
        
        # Find local minima
        minima = []
        for i in range(5, len(recent_prices) - 5):
            is_min = True
            for j in range(i - 5, i):
                if recent_prices[j]["low"] < recent_prices[i]["low"]:
                    is_min = False
                    break
            
            for j in range(i + 1, i + 6):
                if recent_prices[j]["low"] < recent_prices[i]["low"]:
                    is_min = False
                    break
            
            if is_min:
                minima.append((i, recent_prices[i]["low"]))
        
        # Need at least 2 minima for double bottom
        if len(minima) >= 2:
            for i in range(len(minima) - 1):
                # Check if the two bottoms are at similar levels
                if abs(minima[i][1] - minima[i+1][1]) / minima[i][1] < 0.03:
                    # Potential double bottom
                    patterns.append({
                        "pattern": "double_bottom",
                        "start_date": recent_prices[minima[i][0]]["date"],
                        "end_date": recent_prices[minima[i+1][0]]["date"],
                        "confidence": 0.75
                    })
                    break
    
    # Add some random patterns for demonstration
    if not patterns and np.random.random() < 0.3:
        pattern_types = ["flag", "triangle", "cup_and_handle", "wedge", "channel"]
        pattern_type = np.random.choice(pattern_types)
        
        start_idx = np.random.randint(len(prices) - 30)
        end_idx = start_idx + np.random.randint(10, 30)
        
        patterns.append({
            "pattern": pattern_type,
            "start_date": prices[start_idx]["date"],
            "end_date": prices[end_idx]["date"],
            "confidence": np.random.uniform(0.6, 0.9)
        })
    
    return patterns

def calculate_fibonacci_levels(prices: List[Dict[str, Any]], period: int = 120) -> Dict[str, Any]:
    """
    Calculate Fibonacci retracement levels.
    """
    if len(prices) < period:
        period = len(prices)
    
    # Get recent prices
    recent_prices = prices[-period:]
    
    # Find high and low in the period
    high = max(p["high"] for p in recent_prices)
    low = min(p["low"] for p in recent_prices)
    
    # Calculate Fibonacci levels
    diff = high - low
    levels = {
        "0.0": round(low, 2),
        "0.236": round(low + 0.236 * diff, 2),
        "0.382": round(low + 0.382 * diff, 2),
        "0.5": round(low + 0.5 * diff, 2),
        "0.618": round(low + 0.618 * diff, 2),
        "0.786": round(low + 0.786 * diff, 2),
        "1.0": round(high, 2)
    }
    
    return {
        "high": high,
        "low": low,
        "levels": levels
    }

def calculate_pivot_points(prices: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate pivot points for the current day.
    """
    if len(prices) < 2:
        return {}
    
    # Get yesterday's data
    yesterday = prices[-2]
    
    high = yesterday["high"]
    low = yesterday["low"]
    close = yesterday["close"]
    
    # Calculate pivot point
    pivot = (high + low + close) / 3
    
    # Calculate support and resistance levels
    s1 = 2 * pivot - high
    s2 = pivot - (high - low)
    s3 = low - 2 * (high - pivot)
    
    r1 = 2 * pivot - low
    r2 = pivot + (high - low)
    r3 = high + 2 * (pivot - low)
    
    return {
        "pivot": round(pivot, 2),
        "support": {
            "s1": round(s1, 2),
            "s2": round(s2, 2),
            "s3": round(s3, 2)
        },
        "resistance": {
            "r1": round(r1, 2),
            "r2": round(r2, 2),
            "r3": round(r3, 2)
        }
    }

# --- Endpoints ---

@router.get("/indicators/{symbol}")
async def get_technical_indicators(
    symbol: str,
    days: int = Query(120, description="Number of days of historical data", ge=20, le=365),
    sma_periods: List[int] = Query([20, 50, 200], description="SMA periods to calculate"),
    ema_periods: List[int] = Query([12, 26], description="EMA periods to calculate"),
    include_macd: bool = Query(True, description="Include MACD indicator"),
    include_rsi: bool = Query(True, description="Include RSI indicator"),
    include_bollinger: bool = Query(True, description="Include Bollinger Bands")
) -> Dict[str, Any]:
    """
    Get technical indicators for a stock symbol.
    """
    try:
        # Generate mock price data
        prices = generate_mock_price_data(symbol, days)
        
        # Calculate indicators
        indicators = {
            "prices": prices,
            "sma": {},
            "ema": {}
        }
        
        # Calculate SMAs
        for period in sma_periods:
            indicators["sma"][str(period)] = calculate_sma(prices, period)
        
        # Calculate EMAs
        for period in ema_periods:
            indicators["ema"][str(period)] = calculate_ema(prices, period)
        
        # Calculate MACD
        if include_macd:
            indicators["macd"] = calculate_macd(prices)
        
        # Calculate RSI
        if include_rsi:
            indicators["rsi"] = calculate_rsi(prices)
        
        # Calculate Bollinger Bands
        if include_bollinger:
            indicators["bollinger_bands"] = calculate_bollinger_bands(prices)
        
        return indicators
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating technical indicators: {str(e)}")

@router.get("/support-resistance/{symbol}")
async def get_support_resistance(
    symbol: str,
    days: int = Query(120, description="Number of days of historical data", ge=30, le=365)
) -> Dict[str, Any]:
    """
    Get support and resistance levels for a stock symbol.
    """
    try:
        # Generate mock price data
        prices = generate_mock_price_data(symbol, days)
        
        # Identify support and resistance levels
        levels = identify_support_resistance(prices)
        
        # Calculate Fibonacci retracement levels
        fibonacci = calculate_fibonacci_levels(prices)
        
        # Calculate pivot points
        pivot_points = calculate_pivot_points(prices)
        
        return {
            "symbol": symbol,
            "support_levels": levels["support"],
            "resistance_levels": levels["resistance"],
            "fibonacci_levels": fibonacci,
            "pivot_points": pivot_points,
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error identifying support and resistance: {str(e)}")

@router.get("/patterns/{symbol}")
async def get_chart_patterns(
    symbol: str,
    days: int = Query(120, description="Number of days of historical data", ge=30, le=365)
) -> Dict[str, Any]:
    """
    Get chart patterns for a stock symbol.
    """
    try:
        # Generate mock price data
        prices = generate_mock_price_data(symbol, days)
        
        # Identify patterns
        patterns = identify_patterns(prices)
        
        return {
            "symbol": symbol,
            "patterns": patterns,
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error identifying chart patterns: {str(e)}")

@router.get("/trend-analysis/{symbol}")
async def get_trend_analysis(
    symbol: str,
    days: int = Query(120, description="Number of days of historical data", ge=30, le=365)
) -> Dict[str, Any]:
    """
    Get trend analysis for a stock symbol.
    """
    try:
        # Generate mock price data
        prices = generate_mock_price_data(symbol, days)
        
        # Calculate SMAs for trend analysis
        sma_20 = calculate_sma(prices, 20)
        sma_50 = calculate_sma(prices, 50)
        sma_200 = calculate_sma(prices, 200)
        
        # Determine current trend
        current_price = prices[-1]["close"]
        
        # Check if we have enough data for all SMAs
        trend = "neutral"
        trend_strength = "weak"
        
        if len(prices) >= 200 and sma_20[-1] is not None and sma_50[-1] is not None and sma_200[-1] is not None:
            # Strong uptrend: price > SMA20 > SMA50 > SMA200
            if current_price > sma_20[-1] > sma_50[-1] > sma_200[-1]:
                trend = "uptrend"
                trend_strength = "strong"
            # Moderate uptrend: price > SMA50 > SMA200
            elif current_price > sma_50[-1] > sma_200[-1]:
                trend = "uptrend"
                trend_strength = "moderate"
            # Weak uptrend: price > SMA200
            elif current_price > sma_200[-1]:
                trend = "uptrend"
                trend_strength = "weak"
            # Strong downtrend: price < SMA20 < SMA50 < SMA200
            elif current_price < sma_20[-1] < sma_50[-1] < sma_200[-1]:
                trend = "downtrend"
                trend_strength = "strong"
            # Moderate downtrend: price < SMA50 < SMA200
            elif current_price < sma_50[-1] < sma_200[-1]:
                trend = "downtrend"
                trend_strength = "moderate"
            # Weak downtrend: price < SMA200
            elif current_price < sma_200[-1]:
                trend = "downtrend"
                trend_strength = "weak"
            # Neutral/Sideways
            else:
                trend = "neutral"
                trend_strength = "moderate"
        elif len(prices) >= 50 and sma_20[-1] is not None and sma_50[-1] is not None:
            # Uptrend: price > SMA20 > SMA50
            if current_price > sma_20[-1] > sma_50[-1]:
                trend = "uptrend"
                trend_strength = "moderate"
            # Downtrend: price < SMA20 < SMA50
            elif current_price < sma_20[-1] < sma_50[-1]:
                trend = "downtrend"
                trend_strength = "moderate"
            # Mixed signals
            else:
                trend = "neutral"
                trend_strength = "weak"
        
        # Calculate momentum indicators
        rsi = calculate_rsi(prices)[-1] if len(prices) > 14 else None
        
        # Determine momentum
        momentum = "neutral"
        if rsi is not None:
            if rsi > 70:
                momentum = "overbought"
            elif rsi < 30:
                momentum = "oversold"
            elif rsi > 50:
                momentum = "positive"
            else:
                momentum = "negative"
        
        # Calculate recent performance
        if len(prices) >= 30:
            performance_1m = (current_price / prices[-30]["close"] - 1) * 100
        else:
            performance_1m = None
        
        if len(prices) >= 90:
            performance_3m = (current_price / prices[-90]["close"] - 1) * 100
        else:
            performance_3m = None
        
        # Generate trend summary
        trend_summary = f"{symbol} is in a {trend_strength} {trend}"
        if momentum in ["overbought", "oversold"]:
            trend_summary += f" and is currently {momentum}"
        
        return {
            "symbol": symbol,
            "trend": {
                "direction": trend,
                "strength": trend_strength,
                "summary": trend_summary
            },
            "momentum": {
                "status": momentum,
                "rsi": rsi
            },
            "moving_averages": {
                "sma_20": sma_20[-1],
                "sma_50": sma_50[-1],
                "sma_200": sma_200[-1] if len(prices) >= 200 else None,
                "price_vs_sma_20": f"{(current_price / sma_20[-1] - 1) * 100:.2f}%" if sma_20[-1] else None,
                "price_vs_sma_50": f"{(current_price / sma_50[-1] - 1) * 100:.2f}%" if sma_50[-1] else None,
                "price_vs_sma_200": f"{(current_price / sma_200[-1] - 1) * 100:.2f}%" if len(prices) >= 200 and sma_200[-1] else None
            },
            "performance": {
                "1_month": f"{performance_1m:.2f}%" if performance_1m is not None else None,
                "3_month": f"{performance_3m:.2f}%" if performance_3m is not None else None
            },
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error performing trend analysis: {str(e)}")

@router.get("/volatility/{symbol}")
async def get_volatility_analysis(
    symbol: str,
    days: int = Query(120, description="Number of days of historical data", ge=30, le=365)
) -> Dict[str, Any]:
    """
    Get volatility analysis for a stock symbol.
    """
    try:
        # Generate mock price data
        prices = generate_mock_price_data(symbol, days)
        
        # Calculate daily returns
        returns = []
        for i in range(1, len(prices)):
            daily_return = (prices[i]["close"] / prices[i-1]["close"]) - 1
            returns.append(daily_return)
        
        # Calculate volatility (standard deviation of returns)
        daily_volatility = np.std(returns)
        annual_volatility = daily_volatility * np.sqrt(252)  # Annualized
        
        # Calculate average true range (ATR)
        atr = []
        tr = []  # True range
        
        for i in range(1, len(prices)):
            # True range is the greatest of:
            # 1. Current high - current low
            # 2. Current high - previous close (absolute)
            # 3. Current low - previous close (absolute)
            tr_1 = prices[i]["high"] - prices[i]["low"]
            tr_2 = abs(prices[i]["high"] - prices[i-1]["close"])
            tr_3 = abs(prices[i]["low"] - prices[i-1]["close"])
            
            true_range = max(tr_1, tr_2, tr_3)
            tr.append(true_range)
        
        # Calculate 14-day ATR
        atr_period = 14
        for i in range(len(tr)):
            if i < atr_period - 1:
                atr.append(None)
            elif i == atr_period - 1:
                # First ATR is simple average
                atr.append(sum(tr[:atr_period]) / atr_period)
            else:
                # Subsequent ATRs use smoothing
                atr.append((atr[i-1] * (atr_period - 1) + tr[i]) / atr_period)
        
        # Calculate Bollinger Bands width
        bollinger = calculate_bollinger_bands(prices)
        bb_width = []
        
        for i in range(len(prices)):
            if bollinger["upper_band"][i] is not None and bollinger["lower_band"][i] is not None:
                width = (bollinger["upper_band"][i] - bollinger["lower_band"][i]) / bollinger["middle_band"][i]
                bb_width.append(width)
            else:
                bb_width.append(None)
        
        # Calculate historical volatility percentile
        if len(returns) >= 30:
            rolling_vol = []
            for i in range(30, len(returns) + 1):
                vol = np.std(returns[i-30:i]) * np.sqrt(252)
                rolling_vol.append(vol)
            
            current_vol = rolling_vol[-1]
            vol_percentile = sum(1 for v in rolling_vol if v < current_vol) / len(rolling_vol) * 100
        else:
            vol_percentile = None
        
        # Determine volatility regime
        if annual_volatility < 0.15:
            vol_regime = "low"
        elif annual_volatility < 0.30:
            vol_regime = "moderate"
        else:
            vol_regime = "high"
        
        return {
            "symbol": symbol,
            "volatility": {
                "daily": round(daily_volatility, 4),
                "annual": round(annual_volatility, 4),
                "regime": vol_regime,
                "percentile": round(vol_percentile, 2) if vol_percentile is not None else None
            },
            "atr": {
                "current": round(atr[-1], 2) if atr[-1] is not None else None,
                "percent_of_price": round((atr[-1] / prices[-1]["close"]) * 100, 2) if atr[-1] is not None else None
            },
            "bollinger_bands": {
                "current_width": round(bb_width[-1], 4) if bb_width[-1] is not None else None,
                "average_width": round(np.mean([w for w in bb_width if w is not None]), 4) if any(w is not None for w in bb_width) else None
            },
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error performing volatility analysis: {str(e)}")