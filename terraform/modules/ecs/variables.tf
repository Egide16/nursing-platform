variable "project_name" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "security_group_id" {
  description = "Security group to attach to ECS tasks (created at root, shared with the RDS ingress rule)."
  type        = string
}

variable "ecr_repository_url" {
  type = string
}

variable "image_tag" {
  type = string
}

variable "container_port" {
  type = number
}

variable "domain_name" {
  type = string
}

variable "database_url_secret_arn" {
  type = string
}

variable "target_group_arn" {
  type = string
}

variable "app_cpu" {
  type = number
}

variable "app_memory" {
  type = number
}

variable "desired_count" {
  type = number
}

variable "min_capacity" {
  type = number
}

variable "max_capacity" {
  type = number
}
