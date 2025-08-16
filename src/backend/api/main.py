"""
Main FastAPI application entry point for the Ultimate Hedge Fund & Trading Application.
"""
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
from typing import Dict, Any

# Import configuration
from config.config import settings

# Import Redis for rate limiting - fixed import path
from src.backend.config.redis import rate_limiter

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Advanced trading platform with ML/AI capabilities, multi-factor models, and comprehensive market analysis",
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Rate Limiting Middleware
@app.middleware("http")
async def api_rate_limit(request: Request, call_next):
    # Rate limiting for FMP API calls
    if "/api/fmp/" in request.url.path:
        # Get client IP or user identifier
        client_id = request.client.host
        
        # Check if rate limited (300 calls per minute)
        if rate_limiter and rate_limiter.is_rate_limited(f"fmp:{client_id}", settings.FMP_RATE_LIMIT, 60):
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded. Please try again later.",
                    "reset_in": rate_limiter.get_reset_time(f"fmp:{client_id}")
                }
            )
    
    # Measure request processing time
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    return response

# Health check endpoint
@app.get("/api/health")
async def health_check() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": "development" if settings.DEBUG else "production"
    }

# Import and include routers
from .routers import (
    auth,
    market_data,
    fundamental_data,
    ml_predictions,
    portfolio,
    screener,
    alerts,
    user,
    technical_analysis,
    factor_models,
    risk_management,
    alternative_data,
    order_book,
    websocket,
    risk_alerts,
    # New routers for Event-Driven & Fundamental Analysis
    event_detection_router,
    valuation_router,
    financial_analysis_router,
    correlation_analysis_router
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(market_data.router, prefix="/api/market", tags=["Market Data"])
app.include_router(fundamental_data.router, prefix="/api/fundamental", tags=["Fundamental Data"])
app.include_router(ml_predictions.router, prefix="/api/predictions", tags=["ML Predictions"])
app.include_router(factor_models.router, prefix="/api/factor-models", tags=["Factor Models"])
app.include_router(risk_management.router, prefix="/api/risk-management", tags=["Risk Management"])
app.include_router(alternative_data.router, prefix="/api/alternative-data", tags=["Alternative Data"])
app.include_router(order_book.router, prefix="/api/order-book", tags=["Order Book Analytics"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["Portfolio Management"])
app.include_router(screener.router, prefix="/api/screener", tags=["Stock Screener"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts & Notifications"])
app.include_router(user.router, prefix="/api/user", tags=["User Management"])
app.include_router(technical_analysis.router, prefix="/api/technical", tags=["Technical Analysis"])
app.include_router(websocket.router, prefix="/api/ws", tags=["WebSocket"])
app.include_router(risk_alerts.router, prefix="/api/risk-alerts", tags=["Risk Alerts"])

# New routers for Event-Driven & Fundamental Analysis
app.include_router(event_detection_router.router, prefix="/api/events", tags=["Event Detection"])
app.include_router(valuation_router.router, prefix="/api/valuation", tags=["Company Valuation"])
app.include_router(financial_analysis_router.router, prefix="/api/financial-analysis", tags=["Financial Analysis"])
app.include_router(correlation_analysis_router.router, prefix="/api/correlation", tags=["Event-Fundamental Correlation"])

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": exc.detail},
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)