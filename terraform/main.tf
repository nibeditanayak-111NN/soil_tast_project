# Terraform configuration for AWS Deployment
# Note: This is a foundational configuration. In production, use remote state and proper IAM roles.

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# ─────────────────────────────────────────────────────────────────────────────
# 1. Image Storage (S3)
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_s3_bucket" "image_storage" {
  bucket = "soil-health-images-prod-${random_id.suffix.hex}"
}

resource "random_id" "suffix" {
  byte_length = 4
}

# ─────────────────────────────────────────────────────────────────────────────
# 2. Frontend Hosting (S3 + CloudFront)
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_s3_bucket" "frontend_hosting" {
  bucket = "soil-health-pwa-prod-${random_id.suffix.hex}"
}

resource "aws_s3_bucket_website_configuration" "frontend_hosting" {
  bucket = aws_s3_bucket.frontend_hosting.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html" # For SPA routing
  }
}

resource "aws_cloudfront_distribution" "frontend_cdn" {
  origin {
    domain_name = aws_s3_bucket.frontend_hosting.bucket_regional_domain_name
    origin_id   = "S3Origin"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3Origin"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# 3. Backend Hosting (AWS App Runner / ECR)
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_ecr_repository" "backend_repo" {
  name                 = "soil-health-backend"
  image_tag_mutability = "MUTABLE"
}

# (AWS App Runner service would be defined here once the image is pushed)
