module "collab_ui_service" {
  source                 = "./modules"
  bucket_name            = "peerprep-staging-collab-ui"
  environment            = "staging"
  service_name           = "collab-ui"
  cloudfront_description = "PeerPrep Collab UI MFE"
}

module "matching_ui_service" {
  source                 = "./modules"
  bucket_name            = "peerprep-staging-matching-ui"
  environment            = "staging"
  service_name           = "matching-ui"
  cloudfront_description = "PeerPrep Matching UI MFE"
}

module "question_ui_service" {
  source                 = "./modules"
  bucket_name            = "peerprep-staging-question-ui"
  environment            = "staging"
  service_name           = "question-ui"
  cloudfront_description = "PeerPrep Question UI MFE"
}

module "user_ui_service" {
  source                 = "./modules"
  bucket_name            = "peerprep-staging-user-ui"
  environment            = "staging"
  service_name           = "user-ui"
  cloudfront_description = "PeerPrep User UI MFE"
}

module "history_ui_service" {
  source                 = "./modules"
  bucket_name            = "peerprep-staging-history-ui"
  environment            = "staging"
  service_name           = "history-ui"
  cloudfront_description = "PeerPrep History UI MFE"
}
