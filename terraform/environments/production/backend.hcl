bucket         = "terraform-state-peerprep"
key            = "production/terraform.tfstate"
region         = "ap-southeast-1"
dynamodb_table = "terraform-locks"
encrypt        = true
