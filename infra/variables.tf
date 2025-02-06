variable "REGION" {
  type        = string
  description = "AWS Region"
}

variable "AWS_ACCOUNT_ID" {
  type        = string
  description = "AWS Account ID"
}

variable "AWS_USER" {
  type        = string
  description = "AWS User"
}

variable "SSL_CERT_ARN" {
  type        = string
  description = "SSL certificate ARN"
}

variable "DOMAIN" {
  type        = string
  default     = "pyesa.kdc.sh"
  description = "Alias domain for CloudFront distribution"
}

variable "S3_BUCKET" {
  type        = string
  description = ""
}
