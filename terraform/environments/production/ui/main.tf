module "collab_ui_service" {
  source                 = "./modules"
  bucket_name            = "peerprep-production-collab-ui"
  environment            = "production"
  service_name           = "collab-ui"
  cloudfront_description = "PeerPrep Collab UI MFE"
}

module "matching_ui_service" {
  source                 = "./modules"
  bucket_name            = "peerprep-production-matching-ui"
  environment            = "production"
  service_name           = "matching-ui"
  cloudfront_description = "PeerPrep Matching UI MFE"
}

module "question_ui_service" {
  source                 = "./modules"
  bucket_name            = "peerprep-production-question-ui"
  environment            = "production"
  service_name           = "question-ui"
  cloudfront_description = "PeerPrep Question UI MFE"
}

module "user_ui_service" {
  source                 = "./modules"
  bucket_name            = "peerprep-production-user-ui"
  environment            = "production"
  service_name           = "user-ui"
  cloudfront_description = "PeerPrep User UI MFE"
}

module "history_ui_service" {
  source                 = "./modules"
  bucket_name            = "peerprep-production-history-ui"
  environment            = "production"
  service_name           = "history-ui"
  cloudfront_description = "PeerPrep History UI MFE"
}
