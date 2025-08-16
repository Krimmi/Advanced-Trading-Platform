"""
Data Infrastructure API Module

This module provides API endpoints for managing data pipelines, storage, and scheduled updates.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime

from ..database import get_db
from ..models.data_models import (
    DataSource, DataSchema, DataPartition, DataPipeline, DataJob,
    MarketData, FundamentalData, AlternativeData, ScheduledJob, UpdateLog
)
from ..data_infrastructure.data_pipeline import pipeline_manager
from ..data_infrastructure.data_storage import storage_manager
from ..data_infrastructure.scheduled_updates import update_manager
from ..schemas.data_schemas import (
    DataSourceCreate, DataSourceUpdate, DataSourceResponse,
    DataPipelineCreate, DataPipelineUpdate, DataPipelineResponse,
    ScheduledJobCreate, ScheduledJobUpdate, ScheduledJobResponse,
    DataJobResponse, UpdateLogResponse,
    MarketDataRequest, FundamentalDataRequest, AlternativeDataRequest
)

router = APIRouter(
    prefix="/api/data",
    tags=["data-infrastructure"],
    responses={404: {"description": "Not found"}},
)

# Data Sources API

@router.post("/sources", response_model=DataSourceResponse)
async def create_data_source(source: DataSourceCreate, db: Session = Depends(get_db)):
    """Create a new data source."""
    # Check if source with same name and type already exists
    existing = db.query(DataSource).filter(
        DataSource.name == source.name,
        DataSource.type == source.type
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Data source with this name and type already exists")
    
    # Create new data source
    db_source = DataSource(
        name=source.name,
        type=source.type,
        description=source.description,
        config=source.config,
        credentials=source.credentials,
        rate_limit=source.rate_limit,
        enabled=source.enabled
    )
    
    db.add(db_source)
    db.commit()
    db.refresh(db_source)
    
    return db_source

@router.get("/sources", response_model=List[DataSourceResponse])
async def get_data_sources(
    type: Optional[str] = None,
    enabled: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all data sources with optional filters."""
    query = db.query(DataSource)
    
    if type:
        query = query.filter(DataSource.type == type)
    
    if enabled is not None:
        query = query.filter(DataSource.enabled == enabled)
    
    return query.offset(skip).limit(limit).all()

@router.get("/sources/{source_id}", response_model=DataSourceResponse)
async def get_data_source(source_id: int, db: Session = Depends(get_db)):
    """Get a specific data source by ID."""
    source = db.query(DataSource).filter(DataSource.id == source_id).first()
    
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    return source

@router.put("/sources/{source_id}", response_model=DataSourceResponse)
async def update_data_source(source_id: int, source_update: DataSourceUpdate, db: Session = Depends(get_db)):
    """Update a data source."""
    db_source = db.query(DataSource).filter(DataSource.id == source_id).first()
    
    if not db_source:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    # Update fields
    for field, value in source_update.dict(exclude_unset=True).items():
        setattr(db_source, field, value)
    
    db_source.last_updated = datetime.now()
    db.commit()
    db.refresh(db_source)
    
    return db_source

@router.delete("/sources/{source_id}")
async def delete_data_source(source_id: int, db: Session = Depends(get_db)):
    """Delete a data source."""
    db_source = db.query(DataSource).filter(DataSource.id == source_id).first()
    
    if not db_source:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    db.delete(db_source)
    db.commit()
    
    return {"message": "Data source deleted successfully"}

# Data Pipelines API

@router.post("/pipelines", response_model=DataPipelineResponse)
async def create_data_pipeline(pipeline: DataPipelineCreate, db: Session = Depends(get_db)):
    """Create a new data pipeline."""
    # Check if pipeline with same name already exists
    existing = db.query(DataPipeline).filter(DataPipeline.name == pipeline.name).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Data pipeline with this name already exists")
    
    # Check if source exists
    if pipeline.source_id:
        source = db.query(DataSource).filter(DataSource.id == pipeline.source_id).first()
        if not source:
            raise HTTPException(status_code=404, detail="Data source not found")
    
    # Create new data pipeline
    db_pipeline = DataPipeline(
        name=pipeline.name,
        description=pipeline.description,
        source_id=pipeline.source_id,
        steps=pipeline.steps,
        schedule=pipeline.schedule,
        schedule_params=pipeline.schedule_params,
        enabled=pipeline.enabled
    )
    
    db.add(db_pipeline)
    db.commit()
    db.refresh(db_pipeline)
    
    return db_pipeline

@router.get("/pipelines", response_model=List[DataPipelineResponse])
async def get_data_pipelines(
    source_id: Optional[int] = None,
    enabled: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all data pipelines with optional filters."""
    query = db.query(DataPipeline)
    
    if source_id:
        query = query.filter(DataPipeline.source_id == source_id)
    
    if enabled is not None:
        query = query.filter(DataPipeline.enabled == enabled)
    
    return query.offset(skip).limit(limit).all()

@router.get("/pipelines/{pipeline_id}", response_model=DataPipelineResponse)
async def get_data_pipeline(pipeline_id: int, db: Session = Depends(get_db)):
    """Get a specific data pipeline by ID."""
    pipeline = db.query(DataPipeline).filter(DataPipeline.id == pipeline_id).first()
    
    if not pipeline:
        raise HTTPException(status_code=404, detail="Data pipeline not found")
    
    return pipeline

@router.put("/pipelines/{pipeline_id}", response_model=DataPipelineResponse)
async def update_data_pipeline(pipeline_id: int, pipeline_update: DataPipelineUpdate, db: Session = Depends(get_db)):
    """Update a data pipeline."""
    db_pipeline = db.query(DataPipeline).filter(DataPipeline.id == pipeline_id).first()
    
    if not db_pipeline:
        raise HTTPException(status_code=404, detail="Data pipeline not found")
    
    # Update fields
    for field, value in pipeline_update.dict(exclude_unset=True).items():
        setattr(db_pipeline, field, value)
    
    db_pipeline.last_updated = datetime.now()
    db.commit()
    db.refresh(db_pipeline)
    
    return db_pipeline

@router.delete("/pipelines/{pipeline_id}")
async def delete_data_pipeline(pipeline_id: int, db: Session = Depends(get_db)):
    """Delete a data pipeline."""
    db_pipeline = db.query(DataPipeline).filter(DataPipeline.id == pipeline_id).first()
    
    if not db_pipeline:
        raise HTTPException(status_code=404, detail="Data pipeline not found")
    
    db.delete(db_pipeline)
    db.commit()
    
    return {"message": "Data pipeline deleted successfully"}

@router.post("/pipelines/{pipeline_name}/run")
async def run_data_pipeline(pipeline_name: str, params: Dict[str, Any] = None):
    """Run a data pipeline."""
    try:
        # Check if pipeline exists
        if pipeline_name not in pipeline_manager.list_pipelines():
            raise HTTPException(status_code=404, detail="Data pipeline not found")
        
        # Run the pipeline
        job_id = await pipeline_manager.start_pipeline(pipeline_name, params or {})
        
        return {
            "message": "Pipeline started successfully",
            "job_id": job_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/jobs", response_model=List[DataJobResponse])
async def get_data_jobs(
    pipeline_name: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all data jobs with optional filters."""
    query = db.query(DataJob)
    
    if pipeline_name:
        query = query.filter(DataJob.pipeline_name == pipeline_name)
    
    if status:
        query = query.filter(DataJob.status == status)
    
    return query.order_by(DataJob.start_time.desc()).offset(skip).limit(limit).all()

@router.get("/jobs/{job_id}", response_model=DataJobResponse)
async def get_data_job(job_id: str):
    """Get a specific data job by ID."""
    try:
        job_status = pipeline_manager.get_job_status(job_id)
        return job_status
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/jobs/{job_id}")
async def cancel_data_job(job_id: str):
    """Cancel a running data job."""
    try:
        success = pipeline_manager.cancel_job(job_id)
        if success:
            return {"message": "Job cancelled successfully"}
        else:
            return {"message": "Job not found or already completed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Scheduled Updates API

@router.post("/scheduled-jobs", response_model=ScheduledJobResponse)
async def create_scheduled_job(job: ScheduledJobCreate):
    """Create a new scheduled job."""
    try:
        if job.data_type == "market_data":
            job_id = await update_manager.schedule_market_data_update(
                job.symbols,
                job.source,
                job.schedule_type,
                **job.schedule_params
            )
        elif job.data_type == "fundamental_data":
            job_id = await update_manager.schedule_fundamental_data_update(
                job.symbols,
                job.source,
                job.schedule_type,
                **job.schedule_params
            )
        elif job.data_type.startswith("alternative_"):
            alt_type = job.data_type.replace("alternative_", "")
            job_id = await update_manager.schedule_alternative_data_update(
                alt_type,
                job.source,
                job.symbols,
                job.schedule_type,
                **job.schedule_params
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported data type: {job.data_type}")
        
        # Get the created job
        job_info = update_manager.get_job_info(job_id)
        
        return job_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scheduled-jobs", response_model=List[ScheduledJobResponse])
async def get_scheduled_jobs(
    data_type: Optional[str] = None,
    source: Optional[str] = None,
    status: Optional[str] = None
):
    """Get all scheduled jobs with optional filters."""
    try:
        jobs = update_manager.list_jobs(data_type, source, status)
        return jobs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scheduled-jobs/{job_id}", response_model=ScheduledJobResponse)
async def get_scheduled_job(job_id: str):
    """Get a specific scheduled job by ID."""
    try:
        job_info = update_manager.get_job_info(job_id)
        return job_info
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/scheduled-jobs/{job_id}/pause")
async def pause_scheduled_job(job_id: str):
    """Pause a scheduled job."""
    try:
        success = update_manager.pause_job(job_id)
        if success:
            return {"message": "Job paused successfully"}
        else:
            return {"message": "Failed to pause job"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/scheduled-jobs/{job_id}/resume")
async def resume_scheduled_job(job_id: str):
    """Resume a paused job."""
    try:
        success = update_manager.resume_job(job_id)
        if success:
            return {"message": "Job resumed successfully"}
        else:
            return {"message": "Failed to resume job"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/scheduled-jobs/{job_id}")
async def delete_scheduled_job(job_id: str):
    """Delete a scheduled job."""
    try:
        success = update_manager.remove_job(job_id)
        if success:
            return {"message": "Job removed successfully"}
        else:
            return {"message": "Failed to remove job"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/update-logs", response_model=List[UpdateLogResponse])
async def get_update_logs(
    job_id: Optional[str] = None,
    data_type: Optional[str] = None,
    source: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100
):
    """Get logs of data updates with optional filters."""
    try:
        logs = update_manager.get_update_logs(job_id, data_type, source, status, limit)
        return logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Data Storage API

@router.post("/market-data")
async def store_market_data(request: MarketDataRequest):
    """Store market data."""
    try:
        # Convert data to DataFrame
        import pandas as pd
        df = pd.DataFrame(request.data)
        
        # Store the data
        storage_id = await storage_manager.store_market_data(
            request.symbol,
            df,
            request.source
        )
        
        return {
            "message": "Market data stored successfully",
            "storage_id": storage_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/market-data/{symbol}")
async def get_market_data(
    symbol: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    source: str = "default"
):
    """Get market data for a symbol."""
    try:
        # Retrieve the data
        df = await storage_manager.retrieve_market_data(
            symbol,
            start_date,
            end_date,
            source
        )
        
        # Convert to dict for JSON response
        if df.empty:
            return {"data": []}
        
        # Reset index to include date column
        if isinstance(df.index, pd.DatetimeIndex):
            df = df.reset_index()
            df['date'] = df['index'].dt.strftime('%Y-%m-%d')
            df = df.drop(columns=['index'])
        
        return {"data": df.to_dict(orient="records")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/fundamental-data")
async def store_fundamental_data(request: FundamentalDataRequest):
    """Store fundamental data."""
    try:
        # Store the data
        storage_id = await storage_manager.store_fundamental_data(
            request.symbol,
            request.data,
            request.source
        )
        
        return {
            "message": "Fundamental data stored successfully",
            "storage_id": storage_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/fundamental-data/{symbol}")
async def get_fundamental_data(
    symbol: str,
    statement_type: Optional[str] = None,
    source: str = "default"
):
    """Get fundamental data for a symbol."""
    try:
        # Retrieve the data
        data = await storage_manager.retrieve_fundamental_data(
            symbol,
            statement_type,
            source
        )
        
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/alternative-data")
async def store_alternative_data(request: AlternativeDataRequest):
    """Store alternative data."""
    try:
        # Store the data
        storage_id = await storage_manager.store_alternative_data(
            request.data,
            request.data_type,
            request.metadata,
            request.source
        )
        
        return {
            "message": "Alternative data stored successfully",
            "storage_id": storage_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alternative-data/{data_type}")
async def get_alternative_data(
    data_type: str,
    source: str = "default",
    filters: Dict[str, Any] = None
):
    """Get alternative data."""
    try:
        # Retrieve the data
        data = await storage_manager.retrieve_alternative_data(
            data_type,
            filters,
            source
        )
        
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/available-data")
async def list_available_data(
    data_type: Optional[str] = None,
    symbol: Optional[str] = None,
    source: Optional[str] = None
):
    """List available data based on filters."""
    try:
        data_list = await storage_manager.list_available_data(
            data_type,
            symbol,
            source
        )
        
        return {"data": data_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))