"""
Data Pipeline Module

This module provides a framework for creating and managing data pipelines
for different data types in the hedge fund trading application.
"""

import logging
import asyncio
from typing import Dict, List, Any, Callable, Optional, Union
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import DataSource, DataPipeline, DataJob
from ..config import settings

logger = logging.getLogger(__name__)

class DataPipelineManager:
    """
    Manages the creation, scheduling, and execution of data pipelines.
    """
    
    def __init__(self):
        self.pipelines: Dict[str, 'Pipeline'] = {}
        self.active_jobs: Dict[str, asyncio.Task] = {}
    
    def register_pipeline(self, pipeline: 'Pipeline') -> None:
        """Register a new pipeline with the manager."""
        if pipeline.name in self.pipelines:
            logger.warning(f"Pipeline {pipeline.name} already registered. Overwriting.")
        self.pipelines[pipeline.name] = pipeline
        logger.info(f"Pipeline {pipeline.name} registered successfully.")
    
    def get_pipeline(self, name: str) -> Optional['Pipeline']:
        """Get a pipeline by name."""
        return self.pipelines.get(name)
    
    def list_pipelines(self) -> List[str]:
        """List all registered pipelines."""
        return list(self.pipelines.keys())
    
    async def start_pipeline(self, name: str, params: Dict[str, Any] = None) -> str:
        """Start a pipeline execution with optional parameters."""
        pipeline = self.get_pipeline(name)
        if not pipeline:
            raise ValueError(f"Pipeline {name} not found.")
        
        job_id = f"{name}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{id(pipeline)}"
        
        # Create a job record
        db = next(get_db())
        job = DataJob(
            job_id=job_id,
            pipeline_name=name,
            status="running",
            params=params or {},
            start_time=datetime.now()
        )
        db.add(job)
        db.commit()
        
        # Start the pipeline in a background task
        task = asyncio.create_task(self._run_pipeline(pipeline, job_id, params))
        self.active_jobs[job_id] = task
        
        return job_id
    
    async def _run_pipeline(self, pipeline: 'Pipeline', job_id: str, params: Dict[str, Any] = None) -> None:
        """Execute a pipeline and update its status."""
        db = next(get_db())
        try:
            logger.info(f"Starting pipeline execution: {job_id}")
            result = await pipeline.execute(params or {})
            
            # Update job status
            job = db.query(DataJob).filter(DataJob.job_id == job_id).first()
            if job:
                job.status = "completed"
                job.end_time = datetime.now()
                job.result = result
                db.commit()
            
            logger.info(f"Pipeline execution completed: {job_id}")
        except Exception as e:
            logger.error(f"Pipeline execution failed: {job_id}", exc_info=True)
            
            # Update job status
            job = db.query(DataJob).filter(DataJob.job_id == job_id).first()
            if job:
                job.status = "failed"
                job.end_time = datetime.now()
                job.error = str(e)
                db.commit()
        finally:
            if job_id in self.active_jobs:
                del self.active_jobs[job_id]
    
    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """Get the status of a pipeline job."""
        db = next(get_db())
        job = db.query(DataJob).filter(DataJob.job_id == job_id).first()
        if not job:
            raise ValueError(f"Job {job_id} not found.")
        
        return {
            "job_id": job.job_id,
            "pipeline_name": job.pipeline_name,
            "status": job.status,
            "start_time": job.start_time,
            "end_time": job.end_time,
            "params": job.params,
            "result": job.result,
            "error": job.error
        }
    
    def list_jobs(self, pipeline_name: str = None, status: str = None) -> List[Dict[str, Any]]:
        """List all jobs, optionally filtered by pipeline name and/or status."""
        db = next(get_db())
        query = db.query(DataJob)
        
        if pipeline_name:
            query = query.filter(DataJob.pipeline_name == pipeline_name)
        
        if status:
            query = query.filter(DataJob.status == status)
        
        jobs = query.all()
        return [
            {
                "job_id": job.job_id,
                "pipeline_name": job.pipeline_name,
                "status": job.status,
                "start_time": job.start_time,
                "end_time": job.end_time
            }
            for job in jobs
        ]
    
    async def schedule_pipeline(self, name: str, schedule: str, params: Dict[str, Any] = None) -> str:
        """Schedule a pipeline to run on a recurring basis."""
        pipeline = self.get_pipeline(name)
        if not pipeline:
            raise ValueError(f"Pipeline {name} not found.")
        
        # Create a schedule record
        db = next(get_db())
        schedule_id = f"{name}_schedule_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        pipeline_record = db.query(DataPipeline).filter(DataPipeline.name == name).first()
        if not pipeline_record:
            pipeline_record = DataPipeline(
                name=name,
                description=pipeline.description,
                created_at=datetime.now()
            )
            db.add(pipeline_record)
        
        pipeline_record.schedule = schedule
        pipeline_record.schedule_params = params or {}
        pipeline_record.last_updated = datetime.now()
        db.commit()
        
        logger.info(f"Pipeline {name} scheduled with schedule: {schedule}")
        return schedule_id
    
    def cancel_job(self, job_id: str) -> bool:
        """Cancel a running job."""
        if job_id in self.active_jobs:
            task = self.active_jobs[job_id]
            task.cancel()
            
            # Update job status
            db = next(get_db())
            job = db.query(DataJob).filter(DataJob.job_id == job_id).first()
            if job:
                job.status = "cancelled"
                job.end_time = datetime.now()
                db.commit()
            
            logger.info(f"Job {job_id} cancelled.")
            return True
        
        logger.warning(f"Job {job_id} not found or already completed.")
        return False


class Pipeline:
    """
    Base class for defining data pipelines.
    """
    
    def __init__(self, name: str, description: str = ""):
        self.name = name
        self.description = description
        self.steps: List[Callable] = []
    
    def add_step(self, step_func: Callable) -> 'Pipeline':
        """Add a processing step to the pipeline."""
        self.steps.append(step_func)
        return self
    
    async def execute(self, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute all steps in the pipeline with the given parameters."""
        result = {"params": params or {}, "steps": []}
        data = params or {}
        
        for i, step in enumerate(self.steps):
            try:
                step_name = step.__name__ if hasattr(step, "__name__") else f"step_{i}"
                logger.info(f"Executing step {step_name} in pipeline {self.name}")
                
                step_start = datetime.now()
                data = await step(data) if asyncio.iscoroutinefunction(step) else step(data)
                step_end = datetime.now()
                
                result["steps"].append({
                    "name": step_name,
                    "status": "success",
                    "duration": (step_end - step_start).total_seconds()
                })
            except Exception as e:
                logger.error(f"Error in step {i} of pipeline {self.name}", exc_info=True)
                result["steps"].append({
                    "name": step_name if 'step_name' in locals() else f"step_{i}",
                    "status": "error",
                    "error": str(e)
                })
                raise
        
        result["output"] = data
        return result


# Factory functions for creating common pipeline types

def create_market_data_pipeline(source: str, symbols: List[str], 
                               start_date: Optional[str] = None, 
                               end_date: Optional[str] = None) -> Pipeline:
    """
    Create a pipeline for fetching and processing market data.
    
    Args:
        source: The data source (e.g., 'fmp', 'yahoo', 'alpha_vantage')
        symbols: List of ticker symbols
        start_date: Start date for historical data (YYYY-MM-DD)
        end_date: End date for historical data (YYYY-MM-DD)
    
    Returns:
        A configured Pipeline object
    """
    from ..data_sources import get_data_source
    from ..data_processors import clean_market_data, calculate_technical_indicators
    from ..data_storage import store_market_data
    
    pipeline = Pipeline(
        name=f"{source}_market_data_pipeline",
        description=f"Pipeline for fetching and processing market data from {source}"
    )
    
    # Define the steps
    async def fetch_data(params):
        data_source = get_data_source(source)
        symbols_list = params.get("symbols", symbols)
        start = params.get("start_date", start_date)
        end = params.get("end_date", end_date)
        
        results = {}
        for symbol in symbols_list:
            results[symbol] = await data_source.get_historical_data(symbol, start, end)
        
        return {"raw_data": results, **params}
    
    def process_data(params):
        raw_data = params["raw_data"]
        processed_data = {}
        
        for symbol, data in raw_data.items():
            # Clean the data
            cleaned_data = clean_market_data(data)
            
            # Calculate technical indicators
            with_indicators = calculate_technical_indicators(cleaned_data)
            
            processed_data[symbol] = with_indicators
        
        return {"processed_data": processed_data, **params}
    
    async def save_data(params):
        processed_data = params["processed_data"]
        
        for symbol, data in processed_data.items():
            await store_market_data(symbol, data)
        
        return {"status": "Data saved successfully", **params}
    
    # Add steps to the pipeline
    pipeline.add_step(fetch_data)
    pipeline.add_step(process_data)
    pipeline.add_step(save_data)
    
    return pipeline


def create_fundamental_data_pipeline(source: str, symbols: List[str]) -> Pipeline:
    """
    Create a pipeline for fetching and processing fundamental data.
    
    Args:
        source: The data source (e.g., 'fmp', 'yahoo', 'alpha_vantage')
        symbols: List of ticker symbols
    
    Returns:
        A configured Pipeline object
    """
    from ..data_sources import get_data_source
    from ..data_processors import process_financial_statements, calculate_financial_ratios
    from ..data_storage import store_fundamental_data
    
    pipeline = Pipeline(
        name=f"{source}_fundamental_data_pipeline",
        description=f"Pipeline for fetching and processing fundamental data from {source}"
    )
    
    # Define the steps
    async def fetch_financial_data(params):
        data_source = get_data_source(source)
        symbols_list = params.get("symbols", symbols)
        
        results = {}
        for symbol in symbols_list:
            income_stmt = await data_source.get_income_statement(symbol)
            balance_sheet = await data_source.get_balance_sheet(symbol)
            cash_flow = await data_source.get_cash_flow(symbol)
            
            results[symbol] = {
                "income_statement": income_stmt,
                "balance_sheet": balance_sheet,
                "cash_flow": cash_flow
            }
        
        return {"raw_financial_data": results, **params}
    
    def process_financial_data(params):
        raw_data = params["raw_financial_data"]
        processed_data = {}
        
        for symbol, data in raw_data.items():
            # Process financial statements
            processed_statements = process_financial_statements(data)
            
            # Calculate financial ratios
            with_ratios = calculate_financial_ratios(processed_statements)
            
            processed_data[symbol] = with_ratios
        
        return {"processed_financial_data": processed_data, **params}
    
    async def save_financial_data(params):
        processed_data = params["processed_financial_data"]
        
        for symbol, data in processed_data.items():
            await store_fundamental_data(symbol, data)
        
        return {"status": "Financial data saved successfully", **params}
    
    # Add steps to the pipeline
    pipeline.add_step(fetch_financial_data)
    pipeline.add_step(process_financial_data)
    pipeline.add_step(save_financial_data)
    
    return pipeline


def create_alternative_data_pipeline(data_type: str, source: str, symbols: List[str] = None) -> Pipeline:
    """
    Create a pipeline for fetching and processing alternative data.
    
    Args:
        data_type: Type of alternative data (e.g., 'sentiment', 'news', 'social_media')
        source: The data source
        symbols: Optional list of ticker symbols
    
    Returns:
        A configured Pipeline object
    """
    from ..data_sources import get_alternative_data_source
    from ..data_processors import process_alternative_data
    from ..data_storage import store_alternative_data
    
    pipeline = Pipeline(
        name=f"{data_type}_{source}_pipeline",
        description=f"Pipeline for fetching and processing {data_type} data from {source}"
    )
    
    # Define the steps
    async def fetch_alternative_data(params):
        data_source = get_alternative_data_source(source, data_type)
        symbols_list = params.get("symbols", symbols)
        
        if symbols_list:
            results = await data_source.get_data_for_symbols(symbols_list)
        else:
            results = await data_source.get_data()
        
        return {"raw_alternative_data": results, **params}
    
    def process_alt_data(params):
        raw_data = params["raw_alternative_data"]
        processed_data = process_alternative_data(raw_data, data_type)
        
        return {"processed_alternative_data": processed_data, **params}
    
    async def save_alt_data(params):
        processed_data = params["processed_alternative_data"]
        await store_alternative_data(processed_data, data_type)
        
        return {"status": f"{data_type} data saved successfully", **params}
    
    # Add steps to the pipeline
    pipeline.add_step(fetch_alternative_data)
    pipeline.add_step(process_alt_data)
    pipeline.add_step(save_alt_data)
    
    return pipeline


# Create the global pipeline manager instance
pipeline_manager = DataPipelineManager()