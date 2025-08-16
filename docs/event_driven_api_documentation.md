# Event-Driven & Fundamental Analysis API Documentation

This document provides comprehensive documentation for the API endpoints related to the Event-Driven & Fundamental Analysis feature of the hedge fund trading application.

## Table of Contents

1. [Event API](#event-api)
2. [Financial Analysis API](#financial-analysis-api)
3. [Valuation API](#valuation-api)
4. [Correlation Analysis API](#correlation-analysis-api)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)

---

## Event API

The Event API provides endpoints for retrieving and analyzing financial events such as earnings announcements, dividends, product launches, and more.

### Get All Events

Retrieves all events for a specific symbol within a given time period.

**Endpoint:** `GET /api/events/all-events/{symbol}`

**Parameters:**
- `symbol` (path parameter): Stock symbol (e.g., AAPL)
- `days` (query parameter, optional): Number of days to look back (default: 365)
- `event_types` (query parameter, optional): Comma-separated list of event types to include

**Response:**
```json
[
  {
    "id": "event123",
    "event_type": "earnings",
    "date": "2023-01-15",
    "symbol": "AAPL",
    "description": "Q1 2023 Earnings",
    "source": "Company Report",
    "impact_score": 0.75,
    "metadata": {
      "eps": 1.52,
      "eps_estimate": 1.43
    }
  },
  {
    "id": "event124",
    "event_type": "dividend",
    "date": "2023-02-10",
    "symbol": "AAPL",
    "description": "Quarterly Dividend",
    "source": "Company Report",
    "impact_score": 0.3,
    "metadata": {
      "dividend": 0.23
    }
  }
]
```

### Get Earnings Events

Retrieves earnings events for a specific symbol.

**Endpoint:** `GET /api/events/earnings-events/{symbol}`

**Parameters:**
- `symbol` (path parameter): Stock symbol (e.g., AAPL)
- `limit` (query parameter, optional): Maximum number of events to return

**Response:** Array of event objects (same format as Get All Events)

### Get Dividend Events

Retrieves dividend events for a specific symbol.

**Endpoint:** `GET /api/events/dividend-events/{symbol}`

**Parameters:**
- `symbol` (path parameter): Stock symbol (e.g., AAPL)
- `limit` (query parameter, optional): Maximum number of events to return

**Response:** Array of event objects (same format as Get All Events)

### Get News Events

Retrieves news events for a specific symbol.

**Endpoint:** `GET /api/events/news-events/{symbol}`

**Parameters:**
- `symbol` (path parameter): Stock symbol (e.g., AAPL)
- `limit` (query parameter, optional): Maximum number of events to return

**Response:** Array of event objects (same format as Get All Events)

### Get Technical Events

Retrieves technical events (e.g., breakouts, support/resistance) for a specific symbol.

**Endpoint:** `GET /api/events/technical-events/{symbol}`

**Parameters:**
- `symbol` (path parameter): Stock symbol (e.g., AAPL)
- `days` (query parameter, optional): Number of days to look back

**Response:** Array of event objects (same format as Get All Events)

### Filter Events

Retrieves events filtered by various criteria.

**Endpoint:** `GET /api/events/filter-events/{symbol}`

**Parameters:**
- `symbol` (path parameter): Stock symbol (e.g., AAPL)
- `start_date` (query parameter, optional): Start date for filtering (YYYY-MM-DD)
- `end_date` (query parameter, optional): End date for filtering (YYYY-MM-DD)
- `event_types` (query parameter, optional): Comma-separated list of event types
- `min_impact_score` (query parameter, optional): Minimum impact score threshold

**Response:** Array of event objects (same format as Get All Events)

### Analyze Event Impact

Analyzes the impact of specific event types on stock price.

**Endpoint:** `GET /api/events/event-impact/{symbol}`

**Parameters:**
- `symbol` (path parameter): Stock symbol (e.g., AAPL)
- `event_type` (query parameter): Type of event to analyze
- `window_days` (query parameter, optional): Number of days to analyze after event (default: 1)
- `days` (query parameter, optional): Number of days to look back (default: 365)

**Response:**
```json
{
  "earnings": {
    "count": 10,
    "avg_price_change": 2.5,
    "median_price_change": 1.8,
    "std_dev": 3.2,
    "positive_count": 7,
    "negative_count": 3
  }
}
```

---

## Financial Analysis API

The Financial Analysis API provides endpoints for retrieving and analyzing financial statements, ratios, and other fundamental data.

### Get Company Profile

Retrieves basic company information.

**Endpoint:** `GET /api/financial-analysis/company-profile/{symbol}`

**Parameters:**
- `symbol` (path parameter): Stock symbol (e.g., AAPL)

**Response:**
```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "sector": "Technology",
  "industry": "Consumer Electronics",
  "description": "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.",
  "marketCap": 2800000000000,
  "employees": 154000,
  "website": "https://www.apple.com",
  "ceo": "Tim Cook",
  "exchange": "NASDAQ"
}
```

### Get Financial Ratios

Retrieves key financial ratios for a company.

**Endpoint:** `GET /api/financial-analysis/financial-ratios/{symbol}`

**Parameters:**
- `symbol` (path parameter): Stock symbol (e.g., AAPL)
- `period` (query parameter, optional): 'annual' or 'quarter' (default: 'annual')
- `limit` (query parameter, optional): Maximum number of periods to return

**Response:**
```json
{
  "symbol": "AAPL",
  "date": "2023-06-30",
  "previous_date": "2022-06-30",
  "ratios": {
    "liquidity": {
      "current_ratio": 0.94,
      "quick_ratio": 0.88,
      "cash_ratio": 0.21
    },
    "profitability": {
      "gross_margin": 0.44,
      "operating_margin": 0.30,
      "net_margin": 0.25,
      "return_on_assets": 0.28,
      "return_on_equity": 1.56
    },
    "solvency": {
      "debt_to_equity": 1.76,
      "debt_ratio": 0.29,
      "interest_coverage": 42.5
    },
    "efficiency": {
      "asset_turnover": 0.88,
      "inventory_turnover": 40.2,
      "receivables_turnover": 14.5
    },
    "valuation": {
      "pe_ratio": 30.2,
      "pb_ratio": 47.1,
      "ps_ratio": 7.5,
      "ev_ebitda": 22.3
    },
    "growth": {
      "revenue_growth": 0.08,
      "earnings_growth": 0.05,
      "dividend_growth": 0.04
    }
  }
}
```

### Analyze Income Statement

Analyzes income statement data and calculates key metrics.

**Endpoint:** `GET /api/financial-analysis/income-statement-analysis/{symbol}`

**Parameters:**
- `symbol` (path parameter): Stock symbol (e.g., AAPL)
- `period` (query parameter, optional): 'annual' or 'quarter' (default: 'annual')
- `limit` (query parameter, optional): Maximum number of periods to return

**Response:**
```json
{
  "symbol": "AAPL",
  "date": "2023-06-30",
  "previous_date": "2022-06-30",
  "gross_margin": 0.44,
  "operating_margin": 0.30,
  "net_margin": 0.25,
  "ebitda_margin": 0.33,
  "cogs_ratio": 0.56,
  "operating_expense_ratio": 0.14,
  "revenue_growth": 0.08,
  "gross_profit_growth": 0.10,
  "operating_income_growth": 0.12,
  "net_income_growth": 0.05,
  "ebitda_growth": 0.09,
  "gross_margin_change": 0.01,
  "operating_margin_change": 0.02,
  "net_margin_change": -0.01,
  "ebitda_margin_change": 0.01
}
```

### Analyze Balance Sheet

Analyzes balance sheet data and calculates key metrics.

**Endpoint:** `GET /api/financial-analysis/balance-sheet-analysis/{symbol}`

**Parameters:**
- `symbol` (path parameter): Stock symbol (e.g., AAPL)
- `period` (query parameter, optional): 'annual' or 'quarter' (default: 'annual')
- `limit` (query parameter, optional): Maximum number of periods to return

**Response:**
```json
{
  "symbol": "AAPL",
  "date": "2023-06-30",
  "previous_date": "2022-06-30",
  "current_assets_ratio": 0.35,
  "cash_ratio": 0.15,
  "current_liabilities_ratio": 0.37,
  "long_term_debt_ratio": 0.25,
  "debt_ratio": 0.62,
  "equity_ratio": 0.38,
  "debt_to_equity": 1.76,
  "current_ratio": 0.94,
  "quick_ratio": 0.88,
  "cash_to_current_liabilities": 0.41,
  "total_assets_growth": 0.05,
  "current_assets_growth": 0.03,
  "cash_growth": -0.08,
  "total_liabilities_growth": 0.07,
  "current_liabilities_growth": 0.09,
  "total_equity_growth": 0.02,
  "long_term_debt_growth": 0.04
}
```

### Analyze Cash Flow

Analyzes cash flow statement data and calculates key metrics.

**Endpoint:** `GET /api/financial-analysis/cash-flow-analysis/{symbol}`

**Parameters:**
- `symbol` (path parameter): Stock symbol (e.g., AAPL)
- `period` (query parameter, optional): 'annual' or 'quarter' (default: 'annual')
- `limit` (query parameter, optional): Maximum number of periods to return

**Response:**
```json
{
  "symbol": "AAPL",
  "date": "2023-06-30",
  "previous_date": "2022-06-30",
  "operating_cash_flow_ratio": 0.28,
  "investing_cash_flow_ratio": -0.12,
  "financing_cash_flow_ratio": -0.16,
  "capex_to_operating_cash_flow": 0.15,
  "free_cash_flow": 95000000000,
  "operating_cash_flow_to_net_income": 1.25,
  "free_cash_flow_to_net_income": 1.05,
  "operating_cash_flow_to_revenue": 0.31,
  "free_cash_flow_to_revenue": 0.26,
  "operating_cash_flow_growth": 0.03,
  "capital_expenditure_growth": 0.12,
  "free_cash_flow_growth": 0.01
}
```

### Get Financial Trends

Retrieves historical trends for key financial metrics.

**Endpoint:** `GET /api/financial-analysis/financial-trends/{symbol}`

**Parameters:**
- `symbol` (path parameter): Stock symbol (e.g., AAPL)
- `period` (query parameter, optional): 'annual' or 'quarter' (default: 'annual')
- `limit` (query parameter, optional): Maximum number of periods to return
- `metrics` (query parameter, optional): Comma-separated list of metrics to include

**Response:**
```json
{
  "symbol": "AAPL",
  "period": "annual",
  "trend_data": {
    "revenue": {
      "dates": ["2019-06-30", "2020-06-30", "2021-06-30", "2022-06-30", "2023-06-30"],
      "values": [260000000000, 274000000000, 365000000000, 410000000000, 442800000000]
    },
    "net_income": {
      "dates": ["2019-06-30", "2020-06-30", "2021-06-30", "2022-06-30", "2023-06-30"],
      "values": [55000000000, 57000000000, 94000000000, 103000000000, 108000000000]
    },
    "eps": {
      "dates": ["2019-06-30", "2020-06-30", "2021-06-30", "2022-06-30", "2023-06-30"],
      "values": [2.97, 3.10, 5.30, 5.89, 6.31]
    }
  },
  "growth_rates": {
    "revenue": {
      "1Y": 0.08,
      "3Y": 0.17,
      "5Y": 0.11
    },
    "net_income": {
      "1Y": 0.05,
      "3Y": 0.24,
      "5Y": 0.14
    },
    "eps": {
      "1Y": 0.07,
      "3Y": 0.27,
      "5Y": 0.17
    }
  }
}
```

### Get Growth Analysis

Retrieves growth analysis for key financial metrics.

**Endpoint:** `GET /api/financial-analysis/growth-analysis/{symbol}`

**Parameters:**
- `symbol` (path parameter): Stock symbol (e.g., AAPL)
- `period` (query parameter, optional): 'annual' or 'quarter' (default: 'annual')
- `limit` (query parameter, optional): Maximum number of periods to return

**Response:**
```json
{
  "symbol": "AAPL",
  "period": "annual",
  "growth_data": [
    {
      "date": "2023-06-30",
      "growth_ratios": {
        "revenue_growth": 0.08,
        "net_income_growth": 0.05,
        "eps_growth": 0.07,
        "dividend_growth": 0.04
      }
    },
    {
      "date": "2022-06-30",
      "growth_ratios": {
        "revenue_growth": 0.12,
        "net_income_growth": 0.09,
        "eps_growth": 0.11,
        "dividend_growth": 0.05
      }
    }
  ],
  "cagr": {
    "3Y": {
      "revenue": 0.17,
      "net_income": 0.24,
      "eps": 0.27,
      "dividend": 0.05
    },
    "5Y": {
      "revenue": 0.11,
      "net_income": 0.14,
      "eps": 0.17,
      "dividend": 0.05
    }
  }
}
```

### Get Peer Companies

Retrieves a list of peer companies for comparison.

**Endpoint:** `GET /api/financial-analysis/peer-companies/{symbol}`

**Parameters:**
- `symbol` (path parameter): Stock symbol (e.g., AAPL)

**Response:**
```json
["MSFT", "GOOGL", "AMZN", "META"]
```

### Get Peer Comparison

Compares key metrics across peer companies.

**Endpoint:** `POST /api/financial-analysis/peer-comparison`

**Request Body:**
```json
{
  "symbol": "AAPL",
  "peer_symbols": ["MSFT", "GOOGL", "AMZN", "META"],
  "metrics": ["pe_ratio", "ps_ratio", "gross_margin", "operating_margin"],
  "period": "annual"
}
```

**Response:**
```json
{
  "target_symbol": "AAPL",
  "peer_symbols": ["MSFT", "GOOGL", "AMZN", "META"],
  "comparison": {
    "AAPL": {
      "pe_ratio": 30.2,
      "ps_ratio": 7.5,
      "gross_margin": 0.44,
      "operating_margin": 0.30
    },
    "MSFT": {
      "pe_ratio": 32.5,
      "ps_ratio": 10.8,
      "gross_margin": 0.68,
      "operating_margin": 0.42
    },
    "GOOGL": {
      "pe_ratio": 25.1,
      "ps_ratio": 5.7,
      "gross_margin": 0.56,
      "operating_margin": 0.28
    }
  },
  "statistics": {
    "pe_ratio": {
      "average": 31.56,
      "min": 25.1,
      "max": 42.8,
      "median": 30.2,
      "percentile": 50
    },
    "ps_ratio": {
      "average": 6.6,
      "min": 2.5,
      "max": 10.8,
      "median": 6.5,
      "percentile": 60
    }
  }
}
```

---

## Valuation API

The Valuation API provides endpoints for company valuation using different methodologies.

### Get DCF Valuation

Performs a Discounted Cash Flow (DCF) valuation for a company.

**Endpoint:** `GET /api/valuation/dcf/{symbol}`

**Parameters:**
- `symbol` (path parameter): Stock symbol (e.g., AAPL)
- `years` (query parameter, optional): Years of historical data to use (default: 5)
- `forecast_period` (query parameter, optional): Years to forecast (default: 5)
- `discount_rate` (query parameter, optional): Discount rate to use (default: calculated based on CAPM)
- `terminal_growth_rate` (query parameter, optional): Terminal growth rate (default: 2%)

**Response:**
```json
{
  "symbol": "AAPL",
  "forecasted_cash_flows": [85000000000, 92000000000, 98000000000, 105000000000, 112000000000],
  "present_values": [80000000000, 82000000000, 83000000000, 84000000000, 85000000000],
  "terminal_value": 4500000000000,
  "terminal_value_pv": 2800000000000,
  "enterprise_value": 3200000000000,
  "equity_value": 3050000000000,
  "share_price": 195.23,
  "discount_rate": 0.09,
  "terminal_growth_rate": 0.03,
  "forecast_period": 5
}
```

### Get Comparable Company Analysis

Performs a valuation based on comparable company multiples.

**Endpoint:** `POST /api/valuation/comparable-company-analysis/{symbol}`

**Request Body:**
```json
{
  "comparable_symbols": ["MSFT", "GOOGL", "AMZN", "META"],
  "multiples_to_use": ["pe_ratio", "ps_ratio", "pb_ratio", "ev_ebitda"]
}
```

**Response:**
```json
{
  "symbol": "AAPL",
  "comparable_symbols": ["MSFT", "GOOGL", "AMZN", "META"],
  "average_multiples": {
    "pe_ratio": 28.5,
    "ps_ratio": 6.8,
    "pb_ratio": 12.3,
    "ev_ebitda": 18.7
  },
  "median_multiples": {
    "pe_ratio": 27.2,
    "ps_ratio": 6.5,
    "pb_ratio": 11.8,
    "ev_ebitda": 17.9
  },
  "implied_values_avg": {
    "pe_ratio": 185.25,
    "ps_ratio": 190.40,
    "pb_ratio": 182.70,
    "ev_ebitda": 191.45
  },
  "implied_values_median": {
    "pe_ratio": 176.80,
    "ps_ratio": 182.00,
    "pb_ratio": 175.42,
    "ev_ebitda": 188.25
  },
  "avg_implied_equity_value": 2950000000000,
  "median_implied_equity_value": 2850000000000,
  "avg_share_price": 187.45,
  "median_share_price": 190.12
}
```

### Get Consensus Valuation

Performs a consensus valuation using multiple methodologies.

**Endpoint:** `POST /api/valuation/consensus-valuation/{symbol}`

**Request Body:**
```json
{
  "comparable_symbols": ["MSFT", "GOOGL", "AMZN", "META"],
  "methods": ["dcf", "comparable", "analyst"],
  "parameters": {
    "dcf": {
      "forecast_period": 5,
      "discount_rate": 0.09,
      "terminal_growth_rate": 0.03
    }
  }
}
```

**Response:**
```json
{
  "symbol": "AAPL",
  "dcf": {
    "share_price": 195.23,
    "equity_value": 3050000000000
  },
  "cca": {
    "avg_share_price": 187.45,
    "median_share_price": 190.12
  },
  "consensus": {
    "equity_value": 3000000000000,
    "share_price": 192.35
  }
}
```

### Get Peer Valuation Metrics

Retrieves valuation metrics for a company and its peers.

**Endpoint:** `GET /api/valuation/peer-valuation-metrics/{symbol}`

**Parameters:**
- `symbol` (path parameter): Stock symbol (e.g., AAPL)
- `sector` (query parameter, optional): Include sector averages (default: true)
- `industry` (query parameter, optional): Include industry averages (default: true)
- `metrics` (query parameter, optional): Comma-separated list of metrics to include

**Response:**
```json
{
  "company": {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "sector": "Technology",
    "industry": "Consumer Electronics"
  },
  "peers": [
    {
      "symbol": "MSFT",
      "name": "Microsoft Corporation",
      "sector": "Technology",
      "industry": "Software—Infrastructure"
    },
    {
      "symbol": "GOOGL",
      "name": "Alphabet Inc.",
      "sector": "Communication Services",
      "industry": "Internet Content & Information"
    }
  ],
  "average_metrics": {
    "pe_ratio": 31.56,
    "ps_ratio": 6.6,
    "pb_ratio": 16.02,
    "ev_ebitda": 19.0
  },
  "percentile_ranks": {
    "pe_ratio": 50,
    "ps_ratio": 60,
    "pb_ratio": 90,
    "ev_ebitda": 70
  }
}
```

---

## Correlation Analysis API

The Correlation Analysis API provides endpoints for analyzing correlations between events, financial metrics, and market data.

### Get Event-Metric Correlation

Analyzes correlation between events and market metrics.

**Endpoint:** `GET /api/correlation/event-metric-correlation/{symbol}`

**Parameters:**
- `symbol` (path parameter): Stock symbol (e.g., AAPL)
- `event_type` (query parameter): Type of event to analyze
- `metrics` (query parameter): Comma-separated list of metrics to analyze
- `window_days` (query parameter, optional): Number of days to analyze after event (default: 1)
- `lookback_days` (query parameter, optional): Number of days to look back (default: 365)

**Response:**
```json
{
  "symbol": "AAPL",
  "event_type": "earnings",
  "correlations": {
    "price_change": {
      "correlation": 0.65,
      "p_value": 0.008,
      "significant": true,
      "sample_size": 24
    },
    "volume_change": {
      "correlation": 0.42,
      "p_value": 0.04,
      "significant": true,
      "sample_size": 24
    },
    "volatility_change": {
      "correlation": 0.28,
      "p_value": 0.18,
      "significant": false,
      "sample_size": 24
    }
  }
}
```

### Get Event Impact By Metric

Analyzes how a specific metric affects event outcomes.

**Endpoint:** `GET /api/correlation/event-impact-by-metric/{symbol}`

**Parameters:**
- `symbol` (path parameter): Stock symbol (e.g., AAPL)
- `event_type` (query parameter): Type of event to analyze
- `metric` (query parameter): Metric to analyze (e.g., eps_surprise)
- `window_days` (query parameter, optional): Number of days to analyze after event (default: 1)
- `lookback_days` (query parameter, optional): Number of days to look back (default: 365)

**Response:**
```json
{
  "symbol": "AAPL",
  "event_type": "earnings",
  "metric": "eps_surprise",
  "window_days": 1,
  "quartile_results": {
    "q1": {
      "avg_price_change": -1.2,
      "median_price_change": -1.0,
      "positive_count": 1,
      "negative_count": 5,
      "total_count": 6,
      "events": [
        {
          "event_id": "event1",
          "event_type": "earnings",
          "date": "2021-01-27",
          "metric_value": -0.05,
          "price_change": -2.1
        }
      ]
    },
    "q2": {
      "avg_price_change": 0.5,
      "median_price_change": 0.4,
      "positive_count": 4,
      "negative_count": 2,
      "total_count": 6
    }
  }
}
```

### Get Event Prediction

Predicts the outcome of future events based on historical data.

**Endpoint:** `GET /api/correlation/event-prediction/{symbol}`

**Parameters:**
- `symbol` (path parameter): Stock symbol (e.g., AAPL)
- `event_type` (query parameter): Type of event to analyze
- `metrics` (query parameter): Comma-separated list of metrics to use for prediction
- `window_days` (query parameter, optional): Number of days to analyze after event (default: 1)
- `lookback_days` (query parameter, optional): Number of days to look back (default: 365)

**Response:**
```json
{
  "symbol": "AAPL",
  "event_type": "earnings",
  "metrics": ["eps_surprise", "revenue_surprise", "guidance"],
  "model_accuracy": {
    "mean": 0.78,
    "std": 0.05,
    "scores": [0.75, 0.79, 0.80, 0.78]
  },
  "feature_importance": {
    "eps_surprise": 0.45,
    "revenue_surprise": 0.30,
    "guidance": 0.15,
    "market_sentiment": 0.10
  },
  "sample_size": 24,
  "positive_outcome_ratio": 0.67,
  "next_event_prediction": {
    "outcome": "positive",
    "probability": 0.72,
    "latest_metrics": {
      "eps_surprise": 0.08,
      "revenue_surprise": 0.05,
      "guidance": 1
    }
  }
}
```

### Get Event Clusters

Identifies and analyzes clusters of events.

**Endpoint:** `GET /api/correlation/event-clusters/{symbol}`

**Parameters:**
- `symbol` (path parameter): Stock symbol (e.g., AAPL)
- `max_days_between` (query parameter, optional): Maximum days between events to be considered a cluster (default: 5)
- `lookback_days` (query parameter, optional): Number of days to look back (default: 365)

**Response:**
```json
{
  "clusters": [
    {
      "cluster_id": 1,
      "start_date": "2023-01-10",
      "end_date": "2023-01-20",
      "duration_days": 10,
      "num_events": 3,
      "event_types": ["earnings", "analyst_rating", "news"],
      "event_type_counts": { "earnings": 1, "analyst_rating": 1, "news": 1 },
      "cluster_return": 3.5,
      "cluster_volatility": 1.8,
      "volume_change": 1.4,
      "post_cluster_returns": { "1d": 0.5, "5d": 1.2, "10d": 2.1 }
    }
  ],
  "statistics": {
    "total_clusters": 1,
    "avg_duration_days": 10,
    "avg_events_per_cluster": 3,
    "avg_cluster_return": 3.5
  }
}
```

### Get Event-Fundamental Correlation

Analyzes correlation between events and fundamental metrics.

**Endpoint:** `GET /api/correlation/event-fundamental-correlation/{symbol}`

**Parameters:**
- `symbol` (path parameter): Stock symbol (e.g., AAPL)
- `event_type` (query parameter): Type of event to analyze
- `fundamental_metric` (query parameter): Fundamental metric to analyze
- `timeframe` (query parameter, optional): Timeframe for analysis (e.g., '1y', '3y', '5y')

**Response:**
```json
{
  "eventType": "earnings",
  "fundamentalMetric": "revenue_growth",
  "correlationCoefficient": 0.78,
  "pValue": 0.001,
  "dataPoints": [
    {
      "eventDate": "2022-01-15",
      "eventId": "event1",
      "eventValue": 1.2,
      "metricValue": 0.15,
      "metricDate": "2022-01-31"
    },
    {
      "eventDate": "2022-04-15",
      "eventId": "event2",
      "eventValue": 1.5,
      "metricValue": 0.18,
      "metricDate": "2022-04-30"
    }
  ],
  "regressionLine": [
    { "x": 1.2, "y": 0.14 },
    { "x": 1.8, "y": 0.23 }
  ]
}
```

### Get Top Event-Fundamental Correlations

Retrieves the strongest correlations between events and fundamental metrics.

**Endpoint:** `GET /api/correlation/top-event-fundamental-correlations/{symbol}`

**Parameters:**
- `symbol` (path parameter): Stock symbol (e.g., AAPL)
- `limit` (query parameter, optional): Maximum number of correlations to return (default: 10)
- `min_significance` (query parameter, optional): Minimum p-value for significance (default: 0.05)

**Response:**
```json
[
  {
    "eventType": "earnings",
    "fundamentalMetric": "revenue_growth",
    "correlationCoefficient": 0.78,
    "pValue": 0.001,
    "significant": true,
    "sampleSize": 24
  },
  {
    "eventType": "dividend",
    "fundamentalMetric": "eps_growth",
    "correlationCoefficient": -0.65,
    "pValue": 0.008,
    "significant": true,
    "sampleSize": 18
  }
]
```

---

## Data Models

### FinancialEvent

```typescript
interface FinancialEvent {
  id: string;
  event_type: string;
  date: string;
  symbol: string;
  description: string;
  source: string;
  impact_score: number | null;
  metadata: Record<string, any>;
}
```

### EventImpactAnalysis

```typescript
interface EventImpactAnalysis {
  [event_type: string]: {
    count: number;
    avg_price_change: number;
    median_price_change: number;
    std_dev: number;
    positive_count: number;
    negative_count: number;
  };
}
```

### EventMetricCorrelation

```typescript
interface EventMetricCorrelation {
  correlation: number;
  p_value: number;
  significant: boolean;
  sample_size: number;
}
```

### FinancialRatios

```typescript
interface FinancialRatios {
  symbol: string;
  date: string;
  previous_date?: string;
  ratios: {
    liquidity: Record<string, number | null>;
    profitability: Record<string, number | null>;
    solvency: Record<string, number | null>;
    efficiency: Record<string, number | null>;
    valuation: Record<string, number | null>;
    growth: Record<string, number | null>;
  };
}
```

### DCFValuationResult

```typescript
interface DCFValuationResult {
  symbol: string;
  forecasted_cash_flows: number[];
  present_values: number[];
  terminal_value: number;
  terminal_value_pv: number;
  enterprise_value: number;
  equity_value: number;
  share_price: number;
  discount_rate: number;
  terminal_growth_rate: number;
  forecast_period: number;
}
```

### ComparableCompanyResult

```typescript
interface ComparableCompanyResult {
  symbol: string;
  comparable_symbols: string[];
  average_multiples: Record<string, number>;
  median_multiples: Record<string, number>;
  implied_values_avg: Record<string, number>;
  implied_values_median: Record<string, number>;
  avg_implied_equity_value: number;
  median_implied_equity_value: number;
  avg_share_price: number;
  median_share_price: number;
}
```

---

## Error Handling

All API endpoints follow a consistent error handling pattern:

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "additional": "error details"
    }
  }
}
```

### Common Error Codes

- `INVALID_SYMBOL`: The provided stock symbol is invalid or not found
- `INVALID_PARAMETER`: One or more parameters are invalid
- `INSUFFICIENT_DATA`: Not enough data available for the requested analysis
- `RATE_LIMIT_EXCEEDED`: API rate limit has been exceeded
- `INTERNAL_ERROR`: An internal server error occurred
- `SERVICE_UNAVAILABLE`: The service is temporarily unavailable

### HTTP Status Codes

- `200 OK`: Request successful
- `400 Bad Request`: Invalid parameters or request
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server-side error
- `503 Service Unavailable`: Service temporarily unavailable

---

## Rate Limiting

The API implements rate limiting to ensure fair usage and system stability:

- **Standard Tier**: 300 requests per minute
- **Premium Tier**: 1000 requests per minute
- **Enterprise Tier**: Custom limits based on agreement

### Rate Limit Headers

The following headers are included in API responses:

- `X-RateLimit-Limit`: Maximum number of requests allowed per minute
- `X-RateLimit-Remaining`: Number of requests remaining in the current window
- `X-RateLimit-Reset`: Time in seconds until the rate limit resets

### Exceeding Rate Limits

When rate limits are exceeded, the API will respond with:

- HTTP Status Code: `429 Too Many Requests`
- Error Code: `RATE_LIMIT_EXCEEDED`
- A `Retry-After` header indicating the number of seconds to wait before retrying