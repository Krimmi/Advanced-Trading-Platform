# Database replication module for cross-region replication

variable "app_name" {
  description = "Application name"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "primary_region" {
  description = "Primary region for database"
  type        = string
}

variable "replica_regions" {
  description = "Regions for read replicas"
  type        = list(string)
}

locals {
  name_prefix = "${var.app_name}-${var.environment}"
  tags = {
    Environment = var.environment
    Application = var.app_name
    ManagedBy   = "terraform"
  }
}

# DMS Replication Instance in primary region
resource "aws_dms_replication_instance" "primary" {
  provider = aws.primary_region
  
  replication_instance_id      = "${local.name_prefix}-dms-primary"
  replication_instance_class   = "dms.r5.large"
  allocated_storage            = 100
  multi_az                     = true
  publicly_accessible          = false
  auto_minor_version_upgrade   = true
  vpc_security_group_ids       = [aws_security_group.dms.id]
  replication_subnet_group_id  = aws_dms_replication_subnet_group.primary.id
  
  tags = merge(local.tags, {
    Name = "${local.name_prefix}-dms-primary"
  })
}

# DMS Replication Subnet Group in primary region
resource "aws_dms_replication_subnet_group" "primary" {
  provider = aws.primary_region
  
  replication_subnet_group_id          = "${local.name_prefix}-dms-subnet-group"
  replication_subnet_group_description = "DMS subnet group for ${var.app_name} in ${var.primary_region}"
  subnet_ids                           = data.aws_subnets.primary_private.ids
  
  tags = local.tags
}

# Security Group for DMS
resource "aws_security_group" "dms" {
  provider = aws.primary_region
  
  name        = "${local.name_prefix}-dms-sg"
  description = "Security group for DMS replication instances"
  vpc_id      = data.aws_vpc.primary.id
  
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.primary.cidr_block]
    description = "PostgreSQL access from within VPC"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(local.tags, {
    Name = "${local.name_prefix}-dms-sg"
  })
}

# DMS Source Endpoint (Primary PostgreSQL)
resource "aws_dms_endpoint" "source" {
  provider = aws.primary_region
  
  endpoint_id                 = "${local.name_prefix}-source-postgres"
  endpoint_type               = "source"
  engine_name                 = "postgres"
  server_name                 = data.aws_db_instance.primary.address
  port                        = 5432
  database_name               = var.app_name
  username                    = data.aws_ssm_parameter.db_username.value
  password                    = data.aws_ssm_parameter.db_password.value
  ssl_mode                    = "require"
  
  tags = merge(local.tags, {
    Name = "${local.name_prefix}-source-postgres"
  })
}

# DMS Target Endpoints (Replica PostgreSQL)
resource "aws_dms_endpoint" "target" {
  for_each = toset(var.replica_regions)
  
  provider = aws.primary_region
  
  endpoint_id                 = "${local.name_prefix}-target-postgres-${each.value}"
  endpoint_type               = "target"
  engine_name                 = "postgres"
  server_name                 = data.aws_db_instance.replica[each.value].address
  port                        = 5432
  database_name               = var.app_name
  username                    = data.aws_ssm_parameter.db_username.value
  password                    = data.aws_ssm_parameter.db_password.value
  ssl_mode                    = "require"
  
  tags = merge(local.tags, {
    Name = "${local.name_prefix}-target-postgres-${each.value}"
    Region = each.value
  })
}

# DMS Replication Tasks
resource "aws_dms_replication_task" "postgres_replication" {
  for_each = toset(var.replica_regions)
  
  provider = aws.primary_region
  
  replication_task_id         = "${local.name_prefix}-postgres-replication-${each.value}"
  migration_type              = "full-load-and-cdc"
  replication_instance_arn    = aws_dms_replication_instance.primary.replication_instance_arn
  source_endpoint_arn         = aws_dms_endpoint.source.endpoint_arn
  target_endpoint_arn         = aws_dms_endpoint.target[each.value].endpoint_arn
  table_mappings              = jsonencode({
    rules = [
      {
        rule-type = "selection"
        rule-id = "1"
        rule-name = "include-all-tables"
        object-locator = {
          schema-name = "%"
          table-name = "%"
        }
        rule-action = "include"
      }
    ]
  })
  
  replication_task_settings = jsonencode({
    TargetMetadata = {
      TargetSchema = ""
      SupportLobs = true
      FullLobMode = false
      LobChunkSize = 64
      LimitedSizeLobMode = true
      LobMaxSize = 32
    }
    FullLoadSettings = {
      TargetTablePrepMode = "DO_NOTHING"
      CreatePkAfterFullLoad = false
      StopTaskCachedChangesApplied = false
      StopTaskCachedChangesNotApplied = false
      MaxFullLoadSubTasks = 8
      TransactionConsistencyTimeout = 600
      CommitRate = 10000
    }
    Logging = {
      EnableLogging = true
      LogComponents = [
        {
          Id = "TRANSFORMATION"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id = "SOURCE_UNLOAD"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id = "IO"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id = "TARGET_LOAD"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id = "PERFORMANCE"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id = "SOURCE_CAPTURE"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id = "SORTER"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id = "REST_SERVER"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id = "VALIDATOR_EXT"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id = "TARGET_APPLY"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id = "TASK_MANAGER"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id = "TABLES_MANAGER"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id = "METADATA_MANAGER"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id = "FILE_FACTORY"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id = "COMMON"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id = "ADDONS"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id = "DATA_STRUCTURE"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id = "COMMUNICATION"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id = "FILE_TRANSFER"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        }
      ]
    }
    ControlTablesSettings = {
      historyTimeslotInMinutes = 5
      ControlSchema = ""
      HistoryTimeslotInMinutes = 5
      HistoryTableEnabled = true
      SuspendedTablesTableEnabled = true
      StatusTableEnabled = true
    }
    StreamBufferSettings = {
      StreamBufferCount = 3
      StreamBufferSizeInMB = 8
      CtrlStreamBufferSizeInMB = 5
    }
    ChangeProcessingDdlHandlingPolicy = {
      HandleSourceTableDropped = true
      HandleSourceTableTruncated = true
      HandleSourceTableAltered = true
    }
    ErrorBehavior = {
      DataErrorPolicy = "LOG_ERROR"
      DataTruncationErrorPolicy = "LOG_ERROR"
      DataErrorEscalationPolicy = "SUSPEND_TABLE"
      DataErrorEscalationCount = 0
      TableErrorPolicy = "SUSPEND_TABLE"
      TableErrorEscalationPolicy = "STOP_TASK"
      TableErrorEscalationCount = 0
      RecoverableErrorCount = -1
      RecoverableErrorInterval = 5
      RecoverableErrorThrottling = true
      RecoverableErrorThrottlingMax = 1800
      ApplyErrorDeletePolicy = "IGNORE_RECORD"
      ApplyErrorInsertPolicy = "LOG_ERROR"
      ApplyErrorUpdatePolicy = "LOG_ERROR"
      ApplyErrorEscalationPolicy = "LOG_ERROR"
      ApplyErrorEscalationCount = 0
      FullLoadIgnoreConflicts = true
    }
    ChangeProcessingTuning = {
      BatchApplyPreserveTransaction = true
      BatchApplyTimeoutMin = 1
      BatchApplyTimeoutMax = 30
      BatchApplyMemoryLimit = 500
      BatchSplitSize = 0
      MinTransactionSize = 1000
      CommitTimeout = 1
      MemoryLimitTotal = 1024
      MemoryKeepTime = 60
      StatementCacheSize = 50
    }
  })
  
  tags = merge(local.tags, {
    Name = "${local.name_prefix}-postgres-replication-${each.value}"
    Region = each.value
  })
}

# TimescaleDB Replication
resource "aws_dms_replication_task" "timescaledb_replication" {
  for_each = toset(var.replica_regions)
  
  provider = aws.primary_region
  
  replication_task_id         = "${local.name_prefix}-timescaledb-replication-${each.value}"
  migration_type              = "full-load-and-cdc"
  replication_instance_arn    = aws_dms_replication_instance.primary.replication_instance_arn
  source_endpoint_arn         = aws_dms_endpoint.timescaledb_source.endpoint_arn
  target_endpoint_arn         = aws_dms_endpoint.timescaledb_target[each.value].endpoint_arn
  table_mappings              = jsonencode({
    rules = [
      {
        rule-type = "selection"
        rule-id = "1"
        rule-name = "include-all-tables"
        object-locator = {
          schema-name = "%"
          table-name = "%"
        }
        rule-action = "include"
      }
    ]
  })
  
  # Similar settings as PostgreSQL replication
  replication_task_settings = jsonencode({
    TargetMetadata = {
      TargetSchema = ""
      SupportLobs = true
      FullLobMode = false
      LobChunkSize = 64
      LimitedSizeLobMode = true
      LobMaxSize = 32
    }
    FullLoadSettings = {
      TargetTablePrepMode = "DO_NOTHING"
      CreatePkAfterFullLoad = false
      StopTaskCachedChangesApplied = false
      StopTaskCachedChangesNotApplied = false
      MaxFullLoadSubTasks = 8
      TransactionConsistencyTimeout = 600
      CommitRate = 10000
    }
    Logging = {
      EnableLogging = true
    }
    ControlTablesSettings = {
      historyTimeslotInMinutes = 5
      ControlSchema = ""
      HistoryTimeslotInMinutes = 5
      HistoryTableEnabled = true
      SuspendedTablesTableEnabled = true
      StatusTableEnabled = true
    }
    StreamBufferSettings = {
      StreamBufferCount = 3
      StreamBufferSizeInMB = 8
      CtrlStreamBufferSizeInMB = 5
    }
    ChangeProcessingTuning = {
      BatchApplyPreserveTransaction = true
      BatchApplyTimeoutMin = 1
      BatchApplyTimeoutMax = 30
      BatchApplyMemoryLimit = 500
      BatchSplitSize = 0
      MinTransactionSize = 1000
      CommitTimeout = 1
      MemoryLimitTotal = 1024
      MemoryKeepTime = 60
      StatementCacheSize = 50
    }
  })
  
  tags = merge(local.tags, {
    Name = "${local.name_prefix}-timescaledb-replication-${each.value}"
    Region = each.value
  })
}

# DMS Source Endpoint (TimescaleDB)
resource "aws_dms_endpoint" "timescaledb_source" {
  provider = aws.primary_region
  
  endpoint_id                 = "${local.name_prefix}-source-timescaledb"
  endpoint_type               = "source"
  engine_name                 = "postgres"
  server_name                 = data.aws_db_instance.timescaledb_primary.address
  port                        = 5432
  database_name               = "${var.app_name}_timeseries"
  username                    = data.aws_ssm_parameter.db_username.value
  password                    = data.aws_ssm_parameter.db_password.value
  ssl_mode                    = "require"
  
  tags = merge(local.tags, {
    Name = "${local.name_prefix}-source-timescaledb"
  })
}

# DMS Target Endpoints (Replica TimescaleDB)
resource "aws_dms_endpoint" "timescaledb_target" {
  for_each = toset(var.replica_regions)
  
  provider = aws.primary_region
  
  endpoint_id                 = "${local.name_prefix}-target-timescaledb-${each.value}"
  endpoint_type               = "target"
  engine_name                 = "postgres"
  server_name                 = data.aws_db_instance.timescaledb_replica[each.value].address
  port                        = 5432
  database_name               = "${var.app_name}_timeseries"
  username                    = data.aws_ssm_parameter.db_username.value
  password                    = data.aws_ssm_parameter.db_password.value
  ssl_mode                    = "require"
  
  tags = merge(local.tags, {
    Name = "${local.name_prefix}-target-timescaledb-${each.value}"
    Region = each.value
  })
}

# Data sources to fetch existing resources
data "aws_vpc" "primary" {
  provider = aws.primary_region
  
  filter {
    name   = "tag:Name"
    values = ["${var.app_name}-${var.environment}-${var.primary_region}-vpc"]
  }
}

data "aws_subnets" "primary_private" {
  provider = aws.primary_region
  
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.primary.id]
  }
  
  filter {
    name   = "tag:Tier"
    values = ["private"]
  }
}

data "aws_db_instance" "primary" {
  provider = aws.primary_region
  db_instance_identifier = "${var.app_name}-${var.environment}-${var.primary_region}-postgres"
}

data "aws_db_instance" "replica" {
  for_each = toset(var.replica_regions)
  provider = aws.primary_region
  db_instance_identifier = "${var.app_name}-${var.environment}-${each.value}-postgres"
}

data "aws_db_instance" "timescaledb_primary" {
  provider = aws.primary_region
  db_instance_identifier = "${var.app_name}-${var.environment}-${var.primary_region}-timescaledb"
}

data "aws_db_instance" "timescaledb_replica" {
  for_each = toset(var.replica_regions)
  provider = aws.primary_region
  db_instance_identifier = "${var.app_name}-${var.environment}-${each.value}-timescaledb"
}

data "aws_ssm_parameter" "db_username" {
  provider = aws.primary_region
  name     = "/${var.app_name}/${var.environment}/database/username"
}

data "aws_ssm_parameter" "db_password" {
  provider = aws.primary_region
  name     = "/${var.app_name}/${var.environment}/database/password"
}

# Outputs
output "replication_instance_arn" {
  value = aws_dms_replication_instance.primary.replication_instance_arn
}

output "postgres_replication_task_arns" {
  value = {
    for region in var.replica_regions :
    region => aws_dms_replication_task.postgres_replication[region].replication_task_arn
  }
}

output "timescaledb_replication_task_arns" {
  value = {
    for region in var.replica_regions :
    region => aws_dms_replication_task.timescaledb_replication[region].replication_task_arn
  }
}