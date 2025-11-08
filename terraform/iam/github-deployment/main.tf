# IAM User for GitHub Actions to deploy to AWS
# To get the access key and secret key, create them in the AWS console after applying this terraform

resource "aws_iam_user" "gha_deployer_staging" {
  name = "PeerPrepDeployUser"
}

resource "aws_iam_user_policy_attachment" "elastic_beanstalk_admin" {
  user       = aws_iam_user.gha_deployer_staging.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess-AWSElasticBeanstalk"
}
resource "aws_iam_user_policy_attachment" "cloudfront_full" {
  user       = aws_iam_user.gha_deployer_staging.name
  policy_arn = "arn:aws:iam::aws:policy/CloudFrontFullAccess"
}
resource "aws_iam_user_policy_attachment" "secretsmanager_rw" {
  user       = aws_iam_user.gha_deployer_staging.name
  policy_arn = "arn:aws:iam::aws:policy/SecretsManagerReadWrite"
}
resource "aws_iam_user_policy_attachment" "s3_github_workflow_perms" {
  user       = aws_iam_user.gha_deployer_staging.name
  policy_arn = aws_iam_policy.s3_github_workflow_perms.arn
}

resource "aws_iam_policy" "s3_github_workflow_perms" {
  name        = "S3GithubWorkflowPerms"
  description = "Policy to allow GitHub Actions workflow to deploy to S3 buckets"
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Action" : [
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ],
        "Resource" : [
          "arn:aws:s3:::peerprep-user-ui-service",
          "arn:aws:s3:::peerprep-user-ui-service/*",
          "arn:aws:s3:::peerprep-question-ui-service",
          "arn:aws:s3:::peerprep-question-ui-service/*",
          "arn:aws:s3:::peerprep-matching-ui-service",
          "arn:aws:s3:::peerprep-matching-ui-service/*",
          "arn:aws:s3:::peerprep-history-ui-service",
          "arn:aws:s3:::peerprep-history-ui-service/*",
          "arn:aws:s3:::peerprep-collab-ui-service",
          "arn:aws:s3:::peerprep-collab-ui-service/*",
          "arn:aws:s3:::peerprep-ui-shell",
          "arn:aws:s3:::peerprep-ui-shell/*"
        ]
      }
    ]
  })
}
