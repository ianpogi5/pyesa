###################################
# API Lambda (set builder backend)
###################################

data "archive_file" "api" {
  type        = "zip"
  source_dir  = "${path.module}/../server"
  output_path = "${path.module}/build/api.zip"
  excludes    = ["test"]
}

resource "aws_iam_role" "api" {
  name = "pyesa-api-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = {
    Environment = "Production"
    Terraform   = true
  }
}

resource "aws_iam_role_policy" "api" {
  name = "pyesa-api-lambda"
  role = aws_iam_role.api.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = [
          "${aws_s3_bucket.pyesa.arn}/files/*",
          "${aws_s3_bucket.pyesa.arn}/share/*"
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = [aws_s3_bucket.pyesa.arn]
        Condition = {
          StringLike = { "s3:prefix" = "files/*" }
        }
      },
      {
        Effect   = "Allow"
        Action   = ["cloudfront:CreateInvalidation", "cloudfront:ListDistributions"]
        Resource = ["*"]
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = ["arn:aws:logs:*:*:*"]
      }
    ]
  })
}

resource "aws_lambda_function" "api" {
  function_name    = "pyesa-api"
  role             = aws_iam_role.api.arn
  runtime          = "nodejs22.x"
  handler          = "index.handler"
  filename         = data.archive_file.api.output_path
  source_code_hash = data.archive_file.api.output_base64sha256
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      S3_BUCKET = aws_s3_bucket.pyesa.id
      PASSCODE  = var.API_PASSCODE
      DOMAIN    = var.DOMAIN
    }
  }

  tags = {
    Environment = "Production"
    Terraform   = true
  }
}

resource "aws_lambda_function_url" "api" {
  function_name      = aws_lambda_function.api.function_name
  authorization_type = "NONE"
}

resource "aws_lambda_permission" "api_url" {
  statement_id           = "AllowPublicFunctionUrl"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.api.function_name
  principal              = "*"
  function_url_auth_type = "NONE"
}

# Managed CloudFront policies for the /api/* behavior
data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "all_viewer_except_host" {
  name = "Managed-AllViewerExceptHostHeader"
}
