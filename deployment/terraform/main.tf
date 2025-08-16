# Main Terraform configuration for multi-region deployment

terraform {
  required_version = ">= 1.0.0"
  
  backend "s3" {
    bucket         = "hedgefund-trading-terraform-state"
    key            = "global/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "hedgefund-trading-terraform-locks"
    encrypt        = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.10"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.5"
    }
  }
}

# Variables
variable "regions" {
  description = "AWS regions to deploy to"
  type        = list(string)
  default     = ["us-east-1", "eu-west-1", "ap-southeast-1"]
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "hedge-fund-trading-platform"
}

variable "domain_name" {
  description = "Base domain name for the application"
  type        = string
  default     = "hedgefund-trading.com"
}

# Provider configuration for each region
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"
}

provider "aws" {
  alias  = "ap_southeast_1"
  region = "ap-southeast-1"
}

# Global Route53 configuration
resource "aws_route53_zone" "primary" {
  provider = aws.us_east_1
  name     = var.domain_name
}

# Global CloudFront distribution for static assets
module "cloudfront_distribution" {
  source = "./modules/cloudfront"
  
  domain_name     = var.domain_name
  environment     = var.environment
  app_name        = var.app_name
  route53_zone_id = aws_route53_zone.primary.zone_id
  
  origins = {
    us_east_1 = {
      domain_name = "assets-us-east-1.${var.domain_name}"
      origin_id   = "S3-us-east-1"
    },
    eu_west_1 = {
      domain_name = "assets-eu-west-1.${var.domain_name}"
      origin_id   = "S3-eu-west-1"
    },
    ap_southeast_1 = {
      domain_name = "assets-ap-southeast-1.${var.domain_name}"
      origin_id   = "S3-ap-southeast-1"
    }
  }
}

# Global Accelerator for API endpoints
module "global_accelerator" {
  source = "./modules/global_accelerator"
  
  app_name    = var.app_name
  environment = var.environment
  
  endpoints = {
    us_east_1 = {
      region = "us-east-1"
      weight = 100
    },
    eu_west_1 = {
      region = "eu-west-1"
      weight = 100
    },
    ap_southeast_1 = {
      region = "ap-southeast-1"
      weight = 100
    }
  }
}

# Regional resources
module "us_east_1" {
  source = "./modules/regional"
  
  providers = {
    aws = aws.us_east_1
  }
  
  region      = "us-east-1"
  environment = var.environment
  app_name    = var.app_name
  domain_name = var.domain_name
  
  is_primary_region = true
  
  vpc_cidr           = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
  
  eks_cluster_version = "1.24"
  
  database_config = {
    instance_type = "db.r6g.xlarge"
    storage_gb    = 100
    multi_az      = true
  }
  
  redis_config = {
    node_type = "cache.r6g.large"
    num_nodes = 3
  }
  
  route53_zone_id = aws_route53_zone.primary.zone_id
}

module "eu_west_1" {
  source = "./modules/regional"
  
  providers = {
    aws = aws.eu_west_1
  }
  
  region      = "eu-west-1"
  environment = var.environment
  app_name    = var.app_name
  domain_name = var.domain_name
  
  is_primary_region = false
  
  vpc_cidr           = "10.1.0.0/16"
  availability_zones = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
  
  eks_cluster_version = "1.24"
  
  database_config = {
    instance_type = "db.r6g.xlarge"
    storage_gb    = 100
    multi_az      = true
  }
  
  redis_config = {
    node_type = "cache.r6g.large"
    num_nodes = 3
  }
  
  route53_zone_id = aws_route53_zone.primary.zone_id
}

module "ap_southeast_1" {
  source = "./modules/regional"
  
  providers = {
    aws = aws.ap_southeast_1
  }
  
  region      = "ap-southeast-1"
  environment = var.environment
  app_name    = var.app_name
  domain_name = var.domain_name
  
  is_primary_region = false
  
  vpc_cidr           = "10.2.0.0/16"
  availability_zones = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]
  
  eks_cluster_version = "1.24"
  
  database_config = {
    instance_type = "db.r6g.xlarge"
    storage_gb    = 100
    multi_az      = true
  }
  
  redis_config = {
    node_type = "cache.r6g.large"
    num_nodes = 3
  }
  
  route53_zone_id = aws_route53_zone.primary.zone_id
}

# Database replication configuration
module "database_replication" {
  source = "./modules/database_replication"
  
  app_name    = var.app_name
  environment = var.environment
  
  primary_region = "us-east-1"
  replica_regions = ["eu-west-1", "ap-southeast-1"]
  
  depends_on = [
    module.us_east_1,
    module.eu_west_1,
    module.ap_southeast_1
  ]
}

# Outputs
output "cloudfront_distribution_domain" {
  value = module.cloudfront_distribution.distribution_domain_name
}

output "global_accelerator_dns_name" {
  value = module.global_accelerator.dns_name
}

output "regional_api_endpoints" {
  value = {
    us_east_1      = module.us_east_1.api_endpoint
    eu_west_1      = module.eu_west_1.api_endpoint
    ap_southeast_1 = module.ap_southeast_1.api_endpoint
  }
}

output "eks_cluster_endpoints" {
  value = {
    us_east_1      = module.us_east_1.eks_cluster_endpoint
    eu_west_1      = module.eu_west_1.eks_cluster_endpoint
    ap_southeast_1 = module.ap_southeast_1.eks_cluster_endpoint
  }
}