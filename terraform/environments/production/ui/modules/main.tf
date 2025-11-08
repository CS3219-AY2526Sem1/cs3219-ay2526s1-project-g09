resource "aws_cloudfront_distribution" "frontend_service" {
  origin {
    domain_name              = aws_s3_bucket.frontend_service.bucket_regional_domain_name
    origin_id                = aws_s3_bucket.frontend_service.id
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend_service.id
  }

  enabled         = true
  is_ipv6_enabled = true
  comment         = var.cloudfront_description

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = aws_s3_bucket.frontend_service.id
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
    Environment = var.environment
    Project     = "peerprep"
    Service     = var.service_name
  }
}

resource "aws_cloudfront_origin_access_control" "frontend_service" {
  name                              = "oac-staging-${var.service_name}-service"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_s3_bucket_policy" "allow_cloudfront_access_to_service" {
  bucket = aws_s3_bucket.frontend_service.id
  policy = data.aws_iam_policy_document.allow_cloudfront_access_to_service.json
}

data "aws_iam_policy_document" "allow_cloudfront_access_to_service" {
  statement {
    sid    = "AllowCloudFrontServicePrincipal"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    actions = ["s3:GetObject"]
    resources = [
      "${aws_s3_bucket.frontend_service.arn}/*",
    ]
    condition {
      test     = "ArnLike"
      variable = "aws:SourceArn"
      values   = [aws_cloudfront_distribution.frontend_service.arn]
    }
  }
}

resource "aws_s3_bucket" "frontend_service" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_cors_configuration" "frontend_service" {
  bucket = aws_s3_bucket.frontend_service.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag", "x-amz-meta-custom-header"]
    max_age_seconds = 3600
  }
}
