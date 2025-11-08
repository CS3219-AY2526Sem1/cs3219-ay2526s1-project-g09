resource "aws_elastic_beanstalk_application" "backend_service" {
  name        = "peerprep-staging-${var.service_name}"
  description = var.service_description
}

resource "aws_elastic_beanstalk_environment" "backend_service" {
  name                = "peerprep-staging-${var.service_name}"
  application         = aws_elastic_beanstalk_application.backend_service.name
  solution_stack_name = "64bit Amazon Linux 2 v4.3.3 running Docker"

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "IamInstanceProfile"
    value     = "aws-elasticbeanstalk-ec2-role"
  }
  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "ServiceRole"
    value     = var.elastic_beanstalk_service_role_name
  }

  # ------------------
  # Load balancer type
  # ------------------
  # application = ALB (recommended); classic = ELB classic; network = NLB
  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "LoadBalancerType"
    value     = "application"
  }

  # ------------------
  # Capacity / ASG
  # ------------------
  setting {
    namespace = "aws:autoscaling:asg"
    name      = "MinSize"
    value     = 1
  }
  setting {
    namespace = "aws:autoscaling:asg"
    name      = "MaxSize"
    value     = 2
  }

  # ------------------
  # Health / Proc
  # ------------------
  # Healthcheck URL for your container (adjust path)
  setting {
    namespace = "aws:elasticbeanstalk:application"
    name      = "Application Healthcheck URL"
    value     = "/api/v1/collab-service/health"
  }

  setting {
    namespace = "aws:elasticbeanstalk:environment:process:default"
    name      = "Port"
    value     = 80
  }
  setting {
    namespace = "aws:elasticbeanstalk:environment:process:default"
    name      = "HealthCheckPath"
    value     = "/api/v1/collab-service/health"
  }

  # ------------------
  # Deployment settings
  # ------------------

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DeploymentPolicy"
    value     = "Traffic splitting"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "BatchSizeType"
    value     = "Percentage"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DeploymentBatchSize"
    value     = "100"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "TrafficSplit"
    value     = "100"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "TrafficSplittingEvaluationTime"
    value     = "5"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "RollingUpdateType"
    value     = "Rolling based on Health"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "BatchSize"
    value     = "1"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "MinimumCapacity"
    value     = "1"
  }

  # ------------------
  # Logs & rolling updates
  # ------------------
  # setting {
  #   namespace = "aws:elasticbeanstalk:hostmanager"
  #   name      = "LogPublicationControl"
  #   value     = "true"
  # }

  setting {
    namespace = "aws:elasticbeanstalk:command"
    name      = "DeploymentPolicy"
    value     = "RollingWithAdditionalBatch"
  }
}
