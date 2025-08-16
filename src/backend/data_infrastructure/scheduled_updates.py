"""
Scheduled Data Updates Module

This module provides functionality for scheduling and managing regular data updates
for various data types in the hedge fund trading application.
"""

import logging
import asyncio
import time
import json
from typing import Dict, List, Any, Optional, Union, Callable
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from sqlalchemy.orm import Session

from ..database import get_db, engine
from ..models import ScheduledJob, DataSource, UpdateLog
from ..config import settings
from .data_pipeline import pipeline_manager

logger = logging.getLogger(__name__)

class ScheduledUpdateManager:
    """
    Manages scheduled data updates for various data types.
    """
    
    def __init__(self):
        """Initialize the scheduler and job store."""
        # Set up job stores
        jobstores = {
            'default': SQLAlchemyJobStore(url=str(engine.url))
        }
        
        # Create scheduler
        self.scheduler = AsyncIOScheduler(jobstores=jobstores)
        self.active = False
        self.jobs = {}
    
    def start(self):
        """Start the scheduler."""
        if not self.active:
            self.scheduler.start()
            self.active = True
            logger.info("Scheduled update manager started.")
    
    def shutdown(self):
        """Shutdown the scheduler."""
        if self.active:
            self.scheduler.shutdown()
            self.active = False
            logger.info("Scheduled update manager shut down.")
    
    async def schedule_market_data_update(self, symbols: List[str], source: str = "default",
                                        schedule_type: str = "daily", **schedule_params) -> str:
        """
        Schedule regular updates for market data.
        
        Args:
            symbols: List of ticker symbols to update
            source: Data source name
            schedule_type: Type of schedule ('daily', 'weekly', 'monthly', 'interval')
            **schedule_params: Additional scheduling parameters
            
        Returns:
            Job ID
        """
        # Create a unique job ID
        job_id = f"market_data_{source}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Define the job function
        async def update_market_data():
            try:
                logger.info(f"Running scheduled market data update for {len(symbols)} symbols from {source}")
                
                # Create and run the market data pipeline
                pipeline_name = f"{source}_market_data_pipeline"
                
                # Check if pipeline exists, create if not
                if pipeline_name not in pipeline_manager.list_pipelines():
                    from .data_pipeline import create_market_data_pipeline
                    pipeline = create_market_data_pipeline(source, symbols)
                    pipeline_manager.register_pipeline(pipeline)
                
                # Run the pipeline
                job_params = {
                    "symbols": symbols,
                    "source": source,
                    "scheduled": True,
                    "job_id": job_id
                }
                
                pipeline_job_id = await pipeline_manager.start_pipeline(pipeline_name, job_params)
                
                # Log the update
                db = next(get_db())
                log = UpdateLog(
                    job_id=job_id,
                    pipeline_job_id=pipeline_job_id,
                    data_type="market_data",
                    source=source,
                    status="running",
                    symbols=symbols,
                    start_time=datetime.now()
                )
                db.add(log)
                db.commit()
                
                logger.info(f"Scheduled market data update started with pipeline job ID: {pipeline_job_id}")
                
                # Wait for pipeline to complete
                while True:
                    status = pipeline_manager.get_job_status(pipeline_job_id)
                    if status["status"] in ["completed", "failed"]:
                        # Update log
                        log = db.query(UpdateLog).filter(UpdateLog.pipeline_job_id == pipeline_job_id).first()
                        if log:
                            log.status = status["status"]
                            log.end_time = datetime.now()
                            log.result = status.get("result")
                            log.error = status.get("error")
                            db.commit()
                        
                        logger.info(f"Scheduled market data update completed with status: {status['status']}")
                        break
                    
                    await asyncio.sleep(5)
                
            except Exception as e:
                logger.error(f"Error in scheduled market data update: {e}", exc_info=True)
                
                # Log the error
                db = next(get_db())
                log = UpdateLog(
                    job_id=job_id,
                    data_type="market_data",
                    source=source,
                    status="failed",
                    symbols=symbols,
                    start_time=datetime.now(),
                    end_time=datetime.now(),
                    error=str(e)
                )
                db.add(log)
                db.commit()
        
        # Set up the trigger based on schedule type
        trigger = self._create_trigger(schedule_type, **schedule_params)
        
        # Add the job to the scheduler
        job = self.scheduler.add_job(
            update_market_data,
            trigger=trigger,
            id=job_id,
            name=f"Market Data Update ({source})",
            replace_existing=True
        )
        
        # Store job in database
        db = next(get_db())
        scheduled_job = ScheduledJob(
            job_id=job_id,
            name=f"Market Data Update ({source})",
            data_type="market_data",
            source=source,
            schedule_type=schedule_type,
            schedule_params=schedule_params,
            symbols=symbols,
            status="active",
            created_at=datetime.now(),
            last_updated=datetime.now()
        )
        db.add(scheduled_job)
        db.commit()
        
        self.jobs[job_id] = job
        logger.info(f"Scheduled market data update job created with ID: {job_id}")
        
        return job_id
    
    async def schedule_fundamental_data_update(self, symbols: List[str], source: str = "default",
                                             schedule_type: str = "weekly", **schedule_params) -> str:
        """
        Schedule regular updates for fundamental data.
        
        Args:
            symbols: List of ticker symbols to update
            source: Data source name
            schedule_type: Type of schedule ('daily', 'weekly', 'monthly', 'interval')
            **schedule_params: Additional scheduling parameters
            
        Returns:
            Job ID
        """
        # Create a unique job ID
        job_id = f"fundamental_data_{source}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Define the job function
        async def update_fundamental_data():
            try:
                logger.info(f"Running scheduled fundamental data update for {len(symbols)} symbols from {source}")
                
                # Create and run the fundamental data pipeline
                pipeline_name = f"{source}_fundamental_data_pipeline"
                
                # Check if pipeline exists, create if not
                if pipeline_name not in pipeline_manager.list_pipelines():
                    from .data_pipeline import create_fundamental_data_pipeline
                    pipeline = create_fundamental_data_pipeline(source, symbols)
                    pipeline_manager.register_pipeline(pipeline)
                
                # Run the pipeline
                job_params = {
                    "symbols": symbols,
                    "source": source,
                    "scheduled": True,
                    "job_id": job_id
                }
                
                pipeline_job_id = await pipeline_manager.start_pipeline(pipeline_name, job_params)
                
                # Log the update
                db = next(get_db())
                log = UpdateLog(
                    job_id=job_id,
                    pipeline_job_id=pipeline_job_id,
                    data_type="fundamental_data",
                    source=source,
                    status="running",
                    symbols=symbols,
                    start_time=datetime.now()
                )
                db.add(log)
                db.commit()
                
                logger.info(f"Scheduled fundamental data update started with pipeline job ID: {pipeline_job_id}")
                
                # Wait for pipeline to complete
                while True:
                    status = pipeline_manager.get_job_status(pipeline_job_id)
                    if status["status"] in ["completed", "failed"]:
                        # Update log
                        log = db.query(UpdateLog).filter(UpdateLog.pipeline_job_id == pipeline_job_id).first()
                        if log:
                            log.status = status["status"]
                            log.end_time = datetime.now()
                            log.result = status.get("result")
                            log.error = status.get("error")
                            db.commit()
                        
                        logger.info(f"Scheduled fundamental data update completed with status: {status['status']}")
                        break
                    
                    await asyncio.sleep(5)
                
            except Exception as e:
                logger.error(f"Error in scheduled fundamental data update: {e}", exc_info=True)
                
                # Log the error
                db = next(get_db())
                log = UpdateLog(
                    job_id=job_id,
                    data_type="fundamental_data",
                    source=source,
                    status="failed",
                    symbols=symbols,
                    start_time=datetime.now(),
                    end_time=datetime.now(),
                    error=str(e)
                )
                db.add(log)
                db.commit()
        
        # Set up the trigger based on schedule type
        trigger = self._create_trigger(schedule_type, **schedule_params)
        
        # Add the job to the scheduler
        job = self.scheduler.add_job(
            update_fundamental_data,
            trigger=trigger,
            id=job_id,
            name=f"Fundamental Data Update ({source})",
            replace_existing=True
        )
        
        # Store job in database
        db = next(get_db())
        scheduled_job = ScheduledJob(
            job_id=job_id,
            name=f"Fundamental Data Update ({source})",
            data_type="fundamental_data",
            source=source,
            schedule_type=schedule_type,
            schedule_params=schedule_params,
            symbols=symbols,
            status="active",
            created_at=datetime.now(),
            last_updated=datetime.now()
        )
        db.add(scheduled_job)
        db.commit()
        
        self.jobs[job_id] = job
        logger.info(f"Scheduled fundamental data update job created with ID: {job_id}")
        
        return job_id
    
    async def schedule_alternative_data_update(self, data_type: str, source: str = "default",
                                             symbols: List[str] = None,
                                             schedule_type: str = "daily", **schedule_params) -> str:
        """
        Schedule regular updates for alternative data.
        
        Args:
            data_type: Type of alternative data
            source: Data source name
            symbols: Optional list of ticker symbols
            schedule_type: Type of schedule ('daily', 'weekly', 'monthly', 'interval')
            **schedule_params: Additional scheduling parameters
            
        Returns:
            Job ID
        """
        # Create a unique job ID
        job_id = f"alternative_data_{data_type}_{source}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Define the job function
        async def update_alternative_data():
            try:
                logger.info(f"Running scheduled alternative data update for {data_type} from {source}")
                
                # Create and run the alternative data pipeline
                pipeline_name = f"{data_type}_{source}_pipeline"
                
                # Check if pipeline exists, create if not
                if pipeline_name not in pipeline_manager.list_pipelines():
                    from .data_pipeline import create_alternative_data_pipeline
                    pipeline = create_alternative_data_pipeline(data_type, source, symbols)
                    pipeline_manager.register_pipeline(pipeline)
                
                # Run the pipeline
                job_params = {
                    "data_type": data_type,
                    "source": source,
                    "symbols": symbols,
                    "scheduled": True,
                    "job_id": job_id
                }
                
                pipeline_job_id = await pipeline_manager.start_pipeline(pipeline_name, job_params)
                
                # Log the update
                db = next(get_db())
                log = UpdateLog(
                    job_id=job_id,
                    pipeline_job_id=pipeline_job_id,
                    data_type=f"alternative_{data_type}",
                    source=source,
                    status="running",
                    symbols=symbols,
                    start_time=datetime.now()
                )
                db.add(log)
                db.commit()
                
                logger.info(f"Scheduled alternative data update started with pipeline job ID: {pipeline_job_id}")
                
                # Wait for pipeline to complete
                while True:
                    status = pipeline_manager.get_job_status(pipeline_job_id)
                    if status["status"] in ["completed", "failed"]:
                        # Update log
                        log = db.query(UpdateLog).filter(UpdateLog.pipeline_job_id == pipeline_job_id).first()
                        if log:
                            log.status = status["status"]
                            log.end_time = datetime.now()
                            log.result = status.get("result")
                            log.error = status.get("error")
                            db.commit()
                        
                        logger.info(f"Scheduled alternative data update completed with status: {status['status']}")
                        break
                    
                    await asyncio.sleep(5)
                
            except Exception as e:
                logger.error(f"Error in scheduled alternative data update: {e}", exc_info=True)
                
                # Log the error
                db = next(get_db())
                log = UpdateLog(
                    job_id=job_id,
                    data_type=f"alternative_{data_type}",
                    source=source,
                    status="failed",
                    symbols=symbols,
                    start_time=datetime.now(),
                    end_time=datetime.now(),
                    error=str(e)
                )
                db.add(log)
                db.commit()
        
        # Set up the trigger based on schedule type
        trigger = self._create_trigger(schedule_type, **schedule_params)
        
        # Add the job to the scheduler
        job = self.scheduler.add_job(
            update_alternative_data,
            trigger=trigger,
            id=job_id,
            name=f"Alternative Data Update ({data_type}, {source})",
            replace_existing=True
        )
        
        # Store job in database
        db = next(get_db())
        scheduled_job = ScheduledJob(
            job_id=job_id,
            name=f"Alternative Data Update ({data_type}, {source})",
            data_type=f"alternative_{data_type}",
            source=source,
            schedule_type=schedule_type,
            schedule_params=schedule_params,
            symbols=symbols,
            status="active",
            created_at=datetime.now(),
            last_updated=datetime.now()
        )
        db.add(scheduled_job)
        db.commit()
        
        self.jobs[job_id] = job
        logger.info(f"Scheduled alternative data update job created with ID: {job_id}")
        
        return job_id
    
    def _create_trigger(self, schedule_type: str, **params) -> Union[CronTrigger, IntervalTrigger]:
        """
        Create a scheduler trigger based on schedule type and parameters.
        
        Args:
            schedule_type: Type of schedule ('daily', 'weekly', 'monthly', 'interval')
            **params: Additional scheduling parameters
            
        Returns:
            A scheduler trigger
        """
        if schedule_type == 'daily':
            # Default to 00:00 if not specified
            hour = params.get('hour', 0)
            minute = params.get('minute', 0)
            return CronTrigger(hour=hour, minute=minute)
        
        elif schedule_type == 'weekly':
            # Default to Monday at 00:00 if not specified
            day_of_week = params.get('day_of_week', 0)  # Monday
            hour = params.get('hour', 0)
            minute = params.get('minute', 0)
            return CronTrigger(day_of_week=day_of_week, hour=hour, minute=minute)
        
        elif schedule_type == 'monthly':
            # Default to 1st day of month at 00:00 if not specified
            day = params.get('day', 1)
            hour = params.get('hour', 0)
            minute = params.get('minute', 0)
            return CronTrigger(day=day, hour=hour, minute=minute)
        
        elif schedule_type == 'interval':
            # Default to 1 hour if not specified
            hours = params.get('hours', 0)
            minutes = params.get('minutes', 0)
            seconds = params.get('seconds', 0)
            
            # Ensure at least one time unit is specified
            if hours == 0 and minutes == 0 and seconds == 0:
                hours = 1
            
            return IntervalTrigger(hours=hours, minutes=minutes, seconds=seconds)
        
        else:
            raise ValueError(f"Unknown schedule type: {schedule_type}")
    
    def pause_job(self, job_id: str) -> bool:
        """
        Pause a scheduled job.
        
        Args:
            job_id: The job ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.scheduler.pause_job(job_id)
            
            # Update job status in database
            db = next(get_db())
            job = db.query(ScheduledJob).filter(ScheduledJob.job_id == job_id).first()
            if job:
                job.status = "paused"
                job.last_updated = datetime.now()
                db.commit()
            
            logger.info(f"Job {job_id} paused.")
            return True
        except Exception as e:
            logger.error(f"Error pausing job {job_id}: {e}")
            return False
    
    def resume_job(self, job_id: str) -> bool:
        """
        Resume a paused job.
        
        Args:
            job_id: The job ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.scheduler.resume_job(job_id)
            
            # Update job status in database
            db = next(get_db())
            job = db.query(ScheduledJob).filter(ScheduledJob.job_id == job_id).first()
            if job:
                job.status = "active"
                job.last_updated = datetime.now()
                db.commit()
            
            logger.info(f"Job {job_id} resumed.")
            return True
        except Exception as e:
            logger.error(f"Error resuming job {job_id}: {e}")
            return False
    
    def remove_job(self, job_id: str) -> bool:
        """
        Remove a scheduled job.
        
        Args:
            job_id: The job ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.scheduler.remove_job(job_id)
            
            # Update job status in database
            db = next(get_db())
            job = db.query(ScheduledJob).filter(ScheduledJob.job_id == job_id).first()
            if job:
                job.status = "removed"
                job.last_updated = datetime.now()
                db.commit()
            
            if job_id in self.jobs:
                del self.jobs[job_id]
            
            logger.info(f"Job {job_id} removed.")
            return True
        except Exception as e:
            logger.error(f"Error removing job {job_id}: {e}")
            return False
    
    def get_job_info(self, job_id: str) -> Dict[str, Any]:
        """
        Get information about a scheduled job.
        
        Args:
            job_id: The job ID
            
        Returns:
            Job information
        """
        db = next(get_db())
        job = db.query(ScheduledJob).filter(ScheduledJob.job_id == job_id).first()
        
        if not job:
            raise ValueError(f"Job {job_id} not found.")
        
        # Get next run time
        scheduler_job = self.scheduler.get_job(job_id)
        next_run_time = scheduler_job.next_run_time if scheduler_job else None
        
        # Get recent logs
        logs = db.query(UpdateLog).filter(
            UpdateLog.job_id == job_id
        ).order_by(UpdateLog.start_time.desc()).limit(5).all()
        
        log_info = []
        for log in logs:
            log_info.append({
                "pipeline_job_id": log.pipeline_job_id,
                "status": log.status,
                "start_time": log.start_time.isoformat() if log.start_time else None,
                "end_time": log.end_time.isoformat() if log.end_time else None,
                "error": log.error
            })
        
        return {
            "job_id": job.job_id,
            "name": job.name,
            "data_type": job.data_type,
            "source": job.source,
            "schedule_type": job.schedule_type,
            "schedule_params": job.schedule_params,
            "symbols": job.symbols,
            "status": job.status,
            "created_at": job.created_at.isoformat(),
            "last_updated": job.last_updated.isoformat(),
            "next_run_time": next_run_time.isoformat() if next_run_time else None,
            "recent_logs": log_info
        }
    
    def list_jobs(self, data_type: str = None, source: str = None,
                 status: str = None) -> List[Dict[str, Any]]:
        """
        List scheduled jobs with optional filters.
        
        Args:
            data_type: Optional data type filter
            source: Optional source filter
            status: Optional status filter
            
        Returns:
            List of job information
        """
        db = next(get_db())
        query = db.query(ScheduledJob)
        
        if data_type:
            query = query.filter(ScheduledJob.data_type == data_type)
        
        if source:
            query = query.filter(ScheduledJob.source == source)
        
        if status:
            query = query.filter(ScheduledJob.status == status)
        
        jobs = query.all()
        
        result = []
        for job in jobs:
            # Get next run time
            scheduler_job = self.scheduler.get_job(job.job_id)
            next_run_time = scheduler_job.next_run_time if scheduler_job else None
            
            result.append({
                "job_id": job.job_id,
                "name": job.name,
                "data_type": job.data_type,
                "source": job.source,
                "schedule_type": job.schedule_type,
                "status": job.status,
                "created_at": job.created_at.isoformat(),
                "last_updated": job.last_updated.isoformat(),
                "next_run_time": next_run_time.isoformat() if next_run_time else None
            })
        
        return result
    
    def get_update_logs(self, job_id: str = None, data_type: str = None,
                       source: str = None, status: str = None,
                       limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get logs of data updates with optional filters.
        
        Args:
            job_id: Optional job ID filter
            data_type: Optional data type filter
            source: Optional source filter
            status: Optional status filter
            limit: Maximum number of logs to return
            
        Returns:
            List of update logs
        """
        db = next(get_db())
        query = db.query(UpdateLog)
        
        if job_id:
            query = query.filter(UpdateLog.job_id == job_id)
        
        if data_type:
            query = query.filter(UpdateLog.data_type == data_type)
        
        if source:
            query = query.filter(UpdateLog.source == source)
        
        if status:
            query = query.filter(UpdateLog.status == status)
        
        logs = query.order_by(UpdateLog.start_time.desc()).limit(limit).all()
        
        result = []
        for log in logs:
            result.append({
                "id": log.id,
                "job_id": log.job_id,
                "pipeline_job_id": log.pipeline_job_id,
                "data_type": log.data_type,
                "source": log.source,
                "status": log.status,
                "symbols": log.symbols,
                "start_time": log.start_time.isoformat() if log.start_time else None,
                "end_time": log.end_time.isoformat() if log.end_time else None,
                "duration": (log.end_time - log.start_time).total_seconds() if log.end_time and log.start_time else None,
                "error": log.error
            })
        
        return result
    
    def load_jobs_from_database(self):
        """Load and schedule all active jobs from the database."""
        db = next(get_db())
        jobs = db.query(ScheduledJob).filter(ScheduledJob.status == "active").all()
        
        for job in jobs:
            try:
                # Create trigger
                trigger = self._create_trigger(job.schedule_type, **job.schedule_params)
                
                # Define job function based on data type
                if job.data_type == "market_data":
                    job_func = self._create_market_data_job_func(job.job_id, job.source, job.symbols)
                elif job.data_type == "fundamental_data":
                    job_func = self._create_fundamental_data_job_func(job.job_id, job.source, job.symbols)
                elif job.data_type.startswith("alternative_"):
                    alt_type = job.data_type.replace("alternative_", "")
                    job_func = self._create_alternative_data_job_func(job.job_id, alt_type, job.source, job.symbols)
                else:
                    logger.warning(f"Unknown data type for job {job.job_id}: {job.data_type}")
                    continue
                
                # Add job to scheduler
                scheduler_job = self.scheduler.add_job(
                    job_func,
                    trigger=trigger,
                    id=job.job_id,
                    name=job.name,
                    replace_existing=True
                )
                
                self.jobs[job.job_id] = scheduler_job
                logger.info(f"Loaded job {job.job_id} from database")
                
            except Exception as e:
                logger.error(f"Error loading job {job.job_id} from database: {e}", exc_info=True)
    
    def _create_market_data_job_func(self, job_id: str, source: str, symbols: List[str]):
        """Create a job function for market data updates."""
        async def update_market_data():
            try:
                logger.info(f"Running scheduled market data update for {len(symbols)} symbols from {source}")
                
                # Create and run the market data pipeline
                pipeline_name = f"{source}_market_data_pipeline"
                
                # Check if pipeline exists, create if not
                if pipeline_name not in pipeline_manager.list_pipelines():
                    from .data_pipeline import create_market_data_pipeline
                    pipeline = create_market_data_pipeline(source, symbols)
                    pipeline_manager.register_pipeline(pipeline)
                
                # Run the pipeline
                job_params = {
                    "symbols": symbols,
                    "source": source,
                    "scheduled": True,
                    "job_id": job_id
                }
                
                pipeline_job_id = await pipeline_manager.start_pipeline(pipeline_name, job_params)
                
                # Log the update
                db = next(get_db())
                log = UpdateLog(
                    job_id=job_id,
                    pipeline_job_id=pipeline_job_id,
                    data_type="market_data",
                    source=source,
                    status="running",
                    symbols=symbols,
                    start_time=datetime.now()
                )
                db.add(log)
                db.commit()
                
                logger.info(f"Scheduled market data update started with pipeline job ID: {pipeline_job_id}")
                
                # Wait for pipeline to complete
                while True:
                    status = pipeline_manager.get_job_status(pipeline_job_id)
                    if status["status"] in ["completed", "failed"]:
                        # Update log
                        log = db.query(UpdateLog).filter(UpdateLog.pipeline_job_id == pipeline_job_id).first()
                        if log:
                            log.status = status["status"]
                            log.end_time = datetime.now()
                            log.result = status.get("result")
                            log.error = status.get("error")
                            db.commit()
                        
                        logger.info(f"Scheduled market data update completed with status: {status['status']}")
                        break
                    
                    await asyncio.sleep(5)
                
            except Exception as e:
                logger.error(f"Error in scheduled market data update: {e}", exc_info=True)
                
                # Log the error
                db = next(get_db())
                log = UpdateLog(
                    job_id=job_id,
                    data_type="market_data",
                    source=source,
                    status="failed",
                    symbols=symbols,
                    start_time=datetime.now(),
                    end_time=datetime.now(),
                    error=str(e)
                )
                db.add(log)
                db.commit()
        
        return update_market_data
    
    def _create_fundamental_data_job_func(self, job_id: str, source: str, symbols: List[str]):
        """Create a job function for fundamental data updates."""
        async def update_fundamental_data():
            try:
                logger.info(f"Running scheduled fundamental data update for {len(symbols)} symbols from {source}")
                
                # Create and run the fundamental data pipeline
                pipeline_name = f"{source}_fundamental_data_pipeline"
                
                # Check if pipeline exists, create if not
                if pipeline_name not in pipeline_manager.list_pipelines():
                    from .data_pipeline import create_fundamental_data_pipeline
                    pipeline = create_fundamental_data_pipeline(source, symbols)
                    pipeline_manager.register_pipeline(pipeline)
                
                # Run the pipeline
                job_params = {
                    "symbols": symbols,
                    "source": source,
                    "scheduled": True,
                    "job_id": job_id
                }
                
                pipeline_job_id = await pipeline_manager.start_pipeline(pipeline_name, job_params)
                
                # Log the update
                db = next(get_db())
                log = UpdateLog(
                    job_id=job_id,
                    pipeline_job_id=pipeline_job_id,
                    data_type="fundamental_data",
                    source=source,
                    status="running",
                    symbols=symbols,
                    start_time=datetime.now()
                )
                db.add(log)
                db.commit()
                
                logger.info(f"Scheduled fundamental data update started with pipeline job ID: {pipeline_job_id}")
                
                # Wait for pipeline to complete
                while True:
                    status = pipeline_manager.get_job_status(pipeline_job_id)
                    if status["status"] in ["completed", "failed"]:
                        # Update log
                        log = db.query(UpdateLog).filter(UpdateLog.pipeline_job_id == pipeline_job_id).first()
                        if log:
                            log.status = status["status"]
                            log.end_time = datetime.now()
                            log.result = status.get("result")
                            log.error = status.get("error")
                            db.commit()
                        
                        logger.info(f"Scheduled fundamental data update completed with status: {status['status']}")
                        break
                    
                    await asyncio.sleep(5)
                
            except Exception as e:
                logger.error(f"Error in scheduled fundamental data update: {e}", exc_info=True)
                
                # Log the error
                db = next(get_db())
                log = UpdateLog(
                    job_id=job_id,
                    data_type="fundamental_data",
                    source=source,
                    status="failed",
                    symbols=symbols,
                    start_time=datetime.now(),
                    end_time=datetime.now(),
                    error=str(e)
                )
                db.add(log)
                db.commit()
        
        return update_fundamental_data
    
    def _create_alternative_data_job_func(self, job_id: str, data_type: str, source: str, symbols: List[str]):
        """Create a job function for alternative data updates."""
        async def update_alternative_data():
            try:
                logger.info(f"Running scheduled alternative data update for {data_type} from {source}")
                
                # Create and run the alternative data pipeline
                pipeline_name = f"{data_type}_{source}_pipeline"
                
                # Check if pipeline exists, create if not
                if pipeline_name not in pipeline_manager.list_pipelines():
                    from .data_pipeline import create_alternative_data_pipeline
                    pipeline = create_alternative_data_pipeline(data_type, source, symbols)
                    pipeline_manager.register_pipeline(pipeline)
                
                # Run the pipeline
                job_params = {
                    "data_type": data_type,
                    "source": source,
                    "symbols": symbols,
                    "scheduled": True,
                    "job_id": job_id
                }
                
                pipeline_job_id = await pipeline_manager.start_pipeline(pipeline_name, job_params)
                
                # Log the update
                db = next(get_db())
                log = UpdateLog(
                    job_id=job_id,
                    pipeline_job_id=pipeline_job_id,
                    data_type=f"alternative_{data_type}",
                    source=source,
                    status="running",
                    symbols=symbols,
                    start_time=datetime.now()
                )
                db.add(log)
                db.commit()
                
                logger.info(f"Scheduled alternative data update started with pipeline job ID: {pipeline_job_id}")
                
                # Wait for pipeline to complete
                while True:
                    status = pipeline_manager.get_job_status(pipeline_job_id)
                    if status["status"] in ["completed", "failed"]:
                        # Update log
                        log = db.query(UpdateLog).filter(UpdateLog.pipeline_job_id == pipeline_job_id).first()
                        if log:
                            log.status = status["status"]
                            log.end_time = datetime.now()
                            log.result = status.get("result")
                            log.error = status.get("error")
                            db.commit()
                        
                        logger.info(f"Scheduled alternative data update completed with status: {status['status']}")
                        break
                    
                    await asyncio.sleep(5)
                
            except Exception as e:
                logger.error(f"Error in scheduled alternative data update: {e}", exc_info=True)
                
                # Log the error
                db = next(get_db())
                log = UpdateLog(
                    job_id=job_id,
                    data_type=f"alternative_{data_type}",
                    source=source,
                    status="failed",
                    symbols=symbols,
                    start_time=datetime.now(),
                    end_time=datetime.now(),
                    error=str(e)
                )
                db.add(log)
                db.commit()
        
        return update_alternative_data


# Create the global update manager instance
update_manager = ScheduledUpdateManager()

# Export functions for easier access
async def schedule_market_data_update(symbols: List[str], source: str = "default",
                                    schedule_type: str = "daily", **schedule_params) -> str:
    """Schedule regular updates for market data."""
    return await update_manager.schedule_market_data_update(symbols, source, schedule_type, **schedule_params)

async def schedule_fundamental_data_update(symbols: List[str], source: str = "default",
                                         schedule_type: str = "weekly", **schedule_params) -> str:
    """Schedule regular updates for fundamental data."""
    return await update_manager.schedule_fundamental_data_update(symbols, source, schedule_type, **schedule_params)

async def schedule_alternative_data_update(data_type: str, source: str = "default",
                                         symbols: List[str] = None,
                                         schedule_type: str = "daily", **schedule_params) -> str:
    """Schedule regular updates for alternative data."""
    return await update_manager.schedule_alternative_data_update(data_type, source, symbols, schedule_type, **schedule_params)

def pause_job(job_id: str) -> bool:
    """Pause a scheduled job."""
    return update_manager.pause_job(job_id)

def resume_job(job_id: str) -> bool:
    """Resume a paused job."""
    return update_manager.resume_job(job_id)

def remove_job(job_id: str) -> bool:
    """Remove a scheduled job."""
    return update_manager.remove_job(job_id)

def get_job_info(job_id: str) -> Dict[str, Any]:
    """Get information about a scheduled job."""
    return update_manager.get_job_info(job_id)

def list_jobs(data_type: str = None, source: str = None, status: str = None) -> List[Dict[str, Any]]:
    """List scheduled jobs with optional filters."""
    return update_manager.list_jobs(data_type, source, status)

def get_update_logs(job_id: str = None, data_type: str = None,
                   source: str = None, status: str = None,
                   limit: int = 100) -> List[Dict[str, Any]]:
    """Get logs of data updates with optional filters."""
    return update_manager.get_update_logs(job_id, data_type, source, status, limit)

def start_scheduler():
    """Start the scheduler."""
    update_manager.start()

def shutdown_scheduler():
    """Shutdown the scheduler."""
    update_manager.shutdown()

def load_jobs_from_database():
    """Load and schedule all active jobs from the database."""
    update_manager.load_jobs_from_database()