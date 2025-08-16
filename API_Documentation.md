# ML Integration API Documentation

## Overview
This document provides detailed information about the API endpoints used by the Machine Learning Integration components of the hedge fund trading application.

## Base URL
All API endpoints are relative to the base URL: `https://api.hedgefund-app.com/v1`

## Authentication
All API requests require authentication using a JWT token. The token should be included in the `Authorization` header using the Bearer scheme:

```
Authorization: Bearer <token>
```

## Error Handling
API errors are returned with appropriate HTTP status codes and a JSON response body with the following structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional error details
  }
}
```

## Rate Limiting
API requests are subject to rate limiting of 100 requests per minute per user. Rate limit information is included in the response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1628789258
```

## Endpoints

### Model Management

#### GET /api/ml/models
Get a list of all ML models.

**Parameters:**
- `status` (optional): Filter by model status (e.g., "DEPLOYED", "TRAINING")
- `type` (optional): Filter by model type (e.g., "REGRESSION", "CLASSIFICATION")
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 20)

**Response:**
```json
{
  "data": [
    {
      "id": "model-123",
      "name": "Stock Price Predictor",
      "description": "Predicts stock prices based on historical data",
      "type": "REGRESSION",
      "status": "DEPLOYED",
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-02T00:00:00Z",
      "isProduction": true,
      "metrics": {
        "accuracy": 0.87,
        "f1Score": 0.85,
        "precision": 0.83,
        "recall": 0.88,
        "lastUpdated": "2023-01-02T00:00:00Z"
      }
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

#### GET /api/ml/models/{modelId}
Get details of a specific ML model.

**Response:**
```json
{
  "id": "model-123",
  "name": "Stock Price Predictor",
  "description": "Predicts stock prices based on historical data",
  "type": "REGRESSION",
  "status": "DEPLOYED",
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-01-02T00:00:00Z",
  "isProduction": true,
  "framework": "TensorFlow",
  "version": "1.0.0",
  "metrics": {
    "accuracy": 0.87,
    "f1Score": 0.85,
    "precision": 0.83,
    "recall": 0.88,
    "rmse": 0.15,
    "mae": 0.12,
    "r2": 0.85,
    "lastUpdated": "2023-01-02T00:00:00Z"
  },
  "schema": {
    "properties": {
      "open": { "type": "number" },
      "high": { "type": "number" },
      "low": { "type": "number" },
      "close": { "type": "number" },
      "volume": { "type": "number" }
    },
    "required": ["open", "high", "low", "close", "volume"]
  }
}
```

#### POST /api/ml/models
Create a new ML model.

**Request Body:**
```json
{
  "name": "New Stock Predictor",
  "type": "REGRESSION",
  "description": "Improved stock price prediction model"
}
```

**Response:**
```json
{
  "id": "model-456",
  "name": "New Stock Predictor",
  "description": "Improved stock price prediction model",
  "type": "REGRESSION",
  "status": "DRAFT",
  "createdAt": "2023-08-12T10:30:00Z",
  "updatedAt": "2023-08-12T10:30:00Z",
  "isProduction": false
}
```

#### PUT /api/ml/models/{modelId}
Update an existing ML model.

**Request Body:**
```json
{
  "name": "Updated Stock Predictor",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "id": "model-123",
  "name": "Updated Stock Predictor",
  "description": "Updated description",
  "type": "REGRESSION",
  "status": "DEPLOYED",
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-08-12T10:35:00Z",
  "isProduction": true
}
```

#### DELETE /api/ml/models/{modelId}
Delete an ML model.

**Response:**
```
204 No Content
```

#### POST /api/ml/models/{modelId}/deploy
Deploy an ML model.

**Response:**
```json
{
  "id": "model-123",
  "name": "Stock Price Predictor",
  "description": "Predicts stock prices based on historical data",
  "type": "REGRESSION",
  "status": "DEPLOYED",
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-08-12T10:40:00Z",
  "isProduction": true
}
```

#### POST /api/ml/models/{modelId}/train
Train an ML model.

**Request Body:**
```json
{
  "datasetId": "dataset-789",
  "validationSplit": 0.2,
  "epochs": 100,
  "batchSize": 32,
  "earlyStoppingPatience": 10,
  "learningRate": 0.001
}
```

**Response:**
```json
{
  "id": "model-123",
  "name": "Stock Price Predictor",
  "description": "Predicts stock prices based on historical data",
  "type": "REGRESSION",
  "status": "TRAINING",
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-08-12T10:45:00Z",
  "isProduction": false,
  "trainingJobId": "job-123"
}
```

### Model Versions

#### GET /api/ml/models/{modelId}/versions
Get all versions of a specific ML model.

**Response:**
```json
{
  "data": [
    {
      "id": "version-123",
      "modelId": "model-123",
      "version": "1.0.0",
      "status": "DEPLOYED",
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-02T00:00:00Z",
      "metrics": {
        "accuracy": 0.87,
        "f1Score": 0.85
      },
      "isProduction": true
    },
    {
      "id": "version-456",
      "modelId": "model-123",
      "version": "0.9.0",
      "status": "ARCHIVED",
      "createdAt": "2022-12-15T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z",
      "metrics": {
        "accuracy": 0.82,
        "f1Score": 0.80
      },
      "isProduction": false
    }
  ]
}
```

### Model Metrics

#### GET /api/ml/models/{modelId}/metrics
Get performance metrics for a specific ML model.

**Response:**
```json
{
  "accuracy": 0.87,
  "f1Score": 0.85,
  "precision": 0.83,
  "recall": 0.88,
  "rmse": 0.15,
  "mae": 0.12,
  "r2": 0.85,
  "lastUpdated": "2023-01-02T00:00:00Z"
}
```

### Feature Importance

#### GET /api/ml/models/{modelId}/feature-importance
Get feature importance for a specific ML model.

**Response:**
```json
{
  "data": [
    {
      "feature": "volume",
      "importance": 0.35
    },
    {
      "feature": "previous_close",
      "importance": 0.25
    },
    {
      "feature": "market_cap",
      "importance": 0.20
    },
    {
      "feature": "sector_performance",
      "importance": 0.15
    },
    {
      "feature": "volatility_index",
      "importance": 0.05
    }
  ]
}
```

#### GET /api/ml/models/{modelId}/feature-correlations
Get feature correlations for a specific ML model.

**Response:**
```json
{
  "data": [
    {
      "feature1": "volume",
      "feature2": "volatility_index",
      "correlation": 0.75
    },
    {
      "feature1": "previous_close",
      "feature2": "open",
      "correlation": 0.95
    }
  ]
}
```

#### GET /api/ml/models/{modelId}/partial-dependence
Get partial dependence plot data for a specific feature.

**Parameters:**
- `feature` (required): The feature name

**Response:**
```json
{
  "feature": "volume",
  "values": [1000, 5000, 10000, 50000, 100000, 500000, 1000000],
  "predictions": [105.2, 106.8, 108.3, 112.5, 115.7, 118.2, 120.1]
}
```

### Predictions

#### POST /api/ml/predict
Make a prediction using a specific ML model.

**Request Body:**
```json
{
  "modelId": "model-123",
  "inputData": {
    "open": 100.5,
    "high": 105.3,
    "low": 99.8,
    "close": 103.2,
    "volume": 1500000
  },
  "options": {
    "returnProbabilities": true,
    "includeFeatureContributions": true,
    "confidenceThreshold": 0.7,
    "batchSize": 1
  }
}
```

**Response:**
```json
{
  "id": "prediction-123",
  "modelId": "model-123",
  "timestamp": "2023-08-12T11:00:00Z",
  "prediction": 105.75,
  "confidence": 0.85,
  "predictionInterval": {
    "lower": 103.2,
    "upper": 108.3
  },
  "featureContributions": {
    "volume": 1.2,
    "previous_close": 0.8,
    "market_cap": -0.3,
    "sector_performance": 0.5,
    "volatility_index": 0.1
  },
  "inputData": {
    "open": 100.5,
    "high": 105.3,
    "low": 99.8,
    "close": 103.2,
    "volume": 1500000
  }
}
```

#### GET /api/ml/models/{modelId}/predictions
Get prediction history for a specific ML model.

**Parameters:**
- `limit` (optional): Number of predictions to return (default: 20)
- `offset` (optional): Offset for pagination (default: 0)
- `startDate` (optional): Filter by start date (ISO format)
- `endDate` (optional): Filter by end date (ISO format)

**Response:**
```json
{
  "data": [
    {
      "id": "prediction-123",
      "modelId": "model-123",
      "timestamp": "2023-08-12T11:00:00Z",
      "prediction": 105.75,
      "confidence": 0.85,
      "actual": 106.2,
      "error": 0.45
    },
    {
      "id": "prediction-122",
      "modelId": "model-123",
      "timestamp": "2023-08-11T11:00:00Z",
      "prediction": 103.5,
      "confidence": 0.82,
      "actual": 104.1,
      "error": 0.6
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0
  }
}
```

#### GET /api/ml/models/{modelId}/prediction-metrics
Get prediction metrics for a specific ML model.

**Response:**
```json
{
  "accuracy": 0.87,
  "meanError": 0.42,
  "rmse": 0.65,
  "averageLatency": 120.5,
  "confusionMatrix": {
    "buy": {
      "buy": 120,
      "hold": 15,
      "sell": 5
    },
    "hold": {
      "buy": 10,
      "hold": 95,
      "sell": 12
    },
    "sell": {
      "buy": 3,
      "hold": 8,
      "sell": 110
    }
  },
  "timeSeriesMetrics": [
    {
      "timestamp": "2023-08-01T00:00:00Z",
      "accuracy": 0.85,
      "error": 0.45,
      "count": 120
    },
    {
      "timestamp": "2023-08-02T00:00:00Z",
      "accuracy": 0.86,
      "error": 0.43,
      "count": 115
    }
  ]
}
```

### Local Explanations

#### POST /api/ml/models/{modelId}/explain
Get local feature explanations for a specific prediction.

**Request Body:**
```json
{
  "inputData": {
    "open": 100.5,
    "high": 105.3,
    "low": 99.8,
    "close": 103.2,
    "volume": 1500000
  }
}
```

**Response:**
```json
{
  "data": [
    {
      "feature": "volume",
      "value": 1500000,
      "contribution": 1.2,
      "impact": "positive"
    },
    {
      "feature": "previous_close",
      "value": 103.2,
      "contribution": 0.8,
      "impact": "positive"
    },
    {
      "feature": "market_cap",
      "value": 5000000000,
      "contribution": -0.3,
      "impact": "negative"
    }
  ]
}
```

### Performance Metrics

#### GET /api/ml/models/{modelId}/performance-metrics
Get detailed performance metrics for a specific ML model.

**Response:**
```json
{
  "data": [
    {
      "name": "Accuracy",
      "value": 0.87,
      "change": 0.02,
      "target": 0.9
    },
    {
      "name": "Precision",
      "value": 0.83,
      "change": -0.01,
      "target": 0.85
    },
    {
      "name": "Recall",
      "value": 0.79,
      "change": 0.03,
      "target": 0.8
    },
    {
      "name": "F1 Score",
      "value": 0.81,
      "change": 0.01,
      "target": 0.85
    }
  ]
}
```

#### GET /api/ml/models/{modelId}/performance-history
Get performance history for a specific ML model.

**Parameters:**
- `timeRange` (optional): Time range (e.g., "1w", "1m", "3m", "1y", "all")

**Response:**
```json
{
  "data": [
    {
      "timestamp": "2023-08-01T00:00:00Z",
      "accuracy": 0.85,
      "loss": 0.12
    },
    {
      "timestamp": "2023-08-02T00:00:00Z",
      "accuracy": 0.86,
      "loss": 0.11
    }
  ]
}
```

#### GET /api/ml/models/{modelId}/class-performance
Get class-specific performance for a classification model.

**Response:**
```json
{
  "data": [
    {
      "class": "buy",
      "precision": 0.91,
      "recall": 0.87,
      "f1Score": 0.89,
      "support": 120
    },
    {
      "class": "hold",
      "precision": 0.85,
      "recall": 0.82,
      "f1Score": 0.83,
      "support": 95
    },
    {
      "class": "sell",
      "precision": 0.78,
      "recall": 0.81,
      "f1Score": 0.79,
      "support": 110
    }
  ]
}
```

#### POST /api/ml/models/compare
Compare multiple ML models.

**Request Body:**
```json
{
  "modelIds": ["model-123", "model-456", "model-789"]
}
```

**Response:**
```json
{
  "data": [
    {
      "modelId": "model-123",
      "modelName": "Stock Predictor v1",
      "accuracy": 0.87,
      "latency": 120,
      "size": 45.2,
      "lastUpdated": "2023-08-01T00:00:00Z"
    },
    {
      "modelId": "model-456",
      "modelName": "Stock Predictor v2",
      "accuracy": 0.89,
      "latency": 150,
      "size": 62.5,
      "lastUpdated": "2023-08-10T00:00:00Z"
    },
    {
      "modelId": "model-789",
      "modelName": "Lightweight Predictor",
      "accuracy": 0.82,
      "latency": 80,
      "size": 12.8,
      "lastUpdated": "2023-07-15T00:00:00Z"
    }
  ]
}
```

### AutoML

#### POST /api/ml/automl
Start an AutoML process.

**Request Body:**
```json
{
  "datasetId": "dataset-789",
  "targetColumn": "next_day_close",
  "optimizationMetric": "accuracy",
  "timeLimit": 60,
  "maxModels": 10,
  "modelTypes": ["REGRESSION", "CLASSIFICATION"],
  "validationStrategy": "cross_validation",
  "validationParams": {
    "folds": 5,
    "shuffle": true
  }
}
```

**Response:**
```json
{
  "id": "automl-123",
  "status": "running",
  "startTime": "2023-08-12T12:00:00Z",
  "progress": 0
}
```

#### GET /api/ml/automl/{autoMLId}
Get the status of an AutoML process.

**Response:**
```json
{
  "id": "automl-123",
  "status": "completed",
  "startTime": "2023-08-12T12:00:00Z",
  "endTime": "2023-08-12T13:00:00Z",
  "progress": 100,
  "bestModel": {
    "modelId": "model-123",
    "modelType": "GRADIENT_BOOSTING",
    "accuracy": 0.89,
    "hyperparameters": {
      "n_estimators": 150,
      "max_depth": 5,
      "learning_rate": 0.1,
      "subsample": 0.8
    }
  },
  "leaderboard": [
    {
      "modelId": "model-123",
      "modelType": "GRADIENT_BOOSTING",
      "accuracy": 0.89,
      "rank": 1
    },
    {
      "modelId": "model-456",
      "modelType": "RANDOM_FOREST",
      "accuracy": 0.87,
      "rank": 2
    }
  ]
}
```

#### GET /api/ml/automl/history
Get the history of AutoML processes.

**Response:**
```json
{
  "data": [
    {
      "id": "automl-123",
      "status": "completed",
      "startTime": "2023-08-12T12:00:00Z",
      "endTime": "2023-08-12T13:00:00Z",
      "bestModel": {
        "modelId": "model-123",
        "modelType": "GRADIENT_BOOSTING",
        "accuracy": 0.89
      }
    },
    {
      "id": "automl-122",
      "status": "completed",
      "startTime": "2023-08-10T10:00:00Z",
      "endTime": "2023-08-10T11:30:00Z",
      "bestModel": {
        "modelId": "model-456",
        "modelType": "RANDOM_FOREST",
        "accuracy": 0.87
      }
    }
  ]
}
```

### Datasets

#### GET /api/ml/datasets
Get a list of available datasets.

**Response:**
```json
{
  "data": [
    {
      "id": "dataset-123",
      "name": "Stock Market Data",
      "size": 1250000,
      "lastUpdated": "2023-08-01T00:00:00Z"
    },
    {
      "id": "dataset-456",
      "name": "Customer Transactions",
      "size": 3500000,
      "lastUpdated": "2023-07-15T00:00:00Z"
    }
  ]
}
```

#### GET /api/ml/datasets/{datasetId}/columns
Get the columns of a specific dataset.

**Response:**
```json
{
  "data": [
    "date",
    "open",
    "high",
    "low",
    "close",
    "volume",
    "adj_close",
    "returns",
    "volatility",
    "market_cap",
    "sector",
    "industry"
  ]
}
```

## User Preferences

#### GET /api/settings/preferences
Get user preferences.

**Response:**
```json
{
  "mlDarkMode": false,
  "mlCompactView": false,
  "mlAutoRefresh": false,
  "mlRefreshInterval": 60,
  "mlDefaultTab": "dashboard",
  "mlSidebarOpen": true,
  "mlDataDisplayFormat": "table",
  "mlChartTheme": "default"
}
```

#### PUT /api/settings/preferences
Update user preferences.

**Request Body:**
```json
{
  "mlDarkMode": true,
  "mlCompactView": true
}
```

**Response:**
```json
{
  "mlDarkMode": true,
  "mlCompactView": true,
  "mlAutoRefresh": false,
  "mlRefreshInterval": 60,
  "mlDefaultTab": "dashboard",
  "mlSidebarOpen": true,
  "mlDataDisplayFormat": "table",
  "mlChartTheme": "default"
}
```