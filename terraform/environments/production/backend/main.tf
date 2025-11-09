module "elastic_beanstalk_iam" {
  source     = "../../../iam/elastic_beanstalk"
  account_id = var.account_id
}

module "backend_service_cloudfront" {
  source                  = "./cloudfront"
  eb_collab_service_url   = module.collab_service_elastic_beanstalk.elastic_beanstalk_url
  eb_matching_service_url = module.matching_service_elastic_beanstalk.elastic_beanstalk_url
  eb_user_service_url     = module.user_service_elastic_beanstalk.elastic_beanstalk_url
  eb_question_service_url = module.question_service_elastic_beanstalk.elastic_beanstalk_url
  eb_chat_service_url     = module.chat_service_elastic_beanstalk.elastic_beanstalk_url
  eb_history_service_url  = module.history_service_elastic_beanstalk.elastic_beanstalk_url
  environment             = var.environment
}

module "collab_service_elastic_beanstalk" {
  source                              = "./elastic_beanstalk"
  service_name                        = "collab-service"
  service_description                 = "Collab Backend Service"
  elastic_beanstalk_service_role_name = module.elastic_beanstalk_iam.elastic_beanstalk_service_role_name
  environment                         = var.environment
}

module "matching_service_elastic_beanstalk" {
  source                              = "./elastic_beanstalk"
  service_name                        = "matching-service"
  service_description                 = "Matching Backend Service"
  elastic_beanstalk_service_role_name = module.elastic_beanstalk_iam.elastic_beanstalk_service_role_name
  environment                         = var.environment
}

module "user_service_elastic_beanstalk" {
  source                              = "./elastic_beanstalk"
  service_name                        = "user-service"
  service_description                 = "User Backend Service"
  elastic_beanstalk_service_role_name = module.elastic_beanstalk_iam.elastic_beanstalk_service_role_name
  environment                         = var.environment
}

module "question_service_elastic_beanstalk" {
  source                              = "./elastic_beanstalk"
  service_name                        = "question-service"
  service_description                 = "Question Backend Service"
  elastic_beanstalk_service_role_name = module.elastic_beanstalk_iam.elastic_beanstalk_service_role_name
  environment                         = var.environment
}

module "chat_service_elastic_beanstalk" {
  source                              = "./elastic_beanstalk"
  service_name                        = "chat-service"
  service_description                 = "Chat Backend Service"
  elastic_beanstalk_service_role_name = module.elastic_beanstalk_iam.elastic_beanstalk_service_role_name
  environment                         = var.environment
}

module "history_service_elastic_beanstalk" {
  source                              = "./elastic_beanstalk"
  service_name                        = "history-service"
  service_description                 = "History Backend Service"
  elastic_beanstalk_service_role_name = module.elastic_beanstalk_iam.elastic_beanstalk_service_role_name
  environment                         = var.environment
}


module "matching_service_elastic_cache" {
  source                    = "./elastic_cache"
  service_name              = "matching-service"
  elastic_cache_description = "Matching Service Cache"
}
