"""
Data Schemas Module

This module defines the Pydantic schemas for data infrastructure API requests and responses.
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Union
from datetime import datetime

# Data Source Schemas

class DataSourceBase(BaseModel):
    """Base schema for data sources."""
    name: str
    type: str
    description: Optional[str] = None
    config: Dict[str, Any] = Field(default_factory=dict)
    rate_limit: Optional[int] = None
    enabled: bool = True


class DataSourceCreate(DataSourceBase):
    """Schema for creating a data source."""
    credentials: Dict[str, Any] = Field(default_factory=dict)


class DataSourceUpdate(BaseModel):
    """Schema for updating a data source."""
    name: Optional[str] = None
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    credentials: Optional[Dict[str, Any]] = None
    rate_limit: Optional[int] = None
    enabled: Optional[bool] = None


class DataSourceResponse(DataSourceBase):
    """Schema for data source response."""
    id: int
    created_at: datetime
    last_updated: datetime

    class Config:
        orm_mode = True


# Data Pipeline Schemas

class DataPipelineBase(BaseModel):
    """Base schema for data pipelines."""
    name: str
    description: Optional[str] = None
    source_id: Optional[int] = None
    steps: List[Dict[str, Any]] = Field(default_factory=list)
    schedule: Optional[str] = None
    schedule_params: Dict[str, Any] = Field(default_factory=dict)
    enabled: bool = True


class DataPipelineCreate(DataPipelineBase):
    """Schema for creating a data pipeline."""
    pass


class DataPipelineUpdate(BaseModel):
    """Schema for updating a data pipeline."""
    description: Optional[str] = None
    source_id: Optional[int] = None
    steps: Optional[List[Dict[str, Any]]] = None
    schedule: Optional[str] = None
    schedule_params: Optional[Dict[str, Any]] = None
    enabled: Optional[bool] = None


class DataPipelineResponse(DataPipelineBase):
    """Schema for data pipeline response."""
    id: int
    created_at: datetime
    last_updated: datetime

    class Config:
        orm_mode = True


# Data Job Schemas

class DataJobBase(BaseModel):
    """Base schema for data jobs."""
    job_id: str
    pipeline_name: str
    status: str
    params: Dict[str, Any] = Field(default_factory=dict)
    start_time: datetime


class DataJobCreate(DataJobBase):
    """Schema for creating a data job."""
    pass


class DataJobResponse(DataJobBase):
    """Schema for data job response."""
    pipeline_id: Optional[int] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    end_time: Optional[datetime] = None

    class Config:
        orm_mode = True


# Scheduled Job Schemas

class ScheduledJobBase(BaseModel):
    """Base schema for scheduled jobs."""
    data_type: str
    source: str
    schedule_type: str
    schedule_params: Dict[str, Any] = Field(default_factory=dict)
    symbols: Optional[List[str]] = None


class ScheduledJobCreate(ScheduledJobBase):
    """Schema for creating a scheduled job."""
    pass


class ScheduledJobUpdate(BaseModel):
    """Schema for updating a scheduled job."""
    schedule_type: Optional[str] = None
    schedule_params: Optional[Dict[str, Any]] = None
    symbols: Optional[List[str]] = None


class ScheduledJobResponse(ScheduledJobBase):
    """Schema for scheduled job response."""
    job_id: str
    name: str
    status: str
    created_at: datetime
    last_updated: datetime
    next_run_time: Optional[str] = None
    recent_logs: Optional[List[Dict[str, Any]]] = None


# Update Log Schemas

class UpdateLogBase(BaseModel):
    """Base schema for update logs."""
    job_id: str
    data_type: str
    source: str
    status: str
    symbols: Optional[List[str]] = None
    start_time: datetime


class UpdateLogCreate(UpdateLogBase):
    """Schema for creating an update log."""
    pass


class UpdateLogResponse(UpdateLogBase):
    """Schema for update log response."""
    id: int
    pipeline_job_id: Optional[str] = None
    end_time: Optional[datetime] = None
    duration: Optional[float] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

    class Config:
        orm_mode = True


# Data Storage Schemas

class MarketDataRequest(BaseModel):
    """Schema for storing market data."""
    symbol: str
    source: str = "default"
    data: List[Dict[str, Any]]


class FundamentalDataRequest(BaseModel):
    """Schema for storing fundamental data."""
    symbol: str
    source: str = "default"
    data: Dict[str, Any]


class AlternativeDataRequest(BaseModel):
    """Schema for storing alternative data."""
    data_type: str
    source: str = "default"
    data: Any
    metadata: Optional[Dict[str, Any]] = None