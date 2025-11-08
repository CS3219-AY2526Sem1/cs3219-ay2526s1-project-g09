variable "bucket_name" { type = string } # Example: "peerprep-production-collab-ui" 
variable "environment" { type = string }
variable "service_name" { type = string } # Example: "collab-ui"
variable "cloudfront_description" {
  type = string # Example: "PeerPrep Collab UI MFE"
}
