variable "project_name" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "container_port" {
  type = number
}

variable "domain_name" {
  description = "Full hostname the app is served on."
  type        = string
}

variable "route53_zone_name" {
  description = "Existing Route 53 hosted zone name, e.g. meridian-nc.com"
  type        = string
}
