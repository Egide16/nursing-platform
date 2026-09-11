terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  # Uncomment and configure before your first `terraform init` if you want
  # remote state (recommended for anything beyond a personal sandbox).
  # State holds the DB password and other secrets, so it should never be
  # committed to Git and ideally lives in an encrypted S3 bucket with a
  # DynamoDB table for locking.
  #
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket"
  #   key            = "nursing-platform/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "terraform-locks"
  #   encrypt        = true
  # }
}
