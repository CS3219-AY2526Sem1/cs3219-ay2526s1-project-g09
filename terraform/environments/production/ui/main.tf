module "collab_ui_service" {
  source                 = "./modules"
  bucket_name            = "peerprep-${var.environment}-collab-ui"
  environment            = var.environment
  service_name           = "collab-ui"
  cloudfront_description = "PeerPrep Collab UI MFE"
}

module "matching_ui_service" {
  source                 = "./modules"
  bucket_name            = "peerprep-${var.environment}-matching-ui"
  environment            = var.environment
  service_name           = "matching-ui"
  cloudfront_description = "PeerPrep Matching UI MFE"
}

module "question_ui_service" {
  source                 = "./modules"
  bucket_name            = "peerprep-${var.environment}-question-ui"
  environment            = var.environment
  service_name           = "question-ui"
  cloudfront_description = "PeerPrep Question UI MFE"
}

module "user_ui_service" {
  source                 = "./modules"
  bucket_name            = "peerprep-${var.environment}-user-ui"
  environment            = var.environment
  service_name           = "user-ui"
  cloudfront_description = "PeerPrep User UI MFE"
}

module "history_ui_service" {
  source                 = "./modules"
  bucket_name            = "peerprep-${var.environment}-history-ui"
  environment            = var.environment
  service_name           = "history-ui"
  cloudfront_description = "PeerPrep History UI MFE"
}
