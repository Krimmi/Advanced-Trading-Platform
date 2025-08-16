# Regional infrastructure module

variable "region" {
  description = "AWS region"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
}

variable "domain_name" {
  description = "Base domain name for the application"
  type        = string
}

variable "is_primary_region" {
  description = "Whether this is the primary region"
  type        = bool
  default     = false
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones to use"
  type        = list(string)
}

variable "eks_cluster_version" {
  description = "Kubernetes version for the EKS cluster"
  type        = string
}

variable "database_config" {
  description = "Configuration for the database"
  type = object({
    instance_type = string
    storage_gb    = number
    multi_az      = bool
  })
}

variable "redis_config" {
  description = "Configuration for Redis"
  type = object({
    node_type = string
    num_nodes = number
  })
}

variable "route53_zone_id" {
  description = "Route53 zone ID for DNS records"
  type        = string
}

locals {
  name_prefix = "${var.app_name}-${var.environment}-${var.region}"
  tags = {
    Environment = var.environment
    Region      = var.region
    Application = var.app_name
    ManagedBy   = "terraform"
  }
}

# VPC and networking
module "vpc" {
  source = "../vpc"
  
  region             = var.region
  environment        = var.environment
  app_name           = var.app_name
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  
  tags = local.tags
}

# EKS cluster
module "eks" {
  source = "../eks"
  
  region             = var.region
  environment        = var.environment
  app_name           = var.app_name
  cluster_version    = var.eks_cluster_version
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  
  node_groups = {
    general = {
      desired_capacity = 3
      min_capacity     = 2
      max_capacity     = 10
      instance_types   = ["m5.large", "m5a.large"]
      disk_size        = 50
    },
    compute = {
      desired_capacity = 2
      min_capacity     = 1
      max_capacity     = 10
      instance_types   = ["c5.xlarge", "c5a.xlarge"]
      disk_size        = 50
      taints = [
        {
          key    = "workload"
          value  = "compute"
          effect = "NO_SCHEDULE"
        }
      ]
    }
  }
  
  tags = local.tags
}

# RDS PostgreSQL database
module "postgres" {
  source = "../postgres"
  
  region             = var.region
  environment        = var.environment
  app_name           = var.app_name
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.database_subnet_ids
  instance_type      = var.database_config.instance_type
  storage_gb         = var.database_config.storage_gb
  multi_az           = var.database_config.multi_az
  is_primary_region  = var.is_primary_region
  
  tags = local.tags
}

# TimescaleDB
module "timescaledb" {
  source = "../timescaledb"
  
  region             = var.region
  environment        = var.environment
  app_name           = var.app_name
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.database_subnet_ids
  instance_type      = var.database_config.instance_type
  storage_gb         = var.database_config.storage_gb
  multi_az           = var.database_config.multi_az
  is_primary_region  = var.is_primary_region
  
  tags = local.tags
}

# ElastiCache Redis
module "redis" {
  source = "../redis"
  
  region             = var.region
  environment        = var.environment
  app_name           = var.app_name
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.database_subnet_ids
  node_type          = var.redis_config.node_type
  num_nodes          = var.redis_config.num_nodes
  
  tags = local.tags
}

# S3 bucket for static assets
resource "aws_s3_bucket" "assets" {
  bucket = "assets-${var.region}.${var.domain_name}"
  
  tags = local.tags
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket = aws_s3_bucket.assets.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "assets" {
  bucket = aws_s3_bucket.assets.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = {
          AWS = "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity"
        }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.assets.arn}/*"
      }
    ]
  })
}

# Regional API Gateway
resource "aws_api_gateway_rest_api" "regional_api" {
  name        = "${local.name_prefix}-api"
  description = "Regional API Gateway for ${var.app_name} in ${var.region}"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  
  tags = local.tags
}

# Route53 record for regional API
resource "aws_route53_record" "api" {
  zone_id = var.route53_zone_id
  name    = "api-${var.region == "us-east-1" ? "us" : var.region == "eu-west-1" ? "eu" : "ap"}.${var.domain_name}"
  type    = "A"
  
  alias {
    name                   = aws_api_gateway_rest_api.regional_api.regional_domain_name
    zone_id                = aws_api_gateway_rest_api.regional_api.regional_zone_id
    evaluate_target_health = true
  }
}

# Route53 record for regional WebSocket
resource "aws_route53_record" "websocket" {
  zone_id = var.route53_zone_id
  name    = "ws-${var.region == "us-east-1" ? "us" : var.region == "eu-west-1" ? "eu" : "ap"}.${var.domain_name}"
  type    = "A"
  
  alias {
    name                   = aws_api_gateway_rest_api.regional_api.regional_domain_name
    zone_id                = aws_api_gateway_rest_api.regional_api.regional_zone_id
    evaluate_target_health = true
  }
}

# Outputs
output "vpc_id" {
  value = module.vpc.vpc_id
}

output "private_subnet_ids" {
  value = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  value = module.vpc.public_subnet_ids
}

output "database_subnet_ids" {
  value = module.vpc.database_subnet_ids
}

output "eks_cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "eks_cluster_name" {
  value = module.eks.cluster_name
}

output "postgres_endpoint" {
  value = module.postgres.endpoint
}

output "timescaledb_endpoint" {
  value = module.timescaledb.endpoint
}

output "redis_endpoint" {
  value = module.redis.endpoint
}

output "assets_bucket_name" {
  value = aws_s3_bucket.assets.bucket
}

output "api_endpoint" {
  value = "https://${aws_route53_record.api.name}"
}

output "websocket_endpoint" {
  value = "wss://${aws_route53_record.websocket.name}"
}