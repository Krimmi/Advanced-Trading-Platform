"""
Data Models Module

This module defines the database models for data management, including data sources,
schemas, partitions, and scheduled jobs.
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON, Text, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

from ..database import Base

class DataSource(Base):
    """
    Model for data sources.
    """
    __tablename__ = "data_sources"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    type = Column(String, index=True, nullable=False)  # market_data, fundamental_data, alternative_data, etc.
    description = Column(String)
    config = Column(JSONB, default={})
    credentials = Column(JSONB, default={})
    rate_limit = Column(Integer)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    last_updated = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    schemas = relationship("DataSchema", back_populates="source")
    pipelines = relationship("DataPipeline", back_populates="source")


class DataSchema(Base):
    """
    Model for data schemas.
    """
    __tablename__ = "data_schemas"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String)
    source_id = Column(Integer, ForeignKey("data_sources.id"), nullable=True)
    fields = Column(JSONB)  # List of field definitions
    validation_rules = Column(JSONB)  # Validation rules for fields
    created_at = Column(DateTime, default=datetime.now)
    last_updated = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    source = relationship("DataSource", back_populates="schemas")
    partitions = relationship("DataPartition", back_populates="schema")


class DataPartition(Base):
    """
    Model for data partitions.
    """
    __tablename__ = "data_partitions"
    
    id = Column(Integer, primary_key=True, index=True)
    storage_id = Column(String, index=True, nullable=False, unique=True)
    schema_id = Column(Integer, ForeignKey("data_schemas.id"), nullable=True)
    data = Column(Text)  # JSON serialized data or reference to external storage
    metadata = Column(JSONB, default={})
    created_at = Column(DateTime, default=datetime.now)
    last_updated = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    schema = relationship("DataSchema", back_populates="partitions")


class DataPipeline(Base):
    """
    Model for data pipelines.
    """
    __tablename__ = "data_pipelines"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False, unique=True)
    description = Column(String)
    source_id = Column(Integer, ForeignKey("data_sources.id"), nullable=True)
    steps = Column(JSONB)  # Pipeline step definitions
    schedule = Column(String)  # Cron expression or interval
    schedule_params = Column(JSONB, default={})
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    last_updated = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    source = relationship("DataSource", back_populates="pipelines")
    jobs = relationship("DataJob", back_populates="pipeline")


class DataJob(Base):
    """
    Model for data pipeline jobs.
    """
    __tablename__ = "data_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, index=True, nullable=False, unique=True)
    pipeline_name = Column(String, index=True, nullable=False)
    pipeline_id = Column(Integer, ForeignKey("data_pipelines.id"), nullable=True)
    status = Column(String, index=True)  # running, completed, failed, cancelled
    params = Column(JSONB, default={})
    result = Column(JSONB)
    error = Column(String)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    
    # Relationships
    pipeline = relationship("DataPipeline", back_populates="jobs")


class MarketData(Base):
    """
    Model for market data records.
    """
    __tablename__ = "market_data"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True, nullable=False)
    source = Column(String, index=True, nullable=False)
    storage_id = Column(String, index=True, nullable=False)
    storage_backend = Column(String, nullable=False)  # sql, timescale, object
    start_date = Column(String, index=True)
    end_date = Column(String, index=True)
    columns = Column(JSONB)  # List of column names
    row_count = Column(Integer)
    created_at = Column(DateTime, default=datetime.now)
    last_updated = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class FundamentalData(Base):
    """
    Model for fundamental data records.
    """
    __tablename__ = "fundamental_data"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True, nullable=False)
    source = Column(String, index=True, nullable=False)
    storage_id = Column(String, index=True, nullable=False)
    storage_backend = Column(String, nullable=False)  # sql, object
    data_type = Column(String, index=True)  # income_statement, balance_sheet, cash_flow, ratios
    statements = Column(JSONB)  # List of statement types
    period = Column(String, index=True)  # annual, quarterly
    latest_date = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.now)
    last_updated = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class AlternativeData(Base):
    """
    Model for alternative data records.
    """
    __tablename__ = "alternative_data"
    
    id = Column(Integer, primary_key=True, index=True)
    data_type = Column(String, index=True, nullable=False)  # sentiment, news, social_media, satellite, etc.
    source = Column(String, index=True, nullable=False)
    storage_id = Column(String, index=True, nullable=False)
    storage_backend = Column(String, nullable=False)  # sql, timescale, object
    metadata = Column(JSONB, default={})
    created_at = Column(DateTime, default=datetime.now)
    last_updated = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class ScheduledJob(Base):
    """
    Model for scheduled data update jobs.
    """
    __tablename__ = "scheduled_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, index=True, nullable=False, unique=True)
    name = Column(String, nullable=False)
    data_type = Column(String, index=True, nullable=False)
    source = Column(String, index=True, nullable=False)
    schedule_type = Column(String, nullable=False)  # daily, weekly, monthly, interval
    schedule_params = Column(JSONB, default={})
    symbols = Column(JSONB)  # List of symbols
    status = Column(String, index=True)  # active, paused, removed
    created_at = Column(DateTime, default=datetime.now)
    last_updated = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class UpdateLog(Base):
    """
    Model for data update logs.
    """
    __tablename__ = "update_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, index=True, nullable=False)
    pipeline_job_id = Column(String, index=True)
    data_type = Column(String, index=True, nullable=False)
    source = Column(String, index=True, nullable=False)
    status = Column(String, index=True)  # running, completed, failed
    symbols = Column(JSONB)  # List of symbols
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    result = Column(JSONB)
    error = Column(String)