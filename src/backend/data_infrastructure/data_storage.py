"""
Data Storage Module

This module provides a unified interface for storing and retrieving different types of financial data,
supporting multiple storage backends including SQL databases, TimescaleDB for time series data,
and object storage for large datasets.
"""

import logging
import json
import pickle
from typing import Dict, List, Any, Optional, Union, Tuple
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..database import get_db, engine
from ..models import (
    MarketData, FundamentalData, AlternativeData, 
    DataSource, DataSchema, DataPartition
)
from ..config import settings

logger = logging.getLogger(__name__)

class DataStorageManager:
    """
    Manages storage and retrieval of different types of financial data.
    """
    
    def __init__(self):
        self.storage_backends = {}
        self._register_default_backends()
    
    def _register_default_backends(self):
        """Register the default storage backends."""
        # Register SQL backend for structured data
        self.register_backend("sql", SQLStorageBackend())
        
        # Register TimescaleDB backend for time series data
        self.register_backend("timescale", TimescaleDBBackend())
        
        # Register object storage backend for large datasets
        if settings.OBJECT_STORAGE_ENABLED:
            self.register_backend("object", ObjectStorageBackend())
    
    def register_backend(self, name: str, backend: 'StorageBackend') -> None:
        """Register a new storage backend."""
        self.storage_backends[name] = backend
        logger.info(f"Storage backend '{name}' registered.")
    
    def get_backend(self, name: str) -> 'StorageBackend':
        """Get a storage backend by name."""
        if name not in self.storage_backends:
            raise ValueError(f"Storage backend '{name}' not found.")
        return self.storage_backends[name]
    
    async def store_market_data(self, symbol: str, data: pd.DataFrame, 
                               source: str = "default") -> str:
        """
        Store market data for a symbol.
        
        Args:
            symbol: The ticker symbol
            data: DataFrame containing market data
            source: The data source name
            
        Returns:
            The storage ID
        """
        # Use TimescaleDB backend for time series market data
        backend = self.get_backend("timescale")
        
        # Prepare metadata
        metadata = {
            "symbol": symbol,
            "source": source,
            "data_type": "market_data",
            "start_date": data.index.min().strftime("%Y-%m-%d") if isinstance(data.index, pd.DatetimeIndex) else None,
            "end_date": data.index.max().strftime("%Y-%m-%d") if isinstance(data.index, pd.DatetimeIndex) else None,
            "columns": list(data.columns),
            "rows": len(data)
        }
        
        # Store the data
        storage_id = await backend.store(data, metadata)
        
        # Record in the database
        db = next(get_db())
        market_data = MarketData(
            symbol=symbol,
            source=source,
            storage_id=storage_id,
            storage_backend="timescale",
            start_date=metadata["start_date"],
            end_date=metadata["end_date"],
            columns=metadata["columns"],
            row_count=metadata["rows"],
            created_at=datetime.now()
        )
        db.add(market_data)
        db.commit()
        
        logger.info(f"Market data for {symbol} stored with ID: {storage_id}")
        return storage_id
    
    async def retrieve_market_data(self, symbol: str, start_date: Optional[str] = None,
                                  end_date: Optional[str] = None, 
                                  source: str = "default") -> pd.DataFrame:
        """
        Retrieve market data for a symbol.
        
        Args:
            symbol: The ticker symbol
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            source: The data source name
            
        Returns:
            DataFrame containing market data
        """
        # Find the storage record
        db = next(get_db())
        query = db.query(MarketData).filter(
            MarketData.symbol == symbol,
            MarketData.source == source
        )
        
        if start_date:
            query = query.filter(MarketData.end_date >= start_date)
        
        if end_date:
            query = query.filter(MarketData.start_date <= end_date)
        
        # Get the most recent record
        record = query.order_by(MarketData.created_at.desc()).first()
        
        if not record:
            logger.warning(f"No market data found for {symbol} from {source}")
            return pd.DataFrame()
        
        # Get the backend
        backend = self.get_backend(record.storage_backend)
        
        # Retrieve the data
        data = await backend.retrieve(record.storage_id)
        
        # Apply date filtering if needed
        if isinstance(data.index, pd.DatetimeIndex):
            if start_date:
                data = data[data.index >= pd.Timestamp(start_date)]
            if end_date:
                data = data[data.index <= pd.Timestamp(end_date)]
        
        return data
    
    async def store_fundamental_data(self, symbol: str, data: Dict[str, Any], 
                                    source: str = "default") -> str:
        """
        Store fundamental data for a symbol.
        
        Args:
            symbol: The ticker symbol
            data: Dictionary containing fundamental data
            source: The data source name
            
        Returns:
            The storage ID
        """
        # Use SQL backend for structured fundamental data
        backend = self.get_backend("sql")
        
        # Prepare metadata
        metadata = {
            "symbol": symbol,
            "source": source,
            "data_type": "fundamental_data",
            "statements": list(data.keys()),
            "period": data.get("period", "annual"),
            "latest_date": data.get("latest_date", datetime.now().strftime("%Y-%m-%d"))
        }
        
        # Store the data
        storage_id = await backend.store(data, metadata)
        
        # Record in the database
        db = next(get_db())
        fundamental_data = FundamentalData(
            symbol=symbol,
            source=source,
            storage_id=storage_id,
            storage_backend="sql",
            data_type="fundamental_data",
            statements=metadata["statements"],
            period=metadata["period"],
            latest_date=metadata["latest_date"],
            created_at=datetime.now()
        )
        db.add(fundamental_data)
        db.commit()
        
        logger.info(f"Fundamental data for {symbol} stored with ID: {storage_id}")
        return storage_id
    
    async def retrieve_fundamental_data(self, symbol: str, 
                                       statement_type: Optional[str] = None,
                                       source: str = "default") -> Dict[str, Any]:
        """
        Retrieve fundamental data for a symbol.
        
        Args:
            symbol: The ticker symbol
            statement_type: Optional specific statement type to retrieve
            source: The data source name
            
        Returns:
            Dictionary containing fundamental data
        """
        # Find the storage record
        db = next(get_db())
        record = db.query(FundamentalData).filter(
            FundamentalData.symbol == symbol,
            FundamentalData.source == source
        ).order_by(FundamentalData.created_at.desc()).first()
        
        if not record:
            logger.warning(f"No fundamental data found for {symbol} from {source}")
            return {}
        
        # Get the backend
        backend = self.get_backend(record.storage_backend)
        
        # Retrieve the data
        data = await backend.retrieve(record.storage_id)
        
        # Filter by statement type if specified
        if statement_type and statement_type in data:
            return {statement_type: data[statement_type]}
        
        return data
    
    async def store_alternative_data(self, data: Any, data_type: str,
                                    metadata: Dict[str, Any] = None,
                                    source: str = "default") -> str:
        """
        Store alternative data.
        
        Args:
            data: The alternative data to store
            data_type: Type of alternative data
            metadata: Additional metadata
            source: The data source name
            
        Returns:
            The storage ID
        """
        # Choose backend based on data type and size
        if isinstance(data, pd.DataFrame) and len(data) > 10000:
            # Use TimescaleDB for large time series data
            backend_name = "timescale"
        elif isinstance(data, (dict, list)) and len(str(data)) > 1000000:
            # Use object storage for large objects
            backend_name = "object" if "object" in self.storage_backends else "sql"
        else:
            # Use SQL for smaller structured data
            backend_name = "sql"
        
        backend = self.get_backend(backend_name)
        
        # Prepare metadata
        meta = metadata or {}
        meta.update({
            "data_type": data_type,
            "source": source,
            "created_at": datetime.now().isoformat()
        })
        
        # Store the data
        storage_id = await backend.store(data, meta)
        
        # Record in the database
        db = next(get_db())
        alt_data = AlternativeData(
            data_type=data_type,
            source=source,
            storage_id=storage_id,
            storage_backend=backend_name,
            metadata=meta,
            created_at=datetime.now()
        )
        db.add(alt_data)
        db.commit()
        
        logger.info(f"Alternative data ({data_type}) stored with ID: {storage_id}")
        return storage_id
    
    async def retrieve_alternative_data(self, data_type: str, 
                                       filters: Dict[str, Any] = None,
                                       source: str = "default") -> Any:
        """
        Retrieve alternative data.
        
        Args:
            data_type: Type of alternative data
            filters: Optional filters to apply
            source: The data source name
            
        Returns:
            The alternative data
        """
        # Find the storage record
        db = next(get_db())
        query = db.query(AlternativeData).filter(
            AlternativeData.data_type == data_type,
            AlternativeData.source == source
        )
        
        # Apply additional filters if provided
        if filters:
            for key, value in filters.items():
                filter_expr = f"metadata->>'$.{key}' = :value"
                query = query.filter(text(filter_expr).bindparams(value=value))
        
        # Get the most recent record
        record = query.order_by(AlternativeData.created_at.desc()).first()
        
        if not record:
            logger.warning(f"No alternative data found for type {data_type} from {source}")
            return None
        
        # Get the backend
        backend = self.get_backend(record.storage_backend)
        
        # Retrieve the data
        data = await backend.retrieve(record.storage_id)
        return data
    
    async def list_available_data(self, data_type: str = None, 
                                 symbol: str = None,
                                 source: str = None) -> List[Dict[str, Any]]:
        """
        List available data based on filters.
        
        Args:
            data_type: Optional data type filter
            symbol: Optional symbol filter
            source: Optional source filter
            
        Returns:
            List of available data records
        """
        db = next(get_db())
        results = []
        
        # Query market data
        market_query = db.query(MarketData)
        if symbol:
            market_query = market_query.filter(MarketData.symbol == symbol)
        if source:
            market_query = market_query.filter(MarketData.source == source)
        if data_type and data_type != "market_data":
            market_query = market_query.filter(False)  # No results if data_type doesn't match
            
        market_records = market_query.all()
        for record in market_records:
            results.append({
                "id": record.id,
                "data_type": "market_data",
                "symbol": record.symbol,
                "source": record.source,
                "start_date": record.start_date,
                "end_date": record.end_date,
                "created_at": record.created_at.isoformat()
            })
        
        # Query fundamental data
        fundamental_query = db.query(FundamentalData)
        if symbol:
            fundamental_query = fundamental_query.filter(FundamentalData.symbol == symbol)
        if source:
            fundamental_query = fundamental_query.filter(FundamentalData.source == source)
        if data_type and data_type != "fundamental_data":
            fundamental_query = fundamental_query.filter(False)  # No results if data_type doesn't match
            
        fundamental_records = fundamental_query.all()
        for record in fundamental_records:
            results.append({
                "id": record.id,
                "data_type": "fundamental_data",
                "symbol": record.symbol,
                "source": record.source,
                "statements": record.statements,
                "period": record.period,
                "latest_date": record.latest_date,
                "created_at": record.created_at.isoformat()
            })
        
        # Query alternative data
        alt_query = db.query(AlternativeData)
        if source:
            alt_query = alt_query.filter(AlternativeData.source == source)
        if data_type and data_type != "alternative_data":
            if data_type.startswith("alternative_"):
                specific_type = data_type.replace("alternative_", "")
                alt_query = alt_query.filter(AlternativeData.data_type == specific_type)
            else:
                alt_query = alt_query.filter(False)  # No results if data_type doesn't match
                
        alt_records = alt_query.all()
        for record in alt_records:
            result = {
                "id": record.id,
                "data_type": f"alternative_{record.data_type}",
                "source": record.source,
                "created_at": record.created_at.isoformat()
            }
            
            # Add metadata fields
            if record.metadata:
                for key, value in record.metadata.items():
                    if key not in result:
                        result[key] = value
            
            results.append(result)
        
        return results


class StorageBackend:
    """Base class for storage backends."""
    
    async def store(self, data: Any, metadata: Dict[str, Any]) -> str:
        """Store data with metadata and return a storage ID."""
        raise NotImplementedError("Subclasses must implement store()")
    
    async def retrieve(self, storage_id: str) -> Any:
        """Retrieve data by storage ID."""
        raise NotImplementedError("Subclasses must implement retrieve()")
    
    async def delete(self, storage_id: str) -> bool:
        """Delete data by storage ID."""
        raise NotImplementedError("Subclasses must implement delete()")


class SQLStorageBackend(StorageBackend):
    """Storage backend using SQL database."""
    
    async def store(self, data: Any, metadata: Dict[str, Any]) -> str:
        """Store data in SQL database."""
        db = next(get_db())
        
        # Generate a storage ID
        storage_id = f"sql_{metadata.get('data_type', 'data')}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{id(data)}"
        
        # Serialize the data
        if isinstance(data, pd.DataFrame):
            serialized_data = data.to_json(orient="split", date_format="iso")
        else:
            serialized_data = json.dumps(data)
        
        # Create schema record if needed
        schema_name = metadata.get("data_type", "default")
        schema = db.query(DataSchema).filter(DataSchema.name == schema_name).first()
        if not schema:
            schema = DataSchema(
                name=schema_name,
                description=f"Schema for {schema_name} data",
                fields=list(data.keys()) if isinstance(data, dict) else [],
                created_at=datetime.now()
            )
            db.add(schema)
            db.commit()
        
        # Create data partition
        partition = DataPartition(
            storage_id=storage_id,
            schema_id=schema.id,
            data=serialized_data,
            metadata=metadata,
            created_at=datetime.now()
        )
        db.add(partition)
        db.commit()
        
        return storage_id
    
    async def retrieve(self, storage_id: str) -> Any:
        """Retrieve data from SQL database."""
        db = next(get_db())
        
        # Find the partition
        partition = db.query(DataPartition).filter(
            DataPartition.storage_id == storage_id
        ).first()
        
        if not partition:
            raise ValueError(f"Data partition with ID {storage_id} not found")
        
        # Deserialize the data
        try:
            if "index" in partition.data and "columns" in partition.data:
                # Looks like a pandas DataFrame in split format
                return pd.read_json(partition.data, orient="split")
            else:
                # Regular JSON data
                return json.loads(partition.data)
        except Exception as e:
            logger.error(f"Error deserializing data: {e}")
            return partition.data
    
    async def delete(self, storage_id: str) -> bool:
        """Delete data from SQL database."""
        db = next(get_db())
        
        # Find and delete the partition
        partition = db.query(DataPartition).filter(
            DataPartition.storage_id == storage_id
        ).first()
        
        if not partition:
            logger.warning(f"Data partition with ID {storage_id} not found")
            return False
        
        db.delete(partition)
        db.commit()
        return True


class TimescaleDBBackend(StorageBackend):
    """Storage backend using TimescaleDB for time series data."""
    
    async def store(self, data: pd.DataFrame, metadata: Dict[str, Any]) -> str:
        """Store time series data in TimescaleDB."""
        # Generate a storage ID
        storage_id = f"ts_{metadata.get('symbol', 'data')}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Ensure data has a datetime index
        if not isinstance(data.index, pd.DatetimeIndex):
            if 'date' in data.columns:
                data = data.set_index('date')
            elif 'timestamp' in data.columns:
                data = data.set_index('timestamp')
            else:
                raise ValueError("DataFrame must have a datetime index or a date/timestamp column")
        
        # Prepare data for TimescaleDB
        df = data.reset_index()
        df.rename(columns={df.columns[0]: 'time'}, inplace=True)
        
        # Add metadata columns
        symbol = metadata.get('symbol', 'unknown')
        source = metadata.get('source', 'default')
        df['symbol'] = symbol
        df['source'] = source
        df['storage_id'] = storage_id
        
        # Create hypertable if it doesn't exist
        with engine.connect() as connection:
            # Check if hypertable exists
            result = connection.execute(text("""
                SELECT * FROM pg_tables WHERE tablename = 'market_timeseries'
            """))
            
            if not result.fetchone():
                # Create the table
                connection.execute(text("""
                    CREATE TABLE market_timeseries (
                        time TIMESTAMPTZ NOT NULL,
                        symbol TEXT NOT NULL,
                        source TEXT NOT NULL,
                        storage_id TEXT NOT NULL,
                        open DOUBLE PRECISION NULL,
                        high DOUBLE PRECISION NULL,
                        low DOUBLE PRECISION NULL,
                        close DOUBLE PRECISION NULL,
                        volume DOUBLE PRECISION NULL,
                        adjusted_close DOUBLE PRECISION NULL
                    )
                """))
                
                # Create hypertable
                connection.execute(text("""
                    SELECT create_hypertable('market_timeseries', 'time')
                """))
                
                # Create indexes
                connection.execute(text("""
                    CREATE INDEX idx_market_ts_symbol ON market_timeseries (symbol, time DESC)
                """))
                connection.execute(text("""
                    CREATE INDEX idx_market_ts_storage_id ON market_timeseries (storage_id)
                """))
        
        # Insert data into TimescaleDB
        columns = ['time', 'symbol', 'source', 'storage_id']
        for col in ['open', 'high', 'low', 'close', 'volume', 'adjusted_close']:
            if col in df.columns:
                columns.append(col)
        
        df_to_insert = df[columns]
        df_to_insert.to_sql('market_timeseries', engine, if_exists='append', index=False)
        
        # Record metadata
        db = next(get_db())
        schema = db.query(DataSchema).filter(DataSchema.name == 'market_timeseries').first()
        if not schema:
            schema = DataSchema(
                name='market_timeseries',
                description='Time series market data schema',
                fields=columns,
                created_at=datetime.now()
            )
            db.add(schema)
            db.commit()
        
        # Create data source record if needed
        data_source = db.query(DataSource).filter(
            DataSource.name == source,
            DataSource.type == 'market_data'
        ).first()
        
        if not data_source:
            data_source = DataSource(
                name=source,
                type='market_data',
                description=f"Market data source: {source}",
                config={},
                created_at=datetime.now()
            )
            db.add(data_source)
            db.commit()
        
        return storage_id
    
    async def retrieve(self, storage_id: str) -> pd.DataFrame:
        """Retrieve time series data from TimescaleDB."""
        query = f"""
            SELECT * FROM market_timeseries 
            WHERE storage_id = '{storage_id}'
            ORDER BY time ASC
        """
        
        df = pd.read_sql(query, engine)
        
        # Drop metadata columns and set index
        if not df.empty:
            df = df.drop(columns=['symbol', 'source', 'storage_id'])
            df = df.set_index('time')
        
        return df
    
    async def delete(self, storage_id: str) -> bool:
        """Delete time series data from TimescaleDB."""
        with engine.connect() as connection:
            result = connection.execute(text(f"""
                DELETE FROM market_timeseries WHERE storage_id = '{storage_id}'
            """))
            
            return result.rowcount > 0


class ObjectStorageBackend(StorageBackend):
    """Storage backend using object storage for large datasets."""
    
    def __init__(self):
        import boto3
        from botocore.client import Config
        
        # Initialize S3 client
        self.s3 = boto3.client(
            's3',
            endpoint_url=settings.OBJECT_STORAGE_ENDPOINT,
            aws_access_key_id=settings.OBJECT_STORAGE_ACCESS_KEY,
            aws_secret_access_key=settings.OBJECT_STORAGE_SECRET_KEY,
            config=Config(signature_version='s3v4'),
            region_name=settings.OBJECT_STORAGE_REGION
        )
        
        self.bucket = settings.OBJECT_STORAGE_BUCKET
        
        # Create bucket if it doesn't exist
        try:
            self.s3.head_bucket(Bucket=self.bucket)
        except:
            self.s3.create_bucket(Bucket=self.bucket)
    
    async def store(self, data: Any, metadata: Dict[str, Any]) -> str:
        """Store data in object storage."""
        # Generate a storage ID
        storage_id = f"obj_{metadata.get('data_type', 'data')}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Serialize the data
        if isinstance(data, pd.DataFrame):
            # Use parquet for DataFrames
            buffer = io.BytesIO()
            data.to_parquet(buffer)
            buffer.seek(0)
            content_type = 'application/octet-stream'
            extension = '.parquet'
        else:
            # Use pickle for other objects
            buffer = io.BytesIO()
            pickle.dump(data, buffer)
            buffer.seek(0)
            content_type = 'application/octet-stream'
            extension = '.pkl'
        
        # Upload to S3
        object_key = f"{storage_id}{extension}"
        self.s3.upload_fileobj(
            buffer,
            self.bucket,
            object_key,
            ExtraArgs={'ContentType': content_type}
        )
        
        # Store metadata
        metadata_key = f"{storage_id}_metadata.json"
        self.s3.put_object(
            Bucket=self.bucket,
            Key=metadata_key,
            Body=json.dumps(metadata),
            ContentType='application/json'
        )
        
        # Record in database
        db = next(get_db())
        schema_name = metadata.get("data_type", "default")
        schema = db.query(DataSchema).filter(DataSchema.name == schema_name).first()
        if not schema:
            schema = DataSchema(
                name=schema_name,
                description=f"Schema for {schema_name} data",
                fields=[],
                created_at=datetime.now()
            )
            db.add(schema)
            db.commit()
        
        # Create data partition record
        partition = DataPartition(
            storage_id=storage_id,
            schema_id=schema.id,
            data=None,  # Data is in object storage
            metadata={
                **metadata,
                "object_key": object_key,
                "metadata_key": metadata_key,
                "storage_type": "object",
                "extension": extension
            },
            created_at=datetime.now()
        )
        db.add(partition)
        db.commit()
        
        return storage_id
    
    async def retrieve(self, storage_id: str) -> Any:
        """Retrieve data from object storage."""
        db = next(get_db())
        
        # Find the partition
        partition = db.query(DataPartition).filter(
            DataPartition.storage_id == storage_id
        ).first()
        
        if not partition:
            raise ValueError(f"Data partition with ID {storage_id} not found")
        
        # Get object key from metadata
        object_key = partition.metadata.get("object_key")
        extension = partition.metadata.get("extension")
        
        if not object_key:
            raise ValueError(f"Object key not found in metadata for {storage_id}")
        
        # Download from S3
        buffer = io.BytesIO()
        self.s3.download_fileobj(self.bucket, object_key, buffer)
        buffer.seek(0)
        
        # Deserialize based on extension
        if extension == '.parquet':
            return pd.read_parquet(buffer)
        elif extension == '.pkl':
            return pickle.load(buffer)
        else:
            raise ValueError(f"Unsupported file extension: {extension}")
    
    async def delete(self, storage_id: str) -> bool:
        """Delete data from object storage."""
        db = next(get_db())
        
        # Find the partition
        partition = db.query(DataPartition).filter(
            DataPartition.storage_id == storage_id
        ).first()
        
        if not partition:
            logger.warning(f"Data partition with ID {storage_id} not found")
            return False
        
        # Get object keys from metadata
        object_key = partition.metadata.get("object_key")
        metadata_key = partition.metadata.get("metadata_key")
        
        # Delete from S3
        if object_key:
            self.s3.delete_object(Bucket=self.bucket, Key=object_key)
        
        if metadata_key:
            self.s3.delete_object(Bucket=self.bucket, Key=metadata_key)
        
        # Delete from database
        db.delete(partition)
        db.commit()
        
        return True


# Create the global storage manager instance
storage_manager = DataStorageManager()

# Export functions for easier access
async def store_market_data(symbol: str, data: pd.DataFrame, source: str = "default") -> str:
    """Store market data for a symbol."""
    return await storage_manager.store_market_data(symbol, data, source)

async def retrieve_market_data(symbol: str, start_date: Optional[str] = None,
                              end_date: Optional[str] = None, 
                              source: str = "default") -> pd.DataFrame:
    """Retrieve market data for a symbol."""
    return await storage_manager.retrieve_market_data(symbol, start_date, end_date, source)

async def store_fundamental_data(symbol: str, data: Dict[str, Any], 
                                source: str = "default") -> str:
    """Store fundamental data for a symbol."""
    return await storage_manager.store_fundamental_data(symbol, data, source)

async def retrieve_fundamental_data(symbol: str, 
                                   statement_type: Optional[str] = None,
                                   source: str = "default") -> Dict[str, Any]:
    """Retrieve fundamental data for a symbol."""
    return await storage_manager.retrieve_fundamental_data(symbol, statement_type, source)

async def store_alternative_data(data: Any, data_type: str,
                                metadata: Dict[str, Any] = None,
                                source: str = "default") -> str:
    """Store alternative data."""
    return await storage_manager.store_alternative_data(data, data_type, metadata, source)

async def retrieve_alternative_data(data_type: str, 
                                   filters: Dict[str, Any] = None,
                                   source: str = "default") -> Any:
    """Retrieve alternative data."""
    return await storage_manager.retrieve_alternative_data(data_type, filters, source)

async def list_available_data(data_type: str = None, 
                             symbol: str = None,
                             source: str = None) -> List[Dict[str, Any]]:
    """List available data based on filters."""
    return await storage_manager.list_available_data(data_type, symbol, source)