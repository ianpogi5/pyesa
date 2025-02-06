output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.pyesa.domain_name
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.pyesa.id
}

output "s3_bucket_arn" {
  value = aws_s3_bucket.pyesa.arn
}

output "s3_bucket_name" {
  value = aws_s3_bucket.pyesa.id
}

resource "local_file" "cloudfront_distribution_id" {
    content  = aws_cloudfront_distribution.pyesa.id
    filename = "distribution_id.txt"
}
