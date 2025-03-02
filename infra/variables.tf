variable "REGION" {
  type        = string
  description = "AWS Region"
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

variable "API_DOMAIN" {
  type        = string
  description = ""
}
