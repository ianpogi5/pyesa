terraform {
  required_version = ">= 0.11.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = "${var.REGION}"
}

###################################
# CloudFront Origin Access Identity
###################################
resource "aws_cloudfront_origin_access_identity" pyesa {
  comment = "pyesa"
}

###################################
# S3 IAM Policy Document
###################################
data "aws_iam_policy_document" "read_pyesa_bucket" {
  statement {
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions = [
      "s3:GetObject"
    ]

    resources = [
      aws_s3_bucket.pyesa.arn,
      "${aws_s3_bucket.pyesa.arn}/*"
    ]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.pyesa.arn]
    }
  }
}

###################################
# S3
###################################
resource "aws_s3_bucket" "pyesa" {
  bucket = "${var.S3_BUCKET}"

  tags = {
    Environment = "Production"
    Terraform   = true
  }
}

###################################
# S3 Bucket Policy
###################################
resource "aws_s3_bucket_policy" "read_pyesa" {
  bucket = aws_s3_bucket.pyesa.id
  policy = data.aws_iam_policy_document.read_pyesa_bucket.json
}

###################################
# S3 Bucket Public Access Block
###################################
resource "aws_s3_bucket_public_access_block" "pyesa" {
  bucket = aws_s3_bucket.pyesa.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

###################################
# S3 Bucket Ownership Controls
###################################
resource "aws_s3_bucket_ownership_controls" "pyesa" {
  bucket = aws_s3_bucket.pyesa.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

###################################
# S3 Bucket ACL
###################################
resource "aws_s3_bucket_acl" "pyesa" {
  depends_on = [aws_s3_bucket_ownership_controls.pyesa]

  bucket = aws_s3_bucket.pyesa.id
  acl    = "private"
}

resource "aws_cloudfront_origin_access_control" "pyesa" {
  name                              = "${replace(var.DOMAIN, ".", "-")}"
  description                       = "pyesa Policy for ${var.DOMAIN}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

###################################
# CloudFront
###################################
resource "aws_cloudfront_distribution" "pyesa" {
  enabled             = true
  default_root_object = "index.html"
  aliases             = ["${var.DOMAIN}"]
  depends_on          = [aws_s3_bucket.pyesa, aws_s3_bucket_acl.pyesa]

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = aws_s3_bucket.pyesa.bucket
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400

    forwarded_values {
      query_string = true

      cookies {
        forward = "none"
      }
    }
    # response_headers_policy_id = "19955003-7f85-47c7-ad66-e98bfa653b6f"
  }

  ordered_cache_behavior {
    path_pattern     = "/index.html"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = aws_s3_bucket.pyesa.bucket

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
    # response_headers_policy_id = "19955003-7f85-47c7-ad66-e98bfa653b6f"
  }

  # API Lambda routing (set builder backend)
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    target_origin_id       = "ApiLambdaOrigin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
  }

  origin {
    domain_name = aws_s3_bucket.pyesa.bucket_regional_domain_name
    origin_id   = aws_s3_bucket.pyesa.bucket
    origin_access_control_id = aws_cloudfront_origin_access_control.pyesa.id
  }

  origin {
    # Lambda Function URL: strip scheme and trailing slash to get the domain
    domain_name = trimsuffix(trimprefix(aws_lambda_function_url.api.function_url, "https://"), "/")
    origin_id   = "ApiLambdaOrigin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = var.SSL_CERT_ARN
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  custom_error_response {
    error_caching_min_ttl = 300
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
  }

  custom_error_response {
    error_caching_min_ttl = 300
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
  }

  logging_config {
    bucket         = "${aws_s3_bucket.pyesa.id}.s3.amazonaws.com"
    include_cookies = false
    prefix         = "logs/"
  }

  tags = {
    Environment = "Production"
    Terraform   = true
  }
}