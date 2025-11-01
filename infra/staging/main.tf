terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
  backend "s3" {
    bucket         = "terraform-state-bucket-peerprep"
    key            = "global/infra/terraform.tfstate"
    region         = "ap-southeast-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = "ap-southeast-1"
}

resource "aws_s3_bucket" "collab_ui_service" {
  bucket = "peerprep-staging-collab-ui-service"
}

resource "aws_s3_bucket_policy" "allow_cloudfront_access_to_collab_ui_service" {
  bucket = aws_s3_bucket.collab_ui_service.id
  policy = data.aws_iam_policy_document.allow_cloudfront_access.json
}

data "aws_iam_policy_document" "allow_cloudfront_access" {
  statement {
    sid    = "AllowCloudFrontServicePrincipal"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    actions = ["s3:GetObject"]
    resources = [
      "${aws_s3_bucket.collab_ui_service.arn}/*",
    ]
    condition {
      test     = "ArnLike"
      variable = "aws:SourceArn"
      values   = [aws_cloudfront_distribution.collab_ui_service.arn]
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "frontend_cors" {
  bucket = aws_s3_bucket.collab_ui_service.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag", "x-amz-meta-custom-header"]
    max_age_seconds = 3600
  }
}

resource "aws_cloudfront_origin_access_control" "default" {
  name                              = "oac-staging-collab-ui-service"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "collab_ui_service" {
  origin {
    domain_name              = aws_s3_bucket.collab_ui_service.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.collab_ui_service.id}-origin"
    origin_access_control_id = aws_cloudfront_origin_access_control.default.id
  }

  enabled         = true
  is_ipv6_enabled = true
  comment         = "PeerPrep Collab UI MFE"

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.collab_ui_service.id}-origin"
    viewer_protocol_policy = "redirect-to-https"
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    compress               = true
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  price_class = "PriceClass_All"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    name        = "peerprep-collab-ui"
    Environment = "staging"
    Project     = "peerprep"
    Service     = "collab-ui"
  }
}
