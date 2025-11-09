resource "aws_s3_bucket_policy" "allow_cloudfront_access_to_ui_shell" {
  bucket = aws_s3_bucket.ui_shell.id
  policy = data.aws_iam_policy_document.allow_cloudfront_access_to_ui_shell.json
}

data "aws_iam_policy_document" "allow_cloudfront_access_to_ui_shell" {
  statement {
    sid    = "AllowCloudFrontServicePrincipal"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    actions = ["s3:GetObject"]
    resources = [
      "${aws_s3_bucket.ui_shell.arn}/*",
    ]
    condition {
      test     = "ArnLike"
      variable = "aws:SourceArn"
      values   = [aws_cloudfront_distribution.ui_shell.arn]
    }
  }
}

resource "aws_s3_bucket" "ui_shell" {
  bucket = "peerprep-${var.environment}-ui-shell"
}

# CloudFront configuration for UI Shell
resource "aws_cloudfront_origin_access_control" "ui_shell" {
  name                              = "oac-${var.environment}-ui-shell"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "ui_shell" {
  origin {
    domain_name              = aws_s3_bucket.ui_shell.bucket_regional_domain_name
    origin_id                = aws_s3_bucket.ui_shell.id
    origin_access_control_id = aws_cloudfront_origin_access_control.ui_shell.id
  }

  enabled         = true
  is_ipv6_enabled = true
  comment         = "PeerPrep UI Shell"

  default_cache_behavior {
    allowed_methods = [
      "GET",
      "HEAD",
      "OPTIONS",
      "PUT",
      "POST",
      "PATCH",
      "DELETE"
    ]
    cached_methods           = ["GET", "HEAD", "OPTIONS"]
    target_origin_id         = aws_s3_bucket.ui_shell.id
    viewer_protocol_policy   = "redirect-to-https"
    cache_policy_id          = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    compress                 = true
    origin_request_policy_id = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf"
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

  custom_error_response {
    error_code            = 403
    response_page_path    = "/index.html"
    response_code         = 200
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_page_path    = "/index.html"
    response_code         = 200
    error_caching_min_ttl = 10
  }

  tags = {
    Name        = "peerprep-ui-shell"
    Environment = var.environment
    Project     = "peerprep"
    Service     = "ui-shell"
  }
}
