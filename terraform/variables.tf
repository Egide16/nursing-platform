variable "project_name" {
  description = "Short name used to prefix all resources."
  type        = string
  default     = "nursing-platform"
}

variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Full hostname the app will be served on, e.g. training.meridian-nc.com"
  type        = string
}

variable "route53_zone_name" {
  description = "The Route 53 hosted zone that already exists for your domain, e.g. meridian-nc.com"
  type        = string
}

variable "container_port" {
  description = "Port the Next.js container listens on."
  type        = number
  default     = 3000
}

variable "image_tag" {
  description = "Tag of the image in ECR to deploy. CI pushes a new tag and updates this via -var or a tfvars change."
  type        = string
  default     = "latest"
}

# --- Database ---------------------------------------------------------

variable "db_name" {
  type    = string
  default = "nursing_platform"
}

variable "db_username" {
  type    = string
  default = "app_user"
}

variable "db_instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "db_allocated_storage" {
  type    = number
  default = 20
}

variable "db_engine_version" {
  description = "Postgres major.minor version."
  type        = string
  default     = "16.4"
}

# --- ECS / Fargate sizing ----------------------------------------------

variable "app_cpu" {
  description = "Fargate task vCPU units (256 = .25 vCPU)."
  type        = number
  default     = 512
}

variable "app_memory" {
  description = "Fargate task memory in MB."
  type        = number
  default     = 1024
}

variable "desired_count" {
  type    = number
  default = 2
}

variable "min_capacity" {
  type    = number
  default = 1
}

variable "max_capacity" {
  type    = number
  default = 4
}

# --- CI/CD (optional) ---------------------------------------------------

variable "github_repos" {
  description = "GitHub repos in \"org/name\" form allowed to assume the CI role — e.g. both your app repo (deploy.yml) and this infra repo (terraform.yml). Leave empty to skip creating the OIDC role."
  type        = list(string)
  default     = []
}
